import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCc93rnxvUnzvAJVNmmTFg6EroiYeHnPLM",
  authDomain: "testethcg.firebaseapp.com",
  projectId: "testethcg",
  storageBucket: "testethcg.firebasestorage.app",
  messagingSenderId: "404152663505",
  appId: "1:404152663505:web:20a98095854d58c73934f0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
