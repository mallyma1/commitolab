import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email"),
  phone: text("phone"),
  displayName: text("display_name"),
  avatarPreset: text("avatar_preset"),
  identityArchetype: text("identity_archetype"),
  habitProfileType: text("habit_profile_type"),
  motivations: text("motivations").array(),
  focusArea: text("focus_area"),
  tonePreferences: text("tone_preferences").array(),
  relapseTriggers: text("relapse_triggers").array(),
  rewardStyle: text("reward_style").array(),
  environmentRisks: text("environment_risks").array(),
  changeStyle: text("change_style"),
  primaryGoalCategory: text("primary_goal_category"),
  primaryGoalReason: text("primary_goal_reason"),
  preferredCadence: text("preferred_cadence"),
  themePreference: text("theme_preference"),
  plan: text("plan").default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpdateUserProfile = Partial<
  Pick<User, "displayName" | "avatarPreset" | "themePreference">
>;

// Literal types for onboarding/UI
export type IdentityArchetype =
  | "athlete"
  | "focused_creative"
  | "disciplined_builder"
  | "balanced_mind"
  | "better_everyday";
export type GoalCategory =
  | "fitness"
  | "work"
  | "mind"
  | "relationships"
  | "creativity"
  | "health"
  | "learning"
  | "mental_health"
  | "nutrition"
  | "personal_improvement"
  | "custom";

// Commitments table
export const commitments = pgTable("commitments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  cadence: text("cadence").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  proofMode: text("proof_mode"),
  accountabilityLevel: text("accountability_level"),
  templateId: text("template_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Commitment = typeof commitments.$inferSelect;
export type InsertCommitment = Omit<
  typeof commitments.$inferInsert,
  "userId" | "id" | "createdAt"
>;

export const insertCommitmentSchema = createInsertSchema(commitments, {
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  cadence: z.string().min(1, "Cadence is required"),
  startDate: z.string(),
  endDate: z.string(),
}).omit({ id: true, userId: true, createdAt: true });

// Check-ins table
export const checkIns = pgTable("check_ins", {
  id: uuid("id").defaultRandom().primaryKey(),
  commitmentId: uuid("commitment_id")
    .notNull()
    .references(() => commitments.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  note: text("note"),
  mediaUrl: text("media_url"),
  hasPhoto: boolean("has_photo").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = Omit<
  typeof checkIns.$inferInsert,
  "userId" | "id" | "createdAt"
>;

export const insertCheckInSchema = createInsertSchema(checkIns, {
  commitmentId: z.string().uuid(),
}).omit({ id: true, userId: true, createdAt: true });

// Dopamine checklist entries table
export const dopamineChecklistEntries = pgTable("dopamine_checklist_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  movedBody: boolean("moved_body").default(false),
  daylight: boolean("daylight").default(false),
  social: boolean("social").default(false),
  creative: boolean("creative").default(false),
  music: boolean("music").default(false),
  learning: boolean("learning").default(false),
  coldExposure: boolean("cold_exposure").default(false),
  protectedSleep: boolean("protected_sleep").default(false),
  stillness: boolean("stillness"),
  natureTime: boolean("nature_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DopamineEntry = typeof dopamineChecklistEntries.$inferSelect;
export type InsertDopamineEntry = typeof dopamineChecklistEntries.$inferInsert;

// Stoic quotes table
export const stoicQuotes = pgTable("stoic_quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  text: text("text").notNull(),
  author: text("author").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StoicQuote = typeof stoicQuotes.$inferSelect;

// Push tokens table
export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  platform: text("platform"),
  deviceId: text("device_id"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
