import { useRally } from "@/lib/stores/useRally";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";
import { useEffect, useState } from "react";
import { SettingsPanel } from "./SettingsPanel";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function PauseMenu() {
  const { resume, restart, showTutorial } = useRally();
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation();
  
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "p" || e.key === "P") {
      resume();
    }
  };
  
  useEffect(() => {
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);
  
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(14, 27, 36, 0.95)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          fontFamily: "monospace",
          color: DREAM_NEXUS_COLORS.white,
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            color: DREAM_NEXUS_COLORS.cyan,
            marginBottom: "40px",
          }}
        >
          {t.pause.paused}
        </h1>
        
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <button
            onClick={resume}
            style={{
              fontSize: "24px",
              padding: "15px 40px",
              backgroundColor: DREAM_NEXUS_COLORS.cyan,
              color: DREAM_NEXUS_COLORS.navy,
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
              fontFamily: "monospace",
            }}
          >
            {t.pause.resume}
          </button>
          
          <button
            onClick={restart}
            style={{
              fontSize: "24px",
              padding: "15px 40px",
              backgroundColor: DREAM_NEXUS_COLORS.warm,
              color: DREAM_NEXUS_COLORS.navy,
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
              fontFamily: "monospace",
            }}
          >
            {t.pause.quitToMenu}
          </button>
        </div>
        
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              fontSize: "18px",
              padding: "12px 30px",
              backgroundColor: "#555",
              color: DREAM_NEXUS_COLORS.white,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontFamily: "monospace",
            }}
          >
            {t.pause.settings}
          </button>
          
          <button
            onClick={showTutorial}
            style={{
              fontSize: "18px",
              padding: "12px 30px",
              backgroundColor: "#4A90E2",
              color: DREAM_NEXUS_COLORS.white,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontFamily: "monospace",
            }}
          >
            {t.pause.howToPlay}
          </button>
        </div>
      </div>
      
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
