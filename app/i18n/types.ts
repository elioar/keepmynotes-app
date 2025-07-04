export interface Translations {
  // General
  hello: string;
  searchHere: string;
  noNotes: string;
  noTasks: string;
  whatNotes: string;
  textNotes: string;
  recentlyEdited: string;
  characters: string;
  words: string;
  noFavorites: string;
  suggestions: string;
  dates: string;
  content: string;
  todayTasks: string;
  titleRequired: string;
  logout: string;
  profile: string;
  close: string;
  
  // Categories
  noTag: string;
  personal: string;
  work: string;
  study: string;
  ideas: string;
  important: string;
  
  // Actions
  edit: string;
  delete: string;
  hide: string;
  unhide: string;
  hideNote: string;
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
  taskDescription: string;
  taskListDescription: string;
  addNewTask: string;
  quickTask: string;
  taskTitle: string;
  enterTask: string;
  addTask: string;
  untitledTask: string;

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
  hiddenNotes: string;
  hiddenNote: string;
  unhideNote: string;
  unhideNoteConfirm: string;
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
  favorite: string;
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
  errorSavingNote: string;

  // Settings sections
  information: string;
  display: string;
  appTheme: string;
  enabled: string;
  disabled: string;

  // Authentication
  authenticateToView: string;
  usePasscode: string;
  signOut: string;
  signOutSuccess: string;
  signOutError: string;
  signIn: string;
  signInSuccess: string;
  signUp: string;
  createAccount: string;
  createAccountDescription: string;
  welcomeBack: string;
  signInDescription: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  continueWithGoogle: string;
  authError: string;
  invalidCredentials: string;
  emailInUse: string;
  weakPassword: string;
  googleSignInError: string;
  emailAlreadyInUse: string;
  signInCancelled: string;
  pleaseFillAllFields: string;
  invalidEmail: string;
  passwordRequirements: string;
  forgotPassword: string;
  enterEmailForReset: string;
  resetEmailSent: string;
  resetError: string;
  emailNotRegistered: string;
  password: string;
  or: string;

  // Note Details
  noteDetails: string;
  createdTime: string;
  lastModified: string;
  wordCount: string;
  characterCount: string;
  readingMode: string;
  search: string;
  searchInNote: string;
  deleteNote: string;
  deleteNoteConfirm: string;
  errorDeletingNote: string;

  // Favorites
  addToFavorites: string;
  removeFromFavorites: string;

  // Sharing
  share: string;
  shareAsText: string;
  shareAsImage: string;
  shareAsTextDescription: string;
  shareAsImageDescription: string;
  errorSharingImage: string;

  // Categories
  selectCategory: string;
  enterCategoryName: string;
  addCustomCategory: string;
  customCategory: string;
  categoryAdded: string;
  categoryExists: string;
  categoryError: string;

  // Note History
  daysLeft: string;
  daysRemaining: string;
  dayRemaining: string;
  expiresIn: string;

  // Calendar
  calendar: string;
  noNotesForDate: string;
  showMonth: string;
  tasksFor: string;
  noTasksForDate: string;

  // Task
  dueDate: string;
  dueTime: string;
  allDay: string;
  addLocation: string;
  reminder: string;
  priority: string;
  low: string;
  medium: string;
  high: string;
  location: string;
  time: string;
  date: string;
  setPriority: string;
  setReminder: string;
  addReminder: string;
  taskDetails: string;
  taskLocation: string;
  taskPriority: string;
  taskReminder: string;
  taskDueDate: string;
  taskDueTime: string;
  taskAllDay: string;
  noLocation: string;

  // Reset Data
  resetData: string;
  resetDataConfirm: string;
  reset: string;
  dataDeletedSuccess: string;
  resetDataError: string;
  dangerZone: string;
  resetDataWarning: string;
  finalWarning: string;
  noUndoWarning: string;
  continue: string;

  // Side Menu
  sideMenuMain: string;
  sideMenuTasks: string;
  sideMenuOther: string;
  home: string;
  sideMenuFavorites: string;
  sideMenuSettings: string;
  yourNotes: string;
  
  // Backup & Restore
  backupAndRestore: string;
  backupAndRestoreTitle: string;
  backupAndRestoreDescription: string;

  // Trash
  trash: string;
  trashDescription: string;
  noTrashItems: string;
  restoreFromTrash: string;
  deleteForever: string;
  emptyTrash: string;
  emptyTrashConfirm: string;
  noteMovedToTrash: string;
  noteRestoredFromTrash: string;
  noteDeletedForever: string;
  daysUntilDeletion: string;
  autoDeleteWarning: string;

  // Trash Settings
  trashSettings: string;
  retentionPeriod: string;
  retentionPeriodDescription: string;
  days: string;
  customRetention: string;
  setRetentionPeriod: string;

  // Task Repeat Options
  repeat: string;
  customRepeat: string;
  none: string;
  daily: string;
  weekly: string;
  monthly: string;
  yearly: string;
  custom: string;
  weeks: string;
  months: string;
  years: string;

  // Custom repeat modal
  every: string;
  set: string;

  // Reminder Time
  reminderTime: string;
  '1hourBefore': string;
  '1dayBefore': string;
  '2daysBefore': string;
  '1weekBefore': string;

  // Notifications
  notificationPermissionRequired: string;
  notificationPermissionMessage: string;
  notificationTimePassed: string;
  notificationTimePassedMessage: string;
  notificationScheduled: string;
  notificationScheduledMessage: string;
  notificationError: string;
  notificationErrorMessage: string;

  // New translations
  '30minBefore': string;
  'customReminder': string;
  'enterMinutes': string;
  'enterMinutesDescription': string;
  'enterTime': string;
  'enterTimeDescription': string;
  'invalidTime': string;
  'invalidTimeMessage': string;
  'before': string;
  'ok': string;
  'reminder30min': string;
  'reminder1hour': string;
  'reminder1day': string;
  'reminder1week': string;

  // Analytics
  analytics: string;
  analyticsAndStats: string;
  analyticsDescription: string;
  notesOverview: string;
  totalNotes: string;
  tasksOverview: string;
  totalTasks: string;
  completedTasks: string;
  pendingTasks: string;
  completionRate: string;
  categoriesOverview: string;
  totalCategories: string;
  usageStats: string;
  lastActive: string;
  totalTimeSpent: string;
  hours: string;
  minutes: string;

  // New additions
  sessions: string;
  averages: string;
  dailyAverage: string;
  weeklyAverage: string;
  activityPatterns: string;
  mostActiveDay: string;
  mostActiveHour: string;
  usageStatsDescription: string;

  // Profile
  usernameRequired: string;
  profileUpdated: string;
  profileUpdateError: string;
  completeProfile: string;
  completeProfileDescription: string;
  profileDescription: string;
  editProfile: string;
  complete: string;
  firstName: string;
  lastName: string;
  phone: string;
  userLocation: string;
  birthday: string;
  enterFirstName: string;
  enterLastName: string;
  enterPhone: string;
  enterLocation: string;
  selectBirthday: string;
  changePhoto: string;
  email: string;
  saving: string;
  errorPickingImage: string;
  verificationEmailSent: string;
  verificationEmailError: string;
  deleteAccount: string;
  deleteAccountConfirmation: string;
  accountDeleted: string;
  deleteAccountError: string;
  personalInfo: string;
  contactInfo: string;
  accountSettings: string;
  changePassword: string;
  emailVerification: string;
  verified: string;
  verify: string;

  // Guest
  guest: string;

  // Password Validation

  mediumPassword: string;
  strongPassword: string;
  tooManyAttempts: string;
  networkError: string;
  accountCreated: string;

  // Change Password
  passwordsDontMatch: string;
  passwordChanged: string;
  passwordChangeError: string;
  currentPasswordIncorrect: string;
  recentLoginRequired: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  passwordTooShort: string;
  passwordNoUpperCase: string;
  passwordNoLowerCase: string;
  passwordNoNumber: string;
  passwordNoSpecialChar: string;
}

export { en } from './en';
export { el } from './el'; 