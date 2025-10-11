import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../context/OnboardingContext';
import { useNotes } from '../NotesContext';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'welcome' as const,
    description: 'welcomeDescription' as const,
    icon: 'document-text-outline',
    color: '#4CAF50',
    image: require('../../assets/images/splash-icon.png'),
  },
  {
    id: '2',
    title: 'organize' as const,
    description: 'organizeDescription' as const,
    icon: 'folder-open-outline',
    color: '#2196F3',
    image: require('../../assets/images/3dicons-folder-new-front-color.png'),
  },
  {
    id: '3',
    title: 'secure' as const,
    description: 'secureDescription' as const,
    icon: 'shield-checkmark-outline',
    color: '#9C27B0',
    image: require('../../assets/images/3dicons-shield-front-color.png'),
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { t, setLanguage, currentLanguage } = useLanguage();
  const { setFirstLaunchComplete } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const { notes } = useNotes();

  // Filter out tasks from notes
  const displayNotes = notes.filter(note => note.type !== 'task' && !note.isHidden);

  const handleGetStarted = async () => {
    await setFirstLaunchComplete();
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true
      });
      setCurrentIndex(nextIndex);
    } else {
      handleGetStarted();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: height * 0.7,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    imageContainer: {
      width: width,
      height: height * 0.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: width * 0.4,
      height: width * 0.4,
      resizeMode: 'contain',
    },
    textContainer: {
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingBottom: 40,
    },
    title: {
      fontSize: 40,
      fontWeight: '800',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    description: {
      fontSize: 18,
      color: theme.placeholderColor,
      textAlign: 'center',
      lineHeight: 28,
      maxWidth: '90%',
    },
    footer: {
      width: '100%',
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === 'ios' ? 50 : 30,
      alignItems: 'center',
    },
    pagination: {
      flexDirection: 'row',
      marginBottom: 32,
      alignItems: 'center',
      justifyContent: 'center',
      height: 8,
      gap: 8,
    },
    dot: {
      width: 20,
      height: 6,
      borderRadius: 3,
      backgroundColor: `${theme.textColor}15`,
    },
    activeDot: {
      backgroundColor: theme.accentColor,
    },
    button: {
      backgroundColor: theme.accentColor,
      paddingHorizontal: 40,
      paddingVertical: 18,
      borderRadius: 20,
      width: '100%',
      alignItems: 'center',
      shadowColor: theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 12,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
    },
    skipButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: 24,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderWidth: 1,
      borderColor: theme.isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    },
    skipText: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '600',
    },
    languageSelector: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 60,
      left: 24,
      flexDirection: 'row',
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
      borderRadius: 12,
      padding: 3,
      zIndex: 1,
    },
    languageButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    activeLanguage: {
      backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
    },
    languageText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textColor,
      opacity: 0.7,
    },
    activeLanguageText: {
      opacity: 1,
    },
    flagEmoji: {
      fontSize: 16,
    },
  });

  const renderSlide = (index: number) => {
    const item = slides[index];
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
    });

    return (
      <View key={item.id} style={{ width }}>
        <Animated.View style={[styles.imageContainer, { transform: [{ scale }], opacity }]}>
          <Image source={item.image} style={styles.image} />
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t(item.title)}</Text>
          <Text style={styles.description}>{t(item.description)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme.isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.languageSelector}>
        <TouchableOpacity 
          style={[
            styles.languageButton,
            currentLanguage === 'en' && styles.activeLanguage
          ]} 
          onPress={() => setLanguage('en')}
        >
          <Text style={styles.flagEmoji}>🇬🇧</Text>
          <Text style={[
            styles.languageText,
            currentLanguage === 'en' && styles.activeLanguageText
          ]}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.languageButton,
            currentLanguage === 'el' && styles.activeLanguage
          ]} 
          onPress={() => setLanguage('el')}
        >
          <Text style={styles.flagEmoji}>🇬🇷</Text>
          <Text style={[
            styles.languageText,
            currentLanguage === 'el' && styles.activeLanguageText
          ]}>EL</Text>
        </TouchableOpacity>
      </View>
      <LinearGradient
        colors={theme.isDarkMode ? 
          ['#2E1D5999', theme.backgroundColor] : 
          ['#F0E5FF99', theme.backgroundColor]
        }
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
        >
          {slides.map((_, index) => renderSlide(index))}
        </Animated.ScrollView>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((_, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const scaleX = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.5, 1, 0.5],
                extrapolate: 'clamp',
              });

              const backgroundColor = scrollX.interpolate({
                inputRange,
                outputRange: [
                  `${theme.textColor}15`,
                  theme.accentColor,
                  `${theme.textColor}15`,
                ],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      opacity,
                      backgroundColor,
                      transform: [{ scaleX }],
                    },
                  ]}
                />
              );
            })}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {currentIndex === slides.length - 1 ? t('getStarted') : t('next')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
} 