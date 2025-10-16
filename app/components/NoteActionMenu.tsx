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
  Dimensions,
  Platform,
  Easing,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_OFFSET = Platform.OS === 'ios' ? 100 : 80;

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
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        // Background overlay fade-in
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Modal slide-up with smooth easing
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Custom easing curve
        }),
        // Content fade-in
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        // Subtle scale animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        })
      ]).start();
    } else {
      Animated.parallel([
        // Background overlay fade-out with smooth timing
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        // Modal slide-down with smooth easing
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        // Content fade-out with smooth timing
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        // Scale animation with smooth easing
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      ]).start();
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        // Smooth drag with improved scaling
        const progress = Math.min(event.translationY / SCREEN_HEIGHT, 1);
        translateY.setValue(event.translationY);
        
        // More subtle scale effect during drag
        const scaleValue = Math.max(0.96, 1 - (progress * 0.04));
        scaleAnim.setValue(scaleValue);
        
        // Subtle overlay opacity change during drag
        const overlayValue = Math.max(0.3, 1 - (progress * 0.7));
        overlayOpacity.setValue(overlayValue);
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        // Close the modal with smooth animation
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        ]).start(() => {
          onClose();
        });
      } else {
        // Spring back with improved physics
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 25,
            stiffness: 400,
            mass: 0.8,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 25,
            stiffness: 400,
            mass: 0.8,
          })
        ]).start();
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
    backgroundOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.isDarkMode ? 
        'rgba(0, 0, 0, 0.85)' : 
        'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
      backgroundColor: theme.isDarkMode ? 
        theme.secondaryBackground : 
        '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 6,
      paddingHorizontal: 18,
      paddingBottom: Math.max(BOTTOM_OFFSET - 20, 30),
      maxHeight: SCREEN_HEIGHT * 0.7,
      minHeight: SCREEN_HEIGHT * 0.3,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: theme.isDarkMode ? 0.4 : 0.1,
      shadowRadius: 12,
      elevation: 20,
    },
    headerArea: {
      paddingVertical: 12,
      paddingBottom: 16,
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
      gap: Math.max(8, SCREEN_HEIGHT * 0.01),
      marginBottom: 16,
      paddingHorizontal: 4,
      justifyContent: 'space-between',
    },
    option: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Math.max(12, SCREEN_HEIGHT * 0.015),
      paddingHorizontal: Math.max(4, SCREEN_HEIGHT * 0.005),
      borderRadius: 16,
      backgroundColor: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.05)' : 
        'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.08)' : 
        'rgba(0, 0, 0, 0.06)',
      marginHorizontal: 2,
      minHeight: Math.max(80, SCREEN_HEIGHT * 0.1),
    },
    iconContainer: {
      width: Math.max(36, SCREEN_HEIGHT * 0.045),
      height: Math.max(36, SCREEN_HEIGHT * 0.045),
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Math.max(6, SCREEN_HEIGHT * 0.008),
    },
    optionContent: {
      alignItems: 'center',
    },
    optionTitle: {
      color: theme.textColor,
      fontSize: Math.max(13, SCREEN_HEIGHT * 0.017),
      fontWeight: '600',
      textAlign: 'center',
      letterSpacing: 0.2,
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
      gap: Math.max(6, SCREEN_HEIGHT * 0.008),
      justifyContent: 'space-between',
    },
    tagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Math.max(6, SCREEN_HEIGHT * 0.008),
      paddingHorizontal: Math.max(10, SCREEN_HEIGHT * 0.012),
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
      minWidth: Math.max(80, SCREEN_HEIGHT * 0.1),
      justifyContent: 'center',
    },
    tagIconContainer: {
      width: Math.max(20, SCREEN_HEIGHT * 0.025),
      height: Math.max(20, SCREEN_HEIGHT * 0.025),
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Math.max(6, SCREEN_HEIGHT * 0.007),
    },
    tagText: {
      fontSize: Math.max(12, SCREEN_HEIGHT * 0.015),
      fontWeight: '600',
    },
    selectedTag: {
      borderWidth: theme.isDarkMode ? 2 : 1.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    animatedContent: {
      transform: [{ translateY }, { scale: scaleAnim }],
      opacity: slideAnim,
    },
    contentContainer: {
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
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        type: 'spring', 
        damping: 20, 
        stiffness: 200, 
        delay,
        mass: 0.8
      }}
      style={{ flex: 1 }}
    >
      <TouchableOpacity
        style={[styles.option, isDanger && styles.dangerOption]}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <LinearGradient
          colors={isDanger ? ['#FF4E4E', '#FF6B9D'] : gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconContainer, isDanger && styles.dangerIconContainer]}
        >
          <Ionicons
            name={icon as any}
            size={Math.max(16, SCREEN_HEIGHT * 0.02)}
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
        {/* Background Overlay with fade animation */}
        <Animated.View style={[styles.backgroundOverlay, { opacity: overlayOpacity }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        
        {/* Modal Content */}
        <Animated.View style={[styles.modalContent, { transform: [{ translateY }, { scale: scaleAnim }] }]}>
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

          {/* Animated Content Container */}
          <Animated.View style={[styles.contentContainer, { opacity: slideAnim }]}>
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
                  <Ionicons name="pricetags" size={Math.max(10, SCREEN_HEIGHT * 0.012)} color="#FFF" />
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
                          size={Math.max(10, SCREEN_HEIGHT * 0.012)}
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
        </Animated.View>
      </View>
    </Modal>
  );
};

export default NoteActionMenu; 