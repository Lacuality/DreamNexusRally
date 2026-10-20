import { users, type User, type InsertUser, leaderboard, type Leaderboard, type InsertLeaderboard } from "@shared/schema";
import { db } from "../db";
import { desc, eq, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getTopLeaderboard(limit: number): Promise<Leaderboard[]>;
  upsertLeaderboardScore(score: InsertLeaderboard): Promise<Leaderboard>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private memLeaderboard: Map<string, Leaderboard>;
  currentId: number;
  currentLeaderboardId: number;

  constructor() {
    this.users = new Map();
    this.memLeaderboard = new Map();
    this.currentId = 1;
    this.currentLeaderboardId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTopLeaderboard(limit: number): Promise<Leaderboard[]> {
    if (!db) {
      return Array.from(this.memLeaderboard.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }
    const results = await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.score))
      .limit(limit);
    return results;
  }

  async upsertLeaderboardScore(scoreData: InsertLeaderboard): Promise<Leaderboard> {
    if (!db) {
      const existing = this.memLeaderboard.get(scoreData.playerName);
      if (existing && existing.score >= scoreData.score) return existing;
      const entry: Leaderboard = {
        id: existing?.id ?? this.currentLeaderboardId++,
        ...scoreData,
        createdAt: new Date(),
      };
      this.memLeaderboard.set(scoreData.playerName, entry);
      return entry;
    }
    const [result] = await db
      .insert(leaderboard)
      .values(scoreData)
      .onConflictDoUpdate({
        target: leaderboard.playerName,
        set: {
          score: sql`CASE WHEN ${leaderboard.score} < ${scoreData.score} THEN ${scoreData.score} ELSE ${leaderboard.score} END`,
          distance: sql`CASE WHEN ${leaderboard.score} < ${scoreData.score} THEN ${scoreData.distance} ELSE ${leaderboard.distance} END`,
          createdAt: sql`CASE WHEN ${leaderboard.score} < ${scoreData.score} THEN NOW() ELSE ${leaderboard.createdAt} END`,
        },
      })
      .returning();
    return result;
  }
}

export const storage = new MemStorage();
