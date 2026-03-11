import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, browserLocalPersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../constants/config';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

// Initialize Auth with platform-specific persistence
let auth: any;

const initializeJarvisAuth = () => {
  if (getApps().length > 0) {
    try {
      return getAuth(app);
    } catch (e) {
      // Not initialized yet
    }
  }
  
  if (Platform.OS === 'web') {
    return initializeAuth(app, {
      persistence: browserLocalPersistence
    });
  } else {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
};

auth = initializeJarvisAuth();

export { auth };
export default app;
