import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
  Easing,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
import UsernameModal from './components/UsernameModal';
import NavigationMenu from './components/NavigationMenu';
import FilterModal from './components/FilterModal';
import NoteActionMenu from './components/NoteActionMenu';
import * as Haptics from 'expo-haptics';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
  Task: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [fadingNoteId, setFadingNoteId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
    if (noteToUpdate?.type === 'checklist' && noteToUpdate.tasks) {
      const newItems = noteToUpdate.tasks.map((task, index) => {
        if (index === itemIndex) {
          return { ...task, isCompleted: !task.isCompleted };
        }
        return task;
      });
      await updateNote({ ...noteToUpdate, tasks: newItems });
    }
  };

  const handleFavorite = async (note: any) => {
    try {
      const updatedNote = { 
        ...note, 
        isFavorite: !note.isFavorite 
      };
      await updateNote(updatedNote);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDelete = async (noteId: string | undefined) => {
    if (!noteId) return;
    try {
      setFadingNoteId(noteId);
      
      // Configure layout animation
      LayoutAnimation.configureNext({
        duration: 500,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
          springDamping: 0.7,
        },
        update: {
          type: LayoutAnimation.Types.spring,
          springDamping: 0.7,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        }
      });

      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }).start(async () => {
        await deleteNote(noteId);
        setFadingNoteId(null);
        fadeAnim.setValue(1);
      });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getFilteredNotes = () => {
    let filteredNotes = notes.filter(note => !note.isHidden);

    if (searchQuery) {
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilters.length > 0) {
      // Apply date filters
      if (activeFilters.includes('today')) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filteredNotes = filteredNotes.filter(note => new Date(note.createdAt) >= today);
      }
      if (activeFilters.includes('week')) {
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
        thisWeek.setHours(0, 0, 0, 0);
        filteredNotes = filteredNotes.filter(note => new Date(note.createdAt) >= thisWeek);
      }
      if (activeFilters.includes('month')) {
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        filteredNotes = filteredNotes.filter(note => new Date(note.createdAt) >= thisMonth);
      }

      // Apply type filters
      if (activeFilters.includes('tasks')) {
        filteredNotes = filteredNotes.filter(note => note.type === 'checklist');
      }
      if (activeFilters.includes('notes')) {
        filteredNotes = filteredNotes.filter(note => note.type === 'text');
      }
      if (activeFilters.includes('favorites')) {
        filteredNotes = filteredNotes.filter(note => note.isFavorite);
      }
      if (activeFilters.includes('recent')) {
        filteredNotes = filteredNotes.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }).slice(0, 10);
      }
    }

    return filteredNotes;
  };

  const handleOptionSelect = (type: string) => {
    setIsModalVisible(false);
    switch (type) {
      case 'note':
        navigation.navigate('AddEditNote', { note: { type: 'text' } });
        break;
      case 'task':
        navigation.navigate('Task');
        break;
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

  const handleNavigateToFavorites = () => {
    navigation.navigate('Favorites');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleLongPress = (note: any) => {
    setSelectedNote(note);
    setShowActionMenu(true);
  };

  const handleNoteAction = async (action: 'edit' | 'delete' | 'hide') => {
    if (!selectedNote?.id) return;

    try {
      switch (action) {
        case 'edit':
          navigation.navigate('AddEditNote', { note: selectedNote });
          break;

        case 'delete':
          setFadingNoteId(selectedNote.id);
          
          // Configure layout animation with slower timing
          LayoutAnimation.configureNext({
            duration: 500,
            create: {
              type: LayoutAnimation.Types.easeInEaseOut,
              property: LayoutAnimation.Properties.opacity,
              springDamping: 0.7,
            },
            update: {
              type: LayoutAnimation.Types.spring,
              springDamping: 0.7,
            },
            delete: {
              type: LayoutAnimation.Types.easeInEaseOut,
              property: LayoutAnimation.Properties.opacity,
            }
          });

          // Slower fade out animation
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }).start(async () => {
            await deleteNote(selectedNote.id);
            setFadingNoteId(null);
            fadeAnim.setValue(1);
          });
          break;

        case 'hide':
          // Προσθήκη haptic feedback
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          setFadingNoteId(selectedNote.id);
          
          // Βελτιωμένο animation για την απόκρυψη
          LayoutAnimation.configureNext({
            duration: 300,
            create: {
              type: LayoutAnimation.Types.easeInEaseOut,
              property: LayoutAnimation.Properties.opacity,
            },
            update: {
              type: LayoutAnimation.Types.easeInEaseOut,
              springDamping: 0.7,
            },
            delete: {
              type: LayoutAnimation.Types.easeInEaseOut,
              property: LayoutAnimation.Properties.opacity,
            }
          });

          // Ομαλότερο animation εξαφάνισης
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0.5,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.out(Easing.ease),
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.in(Easing.ease),
            })
          ]).start(async () => {
            const updatedNote = {
              ...selectedNote,
              isHidden: true,
              updatedAt: new Date().toISOString(),
              hideDate: new Date().toISOString() // Προσθήκη ημερομηνίας απόκρυψης
            };
            await updateNote(updatedNote);
            
            // Εμφάνιση toast μηνύματος
            ToastAndroid.show(
              t('noteHidden'),
              ToastAndroid.SHORT
            );
            
            setFadingNoteId(null);
            fadeAnim.setValue(1);
          });
          break;
      }
      setShowActionMenu(false);
      setSelectedNote(null);
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      position: 'relative',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackground,
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 50,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isSearchFocused ? 0.2 : 0.1,
      shadowRadius: isSearchFocused ? 6 : 3,
      elevation: isSearchFocused ? 5 : 3,
      borderWidth: 2,
      borderColor: isSearchFocused ? theme.accentColor : 'transparent',
    },
    searchInput: {
      flex: 1,
      color: theme.textColor,
      fontSize: 16,
      marginLeft: 12,
      fontWeight: '400',
    },
    notesContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    noteCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      height: 175,
      flexDirection: 'column',
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
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
    },
    noteTitle: {
      color: theme.textColor,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 6,
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
      height: 175,
      marginBottom: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: 8,
    },
    deleteButton: {
      flex: 1,
      width: '100%',
      backgroundColor: '#FF4E4E',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
      height: 175,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
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
      marginTop: 60,
    },
    bottomNavigation: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 65,
      backgroundColor: theme.secondaryBackground,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 5,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 50,
      height: 50,
    },
    addButton: {
      width: 45,
      height: 45,
      borderRadius: 15,
      backgroundColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 5,
    },
    filterDot: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF4E4E',
      borderWidth: 1,
      borderColor: theme.backgroundColor,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    hidingNote: {
      transform: [
        {
          scale: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          })
        },
        {
          translateX: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          })
        }
      ],
      opacity: fadeAnim
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
      paddingTop: 150,
    },
    emptyStateText: {
      color: theme.placeholderColor,
      fontSize: 16,
      textAlign: 'center',
      maxWidth: '80%',
    },
    emptyStateIcon: {
      backgroundColor: `${theme.accentColor}15`,
      padding: 20,
      borderRadius: 30,
      marginBottom: 16,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setIsSearchFocused(false);
    }}>
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
            onPress={() => setIsFilterModalVisible(true)}
          >
            <View>
              <Ionicons 
                name="funnel-outline" 
                size={24} 
                color={activeFilters.length > 0 ? theme.accentColor : theme.textColor} 
              />
              {activeFilters.length > 0 && (
                <View style={styles.filterDot} />
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search-outline" 
            size={22} 
            color={isSearchFocused ? theme.accentColor : theme.placeholderColor} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchHere')}
            placeholderTextColor={theme.placeholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={isSearchFocused ? theme.accentColor : theme.placeholderColor} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Notes List */}
        <ScrollView 
          style={styles.notesContainer}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={true}
          overScrollMode="always"
          bounces={true}
        >
          {getFilteredNotes().length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons 
                  name="document-text-outline" 
                  size={48} 
                  color={theme.accentColor} 
                />
              </View>
              <Text style={[styles.emptyStateText, { color: theme.placeholderColor }]}>
                {t('noNotes')}
              </Text>
            </View>
          ) : (
            getFilteredNotes().map((note) => (
              <Animated.View
                key={note.id}
                style={[
                  fadingNoteId === note.id && [
                    styles.hidingNote,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        })
                      }]
                    }
                  ]
                ]}
              >
                <Swipeable
                  renderRightActions={(progress, dragX) => (
                    <View style={styles.actionContainer}>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDelete(note.id)}
                      >
                        <Ionicons name="trash-outline" size={22} color="#fff" />
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
                    onLongPress={() => handleLongPress(note)}
                    delayLongPress={300}
                  >
                    <View style={styles.noteHeader}>
                      <Text style={styles.noteDate}>
                        {new Date(note.createdAt || new Date().toISOString()).toLocaleDateString('en-US', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </Text>
                      <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => handleFavorite(note)}>
                          <Ionicons 
                            name={note.isFavorite ? "heart" : "heart-outline"}
                            size={24} 
                            color={note.isFavorite ? "#FF4E4E" : theme.placeholderColor} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => {
                            setSelectedNote(note);
                            setShowActionMenu(true);
                          }}
                          style={{ marginLeft: 12 }}
                        >
                          <Ionicons 
                            name="ellipsis-vertical" 
                            size={24} 
                            color={theme.placeholderColor} 
                          />
                        </TouchableOpacity>
                      </View>
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
              </Animated.View>
            ))
          )}
        </ScrollView>

        <NavigationMenu 
          onAddPress={() => setIsModalVisible(true)}
        />

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

        <FilterModal
          visible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          onSelectFilter={setActiveFilters}
          activeFilters={activeFilters}
          filteredCount={getFilteredNotes().length}
        />

        <NoteActionMenu
          visible={showActionMenu}
          onClose={() => {
            setShowActionMenu(false);
            setSelectedNote(null);
          }}
          onEdit={() => handleNoteAction('edit')}
          onDelete={() => handleNoteAction('delete')}
          onHide={() => handleNoteAction('hide')}
          isHidden={false}
        />
      </View>
    </TouchableWithoutFeedback>
  );
} 