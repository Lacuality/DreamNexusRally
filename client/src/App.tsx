import { useEffect, useState } from "react";
import { useRally } from "./lib/stores/useRally";
import { TitleScreenImmersive } from "./components/ui/TitleScreenImmersive";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { Tutorial } from "./components/ui/Tutorial";
import { GameScene } from "./components/game/GameScene";
import { GameOverScreen } from "./components/ui/GameOverScreen";
import { CountdownDisplay } from "./components/ui/CountdownDisplay";
import { LanguageSelectionModal } from "./components/ui/LanguageSelectionModal";
import { NameInputScreen } from "./components/ui/NameInputScreen";
import { audioManager } from "./lib/audio";
import { useFullscreen } from "./hooks/useFullscreen";
import { useLanguage, Language } from "./lib/stores/useLanguage";
import "@fontsource/inter";

function App() {
  const phase = useRally((state) => state.phase);
  const { setPlayerName, playerName, loadPlayerName, startLoading } = useRally();
  const { setLanguage } = useLanguage();
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const { elementRef, isFullscreen, toggle, isSupported } = useFullscreen();
  
  useEffect(() => {
    console.log("Dream Nexus Rally initialized. Phase:", phase);
    loadPlayerName();
    
    const languageSelected = localStorage.getItem('dream-nexus-language');
    if (!languageSelected) {
      setShowLanguageSelection(true);
    }
    
    return () => {
      audioManager.cleanup();
    };
  }, [loadPlayerName]);
  
  useEffect(() => {
    if (phase === "playing") {
      console.log("Game started - playing phase");
    }
  }, [phase]);

  const handleLanguageSelect = (language: Language) => {
    setLanguage(language);
    setShowLanguageSelection(false);
  };

  const handleStartRace = () => {
    setShowNameInput(true);
  };

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setShowNameInput(false);
    startLoading();
  };
  
  return (
    <div ref={elementRef} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {showLanguageSelection && <LanguageSelectionModal onSelectLanguage={handleLanguageSelect} />}
      {showNameInput && <NameInputScreen onSubmit={handleNameSubmit} initialName={playerName} />}
      {phase === "menu" && <TitleScreenImmersive isFullscreen={isFullscreen} onToggleFullscreen={toggle} isFullscreenSupported={isSupported} onStartRace={handleStartRace} />}
      {/* One scene for the whole run, so phase changes don't rebuild it */}
      {phase !== "menu" && <GameScene isFullscreen={isFullscreen} onToggleFullscreen={toggle} />}
      {phase === "loading" && <LoadingScreen />}
      {phase === "tutorial" && <Tutorial />}
      {phase === "gameover" && <GameOverScreen />}
      <CountdownDisplay />
    </div>
  );
}

export default App;
