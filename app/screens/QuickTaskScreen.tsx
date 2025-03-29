import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { useNotes } from '../NotesContext';

interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
}

export default function QuickTaskScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { addNote } = useNotes();

  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState<Task[]>([{ id: '1', text: '', isCompleted: false }]);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now().toString(), text: newTask, isCompleted: false }]);
      setNewTask('');
    }
  };

  const handleChangeTask = (id: string, text: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, text } : task
    ));
  };

  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleSave = async () => {
    try {
      // Filter out empty tasks
      const filteredTasks = tasks.filter(task => task.text.trim());
      
      if (filteredTasks.length === 0 && !title.trim()) {
        // Nothing to save
        navigation.goBack();
        return;
      }
      
      const note = {
        title: title.trim() || t('untitledTask'),
        type: 'checklist' as const,
        tasks: filteredTasks,
        isFavorite: false,
        color: 'none' as const, // Using 'none' instead of null
        isHidden: false,
      };
      
      await addNote(note);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    input: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: theme.textColor,
      fontSize: 16,
    },
    taskContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
    },
    taskInput: {
      flex: 1,
      color: theme.textColor,
      fontSize: 16,
      marginLeft: 10,
    },
    addTaskContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    addTaskInput: {
      flex: 1,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
      padding: 12,
      color: theme.textColor,
      fontSize: 16,
    },
    addTaskButton: {
      backgroundColor: theme.accentColor,
      borderRadius: 8,
      padding: 12,
      marginLeft: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    button: {
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: theme.secondaryBackground,
    },
    saveButton: {
      backgroundColor: theme.accentColor,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    cancelText: {
      color: theme.textColor,
    },
    saveText: {
      color: '#FFFFFF',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('quickTask')}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name="checkmark" size={24} color={theme.accentColor} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder={t('taskTitle')}
            placeholderTextColor={theme.placeholderColor}
            value={title}
            onChangeText={setTitle}
          />
          
          {tasks.map(task => (
            <View key={task.id} style={styles.taskContainer}>
              <Ionicons
                name={task.isCompleted ? "checkbox" : "square-outline"}
                size={24}
                color={theme.accentColor}
                onPress={() => {
                  setTasks(tasks.map(t => 
                    t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t
                  ));
                }}
              />
              <TextInput
                style={styles.taskInput}
                placeholder={t('enterTask')}
                placeholderTextColor={theme.placeholderColor}
                value={task.text}
                onChangeText={(text) => handleChangeTask(task.id, text)}
              />
              <TouchableOpacity onPress={() => handleRemoveTask(task.id)}>
                <Ionicons name="trash-outline" size={24} color={theme.textColor} />
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={styles.addTaskContainer}>
            <TextInput
              style={styles.addTaskInput}
              placeholder={t('enterTask')}
              placeholderTextColor={theme.placeholderColor}
              value={newTask}
              onChangeText={setNewTask}
              onSubmitEditing={handleAddTask}
            />
            <TouchableOpacity style={styles.addTaskButton} onPress={handleAddTask}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveText]}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 