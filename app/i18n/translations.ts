export interface Translations {
  // Note actions
  noteHistory: string;
  readingMode: string;
  edit: string;
  selectCategory: string;
  noteTitle: string;
  history: string;
  editMode: string;
  unfavorite: string;
  favorite: string;
  unhide: string;
  hideNote: string;
  unhideNote: string;
  hide: string;
  delete: string;
  daysLeft: string;
  
  // Categories
  noTag: string;
  personal: string;
  work: string;
  study: string;
  ideas: string;
  important: string;
  addCustomCategory: string;
  enterCategoryName: string;
  customCategory: string;

  // Note Details
  noteDetails: string;
  createdTime: string;
  lastModified: string;
  wordCount: string;
  characterCount: string;
}

const en: Translations = {
  // Note actions
  noteHistory: 'History',
  readingMode: 'Reading Mode',
  edit: 'Edit',
  selectCategory: 'Select Category',
  noteTitle: 'Note Title',
  history: 'History',
  editMode: 'Edit Mode',
  unfavorite: 'Remove from Favorites',
  favorite: 'Add to Favorites',
  unhide: 'Unhide',
  hideNote: 'Hide Note',
  unhideNote: 'Unhide Note',
  hide: 'Hide',
  delete: 'Delete',
  daysLeft: 'days left',
  
  // Categories
  noTag: 'No Category',
  personal: 'Personal',
  work: 'Work',
  study: 'Study',
  ideas: 'Ideas',
  important: 'Important',
  addCustomCategory: 'Add Custom Category',
  enterCategoryName: 'Enter category name',
  customCategory: 'Custom Category',

  // Note Details
  noteDetails: 'Note Details',
  createdTime: 'Created Time',
  lastModified: 'Last Modified',
  wordCount: 'Word Count',
  characterCount: 'Character Count',
};

const el: Translations = {
  // Note actions
  noteHistory: 'Ιστορικό',
  readingMode: 'Λειτουργία Ανάγνωσης',
  edit: 'Επεξεργασία',
  selectCategory: 'Επιλογή Κατηγορίας',
  noteTitle: 'Τίτλος Σημείωσης',
  history: 'Ιστορικό',
  editMode: 'Λειτουργία Επεξεργασίας',
  unfavorite: 'Αφαίρεση από Αγαπημένα',
  favorite: 'Προσθήκη στα Αγαπημένα',
  unhide: 'Εμφάνιση',
  hideNote: 'Απόκρυψη Σημείωσης',
  unhideNote: 'Εμφάνιση Σημείωσης',
  hide: 'Απόκρυψη',
  delete: 'Διαγραφή',
  daysLeft: 'ημέρες απομένουν',
  
  // Categories
  noTag: 'Χωρίς Κατηγορία',
  personal: 'Προσωπικά',
  work: 'Εργασία',
  study: 'Σπουδές',
  ideas: 'Ιδέες',
  important: 'Σημαντικό',
  addCustomCategory: 'Προσθήκη Προσαρμοσμένης Κατηγορίας',
  enterCategoryName: 'Εισάγετε όνομα κατηγορίας',
  customCategory: 'Προσαρμοσμένη Κατηγορία',

  // Note Details
  noteDetails: 'Λεπτομέρειες Σημείωσης',
  createdTime: 'Ημερομηνία Δημιουργίας',
  lastModified: 'Τελευταία Τροποποίηση',
  wordCount: 'Αριθμός Λέξεων',
  characterCount: 'Αριθμός Χαρακτήρων',
};

export { en, el };