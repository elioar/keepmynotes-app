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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
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
import NavigationMenu from './components/NavigationMenu';
import FilterModal from './components/FilterModal';
import NoteActionMenu from './components/NoteActionMenu';
import * as Haptics from 'expo-haptics';
import { TAG_COLORS, TagColor, getTagColorValue } from './constants/tags';

const TAG_LABELS: Record<TagColor, string> = {
  none: 'No Category',
  green: 'Personal',
  purple: 'Work',
  blue: 'Study',
  orange: 'Ideas',
  red: 'Important'
};

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
  Task: { note?: any };
  Settings: undefined;
  QuickTask: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface BaseNote {
  id: string;           // Unique identifier for the note
  title: string;        // Note title
  description?: string; // Optional note description
  createdAt: string;    // When the note was created
  updatedAt: string;    // When the note was last updated
  type: 'text' | 'checklist'; // Type of note - either text or checklist
  isFavorite: boolean;  // Is this a favorite note?
  isHidden: boolean;    // Is this note hidden?
  color: TagColor | null; // Tag color for the note
}

type Note = BaseNote & {
  tasks?: TaskItem[];  // Optional tasks for checklist type notes
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing utilities
const wp = (percentage: number) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

const hp = (percentage: number) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

const normalize = (size: number) => {
  const scale = SCREEN_WIDTH / 375; // 375 is standard iPhone width
  const newSize = size * scale;
  return Math.round(newSize);
};

interface TagTranslations {
  tagColors: {
    [K in TagColor]: string;
  };
}

// Add helper function after imports
function getBorderColor(color: string | TagColor | null | undefined, defaultColor: string): string {
  if (!color) return defaultColor;
  if (Object.keys(TAG_COLORS).includes(color)) {
    return getTagColorValue(color as TagColor);
  }
  return defaultColor;
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const { notes, deleteNote, updateNote, loadNotes } = useNotes();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [fadingNoteId, setFadingNoteId] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isGridView, setIsGridView] = useState(false);
  const [isViewPreferenceLoaded, setIsViewPreferenceLoaded] = useState(false);
  const [localUsername, setLocalUsername] = useState<string | null>(null);

  // Add logging to see notes on mount
  useEffect(() => {
    // Απλά φορτώνουμε τις σημειώσεις χωρίς περιττές καταγραφές
  }, [notes]);

  // Φόρτωση σημειώσεων όταν η οθόνη αποκτά focus
  useFocusEffect(
    React.useCallback(() => {
      // Φορτώνουμε τις σημειώσεις μόνο την πρώτη φορά ή όταν έχουν αλλάξει
      if (notes.length === 0) {
        loadNotes().catch(error => {
          console.error('❌ Error loading notes:', error);
        });
      }
      
      return () => {
        // Καθαρισμός όταν η οθόνη χάνει το focus
      };
    }, [loadNotes, notes.length])
  );

  // Load username from AsyncStorage
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('@username');
        setLocalUsername(savedUsername);
      } catch (error) {
        console.error('Error loading username:', error);
      }
    };
    loadUsername();
  }, []);

  // Load saved view preference
  useEffect(() => {
    const loadViewPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem('@view_preference');
        if (savedPreference !== null) {
          setIsGridView(savedPreference === 'grid');
        }
        setIsViewPreferenceLoaded(true);
      } catch (error) {
        console.error('Error loading view preference:', error);
        setIsViewPreferenceLoaded(true);
      }
    };
    loadViewPreference();
  }, []);

  // Save view preference when it changes
  const toggleViewMode = async () => {
    const newMode = !isGridView;
    try {
      await AsyncStorage.setItem('@view_preference', newMode ? 'grid' : 'list');
      setIsGridView(newMode);
    } catch (error) {
      console.error('Error saving view preference:', error);
      setIsGridView(newMode); // Still update the state even if saving fails
    }
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -200],
    extrapolate: 'clamp'
  });

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
      Animated.timing(scrollY, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(async () => {
        await deleteNote(noteId);
        setFadingNoteId(null);
        scrollY.setValue(0);
      });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getFilteredNotes = () => {
    if (!notes || notes.length === 0) {
      return [];
    }
    
    try {
      // Exclude hidden notes and checklist tasks from HomeScreen
      let filteredNotes = notes.filter(note => !note.isHidden && note.type !== 'checklist');

      // Sort by creation date (newest first)
      filteredNotes = filteredNotes.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredNotes = filteredNotes.filter(note => 
          note.title.toLowerCase().includes(searchLower) ||
          (note.description && note.description.toLowerCase().includes(searchLower))
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

        // Apply tag filters
        const tagFilter = activeFilters.find(filter => ['green', 'purple', 'blue', 'orange', 'red'].includes(filter));
        if (tagFilter) {
          filteredNotes = filteredNotes.filter(note => note.color === tagFilter);
        }

        // Apply type filters
        if (activeFilters.includes('notes')) {
          filteredNotes = filteredNotes.filter(note => note.type === 'text');
        }
        if (activeFilters.includes('favorites')) {
          filteredNotes = filteredNotes.filter(note => note.isFavorite);
        }
        if (activeFilters.includes('recent')) {
          filteredNotes = filteredNotes.slice(0, 10);
        }
      }

      return filteredNotes;
    } catch (error) {
      console.error('❌ Error filtering notes:', error);
      return [];
    }
  };

  const handleOptionSelect = (type: string) => {
    setIsModalVisible(false);
    
    switch (type) {
      case 'note':
        navigation.navigate('AddEditNote', { note: { type: 'text', isNew: true } });
        break;
      case 'task':
        navigation.navigate('QuickTask');
        break;
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t('now');
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
          Animated.timing(scrollY, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start(async () => {
            await deleteNote(selectedNote.id);
            setFadingNoteId(null);
            scrollY.setValue(0);
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
            Animated.timing(scrollY, {
              toValue: 0.5,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(scrollY, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            })
          ]).start(async () => {
            const updatedNote = {
              ...selectedNote,
              isHidden: true,
              updatedAt: new Date().toISOString(),
              hideDate: new Date().toISOString() // Προσθήκη μερομηνίας απόκρυψης
            };
            await updateNote(updatedNote);
            
            // Εμφάνιση toast μηνύματος
            ToastAndroid.show(
              t('noteHidden'),
              ToastAndroid.SHORT
            );
            
            setFadingNoteId(null);
            scrollY.setValue(0);
          });
          break;
      }
      setShowActionMenu(false);
      setSelectedNote(null);
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
    }
  };

  const handleColorChange = async (color: TagColor | null) => {
    if (!selectedNote?.id) return;
    
    try {
      const updatedNote = {
        ...selectedNote,
        color,
        updatedAt: new Date().toISOString(),
      };
      await updateNote(updatedNote);
      setShowActionMenu(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Error changing note color:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      position: 'relative',
    },
    headerContainer: {
      position: 'absolute',
      top: 20,
      left: 0,
      right: 0,
      zIndex: 98,
      backgroundColor: theme.backgroundColor,
      paddingTop: Platform.OS === 'ios' ? hp(4) : hp(2),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: wp(5),
      paddingBottom: hp(1),
    },
    headerGreeting: {
      fontSize: normalize(20),
      fontWeight: '600',
      color: theme.textColor,
    },
    headerName: {
      fontSize: normalize(30),
      fontWeight: '600',
      color: theme.textColor,
      marginTop: hp(0.5),
    },
    menuButton: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(3),
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: hp(1),
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackground,
      marginTop: 16,
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
      paddingHorizontal: wp(5),
      marginTop: -hp(2),
    },
    noteCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: wp(4),
      padding: wp(4),
      marginBottom: hp(2),
      minHeight: hp(20),
      flexDirection: 'column',
      borderLeftWidth: 3,
      borderLeftColor: getBorderColor(selectedNote?.color, theme.borderColor),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    tagLabel: {
      fontSize: normalize(12),
      fontWeight: '500',
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1),
    },
    noteDate: {
      color: theme.placeholderColor,
      fontSize: normalize(12),
      fontWeight: '500',
      marginTop: 4,
    },
    noteContent: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    noteTitle: {
      color: theme.textColor,
      fontSize: normalize(18),
      fontWeight: '600',
      marginBottom: hp(0.7),
    },
    noteDescription: {
      color: theme.placeholderColor,
      fontSize: normalize(14),
      lineHeight: normalize(18),
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
      fontSize: normalize(11),
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
      marginLeft: 8,
      marginBottom: hp(2),
      height: hp(20),
    },
    deleteButton: {
      width: '100%',
      height: '100%',
      backgroundColor: '#FF4E4E',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: wp(4),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
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
          scale: scrollY.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          })
        },
        {
          translateX: scrollY.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          })
        }
      ],
      opacity: scrollY
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: hp(12),
      paddingTop: hp(18),
    },
    emptyStateText: {
      color: theme.placeholderColor,
      fontSize: normalize(16),
      textAlign: 'center',
      maxWidth: '80%',
    },
    emptyStateIcon: {
      backgroundColor: `${theme.accentColor}15`,
      padding: wp(5),
      borderRadius: wp(8),
      marginBottom: hp(2),
    },
    settingsButton: {
      padding: 4,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
      marginTop: hp(2),
    },
    iconButton: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(3),
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    gridCard: {
      width: '48%',
      minHeight: hp(18),
      backgroundColor: theme.secondaryBackground,
      borderRadius: wp(4),
      padding: wp(3),
      marginBottom: hp(2),
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    gridCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1),
    },
    gridCardDate: {
      fontSize: normalize(12),
      color: theme.placeholderColor,
      marginTop: 4,
    },
    gridCardContent: {
      flex: 1,
      marginTop: hp(0.5),
    },
    gridCardTitle: {
      fontSize: normalize(14),
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: hp(0.5),
    },
    gridCardDescription: {
      fontSize: normalize(12),
      color: theme.placeholderColor,
      lineHeight: normalize(16),
    },
    gridCardFooter: {
      marginTop: hp(0.5),
    },
    gridCardTime: {
      fontSize: normalize(11),
      color: theme.placeholderColor,
      opacity: 0.8,
    },
    gridHeaderActions: {
      gap: wp(8),
    },
    gridNoteFooter: {
      marginTop: 'auto',
      paddingTop: 8,
    },
    gridActionIcon: {
      width: normalize(20),
      height: normalize(20),
    },
    addTagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 0,
      paddingBottom: 10,
    },
    categoryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    addCategoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      gap: 4,
      backgroundColor: theme.isDarkMode ? 
        `${theme.backgroundColor}80` : 
        `${theme.secondaryBackground}80`,
      borderRadius: 8,
      marginLeft: -14,
    },
    burgerButton: {
      backgroundColor: `${theme.accentColor}15`,
      transform: [{ scale: 1.1 }],
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
        
        <Animated.View 
          style={[
            styles.headerContainer,
            { transform: [{ translateY: headerTranslateY }] }
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerGreeting}>{t('hello')},</Text>
              <Text style={styles.headerName}>
                {localUsername ? `${localUsername} 👋` : ''}
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={[styles.iconButton, styles.burgerButton]}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <Ionicons 
                  name="menu" 
                  size={normalize(28)} 
                  color={theme.accentColor} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={toggleViewMode}
              >
                <Ionicons 
                  name={isGridView ? "grid-outline" : "list-outline"} 
                  size={normalize(24)} 
                  color={theme.textColor} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setIsFilterModalVisible(true)}
              >
                <View>
                  <Ionicons 
                    name="funnel-outline" 
                    size={normalize(24)} 
                    color={activeFilters.length > 0 ? theme.accentColor : theme.textColor} 
                  />
                  {activeFilters.length > 0 && <View style={styles.filterDot} />}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.ScrollView 
          style={styles.notesContainer}
          contentContainerStyle={{ 
            paddingTop: hp(17),
            paddingBottom: hp(12) 
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
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

          {getFilteredNotes().length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons 
                  name="document-text-outline" 
                  size={normalize(48)} 
                  color={theme.accentColor} 
                />
              </View>
              <Text style={[styles.emptyStateText, { color: theme.placeholderColor }]}>
                {t('noNotes')}
              </Text>
            </View>
          ) : isViewPreferenceLoaded ? (
            <View style={isGridView ? styles.notesGrid : null}>
              {isGridView ? (
                getFilteredNotes().map((note) => (
                  <Pressable 
                    key={note.id}
                    style={[
                      styles.gridCard,
                      { 
                        backgroundColor: theme.secondaryBackground,
                        borderRadius: wp(4),
                        borderLeftWidth: 3,
                        borderLeftColor: getBorderColor(note.color, theme.borderColor),
                      }
                    ]}
                    onPress={() => handleNotePress(note)}
                    onLongPress={() => handleLongPress(note)}
                    delayLongPress={300}
                  >
                    <View style={styles.gridCardHeader}>
                      <View>
                        <View style={styles.categoryContainer}>
                          <Text 
                            style={[
                              styles.tagLabel, 
                              { color: note.color ? TAG_COLORS[note.color as TagColor] : theme.placeholderColor }
                            ]}
                          >
                            {note.color ? TAG_LABELS[note.color as TagColor] : ''}
                          </Text>
                          {!note.color && (
                            <TouchableOpacity 
                              style={styles.addCategoryButton}
                              onPress={() => {
                                setSelectedNote(note);
                                setShowActionMenu(true);
                              }}
                            >
                              <Ionicons 
                                name="add-circle-outline" 
                                size={normalize(16)} 
                                color={theme.placeholderColor} 
                              />
                              <Text style={[styles.tagLabel, { color: theme.placeholderColor }]}>
                                {t('addTag')}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleFavorite(note)}>
                        <Ionicons 
                          name={note.isFavorite ? "heart" : "heart-outline"}
                          size={normalize(20)}
                          color={note.isFavorite ? "#FF4E4E" : theme.placeholderColor} 
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.gridCardContent}>
                      <Text style={styles.gridCardTitle} numberOfLines={2}>
                        {note.title}
                      </Text>
                      {note.description && (
                        <Text style={styles.gridCardDescription} numberOfLines={3}>
                          {note.description}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))
              ) : (
                getFilteredNotes().map((note) => (
                  <Animated.View
                    key={note.id}
                    style={[
                      fadingNoteId === note.id && styles.hidingNote,
                    ]}
                  >
                    <Swipeable
                      renderRightActions={(progress, dragX) => (
                        <View style={styles.actionContainer}>
                          <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => handleDelete(note.id)}
                          >
                            <Ionicons name="trash-outline" size={normalize(22)} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                      enabled={!isGridView}
                    >
                      <Pressable 
                        style={[
                          styles.noteCard,
                          { 
                            backgroundColor: theme.secondaryBackground,
                            borderRadius: wp(4),
                            borderLeftWidth: 3,
                            borderLeftColor: getBorderColor(note.color, theme.borderColor),
                          }
                        ]}
                        onPress={() => handleNotePress(note)}
                        onLongPress={() => handleLongPress(note)}
                        delayLongPress={300}
                      >
                        <View style={[styles.noteHeader]}>
                          <View>
                            <View style={styles.categoryContainer}>
                              <Text 
                                style={[
                                  styles.tagLabel, 
                                  { color: note.color ? TAG_COLORS[note.color as TagColor] : theme.placeholderColor }
                                ]}
                              >
                                {note.color ? TAG_LABELS[note.color as TagColor] : ''}
                              </Text>
                              {!note.color && (
                                <TouchableOpacity 
                                  style={styles.addCategoryButton}
                                  onPress={() => {
                                    setSelectedNote(note);
                                    setShowActionMenu(true);
                                  }}
                                >
                                  <Ionicons 
                                    name="add-circle-outline" 
                                    size={normalize(16)} 
                                    color={theme.placeholderColor} 
                                  />
                                  <Text style={[styles.tagLabel, { color: theme.placeholderColor }]}>
                                    {t('addTag')}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={styles.noteDate}>
                              {new Date(note.createdAt || new Date().toISOString()).toLocaleDateString('en-US', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </Text>
                          </View>
                          <View style={[styles.headerActions]}>
                            <TouchableOpacity onPress={() => handleFavorite(note)}>
                              <Ionicons 
                                name={note.isFavorite ? "heart" : "heart-outline"}
                                size={normalize(24)}
                                color={note.isFavorite ? "#FF4E4E" : theme.placeholderColor} 
                              />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => {
                                setSelectedNote(note);
                                setShowActionMenu(true);
                              }}
                            >
                              <Ionicons 
                                name="ellipsis-vertical" 
                                size={normalize(24)}
                                color={theme.placeholderColor} 
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.noteContent}>
                          <Text 
                            style={[styles.noteTitle]} 
                            numberOfLines={1}
                          >
                            <HighlightText 
                              text={note.title}
                              highlight={searchQuery}
                              style={[styles.noteTitle]}
                            />
                          </Text>

                          {note.description && (
                            <Text 
                              style={[styles.noteDescription]} 
                              numberOfLines={3}
                            >
                              <HighlightText 
                                text={truncateText(note.description, 100)}
                                highlight={searchQuery}
                                style={[styles.noteDescription]}
                              />
                            </Text>
                          )}
                        </View>

                        <View style={[styles.noteFooter]}>
                          <View style={styles.statusContainer}>
                            <View style={styles.statusDot} />
                            <Text style={[styles.statusText]}>
                              {getTimeAgo(note.createdAt || new Date().toISOString())}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    </Swipeable>
                  </Animated.View>
                ))
              )}
            </View>
          ) : null}
        </Animated.ScrollView>

        <NavigationMenu 
          onAddPress={() => setIsModalVisible(true)}
        />

        <AddNoteModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSelectOption={handleOptionSelect}
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
          onColorChange={handleColorChange}
          currentColor={selectedNote?.color || '#4CAF50'}
          isHidden={false}
        />
      </View>
    </TouchableWithoutFeedback>
  );
} 