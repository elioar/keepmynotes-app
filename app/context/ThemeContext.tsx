import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  appThemes: typeof appThemes;
  toggleColorScheme: () => void;
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

export const appThemes = {
  purple: '#7C4DFF',  // Default
  blue: '#2196F3',
  green: '#4CAF50',
  orange: '#FF9800',
  pink: '#E91E63',
};

type AppTheme = keyof typeof appThemes;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [appTheme, setAppTheme] = useState<AppTheme>('purple');
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  // Load saved theme preferences
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('@theme_mode');
        const savedAppTheme = await AsyncStorage.getItem('@app_theme');
        
        if (savedThemeMode) {
          setThemeMode(savedThemeMode as ThemeMode);
          if (savedThemeMode === 'dark') setIsDarkMode(true);
          else if (savedThemeMode === 'light') setIsDarkMode(false);
          else setIsDarkMode(colorScheme === 'dark');
        }
        if (savedAppTheme) {
          setAppTheme(savedAppTheme as AppTheme);
        }
      } catch (error) {
        console.error('Error loading theme preferences:', error);
      }
    };

    loadThemePreferences();
  }, []);

  // Update theme when system theme changes
  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(colorScheme === 'dark');
    }
  }, [colorScheme, themeMode]);

  // Save theme mode when it changes
  const handleThemeModeChange = async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('@theme_mode', newMode);
      setThemeMode(newMode);
      
      if (newMode === 'system') {
        setIsDarkMode(colorScheme === 'dark');
      } else {
        setIsDarkMode(newMode === 'dark');
      }
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  // Save app theme when it changes
  const handleAppThemeChange = async (newTheme: AppTheme) => {
    try {
      await AsyncStorage.setItem('@app_theme', newTheme);
      setAppTheme(newTheme);
    } catch (error) {
      console.error('Error saving app theme:', error);
    }
  };

  const toggleColorScheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
    isDarkMode,
    backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
    secondaryBackground: isDarkMode ? '#1A1A1A' : '#F5F5F5',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    placeholderColor: isDarkMode ? '#666666' : '#999999',
    borderColor: isDarkMode ? '#333333' : '#E0E0E0',
    accentColor: appThemes[appTheme],
  };

  return (
    <ThemeContextInternal.Provider 
      value={{ 
        theme, 
        themeMode, 
        setThemeMode: handleThemeModeChange,
        appTheme,
        setAppTheme: handleAppThemeChange,
        appThemes,
        toggleColorScheme
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