import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootLayout from './app/_layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from './context/NotesContext';
import { CategoryProvider } from './context/CategoryContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <NotesProvider>
            <CategoryProvider>
              <RootLayout />
            </CategoryProvider>
          </NotesProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 