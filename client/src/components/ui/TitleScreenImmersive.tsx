import { useEffect, useState, useRef } from "react";
import { useRally } from "@/lib/stores/useRally";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";
import { TitleScene3D } from "./TitleScene3D";
import { HolographicPanel } from "./HolographicPanel";
import { Leaderboard } from "./Leaderboard";
import { FullscreenButton } from "./FullscreenButton";
import { audioManager } from "@/lib/audio";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface TitleScreenImmersiveProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isFullscreenSupported: boolean;
  onStartRace: () => void;
}

export function TitleScreenImmersive({ isFullscreen, onToggleFullscreen, isFullscreenSupported, onStartRace }: TitleScreenImmersiveProps) {
  const { highScore, loadHighScore, showTutorial } = useRally();
  const [isMobile, setIsMobile] = useState(false);
  const musicStartedRef = useRef(false);
  const { t } = useTranslation();

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      audioManager.stopBackgroundMusic();
      musicStartedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") onStartRace();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onStartRace]);

  return (
    <div
      onClick={handleStartMusic}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        color: DREAM_NEXUS_COLORS.white,
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      <TitleScene3D />

      <FullscreenButton isFullscreen={isFullscreen} onClick={onToggleFullscreen} isSupported={isFullscreenSupported} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {isMobile ? (
          <>
            {/* Mobile Layout */}
            {/* Title - Top */}
            <div style={{ 
              position: "absolute", 
              top: "10px", 
              left: "50%", 
              transform: "translateX(-50%)", 
              textAlign: "center",
              pointerEvents: "none",
              width: "100%",
              padding: "0 10px",
            }}>
              <img
                src="/dream-nexus-logo.png"
                alt="Dream Nexus"
                style={{
                  width: "80px",
                  height: "auto",
                  display: "block",
                  margin: "0 auto 4px",
                  filter: "drop-shadow(0 0 15px rgba(36, 160, 206, 0.5))",
                  animation: "logoFloat 3s ease-in-out infinite",
                }}
              />
              <h1
                style={{
                  fontFamily: "monospace",
                  fontSize: "20px",
                  letterSpacing: "0.05em",
                  color: DREAM_NEXUS_COLORS.cyan,
                  margin: "0",
                  textShadow: "0 0 20px rgba(36, 160, 206, 0.6)",
                  animation: "textGlow 2s ease-in-out infinite alternate",
                }}
              >
                DREAM NEXUS RALLY
              </h1>
            </div>

            {/* Buttons - Bottom Center */}
            <div style={{ 
              position: "absolute", 
              bottom: "20px", 
              left: "50%", 
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              pointerEvents: "auto",
              width: "calc(100% - 20px)",
              maxWidth: "400px",
            }}>
              {highScore > 0 && (
                <div
                  style={{
                    fontSize: "16px",
                    fontFamily: "monospace",
                    color: DREAM_NEXUS_COLORS.warm,
                    textAlign: "center",
                    textShadow: "0 0 10px rgba(253, 198, 181, 0.6)",
                  }}
                >
                  {t.yourHighScore}: {highScore}m
                </div>
              )}

              <button
                onClick={onStartRace}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: "20px",
                  padding: "18px 48px",
                  background: `linear-gradient(135deg, ${DREAM_NEXUS_COLORS.cyan}, #5dd6ff)`,
                  color: DREAM_NEXUS_COLORS.navy,
                  border: `2px solid #5dd6ff`,
                  borderRadius: "14px",
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(36, 160, 206, 0.6), 0 10px 25px rgba(0,0,0,0.4)",
                  transition: "all 0.3s ease",
                  textShadow: "0 2px 5px rgba(0,0,0,0.3)",
                }}
              >
                {t.startRace}
              </button>

              <button
                onClick={showTutorial}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: "16px",
                  padding: "14px 36px",
                  background: "rgba(74, 144, 226, 0.3)",
                  color: DREAM_NEXUS_COLORS.white,
                  border: "2px solid rgba(74, 144, 226, 0.6)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  boxShadow: "0 0 15px rgba(74, 144, 226, 0.3)",
                  transition: "all 0.3s ease",
                }}
              >
                {t.howToPlay}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Desktop Layout */}
            {/* Title - Top Center */}
            <div style={{ 
              position: "absolute", 
              top: "20px", 
              left: "50%", 
              transform: "translateX(-50%)", 
              textAlign: "center",
              pointerEvents: "none",
            }}>
              <img
                src="/dream-nexus-logo.png"
                alt="Dream Nexus"
                style={{
                  width: "clamp(120px, 15vw, 180px)",
                  height: "auto",
                  display: "block",
                  margin: "0 auto 8px",
                  filter: "drop-shadow(0 0 20px rgba(36, 160, 206, 0.5))",
                  animation: "logoFloat 3s ease-in-out infinite",
                }}
              />
              <h1
                style={{
                  fontFamily: "monospace",
                  fontSize: "clamp(24px, 3.5vw, 40px)",
                  letterSpacing: "0.05em",
                  color: DREAM_NEXUS_COLORS.cyan,
                  margin: "0 0 6px",
                  textShadow: "0 0 20px rgba(36, 160, 206, 0.6)",
                  animation: "textGlow 2s ease-in-out infinite alternate",
                }}
              >
                {t.title}
              </h1>
              <p
                style={{
                  fontSize: "clamp(12px, 1.5vw, 16px)",
                  color: DREAM_NEXUS_COLORS.warm,
                  margin: 0,
                  textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
                dangerouslySetInnerHTML={{ __html: t.tagline }}
              />
            </div>

            {/* Leaderboard - Top Right */}
            <div style={{ 
              position: "absolute", 
              top: "20px", 
              right: "20px",
              maxWidth: "320px",
              pointerEvents: "auto",
            }}>
              <HolographicPanel>
                <Leaderboard />
              </HolographicPanel>
            </div>

            {/* Buttons - Bottom Center */}
            <div style={{ 
              position: "absolute", 
              bottom: "30px", 
              left: "50%", 
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              pointerEvents: "auto",
              maxWidth: "500px",
            }}>
              {highScore > 0 && (
                <div
                  style={{
                    fontSize: "clamp(14px, 1.8vw, 18px)",
                    fontFamily: "monospace",
                    color: DREAM_NEXUS_COLORS.warm,
                    textAlign: "center",
                    textShadow: "0 0 10px rgba(253, 198, 181, 0.6)",
                  }}
                >
                  {t.yourHighScore}: {highScore}m
                </div>
              )}

              <button
                onClick={onStartRace}
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: "clamp(18px, 2.5vw, 24px)",
                  padding: "clamp(14px, 2vw, 18px) clamp(40px, 6vw, 60px)",
                  background: `linear-gradient(135deg, ${DREAM_NEXUS_COLORS.cyan}, #5dd6ff)`,
                  color: DREAM_NEXUS_COLORS.navy,
                  border: `2px solid #5dd6ff`,
                  borderRadius: "14px",
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(36, 160, 206, 0.6), 0 10px 25px rgba(0,0,0,0.4)",
                  transform: "translateZ(0)",
                  transition: "all 0.3s ease",
                  textShadow: "0 2px 5px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 0 40px rgba(36, 160, 206, 0.8), 0 15px 30px rgba(0,0,0,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(36, 160, 206, 0.6), 0 10px 25px rgba(0,0,0,0.4)";
                }}
              >
                {t.startRace}
              </button>

              <button
                onClick={showTutorial}
                style={{
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: "clamp(14px, 1.8vw, 18px)",
                  padding: "clamp(12px, 1.6vw, 14px) clamp(30px, 5vw, 40px)",
                  background: "rgba(74, 144, 226, 0.3)",
                  color: DREAM_NEXUS_COLORS.white,
                  border: "2px solid rgba(74, 144, 226, 0.6)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  boxShadow: "0 0 15px rgba(74, 144, 226, 0.3)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(74, 144, 226, 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 25px rgba(74, 144, 226, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(74, 144, 226, 0.3)";
                  e.currentTarget.style.boxShadow = "0 0 15px rgba(74, 144, 226, 0.3)";
                }}
              >
                {t.howToPlay}
              </button>

              <div
                style={{
                  fontSize: "clamp(10px, 1.3vw, 12px)",
                  color: DREAM_NEXUS_COLORS.warm,
                  opacity: 0.8,
                  textAlign: "center",
                }}
              >
                Press Enter to Start • Sponsored by Dream Nexus
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes hologramScan {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes textGlow {
          from { text-shadow: 0 0 20px rgba(36, 160, 206, 0.6); }
          to { text-shadow: 0 0 30px rgba(36, 160, 206, 0.9), 0 0 40px rgba(36, 160, 206, 0.5); }
        }
      `}</style>
    </div>
  );
}
