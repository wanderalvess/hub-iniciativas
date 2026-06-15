import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login com E-mail e Senha
  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Login com Google
  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Logout
  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    let unsubUserDoc = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 1. Define imediatamente o perfil básico para destravar a UI do app sem esperar rede
        const initialProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Membro do Time',
          photoURL: firebaseUser.photoURL || '',
          teamId: '', // Vazio inicialmente para exigir onboarding se não estiver no Firestore
          role: 'member',
          createdAt: new Date()
        };
        setUser(initialProfile);

        // 2. Escuta o perfil completo do Firestore em tempo real
        const userDocRef = doc(db, `users/${firebaseUser.uid}`);
        unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data());
          } else {
            // Cria no banco em background se não existir
            setDoc(userDocRef, initialProfile, { merge: true })
              .catch(saveErr => console.warn('Erro ao registrar perfil padrão em background:', saveErr));
          }
          setLoading(false);
        }, (readErr) => {
          console.warn('Erro ao carregar perfil do Firestore em tempo real:', readErr);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
        if (unsubUserDoc) {
          unsubUserDoc();
          unsubUserDoc = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const value = {
    user,
    loading,
    loginWithEmail,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
