import express from "express";
import type {
  Request,
  Response,
  NextFunction,
  Application,
} from "express";
import { registerRoutes } from "./routes";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import * as fs from "fs";
import * as path from "path";

const app = express();
const log = console.log;

// Simple in memory store for Dopamine Lab (per user, per day).
// This is temporary so the feature works end to end without touching the DB yet.
// Later we can swap this to Supabase / Drizzle.
type DopaminePayload = {
  movedBody: boolean;
  daylight: boolean;
  social: boolean;
  creative: boolean;
  music: boolean;
  learning: boolean;
  coldExposure: boolean;
  protectedSleep: boolean;
};

type DopamineState = DopaminePayload & {
  date: string;
};

const dopamineStore = new Map<string, DopamineState>();

function todayISO(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// Very simple user id extraction.
// For now we just use the x-session-id header as a stand in.
// Later we can replace this with your real auth user id.
function getUserId(req: Request): string | null {
  const sessionId = req.header("x-session-id");
  if (!sessionId) return null;
  return sessionId;
}

// Register /api/dopamine routes on this express app
function registerDopamineRoutes(app: Application) {
  // GET /api/dopamine/today
  app.get(
    "/api/dopamine/today",
    (req: Request, res: Response) => {
      const userId = getUserId(req);
      if (!userId) {
        return res
          .status(401)
          .json({ error: "Missing x-session-id" });
      }

      const key = `${userId}:${todayISO()}`;
      const entry = dopamineStore.get(key) || null;

      return res.json(entry);
    },
  );

  // POST /api/dopamine
  app.post(
    "/api/dopamine",
    (req: Request, res: Response) => {
      const userId = getUserId(req);
      if (!userId) {
        return res
          .status(401)
          .json({ error: "Missing x-session-id" });
      }

      const key = `${userId}:${todayISO()}`;

      const previous =
        dopamineStore.get(key) ||
        ({
          date: todayISO(),
          movedBody: false,
          daylight: false,
          social: false,
          creative: false,
          music: false,
          learning: false,
          coldExposure: false,
          protectedSleep: false,
        } as DopamineState);

      const body = req.body as Partial<DopaminePayload>;

      const merged: DopamineState = {
        ...previous,
        movedBody: body.movedBody ?? previous.movedBody,
        daylight: body.daylight ?? previous.daylight,
        social: body.social ?? previous.social,
        creative: body.creative ?? previous.creative,
        music: body.music ?? previous.music,
        learning: body.learning ?? previous.learning,
        coldExposure:
          body.coldExposure ?? previous.coldExposure,
        protectedSleep:
          body.protectedSleep ?? previous.protectedSleep,
      };

      dopamineStore.set(key, merged);

      return res.json(merged);
    },
  );
}


declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    const origin = req.header("origin");

    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, x-session-id");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  log("Serving static Expo files with dynamic manifest routing");

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }

    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }

    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    res.status(status).json({ message });

    throw err;
  });
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    log("DATABASE_URL not set, skipping Stripe initialization");
    return;
  }

  try {
    log("Initializing Stripe schema...");
    await runMigrations({
      databaseUrl,
    });
    log("Stripe schema ready");

    const stripeSync = await getStripeSync();

    log("Setting up managed webhook...");
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ["*"],
        description: "Managed webhook for StreakProof",
      }
    );
    log(`Webhook configured: ${webhook.url} (UUID: ${uuid})`);

    log("Syncing Stripe data...");
    stripeSync
      .syncBackfill()
      .then(() => {
        log("Stripe data synced");
      })
      .catch((err: Error) => {
        log("Error syncing Stripe data:", err.message);
      });
  } catch (error) {
    log("Failed to initialize Stripe:", error);
  }
}

(async () => {
  setupCors(app);

  app.post(
    "/api/stripe/webhook/:uuid",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      // ... existing webhook handler ...
    }
  );

  setupBodyParsing(app);
  setupRequestLogging(app);

  // Register Dopamine Lab routes
  registerDopamineRoutes(app);

  await initStripe();

  configureExpoAndLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`express server serving on port ${port}`);
    },
  );
})();

