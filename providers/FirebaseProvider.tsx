import Colors from '@/constants/Colors';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import React, { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCGbFCqC5ivj3PruUj3vceWTRXDuc6549Q",
  authDomain: "cardinal-chats-362c9.firebaseapp.com",
  projectId: "cardinal-chats-362c9",
  storageBucket: "cardinal-chats-362c9.firebasestorage.app",
  messagingSenderId: "436735050988",
  appId: "1:436735050988:web:0e9692b868b8df1879d1c9",
  measurementId: "G-7HBT8H9RZ4"
};

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      getAuth(app);
      getFirestore(app);
      getStorage(app);
      setIsInitialized(true);
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }, []);

  if (!isInitialized) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return <>{children}</>;
}