import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
  Tasks: undefined;
  PinScreen: { isChangingPin?: boolean };
  SecurityCheck: undefined;
  Task: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  onAddPress?: () => void;
}

export default function NavigationMenu({ onAddPress }: Props) {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const addButtonAnim = useRef(new Animated.Value(1)).current;
  
  const currentRoute = navigation.getState().routes[navigation.getState().index].name;
  
  const isActive = (screenName: string) => currentRoute === screenName;

  const handleAddPress = () => {
    Animated.sequence([
      Animated.timing(addButtonAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(addButtonAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();

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
        ? 'rgba(45, 45, 45, 0.98)'
        : 'rgba(245, 245, 245, 0.98)',
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
      shadowColor: theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });

  return (
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
      
      <Animated.View style={{
        transform: [{ scale: addButtonAnim }]
      }}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddPress}
          activeOpacity={1}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Tasks')}
      >
        <Ionicons 
          name={isActive('Tasks') ? "checkbox" : "checkbox-outline"} 
          size={24} 
          color={isActive('Tasks') ? theme.textColor : theme.placeholderColor} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Settings')}
      >
        <Ionicons 
          name={isActive('Settings') ? "settings" : "settings-outline"} 
          size={24} 
          color={isActive('Settings') ? theme.textColor : theme.placeholderColor} 
        />
      </TouchableOpacity>
    </View>
  );
} 