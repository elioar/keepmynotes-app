import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './HomeScreen';
import FavoritesScreen from './components/FavoritesScreen';
import { NotesProvider } from './NotesContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import HiddenNotesScreen from './components/HiddenNotesScreen';
import SecurityCheck from './components/SecurityCheck';
import PinScreen from './components/PinScreen';
import EditNote from './components/EditNote';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { Easing } from 'react-native';
import WelcomeScreen from './components/WelcomeScreen';
import UserPreferencesScreen from './components/UserPreferencesScreen';
import SettingsScreen from './components/SettingsModal';

type RootStackParamList = {
  Welcome: undefined;
  UserPreferences: undefined;
  Home: undefined;
  Favorites: undefined;
  HiddenNotes: undefined;
  PinScreen: { isChangingPin?: boolean };
  SecurityCheck: undefined;
  Task: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator();

function Navigation() {
  const { theme } = useTheme();
  const { isFirstLaunch } = useOnboarding();
  
  return (
    <Stack.Navigator 
      initialRouteName={isFirstLaunch ? "Welcome" : "Home"}
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.backgroundColor,
        },
        presentation: 'card',
        gestureEnabled: false,
        animation: 'none',
        animationTypeForReplace: 'pop'
      }}
    >
      {isFirstLaunch && (
        <>
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
          />
          <Stack.Screen 
            name="UserPreferences" 
            component={UserPreferencesScreen}
          />
        </>
      )}
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
      />
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen}
      />
      <Stack.Screen 
        name="SecurityCheck" 
        component={SecurityCheck}
      />
      <Stack.Screen 
        name="HiddenNotes" 
        component={HiddenNotesScreen}
      />
      <Stack.Screen 
        name="PinScreen" 
        component={PinScreen}
      />
      <Stack.Screen 
        name="Task" 
        component={EditNote}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
      />
    </Stack.Navigator>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OnboardingProvider>
        <NotesProvider>
          <ThemeProvider>
            <LanguageProvider>
              <View style={{ flex: 1 }}>
                <Navigation />
              </View>
            </LanguageProvider>
          </ThemeProvider>
        </NotesProvider>
      </OnboardingProvider>
    </GestureHandlerRootView>
  );
}
