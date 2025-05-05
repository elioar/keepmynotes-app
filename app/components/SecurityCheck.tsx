import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  AddEditNote: { note?: any };
  Favorites: undefined;
  HiddenNotes: undefined;
  PinScreen: { isChangingPin?: boolean; redirectTo: string };
  SecurityCheck: undefined;
};

export default function SecurityCheck() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    authenticate();
  }, []);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        // Δεν υπάρχει υποστήριξη βιομετρικών, χρήση PIN
        navigation.navigate('PinScreen', { redirectTo: 'HiddenNotes' });
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to view hidden notes',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        navigation.navigate('HiddenNotes');
      } else {
        // Ο έλεγχος απέτυχε ή ακυρώθηκε, χρήση PIN
        navigation.navigate('PinScreen', { redirectTo: 'HiddenNotes' });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      // Σε περίπτωση σφάλματος, χρήση PIN
      navigation.navigate('PinScreen', { redirectTo: 'HiddenNotes' });
    }
  };

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
}); 