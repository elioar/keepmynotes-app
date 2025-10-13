import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { sendEmailVerification } from 'firebase/auth';

interface EmailVerificationScreenProps {
  route?: {
    params?: {
      email?: string;
    };
  };
}

export default function EmailVerificationScreen({ route }: EmailVerificationScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();

  const email = route?.params?.email || auth.currentUser?.email || '';

  // Animation values
  const emailIconScale = useSharedValue(1);
  const emailIconRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Email icon animation
  useEffect(() => {
    emailIconScale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 2, stiffness: 100 }),
        withSpring(1, { damping: 2, stiffness: 100 })
      ),
      -1,
      false
    );
    
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Animated styles
  const emailIconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: emailIconScale.value },
        { rotate: `${emailIconRotation.value}deg` },
      ],
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: 1 - (pulseScale.value - 1) / 0.3,
    };
  });

  const handleResendEmail = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    try {
      const user = auth.currentUser;
      
      if (!user) {
        showToast(t('noUserFound'), 'error');
        return;
      }

      await sendEmailVerification(user);
      
      console.log('✅ Verification email resent to:', user.email);
      showToast(t('verificationEmailResent'), 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset countdown
      setCanResend(false);
      setCountdown(60);
    } catch (error: any) {
      console.error('❌ Error resending verification email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/too-many-requests') {
        showToast(t('tooManyRequests'), 'error');
      } else {
        showToast(t('resendError'), 'error');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckEmail = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      
      if (!user) {
        showToast(t('noUserFound'), 'error');
        return;
      }

      await user.reload();
      
      if (user.emailVerified) {
        showToast(t('emailVerified'), 'success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' as never }],
          });
        }, 1500);
      } else {
        showToast(t('emailNotVerifiedYet'), 'info');
      }
    } catch (error) {
      console.error('Error checking email verification:', error);
      showToast(t('checkEmailError'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.accentColor + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      position: 'relative',
    },
    pulseCircle: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.accentColor + '30',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: theme.placeholderColor,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    email: {
      fontWeight: '700',
      color: theme.accentColor,
    },
    actionsContainer: {
      marginTop: 40,
      gap: 16,
    },
    button: {
      backgroundColor: theme.accentColor,
      borderRadius: 16,
      padding: 18,
      alignItems: 'center',
      shadowColor: theme.accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },
    resendContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    resendText: {
      fontSize: 14,
      color: theme.placeholderColor,
    },
    resendButton: {
      fontSize: 15,
      color: theme.accentColor,
      fontWeight: '600',
    },
    resendButtonDisabled: {
      opacity: 0.5,
    },
    backButton: {
      marginTop: 20,
      paddingVertical: 12,
    },
    backButtonText: {
      fontSize: 15,
      color: theme.placeholderColor,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with animated icon */}
          <Animated.View 
            entering={FadeInDown.duration(600).springify()}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <Animated.View style={[pulseAnimatedStyle, styles.pulseCircle]} />
              <Animated.View style={emailIconAnimatedStyle}>
                <Ionicons name="mail-open-outline" size={56} color={theme.accentColor} />
              </Animated.View>
            </View>
            
            <Animated.View entering={FadeIn.delay(300).duration(800)}>
              <Text style={styles.title}>{t('verifyYourEmail')}</Text>
            </Animated.View>
            
            <Animated.View entering={FadeIn.delay(500).duration(800)}>
              <Text style={styles.subtitle}>
                {t('verificationEmailSent')}{'\n'}
                <Text style={styles.email}>{email}</Text>
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Actions */}
          <Animated.View 
            entering={FadeInDown.delay(700).duration(600).springify()}
            style={styles.actionsContainer}
          >
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleCheckEmail}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>{t('iVerifiedMyEmail')}</Text>
              )}
            </TouchableOpacity>

            {/* Resend section */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                {t('didntReceiveEmail')}{' '}
                <TouchableOpacity
                  onPress={handleResendEmail}
                  disabled={!canResend || isResending}
                  activeOpacity={0.7}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color={theme.accentColor} />
                  ) : (
                    <Text style={[styles.resendButton, (!canResend || isResending) && styles.resendButtonDisabled]}>
                      {canResend ? t('resendEmail') : `${countdown}s`}
                    </Text>
                  )}
                </TouchableOpacity>
              </Text>
            </View>

            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>{t('backToLogin')}</Text>
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

