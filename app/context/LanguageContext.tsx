import { createContext, useContext, useState } from 'react';
import { en } from '../i18n/en';
import { el } from '../i18n/el';
import { es } from '../i18n/es';
import { Translations } from '../i18n/types';

type TranslationValue = string | Record<string, string>;

export type Language = 'en' | 'el' | 'es';

const translations: Record<Language, Translations> = {
  en,
  el,
  es,
};

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'es', name: 'Español' },
];

interface LanguageContextType {
  t: (key: keyof Translations) => string;
  setLanguage: (lang: Language) => void;
  currentLanguage: Language;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof Translations): string => {
    const translation = translations[language][key];
    if (typeof translation === 'string') {
      return translation;
    }
    return key;
  };

  const value = {
    t,
    setLanguage,
    currentLanguage: language,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext; 