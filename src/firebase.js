import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';  // Add this import

const firebaseConfig = {
  apiKey: "AIzaSyA5710L4hS_-WvqqgJjFtt-HePEQ2ziqDM",
  authDomain: "academy-b14da.firebaseapp.com",
  projectId: "academy-b14da",
  storageBucket: "academy-b14da.appspot.com",
  messagingSenderId: "842638530067",
  appId: "1:842638530067:web:87e1b261295115f0f691e6",
  measurementId: "G-W2BJR4G1L0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);  // Initialize storage

auth.useDeviceLanguage();

export { auth, app, storage };  // Export storage