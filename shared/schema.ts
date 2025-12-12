// shared/schema.ts

// Shared type used by the Dopamine Lab screen.
// You can extend this later with Zod / drizzle as needed.
export type DopamineEntry = {
  userId?: string;
  date?: string;
  movedBody?: boolean;
  daylight?: boolean;
  social?: boolean;
  creative?: boolean;
  music?: boolean;
  learning?: boolean;
  coldExposure?: boolean;
  protectedSleep?: boolean;
  stillness?: boolean;
  natureTime?: boolean;
};

// Minimal placeholders so other imports from "@shared/schema"
// in server / client do not crash. All are "any" for now.
export const schema: any = {};
export const tables: any = {};
export const users: any = {};
export const sessions: any = {};
export const subscriptions: any = {};
export const dopamineLogs: any = {};

const defaultExport = {
  schema,
  tables,
  users,
  sessions,
  subscriptions,
  dopamineLogs,
};

export default defaultExport;
