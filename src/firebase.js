import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBgOJpe3nIsEyH2zQzcxNd--iYS3ubqdwA",
  authDomain: "school-diary-c4808.firebaseapp.com",
  projectId: "school-diary-c4808",
  storageBucket: "school-diary-c4808.firebasestorage.app",
  messagingSenderId: "692563221139",
  appId: "1:692563221139:web:760790bb74fb1ae5e40b66"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);