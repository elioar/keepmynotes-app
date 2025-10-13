import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Platform,
} from 'react-native';
import Reanimated, { 
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  GestureDetector, 
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useNotes } from '../NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import NavigationMenu from './NavigationMenu';
import AddNoteModal from './AddNoteModal';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HighlightText from './HighlightText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = 120;
const CARD_MARGIN = 16;

type RootStackParamList = {
  Home: undefined;
  Task: { note?: any };
  Favorites: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DraggableNoteCardProps {
  note: any;
  index: number;
  searchQuery: string;
  onPress: (note: any) => void;
  onFavorite: (note: any) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  theme: any;
  totalNotes: number;
}

const DraggableNoteCard = ({ 
  note, 
  index, 
  searchQuery,
  onPress, 
  onFavorite, 
  onDragEnd,
  theme,
  totalNotes 
}: DraggableNoteCardProps) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const opacity = useSharedValue(1);
  const shadowOpacity = useSharedValue(theme.isDarkMode ? 0.1 : 0);
  const rotateZ = useSharedValue('0deg');
  
  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart(() => {
      runOnJS(triggerHaptic)();
      scale.value = withSpring(1.05, { damping: 15, stiffness: 300 });
      zIndex.value = 1000;
      shadowOpacity.value = withTiming(theme.isDarkMode ? 0.3 : 0, { duration: 200 });
      rotateZ.value = withSpring('1deg', { damping: 15 });
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const moveY = event.translationY;
      const toIndex = index + Math.round(moveY / (CARD_HEIGHT + CARD_MARGIN));
      const clampedToIndex = Math.max(0, Math.min(totalNotes - 1, toIndex));
      
      if (clampedToIndex !== index) {
        runOnJS(onDragEnd)(index, clampedToIndex);
      }
      
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      zIndex.value = 0;
      shadowOpacity.value = withTiming(theme.isDarkMode ? 0.1 : 0, { duration: 200 });
      rotateZ.value = withSpring('0deg', { damping: 15 });
    })
    .onFinalize(() => {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      zIndex.value = 0;
      shadowOpacity.value = withTiming(theme.isDarkMode ? 0.1 : 0, { duration: 200 });
      rotateZ.value = withSpring('0deg', { damping: 15 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateZ: rotateZ.value },
    ],
    zIndex: zIndex.value,
    shadowOpacity: shadowOpacity.value,
    opacity: opacity.value,
  }));

  const cardStyles = StyleSheet.create({
    noteCardContainer: {
      marginBottom: CARD_MARGIN,
    },
    noteCardGradient: {
      borderRadius: 20,
      padding: 1.5,
    },
    noteCard: {
      borderRadius: 18,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      height: CARD_HEIGHT,
      shadowColor: theme.isDarkMode ? '#000' : 'transparent',
      shadowOffset: {
        width: 0,
        height: theme.isDarkMode ? 2 : 0,
      },
      shadowOpacity: theme.isDarkMode ? 0.08 : 0,
      shadowRadius: theme.isDarkMode ? 8 : 0,
      elevation: theme.isDarkMode ? 3 : 0,
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
    },
    dragHandle: {
      width: 20,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2.5,
      paddingVertical: 8,
    },
    dragLine: {
      width: 3,
      height: 14,
      borderRadius: 2,
      opacity: 0.3,
    },
    noteContent: {
      flex: 1,
      marginRight: 12,
    },
    noteTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    noteIcon: {
      marginRight: 6,
    },
    noteTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      letterSpacing: 0.1,
    },
    noteDescription: {
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
      opacity: 0.65,
    },
    taskPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 5,
    },
    taskCount: {
      fontSize: 11,
      fontWeight: '500',
      opacity: 0.7,
    },
    favoriteButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
    },
    favoriteGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <Reanimated.View 
      entering={FadeInDown.delay(index * 50).springify().damping(15).stiffness(300)}
      exiting={FadeOutUp.springify().damping(15).stiffness(300)}
    >
      <GestureDetector gesture={dragGesture}>
        <Reanimated.View style={animatedStyle}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 20, 
              stiffness: 300,
              delay: index * 30,
            }}
          >
            <View style={cardStyles.noteCardContainer}>
              <TouchableOpacity 
                onPress={() => onPress(note)}
                activeOpacity={0.7}
              >
                <View style={[cardStyles.noteCard, { backgroundColor: theme.secondaryBackground }]}>
                  {/* Drag Handle - vertical bars */}
                  <View style={cardStyles.dragHandle}>
                    <View style={[cardStyles.dragLine, { backgroundColor: theme.placeholderColor }]} />
                    <View style={[cardStyles.dragLine, { backgroundColor: theme.placeholderColor }]} />
                  </View>
                  
                  {/* Note Content */}
                  <View style={cardStyles.noteContent}>
                    <View style={cardStyles.noteTitleRow}>
                      <Ionicons 
                        name={note.type === 'task' ? 'checkbox-outline' : 'document-text-outline'} 
                        size={18} 
                        color={theme.accentColor}
                        style={cardStyles.noteIcon}
                      />
                      <Text style={[cardStyles.noteTitle, { color: theme.textColor }]} numberOfLines={1}>
                        <HighlightText 
                          text={note.title}
                          highlight={searchQuery}
                          style={cardStyles.noteTitle}
                        />
                      </Text>
                    </View>
                    
                    {note.description && (
                      <Text style={[cardStyles.noteDescription, { color: theme.placeholderColor }]} numberOfLines={2}>
                        <HighlightText 
                          text={note.description}
                          highlight={searchQuery}
                          style={cardStyles.noteDescription}
                        />
                      </Text>
                    )}
                    
                    {note.tasks && note.tasks.length > 0 && (
                      <View style={cardStyles.taskPreview}>
                        <Ionicons 
                          name="checkmark-circle-outline" 
                          size={12} 
                          color={theme.accentColor}
                        />
                        <Text style={[cardStyles.taskCount, { color: theme.placeholderColor }]}>
                          {note.tasks.filter((t: any) => t.isCompleted).length}/{note.tasks.length} tasks
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Favorite Button */}
                  <TouchableOpacity 
                    style={cardStyles.favoriteButton}
                    onPress={() => onFavorite(note)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <LinearGradient
                      colors={['#FF4E4E', '#FF6B9D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={cardStyles.favoriteGradient}
                    >
                      <Ionicons 
                        name="heart"
                        size={18} 
                        color="#FFF"
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          </MotiView>
        </Reanimated.View>
      </GestureDetector>
    </Reanimated.View>
  );
};

export default function FavoritesScreen() {
  const { notes, updateNote } = useNotes();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [orderedNotes, setOrderedNotes] = useState<any[]>([]);

  const favoriteNotes = notes.filter(note => note.isFavorite && !note.isDeleted);

  const filteredFavoriteNotes = (searchQuery ? favoriteNotes : orderedNotes).filter(note => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    if (note.title.toLowerCase().includes(searchLower)) return true;
    if (note.description?.toLowerCase().includes(searchLower)) return true;
    if (note.tasks?.some((task: any) => task.text.toLowerCase().includes(searchLower))) return true;
    
    return false;
  });

  // Initialize ordered notes
  React.useEffect(() => {
    if (!searchQuery) {
      setOrderedNotes(favoriteNotes);
    }
  }, [favoriteNotes.length]);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    setOrderedNotes(prev => {
      const newOrder = [...prev];
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedItem);
      return newOrder;
    });
  }, []);

  const handleFavorite = async (note: any) => {
    try {
      const updatedNote = { ...note, isFavorite: !note.isFavorite };
      updateNote(updatedNote).catch(() => {});
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleNavigateToHome = () => {
    navigation.navigate('Home');
  };

  const handleOptionSelect = (type: string) => {
    setIsModalVisible(false);
    switch (type) {
      case 'note':
        navigation.navigate('Task', { note: { type: 'text' } });
        break;
      case 'task':
        navigation.navigate('Task', { note: { type: 'task' } });
        break;
    }
  };

  const handleNotePress = (note: any) => {
    navigation.navigate('Task', { note });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
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
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    filterButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: '#FFF',
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.85)',
      fontWeight: '500',
    },
    notesContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 100,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    emptyStateIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255, 78, 78, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyStateText: {
      color: theme.placeholderColor,
      fontSize: 17,
      textAlign: 'center',
      maxWidth: '80%',
      fontWeight: '500',
      lineHeight: 24,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackground,
      marginHorizontal: 20,
      marginTop: 24,
      marginBottom: 16,
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
    dragHint: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      alignItems: 'center',
    },
    dragHintText: {
      color: theme.placeholderColor,
      fontSize: 13,
      fontWeight: '500',
      opacity: 0.6,
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss();
        setIsSearchFocused(false);
      }}>
        <View style={styles.container}>
          <StatusBar
            backgroundColor="transparent"
            barStyle="light-content"
            translucent
          />
          
          <LinearGradient
            colors={
              theme.isDarkMode
                ? ['#8B45FF', '#FF4E4E', '#FF6B9D']
                : ['#9F5FFF', '#FF5E7E', '#FF88A8']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MotiView
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <Text style={styles.title}>{t('favorites')}</Text>
                  <Text style={styles.subtitle}>
                    {favoriteNotes.length} {favoriteNotes.length === 1 ? 'αγαπημένη' : 'αγαπημένες'}
                  </Text>
                </MotiView>
              </View>
              
              <View style={styles.headerActions}>
                <MotiView
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    type: 'spring', 
                    damping: 20, 
                    stiffness: 300,
                    delay: 100,
                  }}
                >
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => {/* TODO: Add filter functionality */}}
                  >
                    <Ionicons 
                      name="funnel-outline" 
                      size={20} 
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </MotiView>
              </View>
            </View>
          </LinearGradient>

          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 150 }}
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
                <MotiView
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
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
                </MotiView>
              )}
            </View>
          </MotiView>

          {!searchQuery && filteredFavoriteNotes.length > 0 && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
              style={styles.dragHint}
            >
              <Text style={styles.dragHintText}>
                ↕️ Πατήστε παρατεταμένα μια κάρτα για αναδιάταξη
              </Text>
            </MotiView>
          )}

          {filteredFavoriteNotes.length > 0 ? (
            <Reanimated.ScrollView 
              style={styles.notesContainer}
              showsVerticalScrollIndicator={false}
            >
              {filteredFavoriteNotes.map((note, index) => (
                <DraggableNoteCard
                  key={note.id}
                  note={note}
                  index={index}
                  searchQuery={searchQuery}
                  onPress={handleNotePress}
                  onFavorite={handleFavorite}
                  onDragEnd={handleDragEnd}
                  theme={theme}
                  totalNotes={filteredFavoriteNotes.length}
                />
              ))}
            </Reanimated.ScrollView>
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              style={styles.emptyState}
            >
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring', 
                  damping: 12, 
                  stiffness: 200,
                  delay: 100,
                }}
              >
                <LinearGradient
                  colors={['rgba(255, 78, 78, 0.2)', 'rgba(255, 107, 157, 0.2)']}
                  style={styles.emptyStateIcon}
                >
                  <MotiView
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      type: 'timing',
                      duration: 2000,
                      loop: true,
                    }}
                  >
                    <Ionicons 
                      name="heart-outline" 
                      size={50} 
                      color="#FF4E4E"
                    />
                  </MotiView>
                </LinearGradient>
              </MotiView>
              
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 20, delay: 300 }}
              >
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'Δεν βρέθηκαν αποτελέσματα' : t('noFavorites')}
                </Text>
              </MotiView>
            </MotiView>
          )}

          <NavigationMenu 
            onAddPress={() => setIsModalVisible(true)}
          />

          <AddNoteModal
            visible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            onSelectOption={handleOptionSelect}
          />
        </View>
      </TouchableWithoutFeedback>
    </GestureHandlerRootView>
  );
} 