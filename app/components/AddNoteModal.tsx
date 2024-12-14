import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Task: undefined;
  // ... άλλα routes
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (type: string) => void;
}

const AddNoteModal = ({ visible, onClose, onSelectOption }: AddNoteModalProps) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const options = [
    { id: 'camera', icon: 'camera', label: t('camera'), color: '#6B4EFF' },
    { id: 'drawing', icon: 'brush', label: t('drawingSketch'), color: '#6B4EFF' },
    { id: 'attach', icon: 'attach', label: t('attachFile'), color: '#6B4EFF' },
    { id: 'audio', icon: 'mic', label: t('audioFile'), color: '#6B4EFF' },
    { id: 'private', icon: 'lock-closed', label: t('privateNotes'), color: '#6B4EFF' },
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.secondaryBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      color: theme.textColor,
      fontSize: 32,
      fontWeight: '600',
      marginBottom: 30,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionText: {
      color: theme.textColor,
      fontSize: 16,
      flex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 12,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 12,
      gap: 8,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
    },
    closeButton: {
      position: 'absolute',
      right: 20,
      bottom: -60,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('whatNotes')}</Text>
          
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.option}
              onPress={() => onSelectOption(option.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon as any} size={24} color="#fff" />
              </View>
              <Text style={styles.optionText}>{option.label}</Text>
              <Ionicons name="chevron-forward" size={24} color={theme.placeholderColor} />
            </TouchableOpacity>
          ))}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#8BC34A' }]}
              onPress={() => onSelectOption('note')}
            >
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.buttonText}>{t('notes')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#6B4EFF' }]}
              onPress={() => {
                console.log('AddNoteModal: Task button pressed');
                onClose();
                setTimeout(() => {
                  console.log('AddNoteModal: Attempting navigation after delay');
                  navigation.navigate('Task');
                }, 100);
              }}
            >
              <Ionicons name="list" size={20} color="#fff" />
              <Text style={styles.buttonText}>{t('task')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

export default AddNoteModal; 