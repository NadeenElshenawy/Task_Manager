import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAf97syIE_fA0V1cU8ilrW-_EbJstWRzBU",
  authDomain: "student-task-manager-9c541.firebaseapp.com",
  projectId: "student-task-manager-9c541",
  storageBucket: "student-task-manager-9c541.firebasestorage.app",
  messagingSenderId: "986930291554",
  appId: "1:986930291554:web:14e12b1314f5aa356f023b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };