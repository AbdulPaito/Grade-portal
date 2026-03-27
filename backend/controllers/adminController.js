const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const { Student, Grade, INC } = require('../models');

// Parse and validate student ID format (4 digits + optional dash + digits, min 6 total)
const isValidStudentId = (student_id) => {
  if (!student_id) return false;
  const trimmed = student_id.toString().trim();
  if (!/^\d{4}-?\d+$/.test(trimmed)) return false;
  const digitsOnly = trimmed.replace('-', '');
  if (digitsOnly.length < 6) return false;
  return true;
};

const parseGrade = (value) => {
  if (!value) return null;
  const str = value.toString().trim().toUpperCase();
  if (str === 'INC') return 'INC';
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

const getStatus = (grade) => {
  if (grade === 'INC') return 'INC';
  return grade <= 3.0 ? 'Passed' : 'Failed';
};

const processGradeRow = async (row, uploadedBy) => {
  const errors = [];
  
  if (!row.student_id) errors.push('Missing student_id');
  if (!row.subject_code) errors.push('Missing subject_code');
  if (!row.subject_name) errors.push('Missing subject_name');
  if (!row.grade) errors.push('Missing grade');
  if (!row.year) errors.push('Missing year');
  if (!row.semester) errors.push('Missing semester');
  
  if (errors.length > 0) return { success: false, errors, row };

  const student = await Student.findOne({ student_id: row.student_id.toString().trim() });
  if (!student) return { success: false, errors: ['Student not found'], row };

  const gradeValue = parseGrade(row.grade);
  if (gradeValue === null) return { success: false, errors: ['Invalid grade value'], row };

  const year = parseInt(row.year);
  const semester = row.semester.trim().toLowerCase();
  if (![1, 2, 3, 4].includes(year)) return { success: false, errors: ['Invalid year level'], row };
  if (!['1st', '2nd', 'summer'].includes(semester)) return { success: false, errors: ['Invalid semester'], row };

  const existingGrade = await Grade.findOne({
    student_id: row.student_id,
    subject_code: row.subject_code.toUpperCase(),
    year_level: year,
    semester
  });

  if (existingGrade) {
    existingGrade.grade = gradeValue;
    existingGrade.status = getStatus(gradeValue);
    existingGrade.full_name = student.full_name;
    await existingGrade.save();
  } else {
    const newGrade = new Grade({
      student_id: row.student_id,
      full_name: student.full_name,
      subject_code: row.subject_code.toUpperCase(),
      subject_name: row.subject_name,
      grade: gradeValue,
      year_level: year,
      semester,
      status: getStatus(gradeValue),
      section: row.section || student.section,
      uploaded_by: uploadedBy
    });
    await newGrade.save();
  }

  if (gradeValue === 'INC') {
    const existingINC = await INC.findOne({
      student_id: row.student_id,
      subject_code: row.subject_code.toUpperCase(),
      year_level: year,
      semester
    });

    if (!existingINC) {
      const incRecord = new INC({
        student_id: row.student_id,
        full_name: student.full_name,
        course: student.course,
        section: row.section || student.section,
        year_level: year,
        semester,
        subject_code: row.subject_code.toUpperCase(),
        subject_name: row.subject_name,
        inc_date: new Date(),
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        completed: false
      });
      await incRecord.save();
    }
  }

  return { success: true, row };
};

const uploadCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const results = [];
    const errors = [];
    let processed = 0;

    const stream = fs.createReadStream(req.file.path).pipe(csv());

    for await (const row of stream) {
      const result = await processGradeRow(row, req.user.student_id);
      if (result.success) {
        results.push(result.row);
      } else {
        errors.push({ row: result.row, errors: result.errors });
      }
      processed++;
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Processed ${processed} records`,
      summary: { successful: results.length, failed: errors.length, total: processed },
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

const uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = [];
    const errors = [];

    for (const row of data) {
      const result = await processGradeRow({
        student_id: row.student_id || row.Student_ID || row['Student ID'],
        full_name: row.full_name || row.Full_Name || row['Full Name'],
        subject_code: row.subject_code || row.Subject_Code || row['Subject Code'],
        subject_name: row.subject_name || row.Subject_Name || row['Subject Name'],
        grade: row.grade || row.Grade,
        year: row.year || row.Year || row.year_level,
        semester: row.semester || row.Semester,
        section: row.section || row.Section
      }, req.user.student_id);

      if (result.success) {
        results.push(row);
      } else {
        errors.push({ row, errors: result.errors });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Processed ${data.length} records`,
      summary: { successful: results.length, failed: errors.length, total: data.length },
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// Upload students from CSV/Excel
const uploadStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const results = [];
    const errors = [];
    let processed = 0;

    // Determine file type and parse
    const isExcel = req.file.originalname.match(/\.(xlsx|xls)$/i);
    let data = [];

    if (isExcel) {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(worksheet);
    } else {
      // CSV parsing
      const stream = fs.createReadStream(req.file.path).pipe(csv());
      for await (const row of stream) {
        data.push(row);
      }
    }

    for (const row of data) {
      const studentId = (row.student_id || row.Student_ID || row['Student ID'] || '').toString().trim();
      const fullName = row.full_name || row.Full_Name || row['Full Name'] || '';
      const course = row.course || row.Course || '';
      const section = row.section || row.Section || '';
      const yearLevel = parseInt(row.year_level || row.Year_Level || row['Year Level'] || row.year || 1);

      // Validate student ID format
      if (!isValidStudentId(studentId)) {
        errors.push({ row, errors: [`Invalid student ID format: ${studentId}`] });
        processed++;
        continue;
      }

      // Check required fields
      if (!fullName || !course || !section) {
        errors.push({ row, errors: ['Missing required fields (full_name, course, section)'] });
        processed++;
        continue;
      }

      // Check if student already exists
      const existingStudent = await Student.findOne({ student_id: studentId });
      if (existingStudent) {
        errors.push({ row, errors: [`Student ${studentId} already exists`] });
        processed++;
        continue;
      }

      // Create new student (no password required - login with ID only)
      const newStudent = new Student({
        student_id: studentId,
        full_name: fullName,
        course: course,
        section: section,
        year_level: yearLevel,
        role: 'student',
        status: 'active'
      });

      await newStudent.save();
      results.push({ student_id: studentId, full_name: fullName });
      processed++;
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Processed ${processed} students`,
      summary: { successful: results.length, failed: errors.length, total: processed },
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

module.exports = { uploadCSV, uploadExcel, uploadStudents };
