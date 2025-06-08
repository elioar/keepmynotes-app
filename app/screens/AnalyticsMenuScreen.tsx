import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function AnalyticsMenuScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const analyticsOptions = [
    {
      id: 'notes',
      title: t('notesOverview'),
      icon: 'document-text-outline',
      screen: 'NotesAnalytics',
    },
    {
      id: 'tasks',
      title: t('tasksOverview'),
      icon: 'checkmark-circle-outline',
      screen: 'TasksAnalytics',
    },
    {
      id: 'time',
      title: t('usageStats'),
      icon: 'time-outline',
      screen: 'TimeAnalytics',
    },
  ];

  // Tips array
  const tips = [
    t('organizeDescription') || 'Οργάνωσε τις σημειώσεις σου και τον χρόνο σου για να πετύχεις περισσότερα!',
    'Η συνέπεια είναι το κλειδί για την παραγωγικότητα.',
    'Χρησιμοποίησε ετικέτες για να βρίσκεις εύκολα τις σημειώσεις σου.',
    'Κάνε backup τα δεδομένα σου τακτικά!',
    'Μην ξεχνάς να ολοκληρώνεις τις εργασίες σου καθημερινά.',
    'Δοκίμασε να γράφεις μικρές σημειώσεις κάθε μέρα.'
  ];
  const [tipIndex, setTipIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTipIndex(prev => (prev + 1) % tips.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

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
    optionCard: {
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
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
    optionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    optionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textColor,
      flex: 1,
      flexShrink: 1,
      flexWrap: 'wrap',
    },
    optionDescription: {
      fontSize: 13,
      color: theme.placeholderColor,
      flex: 2,
      flexWrap: 'wrap',
    },
    tipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      marginBottom: 12,
      paddingHorizontal: 12,
      minHeight: 32,
    },
    tipText: {
      fontSize: 13,
      color: theme.placeholderColor,
      fontStyle: 'italic',
      flex: 1,
      textAlign: 'left',
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
        <Text style={styles.title}>{t('analyticsAndStats')}</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {analyticsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={() => navigation.navigate(option.screen)}
          >
            <View style={styles.optionIcon}>
              <Ionicons name={option.icon as any} size={20} color={theme.accentColor} />
            </View>
            <Text style={styles.optionTitle} numberOfLines={1} ellipsizeMode="tail">{option.title}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.tipContainer}>
          <Ionicons name="bulb-outline" size={18} color={theme.accentColor} style={{ marginRight: 8 }} />
          <Animated.Text style={[styles.tipText, { opacity: fadeAnim }]}
            numberOfLines={2} ellipsizeMode="tail"
          >
            {tips[tipIndex]}
          </Animated.Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 