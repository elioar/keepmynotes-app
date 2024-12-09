import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';

interface Note {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const NOTES_DIRECTORY = `${FileSystem.documentDirectory}notes/`;
const NOTES_FILE = `${NOTES_DIRECTORY}notes.json`;

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    initializeNotesDirectory();
  }, []);

  async function initializeNotesDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(NOTES_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(NOTES_DIRECTORY);
      }
      
      const fileInfo = await FileSystem.getInfoAsync(NOTES_FILE);
      if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(NOTES_FILE, JSON.stringify([]));
      } else {
        const savedNotes = await FileSystem.readAsStringAsync(NOTES_FILE);
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.error('Error initializing notes directory:', error);
    }
  }

  async function saveNotesToFile(updatedNotes: Note[]) {
    try {
      await FileSystem.writeAsStringAsync(NOTES_FILE, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }

  async function addNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) {
    const newNote: Note = {
      ...noteData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedNotes = [...notes, newNote];
    await saveNotesToFile(updatedNotes);
  }

  async function updateNote(updatedNote: Note) {
    const updatedNotes = notes.map(note => 
      note.id === updatedNote.id 
        ? { ...updatedNote, updatedAt: new Date().toISOString() }
        : note
    );
    await saveNotesToFile(updatedNotes);
  }

  async function deleteNote(id: string) {
    const updatedNotes = notes.filter(note => note.id !== id);
    await saveNotesToFile(updatedNotes);
  }

  async function toggleFavorite(id: string) {
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, isFavorite: !note.isFavorite }
        : note
    );
    await saveNotesToFile(updatedNotes);
  }

  return (
    <NotesContext.Provider value={{
      notes,
      addNote,
      updateNote,
      deleteNote,
      toggleFavorite,
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

export default NotesContext; 