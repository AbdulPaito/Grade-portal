const { Student, Grade, INC } = require('../models');
const { logGradeCreate, logGradeUpdate } = require('../utils/auditLogger');

const getStudentGrades = async (req, res) => {
  try {
    const { student_id } = req.params;
    if (req.user.role === 'student' && req.user.student_id !== student_id) return res.status(403).json({ message: 'Access denied' });

    const { year_level, semester } = req.query;
    const query = { student_id };
    if (year_level) query.year_level = parseInt(year_level);
    if (semester) query.semester = semester;

    const grades = await Grade.find(query).sort({ year_level: 1, semester: 1, subject_code: 1 });
    res.json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addGrade = async (req, res) => {
  try {
    const { student_id, subject_code, subject_name, grade, year_level, semester, section } = req.body;

    const student = await Student.findOne({ student_id, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existingGrade = await Grade.findOne({ student_id, subject_code, year_level: parseInt(year_level), semester });
    if (existingGrade) return res.status(400).json({ message: 'Grade already exists for this subject' });

    let status = 'Passed';
    let gradeValue = grade;

    if (typeof grade === 'string' && grade.toUpperCase() === 'INC') {
      status = 'INC';
      gradeValue = 'INC';
    } else {
      const numericGrade = parseFloat(grade);
      status = numericGrade <= 3.0 ? 'Passed' : 'Failed';
      gradeValue = numericGrade;
    }

    const newGrade = new Grade({
      student_id,
      full_name: student.full_name,
      subject_code: subject_code.toUpperCase(),
      subject_name,
      grade: gradeValue,
      year_level: parseInt(year_level),
      semester,
      status,
      section: section || student.section,
      uploaded_by: req.user.student_id
    });

    await newGrade.save();

    // Log grade creation
    await logGradeCreate(newGrade, req.user);

    if (status === 'INC') {
      const incRecord = new INC({
        student_id,
        full_name: student.full_name,
        subject_code: subject_code.toUpperCase(),
        subject_name,
        year_level: parseInt(year_level),
        semester,
        inc_date: new Date(),
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        completed: false,
        section: section || student.section,
        course: student.course
      });
      await incRecord.save();
    }

    res.status(201).json({ success: true, message: 'Grade added successfully', data: newGrade });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, status } = req.body;

    const gradeDoc = await Grade.findById(id);
    if (!gradeDoc) return res.status(404).json({ message: 'Grade not found' });

    let wasINC = gradeDoc.status === 'INC';
    let nowINC = false;

    if (grade !== undefined) {
      if (typeof grade === 'string' && grade.toUpperCase() === 'INC') {
        gradeDoc.grade = 'INC';
        gradeDoc.status = 'INC';
        nowINC = true;
      } else {
        const numericGrade = parseFloat(grade);
        gradeDoc.grade = numericGrade;
        gradeDoc.status = numericGrade <= 3.0 ? 'Passed' : 'Failed';
      }
    }

    if (status) {
      gradeDoc.status = status;
      if (status === 'INC') nowINC = true;
    }

    await gradeDoc.save();

    // If grade became INC, create INC record if doesn't exist
    if (nowINC && !wasINC) {
      const existingINC = await INC.findOne({
        student_id: gradeDoc.student_id,
        subject_code: gradeDoc.subject_code,
        year_level: gradeDoc.year_level,
        semester: gradeDoc.semester
      });

      if (!existingINC) {
        const student = await Student.findOne({ student_id: gradeDoc.student_id });
        const incRecord = new INC({
          student_id: gradeDoc.student_id,
          full_name: gradeDoc.full_name,
          subject_code: gradeDoc.subject_code,
          subject_name: gradeDoc.subject_name,
          year_level: gradeDoc.year_level,
          semester: gradeDoc.semester,
          inc_date: new Date(),
          due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
          completed: false,
          section: gradeDoc.section,
          course: student ? student.course : null
        });
        await incRecord.save();
      }
    }

    // Log grade update
    await logGradeUpdate(id, { grade: gradeDoc.grade, status: gradeDoc.status }, req.user);

    res.json({ success: true, message: 'Grade updated successfully', data: gradeDoc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const grade = await Grade.findByIdAndDelete(id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });

    await INC.deleteOne({ student_id: grade.student_id, subject_code: grade.subject_code, year_level: grade.year_level, semester: grade.semester });

    res.json({ success: true, message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllGrades = async (req, res) => {
  try {
    const { page = 1, limit = 50, section, year_level, semester, status } = req.query;
    const query = {};
    if (section) query.section = section;
    if (year_level) query.year_level = parseInt(year_level);
    if (semester) query.semester = semester;
    if (status) query.status = status;

    const grades = await Grade.find(query).sort({ date_uploaded: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Grade.countDocuments(query);

    // For failed grades, find associated INC records
    let gradesWithIncId = grades;
    if (status === 'Failed') {
      const INC = require('../models/INC');
      gradesWithIncId = await Promise.all(
        grades.map(async (grade) => {
          const incRecord = await INC.findOne({
            student_id: grade.student_id,
            subject_code: grade.subject_code,
            year_level: grade.year_level,
            semester: grade.semester
          });
          return {
            ...grade.toObject(),
            inc_id: incRecord ? incRecord._id : null
          };
        })
      );
    }

    res.json({ success: true, data: gradesWithIncId, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getGradeStats = async (req, res) => {
  try {
    const { student_id } = req.params;
    if (req.user.role === 'student' && req.user.student_id !== student_id) return res.status(403).json({ message: 'Access denied' });

    const grades = await Grade.find({ student_id });

    const byYearSemester = {};
    for (let year = 1; year <= 4; year++) {
      byYearSemester[year] = {};
      ['1st', '2nd', 'summer'].forEach(sem => {
        const semGrades = grades.filter(g => g.year_level === year && g.semester === sem);
        const numeric = semGrades.filter(g => typeof g.grade === 'number');
        byYearSemester[year][sem] = {
          subjects: semGrades.length,
          gpa: numeric.length > 0 ? parseFloat((numeric.reduce((s, g) => s + g.grade, 0) / numeric.length).toFixed(2)) : 0,
          passed: semGrades.filter(g => g.status === 'Passed').length,
          failed: semGrades.filter(g => g.status === 'Failed').length,
          inc: semGrades.filter(g => g.status === 'INC').length
        };
      });
    }

    res.json({ success: true, data: byYearSemester });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getStudentGrades, addGrade, updateGrade, deleteGrade, getAllGrades, getGradeStats };
