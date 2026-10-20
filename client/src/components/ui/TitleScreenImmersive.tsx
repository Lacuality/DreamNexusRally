import { useEffect, useRef, useState } from "react";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900-italic.css";
import { useRally } from "@/lib/stores/useRally";
import { TitleScene3D } from "./TitleScene3D";
import { ErrorBoundary } from "./ErrorBoundary";
import { HolographicPanel } from "./HolographicPanel";
import { Leaderboard } from "./Leaderboard";
import { audioManager } from "@/lib/audio";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface TitleScreenImmersiveProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isFullscreenSupported: boolean;
  onStartRace: () => void;
  /** True while Pixel is climbing into the car; the menu UI fades away. */
  boarding?: boolean;
  onBoarded?: () => void;
}

export function TitleScreenImmersive({
  isFullscreen,
  onToggleFullscreen,
  isFullscreenSupported,
  onStartRace,
  boarding = false,
  onBoarded,
}: TitleScreenImmersiveProps) {
  const { highScore, loadHighScore, showTutorial } = useRally();
  const [isMobile, setIsMobile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const musicStartedRef = useRef(false);
  const { t, language, setLanguage } = useTranslation();

  const handleStartMusic = () => {
    if (!musicStartedRef.current) {
      audioManager.playBackgroundMusic();
      musicStartedRef.current = true;
    }
  };

  useEffect(() => {
    loadHighScore();
  }, [loadHighScore]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
      audioManager.stopBackgroundMusic();
      musicStartedRef.current = false;
    };
  }, []);

  const leaderboardOpen = !isMobile || showLeaderboard;

  return (
    <div className="dnr-menu" onClick={handleStartMusic}>
      <style>{MENU_CSS}</style>
      {/* If the 3D menu scene can't load on this device, keep the menu usable. */}
      <ErrorBoundary fallback={<MenuSceneFallback boarding={boarding} onBoarded={onBoarded} />}>
        <TitleScene3D boarding={boarding} onBoarded={onBoarded} />
      </ErrorBoundary>

      <div className={`dnr-menu-ui${boarding ? " is-boarding" : ""}`}>
        <div className="dnr-scrim-top" />
        <div className="dnr-scrim-bottom" />

        {/* Brand */}
        <header className="dnr-brand">
          <div className="dnr-brand-kicker">
            <img src="/dream-nexus-logo.png" alt="" />
            <span>DREAM NEXUS</span>
          </div>
          <h1 className="dnr-brand-title">
            RALLY<span className="dnr-brand-stripe" aria-hidden="true" />
          </h1>
          <p className="dnr-brand-tagline">{t.menu.tagline}</p>
        </header>

        {/* Top-right controls */}
        <div className="dnr-top-actions">
          <div className="dnr-lang" role="group" aria-label="Language">
            {(["en", "es"] as const).map((lang) => (
              <button
                key={lang}
                className={language === lang ? "is-active" : ""}
                onClick={() => setLanguage(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          {isMobile && (
            <button
              className={`dnr-icon-btn${showLeaderboard ? " is-active" : ""}`}
              onClick={() => setShowLeaderboard((v) => !v)}
              aria-label={t.menu.leaderboard}
            >
              🏆
            </button>
          )}
          {isFullscreenSupported && (
            <button className="dnr-icon-btn" onClick={onToggleFullscreen} aria-label="Fullscreen">
              {isFullscreen ? "⤡" : "⤢"}
            </button>
          )}
        </div>

        {/* Leaderboard */}
        {leaderboardOpen && (
          <aside className={`dnr-board${isMobile ? " is-mobile" : ""}`}>
            <HolographicPanel>
              <Leaderboard />
            </HolographicPanel>
          </aside>
        )}

        {/* Start */}
        <div className="dnr-start">
          {highScore > 0 && (
            <div className="dnr-best">
              <span>{t.menu.best}</span>
              <strong>{highScore.toLocaleString()}</strong>
            </div>
          )}
          <button className="dnr-cta" onClick={onStartRace}>
            <span className="dnr-cta-label">{t.menu.start}</span>
            <span className="dnr-cta-chevrons" aria-hidden="true">›››</span>
          </button>
          <button className="dnr-secondary" onClick={showTutorial}>
            {t.menu.howToPlay}
          </button>
        </div>
      </div>

      {boarding && <div className="dnr-boarding-caption">{t.menu.boarding}</div>}
    </div>
  );
}

/** Plain backdrop used when the 3D menu scene fails; still finishes the boarding step. */
function MenuSceneFallback({ boarding, onBoarded }: { boarding: boolean; onBoarded?: () => void }) {
  useEffect(() => {
    if (!boarding) return;
    const id = setTimeout(() => onBoarded?.(), 600);
    return () => clearTimeout(id);
  }, [boarding, onBoarded]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(120% 90% at 70% 100%, #2f7a33, #163a4c 55%, #0e1b24)",
      }}
    />
  );
}

const MENU_CSS = `
.dnr-menu {
  --navy: #0e1b24;
  --cyan: #24a0ce;
  --warm: #fdc6b5;
  --sun: #ffb347;
  --ink: #ffffff;
  position: fixed; inset: 0; z-index: 1000; overflow: hidden;
  background: var(--navy); color: var(--ink);
  font-family: Inter, system-ui, sans-serif;
}
.dnr-menu-ui { position: absolute; inset: 0; z-index: 10; pointer-events: none; transition: opacity .45s ease, transform .45s ease; }
.dnr-menu-ui.is-boarding { opacity: 0; transform: translateY(12px); }
.dnr-menu-ui > * { pointer-events: auto; }
.dnr-menu-ui > .dnr-scrim-top, .dnr-menu-ui > .dnr-scrim-bottom { pointer-events: none; }
.dnr-scrim-top { position: absolute; inset: 0 0 auto 0; height: 34%; background: linear-gradient(rgba(8,18,26,.55), rgba(8,18,26,0)); }
.dnr-scrim-bottom { position: absolute; inset: auto 0 0 0; height: 42%; background: linear-gradient(rgba(8,18,26,0), rgba(8,18,26,.7)); }

.dnr-brand { position: absolute; top: max(20px, env(safe-area-inset-top)); left: max(24px, env(safe-area-inset-left)); pointer-events: none; }
.dnr-brand-kicker { display: flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: .32em; font-size: 13px; color: var(--cyan); text-shadow: 0 1px 8px rgba(0,0,0,.4); }
.dnr-brand-kicker img { width: 34px; height: auto; filter: drop-shadow(0 0 10px rgba(36,160,206,.6)); }
.dnr-brand-title { position: relative; margin: 2px 0 0; font-size: clamp(64px, 10vw, 128px); line-height: .9; font-weight: 900; font-style: italic; letter-spacing: -.02em; color: var(--ink); text-shadow: 0 6px 24px rgba(0,0,0,.35); animation: dnr-in .7s cubic-bezier(.2,.8,.2,1) both; }
.dnr-brand-stripe { position: absolute; left: 4px; right: -18px; bottom: -10px; height: 10px; transform: skewX(-24deg); background: linear-gradient(90deg, #fcd116 0 50%, #003893 50% 75%, #ce1126 75%); box-shadow: 0 4px 14px rgba(0,0,0,.3); }
.dnr-brand-tagline { margin: 22px 0 0; font-size: 15px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--warm); text-shadow: 0 1px 8px rgba(0,0,0,.45); }

.dnr-top-actions { position: absolute; top: max(18px, env(safe-area-inset-top)); right: max(20px, env(safe-area-inset-right)); display: flex; gap: 8px; align-items: center; }
.dnr-lang { display: flex; background: rgba(14,27,36,.72); border: 1px solid rgba(36,160,206,.6); border-radius: 999px; padding: 3px; backdrop-filter: blur(8px); }
.dnr-lang button { border: 0; background: transparent; color: #cfe6ef; font: 800 12px Inter, sans-serif; letter-spacing: .1em; padding: 8px 12px; border-radius: 999px; cursor: pointer; min-height: 32px; }
.dnr-lang button.is-active { background: var(--cyan); color: var(--navy); }
.dnr-icon-btn { width: 40px; height: 40px; border-radius: 999px; border: 1px solid rgba(36,160,206,.6); background: rgba(14,27,36,.72); color: var(--ink); font-size: 18px; cursor: pointer; backdrop-filter: blur(8px); }
.dnr-icon-btn.is-active { background: var(--cyan); }

.dnr-board { position: absolute; bottom: max(24px, env(safe-area-inset-bottom)); right: max(20px, env(safe-area-inset-right)); width: min(280px, 28vw); max-height: 44vh; overflow: auto; animation: dnr-in .6s .15s cubic-bezier(.2,.8,.2,1) both; }
.dnr-board.is-mobile { top: 70px; bottom: auto; left: 16px; right: 16px; width: auto; max-height: 60vh; }

.dnr-start { position: absolute; left: max(24px, env(safe-area-inset-left)); bottom: max(28px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; align-items: flex-start; gap: 12px; animation: dnr-in .7s .1s cubic-bezier(.2,.8,.2,1) both; }
.dnr-best { display: inline-flex; gap: 10px; align-items: baseline; padding: 6px 12px; border-radius: 6px; background: rgba(14,27,36,.7); border-left: 3px solid var(--sun); font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #cfe6ef; }
.dnr-best strong { font-size: 18px; letter-spacing: 0; color: var(--ink); font-variant-numeric: tabular-nums; }
.dnr-cta { position: relative; display: inline-flex; align-items: center; gap: 18px; padding: 18px 34px 18px 30px; border: 0; cursor: pointer; transform: skewX(-12deg); background: linear-gradient(100deg, #fcd116, var(--sun) 55%, #ff7a45); color: #1b1206; box-shadow: 0 10px 30px rgba(255,140,60,.45), inset 0 -4px 0 rgba(0,0,0,.18); transition: transform .15s ease, box-shadow .15s ease; }
.dnr-cta > * { transform: skewX(12deg); }
.dnr-cta:hover { transform: skewX(-12deg) translateY(-2px); box-shadow: 0 14px 36px rgba(255,140,60,.55), inset 0 -4px 0 rgba(0,0,0,.18); }
.dnr-cta:active { transform: skewX(-12deg) translateY(1px); }
.dnr-cta:focus-visible, .dnr-secondary:focus-visible, .dnr-lang button:focus-visible, .dnr-icon-btn:focus-visible { outline: 3px solid var(--cyan); outline-offset: 3px; }
.dnr-cta-label { font-size: 28px; font-weight: 900; font-style: italic; letter-spacing: .02em; }
.dnr-cta-chevrons { font-size: 30px; font-weight: 900; letter-spacing: -.1em; animation: dnr-chev 1.1s ease-in-out infinite; }
.dnr-secondary { border: 0; background: none; color: #e6f3f8; font: 800 13px Inter, sans-serif; letter-spacing: .16em; text-transform: uppercase; padding: 8px 2px; cursor: pointer; border-bottom: 2px solid rgba(36,160,206,.8); }

.dnr-boarding-caption { position: absolute; left: 50%; bottom: max(36px, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 11; font-weight: 900; font-style: italic; font-size: 20px; letter-spacing: .04em; color: var(--ink); text-shadow: 0 2px 12px rgba(0,0,0,.6); animation: dnr-in .5s .2s both; white-space: nowrap; }

@keyframes dnr-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes dnr-chev { 0%,100% { transform: skewX(12deg) translateX(0); } 50% { transform: skewX(12deg) translateX(6px); } }
@media (prefers-reduced-motion: reduce) { .dnr-brand-title, .dnr-board, .dnr-start, .dnr-boarding-caption, .dnr-cta-chevrons { animation: none; } }

@media (max-width: 767px) {
  .dnr-brand { left: 16px; top: calc(66px + env(safe-area-inset-top)); }
  .dnr-brand-title { font-size: 60px; }
  .dnr-brand-kicker { font-size: 11px; letter-spacing: .26em; }
  .dnr-brand-kicker img { width: 26px; }
  .dnr-brand-tagline { font-size: 11px; margin-top: 18px; }
  .dnr-top-actions { right: 12px; }
  .dnr-start { left: 16px; right: 16px; align-items: stretch; }
  .dnr-best { align-self: flex-start; }
  .dnr-cta { justify-content: center; }
  .dnr-cta-label { font-size: 24px; }
  .dnr-secondary { align-self: center; }
}
`;
