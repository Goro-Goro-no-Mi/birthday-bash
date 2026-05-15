// ── FIREBASE CONFIGURATION ──────────────────────────────────
// Replace these values with your own Firebase project config.
// See SETUP.md for instructions on how to get these values.


const firebaseConfig = {
  apiKey: "AIzaSyBCL5JYK5W9uqO7qOwFawF5ESX4uWJqf5A",
  authDomain: "birthday-bash-6a93a.firebaseapp.com",
  databaseURL: "https://birthday-bash-6a93a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "birthday-bash-6a93a",
  storageBucket: "birthday-bash-6a93a.firebasestorage.app",
  messagingSenderId: "547075196150",
  appId: "1:547075196150:web:e2f7ac2d99fc98764b58d7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();