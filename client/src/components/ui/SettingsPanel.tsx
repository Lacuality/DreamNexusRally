import { useSettings } from "@/lib/stores/useSettings";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguage, Language } from "@/lib/stores/useLanguage";

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    weather,
    reducedMotion,
    highContrast,
    toggleWeather,
    toggleReducedMotion,
    toggleHighContrast,
  } = useSettings();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(14, 27, 36, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          backgroundColor: DREAM_NEXUS_COLORS.navy,
          padding: "30px",
          borderRadius: "15px",
          border: `3px solid ${DREAM_NEXUS_COLORS.cyan}`,
          maxWidth: "500px",
          width: "90%",
        }}
      >
        <h2
          style={{
            color: DREAM_NEXUS_COLORS.cyan,
            fontSize: "32px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          {t.settings.title}
        </h2>
        
        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              color: DREAM_NEXUS_COLORS.warm,
              fontSize: "20px",
              marginBottom: "15px",
            }}
          >
            {t.settings.language}
          </h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setLanguage("en")}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: language === "en" ? DREAM_NEXUS_COLORS.cyan : "#555",
                color: language === "en" ? DREAM_NEXUS_COLORS.navy : DREAM_NEXUS_COLORS.white,
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              {t.settings.english}
            </button>
            <button
              onClick={() => setLanguage("es")}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: language === "es" ? DREAM_NEXUS_COLORS.cyan : "#555",
                color: language === "es" ? DREAM_NEXUS_COLORS.navy : DREAM_NEXUS_COLORS.white,
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              {t.settings.spanish}
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              color: DREAM_NEXUS_COLORS.warm,
              fontSize: "20px",
              marginBottom: "15px",
            }}
          >
            {t.settings.weather}
          </h3>
          <button
            onClick={toggleWeather}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: weather === "sunny" ? DREAM_NEXUS_COLORS.cyan : "#555",
              color: DREAM_NEXUS_COLORS.navy,
              border: "none",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            {weather === "sunny" ? t.settings.sunny : t.settings.overcast}
          </button>
        </div>
        
        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              color: DREAM_NEXUS_COLORS.warm,
              fontSize: "20px",
              marginBottom: "15px",
            }}
          >
            {t.settings.accessibility}
          </h3>
          
          <label
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "12px",
              cursor: "pointer",
              color: DREAM_NEXUS_COLORS.white,
              fontSize: "16px",
            }}
          >
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={toggleReducedMotion}
              style={{
                width: "20px",
                height: "20px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            />
            {t.settings.reducedMotion}
          </label>
          
          <label
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "12px",
              cursor: "pointer",
              color: DREAM_NEXUS_COLORS.white,
              fontSize: "16px",
            }}
          >
            <input
              type="checkbox"
              checked={highContrast}
              onChange={toggleHighContrast}
              style={{
                width: "20px",
                height: "20px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            />
            {t.settings.highContrast}
          </label>
        </div>
        
        <div style={{ marginTop: "30px" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: DREAM_NEXUS_COLORS.cyan,
              color: DREAM_NEXUS_COLORS.navy,
              border: "none",
              borderRadius: "10px",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            {t.settings.close}
          </button>
        </div>
      </div>
    </div>
  );
}
