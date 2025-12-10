import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, timestamp, time, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const identityArchetypes = [
  "athlete",
  "focused_creative",
  "disciplined_builder",
  "balanced_mind",
  "better_everyday",
] as const;

export const habitProfileTypes = [
  "structured_rebuilder",
  "high_drive_sprinter",
  "gentle_sustainer",
  "quiet_strategist",
  "identity_builder",
] as const;

export const goalCategories = [
  "fitness",
  "learning",
  "work",
  "creativity",
  "mental_health",
  "nutrition",
  "personal_improvement",
  "custom",
] as const;

export const focusAreas = [
  "mind",
  "body",
  "work",
  "lifestyle",
  "creativity",
] as const;

export const tonePreferences = [
  "direct",
  "calm",
  "data_driven",
  "encouraging",
  "stoic",
] as const;

export const proofModes = [
  "none",
  "note_only",
  "photo_optional",
  "photo_required",
] as const;

export const accountabilityLevels = [
  "soft",
  "standard",
  "strict",
] as const;

export const changeStyles = [
  "all_in_fast",
  "build_slowly",
  "wait_until_ready",
  "try_many_things",
] as const;

export type IdentityArchetype = (typeof identityArchetypes)[number];
export type HabitProfileType = (typeof habitProfileTypes)[number];
export type GoalCategory = (typeof goalCategories)[number];
export type FocusArea = (typeof focusAreas)[number];
export type TonePreference = (typeof tonePreferences)[number];
export type ProofMode = (typeof proofModes)[number];
export type AccountabilityLevel = (typeof accountabilityLevels)[number];
export type ChangeStyle = (typeof changeStyles)[number];

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarPreset: text("avatar_preset").default("yoga"),
  
  identityArchetype: text("identity_archetype"),
  habitProfileType: text("habit_profile_type"),
  
  motivations: text("motivations").array().default(sql`'{}'::text[]`),
  painPoints: text("pain_points").array().default(sql`'{}'::text[]`),
  obstacles: text("obstacles").array().default(sql`'{}'::text[]`),
  focusArea: text("focus_area"),
  tonePreferences: text("tone_preferences").array().default(sql`'{}'::text[]`),
  coachingIntensity: text("coaching_intensity"),
  initialCommitmentCategory: text("initial_commitment_category"),
  relapseTriggers: text("relapse_triggers").array().default(sql`'{}'::text[]`),
  accountabilityStyle: text("accountability_style"),
  desiredFeelings: text("desired_feelings").array().default(sql`'{}'::text[]`),
  rewardStyle: text("reward_style").array().default(sql`'{}'::text[]`),
  environmentRisks: text("environment_risks").array().default(sql`'{}'::text[]`),
  changeStyle: text("change_style"),
  
  personalContext: jsonb("personal_context").default(sql`'{}'::jsonb`),
  selfRegulationProfile: jsonb("self_regulation_profile").default(sql`'{}'::jsonb`),
  
  themePreference: text("theme_preference").default("system"),
  plan: text("plan").default("free"),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  reminderChannel: text("reminder_channel").default("email"),
  reminderTimeLocal: time("reminder_time_local"),
  timezone: text("timezone").default("Europe/London"),
  
  lastStoicSeenAt: timestamp("last_stoic_seen_at"),
  stoicStyle: text("stoic_style"),
  
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  
  primaryGoalCategory: text("primary_goal_category"),
  primaryGoalReason: text("primary_goal_reason"),
  preferredCadence: text("preferred_cadence"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commitments = pgTable("commitments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  cadence: text("cadence").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  
  proofMode: text("proof_mode").default("photo_optional"),
  accountabilityLevel: text("accountability_level").default("standard"),
  templateId: text("template_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkIns = pgTable("check_ins", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  commitmentId: varchar("commitment_id")
    .notNull()
    .references(() => commitments.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  note: text("note"),
  mediaUrl: text("media_url"),
  hasPhoto: boolean("has_photo").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dopamineChecklistEntries = pgTable("dopamine_checklist_entries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  movedBody: boolean("moved_body").default(false),
  daylight: boolean("daylight").default(false),
  social: boolean("social").default(false),
  creative: boolean("creative").default(false),
  music: boolean("music").default(false),
  learning: boolean("learning").default(false),
  coldExposure: boolean("cold_exposure").default(false),
  protectedSleep: boolean("protected_sleep").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stoicQuotes = pgTable("stoic_quotes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  author: text("author").notNull(),
  source: text("source"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  commitments: many(commitments),
  checkIns: many(checkIns),
  dopamineEntries: many(dopamineChecklistEntries),
}));

export const commitmentsRelations = relations(commitments, ({ one, many }) => ({
  user: one(users, {
    fields: [commitments.userId],
    references: [users.id],
  }),
  checkIns: many(checkIns),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  commitment: one(commitments, {
    fields: [checkIns.commitmentId],
    references: [commitments.id],
  }),
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id],
  }),
}));

export const dopamineChecklistEntriesRelations = relations(dopamineChecklistEntries, ({ one }) => ({
  user: one(users, {
    fields: [dopamineChecklistEntries.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  displayName: true,
  avatarPreset: true,
});

export const updateUserProfileSchema = z.object({
  displayName: z.string().optional(),
  avatarPreset: z.string().optional(),
  identityArchetype: z.string().optional(),
  habitProfileType: z.string().optional(),
  motivations: z.array(z.string()).optional(),
  focusArea: z.string().optional(),
  tonePreferences: z.array(z.string()).optional(),
  relapseTriggers: z.array(z.string()).optional(),
  rewardStyle: z.array(z.string()).optional(),
  environmentRisks: z.array(z.string()).optional(),
  changeStyle: z.string().optional(),
  themePreference: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  reminderChannel: z.string().optional(),
  reminderTimeLocal: z.string().optional(),
  timezone: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
  personalContext: z.record(z.any()).optional(),
  selfRegulationProfile: z.record(z.any()).optional(),
});

export const insertCommitmentSchema = createInsertSchema(commitments).pick({
  title: true,
  description: true,
  category: true,
  cadence: true,
  startDate: true,
  endDate: true,
  proofMode: true,
  accountabilityLevel: true,
  templateId: true,
});

export const insertCheckInSchema = createInsertSchema(checkIns).pick({
  commitmentId: true,
  note: true,
  mediaUrl: true,
  hasPhoto: true,
});

export const insertDopamineEntrySchema = createInsertSchema(dopamineChecklistEntries).pick({
  date: true,
  movedBody: true,
  daylight: true,
  social: true,
  creative: true,
  music: true,
  learning: true,
  coldExposure: true,
  protectedSleep: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type User = typeof users.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type Commitment = typeof commitments.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertDopamineEntry = z.infer<typeof insertDopamineEntrySchema>;
export type DopamineEntry = typeof dopamineChecklistEntries.$inferSelect;
export type StoicQuote = typeof stoicQuotes.$inferSelect;
