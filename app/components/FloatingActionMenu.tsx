import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface FloatingActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (type: string) => void;
  buttonPosition: { x: number; y: number };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FloatingActionMenu = ({ visible, onClose, onSelectOption, buttonPosition }: FloatingActionMenuProps) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const noteSlideX = useRef(new Animated.Value(-200)).current;
  const taskSlideX = useRef(new Animated.Value(200)).current;
  const noteScale = useRef(new Animated.Value(0.3)).current;
  const taskScale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      noteSlideX.setValue(-200);
      taskSlideX.setValue(200);
      noteScale.setValue(0.3);
      taskScale.setValue(0.3);
      
      Animated.parallel([
        // Background fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Note card slide in with bounce
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.spring(noteSlideX, {
              toValue: 0,
              tension: 50,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.spring(noteScale, {
              toValue: 1,
              tension: 50,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Task card slide in with bounce
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.spring(taskSlideX, {
              toValue: 0,
              tension: 50,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.spring(taskScale, {
              toValue: 1,
              tension: 50,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(noteSlideX, {
            toValue: -200,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(taskSlideX, {
            toValue: 200,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(noteScale, {
            toValue: 0.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(taskScale, {
            toValue: 0.3,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible]);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    blurContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    actionCard: {
      position: 'absolute',
      width: 120,
      height: 80,
      borderRadius: 20,
      backgroundColor: theme.isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: theme.isDarkMode ? 0.4 : 0.15,
      shadowRadius: 16,
      elevation: 16,
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      shadowColor: theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    actionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      textAlign: 'center',
    },
  });

  // Calculate positions for the action cards (horizontal layout)
  const notePosition = {
    left: buttonPosition.x - 140,
    top: buttonPosition.y - 50,
  };

  const taskPosition = {
    left: buttonPosition.x + 20,
    top: buttonPosition.y - 50,
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
          activeOpacity={1}
        >
          <BlurView 
            intensity={theme.isDarkMode ? 30 : 20}
            tint={theme.isDarkMode ? "dark" : "light"}
            style={styles.blurContainer}
          />
        </TouchableOpacity>
        
        {/* Note Action Card */}
        <Animated.View
          style={[
            styles.actionCard,
            notePosition,
            {
              transform: [
                { translateX: noteSlideX },
                { scale: noteScale },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              onClose();
              onSelectOption('note');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={22} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>{t('addNewNote')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Task Action Card */}
        <Animated.View
          style={[
            styles.actionCard,
            taskPosition,
            {
              transform: [
                { translateX: taskSlideX },
                { scale: taskScale },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              onClose();
              onSelectOption('task');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="checkbox" size={22} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>{t('addNewTask')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default FloatingActionMenu;
