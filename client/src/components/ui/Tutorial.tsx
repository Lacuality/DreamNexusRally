import { useState, useEffect } from "react";
import { useRally } from "@/lib/stores/useRally";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

const tutorialIcons = ["🏁", "🎮", "💧", "⚠️", "⚡", "🏆"];

export function Tutorial() {
  const [currentCard, setCurrentCard] = useState(0);
  const closeTutorial = useRally((state) => state.closeTutorial);
  const { t } = useTranslation();
  
  const tutorialCards = t.tutorial.cards;
  const isLastCard = currentCard === tutorialCards.length - 1;
  const card = tutorialCards[currentCard];

  const handleNext = () => {
    if (isLastCard) {
      sessionStorage.setItem("tutorialShown", "true");
      closeTutorial();
    } else {
      setCurrentCard(currentCard + 1);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem("tutorialShown", "true");
    closeTutorial();
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleNext();
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentCard]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-white/60 hover:text-white text-sm font-medium transition-colors"
      >
        {t.tutorial.skip}
      </button>

      <div className="relative bg-[#0E1B24] border-2 border-[#24A0CE] rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{tutorialIcons[currentCard]}</div>
          <h2 className="text-2xl font-bold text-[#24A0CE] mb-3">{card.title}</h2>
          <p className="text-white/90 text-base leading-relaxed whitespace-pre-line">
            {card.description}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {tutorialCards.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentCard
                  ? "bg-[#24A0CE] w-4"
                  : index < currentCard
                  ? "bg-[#FDC6B5]"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          className="w-full bg-[#24A0CE] hover:bg-[#1d8ab3] text-white font-bold py-3 text-lg"
        >
          {isLastCard ? t.tutorial.letsRace : t.tutorial.next}
        </Button>

        <div className="text-center mt-3 text-white/40 text-xs">
          {t.tutorial.pressEnter}
        </div>
      </div>
    </div>
  );
}
