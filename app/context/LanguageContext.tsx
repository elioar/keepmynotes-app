import { createContext, useContext, useState } from 'react';
import { en } from '../i18n/en';
import { el } from '../i18n/el';

type TranslationValue = string | Record<string, string>;

interface LanguageContextType {
  t: (key: keyof typeof en) => string;
  setLanguage: (lang: 'en' | 'el') => void;
  currentLanguage: 'en' | 'el';
}

const translations = {
  en,
  el,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'el'>('en');

  const t = (key: keyof typeof en): string => {
    const translation = translations[language][key];
    if (typeof translation === 'string') {
      return translation;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ 
      t, 
      setLanguage, 
      currentLanguage: language 
    }}>
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