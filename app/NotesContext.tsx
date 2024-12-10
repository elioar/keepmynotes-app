import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TaskItem {
  text: string;
  isCompleted: boolean;
}

interface Note {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  type: 'text' | 'checklist';
  isFavorite: boolean;
  isHidden: boolean;
  tasks?: TaskItem[];
}

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  hideNote: (id: string) => Promise<void>;
  unhideNote: (id: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const STORAGE_KEY = '@notes';

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const addNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...noteData,
      id: Date.now().toString(),
      isFavorite: false,
      isHidden: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedNotes = [...notes, newNote];
    await saveNotes(updatedNotes);
  };

  const updateNote = async (updatedNote: Note) => {
    try {
      console.log('Updating note:', updatedNote);
      const updatedNotes = notes.map(note => 
        note.id === updatedNote.id 
          ? { ...updatedNote, updatedAt: new Date().toISOString() }
          : note
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      console.log('Deleting note:', id);
      const updatedNotes = notes.filter(note => note.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const hideNote = async (id: string) => {
    try {
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) return;

      const updatedNote = {
        ...noteToUpdate,
        isHidden: true,
        updatedAt: new Date().toISOString()
      };

      const updatedNotes = notes.map(note => 
        note.id === id ? updatedNote : note
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error hiding note:', error);
    }
  };

  const unhideNote = async (id: string) => {
    try {
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) return;

      const updatedNote = {
        ...noteToUpdate,
        isHidden: false,
        updatedAt: new Date().toISOString()
      };

      const updatedNotes = notes.map(note => 
        note.id === id ? updatedNote : note
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error unhiding note:', error);
    }
  };

  return (
    <NotesContext.Provider value={{ 
      notes, 
      addNote, 
      updateNote, 
      deleteNote,
      hideNote,
      unhideNote
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}

export default NotesProvider; 