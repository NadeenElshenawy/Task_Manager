import { db } from "../firebase/firebase-config.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// --- 1. Tasks Functions (إضافة وجلب المهام) ---

/**
 * دالة لإضافة مهمة جديدة
 * تعالج مشكلة الـ undefined عن طريق وضع قيم افتراضية
 */
export const createNewTask = async (taskData) => {
    try {
        const docRef = await addDoc(collection(db, "tasks"), {
            title: taskData.name || "Untitled Task",
            description: taskData.description || "", // حل مشكلة الـ undefined
            dueDate: taskData.dueDate || "No Date",
            priority: taskData.priority || "Medium", 
            courseId: taskData.courseId || "General",
            status: taskData.status || "pending",
            createdAt: serverTimestamp() // إضافة توقيت السيرفر
        });
        console.log("Task created with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding task: ", e);
        throw e;
    }
};

/**
 * دالة لجلب كل المهام مرتبة بالأحدث
 */
export const getAllTasks = async () => {
    try {
        const tasksCol = collection(db, "tasks");
        const q = query(tasksCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching tasks: ", e);
        return [];
    }
};

// --- 2. Courses Functions (إضافة وجلب الكورسات) ---

/**
 * دالة لإضافة كورس جديد
 */
export const createNewCourse = async (courseData) => {
    try {
        const docRef = await addDoc(collection(db, "courses"), {
            name: courseData.name || "New Course",
            instructor: courseData.instructor || "Unknown",
            currentGrade: courseData.grade || 0,
            colorGradient: courseData.gradient || "linear-gradient(to right, #00ced1, #008b8b)",
            createdAt: serverTimestamp()
        });
        console.log("Course created with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding course: ", e);
        throw e;
    }
};

/**
 * دالة لجلب كل الكورسات
 */
export const getAllCourses = async () => {
    try {
        const coursesCol = collection(db, "courses");
        const snapshot = await getDocs(coursesCol);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching courses: ", e);
        return [];
    }
};