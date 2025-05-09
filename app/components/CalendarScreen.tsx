import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotes, TaskItem, Note } from '../NotesContext';
import NavigationMenu from './NavigationMenu';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TAG_COLORS, TagColor } from '../constants/tags';
import type { MarkedDates } from 'react-native-calendars/src/types';
import AddNoteModal from './AddNoteModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing utilities
const wp = (percentage: number) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

const hp = (percentage: number) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

const normalize = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(newSize);
};

type RootStackParamList = {
  Home: undefined;
  Task: { note?: any };
  Calendar: undefined;
  QuickTask: { note?: any };
  AddEditNote: { note?: any };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function getRepeatingDates(note: any, startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const task = note.tasks[0];
  
  if (!task.repeat || task.repeat === 'none') {
    return dates;
  }

  const originalDate = new Date(task.dueDate);
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (task.repeat === 'weekly') {
      // Check if the current date is the same day of the week as the original date
      if (currentDate.getDay() === originalDate.getDay()) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }
    } else if (task.repeat === 'daily') {
      dates.push(currentDate.toISOString().split('T')[0]);
    } else if (task.repeat === 'monthly') {
      if (currentDate.getDate() === originalDate.getDate()) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }
    } else if (task.repeat === 'yearly') {
      if (currentDate.getDate() === originalDate.getDate() && 
          currentDate.getMonth() === originalDate.getMonth()) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }
    } else if (task.repeat === 'custom' && task.customRepeat) {
      const { frequency, unit } = task.customRepeat;
      const diffTime = Math.abs(currentDate.getTime() - originalDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (unit === 'days' && diffDays % frequency === 0) {
        dates.push(currentDate.toISOString().split('T')[0]);
      } else if (unit === 'weeks' && diffDays % (frequency * 7) === 0) {
        dates.push(currentDate.toISOString().split('T')[0]);
      } else if (unit === 'months' && 
                 currentDate.getDate() === originalDate.getDate() && 
                 diffDays % (frequency * 30) === 0) {
        dates.push(currentDate.toISOString().split('T')[0]);
      } else if (unit === 'years' && 
                 currentDate.getDate() === originalDate.getDate() && 
                 currentDate.getMonth() === originalDate.getMonth() && 
                 diffDays % (frequency * 365) === 0) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

function getMarkedDates(notes: Note[]): MarkedDates {
  const { theme } = useTheme();
  const marked: MarkedDates = {};
  
  notes.forEach(note => {
    if (note.type === 'task' && note.tasks && note.tasks.length > 0) {
      const task = note.tasks[0];
      if (task.dueDate) {
        // Add the original date
        marked[task.dueDate] = {
          ...marked[task.dueDate],
          dots: [
            ...(marked[task.dueDate]?.dots || []),
            {
              color: note.color || theme.accentColor,
              key: note.id,
            },
          ],
        };

        // Add repeating dates
        if (task.repeat && task.repeat !== 'none') {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 3); // Show next 3 months of repeating tasks
          
          const repeatingDates = getRepeatingDates(note, startDate, endDate);
          
          repeatingDates.forEach(date => {
            if (date !== task.dueDate) { // Don't duplicate the original date
              marked[date] = {
                ...marked[date],
                dots: [
                  ...(marked[date]?.dots || []),
                  {
                    color: note.color || theme.accentColor,
                    key: note.id,
                  },
                ],
              };
            }
          });
        }
      }
    }
  });
  
  return marked;
}

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { notes, updateNote } = useNotes();
  const navigation = useNavigation<NavigationProp>();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState<any[]>([]);
  const [showMonthView, setShowMonthView] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<string[]>([]);
  const monthViewAnim = useRef(new Animated.Value(0)).current;
  
  // Get current week dates
  const getCurrentWeekDates = (date: Date = new Date()) => {
    const curr = new Date(date);
    const week = [];
    
    // Starting from Sunday
    curr.setDate(curr.getDate() - curr.getDay());
    
    for (let i = 0; i < 7; i++) {
      week.push(new Date(curr).toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    
    return week;
  };

  // Initialize current week
  useEffect(() => {
    setCurrentWeek(getCurrentWeekDates(new Date(selectedDate)));
  }, [selectedDate]);

  // Get marked dates for calendar
  const getMarkedDates = () => {
    const markedDates: any = {};
    const startDate = new Date(currentWeek[0]);
    const endDate = new Date(currentWeek[6]);
    endDate.setHours(23, 59, 59, 999);

    notes.forEach(note => {
      if (note.type === 'checklist' && note.tasks?.[0]?.dueDate && !note.isDeleted) {
        const repeatingDates = getRepeatingDates(note, startDate, endDate);
        
        // Add the original date if it's not already included
        const originalDate = new Date(note.tasks[0].dueDate).toISOString().split('T')[0];
        if (!repeatingDates.includes(originalDate)) {
          repeatingDates.push(originalDate);
        }

        repeatingDates.forEach(date => {
          if (!markedDates[date]) {
            markedDates[date] = {
              dots: [{
                key: note.color || 'default',
                color: note.color ? TAG_COLORS[note.color as TagColor] : theme.accentColor,
                selectedDotColor: '#FFFFFF'
              }]
            };
          } else {
            markedDates[date].dots.push({
              key: note.color || 'default',
              color: note.color ? TAG_COLORS[note.color as TagColor] : theme.accentColor,
              selectedDotColor: '#FFFFFF'
            });
          }
        });
      }
    });
    
    if (selectedDate) {
      markedDates[selectedDate] = {
        ...markedDates[selectedDate],
        selected: true,
        selectedColor: theme.accentColor,
        dots: markedDates[selectedDate]?.dots || []
      };
    }
    
    return markedDates;
  };

  // Update tasks for selected date
  useEffect(() => {
    if (selectedDate) {
      const filteredTasks = notes.filter(note => {
        if (note.type === 'checklist' && note.tasks?.[0]?.dueDate && !note.isDeleted) {
          const taskDate = new Date(note.tasks[0].dueDate).toISOString().split('T')[0];
          
          // Check if the task is repeating and if the selected date matches the pattern
          if (note.tasks[0].repeat && note.tasks[0].repeat !== 'none') {
            const repeatingDates = getRepeatingDates(
              note,
              new Date(selectedDate),
              new Date(selectedDate)
            );
            return repeatingDates.includes(selectedDate);
          }
          
          return taskDate === selectedDate;
        }
        return false;
      });
      setTasksForSelectedDate(filteredTasks);
    }
  }, [selectedDate, notes]);

  const handlePrevWeek = () => {
    const firstDay = new Date(currentWeek[0]);
    firstDay.setDate(firstDay.getDate() - 7);
    setCurrentWeek(getCurrentWeekDates(firstDay));
  };

  const handleNextWeek = () => {
    const lastDay = new Date(currentWeek[6]);
    lastDay.setDate(lastDay.getDate() + 1);
    setCurrentWeek(getCurrentWeekDates(lastDay));
  };

  const formatDayLabel = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3);
  };

  const getCategoryName = (color: TagColor | undefined | null) => {
    if (!color) return '';
    switch (color) {
      case 'green': return 'Personal';
      case 'purple': return 'Work';
      case 'blue': return 'Study';
      case 'orange': return 'Ideas';
      case 'red': return 'Important';
      default: return '';
    }
  };


  const emptyStateStyles = {
    noTasksContainer: {
      alignItems: 'center' as 'center',
      paddingVertical: hp(6),
      marginTop: hp(4),
    },
    emptyIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: `${theme.accentColor}12`,
      justifyContent: 'center' as const,
      alignItems: 'center' as 'center',
      marginBottom: 20,
      shadowColor: theme.accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    noTasksText: {
      fontSize: normalize(16),
      color: theme.isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.5)',
      textAlign: 'center' as const,
      maxWidth: wp(70),
      lineHeight: normalize(24),
      letterSpacing: 0.2,
      fontWeight: '500' as const,
    },
    addTaskButton: {
      flexDirection: 'row' as 'row',
      alignItems: 'center' as 'center',
      backgroundColor: theme.accentColor,
      paddingVertical: hp(1),
      paddingHorizontal: wp(4),
      borderRadius: wp(6),
      marginTop: hp(3),
      shadowColor: theme.accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    addTaskButtonText: {
      color: '#FFFFFF',
      fontSize: normalize(14),
      fontWeight: '600' as '600',
      marginLeft: wp(2),
    }
  };
  
  // Enhanced empty state component
  const EmptyState = () => (
    <View style={emptyStateStyles.noTasksContainer}>
      <View style={emptyStateStyles.emptyIcon}>
        <Ionicons 
          name="calendar-outline" 
          size={32} 
          color={theme.accentColor} 
        />
      </View>
      <Text style={emptyStateStyles.noTasksText}>
        {t('noTasksForDate')}
      </Text>
      <TouchableOpacity 
        style={emptyStateStyles.addTaskButton}
        onPress={() => navigation.navigate('QuickTask', { note: undefined })}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
        <Text style={emptyStateStyles.addTaskButtonText}>Add Task</Text>
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    weekContainer: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 20,
      margin: 10,
      marginTop: Platform.OS === 'ios' ? 60 : 20,
      padding: 16,
      shadowColor: theme.isDarkMode ? '#000' : theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    weekNavContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    monthTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
    },
    weekNavButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    expandButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    weekDays: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    dayContainer: {
      alignItems: 'center',
      width: 40,
      height: 80,
    },
    dayLabel: {
      fontSize: 13,
      color: theme.placeholderColor,
      marginBottom: 8,
      fontWeight: '500',
    },
    dayButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    dayButtonSelected: {
      backgroundColor: theme.accentColor,
    },
    dayNumber: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textColor,
    },
    dayNumberSelected: {
      color: '#FFFFFF',
    },
    dotContainer: {
      height: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.accentColor,
    },
    tasksContainer: {
      flex: 1,
      paddingHorizontal: 15,
      paddingTop: 20,
    },
    dateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    dateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
    },
    addButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    tasksList: {
      paddingBottom: 100,
    },
    noteItem: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.isDarkMode ? '#000' : theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    noteContent: {
      flex: 1,
      marginRight: 12,
    },
    noteTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    noteDescription: {
      fontSize: 14,
      color: theme.placeholderColor,
      marginBottom: 8,
      lineHeight: 20,
    },
    noteFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    noteTime: {
      fontSize: 12,
      color: theme.placeholderColor,
      flex: 1,
    },
    tagContainer: {
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.accentColor + '15',
    },
    tagText: {
      fontSize: 12,
      color: theme.accentColor,
      fontWeight: '600',
    },
    noTasksContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    noTasksText: {
      fontSize: 16,
      color: theme.placeholderColor,
      textAlign: 'center',
      maxWidth: '80%',
      lineHeight: 24,
    },
    emptyIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: `${theme.accentColor}12`,
      justifyContent: 'center' as const,
      alignItems: 'center' as 'center',
      marginBottom: 20,
      shadowColor: theme.accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.isDarkMode ? 'rgba(20, 20, 20, 0.75)' : 'rgba(240, 240, 240, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.isDarkMode ? 'rgba(30, 30, 30, 0.95)' : theme.backgroundColor,
      borderRadius: 24,
      padding: 12,
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
      shadowColor: theme.isDarkMode ? '#000' : theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: theme.isDarkMode ? 0.5 : 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textColor,
      letterSpacing: -0.5,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    taskCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: wp(4),
      padding: wp(4),
      marginBottom: hp(2),
      minHeight: hp(15),
      flexDirection: 'column',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      overflow: 'hidden',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.isDarkMode ? 
        `${theme.backgroundColor}80` : 
        theme.secondaryBackground,
    },
    optionText: {
      color: theme.textColor,
      fontSize: 16,
      marginLeft: 12,
      fontWeight: '500',
    },
    modernTaskCard: {
      backgroundColor: theme.isDarkMode
        ? 'rgba(30, 32, 40, 0.92)'
        : 'rgba(255, 255, 255, 0.98)',
      borderRadius: wp(6),
      padding: wp(4.5),
      marginVertical: hp(1.2),
      flexDirection: 'column',
      shadowColor: theme.isDarkMode ? '#000' : theme.accentColor,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: theme.isDarkMode ? 0.3 : 0.15,
      shadowRadius: 8,
      elevation: 5,
      borderLeftWidth: 4,
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderTopColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.03)',
      borderBottomColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.03)',
    },
    taskTypeIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(0.4),
      paddingHorizontal: wp(2),
      backgroundColor: theme.isDarkMode 
        ? 'rgba(255, 255, 255, 0.09)' 
        : 'rgba(0, 0, 0, 0.04)',
      borderRadius: wp(4),
      alignSelf: 'flex-start',
      marginBottom: hp(1.2),
      borderWidth: 0.5,
      borderColor: theme.isDarkMode 
        ? 'rgba(255, 255, 255, 0.12)' 
        : 'rgba(0, 0, 0, 0.05)',
    },
    taskTypeText: {
      fontSize: normalize(11),
      fontWeight: '600',
      color: theme.accentColor,
      marginLeft: wp(1.2),
      letterSpacing: 0.3,
    },
    taskTitle: {
      fontSize: normalize(16),
      fontWeight: '700',
      color: theme.isDarkMode ? '#ffffff' : '#222222',
      flex: 1,
      marginBottom: hp(0.8),
      letterSpacing: -0.2,
      lineHeight: normalize(21),
      maxWidth: wp(55),
    },
    taskDescription: {
      fontSize: normalize(13),
      color: theme.isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(40, 40, 50, 0.8)',
      marginVertical: hp(0.8),
      lineHeight: normalize(18),
      fontWeight: '400',
      maxHeight: hp(4),
      overflow: 'hidden',
    },
    taskMetadata: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: wp(2),
      marginTop: hp(2),
    },
    taskMetadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(0.5),
      paddingHorizontal: wp(3),
      backgroundColor: theme.isDarkMode
        ? 'rgba(255, 255, 255, 0.07)'
        : 'rgba(0, 0, 0, 0.035)',
      borderRadius: wp(3),
      borderWidth: 0.5,
      borderColor: theme.isDarkMode 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.03)',
      width: wp(25),
      height: hp(3.2),
    },
    taskMetadataText: {
      color: theme.isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
      fontSize: normalize(11),
      fontWeight: '500',
      marginLeft: wp(1),
    },
    taskCompletionStatus: {
      position: 'absolute',
      top: wp(4),
      right: wp(4),
      width: wp(7),
      height: wp(7),
      borderRadius: wp(3.5),
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    taskInfoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(0.5),
    },
    taskPriority: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(2.2),
      paddingVertical: hp(0.5),
      borderRadius: wp(3.5),
      gap: wp(1),
      marginLeft: wp(2),
      borderWidth: 0.5,
    },
    taskPriorityText: {
      fontSize: normalize(12),
      fontWeight: '500',
      color: theme.isDarkMode ? '#ffffff' : '#222222',
    },
  });

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  };

  const handleOptionSelect = (type: string) => {
    setShowAddMenu(false);
    
    switch (type) {
      case 'note':
        navigation.navigate('AddEditNote', { note: { type: 'text', isNew: true } });
        break;
      case 'task':
        navigation.navigate('QuickTask', { note: undefined });
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={theme.backgroundColor}
        barStyle={theme.isDarkMode ? "light-content" : "dark-content"}
      />
      
      <ScrollView>
        <View style={styles.weekContainer}>
          <View style={styles.weekHeader}>
            <View style={styles.weekNavContainer}>
              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={handlePrevWeek}
              >
                <Ionicons name="chevron-back" size={20} color={theme.textColor} />
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {new Date(currentWeek[0]).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>

              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={handleNextWeek}
              >
                <Ionicons name="chevron-forward" size={20} color={theme.textColor} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setShowMonthView(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {currentWeek.map((date) => {
              const isSelected = date === selectedDate;
              const hasTasks = notes.some(note => {
                if (note.isDeleted) return false; // Skip deleted notes
                if (note.type === 'checklist' && note.tasks?.[0]?.dueDate) {
                  const taskDate = new Date(note.tasks[0].dueDate).toISOString().split('T')[0];
                  return taskDate === date;
                } else {
                  const noteDate = new Date(note.createdAt).toISOString().split('T')[0];
                  return noteDate === date;
                }
              });

              return (
                <View key={date} style={styles.dayContainer}>
                  <Text style={styles.dayLabel}>
                    {formatDayLabel(date)}
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.dayButton,
                      isSelected && styles.dayButtonSelected
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected
                    ]}>
                      {new Date(date).getDate()}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.dotContainer}>
                    {hasTasks && <View style={styles.dayDot} />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.tasksContainer}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateTitle}>
              {t('tasksFor')} {new Date(selectedDate).toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </Text>
          </View>
          
          <View style={styles.tasksList}>
{/* Replace the task card rendering code with this improved version */}
{tasksForSelectedDate.length > 0 ? (
  tasksForSelectedDate.map(note => (
    <TouchableOpacity
      key={note.id}
      style={[
        styles.noteItem,
        styles.modernTaskCard,
        {
          borderLeftColor: note.tasks?.[0]?.priority === 'high' ? '#FF4E4E' :
                         note.tasks?.[0]?.priority === 'medium' ? '#FFA726' : 
                         note.tasks?.[0]?.priority === 'low' ? '#66BB6A' : theme.accentColor,
          opacity: note.tasks?.[0]?.completed || note.tasks?.[0]?.isCompleted ? 0.6 : 1,
        }
      ]}
      onPress={() => navigation.navigate('QuickTask', { note })}
      activeOpacity={0.75}
    >
      {/* Task card content container */}
      <View style={styles.noteContent}>
        {/* Task type badge */}
        <View style={styles.taskTypeIndicator}>
          <Ionicons 
            name="checkmark-circle-outline" 
            size={14} 
            color={note.color ? TAG_COLORS[note.color as TagColor] : theme.accentColor} 
          />
          <Text style={[styles.taskTypeText, { color: note.color ? TAG_COLORS[note.color as TagColor] : theme.accentColor }]}>
            {getCategoryName(note.color) || 'Task'}
          </Text>
        </View>
        
        {/* Task header with title and priority */}
        <View style={styles.taskInfoContainer}>
          <Text style={[styles.taskTitle, note.tasks?.[0]?.completed || note.tasks?.[0]?.isCompleted ? { textDecorationLine: 'line-through', color: theme.placeholderColor } : null]} numberOfLines={2}>
            {note.title}
          </Text>
          
          {note.tasks?.[0]?.priority && (
            <View style={[
              styles.taskPriority,
              { 
                backgroundColor: note.tasks[0].priority === 'high' ? 'rgba(255, 78, 78, 0.15)' :
                              note.tasks[0].priority === 'medium' ? 'rgba(255, 167, 38, 0.15)' : 
                              'rgba(102, 187, 106, 0.15)',
                borderColor: note.tasks[0].priority === 'high' ? 'rgba(255, 78, 78, 0.25)' :
                           note.tasks[0].priority === 'medium' ? 'rgba(255, 167, 38, 0.25)' : 
                           'rgba(102, 187, 106, 0.25)',
              }
            ]}>
              <Ionicons 
                name="flag" 
                size={12} 
                color={note.tasks[0].priority === 'high' ? '#FF4E4E' :
                      note.tasks[0].priority === 'medium' ? '#FFA726' : '#66BB6A'} 
              />
              <Text style={[
                styles.taskPriorityText,
                { 
                  color: note.tasks[0].priority === 'high' ? '#FF4E4E' :
                        note.tasks[0].priority === 'medium' ? '#FFA726' : '#66BB6A'
                }
              ]}>
                {t(note.tasks[0].priority)}
              </Text>
            </View>
          )}
        </View>
        
        {note.description && (
  <Text style={styles.taskDescription} numberOfLines={2}>
    {note.description}
  </Text>
)}

        
        {/* Task Metadata */}
        <View style={styles.taskMetadata}>
          {/* Due Date */}
          {note.tasks?.[0]?.dueDate && (
            <View style={styles.taskMetadataItem}>
              <Ionicons 
                name="calendar-outline" 
                size={13} 
                color={theme.isDarkMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.65)'} 
              />
              <Text style={styles.taskMetadataText}>
                {new Date(note.tasks[0].dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          )}
          {/* Due Time */}
          {note.tasks?.[0]?.dueTime && (
            <View style={styles.taskMetadataItem}>
              <Ionicons 
                name="time-outline" 
                size={13} 
                color={theme.isDarkMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.65)'} 
              />
              <Text style={styles.taskMetadataText}>
                {new Date(note.tasks[0].dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
          
          {/* Location */}
          {note.tasks?.[0]?.location && (
            <View style={styles.taskMetadataItem}>
              <Ionicons 
                name="location-outline" 
                size={13} 
                color={theme.isDarkMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.65)'} 
              />
              <Text style={styles.taskMetadataText} numberOfLines={1}>
                {note.tasks[0].location}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Task status & info icons row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', top: wp(4), right: wp(4), zIndex: 10, gap: 4 }}>
        {/* Repeat icon */}
        {note.tasks?.[0]?.repeat && note.tasks[0].repeat !== 'none' && (
          <Ionicons
            name="repeat-outline"
            size={16}
            color={theme.accentColor}
            style={{ opacity: 0.7 }}
          />
        )}
        {/* Reminder icon */}
        {note.tasks?.[0]?.reminder && (
          <Ionicons
            name="notifications"
            size={16}
            color={theme.accentColor}
            style={{ opacity: 0.7 }}
          />
        )}
        {/* Task completion status indicator */}
        <TouchableOpacity
          onPress={async () => {
            if (!note.tasks?.[0]) return;
            const updatedNote = {
              ...note,
              tasks: [
                {
                  ...note.tasks[0],
                  completed: !(note.tasks[0].completed || note.tasks[0].isCompleted),
                  isCompleted: !(note.tasks[0].completed || note.tasks[0].isCompleted),
                },
                ...note.tasks.slice(1)
              ]
            };
            await updateNote(updatedNote);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {note.tasks?.[0]?.completed || note.tasks?.[0]?.isCompleted ? (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={theme.isDarkMode ? '#66BB6A' : '#4CAF50'}
            />
          ) : (
            <Ionicons
              name="ellipse-outline"
              size={22}
              color={theme.isDarkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)'}
            />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ))
) : (
  <EmptyState />
)}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showMonthView}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthView(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Νέα κεφαλίδα modal με τίτλο και κουμπί κλεισίματος */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.accentColor, flex: 1, textAlign: 'center', letterSpacing: -0.5 }}>
                {t('calendar')}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { position: 'absolute', right: 0, top: -4, zIndex: 10 }]}
                onPress={() => setShowMonthView(false)}
                accessibilityRole="button"
                accessibilityLabel={t('close')}
              >
                <Ionicons name="close" size={24} color={theme.textColor} />
              </TouchableOpacity>
            </View>
            <Calendar
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: theme.textColor,
                selectedDayBackgroundColor: theme.accentColor,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: theme.accentColor,
                dayTextColor: theme.textColor,
                textDisabledColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                dotColor: theme.accentColor,
                selectedDotColor: '#FFFFFF',
                monthTextColor: theme.textColor,
                arrowColor: theme.accentColor,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 15,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
              }}
              markingType={'multi-dot'}
              markedDates={getMarkedDates()}
              onDayPress={(day: DateData) => {
                setSelectedDate(day.dateString);
                setCurrentWeek(getCurrentWeekDates(new Date(day.dateString)));
                setShowMonthView(false);
              }}
              enableSwipeMonths={true}
              current={selectedDate}
              renderHeader={(date) => (
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textColor, textAlign: 'center', marginVertical: 8 }}>
                  {new Date(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </Text>
              )}
            />
          </View>
        </View>
      </Modal>

      <NavigationMenu onAddPress={() => setShowAddMenu(true)} />

      <AddNoteModal
        visible={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        onSelectOption={handleOptionSelect}
      />
    </View>
  );
} 