import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPGPpG-YOoxfUOLygT0Gukw23B1SsXOcI",
  authDomain: "juan-daniel-f48e8.firebaseapp.com",
  projectId: "juan-daniel-f48e8",
  storageBucket: "juan-daniel-f48e8.firebasestorage.app",
  messagingSenderId: "724406543684",
  appId: "1:724406543684:web:0dc02bef7aa157d43e2311",
  measurementId: "G-MVFP3NC65L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };