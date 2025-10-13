import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isGuestMode: boolean;
  setGuestMode: (isGuest: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isGuestMode: false,
  setGuestMode: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);

      // Disable guest mode entirely
      setIsGuestMode(false);
      AsyncStorage.setItem('@is_guest_mode', 'false');
    });

    // Force disable guest mode startup
    AsyncStorage.setItem('@is_guest_mode', 'false');
    return unsubscribe;
  }, []);

  const setGuestMode = async (_isGuest: boolean) => {
    setIsGuestMode(false);
    await AsyncStorage.setItem('@is_guest_mode', 'false');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isGuestMode, setGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 