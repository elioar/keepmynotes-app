import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextType {
  isFirstLaunch: boolean | null;
  setFirstLaunchComplete: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isFirstLaunch: null,
  setFirstLaunchComplete: async () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('@has_launched');
      setIsFirstLaunch(hasLaunched === null);
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
    }
  };

  const setFirstLaunchComplete = async () => {
    try {
      await AsyncStorage.setItem('@has_launched', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error setting first launch:', error);
    }
  };

  return (
    <OnboardingContext.Provider value={{ isFirstLaunch, setFirstLaunchComplete }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export default OnboardingProvider; 