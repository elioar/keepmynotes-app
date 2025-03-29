import { createContext, useContext, useState } from 'react';
import { en } from '../translations/en';
import { Translations } from '../i18n/types';

type TranslationValue = string | Record<string, string>;

export type Language = 'en';
export type TranslationKey = keyof Translations;

interface LanguageContextType {
  t: (key: TranslationKey) => string;
  setLanguage: (lang: Language) => void;
  currentLanguage: Language;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: TranslationKey): string => {
    try {
      if (key in en) {
        const translation = en[key as keyof typeof en];
        
        // Handle nested translations (like tagColors)
        if (typeof translation === 'object') {
          return JSON.stringify(translation);
        }
        
        return translation;
      }
      return String(key);
    } catch (error) {
      return String(key);
    }
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