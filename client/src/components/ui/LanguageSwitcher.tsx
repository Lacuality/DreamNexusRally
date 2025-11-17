import { useTranslation } from "@/lib/i18n/useTranslation";
import { DREAM_NEXUS_COLORS } from "@/lib/constants";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        gap: "8px",
        backgroundColor: "rgba(14, 27, 36, 0.8)",
        padding: "8px",
        borderRadius: "8px",
        border: `2px solid ${DREAM_NEXUS_COLORS.cyan}`,
      }}
    >
      <button
        onClick={() => setLanguage('en')}
        style={{
          backgroundColor: language === 'en' ? DREAM_NEXUS_COLORS.cyan : 'transparent',
          color: language === 'en' ? DREAM_NEXUS_COLORS.navy : DREAM_NEXUS_COLORS.white,
          border: 'none',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontFamily: 'monospace',
          transition: 'all 0.2s',
        }}
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        style={{
          backgroundColor: language === 'es' ? DREAM_NEXUS_COLORS.cyan : 'transparent',
          color: language === 'es' ? DREAM_NEXUS_COLORS.navy : DREAM_NEXUS_COLORS.white,
          border: 'none',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontFamily: 'monospace',
          transition: 'all 0.2s',
        }}
      >
        🇪🇸 ES
      </button>
    </div>
  );
}
