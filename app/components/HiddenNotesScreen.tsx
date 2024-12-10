import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotes } from '../NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Swipeable } from 'react-native-gesture-handler';
import HighlightText from './HighlightText';
import NoteActionMenu from './NoteActionMenu';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
  HiddenNotes: undefined;
};

export default function HiddenNotesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { notes, deleteNote, updateNote } = useNotes();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Home');
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  const hiddenNotes = notes.filter(note => note.isHidden === true);
  const handleNotePress = (note: any) => {
    navigation.navigate('AddEditNote', { note });
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
      const updatedNote = {
        ...note,
        isHidden: false,
        updatedAt: new Date().toISOString()
      };
      await updateNote(updatedNote);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
    },
    backButton: {
      marginRight: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.textColor,
    },
    notesContainer: {
      flex: 1,
      padding: 20,
    },
    noteCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      height: 175,
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
    },
    noteFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    emptyText: {
      color: theme.placeholderColor,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 16,
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
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons 
            name="chevron-back" 
            size={28} 
            color={theme.textColor} 
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t('hiddenNotes')}</Text>
      </View>

      {hiddenNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="eye-off-outline" 
            size={48} 
            color={theme.placeholderColor} 
          />
          <Text style={styles.emptyText}>{t('noHiddenNotes')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.notesContainer}>
          {hiddenNotes.map((note) => (
            <Swipeable
              key={note.id}
              renderRightActions={() => (
                <View style={styles.actionContainer}>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDelete(note.id)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            >
              <Pressable 
                style={styles.noteCard}
                onPress={() => handleNotePress(note)}
                onLongPress={() => handleLongPress(note)}
                delayLongPress={300}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteDate}>
                    {new Date(note.createdAt).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </Text>
                  <TouchableOpacity onPress={() => handleUnhide(note)}>
                    <Ionicons 
                      name="eye-outline"
                      size={24} 
                      color={theme.placeholderColor} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.noteContent}>
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {note.title}
                  </Text>
                  {note.description && (
                    <Text style={styles.noteDescription} numberOfLines={3}>
                      {note.description}
                    </Text>
                  )}
                </View>

                <View style={styles.noteFooter}>
                  <Text style={styles.noteDate}>
                    {getTimeAgo(note.createdAt)}
                  </Text>
                </View>
              </Pressable>
            </Swipeable>
          ))}
        </ScrollView>
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
      />
    </View>
  );
} 