import { useRally, liveScore } from "@/lib/stores/useRally";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useState, useEffect } from "react";

interface GameHUDProps {
  nitroActive?: boolean;
  shieldActive?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function GameHUD({ nitroActive = false, shieldActive = false, isFullscreen = false, onToggleFullscreen }: GameHUDProps = {}) {
  const { distance, speed, highScore, collectiblesCount, bonusPoints, combo, pause } = useRally();
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        fontFamily: "monospace",
        zIndex: 100,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          backgroundColor: "rgba(14, 27, 36, 0.8)",
          padding: "15px 20px",
          borderRadius: "10px",
          color: DREAM_NEXUS_COLORS.white,
          fontSize: "18px",
          border: `2px solid ${DREAM_NEXUS_COLORS.cyan}`,
        }}
      >
        <div style={{ marginBottom: "8px", color: DREAM_NEXUS_COLORS.cyan }}>
          <strong>{t.hud.distance}:</strong> {Math.floor(distance)}m
        </div>
        <div style={{ marginBottom: "8px", color: DREAM_NEXUS_COLORS.warm }}>
          <strong>{t.hud.speed}:</strong> {Math.floor(speed)} km/h
        </div>
        <div style={{ marginBottom: "8px", color: DREAM_NEXUS_COLORS.warm }}>
          <strong>{t.hud.arequipeJars}:</strong> {collectiblesCount}
        </div>
        <div style={{ marginBottom: "8px", color: DREAM_NEXUS_COLORS.cyan }}>
          <strong>{t.hud.score}:</strong> {liveScore(distance, collectiblesCount, bonusPoints)}{combo > 1 ? `  x${combo}` : ""}
        </div>
        <div style={{ color: DREAM_NEXUS_COLORS.white }}>
          <strong>{t.hud.highScore}:</strong> {highScore}
        </div>
      </div>
      
      <div
        style={{
          position: "absolute",
          top: isMobile ? "200px" : "20px",
          right: isMobile ? "10px" : "20px",
          pointerEvents: "auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "8px",
        }}
      >
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            style={{
              backgroundColor: DREAM_NEXUS_COLORS.warm,
              color: DREAM_NEXUS_COLORS.navy,
              border: "none",
              borderRadius: "8px",
              padding: isMobile ? "10px 14px" : "10px 20px",
              fontSize: isMobile ? "12px" : "16px",
              fontWeight: "bold",
              cursor: "pointer",
              fontFamily: "monospace",
              whiteSpace: "nowrap",
            }}
          >
            {isMobile ? (isFullscreen ? "⛉" : "⛶") : (isFullscreen ? t.hud.exitFullscreen : t.hud.enterFullscreen)}
          </button>
        )}
        <button
          onClick={pause}
          style={{
            backgroundColor: DREAM_NEXUS_COLORS.cyan,
            color: DREAM_NEXUS_COLORS.navy,
            border: "none",
            borderRadius: "8px",
            padding: isMobile ? "10px 14px" : "10px 20px",
            fontSize: isMobile ? "12px" : "16px",
            fontWeight: "bold",
            cursor: "pointer",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
          }}
        >
          {isMobile ? "⏸" : t.hud.pause}
        </button>
      </div>
      
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          display: "flex",
          gap: "12px",
        }}
      >
        {nitroActive && (
          <div
            style={{
              backgroundColor: "rgba(255, 107, 0, 0.9)",
              padding: "12px 18px",
              borderRadius: "10px",
              border: "3px solid #ff6b00",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              animation: "pulse 0.5s ease-in-out infinite",
            }}
          >
            <div style={{ 
              width: "24px", 
              height: "24px", 
              background: "linear-gradient(180deg, #ffff00 0%, #ff6b00 100%)",
              borderRadius: "50%",
              boxShadow: "0 0 10px #ff6b00"
            }} />
            {t.hud.nitroBoost}
          </div>
        )}
        
        {shieldActive && (
          <div
            style={{
              backgroundColor: "rgba(36, 160, 206, 0.9)",
              padding: "12px 18px",
              borderRadius: "10px",
              border: "3px solid #24A0CE",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div style={{ 
              width: "24px", 
              height: "24px", 
              background: "linear-gradient(135deg, #24A0CE 0%, #0E1B24 100%)",
              borderRadius: "50%",
              boxShadow: "0 0 10px #24A0CE"
            }} />
            {t.hud.shieldActive}
          </div>
        )}
      </div>
      
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "rgba(14, 27, 36, 0.8)",
          padding: "10px 15px",
          borderRadius: "8px",
        }}
      >
        <img
          src="/pixel-bunny.png"
          alt="Pixel"
          style={{ width: "40px", height: "40px", objectFit: "contain" }}
        />
        <img
          src="/dream-nexus-logo.png"
          alt="Dream Nexus"
          style={{ width: "120px", objectFit: "contain" }}
        />
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
