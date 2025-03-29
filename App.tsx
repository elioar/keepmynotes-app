import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootLayout from './app/_layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from './app/NotesContext';
import { TaskProvider } from './app/context/TaskContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <NotesProvider>
            <TaskProvider>
              <RootLayout />
            </TaskProvider>
          </NotesProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 