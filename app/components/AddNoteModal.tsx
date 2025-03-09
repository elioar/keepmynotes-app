import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOTTOM_OFFSET = Platform.OS === 'ios' ? 100 : 80;

const AddNoteModal = ({ visible, onClose, onSelectOption }: AddNoteModalProps) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const menuAnim = React.useRef(new Animated.Value(0)).current;
  const bgAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(menuAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(menuAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
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
      backgroundColor: theme.isDarkMode ? 
        'rgba(0, 0, 0, 0.85)' : 
        'rgba(0, 0, 0, 0.4)',
    },
    menuContainer: {
      backgroundColor: theme.isDarkMode ? 
        'rgba(25, 25, 25, 0.98)' : 
        'rgba(255, 255, 255, 0.98)',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingBottom: Math.max(BOTTOM_OFFSET - 20, 30),
      shadowColor: '#000',
      shadowOffset: { 
        width: 0, 
        height: -4
      },
      shadowOpacity: theme.isDarkMode ? 0.4 : 0.1,
      shadowRadius: 12,
      elevation: 20,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    optionsContainer: {
      paddingHorizontal: 16,
      gap: 12,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.isDarkMode ? 
        'rgba(45, 45, 45, 0.98)' : 
        'rgba(245, 245, 245, 0.98)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.08)' : 
        'rgba(0, 0, 0, 0.05)',
    },
    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.isDarkMode ? 
        `${theme.accentColor}20` : 
        `${theme.accentColor}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.95)' : 
        'rgba(0, 0, 0, 0.9)',
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 13,
      color: theme.isDarkMode ? 
        'rgba(255, 255, 255, 0.6)' : 
        'rgba(0, 0, 0, 0.6)',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[
          styles.blurContainer,
          {
            opacity: bgAnim
          }
        ]}>
          <BlurView 
            intensity={theme.isDarkMode ? 40 : 25}
            tint={theme.isDarkMode ? "dark" : "light"}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <Animated.View style={[
          styles.menuContainer,
          {
            transform: [{
              translateY: menuAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0]
              })
            }]
          }
        ]}>
          <View style={styles.handle} />
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.option}
              activeOpacity={0.6}
              onPress={() => {
                onClose();
                navigation.navigate('Task', { type: 'text' });
              }}
            >
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="document-text" 
                  size={24} 
                  color={theme.accentColor} 
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{t('addNewNote')}</Text>
                <Text style={styles.optionDescription}>{t('textNotes')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.option}
              activeOpacity={0.6}
              onPress={() => {
                onClose();
                navigation.navigate('Task', { type: 'task' });
              }}
            >
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="list" 
                  size={24} 
                  color={theme.accentColor} 
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{t('newTask')}</Text>
                <Text style={styles.optionDescription}>{t('taskDescription')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default AddNoteModal; 