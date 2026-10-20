import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storageGet, storageSet } from '@/lib/safeStorage';

export type Language = 'en' | 'es';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const getBrowserLanguage = (): Language => {
  const browserLang = (navigator.language || 'en').toLowerCase();
  if (browserLang.startsWith('es')) {
    return 'es';
  }
  return 'en';
};

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      language: getBrowserLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'dream-nexus-language',
      // Never let blocked storage break the game; the language just won't be remembered.
      storage: createJSONStorage(() => ({
        getItem: (key: string) => storageGet(key),
        setItem: (key: string, value: string) => storageSet(key, value),
        removeItem: () => {},
      })),
    }
  )
);
