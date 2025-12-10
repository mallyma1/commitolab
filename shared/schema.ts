import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const identityArchetypes = [
  "athlete",
  "focused_creative",
  "disciplined_builder",
  "balanced_mind",
  "better_everyday",
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

export type IdentityArchetype = (typeof identityArchetypes)[number];
export type GoalCategory = (typeof goalCategories)[number];

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarPreset: text("avatar_preset").default("yoga"),
  identityArchetype: text("identity_archetype"),
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
  category: text("category").notNull(),
  cadence: text("cadence").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  commitments: many(commitments),
  checkIns: many(checkIns),
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

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  displayName: true,
  avatarPreset: true,
});

export const insertCommitmentSchema = createInsertSchema(commitments).pick({
  title: true,
  category: true,
  cadence: true,
  startDate: true,
  endDate: true,
});

export const insertCheckInSchema = createInsertSchema(checkIns).pick({
  commitmentId: true,
  note: true,
  mediaUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type Commitment = typeof commitments.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
