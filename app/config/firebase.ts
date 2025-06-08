import { initializeApp, getApps, getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJ5530tPUIZAZ8mRjn0SkUt8HYzsUTyik",
  authDomain: "keep-my-notes-elio.firebaseapp.com",
  projectId: "keep-my-notes-elio",
  storageBucket: "keep-my-notes-elio.firebasestorage.app",
  messagingSenderId: "4692147912",
  appId: "1:4692147912:android:2bd11b3bff77ab4ce92ffd",
  databaseURL: "https://keep-my-notes-elio-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '4692147912-f0km7bn1nevl5svr4s5d8gkc01qs12hc.apps.googleusercontent.com', // Get this from your Google Cloud Console
});

// Initialize Database
const db = database(app);

export { auth, db, GoogleSignin };
export default app; 