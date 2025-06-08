import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ToastAndroid,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { auth, GoogleSignin } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Toast from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) strength += 1; // Uppercase
    if (/[a-z]/.test(password)) strength += 1; // Lowercase
    if (/[0-9]/.test(password)) strength += 1; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Special characters
    
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return '#FF4E4E';
      case 2:
      case 3:
        return '#FFA500';
      case 4:
      case 5:
        return '#4CAF50';
      default:
        return '#FF4E4E';
    }
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return t('weakPassword');
      case 2:
      case 3:
        return t('mediumPassword');
      case 4:
      case 5:
        return t('strongPassword');
      default:
        return t('weakPassword');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (isSignUp) {
      setPasswordStrength(checkPasswordStrength(text));
    }
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return t('passwordTooShort');
    }
    if (!hasUpperCase) {
      return t('passwordNoUpperCase');
    }
    if (!hasLowerCase) {
      return t('passwordNoLowerCase');
    }
    if (!hasNumbers) {
      return t('passwordNoNumber');
    }
    if (!hasSpecialChar) {
      return t('passwordNoSpecialChar');
    }

    return null;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showToast(t('pleaseFillAllFields'), 'error');
      return;
    }

    if (isSignUp && !username) {
      showToast(t('usernameRequired'), 'error');
      return;
    }

    if (!validateEmail(email)) {
      showToast(t('invalidEmail'), 'error');
      return;
    }

    if (isSignUp) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        showToast(passwordError, 'error');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        if (userCredential.user) {
          await userCredential.user.updateProfile({
            displayName: username
          });
        }
        showToast(t('accountCreated'), 'success');
        setIsSignUp(false);
        setPassword('');
        setUsername('');
        setPasswordStrength(0);
      } else {
        await auth().signInWithEmailAndPassword(email, password);
        showToast(t('signInSuccess'), 'success');
        navigation.navigate('Home' as never);
      }
    } catch (error: any) {
      let errorMessage = t('authError');
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = t('invalidCredentials');
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('emailInUse');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('weakPassword');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('tooManyAttempts');
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = t('networkError');
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();
      
      if (!accessToken) {
        throw new Error('No access token present!');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(accessToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      if (userCredential.user) {
        showToast(t('signInSuccess'), 'success');
        navigation.navigate('Home' as never);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      let errorMessage = t('googleSignInError');
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = t('emailAlreadyInUse');
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = t('signInCancelled');
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = t('networkError');
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast(t('enterEmailForReset'), 'error');
      return;
    }

    if (!validateEmail(email)) {
      showToast(t('invalidEmail'), 'error');
      return;
    }

    setIsLoading(true);
    try {
      await auth().sendPasswordResetEmail(email);
      showToast(t('resetEmailSent'), 'success');
    } catch (error: any) {
      let errorMessage = t('resetError');
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('emailNotRegistered');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('tooManyAttempts');
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = t('networkError');
      }
      showToast(errorMessage, 'error');
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
      flex: 1,
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 40,
    },
    backButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 20,
      left: 20,
      zIndex: 1,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: theme.placeholderColor,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      padding: 15,
      color: theme.textColor,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
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
      marginTop: 10,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    toggleText: {
      color: theme.accentColor,
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.borderColor,
    },
    dividerText: {
      marginHorizontal: 10,
      color: theme.placeholderColor,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 15,
      marginTop: 10,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    googleButtonText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 10,
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
    passwordStrengthBar: {
      height: 4,
      borderRadius: 2,
      marginTop: 4,
    },
    passwordStrengthText: {
      fontSize: 12,
      marginTop: 4,
    },
    iconContainer: {
      marginBottom: 20,
    },
    forgotPasswordText: {
      color: theme.accentColor,
      textAlign: 'right',
      marginTop: 5,
      fontSize: 14,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.goBack();
        }}
      >
        <Ionicons name="arrow-back" size={24} color={theme.textColor} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={isSignUp ? "person-add-outline" : "log-in-outline"} 
                size={24} 
                color={theme.accentColor} 
              />
            </View>
            <Text style={styles.title}>
              {isSignUp ? t('createAccount') : t('welcomeBack')}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp ? t('createAccountDescription') : t('signInDescription')}
            </Text>
          </View>

          <View>
            {isSignUp && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('enterUsername')}
                  placeholderTextColor={theme.placeholderColor}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('email')}
                placeholderTextColor={theme.placeholderColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('password')}
                  placeholderTextColor={theme.placeholderColor}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={theme.placeholderColor}
                  />
                </TouchableOpacity>
              </View>
              {!isSignUp && (
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>
                    {t('forgotPassword')}
                  </Text>
                </TouchableOpacity>
              )}
              {isSignUp && (
                <>
                  <Text style={styles.passwordRequirements}>
                    {t('passwordRequirements')}
                  </Text>
                  <View style={styles.passwordStrengthContainer}>
                    <View
                      style={[
                        styles.passwordStrengthBar,
                        {
                          backgroundColor: getPasswordStrengthColor(passwordStrength),
                          width: `${(passwordStrength / 5) * 100}%`,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.passwordStrengthText,
                        { color: getPasswordStrengthColor(passwordStrength) },
                      ]}
                    >
                      {getPasswordStrengthText(passwordStrength)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? t('signUp') : t('signIn')}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <Text style={styles.googleButtonText}>
                {t('continueWithGoogle')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setIsSignUp(!isSignUp);
              setPassword('');
              setPasswordStrength(0);
            }}>
              <Text style={styles.toggleText}>
                {isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount')}
              </Text>
            </TouchableOpacity>
          </View>
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