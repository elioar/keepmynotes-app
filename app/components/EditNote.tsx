import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, Alert, BackHandler, ScrollView, KeyboardAvoidingView, Modal, ActivityIndicator, InteractionManager, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotes } from '../NotesContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TAG_COLORS, TagColor, TAG_ICONS, TAG_LABELS } from '../constants/tags';
import { Share } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MotiView, AnimatePresence } from 'moti';
import { Skeleton } from 'moti/skeleton';

type RootStackParamList = {
  Home: undefined;
  EditNote: { noteId?: string };
  AddEditNote: { noteId?: string };
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

export default function EditNote({ route }: { route: any }) {
  // Αφαιρώ τις περιττές καταγραφές
  
  const editorRef = useRef<WebView>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const webViewRef = useRef<WebView>(null);
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { notes, addNote, updateNote, deleteNote, loadNotes } = useNotes();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  
  const routeNoteId = route.params?.noteId as string | undefined;
  const isNewNote = !routeNoteId;
  const existingNote = isNewNote ? null : (notes.find((n: any) => n.id === routeNoteId) || null);
  
  const [noteContent, setNoteContent] = useState(existingNote?.content || '');
  const [title, setTitle] = useState(existingNote?.title || '');
  const [isViewMode, setIsViewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [versions, setVersions] = useState<Array<{
    content: string;
    title: string;
    updatedAt: string;
    description: string;
    isExpanded?: boolean;
  }>>([]);
  const [restoreVersion, setRestoreVersion] = useState<typeof versions[0] | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(existingNote?.isFavorite || false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [searchResultsCount, setSearchResultsCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(Platform.OS !== 'android');
	const [isContentLoading, setIsContentLoading] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (showEditor) return;
      const task = InteractionManager.runAfterInteractions(() => setShowEditor(true));
      return () => task.cancel();
    }, [showEditor])
  );

  // Keyboard visibility detection
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (existingNote) {
      const contentChanged = noteContent !== existingNote.content;
      const titleChanged = title !== existingNote.title;
      setHasChanges(contentChanged || titleChanged);
      setIsFavorite(existingNote.isFavorite);
    } else {
      setHasChanges(!!noteContent || !!title);
    }
  }, [noteContent, title]);

  // Load versions only when history modal opens
  useEffect(() => {
    if (isHistoryModalVisible && existingNote?.id) {
      loadVersions(existingNote.id);
    }
  }, [isHistoryModalVisible, existingNote?.id]);

  const loadVersions = async (noteId: string) => {
    try {
      const savedVersions = await AsyncStorage.getItem(`note_versions_${noteId}`);
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions));
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const saveVersion = async () => {
    if (!existingNote?.id) return;

    try {
      const now = new Date();
      const newVersion = {
        content: noteContent,
        title,
        updatedAt: now.toISOString(),
        description: stripHtmlTags(noteContent).substring(0, 100)
      };

      // Filter out versions older than 10 days
      const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
      const filteredVersions = versions.filter(version => 
        new Date(version.updatedAt) > tenDaysAgo
      );

      const updatedVersions = [newVersion, ...filteredVersions];
      await AsyncStorage.setItem(`note_versions_${existingNote.id}`, JSON.stringify(updatedVersions));
      setVersions(updatedVersions);
    } catch (error) {
      console.error('Error saving version:', error);
    }
  };

  const getDaysRemaining = (date: string) => {
    const versionDate = new Date(date);
    const now = new Date();
    const tenDaysFromVersion = new Date(versionDate.getTime() + (10 * 24 * 60 * 60 * 1000));
    const daysRemaining = Math.ceil((tenDaysFromVersion.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  };

  const handleRestoreVersion = async (version: typeof versions[0]) => {
    setRestoreVersion(version);
  };

  const handleConfirmRestore = async () => {
    if (!restoreVersion) return;

    try {
      setNoteContent(restoreVersion.content);
      setTitle(restoreVersion.title);
      setHasChanges(true);
      setIsHistoryModalVisible(false);
      
      // Save current state as a new version before restoring
      await saveVersion();
      
      // Update the editor content
      editorRef.current?.injectJavaScript(`
        editor.innerHTML = ${JSON.stringify(restoreVersion.content)};
        true;
      `);
    } catch (error) {
      console.error('Error restoring version:', error);
    } finally {
      setRestoreVersion(null);
    }
  };

  const editorHTML = React.useMemo(() => `
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

          /* Custom Scrollbar Styles */
          ::-webkit-scrollbar {
            display: none !important;
          }

          /* For Firefox */
          * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }

          #editor {
            width: 100%;
            min-height: calc(100vh - 120px);
            outline: none;
            padding: 24px;
            padding-bottom: ${isViewMode ? '24px' : (isKeyboardVisible ? '120px' : '120px')};
            font-size: 16px;
            line-height: 1.65;
            caret-color: ${theme.accentColor};
            background-color: ${theme.backgroundColor};
            overflow-y: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            letter-spacing: -0.1px;
          }

          /* Make sure the scrollbar doesn't affect layout */
          #editor::-webkit-scrollbar {
            width: 3px !important;
          }

          #editor::-webkit-scrollbar-track {
            background: transparent !important;
          }

          #editor::-webkit-scrollbar-thumb {
            background-color: ${theme.accentColor} !important;
            border-radius: 100px !important;
            opacity: 0.4 !important;
          }

          #editor:hover::-webkit-scrollbar-thumb {
            opacity: 0.7 !important;
          }

          #editor:empty:before {
            content: "${t('writeYourNote')}";
            color: ${theme.textColor}35;
            pointer-events: none;
            position: absolute;
            font-size: 16px;
            font-weight: 400;
            letter-spacing: -0.2px;
          }

          .search-highlight {
            background-color: ${theme.accentColor}40;
            color: ${theme.textColor};
            padding: 2px 4px;
            border-radius: 3px;
            transition: all 0.2s ease;
          }

          .search-highlight.current {
            background-color: ${theme.accentColor};
            color: #FFFFFF;
            box-shadow: 0 2px 8px ${theme.accentColor}40;
          }

          .toolbar {
            position: fixed;
            bottom: ${isKeyboardVisible ? '0px' : `${insets.bottom}px`};
            left: 0;
            right: 0;
            padding: 10px;
            background: ${theme.isDarkMode ? theme.backgroundColor + 'E6' : theme.backgroundColor + 'F5'};
            border-top: 0.5px solid ${theme.borderColor}30;
            display: ${isViewMode ? 'none' : 'flex'};
            flex-direction: column;
            gap: 8px;
            max-width: 100%;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 -4px 16px ${theme.isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'};
            z-index: 1000;
            transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .toolbar-main {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
            padding: 0 4px;
          }

          .toolbar-main::-webkit-scrollbar {
            display: none;
          }

          .toolbar-colors {
            height: 0;
            opacity: 0;
            pointer-events: none;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            margin-top: -8px;
            overflow: hidden;
            display: flex;
            flex-wrap: nowrap;
            gap: 6px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
            padding: 0 4px;
            transform: scaleY(0);
            transform-origin: top;
          }

          .toolbar-colors::-webkit-scrollbar {
            display: none;
          }

          .toolbar-colors.expanded {
            height: 44px;
            opacity: 1;
            pointer-events: auto;
            margin-top: 8px;
            transform: scaleY(1);
          }


          .color-button {
            flex: 0 0 44px;
            width: 44px;
            height: 44px;
            padding: 0;
            background: ${theme.isDarkMode ? '#2A2A2A' : theme.secondaryBackground} !important;
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
            background: ${theme.isDarkMode ? '#2C2C2E' : theme.secondaryBackground};
            border: none;
            border-radius: 12px;
            color: ${theme.textColor};
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 600;
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
            transition: opacity 0.25s ease;
            z-index: 1;
          }

          .toolbar button > * {
            position: relative;
            z-index: 2;
            transition: all 0.2s ease;
          }

          .toolbar button:active {
            transform: scale(0.94);
          }

          .toolbar button.active::after {
            opacity: 1;
          }

          .toolbar button.active {
            box-shadow: 0 3px 12px ${theme.accentColor}35;
            transform: translateY(-1.5px);
          }


          .format-icon {
            font-size: 20px;
            line-height: 1;
            font-family: -apple-system, system-ui;
            font-weight: 500;
            color: ${theme.textColor};
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
            background: ${theme.textColor};
            position: absolute;
            right: 0;
            top: 4px;
            box-shadow: 0 6px 0 ${theme.textColor}, 0 12px 0 ${theme.textColor};
            border-radius: 1px;
          }

          .format-icon.list-ul::after {
            content: '';
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: ${theme.textColor};
            position: absolute;
            left: 2px;
            top: 3px;
            box-shadow: 0 6px 0 ${theme.textColor}, 0 12px 0 ${theme.textColor};
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
            background: ${theme.textColor};
            top: 0;
            border-radius: 1px;
            box-shadow: 0 6px 0 ${theme.textColor}, 0 12px 0 ${theme.textColor};
          }

          .format-icon.align-left::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 2px;
            background: ${theme.textColor};
            top: 0;
            border-radius: 1px;
            box-shadow: 0 6px 0 ${theme.textColor};
          }

          .format-icon.align-left::after {
            content: '';
            position: absolute;
            width: 60%;
            height: 2px;
            background: ${theme.textColor};
            bottom: 0;
            left: 0;
            border-radius: 1px;
          }

          .format-icon.align-center::before {
            width: 70%;
            left: 15%;
            box-shadow: 0 6px 0 ${theme.textColor}, 0 12px 0 ${theme.textColor};
          }

          .format-icon.align-right::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 2px;
            background: ${theme.textColor};
            top: 0;
            border-radius: 1px;
            box-shadow: 0 6px 0 ${theme.textColor};
          }

          .format-icon.align-right::after {
            content: '';
            position: absolute;
            width: 60%;
            height: 2px;
            background: ${theme.textColor};
            bottom: 0;
            right: 0;
            border-radius: 1px;
          }


          .toolbar button.active .format-icon {
            transform: scale(1.1);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            color: #FFFFFF;
          }

          .toolbar button.active .format-icon::before,
          .toolbar button.active .format-icon::after {
            background: #FFFFFF;
          }

          .toolbar button.active .format-icon.list-ul::before {
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
          }

          .toolbar button.active .format-icon.list-ul::after {
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
          }

          .toolbar button.active .format-icon.align::before {
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
          }

          .toolbar button.active .format-icon.align-left::before {
            box-shadow: 0 6px 0 #FFFFFF;
          }

          .toolbar button.active .format-icon.align-center::before {
            box-shadow: 0 6px 0 #FFFFFF, 0 12px 0 #FFFFFF;
          }

          .toolbar button.active .format-icon.align-right::before {
            box-shadow: 0 6px 0 #FFFFFF;
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
            background: ${theme.textColor};
            transform: rotate(-45deg) translate(2px, -6px);
            border-radius: 1px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          .toolbar button.active .highlight-icon::after {
            background: #FFFFFF;
          }

          .no-color-icon {
            position: relative;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .no-color-icon::before {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            border: 2px solid ${theme.textColor};
            border-radius: 2px;
            opacity: 0.9;
          }

          .no-color-icon::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 2px;
            background: ${theme.textColor};
            transform: rotate(-45deg);
            opacity: 0.9;
          }

          #remove-color.selected .no-color-icon::before {
            border-color: #FFFFFF;
          }

          #remove-color.selected .no-color-icon::after {
            background: #FFFFFF;
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

          @media screen and (max-width: 360px) {
            .toolbar-row.font-size.expanded {
              height: 60px;
            }

            .font-size-slider {
              padding: 20px 0 8px;
            }

            .font-size-dot {
              width: 14px;
              height: 14px;
            }

            .font-size-value {
              font-size: 10px;
            }
          }

          @media screen and (min-width: 600px) {
            .toolbar-row.font-size.expanded {
              height: 80px;
            }

            .font-size-slider {
              padding: 28px 0 8px;
            }

            .font-size-dot {
              width: 18px;
              height: 18px;
            }

            .font-size-value {
              font-size: 12px;
            }
          }

          #remove-color {
            background: ${theme.isDarkMode ? '#2A2A2A' : theme.secondaryBackground} !important;
            border: none;
          }

          #remove-color.selected {
            background: ${theme.accentColor} !important;
          }

          .format-icon.highlight {
            width: 20px;
            height: 20px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .format-icon.highlight::before {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            border: 2px solid #FFFFFF;
            border-radius: 2px;
            opacity: 0.9;
          }

          .format-icon.highlight::after {
            content: '';
            position: absolute;
            width: 10px;
            height: 2px;
            background: #FFFFFF;
            transform: rotate(-45deg);
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div id="editor" contenteditable="${!isViewMode}" ${isViewMode ? 'style="padding-bottom: 20px;"' : ''}>
          ${existingNote?.content || ''}
        </div>
        <div class="toolbar">
          <div class="toolbar-main">
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
          <div class="toolbar-colors">
            <button id="remove-color" class="color-button" onclick="removeHighlightColor()" aria-label="Χωρίς χρώμα">
              <span class="no-color-icon"></span>
            </button>
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
          const colorRow = document.querySelector('.toolbar-colors');
          let isColorsExpanded = false;
          let currentHighlightColor = '#FFE57F';

          function toggleColorRow() {
            isColorsExpanded = !isColorsExpanded;
            colorRow.classList.toggle('expanded');
            
            // Add smooth animation to highlight button
            const highlightButton = document.querySelector('#highlight');
            if (isColorsExpanded) {
              highlightButton.classList.add('active');
              highlightButton.style.transform = 'scale(1.05)';
              setTimeout(() => {
                highlightButton.style.transform = 'scale(1)';
              }, 200);
            } else {
              highlightButton.classList.remove('active');
              highlightButton.style.transform = 'scale(0.95)';
              setTimeout(() => {
                highlightButton.style.transform = 'scale(1)';
              }, 200);
            }
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
            
            // Close color row after selection with smooth animation
            setTimeout(() => {
              toggleColorRow();
            }, 150);
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
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'content',
              content: editor.innerHTML,
              canUndo: document.queryCommandEnabled('undo'),
              canRedo: document.queryCommandEnabled('redo')
            }));
          }

          function updateUndoRedoState() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'undoRedoState',
              canUndo: document.queryCommandEnabled('undo'),
              canRedo: document.queryCommandEnabled('redo')
            }));
          }

          editor.addEventListener('input', notifyContent);
          editor.addEventListener('keyup', () => {
            updateButtons();
            updateUndoRedoState();
            ensureCaretVisible();
          });
          editor.addEventListener('mouseup', updateButtons);

          // Keyboard detection for WebView
          editor.addEventListener('focus', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'keyboardShow'
            }));
            
            // Update toolbar position for keyboard
            const toolbar = document.querySelector('.toolbar');
            if (toolbar) {
              toolbar.style.bottom = '0px';
              toolbar.style.transform = 'translateY(0)';
            }
          });

          editor.addEventListener('blur', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'keyboardHide'
            }));
            
            // Reset toolbar position when keyboard hides
            const toolbar = document.querySelector('.toolbar');
            if (toolbar) {
              toolbar.style.bottom = '${insets.bottom}px';
              toolbar.style.transform = 'translateY(0)';
            }
          });

          // Visual Viewport API for better keyboard detection
          if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
              const toolbar = document.querySelector('.toolbar');
              if (toolbar) {
                const viewportHeight = window.visualViewport.height;
                const windowHeight = window.innerHeight;
                const keyboardHeight = windowHeight - viewportHeight;
                
                if (keyboardHeight > 0) {
                  // Keyboard is visible
                  toolbar.style.bottom = '0px';
                  toolbar.style.transform = 'translateY(0)';
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'keyboardShow'
                  }));
                } else {
                  // Keyboard is hidden
                  toolbar.style.bottom = '${insets.bottom}px';
                  toolbar.style.transform = 'translateY(0)';
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'keyboardHide'
                  }));
                }
              }
            });
          }

          // Add function to ensure caret is visible
          function ensureCaretVisible() {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              const toolbarHeight = 120; // Height of the toolbar
              const buffer = 40; // Extra space above the toolbar
              
              if (rect.bottom > window.innerHeight - toolbarHeight) {
                window.scrollTo({
                  top: window.scrollY + (rect.bottom - (window.innerHeight - toolbarHeight)) + buffer,
                  behavior: 'smooth'
                });
              }
            }
          }

          // Add scroll into view for focus events
          editor.addEventListener('focus', () => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.getBoundingClientRect().scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          });

          // Improve Enter key handling
          document.addEventListener('keydown', function(e) {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              if (e.shiftKey) {
                document.execCommand('redo');
              } else {
                document.execCommand('undo');
              }
              notifyContent();
              updateButtons();
              updateUndoRedoState();
            } else if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
              // Add delay to allow the content changes to be processed
              setTimeout(ensureCaretVisible, 10);
            }
          });

          // Update content after undo/redo
          editor.addEventListener('input', function(e) {
            if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
              notifyContent();
              updateButtons();
              updateUndoRedoState();
            }
          });

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

          // Add message listener for view mode toggle and keyboard state
          window.addEventListener('message', function(event) {
            if (event.data === 'view-mode') {
              editor.contentEditable = 'false';
            } else if (event.data === 'edit-mode') {
              editor.contentEditable = 'true';
              editor.focus();
            } else if (event.data === 'keyboard-show') {
              // Keyboard is visible, toolbar should be shown
            } else if (event.data === 'keyboard-hide') {
              // Keyboard is hidden, toolbar should be hidden
            }
          });

          function removeHighlightColor() {
            const selection = window.getSelection();
            if (!selection.isCollapsed) {
              document.execCommand('removeFormat', false, null);
              
              const colorButtons = document.querySelectorAll('.color-button');
              colorButtons.forEach(btn => btn.classList.remove('selected'));
              document.querySelector('#remove-color').classList.add('selected');
              
              // Close color row after selection with smooth animation
              setTimeout(() => {
                toggleColorRow();
              }, 150);
              updateButtons();
              notifyContent();
            }
          }

          // Update the initial setup
          document.querySelector('#yellow').classList.remove('selected');
          document.querySelector('#remove-color').classList.add('selected');
        </script>
      </body>
    </html>
  `, [theme, isViewMode, t, isKeyboardVisible, insets.bottom]);

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
      if (isSaving) return;
      if (!title.trim()) {
        Alert.alert(t('error'), t('titleRequired'));
        return;
      }
      setIsSaving(true);

      let savedNote;
      // Ελέγχουμε αν η σημείωση είναι νέα ή υπάρχουσα
      if (!isNewNote && existingNote) {
        const updatedNote = {
          ...existingNote,
          title: title.trim(),
          content: noteContent,
          description: stripHtmlTags(noteContent).substring(0, 100),
          updatedAt: new Date().toISOString(),
          tags,
          isFavorite
        };
        await updateNote(updatedNote);
        savedNote = updatedNote;
      } else {
        savedNote = await addNote({ 
          title: title.trim(),
          content: noteContent,
          description: stripHtmlTags(noteContent).substring(0, 100),
          type: (existingNote?.type as any) || 'text',
          isFavorite: false,
          isHidden: false,
          tags
        });
      }

      if (existingNote?.id) {
        // Μην μπλοκάρεις αν offline: αποθήκευσε έκδοση best-effort
        try { await saveVersion(); } catch {}
      }

      setHasChanges(false);
      navigation.navigate('Home');
    
      return savedNote;
    } catch (error) {
      console.error('❌ Error saving note:', error);
      Alert.alert(
        t('error'), 
        t('errorSavingNote'), 
        [{ text: t('done'), style: 'default' }]
      );
      // Δεν επαναφέρουμε το σφάλμα για να μην διακόψουμε τη ροή
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const stripHtmlTags = (html: string) => {
    let counter = 0;
    return html
      // Handle ordered lists (numbered)
      .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (match, content) => {
        counter = 0;
        return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_: string, item: string) => {
          counter++;
          return `\n${counter}. ${item.trim()}\n`;
        });
      })
      // Handle unordered lists (bullet points)
      .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (match, content) => {
        return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_: string, item: string) => {
          return `\n• ${item.trim()}\n`;
        });
      })
      // Handle line breaks and other HTML elements
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      // Clean up extra whitespace and line breaks
      .replace(/\n\s*\n/g, '\n')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[\n\s]*$/, '')
      .trim();
  };

  const toggleViewMode = () => {
    const newMode = !isViewMode;
    setIsViewMode(newMode);
    editorRef.current?.postMessage(newMode ? 'view-mode' : 'edit-mode');
  };

  const handleBack = async () => {
    try {
      if (isSaving) return;
      if (hasChanges) {
        await handleSave();
      } else {
        // Χρησιμοποιούμε ρητά navigate('Home') αντί για goBack()
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Error navigating back:', error);
      // Σε περίπτωση σφάλματος, πάμε πίσω στην αρχική οθόνη
      navigation.navigate('Home');
    }
  };

  // Χειρισμός του hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isSaving) return true;
        if (hasChanges) {
          handleSave().catch(err => {
            console.error('Error saving on back press:', err);
            // Σε περίπτωση σφάλματος, πάμε πίσω στην αρχική οθόνη
            navigation.navigate('Home');
          });
          return true;
        }
        // Χρησιμοποιούμε ρητά navigate('Home') αντί για goBack()
        navigation.navigate('Home');
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [hasChanges, navigation, handleSave, isSaving])
  );

  // Add menu handlers
  const handleMenuPress = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleHistoryPress = () => {
    setIsMenuVisible(false);
    setIsHistoryModalVisible(true);
  };

  const handleReadingModePress = () => {
    setIsMenuVisible(false);
    toggleViewMode();
  };

  const handleDetailsPress = () => {
    setIsMenuVisible(false);
    setIsDetailsModalVisible(true);
  };

  const handleFavoritePress = async () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    setIsMenuVisible(false);
    
    if (existingNote) {
      await updateNote({
        ...existingNote,
        isFavorite: newFavoriteState,
      });
    }
  };

  // Add word count function
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Add share handlers
  const handleSharePress = () => {
    setIsMenuVisible(false);
    setIsShareModalVisible(true);
  };

  const handleShareAsText = async () => {
    try {
      await Share.share({
        message: stripHtmlTags(noteContent),
        title: title,
      });
    } catch (error) {
      console.error('Error sharing text:', error);
    }
    setIsShareModalVisible(false);
  };

  const handleShareAsImage = async () => {
    try {
      const ref = viewShotRef.current;
      if (!ref?.capture) {
        Alert.alert(t('error'), t('errorSharingImage'));
        return;
      }

      const uri = await ref.capture();
      if (uri) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title });
        setIsShareModalVisible(false);
      }
    } catch (error) {
      console.error('Error sharing as image:', error);
      Alert.alert(t('error'), t('errorSharingImage'));
    }
  };

  const cleanHtmlContent = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    if (!text.trim()) {
      setSearchResultsCount(0);
      setCurrentMatchIndex(0);
      editorRef.current?.injectJavaScript(`
        const editor = document.getElementById('editor');
        editor.innerHTML = editor.innerHTML.replace(/<mark class="search-highlight[^>]*>(.*?)<\\/mark>/g, '$1');
        true;
      `);
      return;
    }

    editorRef.current?.injectJavaScript(`
      try {
        const editor = document.getElementById('editor');
        // Remove existing highlights
        editor.innerHTML = editor.innerHTML.replace(/<mark class="search-highlight[^>]*>(.*?)<\\/mark>/g, '$1');
        
        const searchText = ${JSON.stringify(text)};
        const content = editor.innerHTML;
        
        // Create a temporary div to safely manipulate HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        function highlightText(node) {
          if (node.nodeType === 3) { // Text node
            const text = node.textContent;
            const regex = new RegExp(searchText, 'gi');
            if (regex.test(text)) {
              const fragment = document.createDocumentFragment();
              let lastIndex = 0;
              let match;
              
              regex.lastIndex = 0; // Reset regex
              while ((match = regex.exec(text)) !== null) {
                // Add text before match
                if (match.index > lastIndex) {
                  fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                }
                
                // Add highlighted match
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = match[0];
                fragment.appendChild(mark);
                
                lastIndex = regex.lastIndex;
              }
              
              // Add remaining text
              if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
              }
              
              node.parentNode.replaceChild(fragment, node);
              return true;
            }
          } else if (node.nodeType === 1 && !['SCRIPT', 'STYLE', 'MARK'].includes(node.tagName)) {
            Array.from(node.childNodes).forEach(child => highlightText(child));
          }
          return false;
        }
        
        // Process all nodes
        highlightText(tempDiv);
        
        // Update editor content
        editor.innerHTML = tempDiv.innerHTML;
        
        // Count results and highlight first match
        const highlights = editor.getElementsByClassName('search-highlight');
        const count = highlights.length;
        
        if (count > 0) {
          highlights[0].classList.add('current');
          highlights[0].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'searchResults',
          count: count
        }));
      } catch (error) {
        console.error('Search error:', error);
      }
      true;
    `);
  };

  const handleNextResult = () => {
    if (searchResultsCount <= 1) return;
    
    const nextIndex = currentMatchIndex % searchResultsCount + 1;
    setCurrentMatchIndex(nextIndex);
    
    editorRef.current?.injectJavaScript(`
      try {
        const highlights = document.getElementsByClassName('search-highlight');
        let currentIndex = Array.from(highlights).findIndex(h => h.classList.contains('current'));
        
        if (currentIndex >= 0) {
          highlights[currentIndex].classList.remove('current');
        }
        
        currentIndex = (currentIndex + 1) % highlights.length;
        highlights[currentIndex].classList.add('current');
        highlights[currentIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } catch (error) {
        console.error('Navigation error:', error);
      }
      true;
    `);
  };

  const handlePreviousResult = () => {
    if (searchResultsCount <= 1) return;
    
    const prevIndex = currentMatchIndex <= 1 ? searchResultsCount : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    
    editorRef.current?.injectJavaScript(`
      try {
        const highlights = document.getElementsByClassName('search-highlight');
        let currentIndex = Array.from(highlights).findIndex(h => h.classList.contains('current'));
        
        if (currentIndex >= 0) {
          highlights[currentIndex].classList.remove('current');
        }
        
        currentIndex = currentIndex - 1 < 0 ? highlights.length - 1 : currentIndex - 1;
        highlights[currentIndex].classList.add('current');
        highlights[currentIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } catch (error) {
        console.error('Navigation error:', error);
      }
      true;
    `);
  };

  const handleDelete = () => {
    setIsMenuVisible(false);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (existingNote?.id) {
        await deleteNote(existingNote.id);
      }
      setIsDeleteModalVisible(false);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert(t('error'), t('errorDeletingNote'));
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
      paddingHorizontal: 20,
      paddingVertical: 12,
      paddingTop: Platform.OS === 'ios' ? 8 : 12,
      backgroundColor: theme.isDarkMode ? theme.backgroundColor + 'E6' : theme.backgroundColor + 'F2',
      backdropFilter: 'blur(20px)',
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor + '20',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerCenter: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    menuButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.isDarkMode ? theme.secondaryBackground + 'CC' : theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    menuOptions: {
      position: 'absolute',
      top: 56,
      right: 20,
      backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 6,
      minWidth: 220,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: theme.isDarkMode ? 0.4 : 0.12,
      shadowRadius: 16,
      elevation: 8,
      zIndex: 1000,
      borderWidth: theme.isDarkMode ? 0 : 0.5,
      borderColor: theme.borderColor + '30',
    },
    menuOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
      backgroundColor: 'transparent',
    },
    menuOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 12,
      borderRadius: 10,
      marginVertical: 1,
    },
    menuOptionText: {
      color: theme.textColor,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.3,
    },
    menuOptionActive: {
      backgroundColor: theme.accentColor + '15',
    },
    menuOptionTextActive: {
      color: theme.accentColor,
    },
    editControls: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    editButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.isDarkMode ? theme.secondaryBackground + 'CC' : theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
      opacity: 1,
    },
    editButtonDisabled: {
      opacity: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: hasChanges ? theme.accentColor : theme.isDarkMode ? theme.secondaryBackground + 'CC' : theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: hasChanges ? theme.accentColor : '#000',
      shadowOffset: {
        width: 0,
        height: hasChanges ? 4 : 3,
      },
      shadowOpacity: hasChanges ? 0.25 : 0.08,
      shadowRadius: hasChanges ? 8 : 6,
      elevation: hasChanges ? 4 : 2,
    },
    viewModeButton: {
      backgroundColor: theme.isDarkMode ? theme.secondaryBackground + 'CC' : theme.secondaryBackground,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    saveButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: hasChanges ? theme.accentColor : 'transparent',
      borderWidth: hasChanges ? 0 : 1.5,
      borderColor: theme.accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: hasChanges ? theme.accentColor : 'transparent',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: hasChanges ? 0.25 : 0,
      shadowRadius: 8,
      elevation: hasChanges ? 3 : 0,
    },
    saveText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      marginLeft: 8,
      letterSpacing: -0.3,
    },
    titleInput: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.textColor,
      padding: 24,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: theme.backgroundColor,
      letterSpacing: -0.5,
    },
    divider: {
      height: 0.5,
      backgroundColor: theme.borderColor,
      marginHorizontal: 24,
      opacity: 0.3,
    },
    editor: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      width: '100%',
      height: '100%',
      borderRadius: 12,
      overflow: 'hidden',
    },
    skeletonOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: 20,
      backgroundColor: theme.backgroundColor,
      zIndex: 2,
    },
    webView: {
      backgroundColor: 'transparent',
      flex: 1,
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
    metadataCard: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      marginBottom: 4,
    },
    tagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    categoryGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    metaInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.isDarkMode ? theme.secondaryBackground + '80' : theme.secondaryBackground,
    },
    metaText: {
      fontSize: 11,
      color: theme.placeholderColor,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    tagLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    historyModal: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 18,
      paddingTop: Platform.OS === 'ios' ? 16 : 18,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor + '30',
      backgroundColor: theme.isDarkMode ? theme.backgroundColor + 'F2' : theme.backgroundColor,
    },
    historyTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.textColor,
      letterSpacing: -0.7,
    },
    versionItem: {
      padding: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor + '30',
      backgroundColor: theme.backgroundColor,
      marginBottom: 0,
    },
    versionDate: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 10,
      letterSpacing: -0.4,
    },
    versionPreview: {
      fontSize: 15,
      color: theme.textColor + '90',
      lineHeight: 22,
      marginBottom: 10,
      letterSpacing: -0.1,
      paddingHorizontal: 0,
      textAlign: 'left',
      flexWrap: 'wrap',
      fontWeight: '400',
    },
    seeMoreButton: {
      alignSelf: 'flex-start',
      marginBottom: 14,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.accentColor + '15',
    },
    seeMoreText: {
      fontSize: 13,
      color: theme.accentColor,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    versionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 6,
      backgroundColor: theme.isDarkMode ? theme.secondaryBackground : theme.backgroundColor + '90',
      padding: 8,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    versionMetaText: {
      fontSize: 12,
      color: theme.textColor + '80',
      fontWeight: '500',
      letterSpacing: -0.2,
    },
    versionActions: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: 8,
    },
    restoreButton: {
      backgroundColor: theme.accentColor,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      shadowColor: theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    restoreButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    closeButton: {
      padding: 8,
      backgroundColor: theme.isDarkMode ? theme.secondaryBackground : theme.backgroundColor,
      borderRadius: 10,
      width: 38,
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noVersions: {
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    noVersionsText: {
      color: theme.textColor + '70',
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    detailsModal: {
      backgroundColor: theme.isDarkMode ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 24,
      padding: 0,
      width: '100%',
      maxWidth: 360,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: theme.isDarkMode ? 0.5 : 0.15,
      shadowRadius: 24,
      elevation: 10,
      borderWidth: theme.isDarkMode ? 0 : 0.5,
      borderColor: theme.borderColor + '20',
    },
    detailsHeader: {
      padding: 28,
      paddingBottom: 24,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor + '30',
      alignItems: 'center',
      gap: 14,
    },
    detailsTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.textColor,
      letterSpacing: -0.6,
    },
    detailsContent: {
      padding: 24,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      gap: 14,
    },
    detailsIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.isDarkMode ? '#2C2C2E' : theme.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailsInfo: {
      flex: 1,
    },
    detailsLabel: {
      fontSize: 13,
      color: theme.textColor + '60',
      fontWeight: '500',
      marginBottom: 4,
    },
    detailsValue: {
      fontSize: 15,
      color: theme.textColor,
      fontWeight: '600',
    },
    detailsFooter: {
      padding: 20,
      paddingTop: 0,
    },
    doneButton: {
      backgroundColor: theme.accentColor,
      paddingVertical: 16,
      paddingHorizontal: 28,
      borderRadius: 14,
      alignItems: 'center',
      shadowColor: theme.accentColor,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    doneButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.4,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.55)',
      padding: 24,
    },
    shareModal: {
      backgroundColor: theme.isDarkMode ? '#1A1A1A' : theme.backgroundColor,
      borderRadius: 28,
      padding: 24,
      width: '100%',
      maxWidth: 340,
      gap: 20,
    },
    shareOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.isDarkMode ? '#2A2A2A' : theme.secondaryBackground,
      borderRadius: 16,
      gap: 16,
    },
    shareIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.isDarkMode ? '#3A3A3A' : theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    shareInfo: {
      flex: 1,
    },
    shareTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 4,
    },
    shareDescription: {
      fontSize: 13,
      color: theme.textColor + '80',
    },
    cancelButton: {
      backgroundColor: theme.isDarkMode ? '#2A2A2A' : theme.secondaryBackground,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
    },
    cancelText: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '600',
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? theme.secondaryBackground + 'CC' : theme.secondaryBackground,
      borderRadius: 12,
      marginHorizontal: 10,
      paddingHorizontal: 12,
      height: 40,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      color: theme.textColor,
      fontSize: 15,
      paddingVertical: 8,
      marginLeft: 8,
      fontWeight: '500',
    },
    searchControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.isDarkMode ? '#2C2C2E' : theme.backgroundColor,
      borderRadius: 8,
      padding: 3,
    },
    searchCounter: {
      paddingHorizontal: 8,
      minWidth: 44,
      alignItems: 'center',
    },
    searchCounterText: {
      color: theme.textColor,
      fontSize: 12,
      fontWeight: '600',
    },
    searchNavButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: theme.isDarkMode ? '#3C3C3E' : theme.secondaryBackground,
    },
    searchNavButtonDisabled: {
      opacity: 0.4,
    },
    searchCloseButton: {
      padding: 7,
      marginLeft: 4,
      borderRadius: 8,
    },
    menuDivider: {
      height: 0.5,
      backgroundColor: theme.borderColor,
      marginVertical: 4,
      marginHorizontal: 8,
      opacity: 0.4,
    },
    menuOptionDanger: {
      backgroundColor: 'transparent',
    },
    menuOptionTextDanger: {
      color: '#FF4E4E',
      fontWeight: '600',
    },
    daysRemainingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
      gap: 4,
    },
    daysRemainingText: {
      fontSize: 12,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Minimal Glass Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.header}
        >
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 100 }}
          >
          <TouchableOpacity 
              style={[
                styles.backButton, 
                isSaving && { opacity: 0.5 },
                isViewMode && styles.viewModeButton
              ]}
              onPress={isViewMode ? toggleViewMode : handleSave}
            disabled={isSaving}
            accessibilityState={{ disabled: isSaving }}
          >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.textColor} />
              ) : isViewMode ? (
                <MotiView
                  from={{ rotate: '90deg', scale: 0.8 }}
                  animate={{ rotate: '0deg', scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <Ionicons name="close" size={24} color={theme.textColor} />
                </MotiView>
              ) : (
                <Ionicons name="checkmark" size={22} color={hasChanges ? '#FFFFFF' : theme.textColor} />
              )}
          </TouchableOpacity>
          </MotiView>

          {isSearchVisible ? (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.searchContainer}
            >
              <Ionicons name="search-outline" size={18} color={theme.textColor + '60'} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder={t('searchInNote')}
                placeholderTextColor={theme.placeholderColor}
                autoFocus
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchResultsCount > 0 && (
                <View style={styles.searchControls}>
                  <TouchableOpacity 
                    style={[styles.searchNavButton, searchResultsCount <= 1 && styles.searchNavButtonDisabled]}
                    onPress={handlePreviousResult}
                    disabled={searchResultsCount <= 1}
                  >
                    <Ionicons name="chevron-up" size={16} color={theme.textColor} />
                  </TouchableOpacity>
                  <View style={styles.searchCounter}>
                    <Text style={styles.searchCounterText}>
                      {currentMatchIndex}/{searchResultsCount}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.searchNavButton, searchResultsCount <= 1 && styles.searchNavButtonDisabled]}
                    onPress={handleNextResult}
                    disabled={searchResultsCount <= 1}
                  >
                    <Ionicons name="chevron-down" size={16} color={theme.textColor} />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity 
                style={styles.searchCloseButton}
                onPress={() => {
                  setIsSearchVisible(false);
                  setSearchQuery('');
                  setSearchResultsCount(0);
                  setCurrentMatchIndex(0);
                  editorRef.current?.injectJavaScript(`
                    const oldHighlights = document.getElementsByClassName('search-highlight');
                    while (oldHighlights.length > 0) {
                      const parent = oldHighlights[0].parentNode;
                      const text = oldHighlights[0].textContent;
                      parent.replaceChild(document.createTextNode(text), oldHighlights[0]);
                    }
                    true;
                  `);
                }}
              >
                <Ionicons name="close" size={18} color={theme.textColor} />
              </TouchableOpacity>
            </MotiView>
          ) : (
            <View style={styles.headerCenter}>
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 150 }}
              >
              <TouchableOpacity 
                style={[styles.editButton, !canUndo && styles.editButtonDisabled]}
                onPress={() => canUndo && editorRef.current?.injectJavaScript('document.execCommand("undo"); true;')}
              >
                <Ionicons 
                  name="arrow-undo-outline" 
                    size={19} 
                  color={theme.textColor} 
                    style={{ opacity: canUndo ? 1 : 0.35 }}
                />
              </TouchableOpacity>
              </MotiView>
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 200 }}
              >
              <TouchableOpacity 
                style={[styles.editButton, !canRedo && styles.editButtonDisabled]}
                onPress={() => canRedo && editorRef.current?.injectJavaScript('document.execCommand("redo"); true;')}
              >
                <Ionicons 
                  name="arrow-redo-outline" 
                    size={19} 
                  color={theme.textColor}
                    style={{ opacity: canRedo ? 1 : 0.35 }}
                />
              </TouchableOpacity>
              </MotiView>
            </View>
          )}

          <View style={styles.headerRight}>
            <MotiView
              from={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 250 }}
            >
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleMenuPress}
            >
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.textColor} />
            </TouchableOpacity>
            </MotiView>
          </View>
        </MotiView>

        <AnimatePresence>
        {isMenuVisible && (
          <>
            <TouchableOpacity 
              style={styles.menuOverlay} 
              activeOpacity={1}
              onPress={() => setIsMenuVisible(false)}
            />
              <MotiView
                from={{ opacity: 0, scale: 0.9, translateY: -10 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, translateY: -10 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                style={styles.menuOptions}
              >
              <TouchableOpacity 
                style={[styles.menuOption, isFavorite && styles.menuOptionActive]}
                onPress={handleFavoritePress}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                    size={19} 
                  color={isFavorite ? theme.accentColor : theme.textColor} 
                />
                <Text style={[
                  styles.menuOptionText, 
                  isFavorite && styles.menuOptionTextActive
                ]}>
                  {isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuOption}
                onPress={() => {
                  setIsMenuVisible(false);
                  setIsSearchVisible(true);
                }}
              >
                  <Ionicons name="search-outline" size={19} color={theme.textColor} />
                <Text style={styles.menuOptionText}>{t('search')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuOption}
                onPress={handleSharePress}
              >
                  <Ionicons name="share-outline" size={19} color={theme.textColor} />
                <Text style={styles.menuOptionText}>{t('share')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuOption}
                onPress={handleDetailsPress}
              >
                  <Ionicons name="information-circle-outline" size={19} color={theme.textColor} />
                <Text style={styles.menuOptionText}>{t('noteDetails')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuOption}
                onPress={handleHistoryPress}
              >
                  <Ionicons name="time-outline" size={19} color={theme.textColor} />
                <Text style={styles.menuOptionText}>{t('noteHistory')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.menuOption, isViewMode && styles.menuOptionActive]}
                onPress={handleReadingModePress}
              >
                <Ionicons 
                  name={isViewMode ? "create-outline" : "eye-outline"} 
                    size={19} 
                  color={isViewMode ? theme.accentColor : theme.textColor} 
                />
                <Text style={[
                  styles.menuOptionText, 
                  isViewMode && styles.menuOptionTextActive
                ]}>
                  {isViewMode ? t('edit') : t('readingMode')}
                </Text>
              </TouchableOpacity>
                <View style={styles.menuDivider} />
              <TouchableOpacity 
                style={[styles.menuOption, styles.menuOptionDanger]}
                onPress={handleDelete}
              >
                  <Ionicons name="trash-outline" size={19} color="#FF4E4E" />
                <Text style={[styles.menuOptionText, styles.menuOptionTextDanger]}>{t('delete')}</Text>
              </TouchableOpacity>
              </MotiView>
          </>
        )}
        </AnimatePresence>

        {/* Modern Metadata Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 300 }}
          style={styles.metadataCard}
        >
        <View style={styles.tagContainer}>
          <View style={styles.categoryGroup}>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: (existingNote?.color ? TAG_COLORS[existingNote.color as TagColor] : theme.accentColor) + '15' }
              ]}>
            <Ionicons 
                  name={TAG_ICONS[existingNote?.color as TagColor] || 'pricetag-outline'} 
                  size={14} 
                  color={existingNote?.color ? TAG_COLORS[existingNote.color as TagColor] : theme.accentColor} 
            />
            <Text 
              style={[
                styles.tagLabel, 
                    { color: existingNote?.color ? TAG_COLORS[existingNote.color as TagColor] : theme.accentColor }
              ]}
            >
              {existingNote?.color ? TAG_LABELS[existingNote.color as TagColor] : TAG_LABELS.none}
            </Text>
              </View>
          </View>
          <View style={styles.metaInfo}>
              <View style={styles.metaChip}>
                <Ionicons name="create-outline" size={12} color={theme.placeholderColor} />
            <Text style={styles.metaText}>
                  {stripHtmlTags(noteContent).length}
            </Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={12} color={theme.placeholderColor} />
            <Text style={styles.metaText}>
              {existingNote?.updatedAt ? new Date(existingNote.updatedAt).toLocaleString(currentLanguage, {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : new Date().toLocaleString(currentLanguage, {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
        >
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder={t('enterTitle')}
          placeholderTextColor={theme.placeholderColor}
        />
        </MotiView>
        
        <View style={styles.divider} />
        
		<View style={styles.editor}>
			{Platform.OS === 'android' && !showEditor ? (
				<>
					<AnimatePresence>
						<MotiView
							from={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							style={styles.skeletonOverlay}
						>
							<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'80%'} height={22} radius={8} />
							<View style={{ height: 16 }} />
							<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'100%'} height={14} radius={6} />
							<View style={{ height: 10 }} />
							<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'95%'} height={14} radius={6} />
							<View style={{ height: 10 }} />
							<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'92%'} height={14} radius={6} />
							<View style={{ height: 14 }} />
							<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'98%'} height={160} radius={10} />
						</MotiView>
					</AnimatePresence>
				</>
			) : (
				<>
					<AnimatePresence>
						{isContentLoading ? (
							<MotiView
								from={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								style={styles.skeletonOverlay}
							>
								<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'80%'} height={22} radius={8} />
								<View style={{ height: 16 }} />
								<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'100%'} height={14} radius={6} />
								<View style={{ height: 10 }} />
								<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'95%'} height={14} radius={6} />
								<View style={{ height: 10 }} />
								<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'92%'} height={14} radius={6} />
								<View style={{ height: 14 }} />
								<Skeleton colorMode={theme.isDarkMode ? 'dark' : 'light'} width={'98%'} height={160} radius={10} />
							</MotiView>
						) : null}
					</AnimatePresence>
					<MotiView
						from={{ opacity: 0 }}
						animate={{ opacity: isContentLoading ? 0 : 1 }}
						transition={{ type: 'timing', duration: 280 }}
						style={{ flex: 1 }}
					>
						<WebView
							ref={editorRef}
							source={{ html: editorHTML }}
							style={styles.webView}
							originWhitelist={['*']}
							startInLoadingState
							renderLoading={() => <View />}
							cacheEnabled
							onLoadEnd={() => setIsContentLoading(false)}
							onMessage={(event) => {
								const data = JSON.parse(event.nativeEvent.data);
								if (data.type === 'content') {
									setNoteContent(data.content);
									setCanUndo(data.canUndo);
									setCanRedo(data.canRedo);
								} else if (data.type === 'undoRedoState') {
									setCanUndo(data.canUndo);
									setCanRedo(data.canRedo);
								} else if (data.type === 'searchResults') {
									setSearchResultsCount(data.count);
									if (data.count > 0) {
										setCurrentMatchIndex(1);
									} else {
										setCurrentMatchIndex(0);
									}
								} else if (data.type === 'keyboardShow') {
									setIsKeyboardVisible(true);
								} else if (data.type === 'keyboardHide') {
									setIsKeyboardVisible(false);
								}
							}}
							scrollEnabled={true}
							keyboardDisplayRequiresUserAction={false}
							hideKeyboardAccessoryView={false}
							showsVerticalScrollIndicator={true}
							contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
							decelerationRate={0.998}
							overScrollMode="never"
							bounces={false}
						/>
					</MotiView>
				</>
			)}
		</View>

      {/* History Modal */}
      <Modal
        visible={isHistoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsHistoryModalVisible(false)}
      >
        <SafeAreaView style={styles.historyModal}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>{t('noteHistory')}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsHistoryModalVisible(false)}
            >
              <Ionicons name="close" size={22} color={theme.textColor} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {versions.length > 0 ? (
              versions.map((version, index) => {
                const daysRemaining = getDaysRemaining(version.updatedAt);
                return (
                  <View key={version.updatedAt} style={styles.versionItem}>
                    <Text style={styles.versionDate}>
                      {new Date(version.updatedAt).toLocaleString(currentLanguage, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    <View style={styles.versionMeta}>
                      <Ionicons name="create-outline" size={16} color={theme.textColor + '80'} />
                      <Text style={styles.versionMetaText}>
                        {stripHtmlTags(version.content).length} {t('characters')}
                      </Text>
                      <View style={[
                        styles.daysRemainingBadge,
                        { backgroundColor: daysRemaining <= 2 ? '#FF4E4E20' : theme.accentColor + '20' }
                      ]}>
                        <Ionicons 
                          name="time-outline" 
                          size={14} 
                          color={daysRemaining <= 2 ? '#FF4E4E' : theme.accentColor} 
                        />
                        <Text style={[
                          styles.daysRemainingText,
                          { color: daysRemaining <= 2 ? '#FF4E4E' : theme.accentColor }
                        ]}>
                          {daysRemaining} {daysRemaining === 1 ? t('dayRemaining') : t('daysRemaining')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.versionPreview} numberOfLines={version.isExpanded ? undefined : 3}>
                      {stripHtmlTags(version.content)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.seeMoreButton}
                      onPress={() => {
                        const updatedVersions = versions.map((v, i) => 
                          i === index ? { ...v, isExpanded: !v.isExpanded } : v
                        );
                        setVersions(updatedVersions);
                      }}
                    >
                      <Text style={styles.seeMoreText}>
                        {version.isExpanded ? t('seeLess') : t('seeMore')}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.versionActions}>
                      <TouchableOpacity
                        style={styles.restoreButton}
                        onPress={() => handleRestoreVersion(version)}
                      >
                        <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.restoreButtonText}>
                          {t('restoreVersion')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.noVersions}>
                <Text style={styles.noVersionsText}>
                  {t('noVersionsAvailable')}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Note Details Modal */}
      <Modal
        visible={isDetailsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDetailsModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={styles.detailsModal}>
            <View style={styles.detailsHeader}>
              <View style={[styles.detailsIcon, { backgroundColor: theme.accentColor + '15' }]}>
                <Ionicons name="document-text" size={22} color={theme.accentColor} />
              </View>
              <Text style={styles.detailsTitle}>{t('noteDetails')}</Text>
            </View>
            
            <View style={styles.detailsContent}>
              <View style={styles.detailsRow}>
                <View style={styles.detailsIcon}>
                  <Ionicons name="calendar-outline" size={20} color={theme.textColor + '80'} />
                </View>
                <View style={styles.detailsInfo}>
                  <Text style={styles.detailsLabel}>{t('createdTime')}</Text>
                  <Text style={styles.detailsValue}>
                    {new Date(existingNote?.createdAt || new Date()).toLocaleDateString(currentLanguage, {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailsRow}>
                <View style={styles.detailsIcon}>
                  <Ionicons name="time-outline" size={20} color={theme.textColor + '80'} />
                </View>
                <View style={styles.detailsInfo}>
                  <Text style={styles.detailsLabel}>{t('lastModified')}</Text>
                  <Text style={styles.detailsValue}>
                    {new Date(existingNote?.updatedAt || new Date()).toLocaleDateString(currentLanguage, {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailsRow}>
                <View style={styles.detailsIcon}>
                  <Ionicons name="text-outline" size={20} color={theme.textColor + '80'} />
                </View>
                <View style={styles.detailsInfo}>
                  <Text style={styles.detailsLabel}>{t('wordCount')}</Text>
                  <Text style={styles.detailsValue}>
                    {getWordCount(stripHtmlTags(noteContent))} {t('words')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailsRow}>
                <View style={styles.detailsIcon}>
                  <Ionicons name="analytics-outline" size={20} color={theme.textColor + '80'} />
                </View>
                <View style={styles.detailsInfo}>
                  <Text style={styles.detailsLabel}>{t('characterCount')}</Text>
                  <Text style={styles.detailsValue}>
                    {stripHtmlTags(noteContent).length} {t('characters')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsFooter}>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setIsDetailsModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>
                  {t('done')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={isShareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsShareModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={styles.shareModal}>
            <TouchableOpacity style={styles.shareOption} onPress={handleShareAsText}>
              <View style={styles.shareIcon}>
                <Ionicons name="text-outline" size={22} color={theme.textColor} />
              </View>
              <View style={styles.shareInfo}>
                <Text style={styles.shareTitle}>{t('shareAsText')}</Text>
                <Text style={styles.shareDescription}>{t('shareAsTextDescription')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareOption} onPress={handleShareAsImage}>
              <View style={styles.shareIcon}>
                <Ionicons name="image-outline" size={22} color={theme.textColor} />
              </View>
              <View style={styles.shareInfo}>
                <Text style={styles.shareTitle}>{t('shareAsImage')}</Text>
                <Text style={styles.shareDescription}>{t('shareAsImageDescription')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setIsShareModalVisible(false)}
            >
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ViewShot component for image sharing */}
      <ViewShot
        ref={viewShotRef}
        options={{
          format: 'png',
          quality: 1,
          result: 'tmpfile'
        }}
        style={{
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: 600,
          backgroundColor: theme.backgroundColor,
          padding: 20,
          minHeight: 400
        }}
      >
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <Text style={{ 
              fontSize: 14, 
              color: theme.placeholderColor,
              marginBottom: 8 
            }}>
              {new Date(existingNote?.createdAt || new Date()).toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: theme.textColor,
              marginBottom: 10 
            }}>
              {title}
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: theme.textColor,
              lineHeight: 24
            }}>
              {stripHtmlTags(noteContent)}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 40,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: theme.borderColor
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}>
              <Ionicons 
                name="document-text" 
                size={24} 
                color={theme.accentColor}
              />
              <Text style={{
                fontSize: 18,
                color: theme.textColor,
                fontWeight: '600'
              }}>
                Keep My Notes
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12
            }}>
              <View style={{
                width: 60,
                height: 60,
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 4
              }}>
                <Text style={{
                  fontSize: 10,
                  color: theme.placeholderColor,
                  textAlign: 'center',
                  marginBottom: 2
                }}>
                  Play Store
                </Text>
                <View style={{
                  flex: 1,
                  backgroundColor: '#000',
                  borderRadius: 4
                }} />
              </View>

              <View style={{
                width: 60,
                height: 60,
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 4
              }}>
                <Text style={{
                  fontSize: 10,
                  color: theme.placeholderColor,
                  textAlign: 'center',
                  marginBottom: 2
                }}>
                  App Store
                </Text>
                <View style={{
                  flex: 1,
                  backgroundColor: '#000',
                  borderRadius: 4
                }} />
              </View>
            </View>
          </View>
        </View>
      </ViewShot>

      {/* Restore Version Modal */}
      <Modal
        visible={!!restoreVersion}
        transparent
        animationType="fade"
        onRequestClose={() => setRestoreVersion(null)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={styles.detailsModal}>
            <View style={styles.detailsHeader}>
              <View style={[styles.detailsIcon, { backgroundColor: theme.accentColor + '15' }]}>
                <Ionicons name="time-outline" size={22} color={theme.accentColor} />
              </View>
              <Text style={styles.detailsTitle}>{t('restoreVersion')}</Text>
            </View>
            <View style={styles.detailsContent}>
              <Text style={styles.detailsValue}>{t('restoreVersionConfirm')}</Text>
            </View>
            <View style={styles.detailsFooter}>
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: theme.accentColor }]}
                onPress={() => handleConfirmRestore()}
              >
                <Text style={styles.doneButtonText}>{t('restore')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { marginTop: 8 }]}
                onPress={() => setRestoreVersion(null)}
              >
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Note Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={styles.detailsModal}>
            <View style={styles.detailsHeader}>
              <View style={[styles.detailsIcon, { backgroundColor: '#FF4E4E15' }]}>
                <Ionicons name="trash-outline" size={22} color="#FF4E4E" />
              </View>
              <Text style={styles.detailsTitle}>{t('deleteNote')}</Text>
            </View>
            <View style={styles.detailsContent}>
              <Text style={styles.detailsValue}>{t('deleteNoteConfirm')}</Text>
            </View>
            <View style={styles.detailsFooter}>
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: '#FF4E4E' }]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.doneButtonText}>{t('delete')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { marginTop: 8 }]}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}