import React, { useState } from 'react';
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
} from 'react-native-reanimated';

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
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();

  const scale = useSharedValue(1);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return t('passwordTooShort');
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
      const user = auth().currentUser;
      if (user && user.email) {
        // Reauthenticate user before changing password
        const credential = auth.EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
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
      flex: 1,
      padding: 20,
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
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
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

        <ScrollView contentContainerStyle={styles.content}>
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
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
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
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(600).springify()}
            style={styles.inputContainer}
          >
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('confirmNewPassword')}
                placeholderTextColor={theme.placeholderColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
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