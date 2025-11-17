import { useLanguage, Language } from '@/lib/stores/useLanguage';
import { translations } from './translations';

export function useTranslation() {
  const language = useLanguage((state) => state.language);
  
  return {
    t: translations[language],
    language,
    setLanguage: useLanguage.getState().setLanguage,
  };
}
