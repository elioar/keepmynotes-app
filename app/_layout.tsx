import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './HomeScreen';
import FavoritesScreen from './components/FavoritesScreen';
import { NotesProvider } from './NotesContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { TaskProvider } from './context/TaskContext';
import HiddenNotesScreen from './components/HiddenNotesScreen';
import SecurityCheck from './components/SecurityCheck';
import PinScreen from './components/PinScreen';
import EditNote from './components/EditNote';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import WelcomeScreen from './components/WelcomeScreen';
import UserPreferencesScreen from './components/UserPreferencesScreen';
import SettingsScreen from './components/SettingsModal';
import CalendarScreen from './components/CalendarScreen';
import QuickTaskScreen from './components/QuickTaskScreen';

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
        animation: 'none'
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
        options={{
          freezeOnBlur: true,
          headerShown: false
        }}
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
        name="Tasks" 
        component={CalendarScreen}
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
      <Stack.Screen 
        name="QuickTask" 
        component={QuickTaskScreen}
        options={{
          presentation: 'modal',
          animation: 'none'
        }}
      />
      <Stack.Screen 
        name="AddEditNote" 
        component={EditNote}
        options={{
          presentation: 'card',
          animation: 'none',
          gestureEnabled: false
        }}
      />
    </Stack.Navigator>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OnboardingProvider>
        <NotesProvider>
          <TaskProvider>
            <ThemeProvider>
              <LanguageProvider>
                <View style={{ flex: 1 }}>
                  <Navigation />
                </View>
              </LanguageProvider>
            </ThemeProvider>
          </TaskProvider>
        </NotesProvider>
      </OnboardingProvider>
    </GestureHandlerRootView>
  );
}
