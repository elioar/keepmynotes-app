import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onSubmit: (name: string) => void;
  onClose?: () => void;
}

export default function UsernameModal({ visible, onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name);
      setName('');
    }
  };

  const handleClose = () => {
    setName('');
    if (onClose) {
      onClose();
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '85%',
      maxWidth: 320,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 20,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    input: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.textColor,
      marginBottom: 20,
    },
    button: {
      backgroundColor: theme.accentColor,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>{t('enterYourName')}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={20} color={theme.textColor} />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder={t('yourName')}
                placeholderTextColor={theme.placeholderColor}
                value={name}
                onChangeText={setName}
                autoFocus
                onSubmitEditing={handleSubmit}
              />

              <TouchableOpacity 
                style={styles.button}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>{t('continue')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
} 