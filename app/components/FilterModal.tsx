import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

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

    // Περιορισμός σε μέγιστο 2 φίλτρα
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '85%',
      maxWidth: 320,
      borderRadius: 20,
      padding: 20,
      paddingBottom: 50,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    clearButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      padding: 4,
    },
    clearText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.accentColor,
    },
    closeButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
    },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 14,
      marginBottom: 8,
    },
    filterText: {
      fontSize: 15,
      marginLeft: 14,
      fontWeight: '500',
    },
    dateFilterContainer: {
      marginBottom: 20,
    },
    dateFiltersRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 4,
    },
    dateCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 14,
      padding: 12,
      width: '32%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    dateCardActive: {
      backgroundColor: theme.accentColor,
      transform: [{ scale: 1.05 }],
    },
    dateCardLabel: {
      fontSize: 11,
      color: theme.textColor,
      marginTop: 4,
      textAlign: 'center',
    },
    dateCardLabelActive: {
      color: '#fff',
      fontWeight: '600',
    },
    sliderTrack: {
      position: 'absolute',
      top: '50%',
      left: 20,
      right: 20,
      height: 3,
      backgroundColor: theme.borderColor,
      transform: [{ translateY: -1.5 }],
      borderRadius: 1.5,
    },
    sliderButton: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.accentColor,
      top: -8.5,
      left: -10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    dateFilterOption: {
      alignItems: 'center',
    },
    dateFilterDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.borderColor,
      marginBottom: 8,
    },
    dateFilterDotActive: {
      backgroundColor: theme.accentColor,
      transform: [{ scale: 1.5 }],
    },
    dateFilterActive: {
      transform: [{ scale: 1.1 }],
    },
    dateFilterLabel: {
      fontSize: 14,
      color: theme.placeholderColor,
    },
    dateFilterLabelActive: {
      color: theme.accentColor,
      fontWeight: '600',
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    resultCount: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      flexDirection: 'row',
      alignItems: 'center',
      opacity: 0.8,
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
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: theme.secondaryBackground }]}>
              <View style={styles.modalHeader}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, { color: theme.textColor }]}>
                    {t('filterBy')}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Ionicons 
                    name="close" 
                    size={24} 
                    color={theme.textColor} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.dateFilterContainer}>
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
                        size={20}
                        color={activeFilters.includes(filter.id) ? '#fff' : theme.textColor}
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
              {otherFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterOption,
                    activeFilters.includes(filter.id) && { backgroundColor: `${theme.accentColor}20` }
                  ]}
                  onPress={() => handleFilterToggle(filter.id)}
                >
                  <Ionicons
                    name={filter.icon as any}
                    size={24}
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
              <View style={styles.resultCount}>
                <Text style={styles.resultText}>
                  {t('showingResults')}
                </Text>
                <Text style={styles.resultNumber}>
                  {filteredCount}
                </Text>
              </View>
              {activeFilters.length > 0 && (
                <TouchableOpacity 
                  onPress={handleClearFilters}
                  style={styles.clearButton}
                >
                  <Text style={[styles.clearText, { color: theme.accentColor }]}>
                    {t('clearFilter')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
} 