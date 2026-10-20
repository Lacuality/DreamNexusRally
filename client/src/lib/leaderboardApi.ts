// Leaderboard access. Uses the game server when there is one; on static
// hosting (GitHub Pages) or when the server is unreachable, scores are kept
// in this browser instead.
import { storageGet, storageSet } from "./safeStorage";

export interface LeaderboardEntry {
  id: number;
  playerName: string;
  score: number;
  distance: number;
  createdAt: string;
}

const LOCAL_KEY = "dreamNexusRallyLeaderboard";
const STATIC_BUILD = import.meta.env.VITE_STATIC_HOST === "1";
const MAX_ENTRIES = 10;

function readLocal(): LeaderboardEntry[] {
  try {
    const parsed = JSON.parse(storageGet(LOCAL_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(entry: Omit<LeaderboardEntry, "id" | "createdAt">): LeaderboardEntry {
  const full: LeaderboardEntry = { ...entry, id: Date.now(), createdAt: new Date().toISOString() };
  const list = [...readLocal(), full].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  storageSet(LOCAL_KEY, JSON.stringify(list));
  return full;
}

async function serverJson(init?: RequestInit) {
  const res = await fetch("/api/leaderboard", init);
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("json")) throw new Error(`Leaderboard server unavailable (${res.status})`);
  return res.json();
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (STATIC_BUILD) return readLocal();
  try {
    return await serverJson();
  } catch {
    return readLocal();
  }
}

export async function submitScore(entry: Omit<LeaderboardEntry, "id" | "createdAt">) {
  if (STATIC_BUILD) return saveLocal(entry);
  try {
    return await serverJson({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch {
    return saveLocal(entry);
  }
}
