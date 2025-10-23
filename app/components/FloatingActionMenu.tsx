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
import { LinearGradient } from 'expo-linear-gradient';
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
  const noteSlideY = useRef(new Animated.Value(80)).current;
  const taskSlideY = useRef(new Animated.Value(80)).current;
  const noteScale = useRef(new Animated.Value(0.5)).current;
  const taskScale = useRef(new Animated.Value(0.5)).current;
  const noteOpacity = useRef(new Animated.Value(0)).current;
  const taskOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      noteSlideY.setValue(80);
      taskSlideY.setValue(80);
      noteScale.setValue(0.5);
      taskScale.setValue(0.5);
      noteOpacity.setValue(0);
      taskOpacity.setValue(0);
      
      Animated.parallel([
        // Background fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        // Note card smooth entrance
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(noteOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(noteSlideY, {
              toValue: 0,
              tension: 80,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.spring(noteScale, {
              toValue: 1,
              tension: 80,
              friction: 10,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Task card smooth entrance
        Animated.sequence([
          Animated.delay(250),
          Animated.parallel([
            Animated.timing(taskOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(taskSlideY, {
              toValue: 0,
              tension: 80,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.spring(taskScale, {
              toValue: 1,
              tension: 80,
              friction: 10,
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
          Animated.timing(noteOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(taskOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(noteSlideY, {
            toValue: 80,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(taskSlideY, {
            toValue: 80,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(noteScale, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(taskScale, {
            toValue: 0.5,
            duration: 200,
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
    actionCard: {
      position: 'absolute',
      width: 140,
      height: 45,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 25,
    },
    actionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
      letterSpacing: 0.5,
      marginLeft: 8,
    },
  });

  // Calculate positions for the action cards (horizontal layout)
  const notePosition = {
    left: buttonPosition.x - 150,
    top: buttonPosition.y - 10,
  };

  const taskPosition = {
    left: buttonPosition.x + 10,
    top: buttonPosition.y - 10,
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={[StyleSheet.absoluteFill, {
            backgroundColor: theme.isDarkMode 
              ? 'rgba(0, 0, 0, 0.4)' 
              : 'rgba(0, 0, 0, 0.2)'
          }]} 
          onPress={onClose}
          activeOpacity={1}
        />
        
        {/* Note Action Card */}
        <Animated.View
          style={[
            styles.actionCard,
            notePosition,
            {
              transform: [
                { translateY: noteSlideY },
                { scale: noteScale },
              ],
              opacity: noteOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}
            onPress={() => {
              onClose();
              onSelectOption('note');
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                borderRadius: 25,
              }}
            >
              <Ionicons name="document-text" size={18} color="#fff" />
              <Text style={styles.actionTitle}>{t('addNewNote')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Task Action Card */}
        <Animated.View
          style={[
            styles.actionCard,
            taskPosition,
            {
              transform: [
                { translateY: taskSlideY },
                { scale: taskScale },
              ],
              opacity: taskOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}
            onPress={() => {
              onClose();
              onSelectOption('task');
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                borderRadius: 25,
              }}
            >
              <Ionicons name="checkbox" size={18} color="#fff" />
              <Text style={styles.actionTitle}>{t('addNewTask')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default FloatingActionMenu;
