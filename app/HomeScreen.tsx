import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
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
  Easing,
  ToastAndroid,
  Dimensions,
  Image,
  Alert,
  Switch,
  FlatList,
} from 'react-native';
import Reanimated, { Layout } from 'react-native-reanimated';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotes } from './NotesContext';
import HighlightText from './components/HighlightText';
import { Swipeable } from 'react-native-gesture-handler';
import FloatingActionMenu from './components/FloatingActionMenu';
import type { TaskItem, Note } from './NotesContext';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import NavigationMenu from './components/NavigationMenu';
import FilterModal, { FilterState } from './components/FilterModal';
import NoteActionMenu from './components/NoteActionMenu';
import * as Haptics from 'expo-haptics';
import { TAG_COLORS, TagColor, getTagColorValue } from './constants/tags';
import * as ImagePicker from 'expo-image-picker';
import { auth, GoogleSignin } from './config/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from './contexts/AuthContext';

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
  AddEditNote: { noteId?: string };
  Favorites: undefined;
  Tasks: undefined;
  Settings: undefined;
  QuickTask: undefined;
  Calendar: undefined;
  Trash: undefined;
  BackupRestore: undefined;
  HiddenNotes: undefined;
  PinScreen: { isChangingPin?: boolean };
  SecurityCheck: undefined;
  UserPreferences: undefined;
  Login: undefined;
  Profile: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;


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

// Sync Badge Component with animations
interface SyncBadgeProps {
  isSynced: boolean;
  theme: any;
  styles: any;
}

const SyncBadge = memo(({ isSynced, theme, styles }: SyncBadgeProps) => {
  const getSyncStatus = useCallback(() => {
    if (isSynced) {
      return {
        icon: 'cloud-done',
        color: '#4CAF50',
        text: 'Synced',
        bgColor: theme.isDarkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        borderColor: '#4CAF50',
      };
    }
    return {
      icon: 'cloud-offline',
      color: '#FF9800',
      text: 'Local',
      bgColor: theme.isDarkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
      borderColor: '#FF9800',
    };
  }, [isSynced, theme.isDarkMode]);

  const status = getSyncStatus();

  return (
    <View
      style={[
        styles.syncBadge, 
        { 
          backgroundColor: status.bgColor,
          borderWidth: theme.isDarkMode ? 1 : 0.5,
          borderColor: theme.isDarkMode ? status.borderColor + '40' : status.borderColor + '20',
        }
      ]}
    >
      <Ionicons 
        name={status.icon as any}
        size={14} 
        color={status.color}
      />
    </View>
  );
});


// Gradient definitions για κάθε theme
const themeGradients = {
  purple: {
    dark: ['#8B45FF', '#FF4E4E', '#FF6B9D'] as const,
    light: ['#9F5FFF', '#FF5E7E', '#FF88A8'] as const
  },
  blue: {
    dark: ['#2196F3', '#00BCD4', '#4DD0E1'] as const,
    light: ['#42A5F5', '#26C6DA', '#4DD0E1'] as const
  },
  green: {
    dark: ['#4CAF50', '#8BC34A', '#CDDC39'] as const,
    light: ['#66BB6A', '#9CCC65', '#D4E157'] as const
  },
  orange: {
    dark: ['#FF9800', '#FF5722', '#FF6F00'] as const,
    light: ['#FFA726', '#FF7043', '#FFA000'] as const
  },
  pink: {
    dark: ['#E91E63', '#9C27B0', '#673AB7'] as const,
    light: ['#EC407A', '#AB47BC', '#7E57C2'] as const
  }
};

// Enhanced Empty State Component
interface EnhancedEmptyStateProps {
  searchQuery: string;
  hasActiveFilters: boolean;
  theme: any;
  styles: any;
  t: (key: any) => string;
  onClearFilters: () => void;
  onAddNote: () => void;
  appTheme: string;
}

const EnhancedEmptyState = memo(({ 
  searchQuery, 
  hasActiveFilters, 
  theme, 
  styles, 
  t, 
  onClearFilters, 
  onAddNote,
  appTheme 
}: EnhancedEmptyStateProps) => {
  if (searchQuery.length > 0 || hasActiveFilters) {
    return (
      <View style={styles.minimalEmptyState}>
        <LinearGradient
          colors={
            theme.isDarkMode
              ? themeGradients[appTheme as keyof typeof themeGradients].dark
              : themeGradients[appTheme as keyof typeof themeGradients].light
          }
          style={styles.minimalIconContainer}
        >
          <Ionicons 
            name="search-outline" 
            size={normalize(36)} 
            color="#FFFFFF" 
          />
        </LinearGradient>
        
        <Text style={styles.minimalTitle}>
          {t('noResults')}
        </Text>
        
        <Text style={styles.minimalSubtitle}>
          {t('tryDifferentSearch')}
        </Text>
        
        <TouchableOpacity
          style={styles.minimalButton}
          onPress={onClearFilters}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={theme.isDarkMode 
              ? ['#4A4A4A', '#2A2A2A'] 
              : ['#6B6B6B', '#4A4A4A']
            }
            style={styles.minimalButtonGradient}
          >
            <Text style={styles.minimalButtonText}>{t('clearFilters')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.minimalEmptyState}>
      <LinearGradient
        colors={
          theme.isDarkMode
            ? themeGradients[appTheme as keyof typeof themeGradients].dark
            : themeGradients[appTheme as keyof typeof themeGradients].light
        }
        style={styles.minimalIconContainer}
      >
        <Ionicons 
          name="document-text-outline" 
          size={normalize(48)} 
          color="#FFFFFF" 
        />
      </LinearGradient>
      
      <Text style={styles.minimalTitle}>
        {t('welcomeToNotes')}
      </Text>
      
      <Text style={styles.minimalSubtitle}>
        {t('startCreatingNotes')}
      </Text>
      
      <TouchableOpacity
        style={styles.minimalButton}
        onPress={onAddNote}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={theme.isDarkMode 
            ? ['#4A4A4A', '#2A2A2A'] 
            : ['#6B6B6B', '#4A4A4A']
          }
          style={styles.minimalButtonGradient}
        >
          <Text style={styles.minimalButtonText}>{t('createFirstNote')}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { notes, deleteNote, updateNote, loadNotes, setNotes, clearStorage, syncNote, isLoading } = useNotes();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { theme, toggleColorScheme, appTheme } = useTheme();
  const { t } = useLanguage();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    tags: [],
    favorites: null,
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [fadingNoteId, setFadingNoteId] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isGridView, setIsGridView] = useState(false);
  const [isViewPreferenceLoaded, setIsViewPreferenceLoaded] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const sideMenuAnim = useRef(new Animated.Value(-300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  
  const currentRoute = navigation.getState().routes[navigation.getState().index].name;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { user } = useAuth();
  const isUserLoggedIn = !!user;
  const [cachedUsername, setCachedUsername] = useState<string | null>(null);
  // Guest mode removed

  // Φόρτωση/συγχρονισμός username (cache + auth user)
  useEffect(() => {
    let isActive = true;
    const loadCached = async () => {
      try {
        const saved = await AsyncStorage.getItem('@username');
        if (isActive && saved) setCachedUsername(saved);
      } catch {}
    };
    loadCached();
    return () => { isActive = false; };
  }, []);

  // Επαναφόρτωση cache username όταν το Home αποκτά focus (άμεση ανανέωση μετά από Profile)
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const refresh = async () => {
        try {
          const saved = await AsyncStorage.getItem('@username');
          if (isActive) setCachedUsername(saved);
        } catch {}
      };
      refresh();
      return () => { isActive = false; };
    }, [])
  );

  useEffect(() => {
    if (user?.displayName) {
      setCachedUsername(user.displayName);
      AsyncStorage.setItem('@username', user.displayName).catch(() => {});
    }
  }, [user?.displayName]);

  // Skeleton shimmer animation removed for cleaner experience

  const handleSignOut = async () => {
    try {
      // Revoke Google access so the account chooser shows next time
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch (_e) {}

      await signOut(auth);
      // Καθαρισμός των σημειώσεων μετά την αποσύνδεση
      await clearStorage();
      await AsyncStorage.removeItem('@username');
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('signOutSuccess'), ToastAndroid.SHORT);
      } else {
        Alert.alert('', t('signOutSuccess'));
      }
      navigation.navigate({ name: 'Login', params: undefined });
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert(t('error'), t('signOutError'));
    }
  };

  const toggleSideMenu = () => {
    const toValue = isSideMenuOpen ? -300 : 0;
    const overlayToValue = isSideMenuOpen ? 0 : 0.5;

    Animated.parallel([
      Animated.spring(sideMenuAnim, {
        toValue,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
        velocity: 1
      }),
      Animated.timing(overlayAnim, {
        toValue: overlayToValue,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();

    setIsSideMenuOpen(!isSideMenuOpen);
  };

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

  // Load profile image when component mounts
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedImage = await AsyncStorage.getItem('@profile_image');
        if (savedImage) {
          setProfileImage(savedImage);
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
      }
    };
    loadProfileImage();
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

  const handleNotePress = useCallback((note: any) => {
    navigation.navigate({ name: 'AddEditNote', params: { noteId: note.id } });
  }, [navigation]);
  
  const handleAddNote = useCallback(() => {
    navigation.navigate({ name: 'AddEditNote', params: {} });
  }, [navigation]);

  const toggleChecklistItem = useCallback(async (noteId: string, itemIndex: number) => {
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
  }, [notes, updateNote]);

  const handleFavorite = useCallback(async (note: any) => {
    try {
      const updatedNote = { 
        ...note, 
        isFavorite: !note.isFavorite 
      };
      await updateNote(updatedNote);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [updateNote]);

  const handleDelete = useCallback(async (noteId: string | undefined) => {
    if (!noteId) return;
    try {
      // Trigger haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      setFadingNoteId(noteId);
      
      // Configure enhanced layout animation
      LayoutAnimation.configureNext({
        duration: 400,
        create: {
          type: LayoutAnimation.Types.spring,
          property: LayoutAnimation.Properties.opacity,
          springDamping: 0.8,
        },
        update: {
          type: LayoutAnimation.Types.spring,
          springDamping: 0.8,
        },
        delete: {
          type: LayoutAnimation.Types.spring,
          property: LayoutAnimation.Properties.opacity,
          springDamping: 0.8,
        }
      });

      // Add a small delay for better UX
      setTimeout(() => {
        deleteNote(noteId).catch(() => {});
        setFadingNoteId(null);
      }, 100);

      // Εμφάνιση μηνύματος ότι η σημείωση μετακινήθηκε στον κάδο
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('noteMovedToTrash'), ToastAndroid.SHORT);
      } else {
        Alert.alert('', t('noteMovedToTrash'));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setFadingNoteId(null);
    }
  }, [deleteNote, t]);

  // Debug function to check filter state
  const hasActiveFilters = () => {
    const hasFilters = currentFilters.tags.length > 0 || currentFilters.favorites !== null || currentFilters.dateRange !== 'all';
    return hasFilters;
  };

  // Function to count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (currentFilters.tags.length > 0) count += currentFilters.tags.length;
    if (currentFilters.favorites !== null) count += 1;
    if (currentFilters.dateRange !== 'all') count += 1;
    return count;
  };

  const getFilteredNotes = () => {
    if (!notes || notes.length === 0) {
      return [];
    }
    
    try {
      // Exclude hidden notes, deleted notes, and checklist tasks from HomeScreen
      let filteredNotes = notes.filter(note => !note.isHidden && !note.isDeleted && note.type !== 'checklist');

      // Apply search filter
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        filteredNotes = filteredNotes.filter(note => 
          note.title.toLowerCase().includes(searchLower) ||
          note.description?.toLowerCase().includes(searchLower) ||
          note.content?.toLowerCase().includes(searchLower) ||
          (note.tasks && note.tasks.some(task => 
            task.text.toLowerCase().includes(searchLower))
          )
        );
      }

      // Apply tag filters
      if (currentFilters.tags.length > 0) {
        filteredNotes = filteredNotes.filter(note => 
          currentFilters.tags.includes((note.color as TagColor) || 'none')
        );
      }

      // Apply favorites filter
      if (currentFilters.favorites !== null) {
        if (currentFilters.favorites === true) {
          filteredNotes = filteredNotes.filter(note => note.isFavorite);
        } else if (currentFilters.favorites === false) {
          filteredNotes = filteredNotes.filter(note => !note.isFavorite);
        }
      }

      // Apply date range filter
      if (currentFilters.dateRange !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

        filteredNotes = filteredNotes.filter(note => {
          const noteDate = new Date(note.createdAt);
          switch (currentFilters.dateRange) {
            case 'today':
              return noteDate >= today;
            case 'week':
              return noteDate >= weekAgo;
            case 'month':
              return noteDate >= monthAgo;
            case 'year':
              return noteDate >= yearAgo;
            default:
              return true;
          }
        });
      }

      // Apply sorting
      filteredNotes.sort((a, b) => {
        let comparison = 0;
        
        switch (currentFilters.sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'favorites':
            comparison = (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
            break;
          case 'date':
          default:
            comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
        }

        return currentFilters.sortOrder === 'asc' ? -comparison : comparison;
      });

      return filteredNotes;
    } catch (error) {
      console.error('❌ Error filtering notes:', error);
      return [];
    }
  };

  const handleOptionSelect = useCallback((type: string) => {
    setIsModalVisible(false);
    
    switch (type) {
      case 'note':
        navigation.navigate({ name: 'AddEditNote', params: {} });
        break;
      case 'task':
        navigation.navigate({ name: 'QuickTask', params: undefined });
        break;
    }
  }, [navigation]);

  const getTimeAgo = useCallback((dateString: string) => {
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
  }, [t]);

  const handleNavigateToFavorites = useCallback(() => {
    navigation.navigate({ name: 'Favorites', params: undefined });
  }, [navigation]);

  const truncateText = useCallback((text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, []);

  const handleLongPress = useCallback((note: any) => {
    setSelectedNote(note);
    setShowActionMenu(true);
  }, []);

  const handleNoteAction = useCallback(async (action: 'edit' | 'delete' | 'hide') => {
    if (!selectedNote?.id) return;

    try {
      switch (action) {
        case 'edit':
          navigation.navigate({ name: 'AddEditNote', params: { noteId: selectedNote.id } });
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

          // Fire-and-forget to avoid blocking the exit animation
          deleteNote(selectedNote.id).catch(() => {});
          setFadingNoteId(null);
          // Εμφάνιση μηνύματος ότι η σημείωση μετακινήθηκε στον κάδο
          if (Platform.OS === 'android') {
            ToastAndroid.show(t('noteMovedToTrash'), ToastAndroid.SHORT);
          } else {
            Alert.alert('', t('noteMovedToTrash'));
          }
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
  }, [selectedNote, navigation, deleteNote, t, updateNote, scrollY]);

  const handleColorChange = useCallback(async (color: TagColor | null) => {
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
  }, [selectedNote, updateNote]);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await AsyncStorage.setItem('@profile_image', imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }, []);

  const getTimeBasedGreeting = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 5 && hours < 12) return 'Good morning';
    if (hours >= 12 && hours < 17) return 'Good afternoon';
    if (hours >= 17 && hours < 22) return 'Good evening';
    return 'Good night';
  }, []);

  const handleSyncNote = useCallback(async (noteId: string) => {
    try {
      // Πρώτα κάνουμε sync τη σημείωση
      await syncNote(noteId);
      
      // Ενημερώνουμε το UI
      const updatedNotes = notes.map(note => 
        note.id === noteId ? { ...note, isSynced: true } : note
      );
      setNotes(updatedNotes);
      
      // Εμφανίζουμε μήνυμα επιτυχίας
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('save'), ToastAndroid.SHORT);
      } else {
        Alert.alert('', t('save'));
      }
      
      // Επιστρέφουμε στην προηγούμενη οθόνη
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error syncing note:', error);
      Alert.alert(
        t('error'),
        t('errorSavingNote')
      );
    }
  }, [syncNote, notes, setNotes, t, navigation]);

  // Memoized handlers for note card actions
  const handleNoteCardPress = useCallback((note: Note) => {
    handleNotePress(note);
  }, [handleNotePress]);

  const handleNoteCardLongPress = useCallback((note: Note) => {
    handleLongPress(note);
  }, [handleLongPress]);

  const handleNoteCardFavorite = useCallback((note: Note) => {
    handleFavorite(note);
  }, [handleFavorite]);

  const handleNoteCardActionMenu = useCallback((note: Note) => {
    setSelectedNote(note);
    setShowActionMenu(true);
  }, []);

  const handleNoteCardAddTag = useCallback((note: Note) => {
    setSelectedNote(note);
    setShowActionMenu(true);
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      position: 'relative',
    },
    headerContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 98,
    },
    headerGradient: {
      paddingHorizontal: 24,
      paddingTop: 50,
      paddingBottom: 32,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flex: 1,
      minWidth: 0,
      paddingRight: 8,
    },
    headerGreeting: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFF',
      opacity: 0.9,
    },
    headerName: {
      fontSize: 28,
      fontWeight: '800',
      color: '#FFF',
      marginTop: 2,
      flexShrink: 1,
      letterSpacing: 0.5,
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
      marginTop: 24,
      marginBottom: 20,
      borderRadius: 20,
      paddingHorizontal: 18,
      height: 58,
      shadowColor: theme.isDarkMode ? '#000' : 'transparent',
      shadowOffset: {
        width: 0,
        height: theme.isDarkMode ? 3 : 0,
      },
      shadowOpacity: theme.isDarkMode ? (isSearchFocused ? 0.2 : 0.08) : 0,
      shadowRadius: theme.isDarkMode ? (isSearchFocused ? 10 : 5) : 0,
      elevation: theme.isDarkMode ? (isSearchFocused ? 8 : 3) : 0,
      borderWidth: 2,
      borderColor: isSearchFocused ? theme.accentColor : 'transparent',
    },
    searchInput: {
      flex: 1,
      color: theme.textColor,
      fontSize: 17,
      marginLeft: 12,
      fontWeight: '500',
    },
    notesContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
      marginTop: -hp(2),
    },
    noteCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      height: 200,
      flexDirection: 'column',
      shadowColor: theme.isDarkMode ? '#000' : 'transparent',
      shadowOffset: {
        width: 0,
        height: theme.isDarkMode ? 2 : 0,
      },
      shadowOpacity: theme.isDarkMode ? 0.06 : 0,
      shadowRadius: theme.isDarkMode ? 8 : 0,
      elevation: theme.isDarkMode ? 3 : 0,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
    },
    tagLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    noteDate: {
      color: theme.placeholderColor,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 4,
      opacity: 0.7,
    },
    noteContent: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    noteTitle: {
      color: theme.textColor,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 8,
      letterSpacing: 0.1,
    },
    noteDescription: {
      color: theme.placeholderColor,
      fontSize: 14,
      lineHeight: 20,
      overflow: 'hidden',
      opacity: 0.8,
    },
    noteFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
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
      marginBottom: 14,
      height: 200,
      borderRadius: 20,
      overflow: 'hidden',
    },
    deleteButton: {
      width: '100%',
      height: '100%',
      backgroundColor: '#FF4E4E',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
      shadowColor: '#FF4E4E',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    filterIconContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterDot: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#FF4444',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      shadowColor: '#FF4444',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
      elevation: 8,
    },
    clearFiltersTextContainer: {
      alignItems: 'flex-end',
      paddingVertical: 8,
      paddingHorizontal: 20,
    },
    clearFiltersButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    clearFiltersSimpleText: {
      color: theme.accentColor,
      fontSize: 14,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
    clearFiltersIcon: {
      marginLeft: 6,
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
    // Skeleton styles
    skeletonCardList: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: wp(4),
      padding: wp(4),
      marginBottom: hp(2),
      minHeight: hp(20),
    },
    skeletonCardGrid: {
      width: (SCREEN_WIDTH - (wp(5) * 2) - wp(4)) / 2,
      minHeight: hp(18),
      backgroundColor: theme.secondaryBackground,
      borderRadius: wp(4),
      padding: wp(3),
      marginBottom: hp(2),
    },
    skeletonHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    skeletonTag: {
      width: 80,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    skeletonFavDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    skeletonTitle: {
      width: '70%',
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      marginBottom: 8,
    },
    skeletonLine: {
      width: '100%',
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      marginTop: 6,
    },
    skeletonLineShort: {
      width: '60%',
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      marginTop: 6,
    },
    emptyCtaPrimary: {
      marginTop: 12,
      backgroundColor: theme.accentColor,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    emptyCtaPrimaryText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    emptyCtaSecondary: {
      marginTop: 12,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    emptyCtaSecondaryText: {
      color: theme.textColor,
      fontWeight: '600',
    },
    settingsButton: {
      padding: 4,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    notesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: wp(4),
      rowGap: hp(2),
    },
    gridCard: {
      width: (SCREEN_WIDTH - (wp(5) * 2) - wp(4)) / 2,
      height: 180,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 20,
      padding: 14,
      marginBottom: 14,
      justifyContent: 'space-between',
      shadowColor: theme.isDarkMode ? '#000' : 'transparent',
      shadowOffset: {
        width: 0,
        height: theme.isDarkMode ? 2 : 0,
      },
      shadowOpacity: theme.isDarkMode ? 0.06 : 0,
      shadowRadius: theme.isDarkMode ? 8 : 0,
      elevation: theme.isDarkMode ? 3 : 0,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
    },
    syncBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 14,
      zIndex: 10,
      shadowColor: theme.isDarkMode ? '#000' : 'transparent',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    gridCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    gridCardDate: {
      fontSize: 11,
      color: theme.placeholderColor,
      marginTop: 4,
      opacity: 0.7,
    },
    gridCardContent: {
      flex: 1,
      marginTop: 6,
    },
    gridCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 6,
      letterSpacing: 0.1,
    },
    gridCardDescription: {
      fontSize: 13,
      color: theme.placeholderColor,
      lineHeight: 18,
      opacity: 0.75,
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
      marginBottom: 4,
    },
    categoryBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    addCategoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 10,
      gap: 4,
      backgroundColor: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.06)' : 
        'rgba(0, 0, 0, 0.04)',
      borderRadius: 12,
      marginLeft: -10,
    },
    burgerButton: {
      marginLeft: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderRadius: 14,
      opacity: 1,
      shadowColor: '#FFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 8,
      width: 45,
      height: 45,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sideMenu: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: 280,
      backgroundColor: theme.isDarkMode ? '#121212' : '#FFFFFF',
      zIndex: 1000,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 4,
        height: 0,
      },
      shadowOpacity: theme.isDarkMode ? 0.5 : 0.1,
      shadowRadius: 16,
      paddingTop: Platform.OS === 'ios' ? 50 : 40,
      paddingBottom: 20,
      paddingHorizontal: 0,
      display: 'flex',
      flexDirection: 'column',
      borderTopRightRadius: 30,
      borderBottomRightRadius: 30,
    },
    menuOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
    },
    profileSection: {
      alignItems: 'center',
      flexDirection: 'row',
      paddingVertical: 18,
      paddingHorizontal: 20,
      marginHorizontal: 12,
      marginBottom: 20,
      borderRadius: 16,
      backgroundColor: theme.isDarkMode 
        ? 'rgba(139, 69, 255, 0.08)' 
        : 'rgba(139, 69, 255, 0.04)',
    },
    profileImageContainer: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
      overflow: 'hidden',
    },
    profileImage: {
      width: 54,
      height: 54,
      borderRadius: 27,
    },
    profileInfo: {
      flex: 1,
    },
    greetingText: {
      fontSize: 11,
      color: theme.placeholderColor,
      marginBottom: 3,
      opacity: 0.6,
      fontWeight: '500',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    profileName: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textColor,
      letterSpacing: 0.3,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginHorizontal: 12,
      marginBottom: 4,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    menuItemIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
      backgroundColor: 'transparent',
    },
    menuItemText: {
      fontSize: 15,
      color: theme.textColor,
      fontWeight: '500',
      letterSpacing: 0.2,
      opacity: 0.9,
    },
    menuDivider: {
      height: 0.5,
      backgroundColor: theme.isDarkMode 
        ? 'rgba(139, 69, 255, 0.15)' 
        : 'rgba(139, 69, 255, 0.1)',
      marginVertical: 12,
      marginHorizontal: 20,
      borderRadius: 1,
    },
    darkModeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginHorizontal: 12,
      marginBottom: 4,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    darkModeText: {
      fontSize: 15,
      color: theme.textColor,
      fontWeight: '500',
      flex: 1,
      marginLeft: 14,
      letterSpacing: 0.2,
      opacity: 0.9,
    },
    toggleSwitch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    spacer: {
      flex: 1,
    },
    guestModeIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      marginLeft: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      borderRadius: 8,
    },
    guestModeText: {
      fontSize: 12,
      color: theme.placeholderColor,
      marginLeft: 5,
      fontWeight: '500',
    },
    menuItemPressed: {
      backgroundColor: theme.isDarkMode 
        ? 'rgba(139, 69, 255, 0.12)' 
        : 'rgba(139, 69, 255, 0.08)',
    },
    
    // Minimal Empty State Styles
    minimalEmptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: wp(8),
      paddingVertical: hp(8),
      minHeight: hp(50),
    },
    minimalIconContainer: {
      width: wp(20),
      height: wp(20),
      borderRadius: wp(10),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: hp(3),
    },
    minimalTitle: {
      fontSize: normalize(22),
      fontWeight: '700',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: hp(1),
      letterSpacing: 0.3,
    },
    minimalSubtitle: {
      fontSize: normalize(15),
      color: theme.placeholderColor,
      textAlign: 'center',
      marginBottom: hp(4),
      lineHeight: normalize(20),
      opacity: 0.7,
      maxWidth: '80%',
    },
    minimalButton: {
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    minimalButtonGradient: {
      paddingVertical: hp(1.2),
      paddingHorizontal: wp(8),
      alignItems: 'center',
      justifyContent: 'center',
    },
    minimalButtonText: {
      color: '#FFFFFF',
      fontSize: normalize(15),
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    
  }), [theme, isSearchFocused, isGridView, isSideMenuOpen, appTheme, isUserLoggedIn]);

  // Memoized NoteCard component for list view
  interface NoteCardProps {
    note: Note;
    theme: any;
    styles: any;
    searchQuery: string;
    onPress: (note: Note) => void;
    onLongPress: (note: Note) => void;
    onFavorite: (note: Note) => void;
    onActionMenu: (note: Note) => void;
    onAddTag: (note: Note) => void;
    onDelete: (noteId: string) => void;
    getTimeAgo: (dateString: string) => string;
    t: (key: any) => string;
  }

  const NoteCard = memo(({ 
    note, 
    theme, 
    styles, 
    searchQuery, 
    onPress, 
    onLongPress, 
    onFavorite, 
    onActionMenu, 
    onAddTag, 
    onDelete,
    getTimeAgo, 
    t 
  }: NoteCardProps) => {
    const handlePress = useCallback(() => {
      onPress(note);
    }, [note, onPress]);

    const handleLongPress = useCallback(() => {
      onLongPress(note);
    }, [note, onLongPress]);

    const handleFavorite = useCallback(() => {
      onFavorite(note);
    }, [note, onFavorite]);

    const handleActionMenu = useCallback(() => {
      onActionMenu(note);
    }, [note, onActionMenu]);

    const handleAddTag = useCallback(() => {
      onAddTag(note);
    }, [note, onAddTag]);

    return (
      <Reanimated.View layout={Layout.springify().damping(15).stiffness(200).mass(0.8)}>
        <View>
          <Swipeable
            renderRightActions={(progress, dragX) => {
              const scale = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
                extrapolate: 'clamp',
              });
              
              const opacity = progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.7, 1],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View style={[styles.actionContainer, { opacity }]}>
                  <Animated.View style={{ transform: [{ scale }] }}>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => onDelete(note.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={normalize(22)} color="#fff" />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              );
            }}
            enabled={true}
            rightThreshold={40}
            friction={2}
            overshootRight={false}
          >
            <Pressable 
              style={styles.noteCard}
              onPress={handlePress}
              onLongPress={handleLongPress}
              delayLongPress={300}
            >
              <SyncBadge isSynced={note.isSynced || false} theme={theme} styles={styles} />
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
                        onPress={handleAddTag}
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
                  <TouchableOpacity onPress={handleFavorite}>
                    <Ionicons 
                      name={note.isFavorite ? "heart" : "heart-outline"}
                      size={normalize(24)}
                      color={note.isFavorite ? "#FF4E4E" : theme.placeholderColor} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleActionMenu}>
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
                  numberOfLines={2}
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
                      text={note.description}
                      highlight={searchQuery}
                      style={[styles.noteDescription]}
                    />
                  </Text>
                )}
              </View>

              <View style={styles.noteFooter}>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={[styles.statusText]}>
                    {getTimeAgo(note.createdAt || new Date().toISOString())}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Swipeable>
        </View>
      </Reanimated.View>
    );
  });

  // Memoized GridCard component for grid view
  interface GridCardProps {
    note: Note;
    theme: any;
    styles: any;
    onPress: (note: Note) => void;
    onLongPress: (note: Note) => void;
    onFavorite: (note: Note) => void;
    onAddTag: (note: Note) => void;
    t: (key: any) => string;
  }

  const GridCard = memo(({ 
    note, 
    theme, 
    styles, 
    onPress, 
    onLongPress, 
    onFavorite, 
    onAddTag, 
    t 
  }: GridCardProps) => {
    const handlePress = useCallback(() => {
      onPress(note);
    }, [note, onPress]);

    const handleLongPress = useCallback(() => {
      onLongPress(note);
    }, [note, onLongPress]);

    const handleFavorite = useCallback(() => {
      onFavorite(note);
    }, [note, onFavorite]);

    const handleAddTag = useCallback(() => {
      onAddTag(note);
    }, [note, onAddTag]);

    return (
      <Reanimated.View layout={Layout.springify().damping(12).stiffness(260).mass(0.6)}>
        <View>
          <Pressable 
            style={styles.gridCard}
            onPress={handlePress}
            onLongPress={handleLongPress}
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
                      onPress={handleAddTag}
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
              <TouchableOpacity onPress={handleFavorite}>
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
                <Text style={styles.gridCardDescription} numberOfLines={4}>
                  {note.description}
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      </Reanimated.View>
    );
  });

  // Memoized renderItem function
  const renderItem = useCallback(({ item: note }: { item: Note }) => {
    if (isGridView) {
      return (
        <GridCard
          note={note}
          theme={theme}
          styles={styles}
          onPress={handleNoteCardPress}
          onLongPress={handleNoteCardLongPress}
          onFavorite={handleNoteCardFavorite}
          onAddTag={handleNoteCardAddTag}
          t={t}
        />
      );
    } else {
      return (
        <NoteCard
          note={note}
          theme={theme}
          styles={styles}
          searchQuery={searchQuery}
          onPress={handleNoteCardPress}
          onLongPress={handleNoteCardLongPress}
          onFavorite={handleNoteCardFavorite}
          onActionMenu={handleNoteCardActionMenu}
          onAddTag={handleNoteCardAddTag}
          onDelete={handleDelete}
          getTimeAgo={getTimeAgo}
          t={t}
        />
      );
    }
  }, [
    isGridView,
    theme,
    styles,
    searchQuery,
    handleNoteCardPress,
    handleNoteCardLongPress,
    handleNoteCardFavorite,
    handleNoteCardActionMenu,
    handleNoteCardAddTag,
    handleDelete,
    getTimeAgo,
    t
  ]);

  // Memoized active filters check
  const hasActiveFiltersMemo = useMemo(() => {
    return currentFilters.tags.length > 0 || currentFilters.favorites !== null || currentFilters.dateRange !== 'all';
  }, [currentFilters.tags.length, currentFilters.favorites, currentFilters.dateRange]);

  // Memoized header component to prevent animation restarts
  const ListHeaderComponent = useMemo(() => {
    return () => (
      <>
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
                  size={22} 
                  color={isSearchFocused ? theme.accentColor : theme.placeholderColor} 
                />
              </TouchableOpacity>
            )}
          </View>

        {/* Simple Clear Filters Text */}
        {hasActiveFiltersMemo && (
          <View style={styles.clearFiltersTextContainer}>
            <TouchableOpacity 
              onPress={() => {
                setCurrentFilters({
                  tags: [],
                  favorites: null,
                  dateRange: 'all',
                  sortBy: 'date',
                  sortOrder: 'desc',
                });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.clearFiltersButton}
            >
              <Text style={styles.clearFiltersSimpleText}>{t('clearFilters')}</Text>
              <Ionicons 
                name="close" 
                size={16} 
                color={theme.accentColor} 
                style={styles.clearFiltersIcon}
              />
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  }, [searchQuery, isSearchFocused, hasActiveFiltersMemo, theme.accentColor, theme.placeholderColor, t, styles]);

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setIsSearchFocused(false);
      if (isSideMenuOpen) {
        toggleSideMenu();
      }
    }}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <StatusBar 
          backgroundColor="transparent"
          barStyle="light-content"
          translucent
        />
        
        <Animated.View 
          style={[
            styles.headerContainer,
            { transform: [{ translateY: headerTranslateY }] }
          ]}
        >
          <LinearGradient
            colors={
              theme.isDarkMode
                ? themeGradients[appTheme].dark
                : themeGradients[appTheme].light
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View>
                  <Text style={styles.headerGreeting}>{t('hello')},</Text>
                  <Text style={styles.headerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {(cachedUsername || user?.displayName || user?.email?.split('@')[0] || t('guest'))} 👋
                  </Text>
                </View>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={toggleViewMode}
                >
                  <Ionicons 
                    name={isGridView ? "grid-outline" : "list-outline"} 
                    size={20} 
                    color="#FFF" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => setIsFilterModalVisible(true)}
                >
                  <View style={styles.filterIconContainer}>
                    <Ionicons 
                      name="funnel-outline" 
                      size={20} 
                      color={hasActiveFiltersMemo ? '#FFD700' : '#FFF'} 
                    />
                    {hasActiveFiltersMemo && (
                      <View style={styles.filterDot} />
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.iconButton, styles.burgerButton]}
                  onPress={toggleSideMenu}
                >
                  <Ionicons 
                    name="menu" 
                    size={22} 
                    color="#FFF" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.FlatList 
          style={styles.notesContainer}
          contentContainerStyle={{ 
            paddingTop: hp(20),
            paddingBottom: hp(12) 
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          windowSize={5}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          data={isLoading ? [] : getFilteredNotes()}
          keyExtractor={(item) => item.id}
          numColumns={isGridView ? 2 : 1}
          key={isGridView ? 'grid' : 'list'}
          ListHeaderComponent={ListHeaderComponent}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            isLoading ? (
              <View style={isGridView ? styles.notesGrid : null}>
                {Array.from({ length: isGridView ? 6 : 5 }).map((_, idx) => (
                  isGridView ? (
                    <Animated.View
                      key={`skeleton-grid-${idx}`}
                      style={styles.skeletonCardGrid}
                    >
                      <View style={styles.skeletonHeaderRow}>
                        <View style={styles.skeletonTag} />
                        <View style={styles.skeletonFavDot} />
                      </View>
                      <View>
                        <View style={styles.skeletonTitle} />
                        <View style={styles.skeletonLine} />
                        <View style={styles.skeletonLineShort} />
                      </View>
                    </Animated.View>
                  ) : (
                    <Animated.View
                      key={`skeleton-list-${idx}`}
                      style={styles.skeletonCardList}
                    >
                      <View style={styles.skeletonHeaderRow}>
                        <View style={styles.skeletonTag} />
                        <View style={styles.skeletonFavDot} />
                      </View>
                      <View>
                        <View style={styles.skeletonTitle} />
                        <View style={styles.skeletonLine} />
                        <View style={styles.skeletonLine} />
                        <View style={styles.skeletonLineShort} />
                      </View>
                    </Animated.View>
                  )
                ))}
              </View>
            ) : (
              <EnhancedEmptyState 
                searchQuery={searchQuery}
                hasActiveFilters={hasActiveFiltersMemo}
                theme={theme}
                styles={styles}
                t={t}
                appTheme={appTheme}
                onClearFilters={() => {
                  setSearchQuery('');
                  setCurrentFilters({
                    tags: [],
                    favorites: null,
                    dateRange: 'all',
                    sortBy: 'date',
                    sortOrder: 'desc',
                  });
                }}
                onAddNote={() => setIsModalVisible(true)}
              />
            )
          )}
        />

        <NavigationMenu 
          onAddPress={() => setIsModalVisible(true)}
        />

        <FloatingActionMenu
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSelectOption={handleOptionSelect}
          buttonPosition={{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 }}
        />

        <FilterModal
          visible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          onApplyFilters={setCurrentFilters}
          currentFilters={currentFilters}
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
          isHidden={selectedNote?.isHidden || false}
        />

        {/* Side Menu */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleSideMenu}
          style={[
            styles.menuOverlay, 
            { 
              opacity: overlayAnim,
              display: isSideMenuOpen ? 'flex' : 'none'
            }
          ]} 
        />
        
        <Animated.View 
          style={[
            styles.sideMenu,
            {
              transform: [{ translateX: sideMenuAnim }]
            }
          ]}
        >
          {/* Profile section */}
          <View style={styles.profileSection}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={() => {
                navigation.navigate({ name: 'Profile', params: undefined });
                  toggleSideMenu();
                }}
              >
                {(profileImage || user?.photoURL) ? (
                  <Image 
                    source={{ uri: profileImage || (user?.photoURL as string) }} 
                    style={styles.profileImage}
                  />
                ) : (
                <Ionicons 
                  name="person" 
                  size={24} 
                  color="#FFFFFF" 
                />
                )}
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.greetingText}>{getTimeBasedGreeting()}</Text>
                <Text style={styles.profileName} numberOfLines={1}>
                  {cachedUsername || user?.displayName || user?.email?.split('@')[0] || t('guest')}
                </Text>
              </View>
            </View>
          
          {/* Menu Items */}
          <Pressable 
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed
            ]}
            onPress={() => {
              navigation.navigate({ name: 'Tasks', params: undefined });
              toggleSideMenu();
            }}
          >
            <View style={styles.menuItemIcon}>
              <Ionicons name="checkbox-outline" size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.menuItemText}>{t('tasks')}</Text>
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed
            ]}
            onPress={() => {
              navigation.navigate({ name: 'Favorites', params: undefined });
              toggleSideMenu();
            }}
          >
            <View style={styles.menuItemIcon}>
              <Ionicons name="heart-outline" size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.menuItemText}>{t('favorites')}</Text>
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed
            ]}
            onPress={() => {
              navigation.navigate({ name: 'Settings', params: undefined });
              toggleSideMenu();
            }}
          >
            <View style={styles.menuItemIcon}>
              <Ionicons name="settings-outline" size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.menuItemText}>{t('settings')}</Text>
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed
            ]}
            onPress={() => {
              navigation.navigate({ name: 'SecurityCheck', params: undefined });
              toggleSideMenu();
            }}
          >
            <View style={styles.menuItemIcon}>
              <Ionicons name="eye-off-outline" size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.menuItemText}>{t('hiddenNotes')}</Text>
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed
            ]}
            onPress={() => {
              navigation.navigate({ name: 'Trash', params: undefined });
              toggleSideMenu();
            }}
          >
            <View style={styles.menuItemIcon}>
              <Ionicons name="trash-outline" size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.menuItemText}>{t('trash')}</Text>
          </Pressable>
          
          {isUserLoggedIn && (
            <Pressable 
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed
              ]}
              onPress={() => {
                navigation.navigate({ name: 'Profile', params: undefined });
                toggleSideMenu();
              }}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name="person-outline" size={20} color={theme.accentColor} />
              </View>
              <Text style={styles.menuItemText}>{t('profile')}</Text>
            </Pressable>
          )}
          
          <View style={styles.menuDivider} />
          
          {isUserLoggedIn ? (
            <Pressable 
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed
              ]}
              onPress={handleSignOut}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name="log-out-outline" size={20} color={theme.accentColor} />
              </View>
              <Text style={styles.menuItemText}>{t('signOut')}</Text>
            </Pressable>
          ) : (
            <Pressable 
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed
              ]}
              onPress={() => {
                navigation.navigate({ name: 'Login', params: undefined });
                toggleSideMenu();
              }}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name="log-in-outline" size={20} color={theme.accentColor} />
              </View>
              <Text style={styles.menuItemText}>{t('signIn')}</Text>
            </Pressable>
          )}

          {/* Guest mode removed */}
          
          <View style={styles.darkModeContainer}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="moon-outline" size={18} color={theme.accentColor} />
            </View>
            <Text style={styles.darkModeText}>{t('darkMode')}</Text>
            <Switch
              trackColor={{ false: '#767577', true: theme.accentColor }}
              thumbColor={theme.isDarkMode ? '#FFFFFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleColorScheme}
              value={theme.isDarkMode}
              style={styles.toggleSwitch}
            />
          </View>
          
          <View style={styles.spacer} />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
} 