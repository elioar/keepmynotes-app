import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboarding } from '../context/OnboardingContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const normalize = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  return Math.round(size * scale);
};

export default function UserPreferencesScreen() {
  const navigation = useNavigation<any>();
  const { theme, toggleColorScheme, appTheme, setAppTheme, appThemes } = useTheme();
  const { t, setLanguage, currentLanguage } = useLanguage();
  const { setFirstLaunchComplete } = useOnboarding();
  const [username, setUsername] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(theme.isDarkMode ? 'dark' : 'light');
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setSelectedTheme(newTheme);
    if ((newTheme === 'dark' && !theme.isDarkMode) || 
        (newTheme === 'light' && theme.isDarkMode)) {
      toggleColorScheme();
    }
  };

  const handleLanguageChange = (newLanguage: 'en' | 'el') => {
    setSelectedLanguage(newLanguage);
    setLanguage(newLanguage);
  };

  const handleComplete = async () => {
    try {
      await setFirstLaunchComplete();
      navigation.replace('Home');
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    header: {
      marginTop: Platform.OS === 'ios' ? 20 : 40,
      marginBottom: 40,
    },
    title: {
      fontSize: normalize(28),
      fontWeight: '800',
      color: theme.textColor,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: normalize(14),
      color: theme.placeholderColor,
      lineHeight: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: normalize(12),
      fontWeight: '600',
      color: theme.placeholderColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16,
      height: 56,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: `${theme.textColor}10`,
    },
    input: {
      flex: 1,
      fontSize: normalize(15),
      color: theme.textColor,
      marginLeft: 12,
    },
    preferencesContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 32,
    },
    preferenceGroup: {
      flex: 1,
    },
    optionsRow: {
      flexDirection: 'row',
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: `${theme.textColor}10`,
    },
    optionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    selectedOption: {
      backgroundColor: `${theme.accentColor}10`,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    optionIcon: {
      opacity: 0.5,
    },
    selectedOptionIcon: {
      opacity: 1,
    },
    optionText: {
      fontSize: normalize(13),
      color: theme.textColor,
      opacity: 0.5,
    },
    selectedOptionText: {
      opacity: 1,
      color: theme.accentColor,
    },
    colorSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: `${theme.textColor}10`,
    },
    colorGrid: {
      flex: 1,
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'space-between',
    },
    colorOption: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedColor: {
      borderWidth: 4,
      borderColor: `${theme.textColor}20`,
    },
    footer: {
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    },
    button: {
      backgroundColor: theme.accentColor,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      opacity: username.trim() ? 1 : 0.5,
      shadowColor: theme.accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: normalize(15),
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={theme.backgroundColor}
        barStyle={theme.isDarkMode ? "light-content" : "dark-content"}
        translucent
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('setupProfile')}</Text>
          <Text style={styles.subtitle}>{t('setupProfileDescription')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('username')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={theme.placeholderColor} />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={t('enterUsername')}
              placeholderTextColor={theme.placeholderColor}
            />
          </View>
        </View>

        <View style={styles.preferencesContainer}>
          <View style={styles.preferenceGroup}>
            <Text style={styles.sectionTitle}>{t('language')}</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedLanguage === 'en' && styles.selectedOption,
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionText,
                    selectedLanguage === 'en' && styles.selectedOptionText,
                  ]}>
                    🇬🇧
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedLanguage === 'el' && styles.selectedOption,
                ]}
                onPress={() => handleLanguageChange('el')}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionText,
                    selectedLanguage === 'el' && styles.selectedOptionText,
                  ]}>
                    🇬🇷
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.preferenceGroup}>
            <Text style={styles.sectionTitle}>{t('theme')}</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedTheme === 'light' && styles.selectedOption,
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <View style={styles.optionContent}>
                  <Ionicons 
                    name="sunny" 
                    size={16} 
                    color={selectedTheme === 'light' ? theme.accentColor : theme.textColor}
                    style={[styles.optionIcon, selectedTheme === 'light' && styles.selectedOptionIcon]}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedTheme === 'dark' && styles.selectedOption,
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <View style={styles.optionContent}>
                  <Ionicons 
                    name="moon" 
                    size={16} 
                    color={selectedTheme === 'dark' ? theme.accentColor : theme.textColor}
                    style={[styles.optionIcon, selectedTheme === 'dark' && styles.selectedOptionIcon]}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Theme</Text>
          <View style={styles.colorSection}>
            <Ionicons 
              name="color-palette-outline" 
              size={30} 
              color={theme.placeholderColor} 
            />
            <View style={styles.colorGrid}>
              {Object.entries(appThemes).map(([key, color]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    appTheme === key && styles.selectedColor,
                  ]}
                  onPress={() => setAppTheme(key as keyof typeof appThemes)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleComplete}
          disabled={!username.trim()}
        >
          <Text style={styles.buttonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 