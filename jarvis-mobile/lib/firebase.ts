import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../constants/config';


const app = getApps().length === 0
  ? initializeApp(FIREBASE_CONFIG)
  : getApp();

let authInstance;
try {
  authInstance = getAuth(app);
} catch (e) {
  authInstance = initializeAuth(app, {
    // @ts-ignore
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export const auth = authInstance;
export default app;




