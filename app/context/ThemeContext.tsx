import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
}

interface Theme {
  backgroundColor: string;
  textColor: string;
  secondaryBackground: string;
  borderColor: string;
  placeholderColor: string;
  accentColor: string;
  isDarkMode: boolean;
}

const lightTheme: Theme = {
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  secondaryBackground: '#F5F5F5',
  borderColor: '#E0E0E0',
  placeholderColor: '#666666',
  accentColor: '#6B4EFF',
  isDarkMode: false,
};

const darkTheme: Theme = {
  backgroundColor: '#000000',
  textColor: '#FFFFFF',
  secondaryBackground: '#1E1E1E',
  borderColor: '#1E1E1E',
  placeholderColor: '#666666',
  accentColor: '#6B4EFF',
  isDarkMode: true,
};

const ThemeContextInternal = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem('themeMode');
      if (savedThemeMode !== null) {
        setThemeMode(savedThemeMode as 'system' | 'light' | 'dark');
        if (savedThemeMode !== 'system') {
          setIsDarkMode(savedThemeMode === 'dark');
        }
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      const newThemeMode = newTheme ? 'dark' : 'light';
      setThemeMode(newThemeMode);
      await AsyncStorage.setItem('themeMode', newThemeMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const handleSetThemeMode = async (mode: 'system' | 'light' | 'dark') => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
      if (mode === 'system') {
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(mode === 'dark');
      }
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContextInternal.Provider 
      value={{ 
        isDarkMode, 
        toggleTheme, 
        theme, 
        themeMode, 
        setThemeMode: handleSetThemeMode 
      }}
    >
      {children}
    </ThemeContextInternal.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContextInternal);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

const ThemeContext = {
  Provider: ThemeProvider,
  useTheme,
};

export default ThemeContext; 