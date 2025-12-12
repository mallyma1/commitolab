import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import https from "node:https";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { insertCommitmentSchema, insertCheckInSchema } from "@shared/schema";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { getTwilioClient, getTwilioFromPhoneNumber } from "./twilioClient";
import { openai } from "./openaiClient";
import { buildCommitoSystemPrompt } from "./llm/systemPrompt";
import { buildFallbackCoachingResponse } from "./llm/responseBuilder";
import {
  validateCommitoResponse,
  type CommitoAiResponseContract,
} from "./llm/contract";
import {
  suggestionsRequestSchema,
  commitmentHelpRequestSchema,
} from "./llm/requestSchemas";
import type {
  OnboardingPayload,
  HabitProfileSummary,
  CommitmentRecommendation,
} from "../shared/onboardingTypes";

function httpsGet(
  url: string,
  headers?: Record<string, string>,
): Promise<{ ok: boolean; status: number; json: () => Promise<any> }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      headers: headers || {},
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          ok: res.statusCode
            ? res.statusCode >= 200 && res.statusCode < 300
            : false,
          status: res.statusCode || 500,
          json: () => {
            try {
              if (!data || data.trim() === "") {
                return Promise.reject(new Error("Empty response body"));
              }
              return Promise.resolve(JSON.parse(data));
            } catch {
              return Promise.reject(
                new Error(`Invalid JSON response: ${data.substring(0, 100)}`),
              );
            }
          },
        });
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function validateAppleIdentityToken(
  identityToken: string,
  _bundleId?: string,
): { valid: boolean; payload?: any; error?: string } {
  try {
    const parts = identityToken.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Invalid token format" };
    }

    const payload = JSON.parse(decodeBase64Url(parts[1]));

    if (payload.iss !== "https://appleid.apple.com") {
      return { valid: false, error: "Invalid token issuer" };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token has expired" };
    }

    if (payload.iat && payload.iat > now + 300) {
      return { valid: false, error: "Token issued in the future" };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Failed to parse token" };
  }
}

const phoneVerificationCodes = new Map<
  string,
  { code: string; expiresAt: number }
>();

function buildDefaultCommitmentTitle(
  identity: string,
  goalCategory: string,
): string {
  const base =
    goalCategory === "custom" ? "My streak" : goalCategory.replace("_", " ");
  const capitalizedBase = base.charAt(0).toUpperCase() + base.slice(1);

  switch (identity) {
    case "athlete":
      return `${capitalizedBase} with athlete-level discipline`;
    case "focused_creative":
      return `${capitalizedBase} with focused deep work`;
    case "disciplined_builder":
      return `${capitalizedBase} with consistent execution`;
    case "balanced_mind":
      return `${capitalizedBase} for a calmer mind`;
    default:
      return `${capitalizedBase} every day`;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function getSessionUserId(req: Request): string | undefined {
  const sessionId = req.headers["x-session-id"] as string;
  return sessionId || undefined;
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, onboarding } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      let user = await storage.getUserByEmail(email);
      const isNewUser = !user;

      if (!user) {
        user = await storage.createUser({ email });
      }

      if (isNewUser && onboarding) {
        const {
          identityArchetype,
          primaryGoalCategory,
          primaryGoalReason,
          preferredCadence,
          selectedRecommendations,
        } = onboarding;

        user = await storage.updateUserOnboarding(user.id, {
          identityArchetype,
          primaryGoalCategory,
          primaryGoalReason,
          preferredCadence,
        });

        const today = new Date().toISOString().slice(0, 10);
        const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        if (
          selectedRecommendations &&
          Array.isArray(selectedRecommendations) &&
          selectedRecommendations.length > 0
        ) {
          for (const rec of selectedRecommendations) {
            try {
              await storage.createCommitment(user!.id, {
                title: rec.title || "My streak",
                category: rec.category || "fitness",
                cadence: rec.cadence || "daily",
                startDate: today,
                endDate: threeMonthsLater,
              });
            } catch (commitmentError) {
              console.error(
                "Error creating commitment from recommendation:",
                commitmentError,
              );
            }
          }
        } else {
          const commitmentTitle = buildDefaultCommitmentTitle(
            identityArchetype,
            primaryGoalCategory,
          );
          try {
            await storage.createCommitment(user!.id, {
              title: commitmentTitle,
              category: primaryGoalCategory || "fitness",
              cadence: preferredCadence || "daily",
              startDate: today,
              endDate: threeMonthsLater,
            });
          } catch (commitmentError) {
            console.error(
              "Error creating initial commitment:",
              commitmentError,
            );
          }
        }
      }

      return res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/phone/send-code", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      let formattedPhone: string;
      if (phoneNumber.startsWith("+")) {
        formattedPhone = phoneNumber.replace(/[^\d+]/g, "");
      } else {
        const cleanPhone = phoneNumber.replace(/\D/g, "");
        if (cleanPhone.length < 10) {
          return res.status(400).json({ error: "Invalid phone number" });
        }
        formattedPhone = cleanPhone.startsWith("1")
          ? `+${cleanPhone}`
          : `+1${cleanPhone}`;
      }

      if (formattedPhone.length < 11) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      phoneVerificationCodes.set(formattedPhone, { code, expiresAt });

      try {
        const twilioClient = await getTwilioClient();
        const fromNumber = await getTwilioFromPhoneNumber();

        await twilioClient.messages.create({
          body: `Your StreakProof verification code is: ${code}`,
          from: fromNumber,
          to: formattedPhone,
        });

        return res.json({ success: true, message: "Verification code sent" });
      } catch (twilioError) {
        console.error("Twilio error:", twilioError);
        return res
          .status(500)
          .json({ error: "Failed to send verification code" });
      }
    } catch (error) {
      console.error("Send code error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/phone/verify", async (req, res) => {
    try {
      const { phoneNumber, code, onboarding } = req.body;
      if (!phoneNumber || !code) {
        return res
          .status(400)
          .json({ error: "Phone number and code are required" });
      }

      let formattedPhone: string;
      if (phoneNumber.startsWith("+")) {
        formattedPhone = phoneNumber.replace(/[^\d+]/g, "");
      } else {
        const cleanPhone = phoneNumber.replace(/\D/g, "");
        formattedPhone = cleanPhone.startsWith("1")
          ? `+${cleanPhone}`
          : `+1${cleanPhone}`;
      }

      const stored = phoneVerificationCodes.get(formattedPhone);
      if (!stored) {
        return res.status(400).json({
          error: "No verification code found. Please request a new code.",
        });
      }

      if (Date.now() > stored.expiresAt) {
        phoneVerificationCodes.delete(formattedPhone);
        return res.status(400).json({
          error: "Verification code expired. Please request a new code.",
        });
      }

      if (stored.code !== code) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      phoneVerificationCodes.delete(formattedPhone);

      let user = await storage.getUserByPhone(formattedPhone);
      const isNewUser = !user;

      if (!user) {
        user = await storage.createUser({ phone: formattedPhone });
      }

      if (isNewUser && onboarding) {
        const {
          identityArchetype,
          primaryGoalCategory,
          primaryGoalReason,
          preferredCadence,
        } = onboarding;

        user = await storage.updateUserOnboarding(user.id, {
          identityArchetype,
          primaryGoalCategory,
          primaryGoalReason,
          preferredCadence,
        });

        const today = new Date().toISOString().slice(0, 10);
        const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        const commitmentTitle = buildDefaultCommitmentTitle(
          identityArchetype,
          primaryGoalCategory,
        );

        try {
          await storage.createCommitment(user!.id, {
            title: commitmentTitle,
            category: primaryGoalCategory || "fitness",
            cadence: preferredCadence || "daily",
            startDate: today,
            endDate: threeMonthsLater,
          });
        } catch (commitmentError) {
          console.error("Error creating initial commitment:", commitmentError);
        }
      }

      return res.json({ user });
    } catch (error) {
      console.error("Verify code error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { accessToken, onboarding } = req.body;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }

      const googleUserResponse = await httpsGet(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          Authorization: `Bearer ${accessToken}`,
        },
      );

      if (!googleUserResponse.ok) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      const googleUser = (await googleUserResponse.json()) as {
        id: string;
        email: string;
        name?: string;
        picture?: string;
        verified_email?: boolean;
      };

      if (googleUser.verified_email === false) {
        return res.status(400).json({ error: "Google email not verified" });
      }

      if (!googleUser.email) {
        return res
          .status(400)
          .json({ error: "Could not retrieve email from Google" });
      }

      let user = await storage.getUserByEmail(googleUser.email);
      const isNewUser = !user;

      if (!user) {
        user = await storage.createUser({
          email: googleUser.email,
          displayName: googleUser.name || null,
        });
      }

      if (isNewUser && onboarding) {
        const {
          identityArchetype,
          primaryGoalCategory,
          primaryGoalReason,
          preferredCadence,
        } = onboarding;

        user = await storage.updateUserOnboarding(user.id, {
          identityArchetype,
          primaryGoalCategory,
          primaryGoalReason,
          preferredCadence,
        });

        const today = new Date().toISOString().slice(0, 10);
        const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        const commitmentTitle = buildDefaultCommitmentTitle(
          identityArchetype,
          primaryGoalCategory,
        );

        try {
          await storage.createCommitment(user!.id, {
            title: commitmentTitle,
            category: primaryGoalCategory || "fitness",
            cadence: preferredCadence || "daily",
            startDate: today,
            endDate: threeMonthsLater,
          });
        } catch (commitmentError) {
          console.error("Error creating initial commitment:", commitmentError);
        }
      }

      return res.json({ user });
    } catch (error) {
      console.error("Google auth error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/apple", async (req, res) => {
    try {
      const { identityToken, email, fullName, onboarding } = req.body;

      if (!identityToken) {
        return res.status(400).json({ error: "Identity token is required" });
      }

      const validation = validateAppleIdentityToken(identityToken);
      if (!validation.valid || !validation.payload) {
        console.error("Apple token validation failed:", validation.error);
        return res
          .status(401)
          .json({ error: validation.error || "Invalid Apple token" });
      }

      const payload = validation.payload;
      const appleUserId = payload.sub;
      const tokenEmail = payload.email || email;

      if (!appleUserId) {
        return res
          .status(400)
          .json({ error: "Could not retrieve Apple user ID" });
      }

      let user = tokenEmail ? await storage.getUserByEmail(tokenEmail) : null;
      const isNewUser = !user;

      if (!user) {
        const displayName = fullName?.givenName
          ? `${fullName.givenName}${fullName.familyName ? ` ${fullName.familyName}` : ""}`
          : null;

        user = await storage.createUser({
          email: tokenEmail || null,
          displayName,
        });
      }

      if (isNewUser && onboarding) {
        const {
          identityArchetype,
          primaryGoalCategory,
          primaryGoalReason,
          preferredCadence,
        } = onboarding;

        user = await storage.updateUserOnboarding(user.id, {
          identityArchetype,
          primaryGoalCategory,
          primaryGoalReason,
          preferredCadence,
        });

        const today = new Date().toISOString().slice(0, 10);
        const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        const commitmentTitle = buildDefaultCommitmentTitle(
          identityArchetype,
          primaryGoalCategory,
        );

        try {
          await storage.createCommitment(user!.id, {
            title: commitmentTitle,
            category: primaryGoalCategory || "fitness",
            cadence: preferredCadence || "daily",
            startDate: today,
            endDate: threeMonthsLater,
          });
        } catch (commitmentError) {
          console.error("Error creating initial commitment:", commitmentError);
        }
      }

      return res.json({ user });
    } catch (error) {
      console.error("Apple auth error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const sessionUserId = req.headers["x-session-id"] as string;

      if (userId !== sessionUserId) {
        return res
          .status(403)
          .json({ error: "Cannot access another user's profile" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const sessionUserId = req.headers["x-session-id"] as string;

      if (userId !== sessionUserId) {
        return res
          .status(403)
          .json({ error: "Cannot update another user's profile" });
      }

      const { displayName, avatarPreset } = req.body;
      const user = await storage.updateUser(userId, {
        displayName,
        avatarPreset,
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const sessionUserId = req.headers["x-session-id"];

      if (userId !== sessionUserId) {
        return res
          .status(403)
          .json({ error: "Cannot delete another user's account" });
      }

      await storage.deleteUser(userId);
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/:id/onboarding", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const sessionUserId = req.headers["x-session-id"] as string;

      if (userId !== sessionUserId) {
        return res
          .status(403)
          .json({ error: "Cannot update another user's onboarding" });
      }

      const {
        identityArchetype,
        primaryGoalCategory,
        primaryGoalReason,
        preferredCadence,
      } = req.body;

      const user = await storage.updateUserOnboarding(userId, {
        identityArchetype,
        primaryGoalCategory,
        primaryGoalReason,
        preferredCadence,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const today = new Date().toISOString().slice(0, 10);
      const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const commitmentTitle = buildDefaultCommitmentTitle(
        identityArchetype,
        primaryGoalCategory,
      );

      try {
        await storage.createCommitment(req.params.id, {
          title: commitmentTitle,
          category: primaryGoalCategory || "fitness",
          cadence: preferredCadence || "daily",
          startDate: today,
          endDate: threeMonthsLater,
        });
      } catch (commitError) {
        console.error("Failed to auto-create commitment:", commitError);
      }

      return res.json(user);
    } catch (error) {
      console.error("Update onboarding error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put(
    "/api/users/:id/behavioral-profile",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.params.id;
        const sessionUserId = req.headers["x-session-id"] as string;

        if (userId !== sessionUserId) {
          return res
            .status(403)
            .json({ error: "Cannot update another user's behavioral profile" });
        }

        const {
          motivations,
          focusArea,
          tonePreferences,
          relapseTriggers,
          rewardStyle,
          environmentRisks,
          changeStyle,
          habitProfileType,
        } = req.body;

        const user = await storage.updateUserOnboarding(userId, {
          motivations,
          focusArea,
          tonePreferences: tonePreferences ? [tonePreferences] : undefined,
          relapseTriggers,
          rewardStyle,
          environmentRisks,
          changeStyle,
          habitProfileType,
        });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.json(user);
      } catch (error) {
        console.error("Update behavioral profile error:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  app.get("/api/commitments", async (req, res) => {
    const startedAt = Date.now();
    try {
      const userId = req.headers["x-session-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const commitments = await storage.getCommitments(userId);
      console.log("[commitments] fetched", {
        ms: Date.now() - startedAt,
        count: commitments.length,
      });
      return res.json(commitments);
    } catch (error) {
      console.error("Get commitments error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/commitments", async (req, res) => {
    try {
      const userId = req.headers["x-session-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const parsed = insertCommitmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const commitment = await storage.createCommitment(userId, parsed.data);
      return res.status(201).json(commitment);
    } catch (error) {
      console.error("Create commitment error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/commitments/:id", async (req, res) => {
    try {
      const commitment = await storage.getCommitment(req.params.id);
      if (!commitment) {
        return res.status(404).json({ error: "Commitment not found" });
      }
      return res.json(commitment);
    } catch (error) {
      console.error("Get commitment error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/commitments/:id", async (req, res) => {
    try {
      const commitment = await storage.updateCommitment(
        req.params.id,
        req.body,
      );
      if (!commitment) {
        return res.status(404).json({ error: "Commitment not found" });
      }
      return res.json(commitment);
    } catch (error) {
      console.error("Update commitment error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/commitments/:id", async (req, res) => {
    try {
      await storage.deleteCommitment(req.params.id);
      return res.status(204).send();
    } catch (error) {
      console.error("Delete commitment error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/commitments/:id/check-ins", async (req, res) => {
    try {
      const checkIns = await storage.getCheckIns(req.params.id);
      return res.json(checkIns);
    } catch (error) {
      console.error("Get check-ins error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/check-ins", async (req, res) => {
    try {
      const userId = req.headers["x-session-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const parsed = insertCheckInSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const checkIn = await storage.createCheckIn(userId, parsed.data);

      const commitment = await storage.getCommitment(parsed.data.commitmentId);
      if (commitment) {
        const newStreak = commitment.currentStreak + 1;
        await storage.updateCommitment(commitment.id, {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, commitment.longestStreak),
        });
      }

      return res.status(201).json(checkIn);
    } catch (error) {
      console.error("Create check-in error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/check-ins/today", async (req, res) => {
    const startedAt = Date.now();
    try {
      const userId = req.headers["x-session-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const today = new Date().toISOString().slice(0, 10);
      const checkIns = await storage.getTodayCheckIns(userId, today);
      console.log("[check-ins/today] fetched", {
        ms: Date.now() - startedAt,
        count: checkIns.length,
      });
      return res.json(checkIns);
    } catch (error) {
      console.error("Get today's check-ins error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    const startedAt = Date.now();
    try {
      const userId = req.headers["x-session-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const commitments = await storage.getCommitments(userId);

      // Batch fetch all check-ins for this user to avoid N+1
      const allCheckIns = await storage.getUserCheckIns(userId);

      const categoryStats: Record<string, { count: number; streak: number }> =
        {};
      const weeklyData: { day: string; count: number }[] = [];

      const now = new Date();
      const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7Days: Record<string, number> = {};

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayKey = date.toISOString().split("T")[0];
        last7Days[dayKey] = 0;
      }

      for (const commitment of commitments) {
        const category = commitment.category;
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, streak: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].streak = Math.max(
          categoryStats[category].streak,
          commitment.longestStreak,
        );
      }

      for (const checkIn of allCheckIns) {
        const checkInDay = new Date(checkIn.createdAt)
          .toISOString()
          .split("T")[0];
        if (last7Days[checkInDay] !== undefined) {
          last7Days[checkInDay]++;
        }
      }

      for (const [dayKey, count] of Object.entries(last7Days)) {
        const date = new Date(dayKey);
        weeklyData.push({
          day: weekDays[date.getDay()],
          count,
        });
      }

      const result = {
        totalCheckIns: allCheckIns.length,
        totalCommitments: commitments.length,
        activeCommitments: commitments.filter((c) => c.active).length,
        bestStreak: commitments.reduce(
          (max, c) => Math.max(max, c.longestStreak),
          0,
        ),
        categoryStats,
        weeklyData,
      };

      console.log("[analytics] computed", { ms: Date.now() - startedAt });
      return res.json(result);
    } catch (error) {
      console.error("Get analytics error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Dopamine routes removed - using in-memory implementation in server/index.ts instead

  app.post("/api/push-tokens", requireAuth, async (req, res) => {
    try {
      const { token, platform, deviceId } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      const pushToken = await storage.savePushToken(
        req.userId!,
        token,
        platform,
        deviceId,
      );
      return res.json(pushToken);
    } catch (error) {
      console.error("Save push token error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/push-tokens", requireAuth, async (req, res) => {
    try {
      const tokens = await storage.getPushTokens(req.userId!);
      return res.json(tokens);
    } catch (error) {
      console.error("Get push tokens error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/push-tokens/:token", requireAuth, async (req, res) => {
    try {
      await storage.deactivatePushToken(req.params.token);
      return res.json({ success: true });
    } catch (error) {
      console.error("Deactivate push token error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      return res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/objects/set-acl", async (req, res) => {
    try {
      const userId = req.headers["x-session-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { uploadURL } = req.body;
      if (!uploadURL) {
        return res.status(400).json({ error: "uploadURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        uploadURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.json({ objectPath });
    } catch (error) {
      console.error("Error setting ACL:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      return res.status(500).json({ error: "Stripe not configured" });
    }
  });

  app.get("/api/stripe/products", async (req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();

      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: [],
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/stripe/checkout", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: "priceId is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customerEmail =
          user.email || user.phone || `user-${user.id}@streakproof.app`;
        const customer = await stripeService.createCustomer(
          customerEmail,
          user.id,
        );
        await storage.updateUserStripeInfo(user.id, {
          stripeCustomerId: customer.id,
        });
        customerId = customer.id;
      }

      const protocol =
        req.header("x-forwarded-proto") || req.protocol || "https";
      const host = req.header("x-forwarded-host") || req.get("host");
      const baseUrl = `${protocol}://${host}`;

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/?checkout=success`,
        `${baseUrl}/?checkout=cancel`,
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return res
        .status(500)
        .json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/portal", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      const protocol =
        req.header("x-forwarded-proto") || req.protocol || "https";
      const host = req.header("x-forwarded-host") || req.get("host");
      const returnUrl = `${protocol}://${host}/`;

      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        returnUrl,
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      return res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // Stripe subscription route removed - FREE_MODE enabled permanently

  function buildProfilePrompt(payload: OnboardingPayload): string {
    return `
You are helping design a non clinical discipline coaching profile.

Here is the user JSON:
${JSON.stringify(payload, null, 2)}

Create a short label for this person and three bullet lists:
- strengths
- risk_zones
- best_practices

Rules:
- No mental health labels, no diagnoses, no therapy language.
- Focus on habits, discipline, environment and patterns.
- Each bullet must be under 20 words.
- No promises about future outcomes.
- Keep language grounded and honest.

Respond with valid JSON in this exact format:
{
  "profile_name": "string",
  "strengths": ["string", "string", "string"],
  "risk_zones": ["string", "string", "string"],
  "best_practices": ["string", "string", "string"]
}
`;
  }

  function buildFallbackSummary(
    payload: OnboardingPayload,
  ): HabitProfileSummary {
    const focusArea = payload.focus_domains?.[0] || "personal growth";
    const style = payload.change_style || "steady";
    return {
      profile_name:
        style === "intensive"
          ? "Focused Achiever"
          : style === "micro"
            ? "Steady Builder"
            : "Balanced Practitioner",
      strengths: [
        "You have self-awareness about your patterns",
        "You are motivated to make positive changes",
        `You have clear focus on ${focusArea}`,
      ],
      risk_zones: [
        "Taking on too much at once can lead to burnout",
        "Inconsistent environments may disrupt routines",
        "High expectations without flexibility can cause setbacks",
      ],
      best_practices: [
        "Start with one small commitment and build from there",
        "Track your progress daily to stay accountable",
        "Adjust your approach when something is not working",
      ],
    };
  }

  const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || "12000");
  const SIMULATE_AI_DELAY_MS = Number(process.env.SIMULATE_AI_DELAY_MS || "0");

  app.post("/api/onboarding/summary", async (req, res) => {
    const payload = req.body as OnboardingPayload;
    const startedAt = Date.now();

    if (SIMULATE_AI_DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, SIMULATE_AI_DELAY_MS));
    }

    if (!openai) {
      console.log("OpenAI not configured, using fallback summary");
      console.log("[onboarding] summary fallback", {
        ms: Date.now() - startedAt,
        reason: "openai not configured",
      });
      return res.json(buildFallbackSummary(payload));
    }

    try {
      const prompt = buildProfilePrompt(payload);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("OpenAI timeout")),
          OPENAI_TIMEOUT_MS,
        );
      });

      const completionPromise = openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_PROFILE || "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You generate short, non clinical behaviour profiles for a habit app. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 450,
      });

      const completion = await Promise.race([
        completionPromise,
        timeoutPromise,
      ]);
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        console.log("No content from OpenAI, using fallback summary");
        return res.json(buildFallbackSummary(payload));
      }

      const json = JSON.parse(content) as HabitProfileSummary;
      console.log("[onboarding] summary", {
        ms: Date.now() - startedAt,
        timeoutMs: OPENAI_TIMEOUT_MS,
        model: process.env.OPENAI_MODEL_PROFILE || "gpt-4.1-mini",
      });
      return res.json(json);
    } catch (err) {
      console.error("Error in /api/onboarding/summary, using fallback:", err);
      console.warn("[onboarding] summary fallback", {
        ms: Date.now() - startedAt,
        reason: String(err),
      });
      return res.json(buildFallbackSummary(payload));
    }
  });

  function buildRecommendationsPrompt(
    payload: OnboardingPayload,
    summary: HabitProfileSummary,
  ): string {
    return `
You are helping design realistic daily and weekly commitments for a discipline app.

User JSON:
${JSON.stringify(payload, null, 2)}

Profile summary:
${JSON.stringify(summary, null, 2)}

Create up to 5 commitments. For each, output:
- title
- short_description
- cadence: one of "daily", "weekly"
- proof_mode: "none", "tick_only", "photo_optional" or "photo_required"
- reason: under 20 words, grounded and honest.

Rules:
- Do not make any medical or mental health claims.
- Focus on behaviour, environment and realistic micro actions.
- Keep workloads small if they are overwhelmed or burnt out.

Respond with valid JSON in this exact format:
{
  "commitments": [
    {
      "title": "string",
      "short_description": "string",
      "cadence": "daily",
      "proof_mode": "tick_only",
      "reason": "string"
    }
  ]
}
`;
  }

  function buildFallbackRecommendations(payload: OnboardingPayload): {
    commitments: CommitmentRecommendation[];
  } {
    const focusArea = payload.focus_domains?.[0] || "wellness";
    const style = payload.change_style || "steady";

    const baseCommitments: CommitmentRecommendation[] = [
      {
        title: "Morning Check-in",
        short_description:
          "Start your day with intention by reviewing your goals",
        cadence: "daily",
        proof_mode: "tick_only",
        reason: "Building awareness of daily priorities helps maintain focus",
      },
      {
        title: "Evening Reflection",
        short_description: "Take 5 minutes to note what went well today",
        cadence: "daily",
        proof_mode: "tick_only",
        reason: "Reflecting on progress reinforces positive habits",
      },
      {
        title: "Weekly Review",
        short_description: "Review your week and plan the next one",
        cadence: "weekly",
        proof_mode: "tick_only",
        reason: "Regular reviews help you stay on track with larger goals",
      },
    ];

    if (focusArea === "fitness" || focusArea === "health") {
      baseCommitments.unshift({
        title: "Movement Break",
        short_description: "Get up and move for at least 10 minutes",
        cadence: "daily",
        proof_mode: "tick_only",
        reason: "Regular movement improves energy and focus throughout the day",
      });
    }

    if (style === "micro") {
      return { commitments: baseCommitments.slice(0, 2) };
    }

    return { commitments: baseCommitments };
  }

  app.post("/api/onboarding/recommendations", async (req, res) => {
    const {
      payload,
      summary,
    }: { payload: OnboardingPayload; summary: HabitProfileSummary } = req.body;
    const startedAt = Date.now();

    if (SIMULATE_AI_DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, SIMULATE_AI_DELAY_MS));
    }

    if (!openai) {
      console.log("OpenAI not configured, using fallback recommendations");
      console.log("[onboarding] recs fallback", {
        ms: Date.now() - startedAt,
        reason: "openai not configured",
      });
      return res.json(buildFallbackRecommendations(payload));
    }

    try {
      const prompt = buildRecommendationsPrompt(payload, summary);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("OpenAI timeout")),
          OPENAI_TIMEOUT_MS,
        );
      });

      const completionPromise = openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_RECS || "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You propose realistic, non clinical habit commitments for a discipline app. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 600,
      });

      const completion = await Promise.race([
        completionPromise,
        timeoutPromise,
      ]);
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        console.log("No content from OpenAI, using fallback recommendations");
        return res.json(buildFallbackRecommendations(payload));
      }

      const json = JSON.parse(content) as {
        commitments: CommitmentRecommendation[];
      };

      console.log("[onboarding] recs", {
        ms: Date.now() - startedAt,
        timeoutMs: OPENAI_TIMEOUT_MS,
        model: process.env.OPENAI_MODEL_RECS || "gpt-4.1-mini",
      });

      return res.json(json);
    } catch (err) {
      console.error(
        "Error in /api/onboarding/recommendations, using fallback:",
        err,
      );
      console.warn("[onboarding] recs fallback", {
        ms: Date.now() - startedAt,
        reason: String(err),
      });
      return res.json(buildFallbackRecommendations(payload));
    }
  });

  app.get("/api/account/exit-survey", (_req, res) => {
    res.json({
      questions: [
        "What made you decide to step away from StreakProof?",
        "Was there anything that did not work for you in the app?",
        "If you come back in six months, what would you hope is different?",
      ],
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

// --- AI Coaching & Suggestions Routes (Commito) ---

export function registerAiRoutes(app: Express) {
  const OPENAI_TIMEOUT_MS = 20000;

  // Generic respond endpoint: POST with full context JSON
  app.post("/api/ai/respond", async (req: Request, res: Response) => {
    const context = req.body;

    // Fallback if no OpenAI configured
    if (!openai) {
      const fb = buildFallbackCoachingResponse(context);
      return res.json(fb);
    }

    try {
      const systemPrompt = buildCommitoSystemPrompt();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("OpenAI timeout")),
          OPENAI_TIMEOUT_MS,
        );
      });

      const completionPromise = openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_COMMITO || "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Here is the JSON context. Respond strictly with the specified output contract as valid JSON (no code fences).\n" +
              JSON.stringify(context, null, 2),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 700,
      });

      const completion = await Promise.race([
        completionPromise,
        timeoutPromise,
      ]);
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return res.json(buildFallbackCoachingResponse(context));
      }

      let json: CommitoAiResponseContract;
      try {
        json = JSON.parse(content);
      } catch {
        // If parsing fails, return fallback
        const fb = buildFallbackCoachingResponse(context);
        return res.json(fb);
      }
      const valid = validateCommitoResponse(json);
      if (!valid) {
        console.warn("/api/ai/respond: invalid LLM JSON, returning fallback");
        const fb = buildFallbackCoachingResponse(context);
        return res.json(fb);
      }
      return res.json(valid);
    } catch (err) {
      console.error("/api/ai/respond error:", err);
      const fb = buildFallbackCoachingResponse(context);
      return res.json(fb);
    }
  });

  // Lightweight coaching endpoint (GET) using minimal server-side aggregation
  app.get("/api/ai/coaching", async (req: Request, res: Response) => {
    try {
      const userId = req.headers["x-session-id"] as string | undefined;
      const today = new Date().toISOString().slice(0, 10);

      const ctx = {
        user_profile: { id: userId, name: undefined },
        communication_preferences: {
          tone: "soft_supportive",
          length_preference: "short",
          language_style: "uk_english",
          science_detail: "medium",
        },
        behaviour_state: {
          commitments: [],
          check_ins: {
            total_last_7_days: 0,
            total_planned_last_7_days: 0,
            completion_rate_last_7_days: 0,
            missed_streak_events_last_30_days: 0,
          },
          self_regulation: {
            latest_score: undefined,
            latest_date: today,
            previous_score: undefined,
            previous_date: undefined,
            trend: "stable",
          },
          dopamine_lab: { recent_entries: [], engagement_level: "low" },
        },
        session_context: {
          interaction_type: "check_in_confirmation",
          trigger: "system_prompt_coaching",
          app_surface: "mobile_home_main",
        },
        request_flags: {
          needs_scientific_explanation: false,
          needs_soft_tone: true,
          explicit_request_for_data: false,
        },
      };

      if (!openai) {
        const fb = buildFallbackCoachingResponse(ctx);
        return res.json(fb);
      }

      const systemPrompt = buildCommitoSystemPrompt();
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_COMMITO || "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Here is the JSON context. Respond strictly with the specified output contract as valid JSON (no code fences).\n" +
              JSON.stringify(ctx, null, 2),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 700,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        const fb = buildFallbackCoachingResponse(ctx);
        return res.json(fb);
      }
      try {
        const parsed = JSON.parse(content);
        const valid = validateCommitoResponse(parsed);
        if (!valid) {
          console.warn(
            "/api/ai/coaching: invalid LLM JSON, returning fallback",
          );
          const fb = buildFallbackCoachingResponse(ctx);
          return res.json(fb);
        }
        return res.json(valid);
      } catch {
        const fb = buildFallbackCoachingResponse(ctx);
        return res.json(fb);
      }
    } catch (err) {
      console.error("/api/ai/coaching error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

// --- Additional domain-specific AI endpoints ---

export function registerAiDomainEndpoints(app: Express) {
  // Suggestions endpoint
  app.post("/api/ai/suggestions", async (req: Request, res: Response) => {
    const parsed = suggestionsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid request body", details: parsed.error.errors });
    }
    const body = parsed.data;
    const ctx = {
      user_profile: { id: body.user_id, name: undefined },
      communication_preferences: body.communication_preferences || {
        tone: "soft_supportive",
        detail_level: "medium",
        science_detail: "medium",
        length_preference: "short",
        language_style: "uk_english",
      },
      behaviour_state: {
        commitments:
          body.snapshot.active_commitments_count > 0
            ? [
                {
                  title: "Active commitments",
                  difficulty: "medium",
                  frequency: "daily",
                  streak_days: Math.max(
                    0,
                    body.snapshot.streak_longest_days || 0,
                  ),
                  completion_rate_last_30_days:
                    body.snapshot.completion_rate_last_7_days ?? 0,
                  last_completed_at: undefined,
                },
              ]
            : [],
        check_ins: {
          total_last_7_days: Math.round(
            (body.snapshot.active_commitments_count || 0) *
              7 *
              (body.snapshot.completion_rate_last_7_days || 0),
          ),
          total_planned_last_7_days:
            (body.snapshot.active_commitments_count || 0) * 7,
          completion_rate_last_7_days:
            body.snapshot.completion_rate_last_7_days || 0,
          missed_streak_events_last_30_days: 0,
        },
        self_regulation: {
          latest_score: undefined,
          previous_score: undefined,
          trend: body.snapshot.self_regulation_trend || "stable",
          latest_date: new Date().toISOString().slice(0, 10),
          previous_date: undefined,
        },
        dopamine_lab: { recent_entries: [], engagement_level: "low" },
      },
      session_context: {
        interaction_type: "suggestions",
        trigger: body.mode || "quick_nudge",
        app_surface: body.surface || "home_main",
      },
      request_flags: {
        needs_scientific_explanation: false,
        needs_soft_tone: true,
        explicit_request_for_data: false,
      },
    };

    if (!openai) {
      const fb = buildFallbackCoachingResponse(ctx);
      return res.json(fb);
    }

    try {
      const systemPrompt = buildCommitoSystemPrompt();
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_COMMITO || "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Respond with JSON contract: suggestions for the given lightweight context.\n" +
              JSON.stringify(ctx, null, 2),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 700,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        const fb = buildFallbackCoachingResponse(ctx);
        return res.json(fb);
      }
      const parsed = JSON.parse(content);
      const valid = validateCommitoResponse(parsed);
      if (!valid) {
        const fb = buildFallbackCoachingResponse(ctx);
        return res.json(fb);
      }
      return res.json(valid);
    } catch (err) {
      console.error("/api/ai/suggestions error:", err);
      const fb = buildFallbackCoachingResponse(ctx);
      return res.json(fb);
    }
  });

  // Commitment help endpoint
  app.post("/api/ai/commitment-help", async (req: Request, res: Response) => {
    const parsed = commitmentHelpRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid request body", details: parsed.error.errors });
    }
    const body = parsed.data;
    const ctx = {
      user_profile: { id: body.user_id, name: undefined },
      communication_preferences: body.communication_preferences || {
        tone: "soft_supportive",
        detail_level: "medium",
        science_detail: "medium",
        length_preference: "short",
        language_style: "uk_english",
      },
      behaviour_state: {
        commitments: body.behaviour_state?.current_commitments_count
          ? [
              {
                title: "Current commitments",
                difficulty: "medium",
                frequency: "daily",
                streak_days: 0,
                completion_rate_last_30_days:
                  body.behaviour_state?.recent_completion_rate ?? 0,
                last_completed_at: undefined,
              },
            ]
          : [],
        check_ins: {
          total_last_7_days: 0,
          total_planned_last_7_days: body.behaviour_state
            ?.current_commitments_count
            ? body.behaviour_state.current_commitments_count * 7
            : 0,
          completion_rate_last_7_days:
            body.behaviour_state?.recent_completion_rate ?? 0,
          missed_streak_events_last_30_days: 0,
        },
        self_regulation: {
          latest_score: undefined,
          previous_score: undefined,
          trend: "stable",
          latest_date: new Date().toISOString().slice(0, 10),
          previous_date: undefined,
        },
        dopamine_lab: { recent_entries: [], engagement_level: "low" },
      },
      session_context: {
        interaction_type: "commitment_help",
        trigger: "user_draft",
        app_surface: "mobile_home_main",
      },
      user_message: body.draft_commitment?.notes || "",
      request_flags: {
        needs_scientific_explanation: false,
        needs_soft_tone: true,
        explicit_request_for_data: false,
      },
    };

    if (!openai) {
      const fb = buildFallbackCoachingResponse(ctx, {
        mode: "commitment_help",
        draft: body.draft_commitment,
      });
      return res.json(fb);
    }

    try {
      const systemPrompt = buildCommitoSystemPrompt();
      const messages = [
        { role: "system" as const, content: systemPrompt },
        {
          role: "user" as const,
          content:
            "Context and draft commitment. Respond with JSON contract and include meta.extra.proposed_commitment and meta.extra.rationale_tags if appropriate.\n" +
            JSON.stringify(ctx, null, 2),
        },
      ];
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_COMMITO || "gpt-4.1-mini",
        messages,
        response_format: { type: "json_object" },
        max_tokens: 800,
      });
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        const fb = buildFallbackCoachingResponse(ctx, {
          mode: "commitment_help",
          draft: body.draft_commitment,
        });
        return res.json(fb);
      }
      const parsed = JSON.parse(content);
      const valid = validateCommitoResponse(parsed);
      if (!valid) {
        const fb = buildFallbackCoachingResponse(ctx, {
          mode: "commitment_help",
          draft: body.draft_commitment,
        });
        return res.json(fb);
      }
      // If LLM didn't include extras, add a minimal proposal based on draft
      if (!valid.meta.extra?.proposed_commitment) {
        valid.meta.extra = valid.meta.extra || {};
        valid.meta.extra.proposed_commitment = {
          title: body.draft_commitment.title,
          frequency: body.draft_commitment.target_frequency,
          category: body.draft_commitment.category,
        };
        valid.meta.extra.rationale_tags = valid.meta.extra.rationale_tags || [
          "reduce_scope",
          "build_consistency_first",
        ];
      }
      return res.json(valid);
    } catch (err) {
      console.error("/api/ai/commitment-help error:", err);
      const fb = buildFallbackCoachingResponse(ctx, {
        mode: "commitment_help",
        draft: body.draft_commitment,
      });
      return res.json(fb);
    }
  });
}
