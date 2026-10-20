import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { audioManager } from "@/lib/audio";

export interface ScorePopup {
  id: number;
  text: string;
  color: string;
  label?: "closeCall";
}

// Jars picked up within this window keep the combo going.
const COMBO_WINDOW_MS = 4000;
const MAX_COMBO = 5;
export const NEAR_MISS_POINTS = 25;

let popupId = 0;

// Browser storage can be blocked (private mode, embedded pages); never let that crash the game.
function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

// Per-run scoring state, cleared at the start of every race.
function freshRunStats() {
  return { bonusPoints: 0, combo: 0, lastJarTime: 0, popups: [] as ScorePopup[] };
}

export function liveScore(distance: number, jars: number, bonus: number) {
  return Math.floor(distance) + jars * 50 + bonus;
}

export type RallyPhase = "menu" | "loading" | "tutorial" | "playing" | "paused" | "gameover";

interface RallyState {
  phase: RallyPhase;
  distance: number;
  speed: number;
  highScore: number;
  currentScore: number;
  collectiblesCount: number;
  startTime: number;
  playerName: string;
  scoreSubmitted: boolean;
  countdown: number;
  isCountingDown: boolean;
  tutorialReturnPhase: RallyPhase | null;
  bonusPoints: number;
  combo: number;
  lastJarTime: number;
  popups: ScorePopup[];
  
  addNearMiss: () => void;
  addPopup: (text: string, color: string, label?: ScorePopup["label"]) => void;

  start: () => void;
  pause: () => void;
  resume: () => void;
  gameOver: () => void;
  restart: () => void;
  updateDistance: (distance: number) => void;
  updateSpeed: (speed: number) => void;
  addCollectible: () => void;
  loadHighScore: () => void;
  saveHighScore: () => void;
  setPlayerName: (name: string) => void;
  loadPlayerName: () => void;
  setCountdown: (count: number) => void;
  startCountdown: () => void;
  startLoading: () => void;
  finishLoading: () => void;
  showTutorial: () => void;
  closeTutorial: () => void;
}

export const useRally = create<RallyState>()(
  subscribeWithSelector((set, get) => ({
    phase: "menu",
    distance: 0,
    speed: 0,
    highScore: 0,
    currentScore: 0,
    collectiblesCount: 0,
        ...freshRunStats(),
    startTime: 0,
    playerName: "",
    scoreSubmitted: false,
    countdown: 3,
    isCountingDown: false,
    tutorialReturnPhase: null,
    
    startLoading: () => {
      audioManager.stopBackgroundMusic();
      set({ 
        phase: "loading",
        distance: 0,
        speed: 0,
        currentScore: 0,
        collectiblesCount: 0,
        ...freshRunStats(),
        isCountingDown: false,
        countdown: 3
      });
    },
    
    finishLoading: () => {
      const tutorialShown = sessionStorage.getItem("tutorialShown");
      console.log("[finishLoading] tutorialShown in sessionStorage:", tutorialShown);
      if (!tutorialShown) {
        console.log("[finishLoading] First time - showing tutorial");
        set({ phase: "tutorial", tutorialReturnPhase: "loading" });
      } else {
        console.log("[finishLoading] Tutorial already shown - starting game");
        const now = Date.now();
        set({ 
          phase: "playing",
          isCountingDown: true, 
          countdown: 3,
          startTime: now
        });
      }
    },
    
    showTutorial: () => {
      const currentPhase = get().phase;
      set({ phase: "tutorial", tutorialReturnPhase: currentPhase });
    },
    
    closeTutorial: () => {
      const state = get();
      const returnPhase = state.tutorialReturnPhase;
      
      if (returnPhase === "menu") {
        set({ phase: "menu", tutorialReturnPhase: null });
      } else if (returnPhase === "paused") {
        set({ phase: "paused", tutorialReturnPhase: null });
      } else if (returnPhase === "loading") {
        const now = Date.now();
        set({ 
          phase: "playing",
          isCountingDown: true, 
          countdown: 3,
          startTime: now,
          tutorialReturnPhase: null
        });
      } else {
        set({ phase: "menu", tutorialReturnPhase: null });
      }
    },
    
    startCountdown: () => {
      const now = Date.now();
      audioManager.stopBackgroundMusic();
      set({ 
        phase: "playing",
        isCountingDown: true, 
        countdown: 3,
        distance: 0,
        speed: 0,
        currentScore: 0,
        collectiblesCount: 0,
        ...freshRunStats(),
        startTime: now
      });
    },
    
    setCountdown: (count: number) => {
      set({ countdown: count });
      if (count === 0) {
        setTimeout(() => {
          set({ isCountingDown: false });
          get().start();
        }, 1000);
      }
    },
    
    start: () => {
      const now = Date.now();
      set({
        phase: "playing",
        distance: 0,
        speed: 0,
        currentScore: 0,
        collectiblesCount: 0,
        ...freshRunStats(),
        startTime: now,
        isCountingDown: false
      });
    },
    
    pause: () => {
      set((state) => state.phase === "playing" ? { phase: "paused" } : {});
    },
    
    resume: () => {
      set((state) => state.phase === "paused" ? { phase: "playing" } : {});
    },
    
    gameOver: () => {
      const state = get();
      if (state.phase === "playing") {
        const finalScore = liveScore(state.distance, state.collectiblesCount, state.bonusPoints);
        const newHighScore = Math.max(finalScore, state.highScore);
        
        if (newHighScore > state.highScore) {
          writeStorage("dreamNexusRallyHighScore", String(newHighScore));
        }
        
        audioManager.stopEngineSound();
        
        set({ phase: "gameover", currentScore: finalScore, highScore: newHighScore, scoreSubmitted: false });
        
        if (state.playerName && finalScore > 0) {
          fetch("/api/leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerName: state.playerName,
              score: finalScore,
              distance: Math.floor(state.distance),
            }),
          })
            .then(response => {
              if (response.ok) {
                return response.json();
              }
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            })
            .then(data => {
              console.log("Score submitted:", data);
              set({ scoreSubmitted: true });
            })
            .catch(err => {
              console.error("Failed to submit score:", err);
            });
        }
      }
    },
    
    restart: () => {
      audioManager.playBackgroundMusic();
      set({ phase: "menu", distance: 0, speed: 0, currentScore: 0, collectiblesCount: 0,
        ...freshRunStats(), scoreSubmitted: false });
    },
    
    updateDistance: (distance: number) => {
      set({ distance });
    },
    
    updateSpeed: (speed: number) => {
      set({ speed });
    },
    
    addCollectible: () => {
      const now = Date.now();
      const state = get();
      const combo = now - state.lastJarTime < COMBO_WINDOW_MS ? Math.min(state.combo + 1, MAX_COMBO) : 1;
      const points = 50 * combo;
      set({
        collectiblesCount: state.collectiblesCount + 1,
        currentScore: state.currentScore + points,
        // Base 50 per jar is counted from collectiblesCount; the combo extra goes to bonus.
        bonusPoints: state.bonusPoints + (points - 50),
        combo,
        lastJarTime: now,
      });
      get().addPopup(combo > 1 ? `+${points}  x${combo}` : `+${points}`, "#FDC6B5");
    },

    addNearMiss: () => {
      set((state) => ({ bonusPoints: state.bonusPoints + NEAR_MISS_POINTS }));
      get().addPopup(`+${NEAR_MISS_POINTS}`, "#24A0CE", "closeCall");
    },

    addPopup: (text: string, color: string, label?: ScorePopup["label"]) => {
      const id = ++popupId;
      set((state) => ({ popups: [...state.popups.slice(-3), { id, text, color, label }] }));
      setTimeout(() => {
        set((state) => ({ popups: state.popups.filter((p) => p.id !== id) }));
      }, 1200);
    },
    
    loadHighScore: () => {
      const saved = readStorage("dreamNexusRallyHighScore");
      const highScore = saved ? parseInt(saved, 10) : 0;
      set({ highScore });
    },
    
    saveHighScore: () => {
      const { currentScore, highScore } = get();
      const newHighScore = Math.max(currentScore, highScore);
      writeStorage("dreamNexusRallyHighScore", String(newHighScore));
      set({ highScore: newHighScore });
    },
    
    setPlayerName: (name: string) => {
      set({ playerName: name });
      writeStorage("dreamNexusRallyPlayerName", name);
    },
    
    loadPlayerName: () => {
      const saved = readStorage("dreamNexusRallyPlayerName");
      if (saved) {
        set({ playerName: saved });
      }
    }
  }))
);
