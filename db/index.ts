import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
neonConfig.pipelineConnect = false;

// Without DATABASE_URL the game still runs; the leaderboard falls back to memory.
export const db = process.env.DATABASE_URL
  ? drizzle(new Pool({ connectionString: process.env.DATABASE_URL }))
  : null;

if (!db) {
  console.warn("DATABASE_URL not set: leaderboard will be kept in memory and reset on restart.");
}
