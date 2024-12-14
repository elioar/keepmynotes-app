import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  RichText, 
  Toolbar, 
  useEditorBridge,
  darkEditorTheme, 
  darkEditorCss,
  CoreBridge, 
  TenTapStartKit 
} from '@10play/tentap-editor';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TaskScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const backgroundColor = theme.secondaryBackground;

  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '',
    theme: {
      toolbar: {
        toolbarBody: {
          backgroundColor: backgroundColor,
          borderTopColor: theme.borderColor,
          borderTopWidth: 1,
        },
        toolbarButton: {
          backgroundColor: 'transparent',
          padding: 16,
          margin: 4,
          borderRadius: 8,
        },
      },
      webview: {
        backgroundColor: backgroundColor,
      },
    },
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(`
        .ProseMirror {
          background-color: ${backgroundColor} !important;
          color: ${theme.textColor} !important;
          padding: 16px !important;
        }
      `),
      ...(isDarkMode ? [CoreBridge.configureCSS(darkEditorCss)] : []),
    ],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 8 : 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      backgroundColor: backgroundColor,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    saveText: {
      color: theme.accentColor,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 4,
    },
    editorContainer: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    editor: {
      flex: 1,
      padding: 16,
      paddingTop: 20,
      marginLeft: 16,
      marginRight: 16,
      backgroundColor: backgroundColor,
    },
    keyboardAvoidingView: {
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      backgroundColor: backgroundColor,
      position: 'absolute',
      bottom: 0,
    },
    toolbarContainer: {
      backgroundColor: backgroundColor,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      padding: 16,
    },
    toolbarButton: {
      padding: 12,
      marginHorizontal: 4,
      borderRadius: 8,
    },
    toolbarButtonActive: {
      backgroundColor: '#6B4EFF',
    },
    toolbarIcon: {
      width: 24,
      height: 24,
      color: theme.textColor,
    },
    toolbarIconActive: {
      color: 'white',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.textColor} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('newTask')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => {
              console.log('Saving:', editor.getHTML());
              navigation.goBack();
            }}
          >
            <Ionicons name="save-outline" size={20} color={theme.accentColor} />
            <Text style={styles.saveText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.editorContainer}>
          <RichText 
            editor={editor}
            placeholder={t('writeYourTask')}
            placeholderColor={theme.placeholderColor}
            textColor={theme.textColor}
            style={styles.editor}
            backgroundColor={backgroundColor}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 