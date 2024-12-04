import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NavigationMenu from './NavigationMenu';
import AddNoteModal from './AddNoteModal';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FavoritesScreen() {
  const { notes, updateNote } = useNotes();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const favoriteNotes = notes.filter(note => note.isFavorite);

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

  const handleNavigateToHome = () => {
    navigation.navigate('Home');
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
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
    },
    title: {
      fontSize: 32,
      fontWeight: '600',
      color: theme.textColor,
    },
    notesContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingBottom: 80, // Space for bottom navigation
    },
    noteCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      minHeight: 100,
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
      overflow: 'hidden',
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
      width: '100%',
    },
    noteTitle: {
      color: theme.textColor,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 6,
      flex: 1,
      marginRight: 16,
    },
    noteDescription: {
      color: theme.placeholderColor,
      fontSize: 14,
      lineHeight: 18,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    emptyStateText: {
      color: theme.placeholderColor,
      fontSize: 16,
      marginTop: 16,
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
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites')}</Text>
      </View>

      {favoriteNotes.length > 0 ? (
        <ScrollView style={styles.notesContainer}>
          {favoriteNotes.map((note) => (
            <Pressable 
              key={note.id}
              style={styles.noteCard}
            >
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle} numberOfLines={1}>
                  {note.title}
                </Text>
                <TouchableOpacity 
                  onPress={() => handleFavorite(note)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="heart" 
                    size={24} 
                    color="#FF4E4E" 
                  />
                </TouchableOpacity>
              </View>
              {note.description && (
                <Text style={styles.noteDescription} numberOfLines={3}>
                  {note.description}
                </Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons 
            name="heart-outline" 
            size={48} 
            color={theme.placeholderColor} 
          />
          <Text style={styles.emptyStateText}>
            {t('noFavorites')}
          </Text>
        </View>
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
  );
} 