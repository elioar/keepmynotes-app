import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  username: string;
  setUsername: (name: string) => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  username: '',
  setUsername: async () => {},
});

export const useUser = () => useContext(UserContext);

const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsernameState] = useState<string>('');

  useEffect(() => {
    const loadUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('username');
        if (savedUsername) {
          setUsernameState(savedUsername);
        }
      } catch (error) {
        console.error('Error loading username:', error);
      }
    };
    
    loadUsername();
  }, []);

  const setUsername = async (name: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) return;
      
      await AsyncStorage.setItem('username', trimmedName);
      setUsernameState(trimmedName);
    } catch (error) {
      console.error('Error saving username:', error);
    }
  };

  return (
    <UserContext.Provider value={{ username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserProvider };
export default UserContext; 