import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = import.meta.env || {};

const firebaseFallbackConfig = {
  apiKey: 'AIzaSyAOYOaDpe53z0B39lSRMVjmzXs6EA1udfY',
  authDomain: 'app-medicos-mundo.firebaseapp.com',
  projectId: 'app-medicos-mundo',
  storageBucket: 'app-medicos-mundo.firebasestorage.app',
  messagingSenderId: '233128004767',
  appId: '1:233128004767:web:f9f560912f83c20c5566aa',
  measurementId: 'G-2J6C4ENCYK',
};

const envOrFallback = (envKey, fallbackKey) => env[envKey] || firebaseFallbackConfig[fallbackKey];

export const firebaseConfig = {
  apiKey: envOrFallback('VITE_FIREBASE_API_KEY', 'apiKey'),
  authDomain: envOrFallback('VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'),
  projectId: envOrFallback('VITE_FIREBASE_PROJECT_ID', 'projectId'),
  storageBucket: envOrFallback('VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'),
  messagingSenderId: envOrFallback('VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'),
  appId: envOrFallback('VITE_FIREBASE_APP_ID', 'appId'),
  measurementId: envOrFallback('VITE_FIREBASE_MEASUREMENT_ID', 'measurementId'),
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = 'pt-BR';
export const db = getFirestore(app);
export const storage = getStorage(app);
