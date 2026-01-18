import { db, auth } from "../firebase/firebase-config.js";
import { 
    collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, query, where, getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// --- 1. دالة لإضافة إشعار محلي ---
const createNotification = (title, message) => {
    let notifications = JSON.parse(localStorage.getItem('taskNotifications') || '[]');
    notifications.unshift({
        title,
        msg: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('taskNotifications', JSON.stringify(notifications.slice(0, 10)));
    localStorage.setItem('unreadNotifications', 'true');
    
    const bell = document.querySelector('.notification-bell');
    if (bell) bell.classList.add('has-new');
};

// --- 2. دالة المزامنة الرئيسية (تم تعديلها لفلترة البيانات لكل مستخدم) ---
const syncDashboard = async (user) => {
    try {
        // جلب المهام الخاصة بالمستخدم الحالي فقط
        const tasksQuery = query(
            collection(db, "tasks"), 
            where("userId", "==", user.uid)
        );
        const tasksSnap = await getDocs(tasksQuery);
        
        // جلب الكورسات الخاصة بالمستخدم الحالي فقط
        const coursesQuery = query(
            collection(db, "courses"), 
            where("userId", "==", user.uid)
        );
        const coursesSnap = await getDocs(coursesQuery);
        
        const allTasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const allCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // تحديث عناصر الواجهة بالبيانات الخاصة بالمستخدم
        updateProgress(allTasks);
        updateTodayFocus(allTasks);
        updateUpcoming(allTasks);
        updateActiveCourses(allCourses, allTasks);
    } catch (e) { 
        console.error("Sync Error:", e); 
    }
};

// --- 3. حماية الصفحة وتحديث اسم المستخدم ديناميكياً ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // جلب اسم المستخدم من مجموعة users
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            const greetingElement = document.querySelector('h1'); 
            
            if (userDocSnap.exists() && greetingElement) {
                const userData = userDocSnap.data();
                // عرض الاسم الأول فقط كما في التصميم
                const firstName = userData.fullName ? userData.fullName.split(' ')[0] : "User";
                greetingElement.innerHTML = `Hi, ${firstName}! 👋`;
            } else if (greetingElement) {
                greetingElement.innerHTML = `Hi, ${user.displayName || 'User'}! 👋`;
            }
        } catch (e) { 
            console.error("Error fetching user name:", e); 
        }

        // تشغيل مزامنة البيانات لهذا المستخدم تحديداً
        syncDashboard(user);
    } else {
        // توجيه لصفحة الدخول إذا لم يتم العثور على جلسة نشطة
        window.location.href = "sign-in.html"; 
    }
});

// --- 4. إضافة مهمة سريعة (مربوطة بالـ UID) ---
const quickAddBtn = document.getElementById('quick-add-btn');
const quickInput = document.getElementById('quick-task-input');

if (quickAddBtn) {
    quickAddBtn.onclick = async () => {
        const taskTitle = quickInput.value.trim();
        if (!taskTitle) return alert("Please enter a task name");

        try {
            await addDoc(collection(db, "tasks"), {
                title: taskTitle,
                status: "pending",
                dueDate: new Date().toISOString().split('T')[0],
                courseId: "general",
                userId: auth.currentUser.uid, // ربط المهمة بصاحب الحساب الحالي
                createdAt: serverTimestamp()
            });
            
            quickInput.value = "";
            createNotification("Task Added", `New task: ${taskTitle}`); 
            syncDashboard(auth.currentUser); 
        } catch (e) { console.error("Quick Add Error:", e); }
    };
}

// --- 5. تحديث حالة المهمة (Check/Uncheck) ---
window.toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    try {
        await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
        if (newStatus === "completed") {
            createNotification("Goal Reached!", "You just finished a task. Keep going! 🔥");
        }
        syncDashboard(auth.currentUser);
    } catch (e) { console.error("Toggle Error:", e); }
};

// --- 6. الدوال المساعدة لتحديث واجهة المستخدم (UI) ---
const updateProgress = (tasks) => {
    const progressBar = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const completed = tasks.filter(t => t.status === "completed").length;
    const total = tasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.innerText = `${completed}/${total}`;
};

const updateTodayFocus = (tasks) => {
    const todayList = document.getElementById('today-list');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.dueDate === todayStr);

    if (todayList) {
        todayList.innerHTML = todayTasks.length > 0 ? todayTasks.map(task => `
            <div class="p-4 rounded-xl border border-teal-200 bg-teal-50/30 flex justify-between items-center animate-fadeIn">
                <div>
                    <h3 class="font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-slate-700'}">${task.title}</h3>
                    <p class="text-[10px] text-teal-600 font-bold uppercase tracking-wider">${task.timeEstimate || '15 min'}</p>
                </div>
                <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                       onclick="toggleTaskStatus('${task.id}', '${task.status}')"
                       class="w-5 h-5 accent-teal-500 cursor-pointer">
            </div>
        `).join('') : '<p class="text-gray-400 text-xs text-center py-4">No tasks for today</p>';
    }
};

const updateActiveCourses = (courses, tasks) => {
    const list = document.getElementById('active-courses-list');
    if (!list) return;
    const colors = ['bg-[#e91e63]', 'bg-[#2196f3]', 'bg-[#10b981]', 'bg-[#f97316]'];
    
    list.innerHTML = courses.length > 0 ? courses.map((course, index) => {
        const activeCount = tasks.filter(t => t.courseId === course.id && t.status === "pending").length;
        return `
            <div class="${colors[index % colors.length]} rounded-[28px] p-6 text-white shadow-sm transition-transform hover:scale-105 cursor-pointer">
                <h3 class="font-bold text-lg">${course.name}</h3>
                <p class="text-xs opacity-80 mt-1">${activeCount} active tasks</p>
            </div>
        `;
    }).join('') : '<p class="text-gray-400 text-xs py-4 col-span-full text-center">No active courses</p>';
};

const updateUpcoming = (tasks) => {
    const list = document.getElementById('upcoming-list');
    if (!list) return;
    const upcoming = tasks.filter(t => t.status === "pending").slice(0, 3);
    
    list.innerHTML = upcoming.length > 0 ? upcoming.map(t => `
        <div class="p-4 rounded-xl border border-gray-100 bg-white shadow-sm mb-3">
            <div class="flex justify-between items-start">
                <h3 class="font-bold text-sm text-slate-700">${t.title}</h3>
                <span class="text-[9px] bg-orange-50 text-orange-500 px-2 py-1 rounded-full font-bold">High</span>
            </div>
            <p class="text-[10px] text-gray-400 mt-2">${t.dueDate}</p>
        </div>
    `).join('') : '<p class="text-gray-400 text-[10px] py-2">No upcoming deadlines</p>';
};