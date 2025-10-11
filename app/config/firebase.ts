import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { firebaseConfig } from './env';

// Initialize Firebase if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Configure Google Sign-In with environment variable
GoogleSignin.configure({
  webClientId: firebaseConfig.webClientId,
});

export { auth, db, GoogleSignin };
export default app; 