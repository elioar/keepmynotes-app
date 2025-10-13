import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { firebaseConfig } from './env';

// Initialize Firebase if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Ensure persistent auth state on React Native (app restarts)
let auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (_e) {
    return getAuth(app);
  }
})();

const db = getFirestore(app);

// Configure Google Sign-In with environment variable
GoogleSignin.configure({
  webClientId: firebaseConfig.webClientId,
});

export { auth, db, GoogleSignin };
export default app; 