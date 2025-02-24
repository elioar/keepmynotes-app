export interface Translations {
  // General
  hello: string;
  searchHere: string;
  noNotes: string;
  whatNotes: string;
  textNotes: string;
  recentlyEdited: string;
  characters: string;
  
  // Actions
  edit: string;
  delete: string;
  hide: string;
  unhide: string;
  save: string;
  cancel: string;
  add: string;
  discard: string;
  chooseColor: string;
  back: string;
  done: string;

  // Add Note
  addNewNote: string;
  newTask: string;
  camera: string;
  drawingSketch: string;
  audioFile: string;

  // Notes
  noteOptions: string;
  noteHidden: string;
  addNote: string;
  editNote: string;
  newNote: string;
  title: string;
  description: string;
  enterTitle: string;
  enterDescription: string;
  writeYourNote: string;
  unsavedChanges: string;
  unsavedChangesMessage: string;
  noHiddenNotes: string;
  hiddenNotesDescription: string;
  noteHistory: string;
  restoreVersion: string;
  noVersionsAvailable: string;
  seeMore: string;
  seeLess: string;
  restore: string;
  restoreVersionConfirm: string;

  // Filters
  filters: string;
  filterResults: string;
  clearFilters: string;
  applyFilters: string;
  filterBy: string;
  filterByDate: string;
  filterByType: string;
  filterByStatus: string;
  noResults: string;
  selectedFilters: string;
  showingResults: string;
  notes: string;
  tasks: string;
  favorites: string;
  today: string;
  week: string;
  month: string;
  recent: string;
  thisWeek: string;
  thisMonth: string;
  clearFilter: string;

  // Settings
  settings: string;
  theme: string;
  language: string;
  darkMode: string;
  lightMode: string;
  system: string;
  username: string;
  enterUsername: string;
  updateUsername: string;
  security: string;
  appLock: string;
  biometrics: string;
  pinCode: string;
  changePinCode: string;
  about: string;
  version: string;
  rateApp: string;
  shareApp: string;
  privacyPolicy: string;
  termsOfService: string;

  // PIN & Security
  enterPin: string;
  reenterPin: string;
  pinNotMatching: string;
  pinChanged: string;
  pinCreated: string;
  incorrectPin: string;
  tryAgain: string;
  forgotPin: string;
  enableBiometrics: string;
  useBiometrics: string;
  unlockWithBiometrics: string;
  secureNotes: string;
  secureNotesDescription: string;
  setPinCode: string;
  changePinDescription: string;
  downloadBackup: string;
  downloadBackupDescription: string;
  uploadBackup: string;
  uploadBackupDescription: string;
  enterPinCode: string;
  changePin: string;
  biometricAuth: string;
  enterCurrentPin: string;
  choosePinCode: string;
  confirmPinCode: string;
  pinsDontMatch: string;
  success: string;

  // Theme
  systemTheme: string;
  lightTheme: string;
  darkTheme: string;

  // Languages
  english: string;
  greek: string;
  spanish: string;

  // Time
  now: string;
  justNow: string;
  minuteAgo: string;
  minutesAgo: string;
  hourAgo: string;
  hoursAgo: string;
  dayAgo: string;
  daysAgo: string;
  monthAgo: string;
  monthsAgo: string;
  yearAgo: string;
  yearsAgo: string;

  // Tags
  tags: string;
  addTag: string;
  enterTag: string;
  tagColors: {
    none: string;
    green: string;
    purple: string;
    blue: string;
    orange: string;
    red: string;
  };

  // Onboarding
  welcome: string;
  welcomeDescription: string;
  organize: string;
  organizeDescription: string;
  secure: string;
  secureDescription: string;
  skip: string;
  next: string;
  getStarted: string;

  // User Preferences Setup
  setupProfile: string;
  setupProfileDescription: string;
  continue: string;

  // Backup functionality
  backupNotes: string;
  exportNotesTitle: string;
  exportError: string;
  preparingBackup: string;
  importNotesTitle: string;
  readingBackupFile: string;
  invalidBackupFormat: string;
  invalidNotesFormat: string;
  noNotesInBackup: string;
  backupDetails: string;
  import: string;
  importSuccessDetails: string;
  importError: string;
  invalidBackupFile: string;
  fileSelectionError: string;
  error: string;

  // Settings sections
  information: string;
  display: string;
  appTheme: string;
  enabled: string;
  disabled: string;

  // Authentication
  authenticateToView: string;
  usePasscode: string;

  // Note Details
  noteDetails: string;
  createdTime: string;
  lastModified: string;
  wordCount: string;
  characterCount: string;
  readingMode: string;
}

export default {} as { Translations: Translations }; 