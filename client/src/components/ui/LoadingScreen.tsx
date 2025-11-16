import { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useRally } from "@/lib/stores/useRally";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";

const modelPaths = [
  "/models/start-arch.glb",
  "/models/safety-barrier.glb",
  "/models/traffic-cone.glb",
  "/models/timing-display.glb",
  "/models/control-tent.glb",
  "/models/marshal-clipboard.glb",
  "/models/marshal-radio.glb",
  "/models/spectators.glb",
  "/models/service-van.glb",
];

export function LoadingScreen() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const finishLoading = useRally((state) => state.finishLoading);

  useEffect(() => {
    let mounted = true;
    let loadedCount = 0;

    const preloadModels = async () => {
      try {
        const loadPromises = modelPaths.map((path, index) => {
          const preloadPromise = useGLTF.preload(path);
          if (preloadPromise) {
            return preloadPromise.then(() => {
              if (mounted) {
                loadedCount++;
                setLoadingProgress(Math.floor((loadedCount / modelPaths.length) * 100));
              }
            });
          }
          return Promise.resolve();
        });

        await Promise.all(loadPromises);

        if (mounted) {
          setTimeout(() => {
            finishLoading();
          }, 500);
        }
      } catch (error) {
        console.error("Error loading models:", error);
        if (mounted) {
          setTimeout(() => {
            finishLoading();
          }, 1000);
        }
      }
    };

    preloadModels();

    return () => {
      mounted = false;
    };
  }, [finishLoading]);

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
              width: `${loadingProgress}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${DREAM_NEXUS_COLORS.cyan}, ${DREAM_NEXUS_COLORS.white})`,
              transition: "width 0.3s ease-out",
              boxShadow: `0 0 10px ${DREAM_NEXUS_COLORS.cyan}`,
            }}
          />
        </div>

        <div
          style={{
            fontSize: "clamp(18px, 3vw, 24px)",
            color: DREAM_NEXUS_COLORS.white,
            fontFamily: "monospace",
            fontWeight: "600",
          }}
        >
          {loadingProgress}%
        </div>

        <div
          style={{
            marginTop: "30px",
            fontSize: "clamp(12px, 2vw, 16px)",
            color: DREAM_NEXUS_COLORS.cyan,
            fontFamily: "monospace",
            opacity: 0.7,
            animation: "loadingPulse 1.5s ease-in-out infinite",
          }}
        >
          Preparing race infrastructure...
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
      `}</style>
    </div>
  );
}
