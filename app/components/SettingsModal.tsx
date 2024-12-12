import React, { useState, useEffect } from 'react';
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
  BackHandler,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, appThemes } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UsernameModal from './UsernameModal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  onUpdateUsername: (name: string) => void;
}

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
  HiddenNotes: undefined;
  PinScreen: { isChangingPin?: boolean };
};

export default function SettingsModal({ 
  visible, 
  onClose, 
  username,
  onUpdateUsername 
}: SettingsModalProps) {
  const { theme, themeMode, setThemeMode, appTheme, setAppTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | null>(null);

  useEffect(() => {
    checkBiometrics();
    loadBiometricsPreference();
  }, []);

  const checkBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const hasBiometricSupport = hasHardware && isEnrolled && 
        supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      
      setHasBiometrics(hasBiometricSupport);
      if (hasBiometricSupport) {
        setBiometricType('fingerprint');
      }
    } catch (error) {
      console.error('Error checking biometrics:', error);
    }
  };

  const loadBiometricsPreference = async () => {
    const enabled = await AsyncStorage.getItem('@biometrics_enabled');
    setBiometricsEnabled(enabled === 'true');
  };

  const toggleBiometrics = async () => {
    const newValue = !biometricsEnabled;
    await AsyncStorage.setItem('@biometrics_enabled', newValue.toString());
    setBiometricsEnabled(newValue);
  };

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

  useEffect(() => {
    if (visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });

      return () => backHandler.remove();
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
      flexGrow: 1,
      paddingHorizontal: 16,
    },
    contentContainer: {
      paddingTop: 16,
      paddingBottom: 32,
      flexGrow: 1,
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
      marginLeft: 12,
      transform: [{ scale: 1.1 }],
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
      padding: 16,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      marginBottom: 8,
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
      marginLeft: 12,
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

            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              bounces={true}
              alwaysBounceVertical={true}
              keyboardShouldPersistTaps="handled"
            >
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

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔒 {t('security')}</Text>
                <TouchableOpacity 
                  style={styles.infoItem}
                  onPress={() => {
                    handleClose();
                    navigation.navigate('PinScreen', { isChangingPin: true });
                  }}
                >
                  <View style={styles.infoIcon}>
                    <Ionicons name="key-outline" size={22} color={theme.accentColor} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('changePin')}</Text>
                    <Text style={styles.infoValue}>{t('changePinDescription')}</Text>
                  </View>
                  <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={16} color={theme.placeholderColor} />
                  </View>
                </TouchableOpacity>

                {hasBiometrics && (
                  <TouchableOpacity 
                    style={[styles.infoItem, { marginTop: 8 }]}
                    onPress={toggleBiometrics}
                  >
                    <View style={styles.infoIcon}>
                      <Ionicons 
                        name="finger-print-outline"
                        size={22} 
                        color={theme.accentColor} 
                      />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>{t('biometricAuth')}</Text>
                      <Text style={styles.infoValue}>
                        {biometricsEnabled ? t('enabled') : t('disabled')}
                      </Text>
                    </View>
                    <Switch
                      value={biometricsEnabled}
                      onValueChange={toggleBiometrics}
                      trackColor={{ 
                        false: `${theme.placeholderColor}40`,
                        true: `${theme.accentColor}80`
                      }}
                      thumbColor={biometricsEnabled ? theme.accentColor : theme.backgroundColor}
                      ios_backgroundColor={`${theme.placeholderColor}40`}
                      style={styles.switch}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.version}>
                <Text style={styles.versionText}>📱 Version 1.0.0</Text>
              </View>
            </ScrollView>
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