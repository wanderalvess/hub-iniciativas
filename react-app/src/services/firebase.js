import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCfM3934AV7iIK4uVS3gAvqnN2E7tTwyCI",
  authDomain: "hub-de-iniciativas-847f0.firebaseapp.com",
  projectId: "hub-de-iniciativas-847f0",
  storageBucket: "hub-de-iniciativas-847f0.firebasestorage.app",
  messagingSenderId: "324926139052",
  appId: "1:324926139052:web:0bfdf5e8ad3d120eedcd09",
  measurementId: "G-KN8048VQM1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Habilita persistência offline (Multi-Tab) de forma assíncrona
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  console.warn("Firestore persistence could not be enabled:", err.code);
});

