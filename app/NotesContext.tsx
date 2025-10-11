import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './config/firebase';
import { useAuth } from './contexts/AuthContext';
import { AppState } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, writeBatch, addDoc, deleteDoc, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

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
  isSynced?: boolean;
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

export interface NotesContextType {
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
  syncNote: (noteId: string) => Promise<void>;
  setNotes: (notes: Note[]) => void;
  clearLocalNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const STORAGE_KEY = '@keep_my_notes';
const TRASH_RETENTION_KEY = '@trash_retention_days';
const DEFAULT_TRASH_RETENTION_DAYS = 30;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache expiry

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trashRetentionDays, setTrashRetentionDays] = useState(30); // Default 30 days
  const [lastFetch, setLastFetch] = useState<number>(Date.now());
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const { user } = useAuth();
  const SYNC_INTERVAL = 30000; // 30 seconds

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

  // Μεταφορά σημειώσεων από το AsyncStorage στο Firebase
  const migrateNotesToFirebase = useCallback(async () => {
    try {
      if (!user) return;

      // Φόρτωση σημειώσεων από το AsyncStorage
      const storedNotes = await AsyncStorage.getItem(STORAGE_KEY);
      if (!storedNotes) return;

      const localNotes = JSON.parse(storedNotes);
      if (!Array.isArray(localNotes) || localNotes.length === 0) return;

      // Έλεγχος αν υπάρχουν ήδη σημειώσεις στο Firestore
      const notesCollectionRef = collection(db, 'users', user.uid, 'notes');
      const snapshot = await getDocs(notesCollectionRef);
      if (!snapshot.empty) {
        // Υπάρχουν ήδη σημειώσεις στο Firestore, δεν κάνουμε migration
        return;
      }

      // Μετατροπή σε μορφή για το Firebase
      const notesObject = localNotes.reduce((acc, note) => {
        acc[note.id] = note;
        return acc;
      }, {} as Record<string, Note>);

      // Αποθήκευση στο Firebase
      const batch = writeBatch(db);
      Object.values(notesObject).forEach((note: any) => {
        const noteRef = doc(db, 'users', user.uid, 'notes', note.id);
        batch.set(noteRef, note);
      });
      await batch.commit();

      // Σημειώνουμε ότι έγινε η μεταφορά (προαιρετικά)
      await AsyncStorage.setItem(`@notes_migrated_${user.uid}`, 'true');
      
      console.log('✅ Notes migrated to Firebase successfully');
    } catch (error) {
      console.error('❌ Error migrating notes to Firebase:', error);
    }
  }, [user]);

  // Εκτέλεση της μεταφοράς όταν συνδέεται ο χρήστης
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        migrateNotesToFirebase();
      }
    });

    return () => unsubscribe();
  }, [migrateNotesToFirebase]);

  // Φόρτωση σημειώσεων από το Firebase
  const loadNotes = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // Τοπική φόρτωση
        const localNotes = await AsyncStorage.getItem(STORAGE_KEY);
        if (localNotes) {
          setNotes(JSON.parse(localNotes));
        } else {
          setNotes([]);
        }
        return;
      }

      // Φόρτωση από Firestore
      const notesCollectionRef = collection(db, 'users', user.uid, 'notes');
      const snapshot = await getDocs(notesCollectionRef);
      const notesArray: Note[] = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title ?? '',
          description: d.description ?? '',
          content: d.content ?? '',
          createdAt: d.createdAt ?? new Date().toISOString(),
          updatedAt: d.updatedAt ?? new Date().toISOString(),
          type: d.type ?? 'text',
          isFavorite: d.isFavorite ?? false,
          isHidden: d.isHidden ?? false,
          isDeleted: d.isDeleted ?? false,
          deletedAt: d.deletedAt,
          tasks: d.tasks ?? [],
          color: d.color ?? '',
          tags: d.tags ?? [],
          isSynced: true
        };
      });
      setNotes(notesArray);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notesArray));
    } catch (error) {
      console.error('❌ Error loading notes from Firestore:', error);
      setNotes([]);
    }
  };

  // Φόρτωση σημειώσεων όταν αλλάζει ο χρήστης
  useEffect(() => {
    let unsubscribe: (() => void) = () => {};
    
    const setupNotesListener = async () => {
      try {
        console.log('🔄 Setting up notes listener');
        const user = auth.currentUser;
        
        if (!user) {
          console.log('👤 No user logged in, loading from local storage');
          const localNotes = await AsyncStorage.getItem(STORAGE_KEY);
          if (localNotes) {
            const parsedNotes = JSON.parse(localNotes);
            console.log('📝 Found notes in local storage:', parsedNotes.length);
            setNotes(parsedNotes);
          }
          return;
        }

        console.log('👤 User is logged in, setting up Firebase listener');
        const notesCollectionRef = collection(db, 'users', user.uid, 'notes');
        
        unsubscribe = onSnapshot(notesCollectionRef, async (snapshot) => {
          try {
            if (!snapshot.empty) {
              const notesArray = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                isSynced: true
              })) as Note[];
              setNotes(notesArray);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notesArray));
              setLastSyncTime(Date.now());
              console.log('✅ Notes updated from Firestore and saved locally');
            }
          } catch (error) {
            console.error('❌ Error processing Firestore update:', error);
          }
        });

        console.log('✅ Firebase listener setup completed');
      } catch (error) {
        console.error('❌ Error setting up notes listener:', error);
      }
    };

    setupNotesListener();

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Προσθήκη νέας σημείωσης
  const addNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // Τοπική αποθήκευση αν δεν υπάρχει χρήστης
        const now = new Date().toISOString();
        const newNote: Note = {
          ...noteData,
          id: generateUniqueId(),
          createdAt: now,
          updatedAt: now,
          isSynced: false
        };
        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
        return newNote;
      }

      const now = new Date().toISOString();
      const noteToSave = {
        ...noteData,
        createdAt: now,
        updatedAt: now,
        isSynced: true
      };

      // Αποθήκευση στο Firestore
      const notesCollectionRef = collection(db, 'users', user.uid, 'notes');
      const batch = writeBatch(db);
      const docRef = await addDoc(notesCollectionRef, noteToSave);

      const newNote: Note = {
        ...noteToSave,
        id: docRef.id
      };

      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      return newNote;
    } catch (error) {
      console.error('❌ Error saving note to Firestore:', error);
      throw error;
    }
  };

  // Ενημέρωση σημείωσης
  const updateNote = async (note: Note) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const updatedNote = {
        ...note,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid, 'notes', note.id), updatedNote);

      const updatedNotes = notes.map(n => n.id === note.id ? updatedNote : n);
      setNotes(updatedNotes);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('❌ Error updating note in Firestore:', error);
    }
  };

  // Διαγραφή σημείωσης
  const deleteNote = async (id: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(db, 'users', user.uid, 'notes', id));

      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('❌ Error deleting note in Firestore:', error);
    }
  };

  // Καθαρισμός των σημειώσεων
  const clearStorage = async () => {
    try {
      // Πάντα καθαρίζουμε τα τοπικά δεδομένα
      setNotes([]);
      await AsyncStorage.removeItem(STORAGE_KEY);
      // Δεν διαγράφουμε πλέον τα notes από το Firestore κατά το sign out!
      console.log('✅ Local storage cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
      // Δεν επαναφέρουμε το σφάλμα για να μην διακόπτεται το logout
    }
  };

  
  // Συγχρονισμός όταν η εφαρμογή επανέρχεται στο foreground
  useEffect(() => {
    if (!user) return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        try {
          const notesCollectionRef = collection(db, 'users', user.uid, 'notes');
          const snapshot = await getDocs(notesCollectionRef);

          if (!snapshot.empty) {
            const data = snapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id,
              isSynced: true
            })) as Note[];
            setNotes(data);
            setLastSyncTime(Date.now());
          }
        } catch (error) {
          console.error('Error in app state sync:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  // Optimized save notes function with debounce
  const saveNotes = useCallback(async (updatedNotes: Note[]) => {
    try {
      if (!user) {
        // Αν δεν υπάρχει συνδεδεμένος χρήστης, αποθηκεύουμε στο AsyncStorage
        const notesJson = JSON.stringify(updatedNotes);
        await AsyncStorage.setItem(STORAGE_KEY, notesJson);
        setNotes(updatedNotes);
        setLastFetch(Date.now());
        return;
      }

      // Αποθήκευση στο Firebase
      const notesCollectionRef = collection(db, 'users', user.uid, 'notes');
      const notesObject = updatedNotes.reduce((acc, note) => {
        acc[note.id] = note;
        return acc;
      }, {} as Record<string, Note>);
      
      const batch = writeBatch(db);
      Object.values(notesObject).forEach(note => {
        const noteRef = doc(db, 'users', user.uid, 'notes', note.id);
        batch.set(noteRef, note);
      });
      await batch.commit();
      setNotes(updatedNotes);
      setLastFetch(Date.now());
    } catch (error) {
      console.error('❌ Error saving notes:', error);
      throw error;
    }
  }, [user]);

  // Αυτόματος συγχρονισμός κάθε 30 δευτερόλεπτα
  useEffect(() => {
    if (!user) return;

    const syncInterval = setInterval(async () => {
      try {
        const unsyncedNotes = notes.filter(note => !note.isSynced);
        for (const note of unsyncedNotes) {
          await syncNote(note.id);
        }
        setLastSyncTime(Date.now());
      } catch (error) {
        console.error('Auto sync error:', error);
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(syncInterval);
  }, [user, notes]);

  // Αυτόματος συγχρονισμός όταν η εφαρμογή επανέρχεται στο foreground
  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        try {
          const unsyncedNotes = notes.filter(note => !note.isSynced);
          for (const note of unsyncedNotes) {
            await syncNote(note.id);
          }
          setLastSyncTime(Date.now());
        } catch (error) {
          console.error('Background sync error:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [user, notes]);

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

  const syncNote = async (noteId: string): Promise<void> => {
    try {
      console.log('🔄 Starting sync for note:', noteId);
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ No user logged in, cannot sync');
        throw new Error('No user logged in');
      }

      const note = notes.find(n => n.id === noteId);
      if (!note) {
        console.log('❌ Note not found:', noteId);
        throw new Error('Note not found');
      }

      console.log('📝 Syncing note:', note);
      const noteRef = doc(db, 'users', user.uid, 'notes', noteId);
      await setDoc(noteRef, note);
      console.log('✅ Note synced to Firebase successfully');

      // Ενημερώνουμε το isSynced status
      const updatedNotes = notes.map(n => 
        n.id === noteId ? { ...n, isSynced: true } : n
      );
      setNotes(updatedNotes);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setLastSyncTime(Date.now());
      console.log('✅ Note marked as synced');
    } catch (error) {
      console.error('❌ Error syncing note:', error);
      throw error;
    }
  };

  const clearLocalNotes = async () => {
    setNotes([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
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
    updateTrashRetentionDays,
    syncNote,
    setNotes,
    clearLocalNotes
  }), [notes, isLoading, addNote, updateNote, deleteNote, hideNote, unhideNote, loadNotes, 
       trashRetentionDays, updateTrashRetentionDays, restoreFromTrash, emptyTrash, 
       permanentlyDeleteNote, getTrashNotes, cleanupExpiredTrash, syncNote]);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      loadNotes();
    }
  }, [user]);

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