import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { FLOW_CSS } from "./flowStyles";

interface NameInputScreenProps {
  onSubmit: (name: string) => void;
  initialName?: string;
}

const MAX_NAME = 20;

/** Driver name for the leaderboard; submitting sends Pixel to the car. */
export function NameInputScreen({ onSubmit, initialName = "" }: NameInputScreenProps) {
  const [nameInput, setNameInput] = useState(initialName);
  const { t } = useTranslation();
  const name = nameInput.trim();

  return (
    <div className="dnr-flow" role="dialog" aria-modal="true" aria-labelledby="dnr-name-title">
      <style>{FLOW_CSS}</style>
      <form
        className="dnr-flow-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (name) onSubmit(name);
        }}
      >
        <div className="dnr-flow-kicker">{t.title}</div>
        <h2 id="dnr-name-title" className="dnr-flow-title">{t.enterName}</h2>
        <label htmlFor="dnr-driver-name" className="dnr-flow-sub" style={{ display: "block" }}>
          {t.menu.nameHint}
        </label>
        <input
          id="dnr-driver-name"
          className="dnr-flow-input"
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder={t.racerName}
          maxLength={MAX_NAME}
          autoFocus
          autoComplete="nickname"
          enterKeyHint="go"
        />
        <div className="dnr-flow-hint">
          <span>{t.tutorial.pressEnter.split(" • ")[0]}</span>
          <span>
            {nameInput.length}/{MAX_NAME}
          </span>
        </div>
        <button type="submit" className="dnr-flow-cta" disabled={!name}>
          <span>{t.menu.start}</span>
          <span aria-hidden="true">›››</span>
        </button>
      </form>
    </div>
  );
}
