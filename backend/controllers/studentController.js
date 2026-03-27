const { Student, Grade, INC } = require('../models');
const { logStudentCreate, logStudentUpdate, logStudentDelete } = require('../utils/auditLogger');

const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, course, section, year_level, status, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = { role: 'student' };
    if (search) {
      query.$or = [
        { student_id: { $regex: search, $options: 'i' } },
        { full_name: { $regex: search, $options: 'i' } }
      ];
    }
    if (course) query.course = { $regex: course, $options: 'i' };
    if (section) query.section = { $regex: section, $options: 'i' };
    if (year_level) query.year_level = parseInt(year_level);
    if (status) query.status = status;

    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    const students = await Student.find(query).select('-password').sort(sort).limit(limit * 1).skip((page - 1) * limit);
    const count = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { student_id } = req.params;
    if (req.user.role === 'student' && req.user.student_id !== student_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findOne({ student_id, role: 'student' }).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { student_id, full_name, course, section, year_level, password, status } = req.body;

    const existingStudent = await Student.findOne({ student_id });
    if (existingStudent) return res.status(400).json({ message: 'Student ID already exists' });

    const student = new Student({ student_id, full_name, course, section, year_level: parseInt(year_level), password, status: status || 'active' });
    await student.save();

    // Log student creation
    await logStudentCreate(student, req.user);

    res.status(201).json({ success: true, message: 'Student created successfully', data: { student_id: student.student_id, full_name: student.full_name, course: student.course, section: student.section, year_level: student.year_level } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const updates = req.body;
    delete updates.password;
    delete updates.role;
    delete updates.student_id;

    const student = await Student.findOneAndUpdate({ student_id, role: 'student' }, updates, { new: true, runValidators: true }).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Log student update
    await logStudentUpdate(student_id, updates, req.user);

    res.json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const student = await Student.findOneAndDelete({ student_id, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Log student deletion
    await logStudentDelete(student_id, { full_name: student.full_name, course: student.course }, req.user);

    // Delete associated grades and INC records
    await Grade.deleteMany({ student_id });
    await INC.deleteMany({ student_id });

    res.json({ success: true, message: 'Student and associated records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStudentSummary = async (req, res) => {
  try {
    const { student_id } = req.params;
    if (req.user.role === 'student' && req.user.student_id !== student_id) return res.status(403).json({ message: 'Access denied' });

    const grades = await Grade.find({ student_id });
    const incRecords = await INC.find({ student_id });

    const totalSubjects = grades.length;
    const incCount = grades.filter(g => g.status === 'INC').length;
    const failedCount = grades.filter(g => g.status === 'Failed').length;
    const passedCount = grades.filter(g => g.status === 'Passed').length;
    const completedCount = grades.filter(g => g.status === 'Completed').length;

    const numericGrades = grades.filter(g => typeof g.grade === 'number');
    const gpa = numericGrades.length > 0 ? numericGrades.reduce((sum, g) => sum + g.grade, 0) / numericGrades.length : 0;

    const activeINC = incRecords.filter(inc => !inc.completed && !inc.auto_failed).length;
    const overdueINC = incRecords.filter(inc => !inc.completed && new Date() > inc.due_date).length;

    res.json({
      success: true,
      data: {
        total_subjects: totalSubjects,
        passed_count: passedCount,
        failed_count: failedCount,
        inc_count: incCount,
        completed_count: completedCount,
        gpa: parseFloat(gpa.toFixed(2)),
        active_inc: activeINC,
        overdue_inc: overdueINC
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getFilterMetadata = async (req, res) => {
  try {
    const courses = await Student.distinct('course', { role: 'student' });
    const sections = await Student.distinct('section', { role: 'student' });
    res.json({ success: true, data: { courses, sections, year_levels: [1, 2, 3, 4] } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, getStudentSummary, getFilterMetadata };
