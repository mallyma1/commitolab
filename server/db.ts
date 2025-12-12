import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/postgres";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL not set; using local postgres placeholder. " +
      "Endpoints that hit the database will fail unless you provide a real database URL.",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
