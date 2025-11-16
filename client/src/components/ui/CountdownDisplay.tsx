import { useEffect } from "react";
import { useRally } from "@/lib/stores/useRally";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";

export function CountdownDisplay() {
  const { countdown, isCountingDown, setCountdown } = useRally();

  useEffect(() => {
    if (!isCountingDown) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown, isCountingDown, setCountdown]);

  if (!isCountingDown) return null;

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
      <div
        style={{
          fontSize: "clamp(120px, 20vw, 280px)",
          fontWeight: "bold",
          fontFamily: "monospace",
          color: countdown === 0 ? "#00FF00" : DREAM_NEXUS_COLORS.cyan,
          textShadow: `
            0 0 20px ${countdown === 0 ? "#00FF00" : DREAM_NEXUS_COLORS.cyan},
            0 0 40px ${countdown === 0 ? "#00FF00" : DREAM_NEXUS_COLORS.cyan},
            0 0 60px ${countdown === 0 ? "#00FF00" : DREAM_NEXUS_COLORS.cyan}
          `,
          animation: "countdownPulse 1s ease-in-out",
          textAlign: "center",
        }}
      >
        {countdown === 0 ? "GO!" : countdown}
      </div>
      <style>{`
        @keyframes countdownPulse {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
