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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '../NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import NavigationMenu from './NavigationMenu';
import AddNoteModal from './AddNoteModal';
import { StackNavigationProp } from '@react-navigation/stack';
import HighlightText from './HighlightText';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function FavoritesScreen() {
  const { notes, updateNote } = useNotes();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const favoriteNotes = notes.filter(note => note.isFavorite);

  const filteredFavoriteNotes = favoriteNotes.filter(note => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    if (note.title.toLowerCase().includes(searchLower)) return true;
    if (note.description?.toLowerCase().includes(searchLower)) return true;
    if (note.tasks?.some((task: any) => task.text.toLowerCase().includes(searchLower))) return true;
    
    return false;
  });

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

  const handleNotePress = (note: any) => {
    navigation.navigate('AddEditNote', { note });
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
    favoriteButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 78, 78, 0.1)',
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
      backgroundColor: 'rgba(255, 78, 78, 0.1)',
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
    searchIcon: {
      color: isSearchFocused ? theme.accentColor : theme.placeholderColor,
    },
    searchInput: {
      flex: 1,
      color: theme.textColor,
      fontSize: 16,
      marginLeft: 12,
      fontWeight: '400',
    },
  });

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setIsSearchFocused(false);
    }}>
      <View style={styles.container}>
        <StatusBar
          backgroundColor={theme.secondaryBackground}
          barStyle={theme.isDarkMode ? "light-content" : "dark-content"}
        />
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t('favorites')}</Text>
            <Text style={styles.subtitle}>
              {favoriteNotes.length} {favoriteNotes.length === 1 ? t('favorite') : t('favorites')}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {/* TODO: Add filter functionality */}}
          >
            <Ionicons 
              name="funnel-outline" 
              size={20} 
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

        {filteredFavoriteNotes.length > 0 ? (
          <ScrollView 
            style={styles.notesContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredFavoriteNotes.map((note) => (
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
                    style={styles.favoriteButton}
                    onPress={() => handleFavorite(note)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name="heart"
                      size={22} 
                      color="#FF4E4E"
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
                name="heart-outline" 
                size={48} 
                color="#FF4E4E"
              />
            </View>
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
    </TouchableWithoutFeedback>
  );
} 