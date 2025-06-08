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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface UsageStats {
  totalTime: number;
  sessions: number;
  lastActive: string;
  dailyAverage: number;
  weeklyAverage: number;
  mostActiveDay: string;
  mostActiveHour: number;
}

export default function TimeAnalyticsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [stats, setStats] = useState<UsageStats>({
    totalTime: 0,
    sessions: 0,
    lastActive: '',
    dailyAverage: 0,
    weeklyAverage: 0,
    mostActiveDay: '',
    mostActiveHour: 0,
  });

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const storedStats = await AsyncStorage.getItem('@usage_stats');
      if (storedStats) {
        setStats(JSON.parse(storedStats));
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ${t('hours')} ${mins} ${t('minutes')}`;
    }
    return `${mins} ${t('minutes')}`;
  };

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
    gradientBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 0,
      opacity: 0,
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
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={theme.isDarkMode ? '#000' : '#f8f9fa'}
        barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'}
      />
      <LinearGradient
        colors={[theme.accentColor, theme.isDarkMode ? '#000' : '#f8f9fa']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('usageStats')}</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <View style={styles.statRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={18} color={theme.accentColor} />
              </View>
              <Text style={styles.mainCardTitle}>{t('totalTimeSpent')}</Text>
            </View>
            <Text style={styles.mainCardValue}>{formatTime(stats.totalTime)}</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={16} color={theme.accentColor} />
                </View>
                <Text style={styles.statCardTitle} numberOfLines={1} ellipsizeMode="tail">{t('sessions')}</Text>
              </View>
              <Text style={styles.statCardValue}>{stats.sessions}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time-outline" size={16} color={theme.accentColor} />
                </View>
                <Text style={styles.statCardTitle} numberOfLines={1} ellipsizeMode="tail">{t('lastActive')}</Text>
                <View style={{flex: 1, alignItems: 'flex-end'}}>
                  <Ionicons name="information-circle-outline" size={15} color={theme.placeholderColor} />
                </View>
              </View>
              <Text style={styles.statCardValue}>{stats.lastActive}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('averages')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="sunny-outline" size={16} color={theme.accentColor} />
              </View>
              <Text style={styles.statCardTitle}>{t('dailyAverage')}</Text>
            </View>
            <Text style={styles.statCardValue}>{formatTime(stats.dailyAverage)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar-number-outline" size={16} color={theme.accentColor} />
              </View>
              <Text style={styles.statCardTitle}>{t('weeklyAverage')}</Text>
            </View>
            <Text style={styles.statCardValue}>{formatTime(stats.weeklyAverage)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('activityPatterns')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar-outline" size={16} color={theme.accentColor} />
              </View>
              <Text style={styles.statCardTitle}>{t('mostActiveDay')}</Text>
            </View>
            <Text style={styles.statCardValue}>{stats.mostActiveDay}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={16} color={theme.accentColor} />
              </View>
              <Text style={styles.statCardTitle}>{t('mostActiveHour')}</Text>
            </View>
            <Text style={styles.statCardValue}>{stats.mostActiveHour}:00</Text>
          </View>
        </View>

        <Text style={styles.infoText}>
          {t('usageStatsDescription')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
} 