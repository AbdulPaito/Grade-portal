# Student Grade Portal with INC Monitoring System

A modern, production-ready web application for managing student grades with INC (Incomplete) tracking and deadline monitoring.

## 🎯 Features

### Student Portal
- View all grades (1st–4th year, all semesters)
- Organized by Year → Semester → Subjects (Accordion layout)
- INC tracking with countdown timers
- GPA calculation (per semester and overall)
- Dashboard summary with statistics
- Filter by year, semester, search subjects

### Admin Dashboard
- Student management (CRUD operations)
- Batch grade upload (CSV/Excel)
- Manual grade entry
- INC management with due dates
- Auto-fail system for overdue INC
- Reports and analytics

## 🧱 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Multer (file uploads)
- CSV/XLSX parsing

### Frontend
- React (Vite)
- Tailwind CSS
- React Router DOM
- Axios
- Lucide React Icons
- date-fns

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account or local MongoDB
- Git

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

4. Start the server:
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

### Frontend Setup

1. Navigate to the frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

## 📋 First Time Setup

### Create Admin Account

Make a POST request to create the first admin:

```bash
curl -X POST http://localhost:5000/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "admin",
    "full_name": "System Administrator",
    "password": "admin123"
  }'
```

⚠️ **Note:** This endpoint only works once when no admin exists.

### CSV Upload Format

For batch uploading grades, use this CSV format:
```csv
student_id,subject_code,subject_name,grade,year,semester,section
2021001,MATH101,Mathematics 1,1.75,1,1st,Section A
2021002,ENG101,English 1,INC,1,1st,Section A
```

- Use "INC" as grade value for incomplete grades
- The system will automatically create INC records
- Sections are optional and will use student's default if not provided

## 🏗️ Project Structure

```
student-grade-portal/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── gradeController.js
│   │   ├── incController.js
│   │   ├── adminController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validate.js
│   │   └── validators.js
│   ├── models/
│   │   ├── Student.js
│   │   ├── Grade.js
│   │   ├── INC.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── students.js
│   │   ├── grades.js
│   │   ├── inc.js
│   │   ├── admin.js
│   │   └── reports.js
│   ├── utils/
│   │   └── autoFailService.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useApi.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminOverview.jsx
│   │   │   ├── StudentManagement.jsx
│   │   │   ├── GradeManagement.jsx
│   │   │   └── INCManagement.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## 🔐 Authentication

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (student/admin)
- Protected routes

## 🗄️ Database Schema

### Students Collection
- student_id (unique)
- full_name
- course
- section
- year_level (1-4)
- password (hashed)
- status (active/inactive)
- role (student/admin)

### Grades Collection
- student_id
- full_name
- subject_code
- subject_name
- year_level
- semester (1st/2nd/summer)
- grade (number or "INC")
- status (Passed/Failed/INC/Completed)
- date_uploaded

### INC Collection
- student_id
- subject_code
- year_level
- semester
- inc_date
- due_date
- completed (boolean)
- completed_grade
- auto_failed (boolean)

## 🌐 Deployment

### Backend (Render/Railway)

1. Set environment variables:
   - MONGODB_URI
   - JWT_SECRET
   - NODE_ENV=production

2. Deploy with:
```bash
git push render/main
```

### Frontend (Vercel)

1. Set environment variable:
   - VITE_API_URL=your_backend_url/api

2. Deploy with:
```bash
vercel
```

## ⚙️ Auto-Fail System

The system automatically checks for overdue INC records daily at midnight.

To manually trigger:
- Admin Dashboard → Run Auto-Fail button
- Or POST to `/api/admin/process-overdue`

## 🎨 Color System

- 🟢 Green: Passed grades
- 🔴 Red: Failed grades  
- 🟠 Orange: INC (Incomplete)
- 🔵 Blue: Completed

## 📱 Responsive Design

- Mobile-first approach
- Card layouts for mobile
- Tables for desktop
- Collapsible navigation

## 🧪 Testing Accounts

After setup, use these credentials:
- **Admin:** admin / admin123
- **Student:** Create through admin panel

## 📝 API Documentation

### Authentication
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/change-password` - Change password

### Students
- GET `/api/students` - List all students
- POST `/api/students` - Create student
- GET `/api/students/:id` - Get student
- PUT `/api/students/:id` - Update student
- DELETE `/api/students/:id` - Delete student

### Grades
- GET `/api/grades/:student_id` - Get student grades
- POST `/api/grades` - Add grade
- PUT `/api/grades/:id` - Update grade
- DELETE `/api/grades/:id` - Delete grade

### INC Management
- GET `/api/inc` - List all INC records
- PUT `/api/inc/:id` - Update INC
- PUT `/api/inc/:id/due-date` - Set due date
- PUT `/api/inc/:id/override` - Override failed INC

### Admin
- POST `/api/admin/upload-csv` - Upload CSV grades
- POST `/api/admin/upload-excel` - Upload Excel grades
- POST `/api/admin/process-overdue` - Process overdue INC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use for educational purposes.

## 🆘 Support

For issues or questions, please check the project documentation or contact the development team.
