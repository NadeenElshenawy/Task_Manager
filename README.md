
🚀 TaskMaster - Student Productivity Hub

TaskMaster is a modern web application designed specifically for students to help them organize academic tasks, track course progress, and manage their schedules efficiently using integrated Firebase technologies.

 📱 Project Overview

The project features a sleek, user-centric UI built for productivity:

* Dashboard: A comprehensive view of daily progress, today's focus, and upcoming deadlines.
* Course Management: Visual cards for each subject displaying current grades, instructors, and task counts.
* Authentication System: Secure and stylish Sign-In and Sign-Up pages.


🛠 Tech Stack

* Frontend: HTML5, Tailwind CSS (for modern, responsive styling).
* Icons: Font Awesome.
* Backend & Database (Firebase):
* Firebase Authentication: Secure user access (Email/Password & Google Login integration).
* Cloud Firestore: Real-time NoSQL database for storing user profiles, courses, and tasks.


 Development Tools: VS Code, Live Server, Git/GitHub.

📂 Project Structure

📁 Public (Frontend)

assets/: images and media files

dashboard.html: main user dashboard

sign-in.html: login page

sign-up.html: account creation page

tasks.html: task management page

📁 Source (Logic & Backend Integration)
Database

auth.js: authentication logic (email & Google)

sign-up.js: user registration & Firestore profile creation

dashboard-logic.js: dynamic data fetching and UI updates

Firebase

firebase-config.js: Firebase SDK initialization

📦 Configuration

package.json: project dependencies and scripts

🌟 Key Features

1. Personalized Profiles: Unique accounts for every student storing name and university data.
2. Course Tracking: Interactive cards displaying instructors, grades, and completion percentages.
3. Quick Add: A streamlined feature to add tasks instantly from the dashboard.
4. Real-time Sync: Instant UI updates when tasks are marked as "Done" via Firestore listeners.
5. Multi-Auth Support: Flexible login options via Email or Google.

---

⚙️ Setup and Installation

1. Firebase Configuration:
* Create a project in the [Firebase Console](https://console.firebase.google.com/).
* Enable Authentication (Email/Password & Google).
* Create a Firestore Database in Test Mode.


2. Code Setup:
* Clone the repository.
* Update src/firebase/firebase-config.js with your specific Firebase API keys.


3. Run Locally:
* Open the project folder in VS Code.
* Launch public/landing_page.html using the Live Server extension.


👥 Contributors & Contributions

Nadeen Samy – Lead Developer
• UI Design
• Firebase Integration
• Backend Logic

Shahd Ashraf – UI/UX Designer
• Designed Dashboard, Sign-In, Sign-Up, and Add Task pages

Nada Ebrahiem – Frontend Developer
• Developed Landing Page and Courses pages
• Ensured UI consistency 
• Implemented button linking and navigation


📝 License:

This project was developed for academic purposes as part of a [Web Development Course under supervision of Dr.Ashraf Taha Abdel Aziz ]


