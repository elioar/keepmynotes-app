import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { noteId?: string };
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

// Gradient definitions για κάθε theme
const themeGradients = {
  purple: {
    colors: ['#8B45FF', '#FF4E4E'] as const,
  },
  blue: {
    colors: ['#2196F3', '#00BCD4'] as const,
  },
  green: {
    colors: ['#4CAF50', '#8BC34A'] as const,
  },
  orange: {
    colors: ['#FF9800', '#FF5722'] as const,
  },
  pink: {
    colors: ['#E91E63', '#9C27B0'] as const,
  }
};

export default function NavigationMenu({ onAddPress }: Props) {
  const { theme, appTheme } = useTheme();
  const insets = useSafeAreaInsets();
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
      navigation.navigate('AddEditNote');
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 70 + insets.bottom,
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
      paddingBottom: 10 + insets.bottom,
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
      overflow: 'hidden',
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
          <LinearGradient
            colors={themeGradients[appTheme].colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 15,
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
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