import {
  users,
  commitments,
  checkIns,
  dopamineChecklistEntries,
  stoicQuotes,
  pushTokens,
  type User,
  type InsertUser,
  type UpdateUserProfile,
  type Commitment,
  type InsertCommitment,
  type CheckIn,
  type InsertCheckIn,
  type DopamineEntry,
  type InsertDopamineEntry,
  type StoicQuote,
  type PushToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lt, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  updateUserProfile(id: string, data: UpdateUserProfile): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  getCommitments(userId: string): Promise<Commitment[]>;
  getCommitment(id: string): Promise<Commitment | undefined>;
  createCommitment(userId: string, data: InsertCommitment): Promise<Commitment>;
  updateCommitment(id: string, data: Partial<Commitment>): Promise<Commitment | undefined>;
  deleteCommitment(id: string): Promise<void>;

  getCheckIns(commitmentId: string): Promise<CheckIn[]>;
  getLatestCheckIn(commitmentId: string): Promise<CheckIn | undefined>;
  createCheckIn(userId: string, data: InsertCheckIn): Promise<CheckIn>;
  getTodayCheckIns(userId: string, today: string): Promise<CheckIn[]>;

  getDopamineEntry(userId: string, date: string): Promise<DopamineEntry | undefined>;
  getDopamineEntries(userId: string, limit?: number): Promise<DopamineEntry[]>;
  upsertDopamineEntry(userId: string, data: InsertDopamineEntry): Promise<DopamineEntry>;

  getRandomStoicQuote(tags?: string[]): Promise<StoicQuote | undefined>;

  savePushToken(userId: string, token: string, platform?: string, deviceId?: string): Promise<PushToken>;
  getPushTokens(userId: string): Promise<PushToken[]>;
  getAllActivePushTokens(): Promise<PushToken[]>;
  deactivatePushToken(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserProfile(id: string, data: UpdateUserProfile): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(pushTokens).where(eq(pushTokens.userId, id));
    await db.delete(dopamineChecklistEntries).where(eq(dopamineChecklistEntries.userId, id));
    await db.delete(checkIns).where(eq(checkIns.userId, id));
    await db.delete(commitments).where(eq(commitments.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserOnboarding(
    id: string,
    data: {
      identityArchetype?: string;
      habitProfileType?: string;
      motivations?: string[];
      focusArea?: string;
      tonePreferences?: string[];
      relapseTriggers?: string[];
      rewardStyle?: string[];
      environmentRisks?: string[];
      changeStyle?: string;
      primaryGoalCategory?: string;
      primaryGoalReason?: string;
      preferredCadence?: string;
    }
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        onboardingCompleted: true,
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getCommitments(userId: string): Promise<Commitment[]> {
    return db
      .select()
      .from(commitments)
      .where(eq(commitments.userId, userId))
      .orderBy(desc(commitments.createdAt));
  }

  async getCommitment(id: string): Promise<Commitment | undefined> {
    const [commitment] = await db
      .select()
      .from(commitments)
      .where(eq(commitments.id, id));
    return commitment || undefined;
  }

  async createCommitment(userId: string, data: InsertCommitment): Promise<Commitment> {
    const [commitment] = await db
      .insert(commitments)
      .values({ ...data, userId })
      .returning();
    return commitment;
  }

  async updateCommitment(
    id: string,
    data: Partial<Commitment>
  ): Promise<Commitment | undefined> {
    const [commitment] = await db
      .update(commitments)
      .set(data)
      .where(eq(commitments.id, id))
      .returning();
    return commitment || undefined;
  }

  async deleteCommitment(id: string): Promise<void> {
    await db.delete(commitments).where(eq(commitments.id, id));
  }

  async getCheckIns(commitmentId: string): Promise<CheckIn[]> {
    return db
      .select()
      .from(checkIns)
      .where(eq(checkIns.commitmentId, commitmentId))
      .orderBy(desc(checkIns.createdAt));
  }

  async getLatestCheckIn(commitmentId: string): Promise<CheckIn | undefined> {
    const [checkIn] = await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.commitmentId, commitmentId))
      .orderBy(desc(checkIns.createdAt))
      .limit(1);
    return checkIn || undefined;
  }

  async createCheckIn(userId: string, data: InsertCheckIn): Promise<CheckIn> {
    const [checkIn] = await db
      .insert(checkIns)
      .values({ ...data, userId, hasPhoto: !!data.mediaUrl })
      .returning();
    return checkIn;
  }

  async getTodayCheckIns(userId: string, today: string): Promise<CheckIn[]> {
    const startOfDay = new Date(today + "T00:00:00.000Z");
    const endOfDay = new Date(today + "T23:59:59.999Z");
    
    return db
      .select()
      .from(checkIns)
      .where(
        and(
          eq(checkIns.userId, userId),
          gte(checkIns.createdAt, startOfDay),
          lt(checkIns.createdAt, endOfDay)
        )
      )
      .orderBy(desc(checkIns.createdAt));
  }

  async getDopamineEntry(userId: string, date: string): Promise<DopamineEntry | undefined> {
    const [entry] = await db
      .select()
      .from(dopamineChecklistEntries)
      .where(
        and(
          eq(dopamineChecklistEntries.userId, userId),
          eq(dopamineChecklistEntries.date, date)
        )
      );
    return entry || undefined;
  }

  async getDopamineEntries(userId: string, limit: number = 30): Promise<DopamineEntry[]> {
    return db
      .select()
      .from(dopamineChecklistEntries)
      .where(eq(dopamineChecklistEntries.userId, userId))
      .orderBy(desc(dopamineChecklistEntries.date))
      .limit(limit);
  }

  async upsertDopamineEntry(userId: string, data: InsertDopamineEntry): Promise<DopamineEntry> {
    const existing = await this.getDopamineEntry(userId, data.date as string);
    
    if (existing) {
      const [entry] = await db
        .update(dopamineChecklistEntries)
        .set(data)
        .where(eq(dopamineChecklistEntries.id, existing.id))
        .returning();
      return entry;
    }
    
    const [entry] = await db
      .insert(dopamineChecklistEntries)
      .values({ ...data, userId })
      .returning();
    return entry;
  }

  async getRandomStoicQuote(tags?: string[]): Promise<StoicQuote | undefined> {
    const [quote] = await db
      .select()
      .from(stoicQuotes)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return quote || undefined;
  }

  async updateUserStripeInfo(
    userId: string,
    stripeInfo: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      plan?: string;
    }
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(stripeInfo)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async savePushToken(userId: string, token: string, platform?: string, deviceId?: string): Promise<PushToken> {
    const existing = await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.token, token));

    if (existing.length > 0) {
      const [updated] = await db
        .update(pushTokens)
        .set({ userId, platform, deviceId, active: true, updatedAt: new Date() })
        .where(eq(pushTokens.token, token))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(pushTokens)
      .values({ userId, token, platform, deviceId })
      .returning();
    return created;
  }

  async getPushTokens(userId: string): Promise<PushToken[]> {
    return db
      .select()
      .from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.active, true)));
  }

  async getAllActivePushTokens(): Promise<PushToken[]> {
    return db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.active, true));
  }

  async deactivatePushToken(token: string): Promise<void> {
    await db
      .update(pushTokens)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(pushTokens.token, token));
  }
}

export const storage = new DatabaseStorage();
