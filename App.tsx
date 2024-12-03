import { UserProvider } from './app/context/UserContext';
import { ThemeProvider } from './app/context/ThemeContext';
import { LanguageProvider } from './app/context/LanguageContext';
import { NotesProvider } from './app/NotesContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootLayout from './app/_layout';

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <UserProvider>
          <LanguageProvider>
            <ThemeProvider>
              <NotesProvider>
                <RootLayout />
              </NotesProvider>
            </ThemeProvider>
          </LanguageProvider>
        </UserProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
} 