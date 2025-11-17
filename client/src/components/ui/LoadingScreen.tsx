import { DREAM_NEXUS_COLORS } from "@/lib/constants";
import { useProgress } from "@react-three/drei";

export function LoadingScreen() {
  const { progress, active, item } = useProgress();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #0E1B24 0%, #1a2832 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "600px", padding: "20px" }}>
        <div
          style={{
            fontSize: "clamp(24px, 5vw, 48px)",
            fontWeight: "800",
            color: DREAM_NEXUS_COLORS.cyan,
            marginBottom: "40px",
            textShadow: `0 0 20px ${DREAM_NEXUS_COLORS.cyan}`,
            fontFamily: "monospace",
            letterSpacing: "0.2em",
          }}
        >
          LOADING START CONTROL
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            height: "8px",
            backgroundColor: "rgba(36, 160, 206, 0.2)",
            borderRadius: "4px",
            overflow: "hidden",
            margin: "0 auto 20px",
            border: `1px solid ${DREAM_NEXUS_COLORS.cyan}`,
            boxShadow: `0 0 10px rgba(36, 160, 206, 0.3)`,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${DREAM_NEXUS_COLORS.cyan}, ${DREAM_NEXUS_COLORS.white})`,
              transition: "width 0.3s ease-out",
              boxShadow: `0 0 10px ${DREAM_NEXUS_COLORS.cyan}`,
            }}
          />
        </div>

        <div
          style={{
            marginTop: "30px",
            fontSize: "clamp(14px, 2.5vw, 18px)",
            color: DREAM_NEXUS_COLORS.cyan,
            fontFamily: "monospace",
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          {Math.round(progress)}%
        </div>

        <div
          style={{
            marginTop: "10px",
            fontSize: "clamp(12px, 2vw, 14px)",
            color: DREAM_NEXUS_COLORS.cyan,
            fontFamily: "monospace",
            opacity: 0.7,
            height: "40px",
          }}
        >
          {active ? (item ? `Loading ${item.split('/').pop()}...` : "Loading essential race infrastructure...") : "Ready!"}
        </div>
      </div>

      <style>{`
        @keyframes loadingPulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes loadingBarPulse {
          0%, 100% {
            opacity: 0.6;
            transform: scaleX(0.95);
          }
          50% {
            opacity: 1;
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
