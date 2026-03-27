const mongoose = require('mongoose');

const incSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: [true, 'Student ID is required'],
    index: true
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required']
  },
  subject_code: {
    type: String,
    required: [true, 'Subject code is required'],
    trim: true,
    uppercase: true
  },
  subject_name: {
    type: String,
    required: [true, 'Subject name is required']
  },
  year_level: {
    type: Number,
    required: [true, 'Year level is required'],
    min: 1,
    max: 4
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['1st', '2nd', 'summer']
  },
  inc_date: {
    type: Date,
    required: [true, 'INC date is required'],
    default: Date.now
  },
  due_date: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completed: {
    type: Boolean,
    default: false,
    index: true
  },
  completed_grade: {
    type: Number,
    min: 1.0,
    max: 5.0,
    default: null
  },
  completed_date: {
    type: Date,
    default: null
  },
  auto_failed: {
    type: Boolean,
    default: false,
    index: true
  },
  section: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

incSchema.index({ student_id: 1, completed: 1 });
incSchema.index({ completed: 1, auto_failed: 1 });
incSchema.index({ due_date: 1, completed: 1 });

incSchema.virtual('days_remaining').get(function() {
  if (this.completed || this.auto_failed) return null;
  const diffTime = this.due_date - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

incSchema.virtual('is_overdue').get(function() {
  if (this.completed) return false;
  return new Date() > this.due_date;
});

module.exports = mongoose.model('INC', incSchema);
