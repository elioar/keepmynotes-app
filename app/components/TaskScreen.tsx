import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotes } from '../NotesContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  const [isViewMode, setIsViewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (existingNote) {
      const contentChanged = noteContent !== existingNote.content;
      const titleChanged = title !== existingNote.title;
      setHasChanges(contentChanged || titleChanged);
    } else {
      setHasChanges(!!noteContent || !!title);
    }
  }, [noteContent, title]);

  // Χειρισμός του hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (hasChanges) {
          Alert.alert(
            t('unsavedChanges'),
            t('unsavedChangesMessage'),
            [
              {
                text: t('discard'),
                style: 'destructive',
                onPress: () => navigation.goBack()
              },
              {
                text: t('save'),
                style: 'default',
                onPress: async () => {
                  await handleSave();
                  navigation.goBack();
                }
              },
              {
                text: t('cancel'),
                style: 'cancel'
              },
            ]
          );
          return true; // Prevents default back action
        }
        return false; // Allows default back action
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [hasChanges, navigation, handleSave])
  );

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
            padding: 20px;
            font-size: 16px;
            line-height: 1.6;
            caret-color: ${theme.accentColor};
            background-color: ${theme.backgroundColor};
          }

          #editor:empty:before {
            content: "${t('writeYourNote')}";
            color: ${theme.textColor}40;
            pointer-events: none;
            position: absolute;
            font-size: 15px;
          }

          .toolbar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 12px 16px;
            background: ${theme.backgroundColor};
            border-top: 1px solid ${theme.borderColor};
            display: ${isViewMode ? 'none' : 'flex'};
            justify-content: space-between;
            gap: 12px;
            backdrop-filter: blur(10px);
          }

          .toolbar button {
            min-width: 40px;
            height: 40px;
            padding: 0;
            background: ${theme.secondaryBackground};
            border: none;
            border-radius: 10px;
            color: ${theme.textColor};
            font-weight: 600;
            font-size: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .toolbar button:active {
            transform: scale(0.95);
            opacity: 0.9;
          }

          .toolbar button.active {
            background: ${theme.accentColor};
            color: white;
            box-shadow: 0 2px 5px ${theme.accentColor}40;
          }

          /* Προσθήκη hover effect για web */
          @media (hover: hover) {
            .toolbar button:hover {
              background: ${theme.accentColor}20;
            }
            .toolbar button.active:hover {
              background: ${theme.accentColor};
            }
          }

          #editor[contenteditable="false"] {
            cursor: default;
          }
        </style>
      </head>
      <body>
        <div id="editor" contenteditable="${!isViewMode}" ${isViewMode ? 'style="padding-bottom: 20px;"' : ''}>
          ${existingNote?.content || ''}
        </div>
        <div class="toolbar">
          <button id="bold" onclick="format('bold')" aria-label="Bold">𝐁</button>
          <button id="italic" onclick="format('italic')" aria-label="Italic">𝐼</button>
          <button id="underline" onclick="format('underline')" aria-label="Underline">U̲</button>
          <button id="strikethrough" onclick="format('strikeThrough')" aria-label="Strikethrough">S̶</button>
          <button id="list-ul" onclick="format('insertUnorderedList')" aria-label="Bullet List">•</button>
          <button id="list-ol" onclick="format('insertOrderedList')" aria-label="Numbered List">1.</button>
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

          function insertTask() {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.marginRight = '12px';
            checkbox.style.width = '20px';
            checkbox.style.height = '20px';
            checkbox.style.accentColor = '${theme.accentColor}';
            checkbox.style.cursor = 'pointer';
            checkbox.addEventListener('change', function() {
              const span = this.nextSibling;
              if (span) {
                if (this.checked) {
                  span.style.textDecoration = 'line-through';
                  span.style.opacity = '0.6';
                  span.style.color = '${theme.textColor}';
                } else {
                  span.style.textDecoration = 'none';
                  span.style.opacity = '1';
                  span.style.color = '${theme.textColor}';
                }
              }
              notifyContent();
            });

            const span = document.createElement('span');
            span.contentEditable = 'true';
            span.textContent = '';
            span.style.transition = 'all 0.3s ease';
            span.style.fontSize = '16px';
            span.style.flex = '1';
            span.style.outline = 'none';
            span.style.minHeight = '24px';
            span.style.lineHeight = '24px';

            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.marginBottom = '12px';
            div.style.paddingLeft = '4px';
            div.appendChild(checkbox);
            div.appendChild(span);

            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            range.insertNode(div);
            range.collapse(false);

            span.focus();
            notifyContent();
          }

          // Add message listener for view mode toggle
          window.addEventListener('message', function(event) {
            if (event.data === 'view-mode') {
              editor.contentEditable = 'false';
            } else if (event.data === 'edit-mode') {
              editor.contentEditable = 'true';
              editor.focus();
            }
          });
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
      setHasChanges(false);
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

  const toggleViewMode = () => {
    const newMode = !isViewMode;
    setIsViewMode(newMode);
    editorRef.current?.postMessage(newMode ? 'view-mode' : 'edit-mode');
  };

  const handleBack = () => {
    if (hasChanges) {
      // Εμφάνιση alert για μη αποθηκευμένες αλλαγές
      Alert.alert(
        t('unsavedChanges'),
        t('unsavedChangesMessage'),
        [
          {
            text: t('discard'),
            style: 'destructive',
            onPress: () => navigation.goBack()
          },
          {
            text: t('save'),
            style: 'default',
            onPress: async () => {
              await handleSave();
              navigation.goBack();
            }
          },
          {
            text: t('cancel'),
            style: 'cancel'
          },
        ]
      );
    } else {
      navigation.goBack();
    }
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
      backgroundColor: theme.backgroundColor,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    saveButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: hasChanges ? theme.accentColor : 'transparent',
      borderWidth: hasChanges ? 0 : 1.5,
      borderColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: hasChanges ? theme.accentColor : 'transparent',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: hasChanges ? 0.2 : 0,
      shadowRadius: 3,
      elevation: hasChanges ? 2 : 0,
    },
    saveText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    titleInput: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.textColor,
      padding: 20,
      paddingTop: 20,
      paddingBottom: 20,
      backgroundColor: theme.backgroundColor,
    },
    divider: {
      height: 1,
      backgroundColor: theme.borderColor,
      marginHorizontal: 20,
      opacity: 0.5,
    },
    editor: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    viewButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    viewButtonActive: {
      backgroundColor: theme.accentColor,
      shadowColor: theme.accentColor,
      shadowOpacity: 0.2,
    },
    viewButtonText: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    viewButtonTextActive: {
      color: '#FFFFFF',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={20} color={theme.textColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.viewButton, isViewMode && styles.viewButtonActive]}
              onPress={toggleViewMode}
            >
              <Ionicons 
                name={isViewMode ? "create-outline" : "eye-outline"} 
                size={20} 
                color={isViewMode ? '#FFFFFF' : theme.textColor} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={!hasChanges}
            >
              <Ionicons 
                name="save-outline" 
                size={20} 
                color={hasChanges ? "#FFFFFF" : theme.accentColor} 
              />
            </TouchableOpacity>
          </View>
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