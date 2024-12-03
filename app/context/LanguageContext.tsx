import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

const i18n = new I18n(translations);
i18n.enableFallback = true;

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
}

const LanguageContextInternal = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState(getLocales()[0].languageCode || 'en');

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLocale = await AsyncStorage.getItem('locale');
      if (savedLocale) {
        setLocale(savedLocale);
        i18n.locale = savedLocale;
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const handleSetLocale = async (newLocale: string) => {
    try {
      setLocale(newLocale);
      i18n.locale = newLocale;
      await AsyncStorage.setItem('locale', newLocale);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key: string) => i18n.t(key);

  return (
    <LanguageContextInternal.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LanguageContextInternal.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContextInternal);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

const LanguageContext = {
  Provider: LanguageProvider,
  useLanguage,
};

export default LanguageContext; 