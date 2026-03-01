// ⚠️  REEMPLAZÁ estos valores con los de tu proyecto Firebase
// (los encontrás en Firebase Console → Project Settings → Tu app web)

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB4xhTtu2k1HSlaG52PXlU-1cLshWJ0U4o",
  authDomain: "sopa-de-letras-2b189.firebaseapp.com",
  databaseURL: "https://sopa-de-letras-2b189-default-rtdb.firebaseio.com",
  projectId: "sopa-de-letras-2b189",
  storageBucket: "sopa-de-letras-2b189.firebasestorage.app",
  messagingSenderId: "1091757469540",
  appId: "1:1091757469540:web:78cce61fe481054946d471",
  measurementId: "G-G3VLC073H1"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
