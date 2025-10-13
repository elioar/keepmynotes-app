import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Toast from './Toast';
import Animated, { 
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();

  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const progressOpacity = useSharedValue(0);

  // Animate progress bar when password strength changes
  useEffect(() => {
    if (newPassword.length > 0) {
      progressWidth.value = withSpring((passwordStrength / 6) * 100, {
        damping: 15,
        stiffness: 100,
      });
      progressOpacity.value = withTiming(1, { duration: 300 });
    } else {
      progressWidth.value = withTiming(0, { duration: 200 });
      progressOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [passwordStrength, newPassword.length]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength === 0 || strength === 1) {
      return '#FF4E4E';
    } else if (strength === 2 || strength === 3) {
      return '#FFA500';
    } else if (strength >= 4) {
      return '#4CAF50';
    }
    return '#FF4E4E';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength === 0 || strength === 1) {
      return t('weakPassword');
    } else if (strength === 2 || strength === 3) {
      return t('mediumPassword');
    } else if (strength >= 4) {
      return t('strongPassword');
    }
    return t('weakPassword');
  };

  const handleNewPasswordChange = (text: string) => {
    const sanitizedText = text.replace(/\s/g, '');
    const limitedText = sanitizedText.slice(0, 32);
    setNewPassword(limitedText);
    setPasswordStrength(checkPasswordStrength(limitedText));
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const maxLength = 32;
    
    if (password.length < minLength) {
      return t('passwordTooShort');
    }
    if (password.length > maxLength) {
      return t('passwordTooLong');
    }
    if (!/[A-Z]/.test(password)) {
      return t('passwordNoUpperCase');
    }
    if (!/[a-z]/.test(password)) {
      return t('passwordNoLowerCase');
    }
    if (!/[0-9]/.test(password)) {
      return t('passwordNoNumber');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return t('passwordNoSpecialChar');
    }
    return null;
  };

  // Animated styles
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
      opacity: progressOpacity.value,
    };
  });

  const handleForgotPassword = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        showToast(t('noUserFound'), 'error');
        return;
      }

      await sendPasswordResetEmail(auth, user.email);
      showToast(t('resetEmailSent'), 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate back to login after a delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      let errorMessage = t('resetError');
      if (error.code === 'auth/too-many-requests') {
        errorMessage = t('tooManyRequests');
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast(t('pleaseFillAllFields'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t('passwordsDontMatch'), 'error');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user && user.email) {
        // Reauthenticate user before changing password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        showToast(t('passwordChanged'), 'success');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMessage = t('passwordChangeError');
      if (error.code === 'auth/wrong-password') {
        errorMessage = t('currentPasswordIncorrect');
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('recentLoginRequired');
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flexGrow: 1,
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    inputContainer: {
      marginBottom: 20,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    passwordContainerValid: {
      borderColor: '#4CAF50',
      borderWidth: 2,
    },
    passwordContainerInvalid: {
      borderColor: '#FF4E4E',
      borderWidth: 2,
    },
    passwordInput: {
      flex: 1,
      padding: 15,
      color: theme.textColor,
      fontSize: 16,
    },
    passwordToggle: {
      padding: 15,
    },
    button: {
      backgroundColor: theme.accentColor,
      borderRadius: 12,
      padding: 15,
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    passwordRequirements: {
      fontSize: 12,
      color: theme.placeholderColor,
      marginTop: 5,
      marginLeft: 5,
    },
    passwordStrengthContainer: {
      marginTop: 5,
      marginLeft: 5,
    },
    passwordStrengthBarBackground: {
      height: 6,
      backgroundColor: theme.borderColor,
      borderRadius: 3,
      marginTop: 4,
      overflow: 'hidden',
    },
    passwordStrengthBar: {
      height: '100%',
      borderRadius: 3,
      minWidth: 2,
    },
    passwordStrengthText: {
      fontSize: 12,
      marginTop: 6,
      fontWeight: '500',
    },
    passwordChecklist: {
      marginTop: 8,
      marginLeft: 5,
      gap: 4,
    },
    checklistRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    checklistText: {
      fontSize: 11,
      color: theme.placeholderColor,
    },
    checklistTextValid: {
      color: '#4CAF50',
      fontWeight: '500',
    },
    matchIcon: {
      marginRight: 5,
    },
    passwordMismatchText: {
      fontSize: 12,
      color: '#FF4E4E',
      marginTop: 5,
      marginLeft: 5,
    },
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginTop: 8,
      marginRight: 5,
      padding: 5,
    },
    forgotPasswordText: {
      fontSize: 13,
      color: theme.accentColor,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('changePassword')}</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            style={styles.inputContainer}
          >
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('currentPassword')}
                placeholderTextColor={theme.placeholderColor}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={theme.placeholderColor}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                {t('forgotPassword')}?
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(400).springify()}
            style={styles.inputContainer}
          >
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('newPassword')}
                placeholderTextColor={theme.placeholderColor}
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={theme.placeholderColor}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordRequirements}>
              {t('passwordRequirements')}
            </Text>
            {newPassword.length > 0 && (
              <>
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBarBackground}>
                    <Animated.View
                      style={[
                        styles.passwordStrengthBar,
                        {
                          backgroundColor: getPasswordStrengthColor(passwordStrength),
                        },
                        animatedProgressStyle,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.passwordStrengthText,
                      { color: getPasswordStrengthColor(passwordStrength) },
                    ]}
                  >
                    {getPasswordStrengthText(passwordStrength)}
                  </Text>
                </View>
                <View style={styles.passwordChecklist}>
                  <View style={styles.checklistRow}>
                    <View style={styles.checklistItem}>
                      <Ionicons 
                        name={newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                        size={14} 
                        color={newPassword.length >= 8 ? '#4CAF50' : theme.placeholderColor} 
                      />
                      <Text style={[styles.checklistText, newPassword.length >= 8 && styles.checklistTextValid]}>
                        8+ chars
                      </Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Ionicons 
                        name={/[A-Z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                        size={14} 
                        color={/[A-Z]/.test(newPassword) ? '#4CAF50' : theme.placeholderColor} 
                      />
                      <Text style={[styles.checklistText, /[A-Z]/.test(newPassword) && styles.checklistTextValid]}>
                        A-Z
                      </Text>
                    </View>
                  </View>
                  <View style={styles.checklistRow}>
                    <View style={styles.checklistItem}>
                      <Ionicons 
                        name={/[a-z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                        size={14} 
                        color={/[a-z]/.test(newPassword) ? '#4CAF50' : theme.placeholderColor} 
                      />
                      <Text style={[styles.checklistText, /[a-z]/.test(newPassword) && styles.checklistTextValid]}>
                        a-z
                      </Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Ionicons 
                        name={/[0-9]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                        size={14} 
                        color={/[0-9]/.test(newPassword) ? '#4CAF50' : theme.placeholderColor} 
                      />
                      <Text style={[styles.checklistText, /[0-9]/.test(newPassword) && styles.checklistTextValid]}>
                        0-9
                      </Text>
                    </View>
                  </View>
                  <View style={styles.checklistRow}>
                    <View style={styles.checklistItem}>
                      <Ionicons 
                        name={/[^A-Za-z0-9]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                        size={14} 
                        color={/[^A-Za-z0-9]/.test(newPassword) ? '#4CAF50' : theme.placeholderColor} 
                      />
                      <Text style={[styles.checklistText, /[^A-Za-z0-9]/.test(newPassword) && styles.checklistTextValid]}>
                        !@#$
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(600).springify()}
            style={styles.inputContainer}
          >
            <View style={[
              styles.passwordContainer,
              confirmPassword.length > 0 && newPassword === confirmPassword && styles.passwordContainerValid,
              confirmPassword.length > 0 && newPassword !== confirmPassword && styles.passwordContainerInvalid,
            ]}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('confirmNewPassword')}
                placeholderTextColor={theme.placeholderColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {confirmPassword.length > 0 && newPassword === confirmPassword && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#4CAF50"
                  style={styles.matchIcon}
                />
              )}
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <Ionicons
                  name="close-circle"
                  size={24}
                  color="#FF4E4E"
                  style={styles.matchIcon}
                />
              )}
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={theme.placeholderColor}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.passwordMismatchText}>
                {t('passwordsDontMatch')}
              </Text>
            )}
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(800).springify()}
            style={[styles.button, animatedStyle]}
          >
            <TouchableOpacity
              onPress={handleChangePassword}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>{t('changePassword')}</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        type={toastType}
      />
    </SafeAreaView>
  );
} 