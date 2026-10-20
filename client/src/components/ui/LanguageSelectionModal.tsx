import { Language } from "@/lib/stores/useLanguage";
import { FLOW_CSS } from "./flowStyles";

interface LanguageSelectionModalProps {
  onSelectLanguage: (language: Language) => void;
}

/** First-visit language picker, shown in both languages at once. */
export function LanguageSelectionModal({ onSelectLanguage }: LanguageSelectionModalProps) {
  return (
    <div className="dnr-flow" role="dialog" aria-modal="true" aria-labelledby="dnr-lang-title">
      <style>{FLOW_CSS}</style>
      <div className="dnr-flow-card">
        <div className="dnr-flow-kicker">Dream Nexus Rally</div>
        <h2 id="dnr-lang-title" className="dnr-flow-title">Language · Idioma</h2>
        <div className="dnr-flow-row">
          <button className="dnr-flow-choice" onClick={() => onSelectLanguage("en")} autoFocus>
            English
            <small>Let's race</small>
          </button>
          <button className="dnr-flow-choice" onClick={() => onSelectLanguage("es")}>
            Español
            <small>¡A correr!</small>
          </button>
        </div>
      </div>
    </div>
  );
}
