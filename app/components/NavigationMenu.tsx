import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SettingsModal from './SettingsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Home: undefined;
  Favorites: undefined;
  AddEditNote: { note?: any };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  onAddPress?: () => void;
}

export default function NavigationMenu({ onAddPress }: Props) {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [username, setUsername] = useState('');
  
  useEffect(() => {
    AsyncStorage.getItem('@username').then(saved => {
      if (saved) setUsername(saved);
    });
  }, []);

  const handleUpdateUsername = async (newUsername: string) => {
    await AsyncStorage.setItem('@username', newUsername);
    setUsername(newUsername);
  };

  const currentRoute = navigation.getState().routes[navigation.getState().index].name;
  
  const isActive = (screenName: string) => currentRoute === screenName;

  const handleAddPress = () => {
    if (onAddPress) {
      onAddPress();
    } else {
      navigation.navigate('AddEditNote', { note: undefined });
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 70,
      backgroundColor: theme.isDarkMode 
        ? 'rgba(45, 45, 45, 0.98)'  // Πιο σκούρο για dark mode
        : 'rgba(245, 245, 245, 0.98)', // Πιο ανοιχτό για light mode
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 5,
      paddingBottom: 10,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 50,
      height: 50,
    },
    addButton: {
      width: 45,
      height: 45,
      borderRadius: 15,
      backgroundColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 5,
    },
  });

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons 
            name={isActive('Home') ? "home" : "home-outline"} 
            size={24} 
            color={isActive('Home') ? theme.textColor : theme.placeholderColor} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Ionicons 
            name={isActive('Favorites') ? "heart" : "heart-outline"} 
            size={24} 
            color={isActive('Favorites') ? theme.textColor : theme.placeholderColor} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddPress}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.placeholderColor} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setIsSettingsVisible(true)}
        >
          <Ionicons name="person-outline" size={24} color={theme.placeholderColor} />
        </TouchableOpacity>
      </View>

      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        username={username}
        onUpdateUsername={handleUpdateUsername}
      />
    </>
  );
} 