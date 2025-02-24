import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'success';
  icon?: string;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = 'warning',
  icon = 'alert-circle-outline'
}: ConfirmationModalProps) {
  const { theme } = useTheme();

  const getTypeColor = () => {
    switch (type) {
      case 'danger':
        return '#FF4B4B';
      case 'warning':
      case 'success':
      default:
        return theme.accentColor;
    }
  };

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.isDarkMode ? '#1A1A1A' : theme.backgroundColor,
      borderRadius: 20,
      width: '100%',
      maxWidth: 340,
      padding: 24,
      shadowColor: theme.isDarkMode ? '#000' : theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: theme.isDarkMode ? 0.4 : 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    iconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: getTypeColor() + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 10,
      letterSpacing: -0.4,
    },
    message: {
      fontSize: 16,
      color: theme.textColor + '90',
      marginBottom: 28,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    cancelButton: {
      backgroundColor: theme.isDarkMode ? '#2A2A2A' : theme.secondaryBackground,
      borderWidth: 1.5,
      borderColor: theme.isDarkMode ? '#3A3A3A' : theme.borderColor,
    },
    confirmButton: {
      backgroundColor: getTypeColor(),
      shadowColor: getTypeColor(),
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.3,
    },
    cancelText: {
      color: theme.textColor,
    },
    confirmText: {
      color: '#FFFFFF',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={28} color={getTypeColor()} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, styles.confirmText]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 