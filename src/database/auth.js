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
            window.location.href = "dashboard.html"; 
        } catch (error) {
            console.error("Email Login Error:", error);
            alert("خطأ في تسجيل الدخول: " + error.message);
        }
    };
}

// --- تسجيل الدخول بجوجل ---
const googleBtn = document.querySelector('button i.fa-google')?.parentElement;
if (googleBtn) {
    // تعديل بسيط: منع الزر من عمل Submit للـ Form إذا كان بداخله
    googleBtn.type = "button"; 
    
    googleBtn.onclick = async (e) => {
        e.preventDefault(); // منع أي سلوك افتراضي مفاجئ
        const provider = new GoogleAuthProvider();
        
        try {
            // إضافة انتظار النتيجة لضمان التوجيه الصحيح
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
                window.location.href = "dashboard.html";
            }
        } catch (error) {
            console.error("Google Auth Error:", error);
            // تنبيه المستخدم في حال تم إغلاق النافذة المنبثقة
            if (error.code !== 'auth/cancelled-popup-request') {
                alert("حدث خطأ أثناء تسجيل الدخول بجوجل");
            }
        }
    };
}