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
  Linking,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTasks } from '../context/TaskContext';
import type { Task } from '../context/TaskContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleTaskNotification, cancelTaskNotification, requestNotificationPermissions } from '../utils/notifications';
import { useTranslation } from 'react-i18next';
import { Translations } from '../i18n/types';
import { formatDate } from '../utils/dateUtils';
import { formatNotificationTime } from '../utils/notifications';
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
  reminderTime: 'none' | '30min' | '1hour' | '1day' | '1week' | 'custom';
  customReminderMinutes?: number;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customRepeat?: {
    frequency: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };
}

export default function QuickTaskScreen({ route }: { route: any }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { addTask, updateTask } = useTasks();
  const navigation = useNavigation<NavigationProp>();
  const existingTask = route.params?.task;
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');

  const [taskDetails, setTaskDetails] = useState<TaskDetails>({
    title: existingTask?.title || '',
    description: existingTask?.description || '',
    dueDate: existingTask?.dueDate ? new Date(existingTask.dueDate) : new Date(),
    dueTime: existingTask?.dueTime ? new Date(existingTask.dueTime) : null,
    location: existingTask?.location || '',
    priority: existingTask?.priority || 'medium',
    isAllDay: existingTask?.isAllDay ?? true,
    reminder: existingTask?.reminder ?? false,
    reminderTime: existingTask?.reminderTime || '1hour',
    repeat: existingTask?.repeat || 'none',
    customRepeat: existingTask?.customRepeat,
  });

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  async function scheduleNotification(taskDetails: TaskDetails) {
    if (!taskDetails.reminder) return;

    try {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          t('notificationPermissionRequired'),
          t('notificationPermissionMessage'),
          [
            { text: t('cancel'), style: 'cancel' },
            { 
              text: t('settings'), 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
        return;
      }

      if (existingTask?.id) {
        await cancelTaskNotification(existingTask.id);
      }

      let taskDate = new Date(taskDetails.dueDate);
      let taskTime = taskDetails.dueTime ? new Date(taskDetails.dueTime) : null;

      if (taskDetails.isAllDay) {
        taskTime = new Date(taskDate);
        taskTime.setHours(9, 0, 0, 0);
      }

      let triggerDate = new Date(taskTime || taskDate);
      
      console.log('Έναρξη προγραμματισμού ειδοποίησης...');
      console.log('Τίτλος:', taskDetails.title);
      console.log('Αρχική ημερομηνία:', taskTime?.toLocaleString() || taskDate.toLocaleString());

      switch (taskDetails.reminderTime) {
        case '30min':
          triggerDate.setMinutes(triggerDate.getMinutes() - 30);
          break;
        case '1hour':
          triggerDate.setHours(triggerDate.getHours() - 1);
          break;
        case '1day':
          triggerDate.setDate(triggerDate.getDate() - 1);
          break;
        case '1week':
          triggerDate.setDate(triggerDate.getDate() - 7);
          break;
      }

      console.log('Χρόνος ειδοποίησης:', taskDetails.reminderTime);
      console.log('Ημερομηνία ειδοποίησης:', triggerDate.toLocaleString());

      const now = new Date();
      console.log('Τρέχουσα ημερομηνία:', now.toLocaleString());
      
      const timeDiff = triggerDate.getTime() - now.getTime();
      console.log('Διαφορά χρόνου (ms):', timeDiff);
      console.log('Διαφορά χρόνου (ώρες):', timeDiff / (1000 * 60 * 60));
      
      if (timeDiff <= 0) {
        console.log('Η ειδοποίηση έχει ήδη περάσει. Διαφορά χρόνου:', timeDiff, 'ms');
        Alert.alert(
          t('notificationTimePassed'),
          t('notificationTimePassedMessage')
        );
        return;
      }

      console.log('Διαφορά χρόνου μέχρι την ειδοποίηση:', Math.floor(timeDiff / 1000), 'δευτερόλεπτα');

      const success = await scheduleTaskNotification(
        taskDetails.title,
        taskDetails.description || t('taskReminder'),
        triggerDate,
        existingTask?.id || Date.now().toString(),
        taskDetails.location,
        taskDetails.isAllDay,
        taskTime || undefined
      );

      if (success) {
        Alert.alert(
          t('notificationScheduled'),
          t('notificationScheduledMessage').replace('{{time}}', formatNotificationTime(triggerDate))
        );
      } else {
        throw new Error('Failed to schedule notification');
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert(
        t('notificationError'),
        t('notificationErrorMessage')
      );
    }
  }

  const handleSave = async () => {
    if (!taskDetails.title.trim()) return;

    try {
      // Create task data object, filtering out undefined values
      const baseTaskData = {
        title: taskDetails.title,
        description: taskDetails.description || '',
        isCompleted: existingTask?.isCompleted || false,
        priority: taskDetails.priority,
        dueDate: taskDetails.dueDate.toISOString(),
        location: taskDetails.location || '',
        isAllDay: taskDetails.isAllDay,
        reminder: taskDetails.reminder,
        repeat: taskDetails.repeat,
        tags: existingTask?.tags || [],
        isSynced: false
      };

      // Only add optional fields if they have values
      const taskData: any = { ...baseTaskData };
      
      if (taskDetails.dueTime) {
        taskData.dueTime = taskDetails.dueTime.toISOString();
      }
      
      if (taskDetails.customRepeat) {
        taskData.customRepeat = taskDetails.customRepeat;
      }
      
      if (existingTask?.color) {
        taskData.color = existingTask.color;
      }

      if (existingTask) {
        await updateTask({ ...existingTask, ...taskData });
      } else {
        await addTask(taskData);
      }

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

  const CustomTimeModal = () => (
    <Modal
      visible={showCustomTimeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCustomTimeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.repeatModalContent, { width: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('enterTime')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCustomTimeModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.optionText, { marginBottom: 16 }]}>
            {t('enterTimeDescription')}
          </Text>

          <TextInput
            style={[styles.titleInput, { marginBottom: 20 }]}
            placeholder="1:30"
            placeholderTextColor={theme.placeholderColor}
            value={customTimeInput}
            onChangeText={setCustomTimeInput}
            keyboardType="numeric"
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowCustomTimeModal(false)}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (!customTimeInput) return;
                
                const [hours, minutes] = customTimeInput.split(':').map(Number);
                
                if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0 || minutes > 59) {
                  Alert.alert(t('invalidTime'), t('invalidTimeMessage'));
                  return;
                }

                const totalMinutes = (hours * 60) + minutes;
                
                setTaskDetails(prev => ({
                  ...prev,
                  reminderTime: 'custom',
                  customReminderMinutes: totalMinutes
                }));
                
                setShowCustomTimeModal(false);
                setShowReminderModal(false);
              }}
            >
              <Text style={styles.saveButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ReminderModal = () => (
    <Modal
      visible={showReminderModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReminderModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.repeatModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('reminderTime')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowReminderModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.repeatOptionsList}>
            {[
              { value: '30min', label: t('reminder30min') },
              { value: '1hour', label: t('reminder1hour') },
              { value: '1day', label: t('reminder1day') },
              { value: '1week', label: t('reminder1week') }
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.repeatOptionRow,
                  taskDetails.reminderTime === option.value && styles.repeatOptionRowSelected
                ]}
                onPress={() => {
                  setTaskDetails(prev => ({ ...prev, reminderTime: option.value as TaskDetails['reminderTime'] }));
                  setShowReminderModal(false);
                }}
              >
                <Text style={[
                  styles.repeatOptionText,
                  taskDetails.reminderTime === option.value && styles.repeatOptionTextSelected
                ]}>
                  {option.label}
                </Text>
                {taskDetails.reminderTime === option.value && (
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
        <Text style={styles.headerTitle}>{existingTask ? t('edit') : t('newTask')}</Text>
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

          {taskDetails.reminder && (
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setShowReminderModal(true)}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="time-outline" size={20} color={theme.accentColor} />
              </View>
              <Text style={styles.optionText}>{t('reminderTime')}</Text>
              <Text style={styles.optionValue}>
                {taskDetails.reminderTime === '30min' ? t('reminder30min') :
                 taskDetails.reminderTime === '1hour' ? t('reminder1hour') :
                 taskDetails.reminderTime === '1day' ? t('reminder1day') :
                 taskDetails.reminderTime === '1week' ? t('reminder1week') :
                 t('reminder1hour')}
              </Text>
            </TouchableOpacity>
          )}
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
      <ReminderModal />
      <CustomTimeModal />
    </KeyboardAvoidingView>
  );
} 