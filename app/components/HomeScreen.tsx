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
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
  Easing,
  ToastAndroid,
  Button,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotes, Note } from '../NotesContext';
import HighlightText from './HighlightText';
import { Swipeable } from 'react-native-gesture-handler';
import AddNoteModal from './AddNoteModal';
import type { TaskItem } from '../NotesContext';
import SettingsModal from './SettingsModal';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import UsernameModal from './UsernameModal';
import NavigationMenu from './NavigationMenu';
import FilterModal from './FilterModal';
import NoteActionMenu from './NoteActionMenu';
import * as Haptics from 'expo-haptics';

type RootStackParamList = {
  Home: undefined;
  Task: { note?: any };
  Favorites: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { notes } = useNotes();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleNotePress = (note: any) => {
    navigation.navigate('Task', { note });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      padding: 16,
    },
    noteCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: theme.placeholderColor,
      marginBottom: 8,
    },
    date: {
      fontSize: 12,
      color: theme.placeholderColor,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.placeholderColor,
      fontSize: 16,
      marginTop: 20,
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      {notes.length === 0 ? (
        <Text style={styles.emptyText}>{t('noNotes')}</Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.noteCard}
              onPress={() => handleNotePress(item)}
            >
              <Text style={styles.title}>{item.title}</Text>
              {item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
      <TouchableOpacity 
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          backgroundColor: theme.accentColor,
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}
        onPress={() => navigation.navigate('Task', { note: undefined })}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen; 