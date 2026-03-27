const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    index: true
  },
  year_level: {
    type: Number,
    required: [true, 'Year level is required'],
    min: 1,
    max: 4,
    index: true
  },
  password: {
    type: String,
    required: function() { return this.role === 'admin'; }, // Only required for admins
    minlength: [6, 'Password must be at least 6 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  }
}, { timestamps: true });

studentSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

studentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

studentSchema.index({ section: 1, year_level: 1 });
studentSchema.index({ status: 1 });

module.exports = mongoose.model('Student', studentSchema);
