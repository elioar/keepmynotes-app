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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
      
      // Αν υπάρχει χρήστης, απενεργοποιούμε το guest mode
      if (user) {
        setIsGuestMode(false);
        AsyncStorage.setItem('@is_guest_mode', 'false');
      }
    });

    // Φόρτωση guest mode από το AsyncStorage
    const loadGuestMode = async () => {
      try {
        const guestMode = await AsyncStorage.getItem('@is_guest_mode');
        if (guestMode === 'true' && !user) {
          setIsGuestMode(true);
        }
      } catch (error) {
        console.error('Error loading guest mode:', error);
      }
    };

    loadGuestMode();
    return unsubscribe;
  }, [user]);

  const setGuestMode = async (isGuest: boolean) => {
    setIsGuestMode(isGuest);
    await AsyncStorage.setItem('@is_guest_mode', isGuest.toString());
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