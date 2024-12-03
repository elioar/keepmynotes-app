import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useNotes } from './NotesContext';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';

interface RouteParams {
  note?: {
    id?: string;
    title?: string;
    description?: string;
    type?: 'text' | 'task';
    tasks?: Array<{
      text: string;
      isCompleted: boolean;
    }>;
    createdAt?: string;
  };
}

interface Task {
  text: string;
  isCompleted: boolean;
}

export default function AddEditNoteScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { addNote, updateNote } = useNotes();
  const note = (route.params as RouteParams)?.note;
  const { t } = useLanguage();

  const [title, setTitle] = useState(note?.title || '');
  const [description, setDescription] = useState(note?.description || '');
  const [tasks, setTasks] = useState<Task[]>(note?.tasks || []);
  const [newTask, setNewTask] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.textColor,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    titleInput: {
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 16,
      color: theme.textColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      paddingBottom: 8,
    },
    descriptionInput: {
      fontSize: 16,
      color: theme.textColor,
      textAlignVertical: 'top',
    },
    taskContainer: {
      marginTop: 20,
    },
    taskInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
    },
    taskInput: {
      flex: 1,
      height: 40,
      color: theme.textColor,
    },
    addTaskButton: {
      padding: 8,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    taskCheckbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: theme.textColor,
      borderRadius: 4,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    taskChecked: {
      backgroundColor: theme.accentColor,
      borderColor: theme.accentColor,
    },
    taskText: {
      flex: 1,
      fontSize: 16,
      color: theme.textColor,
    },
    taskTextChecked: {
      textDecorationLine: 'line-through',
      color: theme.placeholderColor,
    },
    deleteTaskButton: {
      padding: 8,
    },
    saveButton: {
      backgroundColor: theme.accentColor,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    placeholderText: {
      color: theme.placeholderColor,
    },
  });

  const handleSave = async () => {
    const noteData = {
      id: note?.id || Date.now().toString(),
      title,
      description,
      type: note?.type || 'text',
      tasks: note?.type === 'task' ? tasks : undefined,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (note?.id) {
      await updateNote(noteData);
    } else {
      await addNote(noteData);
    }
    navigation.goBack();
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { text: newTask.trim(), isCompleted: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].isCompleted = !newTasks[index].isCompleted;
    setTasks(newTasks);
  };

  const deleteTask = (index: number) => {
    const newTasks = tasks.filter((_: Task, i: number) => i !== index);
    setTasks(newTasks);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {note?.id ? t('editNote') : t('newNote')}
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.titleInput}
          placeholder={t('title')}
          placeholderTextColor={theme.placeholderColor}
          value={title}
          onChangeText={setTitle}
        />

        {note?.type !== 'task' ? (
          <TextInput
            style={styles.descriptionInput}
            placeholder={t('writeHere')}
            placeholderTextColor={theme.placeholderColor}
            multiline
            value={description}
            onChangeText={setDescription}
          />
        ) : (
          <View style={styles.taskContainer}>
            <View style={styles.taskInputContainer}>
              <TextInput
                style={styles.taskInput}
                placeholder={t('addTask')}
                placeholderTextColor={theme.placeholderColor}
                value={newTask}
                onChangeText={setNewTask}
                onSubmitEditing={addTask}
              />
              <TouchableOpacity style={styles.addTaskButton} onPress={addTask}>
                <Ionicons name="add-circle" size={24} color={theme.accentColor} />
              </TouchableOpacity>
            </View>

            {tasks.map((task: Task, index: number) => (
              <View key={index} style={styles.taskItem}>
                <TouchableOpacity
                  style={[styles.taskCheckbox, task.isCompleted && styles.taskChecked]}
                  onPress={() => toggleTask(index)}
                >
                  {task.isCompleted && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <Text style={[
                  styles.taskText,
                  task.isCompleted && styles.taskTextChecked
                ]}>
                  {task.text}
                </Text>
                <TouchableOpacity
                  style={styles.deleteTaskButton}
                  onPress={() => deleteTask(index)}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.placeholderColor} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 