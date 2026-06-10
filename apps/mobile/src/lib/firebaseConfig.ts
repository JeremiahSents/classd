// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

//TODO: Make these env variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "classd-f6db8.firebaseapp.com", //TODO: Find out if these need to be hidden or not
  projectId: "classd-f6db8",
  storageBucket: "classd-f6db8.firebasestorage.app",
  messagingSenderId: "904584111105",
  appId: "1:904584111105:web:455266fd411e6b54adcc00",
  measurementId: "G-NF6HDPXGBH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);