import { Stack } from 'expo-router';
import { NotesProvider } from './NotesContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ThemeContext from './context/ThemeContext';
import LanguageContext from './context/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageContext.Provider>
      <ThemeContext.Provider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NotesProvider>
            <Stack screenOptions={{
              headerShown: false
            }} />
          </NotesProvider>
        </GestureHandlerRootView>
      </ThemeContext.Provider>
    </LanguageContext.Provider>
  );
}
