const { Grade, INC, Student } = require('../models');

const getAllGradesReport = async (req, res) => {
  try {
    const { section, year_level, semester, page = 1, limit = 100 } = req.query;
    const query = {};
    if (section) query.section = section;
    if (year_level) query.year_level = parseInt(year_level);
    if (semester) query.semester = semester;

    const grades = await Grade.find(query).sort({ date_uploaded: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Grade.countDocuments(query);

    res.json({ success: true, data: grades, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getINCList = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const incRecords = await INC.find({ completed: false, auto_failed: false }).sort({ due_date: 1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await INC.countDocuments({ completed: false, auto_failed: false });
    res.json({ success: true, data: incRecords, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOverdueINC = async (req, res) => {
  try {
    const today = new Date();
    const overdue = await INC.find({ due_date: { $lt: today }, completed: false }).sort({ due_date: 1 });
    res.json({ success: true, data: overdue, count: overdue.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCompletedINC = async (req, res) => {
  try {
    const completed = await INC.find({ completed: true }).sort({ completed_date: -1 });
    res.json({ success: true, data: completed, count: completed.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStudentReport = async (req, res) => {
  try {
    const { student_id } = req.params;
    const student = await Student.findOne({ student_id }).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const grades = await Grade.find({ student_id }).sort({ year_level: 1, semester: 1 });
    const incRecords = await INC.find({ student_id });

    res.json({ success: true, student, grades, inc_records: incRecords });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSectionSummary = async (req, res) => {
  try {
    const { section, year_level } = req.query;
    const query = { role: 'student' };
    if (section) query.section = section;
    if (year_level) query.year_level = parseInt(year_level);

    const students = await Student.find(query).select('-password');
    const summary = [];

    for (const student of students) {
      const grades = await Grade.find({ student_id: student.student_id });
      const incCount = grades.filter(g => g.status === 'INC').length;
      const failedCount = grades.filter(g => g.status === 'Failed').length;
      const passedCount = grades.filter(g => g.status === 'Passed').length;
      const numericGrades = grades.filter(g => typeof g.grade === 'number');
      const gpa = numericGrades.length > 0 ? (numericGrades.reduce((s, g) => s + g.grade, 0) / numericGrades.length).toFixed(2) : '0.00';

      summary.push({
        student_id: student.student_id,
        full_name: student.full_name,
        course: student.course,
        section: student.section,
        year_level: student.year_level,
        total_subjects: grades.length,
        passed: passedCount,
        failed: failedCount,
        inc: incCount,
        gpa
      });
    }

    res.json({ success: true, data: summary, count: summary.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAllGradesReport, getINCList, getOverdueINC, getCompletedINC, getStudentReport, getSectionSummary };
