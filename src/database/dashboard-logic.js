import { db, auth } from "../firebase/firebase-config.js";
import { 
    collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, query, where 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// --- دالة لإضافة إشعار محلي ---
const createNotification = (title, message) => {
    let notifications = JSON.parse(localStorage.getItem('taskNotifications') || '[]');
    notifications.unshift({
        title,
        msg: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('taskNotifications', JSON.stringify(notifications.slice(0, 10)));
    localStorage.setItem('unreadNotifications', 'true');
    // تحديث شكل الجرس إذا كان موجوداً في الصفحة
    const bell = document.querySelector('.notification-bell');
    if (bell) bell.classList.add('has-new');
};

// --- دالة المزامنة الرئيسية ---
const syncDashboard = async (user) => {
    try {
        // جلب المهام الخاصة بالمستخدم الحالي فقط (أفضل للأمان)
        const tasksSnap = await getDocs(collection(db, "tasks"));
        const coursesSnap = await getDocs(collection(db, "courses"));
        
        const allTasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const allCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        updateProgress(allTasks);
        updateTodayFocus(allTasks);
        updateUpcoming(allTasks);
        updateActiveCourses(allCourses, allTasks);
    } catch (e) { console.error("Sync Error:", e); }
};

// --- حماية الصفحة والتأكد من تسجيل الدخول ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        syncDashboard(user);
    } else {
        window.location.href = "sign-in.html"; // توجيه لصفحة الدخول إذا لم يكن مسجلاً
    }
});

// --- إضافة مهمة سريعة (Quick Add) ---
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
                userId: auth.currentUser.uid, // ربط المهمة بالمستخدم
                createdAt: serverTimestamp()
            });
            
            quickInput.value = "";
            createNotification("Task Added", `New task: ${taskTitle}`); // إطلاق إشعار
            alert("Task added successfully! 🎉");
            syncDashboard(auth.currentUser); 
        } catch (e) { console.error("Quick Add Error:", e); }
    };
}

// --- تحديث حالة المهمة (Toggle) ---
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

// --- الدوال المساعدة (UI Updates) ---
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
        todayList.innerHTML = todayTasks.map(task => `
            <div class="p-4 rounded-xl border border-teal-200 bg-teal-50/30 flex justify-between items-center animate-fadeIn">
                <div>
                    <h3 class="font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-slate-700'}">${task.title}</h3>
                    <p class="text-[10px] text-teal-600 font-bold uppercase tracking-wider">${task.timeEstimate || '15 min'}</p>
                </div>
                <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                       onclick="toggleTaskStatus('${task.id}', '${task.status}')"
                       class="w-5 h-5 accent-teal-500 cursor-pointer">
            </div>
        `).join('');
    }
};

const updateActiveCourses = (courses, tasks) => {
    const list = document.getElementById('active-courses-list');
    if (!list) return;
    const colors = ['bg-[#e91e63]', 'bg-[#2196f3]', 'bg-[#10b981]', 'bg-[#f97316]'];
    list.innerHTML = courses.map((course, index) => {
        const activeCount = tasks.filter(t => t.courseId === course.id && t.status === "pending").length;
        return `
            <div class="${colors[index % colors.length]} rounded-[28px] p-6 text-white shadow-sm transition-transform hover:scale-105 cursor-pointer">
                <h3 class="font-bold text-lg">${course.name}</h3>
                <p class="text-xs opacity-80 mt-1">${activeCount} active tasks</p>
            </div>
        `;
    }).join('');
};

const updateUpcoming = (tasks) => {
    const list = document.getElementById('upcoming-list');
    if (!list) return;
    const upcoming = tasks.filter(t => t.status === "pending").slice(0, 3);
    list.innerHTML = upcoming.map(t => `
        <div class="p-4 rounded-xl border border-gray-100 bg-white shadow-sm mb-3">
            <div class="flex justify-between items-start">
                <h3 class="font-bold text-sm text-slate-700">${t.title}</h3>
                <span class="text-[9px] bg-orange-50 text-orange-500 px-2 py-1 rounded-full font-bold">High</span>
            </div>
            <p class="text-[10px] text-gray-400 mt-2">${t.dueDate}</p>
        </div>
    `).join('');
};