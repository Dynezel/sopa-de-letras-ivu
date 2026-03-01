// ⚠️ Reemplazá con tus credenciales de Firebase
// Firebase Console → Project Settings → Tu app web

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT.firebaseapp.com",
  databaseURL:       "https://TU_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "TU_PROJECT",
  storageBucket:     "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
