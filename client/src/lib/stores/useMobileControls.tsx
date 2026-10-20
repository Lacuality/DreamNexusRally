import { create } from "zustand";

interface MobileControlsState {
  left: boolean;
  right: boolean;
  forward: boolean;
  back: boolean;
  handbrake: boolean;
  
  setLeft: (pressed: boolean) => void;
  setRight: (pressed: boolean) => void;
  setForward: (pressed: boolean) => void;
  setBack: (pressed: boolean) => void;
  setHandbrake: (pressed: boolean) => void;
}

export const useMobileControls = create<MobileControlsState>((set) => ({
  left: false,
  right: false,
  forward: false,
  back: false,
  handbrake: false,
  
  setLeft: (pressed) => set({ left: pressed }),
  setRight: (pressed) => set({ right: pressed }),
  setForward: (pressed) => set({ forward: pressed }),
  setBack: (pressed) => set({ back: pressed }),
  setHandbrake: (pressed) => set({ handbrake: pressed }),
}));
