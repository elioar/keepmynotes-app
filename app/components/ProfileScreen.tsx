import React, { useState, useEffect } from 'react';
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
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Toast from './Toast';
import { updateProfile, sendEmailVerification, deleteUser } from 'firebase/auth';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const scaleAnim = new Animated.Value(1);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const name = user.displayName || '';
      setUsername(name);
      setOriginalUsername(name);
      setEmail(user.email || '');
      setProfileImage(user.photoURL);
      setIsEmailVerified(user.emailVerified);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        const user = auth.currentUser;
        if (user) {
          await updateProfile(user, { photoURL: imageUri });
          showToast(t('profileUpdated'), 'success');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast(t('errorPickingImage'), 'error');
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      showToast(t('usernameRequired'), 'error');
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName: username });
        // Cache το ενημερωμένο username για χρήση στο HomeScreen
        try { await AsyncStorage.setItem('@username', username); } catch {}
        showToast(t('profileUpdated'), 'success');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(t('profileUpdateError'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast(t('signOutSuccess'), 'success');
      (navigation as any).navigate('Login');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast(t('signOutError'), 'error');
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword' as never);
  };

  const handleVerifyEmail = async () => {
    try {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        showToast(t('verificationEmailSent'), 'success');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      showToast(t('verificationEmailError'), 'error');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('deleteAccount'),
      t('deleteAccountConfirmation'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                await deleteUser(user);
                showToast(t('accountDeleted'), 'success');
                navigation.navigate('Login' as never);
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              showToast(t('deleteAccountError'), 'error');
            }
          },
        },
      ]
    );
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
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
      marginTop: 20,
      marginBottom: 30,
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
    saveButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 20,
      right: 20,
      zIndex: 1,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    rowCard: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    rowLabel: {
      color: theme.textColor,
      fontSize: 14,
      fontWeight: '600',
    },
    rowSubLabel: {
      color: theme.placeholderColor,
      fontSize: 12,
      marginTop: 2,
    },
    versionText: {
      color: theme.placeholderColor,
      fontSize: 13,
    },
    signOutButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      marginTop: 10,
    },
    signOutText: {
      color: theme.textColor,
      fontSize: 14,
      fontWeight: '600',
    },
    profileImageContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 3,
      borderColor: theme.accentColor,
    },
    profileImage: {
      width: 110,
      height: 110,
      borderRadius: 55,
    },
    changePhotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.accentColor,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 30,
    },
    changePhotoText: {
      color: '#FFFFFF',
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      color: theme.textColor,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      marginLeft: 4,
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
    emailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
    },
    emailText: {
      color: theme.textColor,
      fontSize: 16,
      flex: 1,
    },
    verificationStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 10,
    },
    verificationText: {
      fontSize: 12,
      marginLeft: 4,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.secondaryBackground,
      padding: 12,
      borderRadius: 12,
      marginHorizontal: 4,
    },
    actionButtonText: {
      color: theme.textColor,
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
    },
    button: {
      backgroundColor: theme.accentColor,
      borderRadius: 12,
      padding: 15,
      alignItems: 'center',
      marginTop: 10,
      width: '100%',
      maxWidth: 200,
      alignSelf: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#FF4E4E',
      borderRadius: 12,
      padding: 15,
      alignItems: 'center',
      marginTop: 10,
      width: '100%',
    },
    deleteButtonText: {
      color: '#FF4E4E',
      fontSize: 16,
      fontWeight: '600',
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

      <Animated.View style={[styles.saveButton, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          onPress={handleSave}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={pickImage}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons 
                  name="person" 
                  size={48} 
                  color={theme.accentColor} 
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.changePhotoButton}
              onPress={pickImage}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.changePhotoText}>{t('changePhoto')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('username')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterUsername')}
              placeholderTextColor={theme.placeholderColor}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{email}</Text>
            <View style={styles.verificationStatus}>
              {isEmailVerified ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={[styles.verificationText, { color: '#4CAF50' }]}>
                    {t('verified')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="alert-circle" size={16} color="#FFA500" />
                  <Text style={[styles.verificationText, { color: '#FFA500' }]}>
                    {t('verify')}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleChangePassword}
            >
              <Ionicons name="key-outline" size={20} color={theme.accentColor} />
              <Text style={styles.actionButtonText}>{t('changePassword')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleVerifyEmail}
              disabled={isEmailVerified}
            >
              <Ionicons name="mail-outline" size={20} color={isEmailVerified ? theme.placeholderColor : theme.accentColor} />
              <Text style={[styles.actionButtonText, { color: isEmailVerified ? theme.placeholderColor : theme.textColor }]}>
                {isEmailVerified ? t('verified') : t('verify')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Removed theme toggle and app version section as requested */}

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>{t('signOut')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>{t('deleteAccount')}</Text>
          </TouchableOpacity>
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