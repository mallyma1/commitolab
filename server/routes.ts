import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertCommitmentSchema, insertCheckInSchema } from "@shared/schema";

function buildDefaultCommitmentTitle(identity: string, goalCategory: string): string {
  const base = goalCategory === "custom" ? "My streak" : goalCategory.replace("_", " ");
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
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({ email });
      }

      return res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { displayName, avatarPreset } = req.body;
      const user = await storage.updateUser(req.params.id, {
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

  app.put("/api/users/:id/onboarding", async (req, res) => {
    try {
      const { identityArchetype, primaryGoalCategory, primaryGoalReason, preferredCadence } = req.body;
      
      const user = await storage.updateUserOnboarding(req.params.id, {
        identityArchetype,
        primaryGoalCategory,
        primaryGoalReason,
        preferredCadence,
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const today = new Date().toISOString().slice(0, 10);
      const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      
      const commitmentTitle = buildDefaultCommitmentTitle(identityArchetype, primaryGoalCategory);
      
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

  app.get("/api/commitments", async (req, res) => {
    try {
      const userId = req.headers["x-session-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const commitments = await storage.getCommitments(userId);
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
      const commitment = await storage.updateCommitment(req.params.id, req.body);
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

  app.get("/api/analytics", async (req, res) => {
    try {
      const userId = req.headers["x-session-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const commitments = await storage.getCommitments(userId);
      
      let totalCheckIns = 0;
      const categoryStats: Record<string, { count: number; streak: number }> = {};
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
        const checkIns = await storage.getCheckIns(commitment.id);
        totalCheckIns += checkIns.length;

        const category = commitment.category;
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, streak: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].streak = Math.max(
          categoryStats[category].streak,
          commitment.longestStreak
        );

        for (const checkIn of checkIns) {
          const checkInDay = new Date(checkIn.createdAt).toISOString().split("T")[0];
          if (last7Days[checkInDay] !== undefined) {
            last7Days[checkInDay]++;
          }
        }
      }

      for (const [dayKey, count] of Object.entries(last7Days)) {
        const date = new Date(dayKey);
        weeklyData.push({
          day: weekDays[date.getDay()],
          count,
        });
      }

      return res.json({
        totalCheckIns,
        totalCommitments: commitments.length,
        activeCommitments: commitments.filter((c) => c.active).length,
        bestStreak: commitments.reduce((max, c) => Math.max(max, c.longestStreak), 0),
        categoryStats,
        weeklyData,
      });
    } catch (error) {
      console.error("Get analytics error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
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
        }
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

  const httpServer = createServer(app);
  return httpServer;
}
