# 🎓 Student Grade Portal - Beginner Setup Guide

This guide will help you set up and run the Student Grade Portal with **MongoDB Atlas** database.

---

## 📁 Project Structure

```
STUDENT PORTAL/
├── backend/           # Node.js + Express API
│   ├── .env         # Environment variables (you create this)
│   ├── .env.example # Template with your MongoDB credentials
│   └── server.js    # Main server file
└── frontend/        # React + Vite app
    ├── .env         # Frontend config (you create this)
    └── src/
```

---

## 🚀 Step 1: Backend Setup

### 1.1 Navigate to backend folder
```bash
cd backend
```

### 1.2 Install dependencies (already done if you ran npm install)
```bash
npm install
```

### 1.3 Create the .env file

**Option A: Copy the example file**
1. Find `backend/.env.example`
2. Copy it
3. Rename the copy to `.env` (with a dot at the start)

**Option B: Create new file manually**
1. In the `backend` folder, right-click → New → Text Document
2. Name it: `.env` (make sure it has a dot at the beginning)
3. Paste this content (already filled with your MongoDB Atlas):

```env
# ==========================================
# DATABASE CONNECTION (MongoDB Atlas)
# ==========================================
MONGODB_URI=mongodb+srv://student_admin:StudentGradePortal@studentgradeportal.gnceg62.mongodb.net/?appName=StudentGradePortal

# ==========================================
# SECURITY SETTINGS
# ==========================================
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# ==========================================
# SERVER SETTINGS
# ==========================================
PORT=5000
NODE_ENV=development
```

### 1.4 Start the backend server
```bash
npm run dev
```

**You should see:**
```
==========================================
🎓 Student Grade Portal Backend
==========================================
✅ Server running on http://localhost:5000
📊 API Health Check: http://localhost:5000/api/health
==========================================
✅ MongoDB Connected: studentgradeportal.gnceg62.mongodb.net
   Database is ready to use!
```

### 1.5 Test the backend
Open browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "connected"
}
```

**Keep this terminal running!** Don't close it.

---

## 🎨 Step 2: Frontend Setup

### 2.1 Open a NEW terminal (keep backend running)

### 2.2 Navigate to frontend folder
```bash
cd frontend
```

### 2.3 Install dependencies (already done if you ran npm install)
```bash
npm install
```

### 2.4 Create the .env file

**Create new file:**
1. In the `frontend` folder, right-click → New → Text Document
2. Name it: `.env` (with a dot at the beginning)
3. Paste this content:

```env
# ==========================================
# API CONFIGURATION
# ==========================================
VITE_API_URL=http://localhost:5000/api
```

### 2.5 Start the frontend
```bash
npm run dev
```

**You should see:**
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Your browser should automatically open to `http://localhost:3000`

---

## 🧪 Step 3: Testing Login

### Test Student Login (ID Only - No Password!)

1. Go to `http://localhost:3000` in your browser
2. Click the **"Student"** tab
3. Enter a Student ID:
   - Format 1: `2022007807` (no dash)
   - Format 2: `2022-007807` (with dash)
4. Click **"Sign In"**

**Expected:**
- If student exists → Goes to Student Dashboard
- If student doesn't exist → Shows "Invalid Student ID"

**To create a student account:**
```bash
# Use this curl command or use Postman
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "student_id": "2022007807",
    "full_name": "Juan Dela Cruz",
    "course": "BS Computer Science",
    "section": "A",
    "year_level": 2,
    "password": "temp123"
  }'
```

### Test Admin Login (ID + Password)

1. Click the **"Admin"** tab
2. Enter:
   - **Admin ID:** `admin`
   - **Password:** `admin123`
3. Click **"Sign In"**

**Expected:**
- If admin exists → Goes to Admin Dashboard
- If admin doesn't exist → Shows "Invalid credentials"

### Create First Admin Account

If no admin exists yet, run this curl command:
```bash
curl -X POST http://localhost:5000/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "admin",
    "full_name": "Administrator",
    "password": "admin123"
  }'
```

---

## 🔧 Troubleshooting

### Backend won't start
**Problem:** `Error: Cannot find module 'express'`
**Solution:** Run `npm install` in backend folder

**Problem:** `MongoDB connection error`
**Solution:** 
- Check your `.env` file exists in backend folder
- Verify MONGODB_URI is correct
- Make sure your MongoDB Atlas cluster is running (check MongoDB Atlas website)

### Frontend won't connect to backend
**Problem:** `Network Error` or `CORS error`
**Solution:**
- Make sure backend is running on port 5000
- Check `frontend/.env` has `VITE_API_URL=http://localhost:5000/api`
- Restart frontend after changing .env: press `Ctrl+C` then `npm run dev`

### Student login shows "Invalid Student ID"
**Problem:** Student account doesn't exist
**Solution:** Create student first using Admin Dashboard or API

### Port already in use
**Problem:** `Port 5000 is already in use`
**Solution:** 
- Kill other processes using port 5000, OR
- Change PORT in backend/.env to something else (e.g., 5001), OR
- Change VITE_API_URL in frontend/.env to match

---

## 📋 Quick Reference

### Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/student-login` | Student login (ID only) |
| POST | `/api/auth/admin-login` | Admin login (ID + password) |
| POST | `/api/auth/setup-admin` | Create first admin |
| GET | `/api/health` | Check server status |
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create student |
| GET | `/api/grades/:student_id` | Get student grades |
| POST | `/api/grades` | Add grade |
| GET | `/api/inc` | List INC records |
| POST | `/api/admin/upload-csv` | Upload grades CSV |

### Student ID Format
- Must start with 4 digits (year)
- Optional dash `-`
- Remaining digits
- Minimum 6 digits total

**Valid:** `2022007807`, `2022-007807`, `2021-12345`
**Invalid:** `abc123`, `2022--123`, `2022_123`, `12345` (too short)

---

## 🎯 Next Steps

1. ✅ Create admin account (if not done)
2. ✅ Login as admin
3. ✅ Create student accounts
4. ✅ Add grades via Admin Dashboard or CSV upload
5. ✅ Test student login to view grades
6. ✅ Test INC tracking (set grade to "INC")

---

## 📞 Need Help?

1. Check the comments in each file - they're beginner-friendly!
2. Look at `backend/server.js` - it has detailed explanations
3. Check `frontend/src/contexts/AuthContext.jsx` - shows how login works
4. Use browser DevTools (F12) → Network tab to see API calls

**Happy coding! 🚀**
