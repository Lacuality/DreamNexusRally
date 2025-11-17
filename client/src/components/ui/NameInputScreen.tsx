import { useState } from "react";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { HolographicPanel } from "./HolographicPanel";

interface NameInputScreenProps {
  onSubmit: (name: string) => void;
  initialName?: string;
}

export function NameInputScreen({ onSubmit, initialName = "" }: NameInputScreenProps) {
  const [nameInput, setNameInput] = useState(initialName);
  const { t } = useTranslation();

  const handleSubmit = () => {
    if (nameInput.trim()) {
      onSubmit(nameInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && nameInput.trim()) {
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(28px, 5vw, 42px)",
            color: DREAM_NEXUS_COLORS.cyan,
            marginBottom: "32px",
            textShadow: "0 0 30px rgba(36, 160, 206, 0.8)",
            animation: "textGlow 2s ease-in-out infinite alternate",
          }}
        >
          {t.title}
        </h1>

        <HolographicPanel>
          <label
            htmlFor="racer-name"
            style={{
              display: "block",
              fontFamily: "monospace",
              color: DREAM_NEXUS_COLORS.cyan,
              fontSize: "18px",
              marginBottom: "16px",
              textShadow: "0 0 10px rgba(36, 160, 206, 0.5)",
            }}
          >
            🏁 {t.enterName}
          </label>
          
          <input
            id="racer-name"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.racerName}
            maxLength={20}
            autoFocus
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: "20px",
              padding: "16px 20px",
              background: "rgba(36, 160, 206, 0.1)",
              border: `2px solid ${DREAM_NEXUS_COLORS.cyan}`,
              borderRadius: "12px",
              color: DREAM_NEXUS_COLORS.white,
              textAlign: "center",
              outline: "none",
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.3)",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "rgba(36, 160, 206, 0.2)";
              e.currentTarget.style.borderColor = "#5dd6ff";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(36, 160, 206, 0.4), inset 0 2px 10px rgba(0,0,0,0.3)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "rgba(36, 160, 206, 0.1)";
              e.currentTarget.style.borderColor = DREAM_NEXUS_COLORS.cyan;
              e.currentTarget.style.boxShadow = "inset 0 2px 10px rgba(0,0,0,0.3)";
            }}
          />
        </HolographicPanel>

        <button
          onClick={handleSubmit}
          disabled={!nameInput.trim()}
          style={{
            width: "100%",
            maxWidth: "500px",
            marginTop: "24px",
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: "clamp(18px, 3vw, 24px)",
            padding: "18px 48px",
            background: nameInput.trim()
              ? `linear-gradient(135deg, ${DREAM_NEXUS_COLORS.cyan}, #5dd6ff)`
              : "rgba(100,100,100,0.4)",
            color: nameInput.trim() ? DREAM_NEXUS_COLORS.navy : "rgba(255,255,255,0.4)",
            border: nameInput.trim() ? `2px solid #5dd6ff` : "2px solid rgba(150,150,150,0.3)",
            borderRadius: "14px",
            cursor: nameInput.trim() ? "pointer" : "not-allowed",
            boxShadow: nameInput.trim()
              ? "0 0 30px rgba(36, 160, 206, 0.6), 0 10px 25px rgba(0,0,0,0.4)"
              : "none",
            transition: "all 0.3s ease",
            opacity: nameInput.trim() ? 1 : 0.5,
            textShadow: nameInput.trim() ? "0 2px 5px rgba(0,0,0,0.3)" : "none",
          }}
          onMouseEnter={(e) => {
            if (nameInput.trim()) {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(36, 160, 206, 0.8), 0 15px 30px rgba(0,0,0,0.5)";
            }
          }}
          onMouseLeave={(e) => {
            if (nameInput.trim()) {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(36, 160, 206, 0.6), 0 10px 25px rgba(0,0,0,0.4)";
            }
          }}
        >
          {t.startRace}
        </button>

        <p
          style={{
            marginTop: "16px",
            fontFamily: "monospace",
            fontSize: "14px",
            color: DREAM_NEXUS_COLORS.white,
            opacity: 0.6,
          }}
        >
          {t.tutorial.pressEnter.split(' • ')[0]}
        </p>
      </div>

      <style>{`
        @keyframes textGlow {
          from { text-shadow: 0 0 20px rgba(36, 160, 206, 0.6); }
          to { text-shadow: 0 0 30px rgba(36, 160, 206, 0.9), 0 0 40px rgba(36, 160, 206, 0.5); }
        }
      `}</style>
    </div>
  );
}
