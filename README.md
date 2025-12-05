🚀 EduBridge Africa — Student Performance Monitor

A modern web platform designed to improve student performance and expand access to quality education across Africa. EduBridge Africa bridges gaps between students, parents, teachers, and administrators through real-time tracking, analytics, and communication.

📘 Mission

Our mission is to empower students and educators by leveraging technology to solve challenges such as:

Limited access to academic resources

Weak engagement between parents, teachers, and students

Lack of effective systems to track performance and attendance

EduBridge Africa provides an end-to-end platform that strengthens communication, enhances visibility, and improves learning outcomes.

🔑 Key Features

Real-Time Performance Tracking – View grades, assignments, and progress instantly

Automatic Parent Alerts – Email notifications for low grades or attendance issues

Stakeholder Engagement – Connect parents, teachers, students, and admins

Analytics & Reports – Clear insights into performance trends

Messaging Hub – Direct communication between all user roles

Resource Center – Access learning materials and documents

📂 Project Structure
edubridge-africa/
├── backend/      # Express API + SQLite database
└── frontend/     # React (Vite) web app


A full detailed tree is included in the original project structure above.

🛠️ Getting Started
Prerequisites

Node.js v14+

npm or yarn

No external DB needed (uses SQLite file database)

🔧 Backend Setup
1️⃣ Navigate to backend
cd backend

2️⃣ Install dependencies
npm install

3️⃣ Create .env
PORT=5000
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
NODE_ENV=development

# Email (Parent Alerts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@edubridge-africa.com

4️⃣ Start server
npm run dev

5️⃣ (Optional) Add sample test data
npm run add-test-data


Backend runs at: http://localhost:5000

🎨 Frontend Setup
1️⃣ Navigate to frontend
cd frontend

2️⃣ Install dependencies
npm install

3️⃣ Create .env
VITE_API_URL=http://localhost:5000/api

4️⃣ Start React app
npm run dev


Frontend runs at: http://localhost:3000

🧪 Test Data (Optional)

Running:

npm run add-test-data


Creates sample:

👨‍🎓 Students
Name	Email	Password
Ishimwe Bruno	ishimwe.bruno@student.edubridge.africa
	student123
Gasasira Emmy	gasasira.emmy@student.edubridge.africa
	student123
Uwishema Arnold	uwishema.arnold@student.edubridge.africa
	student123
👨‍🏫 Teacher

Email: teacher@edubridge.africa
Password: teacher123

👪 Parents

Linked automatically to students
Password for all: parent123

📚 Courses

Introduction to Software (ITS101)

Frontend Web Development (FWD201)

🔑 Accessing the Dashboard
✅ Option 1: Use Test Accounts

Go to: http://localhost:3000/login
Use any test email/password.

✅ Option 2: Create Admin
npm run create-admin


Creates:
Email: admin@edubridge.africa

Password: bruno123

✅ Option 3: Register New User

Visit: http://localhost:3000/register

👥 User Roles
Role	Capabilities
Student	View grades, assignments, attendance
Parent	Monitor student performance + alerts
Teacher	Manage courses, assignments, grades, attendance
Admin	Full system control
🔌 API Overview (Short Version)
Auth

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

Courses

GET /api/courses

POST /api/courses (Teacher/Admin)

Assignments

GET /api/assignments

POST /api/assignments (Teacher/Admin)

Grades

GET /api/grades/student/:id

POST /api/grades

Attendance

GET /api/attendance/student/:id

POST /api/attendance

Messaging

POST /api/messages

📡 Parent Alerts

Emails are automatically sent when:

Grade < 60%

Student is absent or late

Ensure SMTP settings in .env are correct.

🧱 Tech Stack
Backend

Node.js

Express.js

SQLite

JWT Authentication

Nodemailer

Frontend

React

Vite

Axios

Tailwind CSS

📦 Useful Scripts
Backend

npm run dev — Dev server

npm start — Production

npm run create-admin

npm run add-test-data

npm run add-parents

Frontend

npm run dev

npm run build

npm run preview

🚀 Deployment Checklist
✔ Backend

Install deps

Set environment variables

Ensure SQLite file persists

Start with: npm start

✔ Frontend

Run npm run build

Deploy dist/ to hosting provider

✔ Verify

Admin login works

Email alerts work

Dashboard loads from deployed API
