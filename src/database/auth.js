import { auth } from "../firebase/firebase-config.js";
import { 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// --- تسجيل الدخول بالإيميل ---
const loginForm = document.querySelector('form');
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html"; // المسار يعتمد على مكان فتح الصفحة
        } catch (error) {
            alert("خطأ في تسجيل الدخول: " + error.message);
        }
    };
}

// --- تسجيل الدخول بجوجل ---
const googleBtn = document.querySelector('button i.fa-google')?.parentElement;
if (googleBtn) {
    googleBtn.onclick = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Google Auth Error:", error);
        }
    };
}