import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotes } from '../NotesContext';
import type { Note } from '../NotesContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleTaskNotification, cancelTaskNotification, requestNotificationPermissions } from '../utils/notifications';
import { useTranslation } from 'react-i18next';
import { Translations } from '../i18n/types';
import { formatDate } from '../utils/dateUtils';
import { Priority, RepeatOption, RepeatUnit } from '../types';

type RootStackParamList = {
  Calendar: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TaskDetails {
  title: string;
  description: string;
  dueDate: Date;
  dueTime: Date | null;
  location: string;
  priority: Priority;
  isAllDay: boolean;
  reminder: boolean;
  repeat: RepeatOption;
  customRepeat?: {
    frequency: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };
}

export default function QuickTaskScreen({ route }: { route: any }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { addNote, updateNote } = useNotes();
  const navigation = useNavigation<NavigationProp>();
  const existingNote = route.params?.note;
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);

  const [taskDetails, setTaskDetails] = useState<TaskDetails>({
    title: existingNote?.title || '',
    description: existingNote?.description || '',
    dueDate: existingNote?.tasks?.[0]?.dueDate ? new Date(existingNote.tasks[0].dueDate) : new Date(),
    dueTime: existingNote?.tasks?.[0]?.dueTime ? new Date(existingNote.tasks[0].dueTime) : null,
    location: existingNote?.tasks?.[0]?.location || '',
    priority: existingNote?.tasks?.[0]?.priority || 'medium',
    isAllDay: existingNote?.tasks?.[0]?.isAllDay ?? true,
    reminder: existingNote?.tasks?.[0]?.reminder ?? false,
    repeat: existingNote?.tasks?.[0]?.repeat || 'none',
    customRepeat: existingNote?.tasks?.[0]?.customRepeat,
  });

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  async function scheduleNotification(taskDetails: TaskDetails) {
    if (!taskDetails.reminder) return;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Cancel any existing notifications for this task
    if (existingNote?.id) {
      await cancelTaskNotification(existingNote.id);
    }

    const triggerDate = taskDetails.isAllDay 
      ? new Date(taskDetails.dueDate.setHours(9, 0, 0)) // 9 AM on due date
      : taskDetails.dueTime || taskDetails.dueDate;

    await scheduleTaskNotification(
      taskDetails.title,
      taskDetails.description || 'Task reminder',
      triggerDate,
      existingNote?.id?.toString() || Date.now().toString()
    );
  }

  const handleSave = async () => {
    if (!taskDetails.title.trim()) return;

    try {
      const taskData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
        title: taskDetails.title,
        type: 'checklist',
        content: '',
        description: taskDetails.description,
        isFavorite: existingNote?.isFavorite || false,
        isHidden: existingNote?.isHidden || false,
        tasks: [{
          text: taskDetails.title,
          isCompleted: existingNote?.tasks?.[0]?.isCompleted || false,
          priority: taskDetails.priority,
          dueDate: taskDetails.dueDate.toISOString(),
          dueTime: taskDetails.dueTime?.toISOString(),
          location: taskDetails.location,
          isAllDay: taskDetails.isAllDay,
          reminder: taskDetails.reminder,
          repeat: taskDetails.repeat,
          customRepeat: taskDetails.customRepeat,
        }]
      };

      if (existingNote) {
        await updateNote({ ...existingNote, ...taskData });
      } else {
        await addNote(taskData);
      }

      // Schedule notification if reminder is enabled
      await scheduleNotification(taskDetails);
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return '#FF4E4E';
      case 'medium': return '#FFA726';
      case 'low': return '#66BB6A';
      default: return theme.textColor;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTaskDetails(prev => ({
        ...prev,
        dueDate: selectedDate
      }));
    }
  };

  const RepeatModal = () => (
    <Modal
      visible={showRepeatModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRepeatModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.repeatModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('repeat')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRepeatModal(false)}
              accessibilityRole="button"
              accessibilityLabel={t('close')}
            >
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.repeatOptionsList}>
            {(['none', 'daily', 'weekly', 'monthly', 'yearly'] as RepeatOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.repeatOptionRow, taskDetails.repeat === option && styles.repeatOptionRowSelected]}
                onPress={() => {
                  setTaskDetails(prev => ({ ...prev, repeat: option }));
                  setShowRepeatModal(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={t(option as keyof Translations)}
              >
                <Text style={[styles.repeatOptionText, taskDetails.repeat === option && styles.repeatOptionTextSelected]}>
                  {t(option as keyof Translations)}
                </Text>
                {taskDetails.repeat === option && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.accentColor} style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      backgroundColor: theme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textColor,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accentColor,
      shadowColor: theme.accentColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.isDarkMode ? '#000' : theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    titleInput: {
      fontSize: 18,
      color: theme.textColor,
      padding: 0,
      fontWeight: '500',
    },
    descriptionInput: {
      fontSize: 16,
      color: theme.textColor,
      padding: 0,
      marginTop: 8,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    optionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.accentColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: theme.textColor,
      fontWeight: '500',
    },
    optionValue: {
      fontSize: 14,
      color: theme.placeholderColor,
      marginLeft: 8,
    },
    priorityContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 8,
    },
    priorityButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
    },
    priorityText: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    repeatModalContent: {
      width: '90%',
      backgroundColor: theme.isDarkMode ? 'rgba(30, 30, 30, 1)' : theme.backgroundColor,
      borderRadius: 24,
      padding: 24,
      shadowColor: theme.isDarkMode ? '#000' : theme.accentColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
    },
    repeatOptionsList: {
      marginTop: 8,
    },
    repeatOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: 'transparent',
    },
    repeatOptionRowSelected: {
      backgroundColor: `${theme.accentColor}22`,
    },
    repeatOptionText: {
      fontSize: 16,
      color: theme.textColor,
    },
    repeatOptionTextSelected: {
      color: theme.accentColor,
      fontWeight: '700',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    switchLabel: {
      fontSize: 16,
      color: theme.textColor,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginHorizontal: 0,
      backgroundColor: theme.accentColor,
      elevation: 4,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    cancelButton: {
      backgroundColor: theme.secondaryBackground,
      marginRight: 8,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('newTask')}</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={!taskDetails.title.trim()}
        >
          <Ionicons 
            name="checkmark" 
            size={24} 
            color={taskDetails.title.trim() ? '#FFFFFF' : theme.placeholderColor} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <TextInput
            style={styles.titleInput}
            placeholder={t('enterTitle')}
            placeholderTextColor={theme.placeholderColor}
            value={taskDetails.title}
            onChangeText={(text) => setTaskDetails(prev => ({ ...prev, title: text }))}
          />
          <TextInput
            style={styles.descriptionInput}
            placeholder={t('enterDescription')}
            placeholderTextColor={theme.placeholderColor}
            value={taskDetails.description}
            onChangeText={(text) => setTaskDetails(prev => ({ ...prev, description: text }))}
            multiline
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="calendar-outline" size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.optionText}>{t('dueDate')}</Text>
            <Text style={styles.optionValue}>
              {formatDate(taskDetails.dueDate)}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={taskDetails.dueDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.optionRow}>
            <View style={styles.optionIcon}>
              <Ionicons name="time-outline" size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.optionText}>{t('allDay')}</Text>
            <Switch
              value={taskDetails.isAllDay}
              onValueChange={(value) => {
                setTaskDetails(prev => ({ 
                  ...prev, 
                  isAllDay: value,
                  dueTime: value ? null : prev.dueTime || new Date()
                }));
              }}
              trackColor={{ false: theme.borderColor, true: theme.accentColor }}
              thumbColor={theme.backgroundColor}
            />
          </View>

          {!taskDetails.isAllDay && (
            <TouchableOpacity 
              style={styles.optionRow}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="alarm-outline" size={20} color={theme.accentColor} />
              </View>
              <Text style={styles.optionText}>{t('dueTime')}</Text>
              <Text style={styles.optionValue}>
                {taskDetails.dueTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowRepeatModal(true)}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="repeat-outline" size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.optionText}>{t('repeat')}</Text>
            <Text style={styles.optionValue}>
              {taskDetails.repeat === 'custom' 
                ? `${taskDetails.customRepeat?.frequency} ${t(taskDetails.customRepeat?.unit as keyof Translations)}`
                : t(taskDetails.repeat as keyof Translations)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionIcon}>
              <Ionicons name="location-outline" size={20} color={theme.accentColor} />
            </View>
            <TextInput
              style={[styles.optionText, { height: 40 }]}
              value={taskDetails.location}
              onChangeText={(text) => setTaskDetails(prev => ({ ...prev, location: text }))}
              placeholder={t('addLocation')}
              placeholderTextColor={theme.placeholderColor}
            />
          </TouchableOpacity>

          <View style={styles.optionRow}>
            <View style={styles.optionIcon}>
              <Ionicons name="notifications-outline" size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.optionText}>{t('reminder')}</Text>
            <Switch
              value={taskDetails.reminder}
              onValueChange={(value) => setTaskDetails(prev => ({ ...prev, reminder: value }))}
              trackColor={{ false: theme.borderColor, true: theme.accentColor }}
              thumbColor={theme.backgroundColor}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.optionText, { marginBottom: 12 }]}>{t('priority')}</Text>
          <View style={styles.priorityContainer}>
            {(['low', 'medium', 'high'] as Priority[]).map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityButton,
                  { 
                    borderColor: getPriorityColor(priority),
                    backgroundColor: taskDetails.priority === priority 
                      ? `${getPriorityColor(priority)}20`
                      : 'transparent'
                  }
                ]}
                onPress={() => setTaskDetails(prev => ({ ...prev, priority }))}
              >
                <Text style={[
                  styles.priorityText,
                  { color: getPriorityColor(priority) }
                ]}>
                  {t(priority as keyof Translations)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {showTimePicker && (
        <DateTimePicker
          value={taskDetails.dueTime || new Date()}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setTaskDetails(prev => ({ ...prev, dueTime: selectedTime }));
            }
          }}
        />
      )}
      <RepeatModal />
    </KeyboardAvoidingView>
  );
} 