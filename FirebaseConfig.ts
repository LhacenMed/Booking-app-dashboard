// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_zssaAnfTzxnVOh_d0QXoNBrtKcML0NA",
  authDomain: "rnauthvideo2.firebaseapp.com",
  projectId: "rnauthvideo2",
  storageBucket: "rnauthvideo2.firebasestorage.app",
  messagingSenderId: "995000915226",
  appId: "1:995000915226:web:1d881f3439e7a1d38088a3"
};

const app = initializeApp(firebaseConfig);
// const FIREBASE_DB = getFirestore(FIREBASE_APP);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;

// "@react-native-firebase/app",
// "@react-native-firebase/auth",
// "@react-native-firebase/perf",
// "@react-native-firebase/crashlytics"