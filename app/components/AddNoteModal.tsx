import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (type: string) => void;
}

const AddNoteModal = ({ visible, onClose, onSelectOption }: AddNoteModalProps) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'flex-end',
    },
    blurContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalContent: {
      backgroundColor: theme.isDarkMode ? 
        theme.secondaryBackground : 
        '#FFFFFF',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 20,
      maxHeight: '50%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: theme.isDarkMode ? 0.2 : 0.1,
      shadowRadius: 8,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.borderColor,
    },
    title: {
      color: theme.textColor,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    mainButton: {
      backgroundColor: theme.isDarkMode ? 
        `${theme.backgroundColor}80` : 
        `${theme.accentColor}10`,
      borderRadius: 20,
      padding: 12,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 3,
      borderLeftColor: theme.accentColor,
    },
    mainButtonText: {
      color: theme.textColor,
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 12,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    optionButton: {
      width: '48%',
      backgroundColor: theme.isDarkMode ? 
        `${theme.backgroundColor}80` : 
        '#F8F9FA',
      borderRadius: 20,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 3,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    optionText: {
      color: theme.textColor,
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    closeButton: {
      position: 'absolute',
      right: 20,
      top: 20,
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.isDarkMode ? 
        theme.secondaryBackground : 
        '#F8F9FA',
      justifyContent: 'center',
      alignItems: 'center',
    },
    animatedContent: {
      transform: [{
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0],
        })
      }],
    },
  });

  const secondaryOptions = [
    {
      id: 'task',
      icon: 'list-outline' as const,
      label: t('newTask'),
      color: '#2196F3',
      onPress: () => {
        onClose();
        setTimeout(() => navigation.navigate('Task', { type: 'task' }), 100);
      },
    },
    {
      id: 'camera',
      icon: 'camera-outline' as const,
      label: t('camera'),
      color: '#9C27B0',
      onPress: () => { onClose(); onSelectOption('camera'); },
    },
    {
      id: 'drawing',
      icon: 'brush-outline' as const,
      label: t('drawingSketch'),
      color: '#FF9800',
      onPress: () => { onClose(); onSelectOption('drawing'); },
    },
    {
      id: 'audio',
      icon: 'mic-outline' as const,
      label: t('audioFile'),
      color: '#00BCD4',
      onPress: () => { onClose(); onSelectOption('audio'); },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView 
          intensity={10}
          tint={theme.isDarkMode ? "dark" : "light"}
          style={styles.blurContainer}
        />
        <Animated.View style={[styles.modalContent, styles.animatedContent]}>
          <Text style={styles.title}>{t('whatNotes')}</Text>

          <TouchableOpacity 
            style={styles.mainButton}
            onPress={() => {
              onClose();
              navigation.navigate('Task', { type: 'text' });
            }}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${theme.accentColor}15` }]}>
              <Ionicons name="document-text" size={24} color={theme.accentColor} />
            </View>
            <Text style={styles.mainButtonText}>{t('addNewNote')}</Text>
          </TouchableOpacity>

          <View style={styles.optionsGrid}>
            {secondaryOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionButton, { borderLeftColor: option.color }]}
                onPress={option.onPress}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                  <Ionicons name={option.icon} size={20} color={option.color} />
                </View>
                <Text style={styles.optionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.textColor} />
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default AddNoteModal; 