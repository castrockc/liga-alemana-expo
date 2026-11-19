import { Platform } from "react-native";

import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";


const firebaseConfig = {
  apiKey: "AIzaSyBPVxk2OINYTf_nohTvwVKxuxG_TXJ7SLQ",
  authDomain: "liga-alemana-6fd7a.firebaseapp.com",
  projectId: "liga-alemana-6fd7a",
  storageBucket: "liga-alemana-6fd7a.firebasestorage.app",
  messagingSenderId: "1088128763583",
  appId: "1:1088128763583:web:db0e33ae834333fa32680a",
  measurementId: "G-NB5NFFZPSS"
};


const app = initializeApp(firebaseConfig);


export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export const db = getFirestore(app);

// Exportar Firebase
export default app;