const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
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
    required: [true, 'Subject name is required'],
    trim: true
  },
  year_level: {
    type: Number,
    required: [true, 'Year level is required'],
    min: 1,
    max: 4,
    index: true
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['1st', '2nd', 'summer'],
    index: true
  },
  grade: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Grade is required'],
    validate: {
      validator: function(value) {
        if (typeof value === 'string') return value.toUpperCase() === 'INC';
        return typeof value === 'number' && value >= 1.0 && value <= 5.0;
      },
      message: 'Grade must be a number between 1.0 and 5.0, or "INC"'
    }
  },
  status: {
    type: String,
    enum: ['Passed', 'Failed', 'INC', 'Completed'],
    default: 'Passed',
    index: true
  },
  date_uploaded: {
    type: Date,
    default: Date.now
  },
  uploaded_by: {
    type: String,
    default: 'admin'
  },
  section: {
    type: String,
    trim: true,
    index: true
  }
}, { timestamps: true });

gradeSchema.index({ student_id: 1, year_level: 1, semester: 1 });
gradeSchema.index({ student_id: 1, status: 1 });
gradeSchema.index({ section: 1, year_level: 1, semester: 1 });

module.exports = mongoose.model('Grade', gradeSchema);
