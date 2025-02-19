import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectFilter: (filters: string[]) => void;
  activeFilters: string[];
  filteredCount: number;
}

export default function FilterModal({ visible, onClose, onSelectFilter, activeFilters, filteredCount }: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const dateFilters = [
    { id: 'today', label: t('today') },
    { id: 'week', label: t('thisWeek') },
    { id: 'month', label: t('thisMonth') },
  ];

  const otherFilters = [
    { id: 'favorites', label: t('favorites'), icon: 'heart-outline' },
    { id: 'tasks', label: t('tasks'), icon: 'checkbox-outline' },
    { id: 'notes', label: t('textNotes'), icon: 'document-text-outline' },
    { id: 'recent', label: t('recentlyEdited'), icon: 'time-outline' },
  ];

  const handleFilterToggle = (filterId: string) => {
    let newFilters: string[];
    const isDateFilter = dateFilters.some(df => df.id === filterId);
    const currentDateFilter = activeFilters.find(f => dateFilters.some(df => df.id === f));
    const currentOtherFilter = activeFilters.find(f => otherFilters.some(of => of.id === f));

    if (activeFilters.includes(filterId)) {
      // Αφαίρεση φίλτρου
      newFilters = activeFilters.filter(f => f !== filterId);
    } else {
      // Προσθήκη φίλτρου
      if (isDateFilter) {
        // Αν είναι φίλτρο ημερομηνίας, αντικατέστησε το υπάρχον date filter (αν υπάρχει)
        newFilters = [...activeFilters.filter(f => !dateFilters.some(df => df.id === f)), filterId];
      } else {
        // Αν είναι άλλο φίλτρο, αντικατέστησε το υπάρχον other filter (αν υπάρχει)
        newFilters = [...activeFilters.filter(f => !otherFilters.some(of => of.id === f)), filterId];
      }
    }

    // Περιορισμός σε μέγιστο 2 φίλτρα (1 από κάθε κατηγορία)
    if (newFilters.length <= 2) {
      onSelectFilter(newFilters);
    }
  };

  const handleClearFilters = () => {
    onSelectFilter([]);
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    blurContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalContainer: {
      backgroundColor: theme.isDarkMode ? 
        theme.secondaryBackground : 
        '#FFFFFF',
      borderRadius: 20,
      width: '85%',
      maxWidth: 320,
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    contentContainer: {
      padding: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingTop: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.textColor,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 12,
      paddingLeft: 4,
    },
    dateFiltersRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    dateCard: {
      width: '31%',
      backgroundColor: theme.isDarkMode ? 
        `${theme.backgroundColor}80` : 
        theme.secondaryBackground,
      borderRadius: 8,
      padding: 8,
      alignItems: 'center',
    },
    dateCardActive: {
      backgroundColor: `${theme.accentColor}15`,
      borderColor: theme.accentColor,
      borderWidth: 1,
    },
    dateCardLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textColor,
      marginTop: 4,
    },
    dateCardLabelActive: {
      color: theme.accentColor,
      fontWeight: '600',
    },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 8,
      marginBottom: 6,
      backgroundColor: theme.isDarkMode ? 
        `${theme.backgroundColor}80` : 
        theme.secondaryBackground,
    },
    filterText: {
      fontSize: 13,
      marginLeft: 8,
      fontWeight: '500',
      color: theme.textColor,
    },
    resultCount: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      backgroundColor: theme.isDarkMode ? 
        `${theme.backgroundColor}90` : 
        theme.backgroundColor,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    resultText: {
      color: theme.placeholderColor,
      fontSize: 13,
      fontWeight: '500',
    },
    resultNumber: {
      color: theme.accentColor,
      fontSize: 13,
      fontWeight: '700',
      marginLeft: 4,
    },
    clearButton: {
      backgroundColor: `${theme.accentColor}15`,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    clearText: {
      color: theme.accentColor,
      fontSize: 13,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <BlurView 
            intensity={10}
            tint={theme.isDarkMode ? "dark" : "light"}
            style={styles.blurContainer}
          />
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <ScrollView>
                <View style={styles.contentContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.title}>{t('filterBy')}</Text>
                    <TouchableOpacity onPress={onClose}>
                      <Ionicons name="close" size={20} color={theme.textColor} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('filterByDate')}</Text>
                    <View style={styles.dateFiltersRow}>
                      {dateFilters.map((filter) => (
                        <TouchableOpacity
                          key={filter.id}
                          style={[
                            styles.dateCard,
                            activeFilters.includes(filter.id) && styles.dateCardActive
                          ]}
                          onPress={() => handleFilterToggle(filter.id)}
                        >
                          <Ionicons
                            name={
                              filter.id === 'today' ? 'today-outline' :
                              filter.id === 'week' ? 'calendar-outline' : 'calendar-clear-outline'
                            }
                            size={18}
                            color={activeFilters.includes(filter.id) ? theme.accentColor : theme.textColor}
                          />
                          <Text style={[
                            styles.dateCardLabel,
                            activeFilters.includes(filter.id) && styles.dateCardLabelActive
                          ]}>
                            {filter.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('filterByType')}</Text>
                    {otherFilters.map((filter) => (
                      <TouchableOpacity
                        key={filter.id}
                        style={[
                          styles.filterOption,
                          activeFilters.includes(filter.id) && { backgroundColor: `${theme.accentColor}15` }
                        ]}
                        onPress={() => handleFilterToggle(filter.id)}
                      >
                        <Ionicons
                          name={filter.icon as any}
                          size={18}
                          color={activeFilters.includes(filter.id) ? theme.accentColor : theme.textColor}
                        />
                        <Text style={[
                          styles.filterText,
                          { color: activeFilters.includes(filter.id) ? theme.accentColor : theme.textColor }
                        ]}>
                          {filter.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.resultCount}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.resultText}>{t('showingResults')}</Text>
                  <Text style={styles.resultNumber}>{filteredCount}</Text>
                </View>
                {activeFilters.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={handleClearFilters}
                  >
                    <Text style={styles.clearText}>{t('clearFilters')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
} 