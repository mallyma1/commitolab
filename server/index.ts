import express from "express";
import type { Request, Response, NextFunction } from "express";
import {
  registerRoutes,
  registerAiRoutes,
  registerAiDomainEndpoints,
} from "./routes";
import * as fs from "fs";
import * as path from "path";

const app = express();
const log = console.log;

// Dopamine Lab: simple in-memory per-user-per-day store.
// This is enough to get the feature working end to end.
// Later we can swap this for a database-backed implementation.
type DopaminePayload = {
  movedBody: boolean;
  daylight: boolean;
  social: boolean;
  creative: boolean;
  music: boolean;
  learning: boolean;
  coldExposure: boolean;
  protectedSleep: boolean;
  stillness: boolean;
  natureTime: boolean;
};

type DopamineState = DopaminePayload & {
  date: string;
};

const dopamineStore = new Map<string, DopamineState>();

function todayISO(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// For now, use x-session-id header or a stable local dev id.
// Replace this with your real auth user id when available.
function getUserId(req: Request): string {
  const sessionId = req.header("x-session-id");
  if (sessionId && sessionId.trim().length > 0) {
    return sessionId;
  }
  return "local-dev-user";
}

// Simple in-memory dopamine lab storage.
// Uses x-session-id header for user id, or falls back to 'local-dev-user' for easy local testing.
function registerDopamineRoutes(app: express.Application) {
  // GET /api/dopamine/today
  app.get("/api/dopamine/today", (req: Request, res: Response) => {
    const userId = getUserId(req);
    const key = `${userId}:${todayISO()}`;
    const entry = dopamineStore.get(key) || null;
    return res.json(entry);
  });

  // POST /api/dopamine
  app.post("/api/dopamine", (req: Request, res: Response) => {
    const userId = getUserId(req);
    const key = `${userId}:${todayISO()}`;

    const prev: DopamineState = dopamineStore.get(key) || {
      date: todayISO(),
      movedBody: false,
      daylight: false,
      social: false,
      creative: false,
      music: false,
      learning: false,
      coldExposure: false,
      protectedSleep: false,
      stillness: false,
      natureTime: false,
    };

    const body = req.body as Partial<DopaminePayload>;

    const next: DopamineState = {
      ...prev,
      movedBody: body.movedBody ?? prev.movedBody,
      daylight: body.daylight ?? prev.daylight,
      social: body.social ?? prev.social,
      creative: body.creative ?? prev.creative,
      music: body.music ?? prev.music,
      learning: body.learning ?? prev.learning,
      coldExposure: body.coldExposure ?? prev.coldExposure,
      protectedSleep: body.protectedSleep ?? prev.protectedSleep,
      stillness: body.stillness ?? prev.stillness,
      natureTime: body.natureTime ?? prev.natureTime,
    };

    dopamineStore.set(key, next);
    return res.json(next);
  });
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origin = req.header("origin");
    const isDev = process.env.NODE_ENV === "development";

    // In development, allow all origins (for Expo Go, tunneling, etc.)
    if (isDev) {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, x-session-id");
      res.header("Access-Control-Allow-Credentials", "true");

      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      return next();
    }

    // Production: strict allowlist
    const origins = new Set<string>();

    // Production app domains
    origins.add("https://committoo.space");
    origins.add("https://www.committoo.space");

    // Replit domains (if applicable)
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d: string) => {
        origins.add(`https://${d.trim()}`);
      });
    }

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
        (req as any).rawBody = buf;
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

(async () => {
  setupCors(app);

  // Health check endpoints - registered early for easy access
  app.get("/health", (_req, res) => {
    res.status(200).send("ok");
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  });

  setupBodyParsing(app);
  setupRequestLogging(app);

  // Register Dopamine Lab routes
  registerDopamineRoutes(app);

  configureExpoAndLanding(app);

  // Register AI coaching endpoints
  registerAiRoutes(app);
  // Register domain-specific AI endpoints
  registerAiDomainEndpoints(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.BIND_HOST || "localhost";
  server.listen(
    {
      port,
      host,
    },
    () => {
      log(`express server serving on ${host}:${port}`);
    },
  );
})();