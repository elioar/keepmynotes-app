import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';

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
                Alert.alert(t('success'), t('pinChanged'));
                navigation.navigate('Home');
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
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      color: theme.textColor,
      fontWeight: '700',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.placeholderColor,
      textAlign: 'center',
    },
    dotsContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 50,
    },
    dotsRow: {
      flexDirection: 'row',
      height: 20,
      alignItems: 'center',
      marginBottom: 8,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginHorizontal: 8,
      borderWidth: 1,
      borderColor: theme.accentColor,
      backgroundColor: 'transparent',
    },
    dotFilled: {
      backgroundColor: theme.accentColor,
    },
    keypad: {
      width: '70%',
      aspectRatio: 0.8,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    keypadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 20,
    },
    numberButton: {
      width: 65,
      height: 65,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? '#333' : theme.secondaryBackground,
    },
    numberText: {
      fontSize: 28,
      color: theme.textColor,
      fontWeight: '400',
    },
    actionButton: {
      width: 65,
      height: 65,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    errorMessage: {
      color: '#FF4E4E',
      fontSize: 13,
      textAlign: 'center',
      fontWeight: '400',
      marginTop: 4,
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
      <View style={styles.header}>
        <Text style={styles.title}>
          {isChangingPin 
            ? (isVerifyingCurrentPin 
              ? t('enterCurrentPin')
              : isSettingNewPin && confirmPin.length 
                ? t('confirmPinCode')
                : t('setPinCode'))
            : (isSettingPin 
              ? t('setPinCode') 
              : t('enterPinCode'))}
        </Text>
        {isSettingNewPin && !confirmPin.length && (
          <Text style={styles.subtitle}>
            {t('choosePinCode')}
          </Text>
        )}
      </View>

      <View style={styles.dotsContainer}>
        <View style={styles.dotsRow}>
          {renderPinDots()}
        </View>
        {errorMessage && (
          <Text style={styles.errorMessage}>
            {errorMessage}
          </Text>
        )}
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close-outline" size={32} color={theme.textColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => handleNumberPress('0')}
          >
            <Text style={styles.numberText}>0</Text>
          </TouchableOpacity>
          {hasBiometrics && biometricsEnabled && !isSettingNewPin && (!isSettingPin || isChangingPin) ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBiometricAuth}
            >
              <Ionicons 
                name="finger-print-outline" 
                size={32} 
                color={theme.accentColor} 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons 
                name="backspace-outline" 
                size={32} 
                color={theme.textColor} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
} 