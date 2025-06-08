import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, appThemes } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useNotes } from '../NotesContext';
import { Note } from '../NotesContext';

interface BackupData {
  notes: Note[];
  categories?: {
    id: string;
    name: string;
    color: string;
  }[];
  version: string;
  backupDate: string;
}

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
  HiddenNotes: undefined;
  PinScreen: { isChangingPin?: boolean };
  BackupRestore: undefined;
  Analytics: undefined;
};

const colorTranslationMap = {
  none: 'tagColors.none',
  green: 'tagColors.green',
  purple: 'tagColors.purple',
  blue: 'tagColors.blue',
  orange: 'tagColors.orange',
  red: 'tagColors.red'
} as const;

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode, appTheme, setAppTheme } = useTheme();
  const { t, currentLanguage, setLanguage } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | null>(null);
  const { notes, importNotes, clearStorage } = useNotes();
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameInput, setShowUsernameInput] = useState(false);

  useEffect(() => {
    checkBiometrics();
    loadBiometricsPreference();
    loadUsername();
  }, []);

  const checkBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const hasBiometricSupport = hasHardware && isEnrolled && 
        supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      
      setHasBiometrics(hasBiometricSupport);
      if (hasBiometricSupport) {
        setBiometricType('fingerprint');
      }
    } catch (error) {
      console.error('Error checking biometrics:', error);
    }
  };

  const loadBiometricsPreference = async () => {
    const enabled = await AsyncStorage.getItem('@biometrics_enabled');
    setBiometricsEnabled(enabled === 'true');
  };

  const toggleBiometrics = async () => {
    const newValue = !biometricsEnabled;
    await AsyncStorage.setItem('@biometrics_enabled', newValue.toString());
    setBiometricsEnabled(newValue);
  };

  const loadUsername = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('@username');
      setUsername(savedUsername);
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  const handleUpdateUsername = async (newUsername: string) => {
    try {
      const trimmedUsername = newUsername.trim();
      if (trimmedUsername) {
        await AsyncStorage.setItem('@username', trimmedUsername);
        setUsername(trimmedUsername);
      }
      setShowUsernameInput(false);
    } catch (error) {
      console.error('Error updating username:', error);
    }
  };

  const handleExportNotes = async () => {
    try {
      // Show progress alert
      Alert.alert(t('exportNotesTitle'), t('preparingBackup'));

      // Get all data to backup
      const backupData: BackupData = {
        notes: notes.map(note => ({
          ...note,
          updatedAt: new Date().toISOString()
        })),
        categories: notes
          .map(note => note.color)
          .filter((color): color is string => !!color)
          .filter((color, index, self) => self.indexOf(color) === index)
          .map(color => ({
            id: color,
            name: color === 'none' ? t('noTag') :
                  color === 'green' ? t('personal') :
                  color === 'purple' ? t('work') :
                  color === 'blue' ? t('study') :
                  color === 'orange' ? t('ideas') :
                  color === 'red' ? t('important') : t('noTag'),
            color: color
          })),
        version: '1.0.7',
        backupDate: new Date().toISOString()
      };

      // Validate backup data
      if (!Array.isArray(backupData.notes)) {
        throw new Error('Invalid notes data structure');
      }

      // Create file path with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileUri = `${FileSystem.documentDirectory}keepmynotes_backup_${timestamp}.json`;
      
      // Write data to file with pretty formatting
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(backupData, null, 2)
      );

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: t('exportNotesTitle'),
          UTI: 'public.json'
        });

        // Delete the temporary file after sharing
        try {
          await FileSystem.deleteAsync(fileUri);
        } catch (error) {
          console.warn('Error deleting temporary backup file:', error);
        }
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error exporting notes:', error);
      Alert.alert(
        t('error'),
        t('exportError'),
        [{ text: 'OK' }]
      );
    }
  };

  const handleImportNotes = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        
        try {
          // Show progress
          Alert.alert(t('importNotesTitle'), t('readingBackupFile'));
          
          const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);
          const importedData = JSON.parse(fileContent);

          // Validate backup structure
          if (!importedData || typeof importedData !== 'object') {
            throw new Error(t('invalidBackupFormat'));
          }

          if (!importedData.notes || !Array.isArray(importedData.notes)) {
            throw new Error(t('invalidNotesFormat'));
          }

          // Validate and prepare notes
          const validatedNotes = importedData.notes.map((note: any) => ({
            id: String(note.id || Date.now()),
            title: String(note.title || '').trim(),
            description: String(note.description || '').trim(),
            content: String(note.content || note.description || '').trim(),
            type: ((note.type === 'checklist' || note.type === 'task') ? 'checklist' : 'text') as Note['type'],
            isFavorite: Boolean(note.isFavorite),
            isHidden: Boolean(note.isHidden),
            tasks: Array.isArray(note.tasks) ? note.tasks.map((task: any) => ({
              text: String(task.text || '').trim(),
              isCompleted: Boolean(task.isCompleted)
            })) : [],
            color: note.color || null,
            createdAt: note.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));

          if (validatedNotes.length === 0) {
            Alert.alert(t('error'), t('noNotesInBackup'));
            return;
          }

          // Show confirmation with backup details
          Alert.alert(
            t('importNotesTitle'),
            t('backupDetails')
              .replace('{count}', validatedNotes.length.toString())
              .replace('{date}', new Date(importedData.backupDate || Date.now()).toLocaleDateString())
              .replace('{version}', importedData.version || '1.0.7'),
            [
              {
                text: t('cancel'),
                style: 'cancel'
              },
              {
                text: t('import'),
                style: 'default',
                onPress: async () => {
                  try {
                    // Update importedData with validated notes
                    importedData.notes = validatedNotes;
                    
                    // If we have categories in the backup, make sure they are properly formatted
                    if (importedData.categories && Array.isArray(importedData.categories)) {
                      importedData.categories = importedData.categories.map((category: { id?: string; name?: string; color?: string }) => ({
                        id: String(category.id || ''),
                        name: String(category.name || ''),
                        color: String(category.color || '')
                      }));
                    }
                    
                    await importNotes(importedData);
                    
                    // Show success message
                    Alert.alert(
                      t('success'),
                      t('importSuccessDetails')
                        .replace('{count}', validatedNotes.length.toString())
                    );
                    
                    // Close settings modal
                    navigation.goBack();
                  } catch (error) {
                    console.error('Error during import:', error);
                    Alert.alert(
                      t('error'),
                      typeof error === 'object' && error !== null && 'message' in error 
                        ? String(error.message)
                        : t('importError')
                    );
                  }
                }
              }
            ]
          );

          // Clean up the temporary file
          try {
            await FileSystem.deleteAsync(selectedFile.uri);
          } catch (error) {
            console.warn('Error deleting temporary import file:', error);
          }
        } catch (error) {
          console.error('Error processing backup file:', error);
          Alert.alert(t('error'), t('invalidBackupFile'));
        }
      }
    } catch (error) {
      console.error('Error in file selection:', error);
      Alert.alert(t('error'), t('fileSelectionError'));
    }
  };

  const handleResetStorage = () => {
    // Πρώτο μήνυμα επιβεβαίωσης
    Alert.alert(
      t('resetData'),
      t('resetDataConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('continue'), 
          style: 'destructive',
          onPress: () => {
            // Δεύτερο μήνυμα επιβεβαίωσης
            Alert.alert(
              t('finalWarning'),
              t('noUndoWarning'),
              [
                {
                  text: t('cancel'),
                  style: 'cancel'
                },
                {
                  text: t('reset'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await clearStorage();
                      ToastAndroid.show(t('dataDeletedSuccess'), ToastAndroid.SHORT);
                    } catch (error) {
                      console.error('Error resetting storage:', error);
                      Alert.alert(
                        t('error'),
                        t('resetDataError')
                      );
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.textColor,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 16,
    },
    contentContainer: {
      paddingTop: 16,
      paddingBottom: 32,
      flexGrow: 1,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.placeholderColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
      marginLeft: 4,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: theme.secondaryBackground,
      marginBottom: 6,
      borderRadius: 12,
    },
    settingIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingLabel: {
      fontSize: 14,
      color: theme.textColor,
      fontWeight: '600',
    },
    settingValue: {
      fontSize: 12,
      color: theme.placeholderColor,
      fontWeight: '500',
      marginTop: 2,
    },
    radioButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    radioButtonInner: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.accentColor,
    },
    activeItem: {
      backgroundColor: `${theme.accentColor}15`,
      borderWidth: 1,
      borderColor: `${theme.accentColor}30`,
    },
    switch: {
      marginLeft: 12,
      transform: [{ scale: 1.1 }],
    },
    version: {
      marginTop: 16,
      alignItems: 'center',
      paddingBottom: 16,
      opacity: 0.5,
    },
    versionText: {
      color: theme.textColor,
      fontSize: 12,
      fontWeight: '500',
    },
    themeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    themeItem: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
    },
    themeIcon: {
      width: 40,
      height: 40,
      borderRadius: 15,
      backgroundColor: `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    themeLabel: {
      fontSize: 11,
      color: theme.textColor,
      fontWeight: '600',
      textAlign: 'center',
    },
    themeItemActive: {
      backgroundColor: `${theme.accentColor}15`,
      borderWidth: 1,
      borderColor: `${theme.accentColor}30`,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      marginBottom: 8,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContent: {
      flex: 1,
      marginLeft: 12,
    },
    infoLabel: {
      fontSize: 15,
      color: theme.textColor,
      fontWeight: '600',
    },
    infoValue: {
      fontSize: 13,
      color: theme.placeholderColor,
      marginTop: 2,
    },
    chevronContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorThemeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      padding: 10,
      paddingHorizontal: 16,
    },
    colorThemeItem: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 2,
    },
    colorThemeItemInner: {
      width: '100%',
      height: '100%',
      borderRadius: 6,
    },
    colorThemeActive: {
      borderWidth: 2,
      borderColor: theme.accentColor,
      transform: [{ scale: 1.15 }],
    },
    settingContent: {
      flex: 1,
      marginLeft: 12,
    },
    continueButton: {
      backgroundColor: theme.accentColor,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    usernameModal: {
      position: 'absolute',
      left: 20,
      right: 20,
      top: '40%',
      padding: 20,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    usernameModalTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },
    usernameInput: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      marginBottom: 16,
    },
    usernameModalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    usernameModalButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    usernameModalButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingText: {
      fontSize: 16,
      fontWeight: '500',
    },
    dangerZone: {
      marginTop: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: '#FF3B30',
      borderRadius: 12,
      backgroundColor: 'rgba(255, 59, 48, 0.05)',
    },
    dangerZoneHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    dangerZoneTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FF3B30',
      marginLeft: 8,
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    dangerZoneDescription: {
      color: theme.placeholderColor,
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={theme.backgroundColor}
        barStyle={theme.isDarkMode ? "light-content" : "dark-content"}
      />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('settings')}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {t('information')}
          </Text>
          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => setShowUsernameInput(true)}
          >
            <View style={styles.infoIcon}>
              <Ionicons name="person-outline" size={22} color={theme.accentColor} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('username')}</Text>
              <Text style={styles.infoValue}>{username || t('enterUsername')}</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={16} color={theme.placeholderColor} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 {t('language')}</Text>
          <View style={styles.themeContainer}>
            <TouchableOpacity 
              style={[styles.themeItem, currentLanguage === 'en' && styles.themeItemActive]}
              onPress={() => setLanguage('en')}
            >
              <View style={styles.themeIcon}>
                <Text style={{ fontSize: 24 }}>🇬🇧</Text>
              </View>
              <Text style={styles.themeLabel}>{t('english')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeItem, currentLanguage === 'el' && styles.themeItemActive]}
              onPress={() => setLanguage('el')}
            >
              <View style={styles.themeIcon}>
                <Text style={{ fontSize: 24 }}>🇬🇷</Text>
              </View>
              <Text style={styles.themeLabel}>{t('greek')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeItem, currentLanguage === 'es' && styles.themeItemActive]}
              onPress={() => setLanguage('es')}
            >
              <View style={styles.themeIcon}>
                <Text style={{ fontSize: 24 }}>🇪🇸</Text>
              </View>
              <Text style={styles.themeLabel}>{t('spanish')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 {t('display')}</Text>
          <View style={styles.themeContainer}>
            <TouchableOpacity 
              style={[styles.themeItem, themeMode === 'system' && styles.themeItemActive]}
              onPress={() => setThemeMode('system')}
            >
              <View style={styles.themeIcon}>
                <Ionicons name="sunny-outline" size={24} color={theme.accentColor} />
              </View>
              <Text style={styles.themeLabel}>{t('systemTheme')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeItem, themeMode === 'light' && styles.themeItemActive]}
              onPress={() => setThemeMode('light')}
            >
              <View style={styles.themeIcon}>
                <Ionicons name="sunny" size={24} color={theme.accentColor} />
              </View>
              <Text style={styles.themeLabel}>{t('lightTheme')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeItem, themeMode === 'dark' && styles.themeItemActive]}
              onPress={() => setThemeMode('dark')}
            >
              <View style={styles.themeIcon}>
                <Ionicons name="moon" size={24} color={theme.accentColor} />
              </View>
              <Text style={styles.themeLabel}>{t('darkTheme')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 {t('appTheme')}</Text>
          <View style={styles.colorThemeContainer}>
            {Object.entries(appThemes).map(([key, color]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.colorThemeItem,
                  { backgroundColor: theme.backgroundColor },
                  appTheme === key && styles.colorThemeActive,
                ]}
                onPress={() => setAppTheme(key as 'purple' | 'blue' | 'green' | 'orange' | 'pink')}
              >
                <View 
                  style={[
                    styles.colorThemeItemInner,
                    { backgroundColor: color }
                  ]} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 {t('security')}</Text>
          <TouchableOpacity 
            style={styles.infoItem}
            onPress={async () => {
              const hasPin = await AsyncStorage.getItem('@secure_pin');
              if (!hasPin) {
                navigation.navigate('PinScreen', { isChangingPin: false });
              } else {
                navigation.navigate('PinScreen', { isChangingPin: true });
              }
            }}
          >
            <View style={styles.infoIcon}>
              <Ionicons name="key-outline" size={22} color={theme.accentColor} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('changePin')}</Text>
              <Text style={styles.infoValue}>{t('changePinDescription')}</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={16} color={theme.placeholderColor} />
            </View>
          </TouchableOpacity>

          {hasBiometrics && (
            <TouchableOpacity 
              style={[styles.infoItem, { marginTop: 8 }]}
              onPress={toggleBiometrics}
            >
              <View style={styles.infoIcon}>
                <Ionicons 
                  name="finger-print-outline"
                  size={22} 
                  color={theme.accentColor} 
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('biometricAuth')}</Text>
                <Text style={styles.infoValue}>
                  {biometricsEnabled ? t('enabled') : t('disabled')}
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={toggleBiometrics}
                trackColor={{ 
                  false: `${theme.placeholderColor}40`,
                  true: `${theme.accentColor}80`
                }}
                thumbColor={biometricsEnabled ? theme.accentColor : theme.backgroundColor}
                ios_backgroundColor={`${theme.placeholderColor}40`}
                style={styles.switch}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 {t('backupNotes')}</Text>
          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => navigation.navigate('BackupRestore')}
          >
            <View style={styles.infoIcon}>
              <Ionicons 
                name="server-outline" 
                size={22} 
                color={theme.accentColor}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('backupAndRestore')}</Text>
              <Text style={styles.infoValue}>{t('backupAndRestoreDescription')}</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={16} color={theme.placeholderColor} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 {t('analytics')}</Text>
          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => navigation.navigate('Analytics')}
          >
            <View style={styles.infoIcon}>
              <Ionicons 
                name="analytics-outline" 
                size={22} 
                color={theme.accentColor}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('analyticsAndStats')}</Text>
              <Text style={styles.infoValue}>{t('analyticsDescription')}</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={16} color={theme.placeholderColor} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.version}>
          <Text style={styles.versionText}>📱 Version 1.0.7</Text>
        </View>
      </ScrollView>

      {showUsernameInput && (
        <Modal
          visible={showUsernameInput}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUsernameInput(false)}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.usernameModal, { backgroundColor: theme.backgroundColor }]}>
              <Text style={[styles.usernameModalTitle, { color: theme.textColor }]}>
                {t('enterUsername')}
              </Text>
              <TextInput
                style={[styles.usernameInput, { 
                  backgroundColor: theme.secondaryBackground,
                  color: theme.textColor,
                  borderColor: theme.borderColor
                }]}
                value={username || ''}
                onChangeText={setUsername}
                placeholder={t('enterUsername')}
                placeholderTextColor={theme.placeholderColor}
              />
              <View style={styles.usernameModalButtons}>
                <TouchableOpacity 
                  style={[styles.usernameModalButton, { backgroundColor: theme.secondaryBackground }]}
                  onPress={() => setShowUsernameInput(false)}
                >
                  <Text style={[styles.usernameModalButtonText, { color: theme.textColor }]}>
                    {t('cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.usernameModalButton, { backgroundColor: theme.accentColor }]}
                  onPress={() => handleUpdateUsername(username || '')}
                >
                  <Text style={styles.usernameModalButtonText}>
                    {t('save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}