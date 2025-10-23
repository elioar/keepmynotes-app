import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FloatingActionMenu from './FloatingActionMenu';

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
  const [isFloatingMenuVisible, setIsFloatingMenuVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  
  const currentRoute = navigation.getState().routes[navigation.getState().index].name;
  
  const isActive = (screenName: string) => currentRoute === screenName;

  const handleAddPress = (event: any) => {
    Animated.sequence([
      Animated.timing(addButtonAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(addButtonAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    if (onAddPress) {
      onAddPress();
    } else {
      // Calculate button position relative to screen
      const { pageX, pageY } = event.nativeEvent;
      setButtonPosition({ x: pageX, y: pageY });
      setIsFloatingMenuVisible(true);
    }
  };

  const handleFloatingMenuClose = () => {
    setIsFloatingMenuVisible(false);
  };

  const handleSelectOption = (type: string) => {
    if (type === 'note') {
      navigation.navigate('AddEditNote' as any);
    } else if (type === 'task') {
      navigation.navigate('Task' as any);
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 85 + insets.bottom,
      backgroundColor: theme.isDarkMode 
        ? 'rgba(25, 25, 25, 0.98)' 
        : 'rgba(255, 255, 255, 0.98)',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingBottom: 15 + insets.bottom,
      paddingTop: 20,
      paddingHorizontal: 0,
      // Enhanced shadow για depth
      shadowColor: theme.isDarkMode ? '#000' : '#000',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: theme.isDarkMode ? 0.3 : 0.15,
      shadowRadius: 12,
      elevation: 20,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-start',
      paddingLeft: 15,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end',
      paddingRight: 15,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 55,
      height: 55,
      borderRadius: 16,
      backgroundColor: 'transparent',
      marginHorizontal: 5, // bigger spacing
    },
    activeNavItem: {
      backgroundColor: 'transparent',
      borderRadius: 16,
      width: 55,
      height: 55,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 5, // bigger spacing
    },
    
    addButton: {
      width: 52,
      height: 52,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      // Positioning (half outside the bottom bar)
      position: 'absolute',
      bottom: -20,
      alignSelf: 'center',
      // Subtle shadow για minimal look
      shadowColor: themeGradients[appTheme].colors[0],
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 12,
      // Minimal border
      borderWidth: 2,
      borderColor: theme.isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.8)',
      zIndex: 10,
    },
    navLabel: {
      fontSize: 9,
      fontWeight: '500',
      marginTop: 3,
      color: theme.placeholderColor,
      textAlign: 'center',
    },
    activeNavLabel: {
      fontSize: 9,
      fontWeight: '600',
      marginTop: 3,
      color: themeGradients[appTheme].colors[0],
      textAlign: 'center',
    },
  });

  return (
    <>
      <View style={styles.container}>
        {/* Left section - Home and Favorites */}
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={isActive('Home') ? styles.activeNavItem : styles.navItem}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isActive('Home') ? "home" : "home-outline"} 
              size={22} 
              color={isActive('Home') ? themeGradients[appTheme].colors[0] : theme.placeholderColor} 
            />
            <Text style={isActive('Home') ? styles.activeNavLabel : styles.navLabel}>
              Αρχική
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={isActive('Favorites') ? styles.activeNavItem : styles.navItem}
            onPress={() => navigation.navigate('Favorites')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isActive('Favorites') ? "heart" : "heart-outline"} 
              size={22} 
              color={isActive('Favorites') ? themeGradients[appTheme].colors[0] : theme.placeholderColor} 
            />
            <Text style={isActive('Favorites') ? styles.activeNavLabel : styles.navLabel}>
              Αγαπημένα
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Center - Add Button */}
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
                borderRadius: 14,
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Right section - Tasks and Settings */}
        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={isActive('Tasks') ? styles.activeNavItem : styles.navItem}
            onPress={() => navigation.navigate('Tasks')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isActive('Tasks') ? "checkbox" : "checkbox-outline"} 
              size={22} 
              color={isActive('Tasks') ? themeGradients[appTheme].colors[0] : theme.placeholderColor} 
            />
            <Text style={isActive('Tasks') ? styles.activeNavLabel : styles.navLabel}>
              Εργασίες
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={isActive('Settings') ? styles.activeNavItem : styles.navItem}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isActive('Settings') ? "settings" : "settings-outline"} 
              size={22} 
              color={isActive('Settings') ? themeGradients[appTheme].colors[0] : theme.placeholderColor} 
            />
            <Text style={isActive('Settings') ? styles.activeNavLabel : styles.navLabel}>
              Ρυθμίσεις
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <FloatingActionMenu
        visible={isFloatingMenuVisible}
        onClose={handleFloatingMenuClose}
        onSelectOption={handleSelectOption}
        buttonPosition={buttonPosition}
      />
    </>
  );
} 