import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, Alert, BackHandler, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotes } from '../NotesContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TAG_COLORS, TagColor, TAG_ICONS, TAG_LABELS } from '../constants/tags';

type RootStackParamList = {
  Home: undefined;
  Task: { note?: any };
  AddEditNote: { note?: any };
};

interface Note {
  id: string;
  title: string;
  content?: string;
  description?: string;
  type: 'text' | 'checklist' | 'task';
  isFavorite: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  color?: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TaskScreen({ route }: { route: any }) {
  const editorRef = useRef<WebView>(null);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { addNote, updateNote } = useNotes();
  const navigation = useNavigation<NavigationProp>();
  
  const existingNote = route.params?.note;
  const [noteContent, setNoteContent] = useState(existingNote?.content || '');
  const [title, setTitle] = useState(existingNote?.title || '');
  const [isViewMode, setIsViewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (existingNote) {
      const contentChanged = noteContent !== existingNote.content;
      const titleChanged = title !== existingNote.title;
      setHasChanges(contentChanged || titleChanged);
    } else {
      setHasChanges(!!noteContent || !!title);
    }
  }, [noteContent, title]);

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
            padding: 8px;
            background: #000000;
            border-top: 1px solid ${theme.borderColor};
            display: ${isViewMode ? 'none' : 'flex'};
            flex-direction: column;
            gap: 4px;
            max-width: 100%;
          }

          .toolbar-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 4px;
            width: 100%;
          }

          .toolbar-row.secondary {
            height: 0;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
            margin-top: -4px;
            overflow: hidden;
          }

          .toolbar-row.secondary.expanded {
            height: 44px;
            opacity: 1;
            pointer-events: auto;
            margin-top: 4px;
          }

          .toolbar-row.colors {
            height: 0;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
            margin-top: -4px;
            overflow: hidden;
            display: flex;
            flex-wrap: nowrap;
            gap: 4px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
            padding: 0 4px;
          }

          .toolbar-row.colors::-webkit-scrollbar {
            display: none;
          }

          .toolbar-row.colors.expanded {
            height: 44px;
            opacity: 1;
            pointer-events: auto;
            margin-top: 4px;
          }

          .color-button {
            flex: 0 0 44px;
            width: 44px;
            height: 44px;
            padding: 0;
            background: #2A2A2A;
            border: none;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .color-button::before {
            content: '';
            position: absolute;
            inset: 4px;
            border-radius: 8px;
            transition: all 0.2s ease;
            z-index: 1;
          }

          #yellow::before { background: #FFE57F; }
          #green::before { background: #A5D6A7; }
          #blue::before { background: #90CAF9; }
          #pink::before { background: #F48FB1; }
          #purple::before { background: #B39DDB; }
          #cyan::before { background: #81D4FA; }
          #orange::before { background: #FFAB91; }
          #lime::before { background: #E6EE9C; }

          .color-button:active {
            transform: scale(0.96);
          }

          .color-button.selected {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }

          .color-button.selected::after {
            content: '';
            position: absolute;
            inset: 2px;
            border: 2px solid #FFFFFF;
            border-radius: 10px;
            z-index: 2;
          }

          .toolbar button {
            flex: 1;
            min-width: 44px;
            height: 44px;
            padding: 0;
            background: #2A2A2A;
            border: none;
            border-radius: 12px;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
            position: relative;
            overflow: hidden;
          }

          .toolbar button::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${theme.accentColor};
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1;
          }

          .toolbar button > * {
            position: relative;
            z-index: 2;
          }

          .toolbar button:active {
            transform: scale(0.96);
          }

          .toolbar button.active::after {
            opacity: 1;
          }

          .toolbar button.active {
            box-shadow: 0 2px 8px ${theme.accentColor}40;
            transform: translateY(-1px);
          }

          .toolbar button.expand-button {
            width: 44px;
            flex: 0 0 44px;
            margin-left: 4px;
          }

          .toolbar button.expand-button.active {
            background: ${theme.accentColor};
            box-shadow: 0 2px 8px ${theme.accentColor}40;
          }

          .format-icon {
            font-size: 20px;
            line-height: 1;
            font-family: -apple-system, system-ui;
            font-weight: 500;
            color: #FFFFFF;
            transition: all 0.3s ease;
            position: relative;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .format-icon.bold {
            font-weight: 800;
            font-size: 22px;
            letter-spacing: -0.5px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          .format-icon.italic {
            font-style: italic;
            font-size: 22px;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          .format-icon.underline {
            font-size: 22px;
            font-weight: 600;
            text-decoration: underline;
            text-underline-offset: 2px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          .format-icon.list-ol {
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -1px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          .format-icon.list-ul {
            display: flex;
            flex-direction: column;
            gap: 6px;
            align-items: flex-start;
          }

          .format-icon.list-ul::before {
            content: '';
            width: 16px;
            height: 2px;
            background: #FFFFFF;
            position: absolute;
            right: 0;
            top: 4px;
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
            border-radius: 1px;
          }

          .format-icon.list-ul::after {
            content: '';
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #FFFFFF;
            position: absolute;
            left: 2px;
            top: 3px;
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
          }

          .format-icon.align {
            width: 18px;
            height: 14px;
            position: relative;
          }

          .format-icon.align::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 2px;
            background: #FFFFFF;
            top: 0;
            border-radius: 1px;
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
          }

          .format-icon.align-left::before {
            width: 100%;
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
          }

          .format-icon.align-center::before {
            width: 70%;
            left: 15%;
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
          }

          .format-icon.align-right::before {
            width: 100%;
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
          }

          .format-icon.expand {
            width: 14px;
            height: 14px;
            position: relative;
          }

          .format-icon.expand::before,
          .format-icon.expand::after {
            content: '';
            position: absolute;
            background: #FFFFFF;
            border-radius: 1px;
          }

          .format-icon.expand::before {
            width: 10px;
            height: 2px;
            top: 6px;
            left: 2px;
          }

          .format-icon.expand::after {
            width: 2px;
            height: 10px;
            left: 6px;
            top: 2px;
          }

          .toolbar button.active .format-icon.expand::after {
            transform: scaleY(0);
          }

          .toolbar button.active .format-icon {
            transform: scale(1.1);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }

          .highlight-icon {
            position: relative;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .highlight-icon::before {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            background: var(--highlight-color, #FFE57F);
            border-radius: 4px;
            transform: rotate(45deg);
            transition: all 0.2s ease;
          }

          .highlight-icon::after {
            content: '';
            position: absolute;
            width: 2px;
            height: 14px;
            background: #FFFFFF;
            transform: rotate(-45deg) translate(2px, -6px);
            border-radius: 1px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          .color-picker {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1A1A1A;
            border-radius: 12px;
            padding: 12px;
            display: none;
            flex-direction: column;
            gap: 8px;
            width: 200px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            margin-bottom: 8px;
          }

          .color-picker.visible {
            display: flex;
          }

          .color-option {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #2A2A2A;
          }

          .color-option:hover {
            background: #333333;
            transform: translateX(4px);
          }

          .color-option.selected {
            background: #333333;
          }

          .color-swatch {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            border: 2px solid rgba(255, 255, 255, 0.1);
          }

          .color-name {
            color: #FFFFFF;
            font-size: 14px;
            font-weight: 500;
          }

          .color-picker::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid #1A1A1A;
          }

          #editor[contenteditable="false"] {
            cursor: default;
          }

          @media screen and (min-width: 600px) {
            .toolbar {
              max-width: 600px;
              left: 50%;
              transform: translateX(-50%);
              border-radius: 16px 16px 0 0;
            }
          }

          @media screen and (max-width: 360px) {
            .color-button {
              flex: 0 0 36px;
              width: 36px;
              height: 36px;
            }
          }
        </style>
      </head>
      <body>
        <div id="editor" contenteditable="${!isViewMode}" ${isViewMode ? 'style="padding-bottom: 20px;"' : ''}>
          ${existingNote?.content || ''}
        </div>
        <div class="toolbar">
          <div class="toolbar-row">
            <button id="bold" onclick="format('bold')" aria-label="Bold">
              <span class="format-icon bold">B</span>
            </button>
            <button id="italic" onclick="format('italic')" aria-label="Italic">
              <span class="format-icon italic">I</span>
            </button>
            <button id="underline" onclick="format('underline')" aria-label="Underline">
              <span class="format-icon underline">U</span>
            </button>
            <button id="highlight" onclick="toggleColorRow()" aria-label="Highlight">
              <span class="highlight-icon"></span>
            </button>
            <button class="expand-button" onclick="toggleSecondaryTools()" aria-label="More formatting options">
              <span class="format-icon expand"></span>
            </button>
          </div>
          <div class="toolbar-row secondary">
            <button id="list-ol" onclick="format('insertOrderedList')" aria-label="Numbered List">
              <span class="format-icon list-ol">123</span>
            </button>
            <button id="list-ul" onclick="format('insertUnorderedList')" aria-label="Bullet List">
              <span class="format-icon list-ul"></span>
            </button>
            <button id="align-left" onclick="format('justifyLeft')" aria-label="Align Left">
              <span class="format-icon align align-left"></span>
            </button>
            <button id="align-center" onclick="format('justifyCenter')" aria-label="Align Center">
              <span class="format-icon align align-center"></span>
            </button>
            <button id="align-right" onclick="format('justifyRight')" aria-label="Align Right">
              <span class="format-icon align align-right"></span>
            </button>
          </div>
          <div class="toolbar-row colors">
            <button id="yellow" class="color-button" onclick="setHighlightColor('#FFE57F')" aria-label="Κίτρινο"></button>
            <button id="green" class="color-button" onclick="setHighlightColor('#A5D6A7')" aria-label="Πράσινο"></button>
            <button id="blue" class="color-button" onclick="setHighlightColor('#90CAF9')" aria-label="Μπλε"></button>
            <button id="pink" class="color-button" onclick="setHighlightColor('#F48FB1')" aria-label="Ροζ"></button>
            <button id="purple" class="color-button" onclick="setHighlightColor('#B39DDB')" aria-label="Μωβ"></button>
            <button id="cyan" class="color-button" onclick="setHighlightColor('#81D4FA')" aria-label="Γαλάζιο"></button>
            <button id="orange" class="color-button" onclick="setHighlightColor('#FFAB91')" aria-label="Πορτοκαλί"></button>
            <button id="lime" class="color-button" onclick="setHighlightColor('#E6EE9C')" aria-label="Λαχανί"></button>
          </div>
        </div>

        <script>
          const editor = document.getElementById('editor');
          const toolbar = document.querySelector('.toolbar');
          const buttons = document.querySelectorAll('.toolbar button');
          const expandButton = document.querySelector('.expand-button');
          const secondaryRow = document.querySelector('.toolbar-row.secondary');
          let isExpanded = false;
          let isColorsExpanded = false;
          let currentHighlightColor = '#FFE57F';

          function toggleSecondaryTools(e) {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            isExpanded = !isExpanded;
            
            if (isColorsExpanded) {
              toggleColorRow();
            }
            
            expandButton.classList.toggle('active');
            secondaryRow.classList.toggle('expanded');
            editor.blur();
          }

          function toggleColorRow() {
            const colorRow = document.querySelector('.toolbar-row.colors');
            isColorsExpanded = !isColorsExpanded;
            
            if (isExpanded) {
              isExpanded = false;
              secondaryRow.classList.remove('expanded');
              expandButton.classList.remove('active');
            }
            
            colorRow.classList.toggle('expanded');
          }

          function setHighlightColor(color) {
            currentHighlightColor = color;
            document.documentElement.style.setProperty('--highlight-color', color);
            
            const colorButtons = document.querySelectorAll('.color-button');
            colorButtons.forEach(btn => btn.classList.remove('selected'));
            document.querySelector('.color-button[onclick*="' + color + '"]').classList.add('selected');
            
            const selection = window.getSelection();
            if (!selection.isCollapsed) {
              document.execCommand('backColor', false, color);
            }
            
            toggleColorRow();
            updateButtons();
          }

          function format(command, value = null) {
            if (command === 'highlight') {
              const selection = window.getSelection();
              const highlightButton = document.querySelector('#highlight');
              
              if (!selection.isCollapsed) {
                if (highlightButton.classList.contains('active')) {
                  document.execCommand('removeFormat', false, null);
                  highlightButton.classList.remove('active');
                } else {
                  document.execCommand('backColor', false, currentHighlightColor);
                  highlightButton.classList.add('active');
                }
              }
              
              updateButtons();
              notifyContent();
            } else {
              document.execCommand(command, false, value);
              updateButtons();
              notifyContent();
            }
          }

          function updateButtons() {
            buttons.forEach(button => {
              if (button.id === 'highlight') {
                const selection = window.getSelection();
                if (!selection.isCollapsed) {
                  const range = selection.getRangeAt(0);
                  const span = document.createElement('span');
                  range.surroundContents(span);
                  const computedStyle = window.getComputedStyle(span);
                  const hasHighlight = computedStyle.backgroundColor !== 'transparent' 
                    && computedStyle.backgroundColor !== ''
                    && computedStyle.backgroundColor !== 'rgb(0, 0, 0)';
                  span.outerHTML = span.innerHTML;
                  button.classList.toggle('active', hasHighlight);
                } else {
                  button.classList.remove('active');
                }
              } else {
                button.classList.toggle('active', document.queryCommandState(button.id));
              }
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

          // Select default color on load
          document.querySelector('#yellow').classList.add('selected');

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

  const handleAddTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      setIsAddingTag(false);
      setHasChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      if (existingNote) {
        await updateNote({
          ...existingNote,
          title,
          content: noteContent,
          description: stripHtmlTags(noteContent).substring(0, 100),
          updatedAt: new Date().toISOString(),
          tags
        });
      } else {
        await addNote({ 
          title,
          content: noteContent,
          description: stripHtmlTags(noteContent).substring(0, 100),
          type: 'text',
          isFavorite: false,
          isHidden: false,
          tags
        });
      }
      setHasChanges(false);
      navigation.navigate('Home');
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

  const handleBack = async () => {
    if (hasChanges) {
      await handleSave();
    }
    navigation.navigate('Home');
  };

  // Χειρισμός του hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (hasChanges) {
          handleSave().then(() => {
            navigation.navigate('Home');
          });
          return true;
        }
        navigation.navigate('Home');
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [hasChanges, navigation, handleSave])
  );

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
      paddingTop: 8,
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
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 12,
      paddingTop: 8,
      gap: 8,
      alignItems: 'center',
    },
    tag: {
      backgroundColor: theme.accentColor + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tagText: {
      color: theme.accentColor,
      fontSize: 14,
      fontWeight: '500',
    },
    addTagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      padding: 6,
      borderRadius: 8,
      backgroundColor: theme.secondaryBackground,
    },
    addTagButtonText: {
      color: theme.textColor,
      fontSize: 14,
      fontWeight: '500',
    },
    tagInput: {
      flex: 1,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      color: theme.textColor,
      fontSize: 14,
    },
    tagInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    tagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 4,
      marginBottom: 0,
    },
    categoryGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    metaText: {
      fontSize: 12,
      color: theme.placeholderColor,
      fontWeight: '500',
    },
    tagLabel: {
      fontSize: 13,
      fontWeight: '500',
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

        <View style={styles.tagContainer}>
          <View style={styles.categoryGroup}>
            <Ionicons 
              name={TAG_ICONS[existingNote?.color as TagColor] || 'remove-outline'} 
              size={16} 
              color={existingNote?.color ? TAG_COLORS[existingNote.color as TagColor] : theme.placeholderColor} 
            />
            <Text 
              style={[
                styles.tagLabel, 
                { color: existingNote?.color ? TAG_COLORS[existingNote.color as TagColor] : theme.placeholderColor }
              ]}
            >
              {existingNote?.color ? TAG_LABELS[existingNote.color as TagColor] : TAG_LABELS.none}
            </Text>
          </View>
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>
              {stripHtmlTags(noteContent).length} {t('characters')}
            </Text>
            <Text style={styles.metaText}>
              {existingNote?.updatedAt ? new Date(existingNote.updatedAt).toLocaleString('el', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : new Date().toLocaleString('el', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
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