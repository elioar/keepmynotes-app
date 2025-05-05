import { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../i18n/en';
import { el } from '../i18n/el';
import { es } from '../i18n/es';
import { Translations } from '../i18n/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TranslationValue = string | Record<string, string>;

export type Language = 'en' | 'el' | 'es';
export type TranslationKey = keyof Translations;

interface LanguageContextType {
  t: (key: TranslationKey) => string;
  setLanguage: (lang: Language) => void;
  currentLanguage: Language;
}

const translations = {
  en,
  el,
  es
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@language');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'el' || savedLanguage === 'es')) {
          setLanguage(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang: Language) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem('@language', lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key: TranslationKey): string => {
    try {
      const currentTranslations = translations[language];
      
      if (key in currentTranslations) {
        const translation = currentTranslations[key as keyof typeof currentTranslations];
        
        // Handle nested translations (like tagColors)
        if (typeof translation === 'object') {
          // We should not convert to JSON string for nested objects
          // Instead, return the object as-is and handle it in the UI components
          return translation as unknown as string;
        }
        
        return translation;
      }
      
      // Fallback to English if translation not found
      if (language !== 'en' && key in en) {
        const fallbackTranslation = en[key as keyof typeof en];
        
        if (typeof fallbackTranslation === 'object') {
          return fallbackTranslation as unknown as string;
        }
        
        return fallbackTranslation;
      }
      
      return String(key);
    } catch (error) {
      console.error(`Translation error for key ${String(key)}:`, error);
      return String(key);
    }
  };

  const value = {
    t,
    setLanguage: changeLanguage,
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