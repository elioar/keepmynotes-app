import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TaskItem {
  text: string;
  isCompleted: boolean;
}

export interface Note {
  id: string;
  title: string;
  description?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  type: 'text' | 'checklist' | 'task';
  isFavorite: boolean;
  isHidden: boolean;
  tasks?: TaskItem[];
  color?: string;
}

interface BackupData {
  notes: Note[];
  settings?: {
    username?: string;
    theme?: string;
    language?: string;
  };
  version: string;
  backupDate: string;
}

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  hideNote: (id: string) => Promise<void>;
  unhideNote: (id: string) => Promise<void>;
  importNotes: (importedData: BackupData) => Promise<void>;
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

  const stripHtmlTags = (html: string) => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const addNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...noteData,
      id: Date.now().toString(),
      content: noteData.content,
      description: stripHtmlTags(noteData.content || '').substring(0, 100),
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
      const updatedNotes = notes.map(note => {
        if (note.id === updatedNote.id) {
          return {
            ...updatedNote,
            content: updatedNote.content,
            description: stripHtmlTags(updatedNote.content || '').substring(0, 100),
            updatedAt: new Date().toISOString()
          };
        }
        return note;
      });
      
      await saveNotes(updatedNotes);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
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

  const importNotes = async (importedData: BackupData) => {
    try {
      if (!Array.isArray(importedData.notes)) {
        throw new Error('Invalid notes data structure');
      }

      const validatedImportNotes = importedData.notes.map(note => ({
        id: String(note.id || Date.now()),
        title: String(note.title || ''),
        description: String(note.description || ''),
        content: String(note.content || note.description || ''),
        type: ((note.type === 'checklist' || note.type === 'task') ? 'checklist' : 'text') as Note['type'],
        isFavorite: Boolean(note.isFavorite),
        isHidden: Boolean(note.isHidden),
        tasks: Array.isArray(note.tasks) ? note.tasks.map(task => ({
          text: String(task.text || ''),
          isCompleted: Boolean(task.isCompleted)
        })) : [],
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      const existingNotes = [...notes];
      const mergedNotes = [...existingNotes];
      
      validatedImportNotes.forEach(importedNote => {
        const existingNoteIndex = existingNotes.findIndex(note => note.id === importedNote.id);
        if (existingNoteIndex === -1) {
          mergedNotes.push(importedNote);
        } else {
          mergedNotes[existingNoteIndex] = {
            ...importedNote,
            updatedAt: new Date().toISOString()
          };
        }
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mergedNotes));
      setNotes(mergedNotes);

      if (importedData.settings?.username) {
        await AsyncStorage.setItem('@username', importedData.settings.username);
      }

      console.log('✅ Import completed successfully');
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  };

  return (
    <NotesContext.Provider value={{ 
      notes, 
      addNote, 
      updateNote, 
      deleteNote,
      hideNote,
      unhideNote,
      importNotes
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