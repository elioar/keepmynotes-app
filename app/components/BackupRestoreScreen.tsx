import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  Settings: undefined;
  BackupRestore: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BackupRestoreScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const { notes, importNotes, clearStorage } = useNotes();

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
        version: '1.0.6',
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
              .replace('{version}', importedData.version || '1.0.0'),
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
    // First confirmation message
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
            // Second confirmation message
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
                      // Return to home screen after successfully deleting data
                      navigation.navigate('Home');
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
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.placeholderColor,
      marginBottom: 16,
      lineHeight: 20,
    },
    optionCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: theme.placeholderColor,
      lineHeight: 20,
    },
    dangerZone: {
      marginTop: 32,
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
      backgroundColor: '#FF3B30',
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
      color: '#FFFFFF',
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
          <Text style={styles.title}>{t('backupAndRestoreTitle')}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('backupAndRestore')}</Text>
          <Text style={styles.sectionDescription}>{t('backupAndRestoreDescription')}</Text>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={handleExportNotes}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name="download-outline" 
                size={24} 
                color={theme.accentColor}
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{t('downloadBackup')}</Text>
              <Text style={styles.optionDescription}>{t('downloadBackupDescription')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={handleImportNotes}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name="cloud-upload-outline" 
                size={24} 
                color={theme.accentColor}
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{t('uploadBackup')}</Text>
              <Text style={styles.optionDescription}>{t('uploadBackupDescription')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerZone}>
          <View style={styles.dangerZoneHeader}>
            <Ionicons name="warning" size={22} color="#FF3B30" />
            <Text style={styles.dangerZoneTitle}>{t('dangerZone')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleResetStorage}
          >
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
            <Text style={styles.dangerButtonText}>{t('resetData')}</Text>
          </TouchableOpacity>
          <Text style={styles.dangerZoneDescription}>{t('resetDataWarning')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 