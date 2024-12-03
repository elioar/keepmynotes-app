import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface UsernameModalProps {
  visible: boolean;
  onSubmit: (username: string) => void;
}

export default function UsernameModal({ visible, onSubmit }: UsernameModalProps) {
  const [name, setName] = useState('');
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onSubmit(trimmedName);
      setName('');
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }: any) => {
    if (key === 'Enter') {
      handleSubmit();
    }
  };

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modal: {
      backgroundColor: theme.backgroundColor,
      padding: 24,
      borderRadius: 16,
      width: '85%',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      backgroundColor: theme.secondaryBackground,
      padding: 16,
      borderRadius: 12,
      color: theme.textColor,
      marginBottom: 20,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.placeholderColor,
    },
    button: {
      backgroundColor: theme.accentColor,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },
    buttonDisabled: {
      backgroundColor: theme.backgroundColor, // Changed to use existing theme property
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t('enterYourName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('yourName')}
            placeholderTextColor={theme.placeholderColor}
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleSubmit}
            autoFocus
            returnKeyType="done"
          />
          <TouchableOpacity 
            style={[
              styles.button,
              !name.trim() && styles.buttonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={styles.buttonText}>{t('continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
} 