import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { 
  withSpring, 
  withTiming, 
  useAnimatedStyle, 
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
  HiddenNotes: undefined;
  PinScreen: { isChangingPin?: boolean };
  SecurityCheck: undefined;
};

const PIN_LENGTH = 4;
const PIN_KEY = '@secure_pin';

const successStyles = StyleSheet.create({
  successContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    marginTop: 32,
    fontSize: 24,
    fontWeight: '600',
  },
});

const SuccessAnimation = ({ theme, onComplete }: { theme: any; onComplete: () => void }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 800 });
    
    setTimeout(() => {
      checkmarkScale.value = withSpring(1, { damping: 10 });
    }, 400);

    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(onComplete)();
      });
    }, 2500);
  }, []);

  return (
    <View style={[successStyles.successContainer, { backgroundColor: theme.backgroundColor }]}>
      <Animated.View style={[successStyles.successCircle, { backgroundColor: `${theme.accentColor}15` }, circleStyle]}>
        <Animated.View style={[successStyles.checkmarkContainer, checkmarkStyle]}>
          <Ionicons name="checkmark" size={100} color={theme.accentColor} />
        </Animated.View>
      </Animated.View>
      <Animated.Text style={[successStyles.successText, { color: theme.textColor }, { opacity }]}>
        PIN άλλαξε επιτυχώς
      </Animated.Text>
    </View>
  );
};

export default function PinScreen({ route }: { route: any }) {
  const isChangingPin = route.params?.isChangingPin;
  const [pin, setPin] = useState<string>('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isVerifyingCurrentPin, setIsVerifyingCurrentPin] = useState(isChangingPin);
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    checkBiometrics();
    loadBiometricsPreference();
  }, []);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometrics(hasHardware && isEnrolled);
  };

  const loadBiometricsPreference = async () => {
    const enabled = await AsyncStorage.getItem('@biometrics_enabled');
    setBiometricsEnabled(enabled === 'true');
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('authenticateToView'),
        fallbackLabel: t('usePasscode'),
      });

      if (result.success) {
        if (isChangingPin) {
          setIsVerifyingCurrentPin(false);
          setIsSettingNewPin(true);
          setPin('');
          setErrorMessage('');
        } else {
          navigation.navigate('HiddenNotes');
        }
      }
    } catch (error) {
      console.error('Biometric error:', error);
    }
  };

  const handleNumberPress = (number: string) => {
    setErrorMessage('');
    Vibration.vibrate(40);
    if (isSettingPin) {
      if (pin.length < PIN_LENGTH) {
        setPin(prev => prev + number);
      } else {
        if (confirmPin.length === 0) {
          setConfirmPin(number);
        } else if (confirmPin.length < PIN_LENGTH) {
          setConfirmPin(prev => prev + number);
        }
      }
    } else {
      if (pin.length < PIN_LENGTH) {
        setPin(prev => prev + number);
      }
    }
  };

  const handleDelete = () => {
    Vibration.vibrate(40);
    if (isSettingPin && confirmPin.length > 0) {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handlePinSubmit = async () => {
    try {
      if (isChangingPin) {
        if (isVerifyingCurrentPin) {
          const savedPin = await AsyncStorage.getItem(PIN_KEY);
          if (savedPin === pin) {
            setIsVerifyingCurrentPin(false);
            setIsSettingNewPin(true);
            setPin('');
            setErrorMessage('');
          } else {
            setErrorMessage(t('incorrectPin'));
            setPin('');
            Vibration.vibrate([0, 50, 50, 50]);
          }
          return;
        }

        if (isSettingNewPin) {
          if (pin.length === PIN_LENGTH) {
            if (!confirmPin.length) {
              setConfirmPin(pin);
              setPin('');
            } else {
              if (pin === confirmPin) {
                await AsyncStorage.setItem(PIN_KEY, pin);
                setShowSuccess(true);
              } else {
                setErrorMessage(t('pinsDontMatch'));
                setPin('');
                setConfirmPin('');
                Vibration.vibrate([0, 50, 50, 50]);
              }
            }
          }
        }
      } else {
        if (isSettingPin) {
          if (pin.length === PIN_LENGTH && confirmPin.length === PIN_LENGTH) {
            if (pin === confirmPin) {
              await AsyncStorage.setItem(PIN_KEY, pin);
              navigation.navigate('HiddenNotes');
            } else {
              setErrorMessage(t('pinsDontMatch'));
              setPin('');
              setConfirmPin('');
              Vibration.vibrate([0, 50, 50, 50]);
            }
          }
        } else {
          const savedPin = await AsyncStorage.getItem(PIN_KEY);
          if (savedPin === pin) {
            navigation.navigate('HiddenNotes');
          } else {
            setErrorMessage(t('incorrectPin'));
            setPin('');
            Vibration.vibrate([0, 50, 50, 50]);
          }
        }
      }
    } catch (error) {
      console.error('Error handling PIN:', error);
    }
  };

  const handleSuccessComplete = () => {
    navigation.navigate('Home');
  };

  React.useEffect(() => {
    const checkExistingPin = async () => {
      const savedPin = await AsyncStorage.getItem(PIN_KEY);
      setIsSettingPin(!savedPin);
    };
    checkExistingPin();
  }, []);

  React.useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      if (!isSettingPin || confirmPin.length === PIN_LENGTH) {
        handlePinSubmit();
      }
    }
  }, [pin, confirmPin]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 80,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
      width: '80%',
      height: 160,
    },
    title: {
      fontSize: 28,
      color: theme.textColor,
      fontWeight: '700',
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: theme.placeholderColor,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 20,
    },
    dotsContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 50,
      height: 80,
    },
    dotsRow: {
      flexDirection: 'row',
      height: 20,
      alignItems: 'center',
      marginBottom: 8,
    },
    errorContainer: {
      height: 40,
      justifyContent: 'center',
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginHorizontal: 8,
      borderWidth: 1.5,
      borderColor: theme.accentColor,
      backgroundColor: 'transparent',
    },
    dotFilled: {
      backgroundColor: theme.accentColor,
    },
    keypad: {
      width: '80%',
      maxHeight: 380,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
    },
    keypadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 15,
    },
    numberButton: {
      width: 65,
      height: 65,
      borderRadius: 32.5,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? '#333' : theme.secondaryBackground,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    numberText: {
      fontSize: 24,
      color: theme.textColor,
      fontWeight: '500',
    },
    actionButton: {
      width: 65,
      height: 65,
      borderRadius: 32.5,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    errorMessage: {
      color: '#FF4E4E',
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '500',
      paddingHorizontal: 20,
    },
    progressIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    progressStep: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: theme.placeholderColor,
      opacity: 0.3,
    },
    progressStepActive: {
      backgroundColor: theme.accentColor,
      opacity: 1,
    },
    progressStepCompleted: {
      backgroundColor: theme.accentColor,
      opacity: 0.5,
    },
    securityIcon: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 20,
      backgroundColor: `${theme.accentColor}15`,
    },
  });

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: isSettingPin
                ? (pin.length === PIN_LENGTH 
                  ? i < confirmPin.length 
                  : i < pin.length)
                  ? theme.accentColor
                  : 'transparent'
                : i < pin.length
                  ? theme.accentColor
                  : 'transparent'
            }
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {showSuccess ? (
        <SuccessAnimation theme={theme} onComplete={handleSuccessComplete} />
      ) : (
        <>
          <View style={styles.header}>
            {isChangingPin ? (
              <>
                <View style={styles.securityIcon}>
                  <Ionicons name="shield-checkmark-outline" size={40} color={theme.accentColor} />
                </View>
                <View style={styles.progressIndicator}>
                  <View style={[
                    styles.progressStep,
                    isVerifyingCurrentPin ? styles.progressStepActive : 
                    (isSettingNewPin ? styles.progressStepCompleted : styles.progressStep)
                  ]} />
                  <View style={[
                    styles.progressStep,
                    isSettingNewPin && !confirmPin.length ? styles.progressStepActive :
                    (confirmPin.length > 0 ? styles.progressStepCompleted : styles.progressStep)
                  ]} />
                  <View style={[
                    styles.progressStep,
                    confirmPin.length > 0 ? styles.progressStepActive : styles.progressStep
                  ]} />
                </View>
                <Text style={styles.title}>
                  {isVerifyingCurrentPin 
                    ? t('enterCurrentPin')
                    : isSettingNewPin && confirmPin.length 
                      ? t('confirmPinCode')
                      : t('setPinCode')}
                </Text>
                {isSettingNewPin && !confirmPin.length && (
                  <Text style={styles.subtitle}>
                    {t('choosePinCode')}
                  </Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.securityIcon}>
                  <Ionicons name="lock-closed-outline" size={40} color={theme.accentColor} />
                </View>
                <Text style={styles.title}>
                  {isSettingPin ? t('setPinCode') : t('enterPinCode')}
                </Text>
              </>
            )}
          </View>

          <View style={styles.dotsContainer}>
            <View style={styles.dotsRow}>
              {renderPinDots()}
            </View>
            <View style={styles.errorContainer}>
              {errorMessage && (
                <Text style={styles.errorMessage}>
                  {errorMessage}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.keypad}>
            <View style={styles.keypadRow}>
              {[1, 2, 3].map((number) => (
                <TouchableOpacity
                  key={number}
                  style={styles.numberButton}
                  onPress={() => handleNumberPress(number.toString())}
                >
                  <Text style={styles.numberText}>{number}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[4, 5, 6].map((number) => (
                <TouchableOpacity
                  key={number}
                  style={styles.numberButton}
                  onPress={() => handleNumberPress(number.toString())}
                >
                  <Text style={styles.numberText}>{number}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[7, 8, 9].map((number) => (
                <TouchableOpacity
                  key={number}
                  style={styles.numberButton}
                  onPress={() => handleNumberPress(number.toString())}
                >
                  <Text style={styles.numberText}>{number}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {hasBiometrics && biometricsEnabled && !isSettingNewPin && (!isSettingPin || isChangingPin) ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleBiometricAuth}
                >
                  <Ionicons 
                    name="finger-print-outline" 
                    size={28} 
                    color={theme.accentColor} 
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="close-outline" size={28} color={theme.textColor} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => handleNumberPress('0')}
              >
                <Text style={styles.numberText}>0</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Ionicons 
                  name="backspace-outline" 
                  size={28} 
                  color={theme.textColor} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
} 