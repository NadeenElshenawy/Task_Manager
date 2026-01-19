console.log("تم تحميل ملف الـ JS بنجاح!");
alert("الملف يعمل!");
import { auth, db } from "../firebase/firebase-config.js";
import { 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithRedirect, 
    getRedirectResult 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// --- 1. التسجيل التقليدي (الإيميل والباسورد) ---
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const university = document.getElementById('university').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert("كلمات المرور غير متطابقة!");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                fullName: name,
                email: email,
                university: university,
                createdAt: new Date().toISOString(),
                uid: user.uid,
                authMethod: "email"
            });

            window.location.href = "dashboard.html";
        } catch (error) {
            handleAuthError(error);
        }
    });
}

// --- 2. التسجيل بواسطة جوجل (Redirect Mode) ---
const googleBtn = document.getElementById('googleSignupBtn');
if (googleBtn) {
    googleBtn.onclick = () => {
        const provider = new GoogleAuthProvider();
        // استخدام Redirect بدلاً من Popup لتجنب انغلاق النافذة المفاجئ
        signInWithRedirect(auth, provider);
    };
}

// --- 3. معالجة النتيجة بعد العودة من جوجل ---
// هذا الكود يعمل تلقائياً عند عودة المتصفح من صفحة جوجل إلى موقعك
getRedirectResult(auth)
    .then(async (result) => {
        if (result && result.user) {
            const user = result.user;
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (!userDoc.exists()) {
                await setDoc(doc(db, "users", user.uid), {
                    fullName: user.displayName,
                    email: user.email,
                    university: "Not Specified",
                    createdAt: new Date().toISOString(),
                    uid: user.uid,
                    authMethod: "google"
                });
            }
            window.location.href = "dashboard.html";
        }
    })
    .catch((error) => {
        console.error("Redirect Error:", error);
        if (error.code !== 'auth/redirect-cancelled-by-user') {
            alert("حدث خطأ أثناء العودة من جوجل: " + error.message);
        }
    });

// دالة مساعدة لمعالجة الأخطاء
function handleAuthError(error) {
    if (error.code === 'auth/email-already-in-use') {
        alert("هذا البريد الإلكتروني مسجل بالفعل.");
    } else if (error.code === 'auth/weak-password') {
        alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
    } else {
        alert("حدث خطأ: " + error.message);
    }
}