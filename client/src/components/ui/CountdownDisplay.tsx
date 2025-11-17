import { useEffect } from "react";
import { useRally } from "@/lib/stores/useRally";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";
import { audioManager } from "@/lib/audio";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function CountdownDisplay() {
  const { countdown, isCountingDown, setCountdown } = useRally();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isCountingDown) return;

    if (countdown > 0) {
      audioManager.playCountdownBeep();
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      audioManager.playCountdownGo();
    }
  }, [countdown, isCountingDown, setCountdown]);

  if (!isCountingDown) return null;

  const isGo = countdown === 0;
  const mainColor = isGo ? "#00FF41" : "#FF1744";
  
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
        {!isGo && (
          <div
            style={{
              fontSize: "clamp(24px, 4vw, 48px)",
              fontWeight: "800",
              letterSpacing: "0.3em",
              color: "#FFFFFF",
              textShadow: `
                0 0 10px rgba(255, 255, 255, 0.8),
                0 0 20px ${mainColor}
              `,
              animation: "rallyFlash 0.5s ease-in-out infinite",
              textAlign: "center",
              fontFamily: "monospace",
            }}
          >
            {t.countdown.startingIn}
          </div>
        )}
        
        <div
          style={{
            fontSize: "clamp(180px, 30vw, 400px)",
            fontWeight: "900",
            fontFamily: "monospace",
            color: mainColor,
            textShadow: `
              0 0 30px ${mainColor},
              0 0 60px ${mainColor},
              0 0 90px ${mainColor},
              0 0 120px ${mainColor},
              0 5px 15px rgba(0, 0, 0, 0.5)
            `,
            animation: isGo ? "countdownGoExplosion 1s ease-out" : "countdownPulse 1s ease-in-out",
            textAlign: "center",
            lineHeight: "1",
            WebkitTextStroke: isGo ? "3px #003311" : "2px #660000",
          }}
        >
          {isGo ? t.countdown.go : countdown}
        </div>

        {isGo && (
          <div
            style={{
              fontSize: "clamp(32px, 6vw, 64px)",
              fontWeight: "800",
              letterSpacing: "0.5em",
              color: "#FFFFFF",
              textShadow: `
                0 0 20px #00FF41,
                0 0 40px #00FF41
              `,
              animation: "rallyGoSubtext 1s ease-out",
              textAlign: "center",
              fontFamily: "monospace",
            }}
          >
            {t.countdown.race}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes countdownPulse {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          40% {
            transform: scale(1.3);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes countdownGoExplosion {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          30% {
            transform: scale(1.5);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0.9;
          }
        }
        
        @keyframes rallyFlash {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes rallyGoSubtext {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          50% {
            transform: translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
