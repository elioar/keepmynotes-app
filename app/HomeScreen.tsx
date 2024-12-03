import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotes } from './NotesContext';
import HighlightText from './components/HighlightText';
import { Swipeable } from 'react-native-gesture-handler';
import AddNoteModal from './components/AddNoteModal';
import type { TaskItem } from './NotesContext';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import { useUser } from './context/UserContext';
import UsernameModal from './components/UsernameModal';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const { notes, deleteNote, updateNote } = useNotes();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [localUsername, setLocalUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(true);

  useEffect(() => {
    const loadSavedUsername = async () => {
      try {
        const saved = await AsyncStorage.getItem('@username');
        if (saved) {
          setLocalUsername(saved);
          setShowUsernameModal(false);
        }
      } catch (error) {
        console.error('Error loading username:', error);
      }
    };
    loadSavedUsername();
  }, []);

  const handleNotePress = (note: any) => {
    navigation.navigate('AddEditNote', { note });
  };
  const handleAddNote = () => {
    navigation.navigate('AddEditNote', { note: undefined });
  };

  const toggleChecklistItem = async (noteId: string, itemIndex: number) => {
    const noteToUpdate = notes.find(note => note.id === noteId);
    if (noteToUpdate?.type === 'task' && noteToUpdate.tasks) {
      const newItems = noteToUpdate.tasks.map((task, index) => {
        if (index === itemIndex) {
          return { ...task, isCompleted: !task.isCompleted };
        }
        return task;
      });
      await updateNote({ ...noteToUpdate, tasks: newItems });
    }
  };

  const handleShare = (note: any) => {
    // Implement share functionality
    console.log('Sharing note:', note.title);
  };

  const handleDelete = async (noteId: string | undefined) => {
    if (!noteId) return;
    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const filteredNotes = notes.filter(note => {
    const searchLower = searchQuery.toLowerCase().trim();
    
    // Αν δεν υπάρχει κείμενο αναζήτησης, επέστρεψε όλες τις σημειώσεις
    if (!searchLower) return true;
    
    // Έλεγχος τίτλου
    if (note.title.toLowerCase().includes(searchLower)) return true;
    
    // Έλεγχος περιγραφής
    if (note.description?.toLowerCase().includes(searchLower)) return true;
    
    // Έλεγχος στοιχείων λίστας
    if (note.tasks?.some((task: TaskItem) => 
      task.text.toLowerCase().includes(searchLower)
    )) return true;
    
    return false;
  });

  // Βοηθητική συνάρτηση για περικοπή κειμένου
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleOptionSelect = (type: string) => {
    setIsModalVisible(false);
    switch (type) {
      case 'note':
        navigation.navigate('AddEditNote', { note: { type: 'text' } });
        break;
      case 'task':
        navigation.navigate('AddEditNote', { note: { type: 'checklist' } });
        break;
      // Προσθέστε περισσότερες περιπτώσεις όπως χρειάζεται
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t('justNow');
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return t('justNow');
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${t(minutes === 1 ? 'minuteAgo' : 'minutesAgo')}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${t(hours === 1 ? 'hourAgo' : 'hoursAgo')}`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${t(days === 1 ? 'dayAgo' : 'daysAgo')}`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months} ${t(months === 1 ? 'monthAgo' : 'monthsAgo')}`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years} ${t(years === 1 ? 'yearAgo' : 'yearsAgo')}`;
      }
    } catch (error) {
      return t('justNow');
    }
  };

  const handleUsernameSubmit = async (name: string) => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) return;
      
      await AsyncStorage.setItem('@username', trimmedName);
      setLocalUsername(trimmedName);
      setShowUsernameModal(false);
    } catch (error) {
      console.error('Error saving username:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackground,
      margin: 8,
      marginBottom: 16,
      borderRadius: 12,
      paddingHorizontal: 10,
      height: 45,
    },
    searchInput: {
      flex: 1,
      color: theme.textColor,
      fontSize: 15,
      marginLeft: 8,
    },
    notesContainer: {
      flex: 1,
      paddingHorizontal: 8,
      paddingTop: 8,
    },
    noteCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      height: 190,
      flexDirection: 'column',
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    noteDate: {
      color: theme.placeholderColor,
      fontSize: 12,
      fontWeight: '500',
    },
    noteContent: {
      flex: 1,
      justifyContent: 'flex-start',
      paddingVertical: 2,
    },
    noteTitle: {
      color: theme.textColor,
      fontSize: 17,
      fontWeight: '600',
      marginBottom: 4,
    },
    noteDescription: {
      color: theme.placeholderColor,
      fontSize: 14,
      lineHeight: 18,
      overflow: 'hidden',
    },
    noteFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: 4,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#4CAF50',
      marginRight: 4,
    },
    statusText: {
      color: theme.placeholderColor,
      fontSize: 11,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    shareButton: {
      padding: 4,
    },
    actionContainer: {
      width: 80,
      height: 190,
      marginBottom: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButton: {
      flex: 1,
      width: '100%',
      backgroundColor: '#FF4E4E',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      height: 190,
      borderLeftWidth: 3,
      borderLeftColor: '#FF4E4E',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 30,
    },
    headerGreeting: {
      fontSize: 28,
      fontWeight: '600',
      color: theme.textColor,
      paddingTop: 35,
    },
    headerName: {
      fontSize: 32,
      fontWeight: '600',
      color: theme.textColor,
      marginTop: 5,
    },
    menuButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar 
        backgroundColor={theme.backgroundColor} 
        barStyle={theme.isDarkMode ? "light-content" : "dark-content"} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>
            {t('hello')},
          </Text>
          <Text style={styles.headerName}>
            {localUsername ? `${localUsername} 👋` : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setIsSettingsVisible(true)}
        >
          <Ionicons name="menu" size={28} color={theme.textColor} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color={theme.placeholderColor} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchHere')}
          placeholderTextColor={theme.placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={24} color={theme.placeholderColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Notes List */}
      <ScrollView style={styles.notesContainer}>
        {filteredNotes.map((note) => (
          <Swipeable
            key={note.id}
            renderRightActions={(progress, dragX) => (
              <View style={styles.actionContainer}>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDelete(note.id)}
                >
                  <Ionicons name="trash-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            overshootRight={false}
            friction={2}
            rightThreshold={40}
          >
            <Pressable 
              style={styles.noteCard}
              onPress={() => handleNotePress(note)}
            >
              <View style={styles.noteHeader}>
                <Text style={styles.noteDate}>
                  {new Date(note.createdAt || new Date().toISOString()).toLocaleDateString('en-US', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </Text>
                <TouchableOpacity onPress={() => handleShare(note)}>
                  <Ionicons name="share-outline" size={24} color={theme.placeholderColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.noteContent}>
                <Text style={styles.noteTitle} numberOfLines={1}>
                  <HighlightText 
                    text={note.title}
                    highlight={searchQuery}
                    style={styles.noteTitle}
                  />
                </Text>

                {note.description && (
                  <Text style={styles.noteDescription} numberOfLines={2}>
                    <HighlightText 
                      text={truncateText(note.description, 100)}
                      highlight={searchQuery}
                      style={styles.noteDescription}
                    />
                  </Text>
                )}
              </View>

              <View style={styles.noteFooter}>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>
                    {getTimeAgo(note.createdAt || new Date().toISOString())}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Swipeable>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <AddNoteModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelectOption={handleOptionSelect}
      />

      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        username={localUsername}
        onUpdateUsername={handleUsernameSubmit}
      />

      <UsernameModal
        visible={showUsernameModal}
        onSubmit={handleUsernameSubmit}
      />
    </View>
  );
} 