import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
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
  const { notes, importNotes, migrateLocalNotesToFirestore } = useNotes();
  const [isMigrating, setIsMigrating] = useState(false);

  const handleExportNotes = async () => {
    try {
      // Show progress alert
      Alert.alert(t('exportNotesTitle'), t('preparingBackup'));

      // Get all data to backup - include ALL notes (active, deleted, hidden, favorites)
      const backupData: BackupData = {
        notes: notes.map(note => ({
          id: note.id,
          title: note.title,
          description: note.description,
          content: note.content,
          type: note.type,
          isFavorite: note.isFavorite,
          isHidden: note.isHidden,
          isDeleted: note.isDeleted || false,
          deletedAt: note.deletedAt,
          tasks: note.tasks,
          color: note.color,
          tags: note.tags,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          isSynced: note.isSynced
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
        version: '1.1.0',
        backupDate: new Date().toISOString()
      };

      // Validate backup data
      if (!Array.isArray(backupData.notes)) {
        throw new Error('Invalid notes data structure');
      }

      console.log(`📦 Exporting ${backupData.notes.length} notes (including deleted, hidden, and favorites)`);

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

          // Validate and prepare notes with ALL fields
          const validatedNotes = importedData.notes.map((note: any) => ({
            id: String(note.id || Date.now() + Math.random()),
            title: String(note.title || '').trim(),
            description: String(note.description || '').trim(),
            content: String(note.content || note.description || '').trim(),
            type: ((note.type === 'checklist' || note.type === 'task') ? 'checklist' : 'text') as Note['type'],
            isFavorite: Boolean(note.isFavorite),
            isHidden: Boolean(note.isHidden),
            isDeleted: Boolean(note.isDeleted),
            deletedAt: note.deletedAt || undefined,
            tasks: Array.isArray(note.tasks) ? note.tasks.map((task: any) => ({
              text: String(task.text || '').trim(),
              isCompleted: Boolean(task.isCompleted),
              dueDate: task.dueDate,
              dueTime: task.dueTime,
              priority: task.priority,
              location: task.location,
              isAllDay: task.isAllDay,
              reminder: task.reminder,
              repeat: task.repeat,
              customRepeat: task.customRepeat
            })) : [],
            color: note.color ? String(note.color) : undefined,
            tags: Array.isArray(note.tags) ? note.tags : [],
            createdAt: note.createdAt || new Date().toISOString(),
            updatedAt: note.updatedAt || new Date().toISOString(),
            isSynced: false // Will be synced after import
          }));

          if (validatedNotes.length === 0) {
            Alert.alert(t('error'), t('noNotesInBackup'));
            return;
          }

          // Count different types of notes
          const activeNotes = validatedNotes.filter((n: any) => !n.isDeleted && !n.isHidden).length;
          const favoritesCount = validatedNotes.filter((n: any) => n.isFavorite).length;
          const hiddenCount = validatedNotes.filter((n: any) => n.isHidden).length;
          const deletedCount = validatedNotes.filter((n: any) => n.isDeleted).length;

          // Show confirmation with detailed backup info
          const detailsMessage = `${t('backupDetails')
            .replace('{count}', validatedNotes.length.toString())
            .replace('{date}', new Date(importedData.backupDate || Date.now()).toLocaleDateString())
            .replace('{version}', importedData.version || '1.0.0')}

Active: ${activeNotes}
${t('favorites')}: ${favoritesCount}
${t('hiddenNotes')}: ${hiddenCount}
${t('trash')}: ${deletedCount}`;

          Alert.alert(
            t('importNotesTitle'),
            detailsMessage,
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
                    
                    console.log(`📥 Importing ${validatedNotes.length} notes (Active: ${activeNotes}, Favorites: ${favoritesCount}, Hidden: ${hiddenCount}, Trash: ${deletedCount})`);
                    
                    await importNotes(importedData);
                    
                    // Show success message with details
                    Alert.alert(
                      t('success'),
                      `${t('importSuccessDetails').replace('{count}', validatedNotes.length.toString())}

${t('favorites')}: ${favoritesCount}
${t('hiddenNotes')}: ${hiddenCount}
${t('trash')}: ${deletedCount}`,
                      [{ text: 'OK', onPress: () => navigation.goBack() }]
                    );
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

  const handleMigrateLegacyNotes = async () => {
    try {
      setIsMigrating(true);
      const result = await migrateLocalNotesToFirestore();
      
      setIsMigrating(false);
      
      if (result.success) {
        if (result.message === 'noLegacyNotes') {
          Alert.alert(
            t('migrationTitle') || 'Migration',
            t('noLegacyNotesFound') || 'No old local notes were found to migrate.',
            [{ text: 'OK' }]
          );
        } else if (result.message === 'alreadyMigrated') {
          Alert.alert(
            t('migrationTitle') || 'Migration',
            t('alreadyMigrated') || 'Your notes have already been migrated.',
            [{ text: 'OK' }]
          );
        } else if (result.message === 'allNotesExist') {
          Alert.alert(
            t('migrationTitle') || 'Migration',
            t('allNotesAlreadyExist') || 'All your local notes already exist in the cloud.',
            [{ text: 'OK' }]
          );
        } else if (result.message === 'migrationSuccess') {
          Alert.alert(
            t('success') || 'Success',
            (t('migrationSuccessMessage') || 'Successfully migrated {count} notes to the cloud!')
              .replace('{count}', result.migratedCount.toString()),
            [{ text: 'OK' }]
          );
        }
      } else {
        if (result.message === 'noUserLoggedIn') {
          Alert.alert(
            t('error') || 'Error',
            t('pleaseLoginFirst') || 'Please log in first to migrate your notes.',
            [{ text: 'OK' }]
          );
        } else if (result.message === 'parseError') {
          Alert.alert(
            t('error') || 'Error',
            t('corruptedLocalData') || 'Could not read local notes data. The data may be corrupted.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            t('error') || 'Error',
            t('migrationError') || 'An error occurred while migrating your notes. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      setIsMigrating(false);
      console.error('Error in migration handler:', error);
      Alert.alert(
        t('error') || 'Error',
        t('migrationError') || 'An error occurred while migrating your notes. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
    optionCardDisabled: {
      opacity: 0.5,
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
    optionTitleDisabled: {
      color: theme.placeholderColor,
    },
    optionDescription: {
      fontSize: 14,
      color: theme.placeholderColor,
      lineHeight: 20,
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('legacyNotesMigration') || 'Legacy Notes Migration'}</Text>
          <Text style={styles.sectionDescription}>
            {t('legacyNotesMigrationDescription') || 'If you had notes saved locally before the login requirement, use this to migrate them to the cloud.'}
          </Text>

          <TouchableOpacity 
            style={[styles.optionCard, isMigrating && styles.optionCardDisabled]}
            onPress={handleMigrateLegacyNotes}
            disabled={isMigrating}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name={isMigrating ? "hourglass-outline" : "sync-outline"} 
                size={24} 
                color={isMigrating ? theme.placeholderColor : theme.accentColor}
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, isMigrating && styles.optionTitleDisabled]}>
                {isMigrating ? (t('migrating') || 'Migrating...') : (t('migrateOldNotes') || 'Migrate Old Notes')}
              </Text>
              <Text style={styles.optionDescription}>
                {t('migrateOldNotesDescription') || 'Transfer locally saved notes to your cloud account'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 