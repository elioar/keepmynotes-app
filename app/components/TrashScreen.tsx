import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  ToastAndroid,
  Dimensions,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import Reanimated, { Layout } from 'react-native-reanimated';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useNotes } from '../NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing utilities
const wp = (percentage: number) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

const hp = (percentage: number) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

const normalize = (size: number) => {
  const scale = SCREEN_WIDTH / 375; // 375 is standard iPhone width
  const newSize = size * scale;
  return Math.round(newSize);
};

interface TrashNote {
  id: string;
  title: string;
  description?: string;
  deletedAt?: string;
  daysLeft?: number;
}

const TrashScreen = () => {
  const navigation = useNavigation();
  const { getTrashNotes, restoreFromTrash, permanentlyDeleteNote, emptyTrash, trashRetentionDays, updateTrashRetentionDays } = useNotes();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [trashNotes, setTrashNotes] = useState<TrashNote[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // Replaced imperative Animated with Moti + Reanimated
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customRetentionDays, setCustomRetentionDays] = useState(trashRetentionDays.toString());
  const [retentionOptions] = useState([7, 15, 30, 60, 90]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Υπολογισμός ημερών που απομένουν πριν την αυτόματη διαγραφή
  const calculateDaysLeft = (deletedAt?: string): number => {
    if (!deletedAt) return trashRetentionDays;
    
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    
    // Προσθέτουμε τις ημέρες διατήρησης στην ημερομηνία διαγραφής
    const expiryDate = new Date(deletedDate);
    expiryDate.setDate(expiryDate.getDate() + trashRetentionDays);
    
    // Υπολογίζουμε τη διαφορά σε μέρες
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays); // Επιστρέφουμε τουλάχιστον 0
  };

  // Φόρτωση των διαγραμμένων σημειώσεων
  const loadTrashNotes = () => {
    const notes = getTrashNotes();
    
    // Μετατροπή σε απλούστερα αντικείμενα για την οθόνη κάδου
    const formattedNotes = notes.map(note => ({
      id: note.id,
      title: note.title,
      description: note.description,
      deletedAt: note.deletedAt,
      daysLeft: calculateDaysLeft(note.deletedAt)
    }));
    
    // Ταξινόμηση με βάση την ημερομηνία διαγραφής (νεότερες πρώτα)
    formattedNotes.sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    setTrashNotes(formattedNotes);
  };

  // Ενημέρωση για την αλλαγή της περιόδου διατήρησης
  useEffect(() => {
    // Ενημερώνουμε το τοπικό state όταν αλλάζει η τιμή από το context
    setCustomRetentionDays(trashRetentionDays.toString());
    
    // Ελέγχουμε αν η τιμή αντιστοιχεί σε μία από τις προκαθορισμένες επιλογές
    const optionIndex = retentionOptions.findIndex(option => option === trashRetentionDays);
    setSelectedOption(optionIndex !== -1 ? trashRetentionDays : null);
    
    // Επαναφόρτωση της λίστας για ενημέρωση των daysLeft
    if (trashNotes.length > 0) {
      loadTrashNotes();
    }
  }, [trashRetentionDays]);

  // Επαναφορά σημείωσης από τον κάδο
  const handleRestore = async (id: string) => {
    try {
      // Fire-and-forget για άμεσο exit animation
      restoreFromTrash(id).catch(() => {});
      setTrashNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      
      // Εμφάνιση μηνύματος επιτυχίας
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('noteRestoredFromTrash'), ToastAndroid.SHORT);
      } else {
        Alert.alert('', t('noteRestoredFromTrash'));
      }
    } catch (error) {
      console.error('Error restoring note:', error);
    }
  };

  // Μόνιμη διαγραφή σημείωσης
  const handlePermanentDelete = (id: string) => {
    Alert.alert(
      t('deleteForever'),
      t('deleteNoteConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('deleteForever'),
          style: 'destructive',
          onPress: async () => {
            try {
              permanentlyDeleteNote(id).catch(() => {});
              setTrashNotes(prevNotes => prevNotes.filter(note => note.id !== id));
              if (Platform.OS === 'android') {
                ToastAndroid.show(t('noteDeletedForever'), ToastAndroid.SHORT);
              } else {
                Alert.alert('', t('noteDeletedForever'));
              }
            } catch (error) {
              console.error('Error permanently deleting note:', error);
            }
          }
        }
      ]
    );
  };

  // Άδειασμα ολόκληρου του κάδου
  const handleEmptyTrash = () => {
    if (trashNotes.length === 0) return;
    
    Alert.alert(
      t('emptyTrash'),
      t('emptyTrashConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('emptyTrash'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Προσθήκη εφέ κίνησης
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              
              await emptyTrash();
              
              // Άμεση ενημέρωση του UI αδειάζοντας την τοπική λίστα
              setTrashNotes([]);
              
              // Εμφάνιση μηνύματος επιτυχίας
              if (Platform.OS === 'android') {
                ToastAndroid.show(t('trash') + ' ' + t('dataDeletedSuccess').toLowerCase(), ToastAndroid.SHORT);
              } else {
                Alert.alert('', t('trash') + ' ' + t('dataDeletedSuccess').toLowerCase());
              }
            } catch (error) {
              console.error('Error emptying trash:', error);
            }
          }
        }
      ]
    );
  };

  // Αποθήκευση της νέας περιόδου διατήρησης
  const handleSaveRetention = async () => {
    let daysValue = parseInt(customRetentionDays, 10);
    
    // Έλεγχος εγκυρότητας
    if (isNaN(daysValue) || daysValue < 1) {
      daysValue = 30; // Επαναφορά στην προεπιλεγμένη τιμή
      setCustomRetentionDays('30');
    }
    
    // Αποθήκευση της τιμής
    await updateTrashRetentionDays(daysValue);
    
    // Κλείσιμο του modal
    setShowSettingsModal(false);
    
    // Εμφάνιση μηνύματος επιτυχίας
    if (Platform.OS === 'android') {
      ToastAndroid.show(t('success'), ToastAndroid.SHORT);
    }
  };

  // Φόρτωση σημειώσεων κατά την εμφάνιση της οθόνης
  useEffect(() => {
    loadTrashNotes();
  }, []);

  const renderTrashItem = ({ item }: { item: TrashNote }) => (
    <Reanimated.View layout={Layout.springify().damping(12).stiffness(260).mass(0.6)}>
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: -10, scale: 0.98 }}
        transition={{ type: 'spring', damping: 12, stiffness: 260, mass: 0.6 }}
      >
      <View style={[styles.noteItem, { backgroundColor: theme.secondaryBackground }]}>
        <View style={styles.noteContent}>
          <Text style={[styles.noteTitle, { color: theme.textColor }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={[styles.noteDescription, { color: theme.placeholderColor }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.noteFooter}>
            <Ionicons name="time-outline" size={14} color={theme.placeholderColor} />
            <Text style={[styles.daysLeftText, { color: theme.placeholderColor }]}>
              {t('daysUntilDeletion').replace('{days}', item.daysLeft?.toString() || trashRetentionDays.toString())}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.accentColor + '20' }]}
            onPress={() => handleRestore(item.id)}
          >
            <Ionicons name="refresh-outline" size={18} color={theme.accentColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FF3B30' + '20' }]}
            onPress={() => handlePermanentDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      </MotiView>
    </Reanimated.View>
  );
  
  // Ο χειρισμός της επιλογής μιας προκαθορισμένης επιλογής
  const handleSelectOption = (days: number) => {
    setSelectedOption(days);
    setCustomRetentionDays(days.toString());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.backgroundColor} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.secondaryBackground }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>{t('trash')}</Text>
        <View style={styles.headerActions}>
          {trashNotes.length > 0 && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.secondaryBackground }]}
              onPress={handleEmptyTrash}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.secondaryBackground }]}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="settings-outline" size={20} color={theme.textColor} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: theme.secondaryBackground + '80' }]}>
        <Ionicons name="information-circle-outline" size={20} color={theme.accentColor} />
        <Text style={[styles.infoText, { color: theme.placeholderColor }]}>
          {t('trashDescription').replace('30', trashRetentionDays.toString())}
        </Text>
      </View>
      
      {/* Note List */}
      {trashNotes.length > 0 ? (
        <FlatList
          data={trashNotes}
          renderItem={renderTrashItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.secondaryBackground }]}>
            <Ionicons name="trash-outline" size={50} color={theme.placeholderColor} />
          </View>
          <Text style={[styles.emptyText, { color: theme.placeholderColor }]}>
            {t('noTrashItems')}
          </Text>
        </View>
      )}
      
      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalOverlayPress} 
            onPress={() => setShowSettingsModal(false)}
          />
          <View style={[styles.modalContainer, { backgroundColor: theme.secondaryBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>{t('trashSettings')}</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={theme.textColor} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingSection}>
              <Text style={[styles.settingTitle, { color: theme.textColor }]}>{t('retentionPeriod')}</Text>
              <Text style={[styles.settingDescription, { color: theme.placeholderColor }]}>
                {t('retentionPeriodDescription')}
              </Text>
              
              <View style={styles.optionsContainer}>
                {retentionOptions.map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: selectedOption === days ? 
                          theme.accentColor : theme.secondaryBackground,
                        borderColor: theme.borderColor
                      }
                    ]}
                    onPress={() => handleSelectOption(days)}
                  >
                    <Text style={[
                      styles.optionText, 
                      { color: selectedOption === days ? '#fff' : theme.textColor }
                    ]}>
                      {days} {t('days')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.settingTitle, { color: theme.textColor, marginTop: 20 }]}>
                {t('customRetention')}
              </Text>
              
              <View style={styles.customInputContainer}>
                <TextInput
                  style={[styles.customInput, { 
                    backgroundColor: theme.backgroundColor,
                    color: theme.textColor,
                    borderColor: theme.borderColor
                  }]}
                  value={customRetentionDays}
                  onChangeText={setCustomRetentionDays}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={3}
                />
                <Text style={[styles.daysLabel, { color: theme.textColor }]}>{t('days')}</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.accentColor }]}
              onPress={handleSaveRetention}
            >
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(2),
  },
  backButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: normalize(22),
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(4),
    marginHorizontal: wp(5),
    borderRadius: wp(3),
    marginBottom: hp(2),
  },
  infoText: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: normalize(14),
  },
  listContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(10),
  },
  noteItem: {
    flexDirection: 'row',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  noteDescription: {
    fontSize: normalize(14),
    marginBottom: hp(1),
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysLeftText: {
    fontSize: normalize(12),
    marginLeft: wp(1),
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingLeft: wp(3),
  },
  actionButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: hp(10),
  },
  emptyIconContainer: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  emptyText: {
    fontSize: normalize(16),
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlayPress: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContainer: {
    width: wp(85),
    maxHeight: hp(80),
    borderRadius: wp(4),
    padding: wp(5),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
  },
  settingSection: {
    marginVertical: hp(1),
  },
  settingTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: hp(1),
  },
  settingDescription: {
    fontSize: normalize(14),
    marginBottom: hp(2),
    lineHeight: normalize(20),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  optionButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
    marginBottom: hp(1),
    borderWidth: 1,
    minWidth: wp(17),
    alignItems: 'center',
  },
  optionText: {
    fontSize: normalize(14),
    fontWeight: '500',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
  },
  customInput: {
    height: hp(6),
    width: wp(20),
    borderWidth: 1,
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    fontSize: normalize(16),
    textAlign: 'center',
  },
  daysLabel: {
    marginLeft: wp(3),
    fontSize: normalize(16),
  },
  saveButton: {
    height: hp(6),
    borderRadius: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(3),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
});

export default TrashScreen; 