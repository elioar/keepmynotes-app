import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootLayout from './app/_layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from './app/context/NotesContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <NotesProvider>
            <RootLayout />
          </NotesProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 