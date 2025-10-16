import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { TAG_COLORS, TAG_ICONS, TAG_LABELS, TagColor } from '../constants/tags';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters?: FilterState;
}

export interface FilterState {
  tags: TagColor[];
  favorites: boolean | null;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'date' | 'title' | 'favorites';
  sortOrder: 'asc' | 'desc';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FilterModal = ({ visible, onClose, onApplyFilters, currentFilters }: FilterModalProps) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    favorites: null,
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    ...currentFilters,
  });

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const toggleTag = (tag: TagColor) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleFavorites = () => {
    setFilters(prev => ({
      ...prev,
      favorites: prev.favorites === null ? true : prev.favorites === true ? false : null
    }));
  };

  const resetFilters = () => {
    setFilters({
      tags: [],
      favorites: null,
      dateRange: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const applyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    blurContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.isDarkMode ? 
        'rgba(0, 0, 0, 0.85)' : 
        'rgba(0, 0, 0, 0.4)',
    },
    modalContainer: {
      width: SCREEN_WIDTH * 0.9,
      maxWidth: 400,
      backgroundColor: theme.isDarkMode ? 
        'rgba(25, 25, 25, 0.98)' : 
        'rgba(255, 255, 255, 0.98)',
      borderRadius: 24,
      paddingVertical: 24,
      paddingHorizontal: 20,
      shadowColor: '#000',
      shadowOffset: { 
        width: 0, 
        height: 8
      },
      shadowOpacity: theme.isDarkMode ? 0.4 : 0.15,
      shadowRadius: 20,
      elevation: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textColor,
    },
    resetButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.1)' : 
        'rgba(0, 0, 0, 0.05)',
    },
    resetButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.accentColor,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 12,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.secondaryBackground,
    },
    tagButtonSelected: {
      backgroundColor: theme.accentColor,
      borderColor: theme.accentColor,
    },
    tagIcon: {
      marginRight: 6,
    },
    tagText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textColor,
    },
    tagTextSelected: {
      color: '#FFFFFF',
    },
    favoritesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    favoritesLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    favoritesIcon: {
      marginRight: 12,
    },
    favoritesText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textColor,
    },
    favoritesIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.borderColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    favoritesIndicatorSelected: {
      backgroundColor: theme.accentColor,
      borderColor: theme.accentColor,
    },
    dateRangeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dateRangeButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.secondaryBackground,
    },
    dateRangeButtonSelected: {
      backgroundColor: theme.accentColor,
      borderColor: theme.accentColor,
    },
    dateRangeText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textColor,
    },
    dateRangeTextSelected: {
      color: '#FFFFFF',
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    sortLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sortIcon: {
      marginRight: 12,
    },
    sortText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textColor,
    },
    sortOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    sortOption: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: theme.backgroundColor,
    },
    sortOptionSelected: {
      backgroundColor: theme.accentColor,
    },
    sortOptionText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textColor,
    },
    sortOptionTextSelected: {
      color: '#FFFFFF',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.1)' : 
        'rgba(0, 0, 0, 0.05)',
    },
    applyButton: {
      backgroundColor: theme.accentColor,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.textColor,
    },
    applyButtonText: {
      color: '#FFFFFF',
    },
  });

  const getFavoritesIcon = () => {
    if (filters.favorites === true) return 'heart';
    if (filters.favorites === false) return 'heart-outline';
    return 'heart-half-outline';
  };

  const getFavoritesText = () => {
    if (filters.favorites === true) return t('favoritesOnly');
    if (filters.favorites === false) return t('excludeFavorites');
    return t('allNotes');
  };

  const getSortIcon = () => {
    switch (filters.sortBy) {
      case 'title': return 'text-outline';
      case 'favorites': return 'heart-outline';
      default: return 'calendar-outline';
    }
  };

  const getSortText = () => {
    switch (filters.sortBy) {
      case 'title': return t('sortByTitle');
      case 'favorites': return t('sortByFavorites');
      default: return t('sortByDate');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.blurContainer}>
          <BlurView 
            intensity={theme.isDarkMode ? 40 : 25}
            tint={theme.isDarkMode ? "dark" : "light"}
            style={{ flex: 1 }}
          />
        </View>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }
          ]}
        >
          <Pressable onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('filterBy')}</Text>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>{t('reset')}</Text>
              </TouchableOpacity>
            </View>

            {/* Tags Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('tags')}</Text>
              <View style={styles.tagsContainer}>
                {Object.entries(TAG_LABELS).map(([key, label]) => {
                  const tagKey = key as TagColor;
                  const isSelected = filters.tags.includes(tagKey);
                  return (
                    <TouchableOpacity
                      key={tagKey}
                      style={[
                        styles.tagButton,
                        isSelected && styles.tagButtonSelected,
                      ]}
                      onPress={() => toggleTag(tagKey)}
                    >
                      <Ionicons
                        name={TAG_ICONS[tagKey]}
                        size={16}
                        color={isSelected ? '#FFFFFF' : TAG_COLORS[tagKey]}
                        style={styles.tagIcon}
                      />
                      <Text style={[
                        styles.tagText,
                        isSelected && styles.tagTextSelected,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Favorites Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('favorites')}</Text>
              <TouchableOpacity 
                style={styles.favoritesContainer}
                onPress={toggleFavorites}
              >
                <View style={styles.favoritesLeft}>
                  <Ionicons
                    name={getFavoritesIcon()}
                    size={20}
                    color={theme.accentColor}
                    style={styles.favoritesIcon}
                  />
                  <Text style={styles.favoritesText}>{getFavoritesText()}</Text>
                </View>
                <View style={[
                  styles.favoritesIndicator,
                  filters.favorites !== null && styles.favoritesIndicatorSelected,
                ]}>
                  {filters.favorites !== null && (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Date Range Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('dateRange')}</Text>
              <View style={styles.dateRangeContainer}>
                {[
                  { key: 'all', label: t('allTime') },
                  { key: 'today', label: t('today') },
                  { key: 'week', label: t('thisWeek') },
                  { key: 'month', label: t('thisMonth') },
                  { key: 'year', label: t('thisYear') },
                ].map(({ key, label }) => {
                  const isSelected = filters.dateRange === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.dateRangeButton,
                        isSelected && styles.dateRangeButtonSelected,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, dateRange: key as any }))}
                    >
                      <Text style={[
                        styles.dateRangeText,
                        isSelected && styles.dateRangeTextSelected,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sort Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('sortBy')}</Text>
              <View style={styles.sortContainer}>
                <View style={styles.sortLeft}>
                  <Ionicons
                    name={getSortIcon()}
                    size={20}
                    color={theme.accentColor}
                    style={styles.sortIcon}
                  />
                  <Text style={styles.sortText}>{getSortText()}</Text>
                </View>
                <View style={styles.sortOptions}>
                  {[
                    { key: 'date', label: t('date') },
                    { key: 'title', label: t('title') },
                    { key: 'favorites', label: t('favorites') },
                  ].map(({ key, label }) => {
                    const isSelected = filters.sortBy === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.sortOption,
                          isSelected && styles.sortOptionSelected,
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, sortBy: key as any }))}
                      >
                        <Text style={[
                          styles.sortOptionText,
                          isSelected && styles.sortOptionTextSelected,
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={[styles.sortContainer, { marginTop: 8 }]}>
                <View style={styles.sortLeft}>
                  <Ionicons
                    name="swap-vertical-outline"
                    size={20}
                    color={theme.accentColor}
                    style={styles.sortIcon}
                  />
                  <Text style={styles.sortText}>{t('sortOrder')}</Text>
                </View>
                <View style={styles.sortOptions}>
                  {[
                    { key: 'desc', label: t('newestFirst') },
                    { key: 'asc', label: t('oldestFirst') },
                  ].map(({ key, label }) => {
                    const isSelected = filters.sortOrder === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.sortOption,
                          isSelected && styles.sortOptionSelected,
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, sortOrder: key as any }))}
                      >
                        <Text style={[
                          styles.sortOptionText,
                          isSelected && styles.sortOptionTextSelected,
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.applyButton]}
                onPress={applyFilters}
              >
                <Text style={[styles.actionButtonText, styles.applyButtonText]}>
                  {t('apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default FilterModal;