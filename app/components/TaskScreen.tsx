import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotes } from '../NotesContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import WebView from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TaskScreen({ route }: { route: any }) {
  const editorRef = useRef<WebView>(null);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { addNote, updateNote } = useNotes();
  const navigation = useNavigation();
  
  const existingNote = route.params?.note;
  const [noteContent, setNoteContent] = useState(existingNote?.content || '');
  const [title, setTitle] = useState(existingNote?.title || '');

  const editorHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, system-ui;
            color: ${theme.textColor};
            background-color: ${theme.backgroundColor};
            overscroll-behavior-y: none;
            -webkit-user-select: text;
            user-select: text;
          }

          #editor {
            width: 100%;
            min-height: calc(100vh - 120px);
            outline: none;
            padding: 16px;
            font-size: 16px;
            line-height: 1.5;
            caret-color: ${theme.accentColor};
            background-color: ${theme.backgroundColor};
          }

          #editor:empty:before {
            content: "${t('writeYourNote')}";
            color: ${theme.textColor}80;
            pointer-events: none;
            position: absolute;
          }

          .toolbar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 8px;
            background: ${theme.backgroundColor};
            border-top: 1px solid ${theme.borderColor};
            display: flex;
            justify-content: space-around;
            gap: 8px;
          }

          .toolbar button {
            flex: 1;
            max-width: 80px;
            padding: 8px;
            background: ${theme.secondaryBackground};
            border: 1px solid ${theme.borderColor};
            border-radius: 6px;
            color: ${theme.textColor};
            font-weight: bold;
            font-size: 16px;
          }

          .toolbar button.active {
            background: ${theme.accentColor};
            color: white;
            border-color: ${theme.accentColor};
          }
        </style>
      </head>
      <body>
        <div id="editor" contenteditable="true">${existingNote?.content || ''}</div>
        <div class="toolbar">
          <button id="bold" onclick="format('bold')"><b>B</b></button>
          <button id="italic" onclick="format('italic')"><i>I</i></button>
          <button id="underline" onclick="format('underline')"><u>U</u></button>
          <button id="list" onclick="format('insertUnorderedList')">•</button>
        </div>

        <script>
          const editor = document.getElementById('editor');
          const buttons = document.querySelectorAll('.toolbar button');

          function format(command) {
            document.execCommand(command, false, null);
            updateButtons();
            notifyContent();
          }

          function updateButtons() {
            buttons.forEach(button => {
              button.classList.toggle('active', document.queryCommandState(button.id));
            });
          }

          function notifyContent() {
            window.ReactNativeWebView.postMessage(editor.innerHTML);
          }

          editor.addEventListener('input', notifyContent);
          editor.addEventListener('keyup', updateButtons);
          editor.addEventListener('mouseup', updateButtons);

          document.querySelector('.toolbar').addEventListener('mousedown', (e) => {
            e.preventDefault();
          });

          // Initial setup
          editor.focus();
          updateButtons();
        </script>
      </body>
    </html>
  `;

  const handleSave = async () => {
    try {
      if (existingNote) {
        await updateNote({
          ...existingNote,
          title,
          content: noteContent,
          description: stripHtmlTags(noteContent).substring(0, 100),
          updatedAt: new Date().toISOString()
        });
      } else {
        await addNote({ 
          title,
          content: noteContent,
          description: stripHtmlTags(noteContent).substring(0, 100),
          type: 'text',
          isFavorite: false,
          isHidden: false
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const stripHtmlTags = (html: string) => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
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
      backgroundColor: theme.backgroundColor,
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
      padding: 16,
      backgroundColor: theme.secondaryBackground,
    },
    editor: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    toolbar: {
      flexDirection: 'row',
      padding: 8,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      backgroundColor: theme.secondaryBackground,
    },
    toolbarButton: {
      padding: 8,
      marginHorizontal: 4,
    },
    toolbarButtonActive: {
      backgroundColor: theme.accentColor,
      borderRadius: 4,
    },
    titleInput: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.textColor,
      padding: 16,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      backgroundColor: theme.backgroundColor,
    },
    divider: {
      height: 1,
      backgroundColor: theme.borderColor,
      marginHorizontal: 16,
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
          </View>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Ionicons name="save-outline" size={20} color={theme.accentColor} />
            <Text style={styles.saveText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder={t('enterTitle')}
          placeholderTextColor={theme.placeholderColor}
        />
        
        <View style={styles.divider} />
        
        <WebView
          ref={editorRef}
          source={{ html: editorHTML }}
          style={styles.editor}
          originWhitelist={['*']}
          onMessage={(event) => {
            setNoteContent(event.nativeEvent.data);
          }}
          scrollEnabled={true}
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView={false}
        />
      </View>
    </SafeAreaView>
  );
} 