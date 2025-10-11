import Constants from 'expo-constants';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL: string;
  webClientId: string;
}

// Get Firebase configuration from environment variables
const getFirebaseConfig = (): FirebaseConfig => {
  const extra = Constants.expoConfig?.extra;
  
  if (!extra) {
    throw new Error('Expo config extra not found. Please check your app.json configuration.');
  }

  const config = {
    apiKey: extra.firebaseApiKey,
    authDomain: extra.firebaseAuthDomain,
    projectId: extra.firebaseProjectId,
    storageBucket: extra.firebaseStorageBucket,
    messagingSenderId: extra.firebaseMessagingSenderId,
    appId: extra.firebaseAppId,
    databaseURL: extra.firebaseDatabaseURL,
    webClientId: extra.googleWebClientId,
  };

  // Validate that all required config values are present
  const missingKeys = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase configuration keys: ${missingKeys.join(', ')}. ` +
      'Please check your environment variables in app.json extra section.'
    );
  }

  return config;
};

export const firebaseConfig = getFirebaseConfig();







