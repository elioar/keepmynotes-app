import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BlurView } from 'expo-blur';
import { TAG_COLORS, TagColor } from '../constants/tags';

interface TagTranslations {
  tagColors: {
    [K in TagColor]: string;
  };
}

const TAG_ICONS: Record<TagColor, keyof typeof Ionicons.glyphMap> = {
  none: 'remove-outline',
  green: 'person-outline',
  purple: 'briefcase-outline',
  blue: 'book-outline',
  orange: 'bulb-outline',
  red: 'alert-circle-outline'
};

const TAG_LABELS: Record<TagColor, string> = {
  none: 'No Category',
  green: 'Personal',
  purple: 'Work',
  blue: 'Study',
  orange: 'Ideas',
  red: 'Important'
};

interface NoteActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHide: () => void;
  onColorChange: (color: TagColor | null) => void;
  currentColor: TagColor | null;
  isHidden: boolean;
}

const NoteActionMenu = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  onHide,
  onColorChange,
  currentColor,
  isHidden,
}: NoteActionMenuProps) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
      maxHeight: '80%',
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.borderColor,
    },
    title: {
      color: theme.textColor,
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 20,
    },
    optionsContainer: {
      marginBottom: 20,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: theme.isDarkMode ? 
        `${theme.backgroundColor}80` : 
        theme.secondaryBackground,
    },
    optionText: {
      color: theme.textColor,
      fontSize: 16,
      marginLeft: 12,
      fontWeight: '500',
    },
    dangerOption: {
      backgroundColor: '#FF4E4E15',
    },
    dangerText: {
      color: '#FF4E4E',
    },
    closeButton: {
      position: 'absolute',
      right: 20,
      top: 20,
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tagsSection: {
      marginTop: 20,
      marginBottom: 20,
    },
    tagsSectionTitle: {
      color: theme.textColor,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
      marginLeft: 4,
    },
    tagsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
    },
    tagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
      backgroundColor: theme.secondaryBackground,
      minWidth: '45%',
    },
    tagIcon: {
      marginRight: 8,
    },
    tagText: {
      fontSize: 14,
      fontWeight: '500',
    },
    selectedTag: {
      backgroundColor: `${theme.accentColor}15`,
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

  const renderActionButton = (
    icon: string,
    text: string,
    onPress: () => void,
    isDanger = false
  ) => (
    <TouchableOpacity
      style={[styles.option, isDanger && styles.dangerOption]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={isDanger ? '#FF4E4E' : theme.textColor}
      />
      <Text style={[styles.optionText, isDanger && styles.dangerText]}>
        {text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView 
          intensity={10}
          tint={theme.isDarkMode ? "dark" : "light"}
          style={styles.blurContainer}
        />
        <Animated.View style={[styles.modalContent, styles.animatedContent]}>
          <Text style={styles.title}>{t('noteOptions')}</Text>

          <ScrollView style={styles.optionsContainer}>
            {renderActionButton('create-outline', t('edit'), onEdit)}
            {renderActionButton(
              isHidden ? 'eye-outline' : 'eye-off-outline',
              isHidden ? t('unhide') : t('hide'),
              onHide
            )}

            <View style={styles.tagsSection}>
              <Text style={styles.tagsSectionTitle}>{t('tags')}</Text>
              <View style={styles.tagsGrid}>
                {(Object.keys(TAG_COLORS) as TagColor[]).map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.tagButton,
                      {
                        borderColor: TAG_COLORS[color],
                        ...(currentColor === color && styles.selectedTag),
                      },
                    ]}
                    onPress={() => onColorChange(color === 'none' ? null : color)}
                  >
                    <Ionicons
                      name={TAG_ICONS[color]}
                      size={18}
                      color={TAG_COLORS[color] === 'transparent' ? theme.textColor : TAG_COLORS[color]}
                      style={styles.tagIcon}
                    />
                    <Text
                      style={[
                        styles.tagText,
                        { color: TAG_COLORS[color] === 'transparent' ? theme.textColor : TAG_COLORS[color] },
                      ]}
                    >
                      {TAG_LABELS[color]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderActionButton('trash-outline', t('delete'), onDelete, true)}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.textColor} />
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default NoteActionMenu; 