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
import Reanimated, { Layout, FadeIn, FadeOut, ZoomIn, ZoomOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
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
import Svg, { Path } from 'react-native-svg';

const TAG_LABELS: Record<TagColor, string> = {
  none: 'No Category',
  green: 'Personal',
  purple: 'Work',
  blue: 'Study',
  orange: 'Ideas',
  red: 'Important'
};

// Custom Menu Icon Component
const MenuAlt05Icon = ({ size = 22, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 17H13M5 12H19M11 7H19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Custom X Icon Component
const XIcon = ({ size = 22, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Category Icons
const WorkIcon = ({ size = 16, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7L4 7M16 3L8 3M16 3L20 7M8 3L4 7M8 3V7M16 3V7M4 7V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V7M4 7H20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const StudyIcon = ({ size = 16, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 17L12 22L22 17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 12L12 17L22 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IdeasIcon = ({ size = 16, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21C9 21.5523 9.44772 22 10 22H14C14.5523 22 15 21.5523 15 21V20H9V21Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 2C8.13401 2 5 5.13401 5 9C5 11.5 6.5 13.5 8.5 14.5V16C8.5 16.5523 8.94772 17 9.5 17H14.5C15.0523 17 15.5 16.5523 15.5 16V14.5C17.5 13.5 19 11.5 19 9C19 5.13401 15.866 2 12 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ImportantIcon = ({ size = 16, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

  const PersonalIcon = ({ size = 16, color = "#FFF" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

// Function to get category icon
const getCategoryIcon = (categoryKey: string, size: number = 16, color: string = "#FFF") => {
  switch (categoryKey) {
    case 'green':
      return <WorkIcon size={size} color={color} />;
    case 'blue':
      return <StudyIcon size={size} color={color} />;
    case 'orange':
      return <IdeasIcon size={size} color={color} />;
    case 'red':
      return <ImportantIcon size={size} color={color} />;
    case 'purple':
      return <PersonalIcon size={size} color={color} />;
    default:
      return <WorkIcon size={size} color={color} />;
  }
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchWidthAnim = useRef(new Animated.Value(48)).current;
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TagColor | null>(null);
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
  const [isSwitchingView, setIsSwitchingView] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const sideMenuAnim = useRef(new Animated.Value(-300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Intro animations (run once per screen open)
  const hasRunIntroAnim = useRef(false);
  const [showIntroAnim, setShowIntroAnim] = useState(false);

  
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

  const toggleSearchBar = () => {
    const toValue = isSearchExpanded ? 48 : SCREEN_WIDTH - wp(10);
    
    Animated.spring(searchWidthAnim, {
      toValue,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();

    if (!isSearchExpanded) {
      setIsSearchExpanded(true);
    }
  };

  const collapseSearchBar = () => {
    if (searchQuery.length === 0 && isSearchExpanded) {
      Animated.spring(searchWidthAnim, {
        toValue: 48,
        useNativeDriver: false,
        tension: 80,
        friction: 10,
      }).start();
      setIsSearchExpanded(false);
      setIsSearchFocused(false);
    }
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

  // Run header/search intro animations only once when screen first gets focus
  useFocusEffect(
    React.useCallback(() => {
      if (!hasRunIntroAnim.current) {
        setShowIntroAnim(true);
        const timer = setTimeout(() => {
          setShowIntroAnim(false);
          hasRunIntroAnim.current = true;
        }, 800);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [])
  );

  // Save view preference when it changes
  const toggleViewMode = async () => {
    const newMode = !isGridView;
    setIsSwitchingView(true);
    try {
      await AsyncStorage.setItem('@view_preference', newMode ? 'grid' : 'list');
      setIsGridView(newMode);
    } catch (error) {
      console.error('Error saving view preference:', error);
      setIsGridView(newMode); // Still update the state even if saving fails
    } finally {
      setTimeout(() => setIsSwitchingView(false), 500);
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

  const handleCategorySelect = useCallback((category: TagColor | null) => {
    if (selectedCategory === category) {
      // Deselect if clicking the same category
      setSelectedCategory(null);
      setCurrentFilters(prev => ({ ...prev, tags: [] }));
    } else {
      setSelectedCategory(category);
      setCurrentFilters(prev => ({ 
        ...prev, 
        tags: category ? [category] : [] 
      }));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [selectedCategory]);

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
    searchAndCategoriesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 20,
      gap: 8,
      minHeight: 52,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackground,
      borderRadius: 24,
      paddingHorizontal: 14,
      height: 48,
      shadowColor: isSearchFocused ? theme.accentColor : '#000',
      shadowOffset: {
        width: 0,
        height: isSearchFocused ? 8 : 3,
      },
      shadowOpacity: isSearchFocused ? 0.6 : 0.1,
      shadowRadius: isSearchFocused ? 16 : 6,
      elevation: isSearchFocused ? 12 : 4,
    },
    searchInnerBorder: {
      position: 'absolute',
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,
      borderRadius: 23,
      borderWidth: 2,
      pointerEvents: 'none',
    },
    searchInput: {
      flex: 1,
      color: theme.textColor,
      fontSize: 15,
      marginLeft: 10,
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
      height: 180,
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
      minHeight: 60,
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
      flexShrink: 1,
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
      height: 180,
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
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      height: 180,
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: theme.isDarkMode ? '#000' : 'transparent',
      shadowOffset: {
        width: 0,
        height: theme.isDarkMode ? 2 : 0,
      },
      shadowOpacity: theme.isDarkMode ? 0.06 : 0,
      shadowRadius: theme.isDarkMode ? 8 : 0,
      elevation: theme.isDarkMode ? 3 : 0,
      overflow: 'hidden',
    },
    skeletonCardGrid: {
      width: (SCREEN_WIDTH - wp(4) * 3) / 2,
      height: 160,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 20,
      padding: 14,
      marginBottom: 16,
      marginHorizontal: wp(2),
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: theme.isDarkMode ? '#000' : 'transparent',
      shadowOffset: {
        width: 0,
        height: theme.isDarkMode ? 2 : 0,
      },
      shadowOpacity: theme.isDarkMode ? 0.06 : 0,
      shadowRadius: theme.isDarkMode ? 8 : 0,
      elevation: theme.isDarkMode ? 3 : 0,
      overflow: 'hidden',
    },
    skeletonHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    skeletonTag: {
      width: 70,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    skeletonFavDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    skeletonTitle: {
      width: '60%',
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      marginBottom: 12,
    },
    skeletonLine: {
      width: '100%',
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      marginBottom: 8,
    },
    skeletonLineShort: {
      width: '70%',
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    skeletonSyncBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
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
      justifyContent: 'center',
      paddingHorizontal: wp(4),
    },
    gridRow: {
      justifyContent: 'center',
      paddingHorizontal: wp(4),
    },
    gridCard: {
      width: (SCREEN_WIDTH - wp(4) * 3) / 2,
      height: 160,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 20,
      padding: 14,
      justifyContent: 'space-between',
      paddingHorizontal: wp(4),
      marginBottom: 16,
      marginHorizontal: wp(2),
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
      minHeight: 50,
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
      flexShrink: 1,
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
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      opacity: 1,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
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
    categoriesContainer: {
      flex: 1,
      height: 52,
      justifyContent: 'center',
      position: 'relative',
    },
    categoriesScrollView: {
      paddingLeft: 2,
      paddingRight: wp(5),
      paddingVertical: 2,
    },
    categoryChip: {
      paddingHorizontal: 14,
      height: 44,
      borderRadius: 22,
      marginRight: 10,
      marginVertical: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    categoryInnerBorder: {
      position: 'absolute',
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,
      borderRadius: 21,
      pointerEvents: 'none',
    },
    categoryChipGlow: {
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.7,
      shadowRadius: 16,
      elevation: 12,
    },
    categoryChipNormal: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    categoryIconContainer: {
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    categoriesEndLine: {
      position: 'absolute',
      right: 0,
      top: -5,
      width: 2,
      height: 65,
      backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    },
    
  }), [theme, isSearchFocused, isGridView, isSideMenuOpen, appTheme, isUserLoggedIn]);

  // Animated Menu Button Component - memoized to prevent re-creation
  const AnimatedMenuButton = useCallback(({ 
    isMenuOpen, 
    onPress, 
    size = 24, 
    color = "#FFF" 
  }: {
    isMenuOpen: boolean;
    onPress: () => void;
    size?: number;
    color?: string;
  }) => {
    const rotation = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(rotation, {
          toValue: isMenuOpen ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: isMenuOpen ? 0.9 : 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isMenuOpen, rotation, scale]);

    const rotateInterpolate = rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <TouchableOpacity 
        style={[styles.iconButton, styles.burgerButton]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Animated.View
          style={{
            transform: [
              { rotate: rotateInterpolate },
              { scale: scale }
            ],
          }}
        >
          {isMenuOpen ? (
            <XIcon size={size} color={color} />
          ) : (
            <MenuAlt05Icon size={size} color={color} />
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }, [styles]);

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
    index?: number;
    isGridView?: boolean;
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
      <Reanimated.View 
        layout={Layout.springify().damping(15).stiffness(200).mass(0.8)}
        entering={isSwitchingView ? FadeIn.duration(200) : undefined}
        exiting={isSwitchingView ? FadeOut.duration(150) : undefined}
      >
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
                  ellipsizeMode="tail"
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
                    ellipsizeMode="tail"
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
    index?: number;
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
      <Reanimated.View 
        layout={Layout.springify().damping(12).stiffness(260).mass(0.6)}
        entering={isSwitchingView ? ZoomIn.duration(220) : undefined}
        exiting={isSwitchingView ? ZoomOut.duration(160) : undefined}
      >
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
              <Text 
                style={styles.gridCardTitle} 
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {note.title}
              </Text>
              {note.description && (
                <Text 
                  style={styles.gridCardDescription} 
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
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
  const renderItem = useCallback(({ item: note, index }: { item: Note, index: number }) => {
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
          index={index}
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
          index={index}
          isGridView={isGridView}
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
    const categories: Array<{ key: TagColor; label: string; color: string }> = [
      { key: 'green', label: TAG_LABELS.green, color: TAG_COLORS.green },
      { key: 'purple', label: TAG_LABELS.purple, color: TAG_COLORS.purple },
      { key: 'blue', label: TAG_LABELS.blue, color: TAG_COLORS.blue },
      { key: 'orange', label: TAG_LABELS.orange, color: TAG_COLORS.orange },
      { key: 'red', label: TAG_LABELS.red, color: TAG_COLORS.red },
    ];

    return () => (
      <>
        <View style={styles.searchAndCategoriesRow}>
          {showIntroAnim ? (
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20, delay: 150 }}
            >
              <Animated.View style={[styles.searchContainer, { width: searchWidthAnim }]}>
                <View 
                  style={[
                    styles.searchInnerBorder,
                    {
                      borderColor: isSearchFocused 
                        ? theme.accentColor 
                        : theme.isDarkMode 
                          ? 'rgba(255, 255, 255, 0.15)' 
                          : 'rgba(0, 0, 0, 0.08)',
                      borderWidth: isSearchFocused ? 2 : 1.5,
                    }
                  ]}
                />
                <TouchableOpacity onPress={toggleSearchBar} style={{ zIndex: 1 }}>
                  <Ionicons 
                    name="search-outline" 
                    size={20} 
                    color={isSearchFocused ? theme.accentColor : theme.placeholderColor} 
                  />
                </TouchableOpacity>
                {isSearchExpanded && (
                  <>
                    <TextInput
                      style={[styles.searchInput, { zIndex: 1 }]}
                      placeholder={t('searchHere')}
                      placeholderTextColor={theme.placeholderColor}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => {
                        setIsSearchFocused(true);
                        if (!isSearchExpanded) {
                          toggleSearchBar();
                        }
                      }}
                      onBlur={() => {
                        setIsSearchFocused(false);
                        collapseSearchBar();
                      }}
                      autoFocus
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity 
                        onPress={() => {
                          setSearchQuery('');
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ zIndex: 1 }}
                      >
                        <Ionicons 
                          name="close-circle" 
                          size={20} 
                          color={isSearchFocused ? theme.accentColor : theme.placeholderColor} 
                        />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </Animated.View>
            </MotiView>
          ) : (
            <Animated.View style={[styles.searchContainer, { width: searchWidthAnim }]}>
              <View 
                style={[
                  styles.searchInnerBorder,
                  {
                    borderColor: isSearchFocused 
                      ? theme.accentColor 
                      : theme.isDarkMode 
                        ? 'rgba(255, 255, 255, 0.15)' 
                        : 'rgba(0, 0, 0, 0.08)',
                    borderWidth: isSearchFocused ? 2 : 1.5,
                  }
                ]}
              />
              <TouchableOpacity onPress={toggleSearchBar} style={{ zIndex: 1 }}>
                <Ionicons 
                  name="search-outline" 
                  size={20} 
                  color={isSearchFocused ? theme.accentColor : theme.placeholderColor} 
                />
              </TouchableOpacity>
              {isSearchExpanded && (
                <>
                  <TextInput
                    style={[styles.searchInput, { zIndex: 1 }]}
                    placeholder={t('searchHere')}
                    placeholderTextColor={theme.placeholderColor}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      if (!isSearchExpanded) {
                        toggleSearchBar();
                      }
                    }}
                    onBlur={() => {
                      setIsSearchFocused(false);
                      collapseSearchBar();
                    }}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => {
                        setSearchQuery('');
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{ zIndex: 1 }}
                    >
                      <Ionicons 
                        name="close-circle" 
                        size={20} 
                        color={isSearchFocused ? theme.accentColor : theme.placeholderColor} 
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Animated.View>
          )}

          {/* Categories ScrollView - Hidden when search is expanded */}
          {!isSearchExpanded && (
            showIntroAnim ? (
              <MotiView
                from={{ opacity: 0, translateY: -8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 20, delay: 220 }}
                style={styles.categoriesContainer}
              >
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScrollView}
                >
                  {categories.map((category, idx) => {
                    const isSelected = selectedCategory === category.key;
                    return (
                      <TouchableOpacity
                        key={category.key}
                        onPress={() => handleCategorySelect(category.key)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.categoryChip,
                            isSelected ? styles.categoryChipGlow : styles.categoryChipNormal,
                            {
                              backgroundColor: isSelected 
                                ? theme.isDarkMode
                                  ? category.color + '30'
                                  : category.color + '20'
                                : theme.secondaryBackground,
                              shadowColor: isSelected ? category.color : '#000',
                              transform: isSelected ? [{ scale: 1.05 }] : [{ scale: 1 }],
                              marginRight: idx === categories.length - 1 ? 0 : 10,
                            }
                          ]}
                        >
                          <View 
                            style={[
                              styles.categoryInnerBorder,
                              {
                                borderColor: isSelected 
                                  ? category.color 
                                  : theme.isDarkMode 
                                    ? 'rgba(255, 255, 255, 0.15)' 
                                    : 'rgba(0, 0, 0, 0.1)',
                                borderWidth: isSelected ? 2 : 1.5,
                              }
                            ]}
                          />
                          <View style={styles.categoryIconContainer}>
                            {getCategoryIcon(category.key, 16, category.color)}
                          </View>
                          <Text 
                            style={[
                              styles.categoryChipText,
                              { 
                                color: isSelected 
                                  ? theme.isDarkMode 
                                    ? '#FFFFFF' 
                                    : category.color
                                  : theme.textColor,
                                fontWeight: isSelected ? '700' : '600',
                                zIndex: 1,
                              }
                            ]}
                          >
                            {category.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.categoriesEndLine} />
              </MotiView>
            ) : (
              <View style={styles.categoriesContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScrollView}
                >
                {categories.map((category, idx) => {
                  const isSelected = selectedCategory === category.key;
                  return (
                    <TouchableOpacity
                      key={category.key}
                      onPress={() => handleCategorySelect(category.key)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.categoryChip,
                          isSelected ? styles.categoryChipGlow : styles.categoryChipNormal,
                          {
                            backgroundColor: isSelected 
                              ? theme.isDarkMode
                                ? category.color + '30'
                                : category.color + '20'
                              : theme.secondaryBackground,
                            shadowColor: isSelected ? category.color : '#000',
                            transform: isSelected ? [{ scale: 1.05 }] : [{ scale: 1 }],
                            marginRight: idx === categories.length - 1 ? 0 : 10,
                          }
                        ]}
                      >
                        <View 
                          style={[
                            styles.categoryInnerBorder,
                            {
                              borderColor: isSelected 
                                ? category.color 
                                : theme.isDarkMode 
                                  ? 'rgba(255, 255, 255, 0.15)' 
                                  : 'rgba(0, 0, 0, 0.1)',
                              borderWidth: isSelected ? 2 : 1.5,
                            }
                          ]}
                        />
                        <View style={styles.categoryIconContainer}>
                          {getCategoryIcon(category.key, 16, category.color)}
                        </View>
                        <Text 
                          style={[
                            styles.categoryChipText,
                            { 
                              color: isSelected 
                                ? theme.isDarkMode 
                                  ? '#FFFFFF' 
                                  : category.color
                                : theme.textColor,
                              fontWeight: isSelected ? '700' : '600',
                              zIndex: 1,
                            }
                          ]}
                        >
                          {category.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                </ScrollView>
                <View style={styles.categoriesEndLine} />
              </View>
            )
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
                setSelectedCategory(null);
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
  }, [searchQuery, isSearchFocused, isSearchExpanded, hasActiveFiltersMemo, selectedCategory, theme.accentColor, theme.placeholderColor, theme.textColor, theme.isDarkMode, t, styles, searchWidthAnim, toggleSearchBar, collapseSearchBar, handleCategorySelect, showIntroAnim]);

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setIsSearchFocused(false);
      collapseSearchBar();
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
              {showIntroAnim ? (
                <MotiView
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  style={styles.headerLeft}
                >
                  <View>
                    <Text style={styles.headerGreeting}>{t('hello')},</Text>
                    <Text style={styles.headerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {(cachedUsername || user?.displayName || user?.email?.split('@')[0] || t('guest'))} 👋
                    </Text>
                  </View>
                </MotiView>
              ) : (
                <View style={styles.headerLeft}>
                  <View>
                    <Text style={styles.headerGreeting}>{t('hello')},</Text>
                    <Text style={styles.headerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {(cachedUsername || user?.displayName || user?.email?.split('@')[0] || t('guest'))} 👋
                    </Text>
                  </View>
                </View>
              )}

              {showIntroAnim ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 100 }}
                  style={styles.headerButtons}
                >
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
                  <AnimatedMenuButton 
                    isMenuOpen={isSideMenuOpen}
                    onPress={toggleSideMenu}
                    size={24}
                    color="#FFF"
                  />
                </MotiView>
              ) : (
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
                  <AnimatedMenuButton 
                    isMenuOpen={isSideMenuOpen}
                    onPress={toggleSideMenu}
                    size={24}
                    color="#FFF"
                  />
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        <Reanimated.View
          style={{ flex: 1 }}
          entering={isSwitchingView ? FadeIn.duration(200) : undefined}
          exiting={isSwitchingView ? FadeOut.duration(150) : undefined}
          layout={Layout.springify().damping(14).stiffness(220)}
        >
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
          columnWrapperStyle={isGridView ? styles.gridRow : undefined}
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
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonLine} />
                      <View style={styles.skeletonLineShort} />
                    </Animated.View>
                  ) : (
                    <Animated.View
                      key={`skeleton-list-${idx}`}
                      style={styles.skeletonCardList}
                    >
                      <View style={styles.skeletonSyncBadge} />
                      <View style={styles.skeletonHeaderRow}>
                        <View style={styles.skeletonTag} />
                        <View style={styles.skeletonFavDot} />
                      </View>
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonLine} />
                      <View style={styles.skeletonLine} />
                      <View style={styles.skeletonLineShort} />
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
                  setSelectedCategory(null);
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
        </Reanimated.View>

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