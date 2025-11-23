# EduBridge Africa - Student Performance Monitor

A comprehensive web application designed to improve student performance and access to quality education in Africa. This platform bridges gaps in education by providing effective systems to track progress, enhance stakeholder engagement, and deliver automatic parent alerts.

## Mission

Our mission is to improve student performance and access to quality education in Africa. We believe that education is a powerful driver of change, but many students face challenges such as:
- Limited access to resources
- Poor engagement between stakeholders
- Lack of effective systems to track progress

By using technology, we bridge these gaps and empower both students and educators to succeed.

## Features

- **Performance Tracking**: Real-time grade tracking and performance analytics
- **Parent Alerts**: Automatic email notifications for low grades and attendance issues
- **Stakeholder Engagement**: Connect students, parents, teachers, and administrators
- **Analytics & Reports**: Comprehensive reports and insights
- **Communication Hub**: Direct messaging between all stakeholders
- **Resource Access**: Educational materials and resources

## Project Structure

```
edubridge-africa/
├── backend/                    # Backend API
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Assignment.js
│   │   ├── Submission.js
│   │   ├── Grade.js
│   │   ├── Message.js
│   │   └── Attendance.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── courses.js
│   │   ├── assignments.js
│   │   ├── grades.js
│   │   ├── messages.js
│   │   ├── attendance.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   └── auth.js
│   ├── scripts/
│   │   ├── createAdmin.js
│   │   ├── updateAdminPassword.js
│   │   └── addTestData.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/                   # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Header.js
│   │   │   ├── Navigation.js
│   │   │   ├── Resources.js
│   │   │   └── Features.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── hooks/
│   │   │   └── useAPI.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── .env
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- **No database server needed!** (Uses SQLite - file-based database)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development

# Email Configuration (for parent alerts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@edubridge-africa.com
```

4. Start the backend server:
```bash
npm run dev
```

The backend API will be running on `http://localhost:5000`

5. (Optional) Create test data with sample students, courses, and a teacher:
```bash
npm run add-test-data
```

This will create:
- 3 sample students (Ishimwe Bruno, Gasasira Emmy, Uwishema Arnold)
- 1 teacher (Dr. John Teacher)
- 2 courses (Introduction to Software, Frontend Web Development)
- Enrolls all students in both courses

See the [Test Data](#test-data) section below for login credentials.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

## Test Data

For quick testing, you can populate the database with sample data:

```bash
cd backend
npm run add-test-data
```

This creates the following test accounts:

### Test Students
- **Ishimwe Bruno**
  - Email: `ishimwe.bruno@student.edubridge.africa`
  - Password: `student123`
  - Student ID: `STU001`

- **Gasasira Emmy**
  - Email: `gasasira.emmy@student.edubridge.africa`
  - Password: `student123`
  - Student ID: `STU002`

- **Uwishema Arnold**
  - Email: `uwishema.arnold@student.edubridge.africa`
  - Password: `student123`
  - Student ID: `STU003`

### Test Teacher
- **Dr. John Teacher**
  - Email: `teacher@edubridge.africa`
  - Password: `teacher123`

### Test Courses
- **Introduction to Software** (ITS101)
- **Frontend Web Development** (FWD201)

All students are automatically enrolled in both courses.

> **Note**: The script is idempotent - it's safe to run multiple times. It will skip creating users/courses that already exist.

## Accessing the Dashboard

To access the dashboard, you need to authenticate first. You have several options:

### Option 1: Use Test Data (Quick Start)

1. Run the test data script (if you haven't already):
```bash
cd backend
npm run add-test-data
```

2. Start both servers (backend and frontend)
3. Navigate to `http://localhost:3000/login`
4. Login with any of the test accounts above
5. You'll be automatically redirected to the dashboard

### Option 2: Create an Admin User (Recommended for First Time)

1. Make sure your backend `.env` file is configured
2. Run the admin creation script:
```bash
cd backend
npm run create-admin
```

This will create a default admin user with:
- **Email**: `admin@edubridge.africa`
- **Password**: `bruno123`

⚠️ **Important**: Change this password after your first login!

3. Start both servers (backend and frontend)
4. Navigate to `http://localhost:3000/login`
5. Login with the admin credentials
6. You'll be automatically redirected to the dashboard

### Option 3: Register a New User

1. Make sure both backend and frontend servers are running
2. Navigate to `http://localhost:3000/register`
3. Fill in the registration form:
   - Name
   - Email
   - Password (minimum 6 characters)
   - Role (Student, Parent, Teacher, or Admin)
   - Optional: Phone, Student ID (for students)
4. Click "Register"
5. You'll be automatically logged in and redirected to the dashboard

### Option 4: Login with Existing Account

1. Navigate to `http://localhost:3000/login`
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to the dashboard based on your role

### Dashboard Access

Once logged in, you can access:
- **Dashboard**: Overview of your data (grades, attendance, courses, etc.)
- **Courses**: View and manage courses
- **Assignments**: View and submit assignments
- **Grades**: View grades and performance
- **Attendance**: View attendance records
- **Messages**: Communicate with other users
- **Resources**: Access educational materials

The dashboard content varies based on your role (Student, Parent, Teacher, or Admin).

## User Roles

The platform supports four user roles:

1. **Student**: View courses, assignments, grades, and attendance
2. **Parent**: Monitor children's performance and receive alerts
3. **Teacher**: Manage courses, assignments, grades, and attendance
4. **Admin**: Full system access and management

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin/Teacher)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Teacher/Admin)
- `PUT /api/courses/:id` - Update course (Teacher/Admin)

### Assignments
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments` - Create assignment (Teacher/Admin)
- `POST /api/assignments/:id/submit` - Submit assignment (Student)

### Grades
- `GET /api/grades` - Get all grades
- `GET /api/grades/:id` - Get grade by ID
- `POST /api/grades` - Create grade (Teacher/Admin)
- `GET /api/grades/student/:studentId` - Get student grades

### Attendance
- `GET /api/attendance` - Get all attendance records
- `POST /api/attendance` - Create attendance record (Teacher/Admin)
- `GET /api/attendance/student/:studentId` - Get student attendance

### Messages
- `GET /api/messages` - Get all messages
- `GET /api/messages/inbox` - Get inbox messages
- `POST /api/messages` - Send message

### Dashboard
- `GET /api/dashboard` - Get dashboard data

## Parent Alerts

The system automatically sends email alerts to parents when:
- A student receives a grade below 60%
- A student is marked as absent or late

Configure email settings in the backend `.env` file to enable this feature.

## Technology Stack

### Backend
- Node.js
- Express.js
- SQLite (file-based database - no server needed!)
- JWT for authentication
- Nodemailer for email alerts

### Frontend
- React
- React Router
- Axios for API calls
- Tailwind CSS for styling
- Vite for build tooling

## Available Scripts

### Backend Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run create-admin` - Create a default admin user
- `npm run update-admin-password` - Update the admin user's password
- `npm run add-test-data` - Add sample students, courses, and teacher for testing

### Frontend Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

## Contributing

This project is designed to improve education in Africa. Contributions are welcome!

## License

ISC

## Contact

For questions or support, please contact the development team.

