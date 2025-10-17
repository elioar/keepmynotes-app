import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  BackHandler,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotes } from '../NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HighlightText from './HighlightText';
import NoteActionMenu from './NoteActionMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Home: undefined;
  Task: { noteId?: string };
  Favorites: undefined;
  HiddenNotes: undefined;
  PinScreen: { isChangingPin?: boolean };
};

export default function HiddenNotesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { notes, deleteNote, updateNote } = useNotes();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  React.useEffect(() => {
    const checkPin = async () => {
      const hasPin = await AsyncStorage.getItem('@secure_pin');
      if (!hasPin) {
        navigation.replace('PinScreen', { isChangingPin: false });
      }
    };
    checkPin();
  }, [navigation]);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Home');
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  const hiddenNotes = notes.filter(note => note.isHidden === true && !note.isDeleted);
  const handleNotePress = (note: any) => {
    navigation.navigate('Task', { noteId: note.id });
  };

  const handleDelete = async (noteId: string | undefined) => {
    if (!noteId) return;
    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleUnhide = async (note: any) => {
    try {
      Alert.alert(
        t('unhideNote'),
        t('unhideNoteConfirm'),
        [
          {
            text: t('cancel'),
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: t('unhide'),
            style: 'default',
            onPress: async () => {
              const updatedNote = {
                ...note,
                isHidden: false,
                updatedAt: new Date().toISOString()
              };
              await updateNote(updatedNote);
            }
          }
        ],
        {
          cancelable: true,
        }
      );
    } catch (error) {
      console.error('Error unhiding note:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return t('justNow');
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${t(minutes === 1 ? 'minuteAgo' : 'minutesAgo')}`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${t(hours === 1 ? 'hourAgo' : 'hoursAgo')}`;
      }
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${t(days === 1 ? 'dayAgo' : 'daysAgo')}`;
    } catch (error) {
      return t('justNow');
    }
  };

  const handleLongPress = (note: any) => {
    setSelectedNote(note);
    setShowActionMenu(true);
  };

  const handleHideNote = async () => {
    if (selectedNote) {
      try {
        const updatedNote = {
          ...selectedNote,
          isHidden: false,
          updatedAt: new Date().toISOString()
        };
        await updateNote(updatedNote);
        setShowActionMenu(false);
        setSelectedNote(null);
      } catch (error) {
        console.error('Error unhiding note:', error);
      }
    }
  };

  const filteredHiddenNotes = hiddenNotes.filter(note => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    if (note.title.toLowerCase().includes(searchLower)) return true;
    if (note.description?.toLowerCase().includes(searchLower)) return true;
    if (note.tasks?.some((task: any) => task.text.toLowerCase().includes(searchLower))) return true;
    
    return false;
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 50,
      paddingBottom: 20,
      backgroundColor: theme.secondaryBackground,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    headerLeft: {
      flex: 1,
    },
    filterButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.placeholderColor,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackground,
      marginHorizontal: 20,
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
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 100,
    },
    noteCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    noteContent: {
      flex: 1,
      marginRight: 16,
    },
    noteTitle: {
      color: theme.textColor,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
    noteDescription: {
      color: theme.placeholderColor,
      fontSize: 14,
      lineHeight: 20,
    },
    unhideButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(78, 203, 113, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    emptyStateIcon: {
      backgroundColor: 'rgba(78, 203, 113, 0.1)',
      padding: 20,
      borderRadius: 30,
      marginBottom: 16,
    },
    emptyStateText: {
      color: theme.placeholderColor,
      fontSize: 16,
      textAlign: 'center',
      maxWidth: '80%',
    },
  });

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setIsSearchFocused(false);
    }}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <StatusBar
          backgroundColor={theme.secondaryBackground}
          barStyle={theme.isDarkMode ? "light-content" : "dark-content"}
        />
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t('hiddenNotes')}</Text>
            <Text style={styles.subtitle}>
              {hiddenNotes.length} {hiddenNotes.length === 1 ? t('hiddenNote') : t('hiddenNotes')}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons 
              name="close-outline" 
              size={24} 
              color={theme.textColor}
            />
          </TouchableOpacity>
        </View>

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

        {filteredHiddenNotes.length > 0 ? (
          <ScrollView 
            style={styles.notesContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredHiddenNotes.map((note) => (
              <TouchableOpacity 
                key={note.id}
                onPress={() => handleNotePress(note)}
                activeOpacity={0.7}
              >
                <View style={styles.noteCard}>
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
                          text={note.description}
                          highlight={searchQuery}
                          style={styles.noteDescription}
                        />
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.unhideButton}
                    onPress={() => handleUnhide(note)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name="eye-outline"
                      size={22} 
                      color="#4ECB71"
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons 
                name="eye-off-outline" 
                size={48} 
                color="#4ECB71"
              />
            </View>
            <Text style={styles.emptyStateText}>
              {t('noHiddenNotes')}
            </Text>
          </View>
        )}

        <NoteActionMenu
          visible={showActionMenu}
          onClose={() => {
            setShowActionMenu(false);
            setSelectedNote(null);
          }}
          onEdit={() => {
            setShowActionMenu(false);
            handleNotePress(selectedNote);
          }}
          onDelete={async () => {
            if (selectedNote?.id) {
              await handleDelete(selectedNote.id);
              setShowActionMenu(false);
              setSelectedNote(null);
            }
          }}
          onHide={handleHideNote}
          isHidden={true}
          onColorChange={() => {}}
          currentColor={null}
        />
      </View>
    </TouchableWithoutFeedback>
  );
} 