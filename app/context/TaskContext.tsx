import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { AppState } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, writeBatch, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  dueTime?: string;
  location?: string;
  isAllDay: boolean;
  reminder: boolean;
  createdAt: string;
  updatedAt: string;
  color?: string;
  tags?: string[];
  isSynced?: boolean;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customRepeat?: {
    frequency: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };
}

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getTodaysTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  getCompletedTasks: () => Task[];
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  loadTasks: () => Promise<void>;
  clearStorage: () => Promise<void>;
  syncTask: (taskId: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  clearLocalTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const STORAGE_KEY = '@tasks';
const SYNC_INTERVAL = 30000; // 30 seconds

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper function to remove undefined values from object
const removeUndefined = (obj: any): any => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const { user } = useAuth();

  // Μεταφορά tasks από το AsyncStorage στο Firebase
  const migrateTasksToFirebase = useCallback(async () => {
    try {
      if (!user) return;

      // Έλεγχος αν έχει ήδη γίνει η μεταφορά
      const migrationKey = `@tasks_migrated_${user.uid}`;
      const hasMigrated = await AsyncStorage.getItem(migrationKey);
      if (hasMigrated) return;

      // Φόρτωση tasks από το AsyncStorage
      const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (!storedTasks) return;

      const localTasks = JSON.parse(storedTasks);
      if (!Array.isArray(localTasks) || localTasks.length === 0) return;

      // Αποθήκευση στο Firestore για κάθε task ξεχωριστά
      for (const task of localTasks) {
        const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
        await setDoc(taskRef, {
          ...task,
          isSynced: true
        });
      }

      // Σημειώνουμε ότι έγινε η μεταφορά
      await AsyncStorage.setItem(migrationKey, 'true');
      
      console.log('✅ Tasks migrated to Firebase successfully');
    } catch (error) {
      console.error('❌ Error migrating tasks to Firebase:', error);
    }
  }, [user]);

  // Εκτέλεση της μεταφοράς όταν συνδέεται ο χρήστης
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        migrateTasksToFirebase();
      }
    });

    return () => unsubscribe();
  }, [migrateTasksToFirebase]);

  // Φόρτωση tasks από το Firebase/AsyncStorage
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        // Τοπική φόρτωση
        const localTasks = await AsyncStorage.getItem(STORAGE_KEY);
        if (localTasks) {
          setTasks(JSON.parse(localTasks));
        } else {
          setTasks([]);
        }
        return;
      }

      // Φόρτωση από Firestore
      const tasksCollectionRef = collection(db, 'users', user.uid, 'tasks');
      const snapshot = await getDocs(tasksCollectionRef);

      const tasksArray: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      setTasks(tasksArray);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasksArray));
    } catch (error) {
      console.error('❌ Error loading tasks from Firestore:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Φόρτωση tasks όταν αλλάζει ο χρήστης
  useEffect(() => {
    if (!user) {
      setTasks([]);
      AsyncStorage.removeItem(STORAGE_KEY);
      console.log('✅ Tasks cleared from state and AsyncStorage (sign out)');
    } else {
      loadTasks();
    }
  }, [user, loadTasks]);

  // Real-time listener για Firestore updates
  useEffect(() => {
    if (!user) return;

    const tasksCollectionRef = collection(db, 'users', user.uid, 'tasks');
    const unsubscribe = onSnapshot(
      tasksCollectionRef,
      async (snapshot) => {
        try {
          const tasksArray = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isSynced: true
          })) as Task[];
          
          setTasks(tasksArray);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasksArray));
          setLastSyncTime(Date.now());
          console.log('✅ Tasks updated from Firestore');
        } catch (error) {
          console.error('❌ Error processing Firestore update:', error);
        }
      },
      (error) => {
        console.error('❌ Firestore listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Προσθήκη νέου task
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // Τοπική αποθήκευση αν δεν υπάρχει χρήστης
        const now = new Date().toISOString();
        const newTask: Task = {
          ...taskData,
          id: generateUniqueId(),
          createdAt: now,
          updatedAt: now,
          isSynced: false
        };
        const updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
        return newTask;
      }

      const now = new Date().toISOString();
      const taskToSave = removeUndefined({
        ...taskData,
        createdAt: now,
        updatedAt: now,
        isSynced: true
      });

      // Αποθήκευση στο Firestore
      const tasksCollectionRef = collection(db, 'users', user.uid, 'tasks');
      const docRef = await addDoc(tasksCollectionRef, taskToSave);

      const newTask: Task = {
        ...taskToSave,
        id: docRef.id
      };

      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
      return newTask;
    } catch (error) {
      console.error('❌ Error saving task to Firestore:', error);
      throw error;
    }
  }, [tasks]);

  // Ενημέρωση task
  const updateTask = useCallback(async (task: Task) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // Τοπική ενημέρωση
        const updatedTask = {
          ...task,
          updatedAt: new Date().toISOString(),
          isSynced: false
        };
        const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
        setTasks(updatedTasks);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
        return;
      }

      const updatedTask = removeUndefined({
        ...task,
        updatedAt: new Date().toISOString()
      });

      const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
      await setDoc(taskRef, updatedTask);

      const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
      setTasks(updatedTasks);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('❌ Error updating task in Firestore:', error);
      throw error;
    }
  }, [tasks]);

  // Διαγραφή task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // Τοπική διαγραφή
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        setTasks(updatedTasks);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
        return;
      }

      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await deleteDoc(taskRef);

      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('❌ Error deleting task in Firestore:', error);
      throw error;
    }
  }, [tasks]);

  // Toggle completion status
  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      isCompleted: !task.isCompleted,
      updatedAt: new Date().toISOString()
    };

    await updateTask(updatedTask);
  }, [tasks, updateTask]);

  // Καθαρισμός των tasks
  const clearStorage = useCallback(async () => {
    try {
      // Πάντα καθαρίζουμε τα τοπικά δεδομένα
      setTasks([]);
      await AsyncStorage.removeItem(STORAGE_KEY);
      
      // Αν υπάρχει χρήστης, καθαρίζουμε και το Firestore
      if (user) {
        const batch = writeBatch(db);
        const tasksCollectionRef = collection(db, 'users', user.uid, 'tasks');
        
        const snapshot = await getDocs(tasksCollectionRef);
        snapshot.docs.forEach(docSnapshot => {
          const taskRef = doc(db, 'users', user.uid, 'tasks', docSnapshot.id);
          batch.delete(taskRef);
        });
        
        await batch.commit();
      }
      
      console.log('✅ Tasks storage cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing tasks storage:', error);
      // Δεν επαναφέρουμε το σφάλμα για να μην διακόπτεται το logout
    }
  }, [user]);

  // Συγχρονισμός task
  const syncTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      console.log('🔄 Starting sync for task:', taskId);
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ No user logged in, cannot sync');
        throw new Error('No user logged in');
      }

      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.log('❌ Task not found:', taskId);
        throw new Error('Task not found');
      }

      console.log('📝 Syncing task:', task);
      const cleanTask = removeUndefined(task);
      
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await setDoc(taskRef, cleanTask);
      console.log('✅ Task synced to Firestore successfully');

      // Ενημερώνουμε το isSynced status
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, isSynced: true } : t
      );
      setTasks(updatedTasks);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
      setLastSyncTime(Date.now());
      console.log('✅ Task marked as synced');
    } catch (error) {
      console.error('❌ Error syncing task:', error);
      throw error;
    }
  }, [tasks]);

  // Καθαρισμός τοπικών tasks
  const clearLocalTasks = useCallback(async () => {
    setTasks([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  // Αυτόματος συγχρονισμός κάθε 30 δευτερόλεπτα
  useEffect(() => {
    if (!user) return;

    const syncInterval = setInterval(async () => {
      try {
        const unsyncedTasks = tasks.filter(task => !task.isSynced);
        for (const task of unsyncedTasks) {
          await syncTask(task.id);
        }
        setLastSyncTime(Date.now());
      } catch (error) {
        console.error('Auto sync error:', error);
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(syncInterval);
  }, [user, tasks, syncTask]);

  // Αυτόματος συγχρονισμός όταν η εφαρμογή επανέρχεται στο foreground
  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        try {
          const unsyncedTasks = tasks.filter(task => !task.isSynced);
          for (const task of unsyncedTasks) {
            await syncTask(task.id);
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
  }, [user, tasks, syncTask]);

  // Helper functions
  const getTodaysTasks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === today && !task.isCompleted;
    });
  }, [tasks]);

  const getUpcomingTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate > today && !task.isCompleted;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks]);

  const getCompletedTasks = useCallback(() => {
    return tasks.filter(task => task.isCompleted)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tasks]);

  // Memoize context value
  const contextValue = useMemo(() => ({
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    getTodaysTasks,
    getUpcomingTasks,
    getCompletedTasks,
    toggleTaskCompletion,
    loadTasks,
    clearStorage,
    syncTask,
    setTasks,
    clearLocalTasks
  }), [
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    getTodaysTasks,
    getUpcomingTasks,
    getCompletedTasks,
    toggleTaskCompletion,
    loadTasks,
    clearStorage,
    syncTask,
    clearLocalTasks
  ]);

  // Καθαρισμός tasks όταν ο χρήστης αποσυνδέεται
  useEffect(() => {
    if (!user) {
      setTasks([]);
      AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      loadTasks();
    }
  }, [user, loadTasks]);

  return <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
} 