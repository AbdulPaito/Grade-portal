/**
 * ==========================================
 * STUDENT GRADE PORTAL - BACKEND SERVER
 * ==========================================
 * 
 * 🚀 HOW TO RUN (for beginners):
 * 
 * 1. Make sure you have a .env file in this folder (backend/)
 *    - Copy .env.example and rename to .env
 *    - Or create new file named .env and paste your variables
 * 
 * 2. Open terminal in this backend folder
 *    - Type: npm run dev
 *    - Wait for "MongoDB Connected" message
 *    - Server runs on http://localhost:5000
 * 
 * 3. Test if it's working:
 *    - Open browser to: http://localhost:5000/api/health
 *    - Should see: {"status":"OK","message":"Server is running"}
 * 
 * 📝 WHAT THIS FILE DOES:
 * - Connects to MongoDB Atlas database
 * - Sets up Express server with API routes
 * - Handles authentication (students & admins)
 * - Runs scheduled jobs (auto-fail overdue INCs daily)
 * 
 * 🔗 API ENDPOINTS:
 * - POST /api/auth/student-login (Student login with ID only)
 * - POST /api/auth/admin-login  (Admin login with ID + password)
 * - All other routes are protected and need JWT token
 */

// ==========================================
// IMPORT REQUIRED PACKAGES
// ==========================================
const express = require('express');      // Web framework
const mongoose = require('mongoose');    // MongoDB connector
const cors = require('cors');            // Allow frontend to connect
const dotenv = require('dotenv');        // Read .env file
const cron = require('node-cron');       // Scheduled tasks

// Load environment variables from .env file
dotenv.config();

// ==========================================
// IMPORT ROUTES (API endpoints)
// ==========================================
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const gradeRoutes = require('./routes/grades');
const incRoutes = require('./routes/inc');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');

// Import auto-fail service for overdue INCs
const { processOverdueINC } = require('./utils/autoFailService');

// ==========================================
// CREATE EXPRESS APP
// ==========================================
const app = express();

// Allow frontend to make requests (CORS)
app.use(cors());

// Parse JSON data from requests (max 10MB for file uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// CONNECT TO MONGODB ATLAS
// ==========================================
const connectDB = async () => {
  try {
    // Use MONGODB_URI from .env file
    // Falls back to local MongoDB if env variable not set
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-grade-portal');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log('   Database is ready to use!');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log('   Make sure your MONGODB_URI in .env is correct');
    process.exit(1);  // Stop server if DB connection fails
  }
};

// Connect to database
connectDB();

// ==========================================
// SETUP API ROUTES
// ==========================================
// All routes start with /api/
app.use('/api/auth', authRoutes);        // Login, register, me
app.use('/api/students', studentRoutes); // Student CRUD
app.use('/api/grades', gradeRoutes);     // Grades management
app.use('/api/inc', incRoutes);          // INC tracking
app.use('/api/admin', adminRoutes);      // Admin functions (upload)
app.use('/api/reports', reportRoutes);   // Reports & statistics

// Health check endpoint - test if server is running
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ==========================================
// SCHEDULED TASKS
// ==========================================
// Run daily at midnight: auto-fail overdue INCs
cron.schedule('0 0 * * *', async () => {
  console.log('🕐 Running daily auto-fail check...');
  try {
    const count = await processOverdueINC();
    console.log(`✅ Auto-fail check completed. ${count} records processed`);
  } catch (error) {
    console.error('❌ Error in auto-fail job:', error);
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================
// Handle server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 - route not found
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n==========================================');
  console.log('🎓 Student Grade Portal Backend');
  console.log('==========================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
  console.log('==========================================\n');
});

module.exports = app;
