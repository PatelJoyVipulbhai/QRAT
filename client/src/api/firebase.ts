import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyCAEXGMfEyn19Jq6xTW0uoj_jrq2D86DkI",
  authDomain: "hisab-14.firebaseapp.com",
  projectId: "hisab-14",
  storageBucket: "hisab-14.firebasestorage.app",
  messagingSenderId: "696479861155",
  appId: "1:696479861155:web:14bfa0ada311fde2fd7216"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const firestore = getFirestore(app);
