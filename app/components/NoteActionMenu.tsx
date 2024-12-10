import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface NoteActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHide: () => void;
  isHidden?: boolean;
}

export default function NoteActionMenu({
  visible,
  onClose,
  onEdit,
  onDelete,
  onHide,
  isHidden = false,
}: NoteActionMenuProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const actions = [
    {
      id: 'edit',
      icon: 'pencil-outline',
      label: t('edit'),
      onPress: onEdit,
      color: theme.accentColor,
    },
    {
      id: 'hide',
      icon: isHidden ? 'eye-outline' : 'eye-off-outline',
      label: isHidden ? t('unhide') : t('hide'),
      onPress: onHide,
      color: theme.accentColor,
    },
    {
      id: 'delete',
      icon: 'trash-outline',
      label: t('delete'),
      onPress: onDelete,
      color: '#FF4E4E',
      danger: true,
    },
  ];

  const renderAction = (action: any) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.actionButton,
        action.danger && styles.dangerButton,
        { backgroundColor: theme.secondaryBackground }
      ]}
      onPress={() => {
        action.onPress();
        onClose();
      }}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: `${action.color}15` }
      ]}>
        <Ionicons
          name={action.icon}
          size={22}
          color={action.color}
        />
      </View>
      <Text style={[
        styles.actionText,
        { color: action.danger ? '#FF4E4E' : theme.textColor }
      ]}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[
          styles.container,
          { backgroundColor: theme.backgroundColor }
        ]}>
          <Text style={[styles.title, { color: theme.textColor }]}>
            {t('noteOptions')}
          </Text>
          <View style={styles.actionsContainer}>
            {actions.map(renderAction)}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '90%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  dangerButton: {
    backgroundColor: '#FF4E4E10',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 