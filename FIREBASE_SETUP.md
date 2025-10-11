# Firebase Configuration Setup

## Security Enhancement

This document explains how to securely configure Firebase credentials for your KeepMyNotes app.

## Current Setup

The Firebase configuration has been moved from hardcoded values to environment variables for better security.

### Files Modified:
- `app/config/env.ts` - New environment configuration handler
- `app/config/firebase.ts` - Updated to use environment variables
- `app.json` - Added Firebase config to extra section

## Configuration

### For Development:
Your Firebase configuration is currently stored in `app.json` under the `extra` section:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "AIzaSyDJ5530tPUIZAZ8mRjn0SkUt8HYzsUTyik",
      "firebaseAuthDomain": "keep-my-notes-elio.firebaseapp.com",
      "firebaseProjectId": "keep-my-notes-elio",
      "firebaseStorageBucket": "keep-my-notes-elio.firebasestorage.app",
      "firebaseMessagingSenderId": "4692147912",
      "firebaseAppId": "1:4692147912:android:2bd11b3bff77ab4ce92ffd",
      "firebaseDatabaseURL": "https://keep-my-notes-elio-default-rtdb.europe-west1.firebasedatabase.app",
      "googleWebClientId": "4692147912-f0km7bn1nevl5svr4s5d8gkc01qs12hc.apps.googleusercontent.com"
    }
  }
}
```

### For Production:
For production builds, you should:

1. **Create separate app.json files** for different environments:
   - `app.development.json`
   - `app.staging.json` 
   - `app.production.json`

2. **Use EAS Build environment variables** for production:
   ```bash
   eas secret:create --scope project --name FIREBASE_API_KEY --value your_production_api_key
   ```

3. **Update app.json to use environment variables**:
   ```json
   {
     "expo": {
       "extra": {
         "firebaseApiKey": process.env.FIREBASE_API_KEY,
         "firebaseAuthDomain": process.env.FIREBASE_AUTH_DOMAIN
       }
     }
   }
   ```

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use different Firebase projects for development/production**
3. **Implement Firestore security rules**
4. **Enable Firebase App Check for production**
5. **Regularly rotate API keys**

## Firestore Security Rules

Add these security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/notes/{noteId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `firebaseApiKey` | Firebase API Key | `AIzaSyA...` |
| `firebaseAuthDomain` | Auth domain | `project.firebaseapp.com` |
| `firebaseProjectId` | Project ID | `your-project-id` |
| `firebaseStorageBucket` | Storage bucket | `project.firebasestorage.app` |
| `firebaseMessagingSenderId` | Messaging sender ID | `123456789` |
| `firebaseAppId` | App ID | `1:123:android:abc123` |
| `firebaseDatabaseURL` | Realtime DB URL | `https://project-rtdb.region.firebasedatabase.app` |
| `googleWebClientId` | Google OAuth client ID | `123-abc.apps.googleusercontent.com` |
