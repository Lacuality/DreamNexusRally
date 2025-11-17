import { useTranslation } from "@/lib/i18n/useTranslation";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";
import { Language } from "@/lib/stores/useLanguage";

interface LanguageSelectionModalProps {
  onSelectLanguage: (language: Language) => void;
}

export function LanguageSelectionModal({ onSelectLanguage }: LanguageSelectionModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          backgroundColor: DREAM_NEXUS_COLORS.navy,
          border: `3px solid ${DREAM_NEXUS_COLORS.cyan}`,
          borderRadius: "16px",
          padding: "40px",
          maxWidth: "500px",
          width: "90%",
          textAlign: "center",
          boxShadow: "0 0 50px rgba(36, 160, 206, 0.5)",
        }}
      >
        <h2
          style={{
            fontFamily: "monospace",
            fontSize: "28px",
            color: DREAM_NEXUS_COLORS.cyan,
            marginBottom: "16px",
            textShadow: "0 0 20px rgba(36, 160, 206, 0.6)",
          }}
        >
          Select Language / Seleccionar Idioma
        </h2>
        
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "16px",
            color: DREAM_NEXUS_COLORS.white,
            marginBottom: "32px",
            opacity: 0.8,
          }}
        >
          Choose your preferred language
          <br />
          Elige tu idioma preferido
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => onSelectLanguage('en')}
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: "20px",
              fontWeight: "bold",
              padding: "20px 32px",
              background: `linear-gradient(135deg, ${DREAM_NEXUS_COLORS.cyan}, #5dd6ff)`,
              color: DREAM_NEXUS_COLORS.navy,
              border: `2px solid #5dd6ff`,
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 0 30px rgba(36, 160, 206, 0.6)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(36, 160, 206, 0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(36, 160, 206, 0.6)";
            }}
          >
            🇬🇧 English
          </button>

          <button
            onClick={() => onSelectLanguage('es')}
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: "20px",
              fontWeight: "bold",
              padding: "20px 32px",
              background: `linear-gradient(135deg, ${DREAM_NEXUS_COLORS.cyan}, #5dd6ff)`,
              color: DREAM_NEXUS_COLORS.navy,
              border: `2px solid #5dd6ff`,
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 0 30px rgba(36, 160, 206, 0.6)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(36, 160, 206, 0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(36, 160, 206, 0.6)";
            }}
          >
            🇪🇸 Español
          </button>
        </div>
      </div>
    </div>
  );
}
