import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TaskItem {
  text: string;
  isCompleted: boolean;
  dueDate?: string;
  dueTime?: string;
  priority?: 'low' | 'medium' | 'high';
  location?: string;
  isAllDay?: boolean;
  reminder?: boolean;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customRepeat?: {
    frequency: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };
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
  isDeleted?: boolean;
  deletedAt?: string;
  tasks?: TaskItem[];
  color?: string;
  tags?: string[];
}

export interface Task {
  text: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  dueTime?: string;
  location?: string;
  isAllDay: boolean;
  reminder: boolean;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customRepeat?: {
    frequency: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };
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
  isLoading: boolean;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  hideNote: (id: string) => Promise<void>;
  unhideNote: (id: string) => Promise<void>;
  importNotes: (importedData: BackupData) => Promise<void>;
  loadNotes: () => Promise<void>;
  clearStorage: () => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  getTrashNotes: () => Note[];
  cleanupExpiredTrash: () => Promise<void>;
  trashRetentionDays: number;
  updateTrashRetentionDays: (days: number) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const STORAGE_KEY = '@keep_my_notes';
const TRASH_RETENTION_KEY = '@trash_retention_days';
const DEFAULT_TRASH_RETENTION_DAYS = 30;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache expiry

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [trashRetentionDays, setTrashRetentionDays] = useState<number>(DEFAULT_TRASH_RETENTION_DAYS);

  // Μεμονωμένη συνάρτηση για αποκοπή HTML
  const stripHtmlTags = useCallback((html: string) => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Φόρτωση της ρύθμισης διατήρησης κάδου ανακύκλωσης
  useEffect(() => {
    const loadTrashRetentionDays = async () => {
      try {
        const storedDays = await AsyncStorage.getItem(TRASH_RETENTION_KEY);
        if (storedDays) {
          const days = parseInt(storedDays, 10);
          if (!isNaN(days) && days > 0) {
            setTrashRetentionDays(days);
          }
        }
      } catch (error) {
        console.error('❌ Error loading trash retention days:', error);
      }
    };
    
    loadTrashRetentionDays();
  }, []);

  // Ενημέρωση της ρύθμισης διατήρησης κάδου ανακύκλωσης
  const updateTrashRetentionDays = useCallback(async (days: number) => {
    try {
      if (days > 0) {
        await AsyncStorage.setItem(TRASH_RETENTION_KEY, days.toString());
        setTrashRetentionDays(days);
      }
    } catch (error) {
      console.error('❌ Error updating trash retention days:', error);
      throw error;
    }
  }, []);

  // Βελτιστοποιημένη φόρτωση σημειώσεων
  const loadNotes = useCallback(async (force: boolean = false) => {
    try {
      // Check cache validity unless force refresh is requested
      const now = Date.now();
      if (!force && lastFetch && (now - lastFetch < CACHE_EXPIRY)) {
        return; // Use cached data
      }

      setIsLoading(true);
      let storedNotes = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (!storedNotes) {
        storedNotes = await AsyncStorage.getItem('@notes');
        
        if (storedNotes) {
          await AsyncStorage.setItem(STORAGE_KEY, storedNotes);
        }
      }
      
      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes);
        setNotes(parsedNotes);
      } else {
        setNotes([]);
      }

      setLastFetch(now);
    } catch (error) {
      console.error('❌ Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lastFetch]);

  // Initialize notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Optimized save notes function with debounce
  const saveNotes = useCallback(async (updatedNotes: Note[]) => {
    try {
      const notesJson = JSON.stringify(updatedNotes);
      await AsyncStorage.setItem(STORAGE_KEY, notesJson);
      setNotes(updatedNotes);
      setLastFetch(Date.now()); // Update cache timestamp
    } catch (error) {
      console.error('❌ Error saving notes:', error);
      throw error;
    }
  }, []);

  // Optimized add note function
  const addNote = useCallback(async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newNote: Note = {
        ...noteData,
        id: Date.now().toString(),
        content: noteData.content || '',
        description: stripHtmlTags(noteData.content || '').substring(0, 100),
        isFavorite: false,
        isHidden: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedNotes = [...notes, newNote];
      await saveNotes(updatedNotes);
      return newNote;
    } catch (error) {
      console.error('❌ Error adding note:', error);
      throw error;
    }
  }, [notes, saveNotes, stripHtmlTags]);

  // Optimized update note function
  const updateNote = useCallback(async (updatedNote: Note) => {
    try {
      const existingNoteIndex = notes.findIndex(note => note.id === updatedNote.id);
      if (existingNoteIndex === -1) {
        throw new Error(`Note with ID ${updatedNote.id} not found`);
      }
      
      const finalUpdatedNote = {
        ...updatedNote,
        content: updatedNote.content || '',
        description: updatedNote.description || '',
        updatedAt: new Date().toISOString()
      };
      
      const updatedNotes = notes.map(note => 
        note.id === updatedNote.id ? finalUpdatedNote : note
      );
      
      await saveNotes(updatedNotes);
      console.log('Updating note:', finalUpdatedNote);
    } catch (error) {
      throw error;
    }
  }, [notes, saveNotes, stripHtmlTags]);

  // Optimized delete note function
  const deleteNote = useCallback(async (id: string) => {
    try {
      const noteToTrash = notes.find(note => note.id === id);
      if (!noteToTrash) return;
      
      const trashedNote = {
        ...noteToTrash,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedNotes = notes.map(note => 
        note.id === id ? trashedNote : note
      );
      
      await saveNotes(updatedNotes);
    } catch (error) {
      throw error;
    }
  }, [notes, saveNotes]);

  // Restore note from trash
  const restoreFromTrash = useCallback(async (id: string) => {
    try {
      const noteToRestore = notes.find(note => note.id === id && note.isDeleted);
      if (!noteToRestore) return;
      
      const restoredNote = {
        ...noteToRestore,
        isDeleted: false,
        deletedAt: undefined,
        updatedAt: new Date().toISOString()
      };
      
      const updatedNotes = notes.map(note => 
        note.id === id ? restoredNote : note
      );
      
      await saveNotes(updatedNotes);
    } catch (error) {
      throw error;
    }
  }, [notes, saveNotes]);

  // Permanently delete a note
  const permanentlyDeleteNote = useCallback(async (id: string) => {
    try {
      const updatedNotes = notes.filter(note => note.id !== id);
      await saveNotes(updatedNotes);
    } catch (error) {
      console.error('❌ Error permanently deleting note:', error);
      throw error;
    }
  }, [notes, saveNotes]);

  // Empty trash (permanently delete all notes in trash)
  const emptyTrash = useCallback(async () => {
    try {
      const updatedNotes = notes.filter(note => !note.isDeleted);
      await saveNotes(updatedNotes);
    } catch (error) {
      console.error('❌ Error emptying trash:', error);
      throw error;
    }
  }, [notes, saveNotes]);

  // Get trash notes
  const getTrashNotes = useCallback(() => {
    return notes.filter(note => note.isDeleted === true);
  }, [notes]);

  // Cleanup expired trash (auto-delete notes based on retention setting)
  const cleanupExpiredTrash = useCallback(async () => {
    try {
      const now = new Date();
      const retentionPeriodMs = trashRetentionDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(now.getTime() - retentionPeriodMs);
      
      const updatedNotes = notes.filter(note => {
        // Κρατάμε τις σημειώσεις που δεν είναι διαγραμμένες
        if (!note.isDeleted) return true;
        
        // Ελέγχουμε αν η σημείωση είναι διαγραμμένη για περισσότερο από το χρονικό διάστημα διατήρησης
        if (note.deletedAt) {
          const deletedDate = new Date(note.deletedAt);
          return deletedDate > cutoffDate; // Κρατάμε μόνο αυτές που διαγράφηκαν πιο πρόσφατα
        }
        
        return true; // Αν δεν υπάρχει ημερομηνία διαγραφής, κρατάμε τη σημείωση
      });
      
      if (updatedNotes.length !== notes.length) {
        await saveNotes(updatedNotes);
      }
    } catch (error) {
      console.error('❌ Error cleaning up trash:', error);
      throw error;
    }
  }, [notes, saveNotes, trashRetentionDays]);

  // Εκτελούμε το cleanupExpiredTrash κάθε φορά που φορτώνεται το context
  useEffect(() => {
    cleanupExpiredTrash();
  }, [cleanupExpiredTrash]);

  // Optimized hide/unhide functions
  const hideNote = useCallback(async (id: string) => {
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

      await saveNotes(updatedNotes);
    } catch (error) {
      console.error('❌ Error hiding note:', error);
      throw error;
    }
  }, [notes, saveNotes]);

  const unhideNote = useCallback(async (id: string) => {
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

      await saveNotes(updatedNotes);
    } catch (error) {
      console.error('❌ Error unhiding note:', error);
      throw error;
    }
  }, [notes, saveNotes]);

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
        isDeleted: Boolean(note.isDeleted),
        deletedAt: note.deletedAt,
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

  const clearStorage = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem('@notes');
      setNotes([]);
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
      throw error;
    }
  };

  // Memoize context value
  const contextValue = useMemo(() => ({
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    hideNote,
    unhideNote,
    importNotes,
    loadNotes,
    clearStorage,
    restoreFromTrash,
    emptyTrash,
    permanentlyDeleteNote,
    getTrashNotes,
    cleanupExpiredTrash,
    trashRetentionDays,
    updateTrashRetentionDays
  }), [notes, isLoading, addNote, updateNote, deleteNote, hideNote, unhideNote, loadNotes, 
       trashRetentionDays, updateTrashRetentionDays, restoreFromTrash, emptyTrash, 
       permanentlyDeleteNote, getTrashNotes, cleanupExpiredTrash]);

  return (
    <NotesContext.Provider value={contextValue}>
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