const { body } = require('express-validator');

// Student ID validation: 4 digits + optional dash + digits, minimum 6 total
const studentIdValidation = body('student_id')
  .notEmpty().withMessage('Student ID is required')
  .trim()
  .matches(/^\d{4}-?\d+$/).withMessage('Student ID must be 4 digits, optional dash, followed by digits')
  .custom((value) => {
    const digitsOnly = value.replace('-', '');
    if (digitsOnly.length < 6) {
      throw new Error('Student ID must have at least 6 digits total');
    }
    return true;
  });

const loginValidation = [
  studentIdValidation,
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const studentValidation = [
  studentIdValidation,
  body('full_name').notEmpty().withMessage('Full name is required').trim(),
  body('course').notEmpty().withMessage('Course is required').trim(),
  body('section').notEmpty().withMessage('Section is required').trim(),
  body('year_level').notEmpty().withMessage('Year level is required').isInt({ min: 1, max: 4 }).withMessage('Year level must be between 1 and 4')
  // Note: No password validation - students login with ID only
];

const gradeValidation = [
  body('student_id')
    .notEmpty().withMessage('Student ID is required')
    .trim()
    .matches(/^\d{4}-?\d+$/).withMessage('Student ID must be 4 digits, optional dash, followed by digits')
    .custom((value) => {
      const digitsOnly = value.replace('-', '');
      if (digitsOnly.length < 6) {
        throw new Error('Student ID must have at least 6 digits total');
      }
      return true;
    }),
  body('subject_code').notEmpty().withMessage('Subject code is required').trim().toUpperCase(),
  body('subject_name').notEmpty().withMessage('Subject name is required').trim(),
  body('year_level').notEmpty().withMessage('Year level is required').isInt({ min: 1, max: 4 }),
  body('semester').notEmpty().withMessage('Semester is required').isIn(['1st', '2nd', 'summer']).withMessage('Semester must be 1st, 2nd, or summer'),
  body('grade').notEmpty().withMessage('Grade is required').custom((value) => {
    if (typeof value === 'string' && value.toUpperCase() === 'INC') return true;
    const num = parseFloat(value);
    if (isNaN(num) || num < 1.0 || num > 5.0) {
      throw new Error('Grade must be a number between 1.0 and 5.0, or INC');
    }
    return true;
  })
];

module.exports = { loginValidation, studentValidation, gradeValidation };
