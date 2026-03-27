/**
 * Create First Admin Account Script
 * 
 * 📝 HOW TO USE:
 * 1. Make sure backend server is NOT running (stop it first with Ctrl+C)
 * 2. Run this script: node createAdmin.js
 * 3. It will create admin account in your MongoDB Atlas database
 * 4. Then start server again: npm run dev
 */

const mongoose = require('mongoose');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB Atlas
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas!');

    // Define Student schema (inline para di na mag-import)
    const studentSchema = new mongoose.Schema({
      student_id: { type: String, required: true, unique: true },
      full_name: { type: String, required: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['student', 'admin'], default: 'student' },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      course: String,
      section: String,
      year_level: Number
    });

    // Hash password before saving
    studentSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      const bcrypt = require('bcryptjs');
      this.password = await bcrypt.hash(this.password, 10);
      next();
    });

    const Student = mongoose.model('Student', studentSchema);

    // Check if admin already exists
    const existingAdmin = await Student.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin already exists:', existingAdmin.student_id);
      console.log('   You can login with ID:', existingAdmin.student_id);
      process.exit(0);
    }

    // Create admin
    console.log('\n👤 Creating admin account...');
    const admin = new Student({
      student_id: 'admin',
      full_name: 'Administrator',
      password: 'admin123',
      role: 'admin',
      course: 'Administration',
      section: 'ADMIN',
      year_level: 0,
      status: 'active'
    });

    await admin.save();

    console.log('\n✅ Admin created successfully!');
    console.log('   Admin ID: admin');
    console.log('   Password: admin123');
    console.log('\n🚀 You can now login at http://localhost:3000');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
