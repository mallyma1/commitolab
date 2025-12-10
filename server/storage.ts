import {
  users,
  commitments,
  checkIns,
  type User,
  type InsertUser,
  type Commitment,
  type InsertCommitment,
  type CheckIn,
  type InsertCheckIn,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  getCommitments(userId: string): Promise<Commitment[]>;
  getCommitment(id: string): Promise<Commitment | undefined>;
  createCommitment(userId: string, data: InsertCommitment): Promise<Commitment>;
  updateCommitment(id: string, data: Partial<Commitment>): Promise<Commitment | undefined>;
  deleteCommitment(id: string): Promise<void>;

  getCheckIns(commitmentId: string): Promise<CheckIn[]>;
  getLatestCheckIn(commitmentId: string): Promise<CheckIn | undefined>;
  createCheckIn(userId: string, data: InsertCheckIn): Promise<CheckIn>;
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
      .values({ ...data, userId })
      .returning();
    return checkIn;
  }
}

export const storage = new DatabaseStorage();
