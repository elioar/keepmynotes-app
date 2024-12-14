import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './HomeScreen';
import AddEditNoteScreen from './AddEditNoteScreen';
import FavoritesScreen from './components/FavoritesScreen';
import { NotesProvider } from './NotesContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import HiddenNotesScreen from './components/HiddenNotesScreen';
import SecurityCheck from './components/SecurityCheck';
import PinScreen from './components/PinScreen';
import TaskScreen from './components/TaskScreen';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
  HiddenNotes: undefined;
  PinScreen: { isChangingPin?: boolean };
  SecurityCheck: undefined;
  Task: undefined;
};

const Stack = createNativeStackNavigator();

function Navigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="AddEditNote" 
        component={AddEditNoteScreen} 
      />
      <Stack.Screen
        name="SecurityCheck"
        component={SecurityCheck}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="HiddenNotes"
        component={HiddenNotesScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PinScreen"
        component={PinScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen 
        name="Task" 
        component={TaskScreen}
        options={{ 
          animation: 'slide_from_right',
          presentation: 'card'
        }}
      />
    </Stack.Navigator>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotesProvider>
        <ThemeProvider>
          <LanguageProvider>
            <UserProvider>
              <View style={{ flex: 1 }}>
                <Navigation />
              </View>
            </UserProvider>
          </LanguageProvider>
        </ThemeProvider>
      </NotesProvider>
    </GestureHandlerRootView>
  );
}
