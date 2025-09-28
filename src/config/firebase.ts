// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIT0T1vjeE6RCCggnKw0Ewltl-gUWw7sg",
  authDomain: "booking-app-f7f84.firebaseapp.com",
  projectId: "booking-app-f7f84",
  storageBucket: "booking-app-f7f84.firebasestorage.app",
  messagingSenderId: "3227817482",
  appId: "1:3227817482:web:a18eebb26e12aac6b7b1f3",
};
console.log(firebaseConfig);
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
export default app;
