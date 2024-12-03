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
import { useTheme } from '../context/ThemeContext';
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
  const { theme, themeMode, setThemeMode } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  const handleClose = () => {
    Animated.spring(slideAnim, {
      toValue: Dimensions.get('window').width,
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
      right: 0,
      bottom: 0,
      width: '100%',
      backgroundColor: theme.backgroundColor,
      transform: [{ translateX: slideAnim }],
    },
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.textColor,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.placeholderColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
      marginLeft: 8,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.secondaryBackground,
      marginBottom: 2,
      borderRadius: 12,
    },
    settingLabel: {
      fontSize: 16,
      color: theme.textColor,
      fontWeight: '500',
    },
    settingValue: {
      fontSize: 13,
      color: theme.placeholderColor,
      fontWeight: '500',
      marginTop: 2,
    },
    radioButton: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: theme.accentColor,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    radioButtonInner: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.accentColor,
    },
    activeItem: {
      backgroundColor: `${theme.accentColor}20`,
    },
    switch: {
      transform: [{ scale: 0.9 }],
    },
    version: {
      marginTop: 'auto',
      alignItems: 'center',
      paddingBottom: 30,
      opacity: 0.5,
    },
    versionText: {
      color: theme.textColor,
      fontSize: 13,
      fontWeight: '500',
    },
  });

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={handleClose}
      >
        <Animated.View style={styles.animatedContainer}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('settings')}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={theme.textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('language')}</Text>
                <TouchableOpacity 
                  style={[styles.settingItem, locale === 'en' && styles.activeItem]}
                  onPress={() => setLocale('en')}
                >
                  <Text style={styles.settingLabel}>{t('english')}</Text>
                  <View style={styles.radioButton}>
                    {locale === 'en' && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.settingItem, locale === 'el' && styles.activeItem]}
                  onPress={() => setLocale('el')}
                >
                  <Text style={styles.settingLabel}>{t('greek')}</Text>
                  <View style={styles.radioButton}>
                    {locale === 'el' && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('display')}</Text>
                <TouchableOpacity 
                  style={[styles.settingItem, themeMode === 'system' && styles.activeItem]}
                  onPress={() => setThemeMode('system')}
                >
                  <Text style={styles.settingLabel}>{t('systemTheme')}</Text>
                  <View style={styles.radioButton}>
                    {themeMode === 'system' && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.settingItem, themeMode === 'light' && styles.activeItem]}
                  onPress={() => setThemeMode('light')}
                >
                  <Text style={styles.settingLabel}>{t('lightTheme')}</Text>
                  <View style={styles.radioButton}>
                    {themeMode === 'light' && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.settingItem, themeMode === 'dark' && styles.activeItem]}
                  onPress={() => setThemeMode('dark')}
                >
                  <Text style={styles.settingLabel}>{t('darkTheme')}</Text>
                  <View style={styles.radioButton}>
                    {themeMode === 'dark' && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('notifications')}</Text>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>{t('enableNotifications')}</Text>
                  <Switch
                    style={styles.switch}
                    value={isNotificationsEnabled}
                    onValueChange={setIsNotificationsEnabled}
                    trackColor={{ false: '#767577', true: theme.accentColor }}
                    thumbColor={isNotificationsEnabled ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('information')}</Text>
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => setShowUsernameModal(true)}
                >
                  <View>
                    <Text style={styles.settingLabel}>{t('username')}</Text>
                    <Text style={styles.settingValue}>{username}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.placeholderColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.version}>
                <Text style={styles.versionText}>Version 1.0.0</Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </TouchableOpacity>

      {showUsernameModal && (
        <UsernameModal
          visible={showUsernameModal}
          onSubmit={(newName: string) => {
            onUpdateUsername(newName);
            setShowUsernameModal(false);
          }}
        />
      )}
    </View>
  );
}