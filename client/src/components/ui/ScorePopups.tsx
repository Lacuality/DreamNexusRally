import { useRally } from "@/lib/stores/useRally";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Floating "+50 x2" / "Close call! +25" messages above the car.
export function ScorePopups() {
  const popups = useRally((state) => state.popups);
  const { t } = useTranslation();

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        top: "38%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        pointerEvents: "none",
        zIndex: 120,
      }}
    >
      <style>{`
        @keyframes dnr-pop {
          0% { opacity: 0; transform: translateY(12px) scale(0.8); }
          15% { opacity: 1; transform: translateY(0) scale(1.1); }
          30% { transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-36px) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dnr-popup { animation-name: none !important; }
        }
      `}</style>
      {popups.map((p) => (
        <div
          key={p.id}
          className="dnr-popup"
          style={{
            color: p.color,
            fontFamily: "monospace",
            fontWeight: "bold",
            fontSize: "26px",
            textShadow: "0 2px 6px rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
            animation: "dnr-pop 1.2s ease-out forwards",
          }}
        >
          {p.label === "closeCall" ? `${t.hud.closeCall} ${p.text}` : p.text}
        </div>
      ))}
    </div>
  );
}
