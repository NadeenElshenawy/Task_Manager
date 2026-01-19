import { db, auth } from "../firebase/firebase-config.js";
import { 
    collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, 
    query, where, getDoc, onSnapshot // تم إضافة onSnapshot هنا
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

// --- 2. دالة المزامنة الرئيسية (تم دمج إحصائيات الأسبوع هنا) ---
const syncDashboard = (user) => {
    // مراقبة المهام لحظياً
    const tasksQuery = query(
        collection(db, "tasks"), 
        where("userId", "==", user.uid)
    );

    // هذا هو المكان الصحيح لـ onSnapshot
    onSnapshot(tasksQuery, (tasksSnap) => {
        const allTasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // جلب الكورسات (يمكنك استخدام onSnapshot هنا أيضاً إذا أردتِ استجابة أسرع لتغييرات الكورسات)
        const coursesQuery = query(
            collection(db, "courses"), 
            where("userId", "==", user.uid)
        );
        
        getDocs(coursesQuery).then(coursesSnap => {
            const allCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // تحديث جميع عناصر الواجهة فور حدوث أي تغيير في Firestore
            updateProgress(allTasks);
            updateTodayFocus(allTasks);
            updateUpcoming(allTasks);
            updateWeeklyStats(allTasks); // <--- تم إضافة الربط هنا ليصبح قسم الأسبوع ديناميكياً
            updateActiveCourses(allCourses, allTasks);
        });
    }, (error) => {
        console.error("Error in Snapshot listener:", error);
    });
};

// --- 3. حماية الصفحة وتحديث البيانات ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            const greetingElement = document.getElementById('greeting-text'); // تأكدي من الـ ID في HTML
            const h1Element = document.querySelector('h1');

            if (userDocSnap.exists() && h1Element) {
                const userData = userDocSnap.data();
                const firstName = userData.fullName ? userData.fullName.split(' ')[0] : "User";
                h1Element.innerHTML = `Hi, ${firstName}! 👋`;
            }
        } catch (e) { 
            console.error("Error fetching user name:", e); 
        }
        syncDashboard(user);
    } else {
        window.location.href = "sign-in.html"; 
    }
});

// --- 4. إضافة مهمة سريعة (تم تصحيح المتغيرات المفقودة) ---
const quickAddBtn = document.getElementById('quick-add-btn');
const quickInput = document.getElementById('quick-task-input');

if (quickAddBtn) {
    quickAddBtn.onclick = async () => {
        const taskTitle = quickInput.value.trim();
        if (!taskTitle) return alert("Please enter a task name");

        try {
            await addDoc(collection(db, "tasks"), {
                title: taskTitle, // تم تصحيح الاسم هنا
                courseId: "general", // افتراضي للمهام السريعة
                status: "pending", 
                userId: auth.currentUser.uid,
                dueDate: new Date().toISOString().split('T')[0], // وضع تاريخ اليوم تلقائياً للمهام السريعة
                createdAt: serverTimestamp()
            }); 
            quickInput.value = "";
            createNotification("Task Added", `New task: ${taskTitle}`); 
            // لا حاجة لاستدعاء syncDashboard يدوياً لأن onSnapshot سيكتشف الإضافة
        } catch (e) { 
            console.error("Quick Add Error:", e); 
        }
    };
}

// --- 5. تحديث حالة المهمة ---
window.toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, { 
            status: newStatus 
        });
        if (newStatus === "completed") {
            createNotification("Goal Reached!", "Task finished! 🔥");
        }
    } catch (e) { 
        console.error("Toggle Error:", e); 
    }
};

// --- 6. الدوال المساعدة لتحديث واجهة المستخدم ---
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
    // فلترة المهام التي لم تكتمل وتاريخها اليوم
    const todayTasks = tasks.filter(t => t.dueDate === todayStr && t.status === "pending");

    if (todayList) {
        todayList.innerHTML = todayTasks.length > 0 ? todayTasks.map(task => `
            <div class="p-4 rounded-xl border border-teal-200 bg-teal-50/30 flex justify-between items-center">
                <div>
                    <h3 class="font-medium text-slate-700">${task.title}</h3>
                    <p class="text-[10px] text-teal-600 font-bold uppercase tracking-wider">${task.timeEstimate || '15 min'}</p>
                </div>
                <input type="checkbox" 
                       onclick="toggleTaskStatus('${task.id}', '${task.status}')"
                       class="w-5 h-5 accent-teal-500 cursor-pointer">
            </div>
        `).join('') : '<p class="text-gray-400 text-xs text-center py-4">No pending tasks for today</p>';
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

    // فلترة المهام التي لم تكتمل فقط (pending)
    const upcoming = tasks.filter(t => t.status === "pending").slice(0, 3);
    
    list.innerHTML = upcoming.length > 0 ? upcoming.map(t => `
        <div class="p-4 rounded-xl border border-gray-100 bg-white shadow-sm mb-3 flex justify-between items-center group">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-sm text-slate-700">${t.title}</h3>
                    <span class="text-[9px] bg-orange-50 text-orange-500 px-2 py-1 rounded-full font-bold">High</span>
                </div>
                <p class="text-[10px] text-gray-400">${t.dueDate}</p>
            </div>
            
            <input type="checkbox" 
                   onclick="toggleTaskStatus('${t.id}', '${t.status}')"
                   class="w-5 h-5 accent-teal-500 cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity">
        </div>
    `).join('') : '<p class="text-gray-400 text-[10px] py-2">No upcoming deadlines</p>';
};
const updateWeeklyStats = (tasks) => {
    const container = document.getElementById('week-days-container');
    if (!container) return;

    const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    let html = '';

    // سنعرض 5 أيام (اليوم + 4 أيام قادمة)
    for (let i = 0; i < 5; i++) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + i);
        
        const dateString = targetDate.toISOString().split('T')[0]; // صيغة YYYY-MM-DD
        const dayLabel = daysName[targetDate.getDay()];
        
        // حساب عدد المهام لهذا التاريخ
        const dailyCount = tasks.filter(t => t.dueDate === dateString).length;
        const isToday = i === 0;

        if (isToday) {
            // تصميم اليوم الحالي (الأخضر)
            html += `
                <div class="bg-teal-500 text-white rounded-xl px-4 py-3 flex justify-between items-center shadow-sm">
                    <span class="font-medium">${dayLabel} · Today</span>
                    <div class="flex items-center gap-2">
                         <span class="text-[10px] bg-white/30 px-2 py-1 rounded-full">${dailyCount} tasks</span>
                         <span class="text-[10px] bg-white/40 px-2 py-1 rounded-full uppercase font-bold">Current</span>
                    </div>
                </div>`;
        } else {
            // تصميم الأيام القادمة
            html += `
                <div class="p-4 rounded-xl border border-slate-100 text-sm text-slate-500 flex justify-between items-center hover:bg-slate-50 transition-all">
                    <span class="font-medium">${dayLabel}</span>
                    <span class="text-xs text-slate-400 font-semibold">${dailyCount} tasks</span>
                </div>`;
        }
    }
    container.innerHTML = html;
};