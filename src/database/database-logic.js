import { db } from "../firebase/firebase-config.js";
import { 
    collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const coursesContainer = document.getElementById('courses-container');
const courseModal = document.getElementById('course-modal');
const taskModal = document.getElementById('task-modal');

// --- 1. تحديث الإحصائيات العلوية ---
const updateHeaderStats = (coursesCount, pendingCount, completedCount) => {
    if(document.getElementById('stat-active-courses')) document.getElementById('stat-active-courses').innerText = coursesCount;
    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = pendingCount;
    if(document.getElementById('stat-completed')) document.getElementById('stat-completed').innerText = completedCount;
};

// --- 2. عرض الكورسات مع إحصائيات Active/Done حقيقية ---
const loadCourses = async () => {
    if (!coursesContainer) return;
    try {
        const coursesSnap = await getDocs(collection(db, "courses"));
        const tasksSnap = await getDocs(collection(db, "tasks"));
        const allTasks = tasksSnap.docs.map(d => ({id: d.id, ...d.data()}));

        coursesContainer.innerHTML = "";
        
        // إحصائيات عامة للهيدر
        const totalPending = allTasks.filter(t => t.status === "pending").length;
        const totalCompleted = allTasks.filter(t => t.status === "completed").length;
        updateHeaderStats(coursesSnap.size, totalPending, totalCompleted);

        coursesSnap.forEach((courseDoc) => {
            const course = courseDoc.data();
            const id = courseDoc.id;

            // حساب أرقام التاسكات لهذا الكورس
            const courseTasks = allTasks.filter(t => t.courseId === id);
            const activeCount = courseTasks.filter(t => t.status === "pending").length;
            const doneCount = courseTasks.filter(t => t.status === "completed").length;

            coursesContainer.innerHTML += `
                <div class="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden w-full max-w-md relative group transition-all hover:shadow-lg">
                    <button onclick="deleteCourse('${id}')" class="absolute top-4 right-4 bg-white/20 hover:bg-red-500 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10">🗑️</button>
                    
                    <div style="background-color: ${course.color}" class="p-8 text-white">
                        <h3 class="text-2xl font-bold mb-1">${course.name}</h3>
                        <p class="text-sm opacity-90 flex items-center gap-2">👤 ${course.instructor}</p>
                    </div>

                    <div class="p-8 bg-white">
                        <div class="flex justify-between items-end mb-4">
                            <span class="text-slate-400 font-medium text-sm">Current Grade</span>
                            <span class="text-2xl font-bold text-slate-800">${course.grade || 'A'}</span>
                        </div>
                        <div class="w-full bg-gray-100 rounded-full h-2 mb-2">
                            <div class="h-2 rounded-full transition-all duration-700" style="width: ${course.progress}%; background-color: ${course.color}"></div>
                        </div>
                        <p class="text-[11px] text-slate-400 font-bold mb-8">${course.progress}%</p>
                        
                        <div class="grid grid-cols-2 gap-4 mb-8">
                            <div class="bg-gray-50/50 rounded-[24px] p-5 text-center border border-gray-50">
                                <p class="text-2xl font-bold text-slate-800">${activeCount}</p>
                                <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Active</p>
                            </div>
                            <div class="bg-gray-50/50 rounded-[24px] p-5 text-center border border-gray-50">
                                <p class="text-2xl font-bold text-slate-800">${doneCount}</p>
                                <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Done</p>
                            </div>
                        </div>

                        <div class="flex gap-4">
                            <button class="flex-1 py-4 bg-gray-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-gray-100">View Tasks</button>
                            <button onclick="window.openTaskModal('${id}', '${course.name}')" 
                                    class="w-14 h-14 bg-teal-400 text-white rounded-2xl flex items-center justify-center text-2xl hover:bg-teal-500 shadow-lg shadow-teal-100 transition-all active:scale-90">+</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) { console.error(e); }
};

// --- 3. إدارة الإجراءات (حذف، فتح، حفظ) ---
window.deleteCourse = async (id) => {
    if(confirm("Delete this course and its stats?")) {
        await deleteDoc(doc(db, "courses", id));
        loadCourses();
    }
};

window.openTaskModal = (id, name) => {
    taskModal.classList.remove('hidden');
    document.getElementById('task-course').innerHTML = `<option value="${id}">${name}</option>`;
};

document.getElementById('save-course-btn').onclick = async () => {
    const name = document.getElementById('new-course-name').value;
    const instructor = document.getElementById('new-course-instructor').value;
    const progress = document.getElementById('new-course-progress').value;
    const colors = ['#10b981', '#3b82f6', '#f43f5e', '#f97316'];
    
    await addDoc(collection(db, "courses"), {
        name, instructor, progress: parseInt(progress) || 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        grade: "A", createdAt: serverTimestamp()
    });
    courseModal.classList.add('hidden');
    loadCourses();
};

document.getElementById('save-task-btn').onclick = async () => {
    const title = document.getElementById('task-name').value;
    const courseId = document.getElementById('task-course').value;
    if(!title || !courseId) return alert("Fill required fields");

    await addDoc(collection(db, "tasks"), {
        title, courseId, status: "pending", 
        dueDate: document.getElementById('task-date').value,
        createdAt: serverTimestamp()
    });
    taskModal.classList.add('hidden');
    loadCourses(); // لتحديث العداد داخل الكارت فوراً
};

// البدء عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    document.getElementById('add-course-trigger').onclick = () => courseModal.classList.remove('hidden');
    document.getElementById('close-course-modal').onclick = () => courseModal.classList.add('hidden');
    document.getElementById('close-task-modal').onclick = () => taskModal.classList.add('hidden');
    document.getElementById('cancel-task-btn').onclick = () => taskModal.classList.add('hidden');
});