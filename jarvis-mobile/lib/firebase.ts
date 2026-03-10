import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { FIREBASE_CONFIG } from '../constants/config';

const app = getApps().length === 0
  ? initializeApp(FIREBASE_CONFIG)
  : getApp();

export const auth = getAuth(app);
export default app;


