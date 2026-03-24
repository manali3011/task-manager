


// Firebase config (paste YOUR config here)
const firebaseConfig = {
  apiKey: "AIzaSyAbo0RI1oKtBUr7A3jZLvhs9zXpGe3DC8k",
  authDomain: "task-manager-b6b4c.firebaseapp.com",
  projectId: "task-manager-b6b4c",
  storageBucket: "task-manager-b6b4c.firebasestorage.app",
  messagingSenderId: "357721489292",
  appId: "1:357721489292:web:4b3092659152c9fbafe0a9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Services
const auth = firebase.auth();
const db = firebase.firestore();