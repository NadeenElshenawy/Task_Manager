import { auth, db } from "../firebase/firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// استهداف النموذج
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // جلب القيم من الحقول
        const name = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const university = document.getElementById('university').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // التحقق من تطابق كلمة المرور
        if (password !== confirmPassword) {
            alert("كلمات المرور غير متطابقة!");
            return;
        }

        try {
            // 1. إنشاء الحساب في Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. تخزين البيانات الإضافية في Firestore
            // نستخدم user.uid لربط ملف البيانات بالحساب الشخصي
            await setDoc(doc(db, "users", user.uid), {
                fullName: name,
                email: email,
                university: university,
                createdAt: new Date().toISOString(),
                uid: user.uid
            });

            alert("تم إنشاء الحساب بنجاح! 🎉");
            
            // التوجه إلى لوحة التحكم
            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Signup Error:", error.code, error.message);
            // ترجمة الأخطاء الشائعة للمستخدم
            if (error.code === 'auth/email-already-in-use') {
                alert("هذا البريد الإلكتروني مسجل بالفعل.");
            } else if (error.code === 'auth/weak-password') {
                alert("كلمة المرور ضعيفة جداً.");
            } else {
                alert("حدث خطأ: " + error.message);
            }
        }
    });
}