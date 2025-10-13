import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { TAG_COLORS, TagColor } from '../constants/tags';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const slideAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 400,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.setValue(event.translationY);
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        // Close the modal
        Animated.timing(translateY, {
          toValue: 400,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onClose();
        });
      } else {
        // Spring back
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
        }).start();
      }
    });

  const handleHide = async () => {
    if (!isHidden) {
      try {
        const hasPin = await AsyncStorage.getItem('@secure_pin');
        if (!hasPin) {
          onClose();
          navigation.navigate('PinScreen' as never);
          return;
        }
      } catch (error) {
        console.error('Error checking PIN:', error);
        return;
      }
    }
    onClose();
    onHide();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.isDarkMode ? 
        theme.secondaryBackground : 
        '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 6,
      paddingHorizontal: 18,
      paddingBottom: 24,
      maxHeight: '60%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    headerArea: {
      paddingVertical: 8,
    },
    handle: {
      width: 36,
      height: 3,
      backgroundColor: theme.placeholderColor + '40',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: {
      color: theme.textColor,
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 0.2,
      flex: 1,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.1)' : 
        'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsContainer: {
      marginBottom: 8,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },
    option: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 14,
      backgroundColor: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.05)' : 
        'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.08)' : 
        'rgba(0, 0, 0, 0.06)',
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    optionContent: {
      alignItems: 'center',
    },
    optionTitle: {
      color: theme.textColor,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    optionSubtitle: {
      color: theme.placeholderColor,
      fontSize: 10,
      fontWeight: '400',
      textAlign: 'center',
      marginTop: 2,
    },
    dangerOption: {
      backgroundColor: theme.isDarkMode ? 
        'rgba(255, 78, 78, 0.12)' : 
        'rgba(255, 78, 78, 0.08)',
      borderColor: 'rgba(255, 78, 78, 0.25)',
    },
    dangerIconContainer: {
      backgroundColor: 'rgba(255, 78, 78, 0.15)',
    },
    dangerText: {
      color: '#FF4E4E',
    },
    tagsSection: {
      marginTop: 12,
      marginBottom: 12,
    },
    tagsSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    tagsSectionIcon: {
      width: 24,
      height: 24,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    tagsSectionTitle: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.1,
    },
    tagsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: theme.isDarkMode ? 1.5 : 1,
      marginBottom: 2,
      shadowColor: theme.isDarkMode ? '#000' : 'transparent',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    tagIconContainer: {
      width: 22,
      height: 22,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 7,
    },
    tagText: {
      fontSize: 13,
      fontWeight: '600',
    },
    selectedTag: {
      borderWidth: theme.isDarkMode ? 2 : 1.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    animatedContent: {
      transform: [{ translateY }],
      opacity: slideAnim,
    },
  });

  const renderActionButton = (
    icon: string,
    title: string,
    onPress: () => void,
    gradientColors: string[],
    isDanger = false,
    delay = 0
  ) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300, delay }}
      style={{ flex: 1 }}
    >
      <TouchableOpacity
        style={[styles.option, isDanger && styles.dangerOption]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isDanger ? ['#FF4E4E', '#FF6B9D'] : gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconContainer, isDanger && styles.dangerIconContainer]}
        >
          <Ionicons
            name={icon as any}
            size={18}
            color="#FFF"
          />
        </LinearGradient>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, isDanger && styles.dangerText]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContent, styles.animatedContent]}>
          {/* Draggable Handle Area */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.headerArea}>
              <View style={styles.handle} />
              <View style={styles.headerRow}>
                <Text style={styles.title}>{t('noteOptions')}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.textColor} />
                </TouchableOpacity>
              </View>
            </View>
          </GestureDetector>

          <ScrollView 
            style={styles.optionsContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Actions Row */}
            <View style={styles.actionsRow}>
              {/* Edit Button */}
              {renderActionButton(
                'create-outline', 
                t('edit'),
                onEdit,
                ['#667eea', '#764ba2'],
                false,
                0
              )}

              {/* Hide/Unhide Button */}
              {renderActionButton(
                isHidden ? 'eye-outline' : 'eye-off-outline',
                isHidden ? t('unhide') : t('hide'),
                isHidden ? handleHide : onHide,
                ['#f093fb', '#f5576c'],
                false,
                50
              )}

              {/* Delete Button */}
              {renderActionButton(
                'trash-outline', 
                t('delete'),
                onDelete, 
                ['#FF4E4E', '#FF6B9D'],
                true,
                100
              )}
            </View>

            {/* Tags Section */}
            <View style={styles.tagsSection}>
              <View style={styles.tagsSectionHeader}>
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tagsSectionIcon}
                >
                  <Ionicons name="pricetags" size={12} color="#FFF" />
                </LinearGradient>
                <Text style={styles.tagsSectionTitle}>{t('tags')}</Text>
              </View>
              
              <View style={styles.tagsGrid}>
                {(Object.keys(TAG_COLORS) as TagColor[]).map((color, index) => (
                  <MotiView
                    key={color}
                    from={{ opacity: 0, scale: 0.9, translateY: 10 }}
                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                    transition={{ 
                      type: 'spring', 
                      damping: 15, 
                      stiffness: 300,
                      delay: index * 20 
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.tagButton,
                        {
                          borderColor: TAG_COLORS[color] === 'transparent' 
                            ? theme.borderColor 
                            : TAG_COLORS[color],
                          backgroundColor: currentColor === color 
                            ? (TAG_COLORS[color] === 'transparent' ? theme.accentColor + '20' : TAG_COLORS[color] + '20')
                            : (theme.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                          ...(currentColor === color && styles.selectedTag),
                        },
                      ]}
                      onPress={() => onColorChange(color === 'none' ? null : color)}
                      activeOpacity={0.7}
                    >
                      <View 
                        style={[
                          styles.tagIconContainer,
                          { 
                            backgroundColor: TAG_COLORS[color] === 'transparent' 
                              ? theme.accentColor + '30' 
                              : TAG_COLORS[color] + '30'
                          }
                        ]}
                      >
                        <Ionicons
                          name={TAG_ICONS[color]}
                          size={11}
                          color={TAG_COLORS[color] === 'transparent' ? theme.textColor : TAG_COLORS[color]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.tagText,
                          { 
                            color: currentColor === color 
                              ? (TAG_COLORS[color] === 'transparent' ? theme.textColor : TAG_COLORS[color])
                              : theme.textColor
                          },
                        ]}
                      >
                        {TAG_LABELS[color]}
                      </Text>
                    </TouchableOpacity>
                  </MotiView>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default NoteActionMenu; 