import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, appThemes } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UsernameModal from './UsernameModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  onUpdateUsername: (name: string) => void;
}

export default function SettingsModal({ 
  visible, 
  onClose, 
  username,
  onUpdateUsername 
}: SettingsModalProps) {
  const { theme, themeMode, setThemeMode, appTheme, setAppTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  const handleClose = () => {
    Animated.spring(slideAnim, {
      toValue: Dimensions.get('window').height,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      onClose();
    });
  };

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible]);

  const styles = StyleSheet.create({
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,

    },
    animatedContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.backgroundColor,
      transform: [{ translateY: slideAnim }],
    },
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingTop: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.textColor,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.placeholderColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
      marginLeft: 4,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: theme.secondaryBackground,
      marginBottom: 6,
      borderRadius: 12,
    },
    usernameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    usernameIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    usernameContent: {
      flex: 1,
    },
    usernameLabel: {
      fontSize: 14,
      color: theme.textColor,
      fontWeight: '600',
    },
    usernameValue: {
      fontSize: 12,
      color: theme.placeholderColor,
      fontWeight: '500',
      marginTop: 2,
    },
    chevronIcon: {
      width: 20,
      height: 20,
      opacity: 0.5,
    },
    settingIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingLabel: {
      fontSize: 14,
      color: theme.textColor,
      fontWeight: '600',
    },
    settingValue: {
      fontSize: 12,
      color: theme.placeholderColor,
      fontWeight: '500',
      marginTop: 2,
    },
    radioButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    radioButtonInner: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.accentColor,
    },
    activeItem: {
      backgroundColor: `${theme.accentColor}15`,
      borderWidth: 1,
      borderColor: `${theme.accentColor}30`,
    },
    switch: {
      transform: [{ scale: 0.9 }],
    },
    version: {
      marginTop: 16,
      alignItems: 'center',
      paddingBottom: 16,
      opacity: 0.5,
    },
    versionText: {
      color: theme.textColor,
      fontSize: 12,
      fontWeight: '500',
    },
    themeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    themeItem: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
    },
    themeIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    themeLabel: {
      fontSize: 11,
      color: theme.textColor,
      fontWeight: '600',
      textAlign: 'center',
    },
    themeItemActive: {
      backgroundColor: `${theme.accentColor}15`,
      borderWidth: 1,
      borderColor: `${theme.accentColor}30`,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16,
      gap: 12,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 15,
      color: theme.textColor,
      fontWeight: '600',
    },
    infoValue: {
      fontSize: 13,
      color: theme.placeholderColor,
      marginTop: 2,
    },
    chevronContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorThemeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      padding: 10,
      paddingHorizontal: 16,
    },
    colorThemeItem: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 2,
    },
    colorThemeItemInner: {
      width: '100%',
      height: '100%',
      borderRadius: 6,
    },
    colorThemeActive: {
      borderWidth: 2,
      borderColor: theme.accentColor,
      transform: [{ scale: 1.15 }],
    },
    settingContent: {
      flex: 1,
      marginLeft: 12,
    },
  });

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.modalOverlay}>
        <Animated.View style={styles.animatedContainer}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('settings')}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={theme.textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👤 {t('information')}</Text>
                <TouchableOpacity 
                  style={styles.infoItem}
                  onPress={() => setShowUsernameModal(true)}
                >
                  <View style={styles.infoIcon}>
                    <Ionicons name="person-outline" size={22} color={theme.accentColor} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('username')}</Text>
                    <Text style={styles.infoValue}>{username}</Text>
                  </View>
                  <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={16} color={theme.placeholderColor} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌍 {t('language')}</Text>
                <TouchableOpacity 
                  style={[styles.settingItem, locale === 'en' && styles.activeItem]}
                  onPress={() => setLocale('en')}
                >
                  <View style={styles.settingIcon}>
                    <Text style={{ fontSize: 18 }}>🇬🇧</Text>
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{t('english')}</Text>
                  </View>
                  <View style={styles.radioButton}>
                    {locale === 'en' && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.settingItem, locale === 'el' && styles.activeItem]}
                  onPress={() => setLocale('el')}
                >
                  <View style={styles.settingIcon}>
                    <Text style={{ fontSize: 18 }}>🇬🇷</Text>
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{t('greek')}</Text>
                  </View>
                  <View style={styles.radioButton}>
                    {locale === 'el' && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎨 {t('display')}</Text>
                <View style={styles.themeContainer}>
                  <TouchableOpacity 
                    style={[styles.themeItem, themeMode === 'system' && styles.themeItemActive]}
                    onPress={() => setThemeMode('system')}
                  >
                    <View style={styles.themeIcon}>
                      <Ionicons name="sunny-outline" size={24} color={theme.accentColor} />
                    </View>
                    <Text style={styles.themeLabel}>{t('systemTheme')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.themeItem, themeMode === 'light' && styles.themeItemActive]}
                    onPress={() => setThemeMode('light')}
                  >
                    <View style={styles.themeIcon}>
                      <Ionicons name="sunny" size={24} color={theme.accentColor} />
                    </View>
                    <Text style={styles.themeLabel}>{t('lightTheme')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.themeItem, themeMode === 'dark' && styles.themeItemActive]}
                    onPress={() => setThemeMode('dark')}
                  >
                    <View style={styles.themeIcon}>
                      <Ionicons name="moon" size={24} color={theme.accentColor} />
                    </View>
                    <Text style={styles.themeLabel}>{t('darkTheme')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎨 {t('appTheme')}</Text>
                <View style={styles.colorThemeContainer}>
                  {Object.entries(appThemes).map(([key, color]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.colorThemeItem,
                        { backgroundColor: theme.backgroundColor },
                        appTheme === key && styles.colorThemeActive,
                      ]}
                      onPress={() => setAppTheme(key as 'purple' | 'blue' | 'green' | 'orange' | 'pink')}
                    >
                      <View 
                        style={[
                          styles.colorThemeItemInner,
                          { backgroundColor: color }
                        ]} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.version}>
                <Text style={styles.versionText}>📱 Version 1.0.0</Text>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>

      {showUsernameModal && (
        <UsernameModal
          visible={showUsernameModal}
          onSubmit={(newName: string) => {
            onUpdateUsername(newName);
            setShowUsernameModal(false);
          }}
          onClose={() => setShowUsernameModal(false)}
        />
      )}
    </View>
  );
}