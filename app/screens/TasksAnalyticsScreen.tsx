import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotes } from '../NotesContext';

export default function TasksAnalyticsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { notes } = useNotes();

  // Δυναμική καταμέτρηση ανά κατηγορία (tag color)
  const tagColors = [
    { key: 'none', color: '#B0B0B0', icon: 'ellipse-outline' },
    { key: 'green', color: '#4CAF50', icon: 'person-circle' },
    { key: 'purple', color: '#8E24AA', icon: 'briefcase' },
    { key: 'blue', color: '#1976D2', icon: 'book' },
    { key: 'orange', color: '#FF9800', icon: 'bulb' },
    { key: 'red', color: '#E53935', icon: 'alert-circle' },
  ];
  const tagLabels = t('tagColors') as unknown as Record<string, string>;

  // Υπολογισμός ανά κατηγορία για tasks
  const tasksCategories = tagColors.map(tag => {
    const notesInCategory = notes.filter(note => (note.color || 'none') === tag.key && note.type === 'checklist');
    let taskCount = 0;
    let completedTasks = 0;
    notesInCategory.forEach(note => {
      if (note.type === 'checklist' && Array.isArray(note.tasks)) {
        taskCount += note.tasks.length;
        completedTasks += note.tasks.filter(task => task.isCompleted).length;
      }
    });
    return {
      ...tag,
      label: tagLabels[tag.key] || tag.key,
      taskCount,
      completedTasks,
    };
  }).filter(cat => cat.taskCount > 0);

  const totalCategoryTasks = tasksCategories.reduce((acc, c) => acc + c.taskCount, 0);
  const totalCompletedTasks = tasksCategories.reduce((acc, c) => acc + c.completedTasks, 0);
  const completionRate = totalCategoryTasks > 0 ? Math.round((totalCompletedTasks / totalCategoryTasks) * 100) : 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.isDarkMode ? '#000' : '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      paddingTop: Platform.OS === 'ios' ? 40 : 12,
    },
    backButton: {
      position: 'absolute',
      left: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      zIndex: 2,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textColor,
      textAlign: 'center',
    },
    content: {
      padding: 16,
    },
    mainCard: {
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    mainCardContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    mainCardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textColor,
      opacity: 0.8,
    },
    mainCardValue: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.accentColor,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    statCard: {
      width: (Dimensions.get('window').width - 44) / 2,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
      borderRadius: 16,
      padding: 12,
      margin: 6,
      minHeight: 64,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    statCardTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textColor,
      opacity: 0.7,
      marginBottom: 4,
      flexShrink: 1,
      flexWrap: 'wrap',
      maxWidth: '80%',
    },
    statCardValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.accentColor,
      flexShrink: 1,
      flexWrap: 'wrap',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 12,
      marginTop: 8,
    },
    infoText: {
      fontSize: 13,
      color: theme.placeholderColor,
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 24,
      opacity: 0.7,
      lineHeight: 18,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryCard: {
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    categoryLabel: {
      flex: 1,
      fontSize: 13,
      color: theme.textColor,
      fontWeight: '600',
      flexShrink: 1,
      flexWrap: 'wrap',
    },
    categoryStats: {
      alignItems: 'flex-end',
    },
    completedTasksText: {
      fontSize: 12,
      color: theme.accentColor,
      fontWeight: '600',
    },
    categoryTasksText: {
      fontSize: 12,
      color: theme.textColor,
      fontWeight: '500',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={theme.isDarkMode ? '#000' : '#f8f9fa'}
        barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('tasksOverview')}</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <View style={styles.statRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="list-outline" size={18} color={theme.accentColor} />
              </View>
              <Text style={styles.mainCardTitle}>{t('totalTasks')}</Text>
            </View>
            <Text style={styles.mainCardValue}>{totalCategoryTasks}</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="checkmark-done-outline" size={16} color={theme.accentColor} />
                </View>
                <Text style={styles.statCardTitle} numberOfLines={1} ellipsizeMode="tail">{t('completedTasks')}</Text>
              </View>
              <Text style={styles.statCardValue}>{totalCompletedTasks}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="stats-chart-outline" size={16} color={theme.accentColor} />
                </View>
                <Text style={styles.statCardTitle} numberOfLines={1} ellipsizeMode="tail">{t('completionRate')}</Text>
              </View>
              <Text style={styles.statCardValue}>{completionRate}%</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('categoriesOverview')}</Text>
        {tasksCategories.length === 0 && (
          <Text style={styles.infoText}>{t('noTasks')}</Text>
        )}
        {tasksCategories.map((cat, idx) => (
          <View style={styles.categoryCard} key={cat.key}>
            <View style={[styles.categoryIcon, { backgroundColor: cat.color + '22' }]}> 
              <Ionicons name={cat.icon as any} size={20} color={cat.color} />
            </View>
            <Text style={styles.categoryLabel} numberOfLines={1} ellipsizeMode="tail">{cat.label}</Text>
            <View style={styles.categoryStats}>
              <Text style={styles.categoryTasksText}>{cat.taskCount} {t('tasks')}</Text>
              {cat.completedTasks > 0 && (
                <Text style={styles.completedTasksText}>  {cat.completedTasks} {t('completedTasks')}</Text>
              )}
            </View>
          </View>
        ))}
        <Text style={styles.infoText}>{t('analyticsDescription')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
} 