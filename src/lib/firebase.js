// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZreK6wed9Y4HzddzXiFXsL8Cyl1921RQ",
  authDomain: "mariannagym-9672e.firebaseapp.com",
  databaseURL: "https://mariannagym-9672e-default-rtdb.firebaseio.com/",
  projectId: "mariannagym-9672e",
  storageBucket: "mariannagym-9672e.firebasestorage.app",
  messagingSenderId: "372540019319",
  appId: "1:372540019319:web:11904beb36482321116c72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app;

