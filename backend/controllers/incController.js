const { INC, Grade } = require('../models');
const { logINCUpdate, logINCAutoFail } = require('../utils/auditLogger');

const getAllINC = async (req, res) => {
  try {
    const { page = 1, limit = 50, student_id, completed, auto_failed, overdue } = req.query;
    const query = {};
    if (student_id) query.student_id = student_id;
    if (completed !== undefined) query.completed = completed === 'true';
    if (auto_failed !== undefined) query.auto_failed = auto_failed === 'true';
    if (overdue === 'true') query.due_date = { $lt: new Date() }, query.completed = false;

    const incRecords = await INC.find(query).sort({ due_date: 1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await INC.countDocuments(query);

    res.json({ success: true, data: incRecords, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStudentINC = async (req, res) => {
  try {
    const { student_id } = req.params;
    if (req.user.role === 'student' && req.user.student_id !== student_id) return res.status(403).json({ message: 'Access denied' });

    const incRecords = await INC.find({ student_id }).sort({ due_date: 1 });
    res.json({ success: true, data: incRecords });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateINC = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, completed_grade, due_date, notes } = req.body;

    const inc = await INC.findById(id);
    if (!inc) return res.status(404).json({ message: 'INC record not found' });

    if (completed !== undefined) inc.completed = completed;
    if (completed_grade !== undefined) {
      inc.completed_grade = parseFloat(completed_grade);
      inc.completed_date = new Date();
    }
    if (due_date) inc.due_date = new Date(due_date);
    if (notes) inc.notes = notes;

    await inc.save();

    // Log INC update
    await logINCUpdate(id, { completed, completed_grade, due_date, notes }, req.user);

    if (inc.completed && inc.completed_grade) {
      const status = inc.completed_grade <= 3.0 ? 'Completed' : 'Failed';
      await Grade.findOneAndUpdate(
        { student_id: inc.student_id, subject_code: inc.subject_code, year_level: inc.year_level, semester: inc.semester },
        { grade: inc.completed_grade, status }
      );
    }

    res.json({ success: true, message: 'INC record updated', data: inc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const setDueDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { due_date } = req.body;

    if (!due_date) return res.status(400).json({ message: 'Due date is required' });

    const inc = await INC.findByIdAndUpdate(id, { due_date: new Date(due_date) }, { new: true });
    if (!inc) return res.status(404).json({ message: 'INC record not found' });

    res.json({ success: true, message: 'Due date updated', data: inc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const overrideFailedINC = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed_grade } = req.body;

    if (!completed_grade || completed_grade < 1.0 || completed_grade > 5.0) {
      return res.status(400).json({ message: 'Valid completed grade is required' });
    }

    const inc = await INC.findById(id);
    if (!inc) return res.status(404).json({ message: 'INC record not found' });

    inc.auto_failed = false;
    inc.completed = true;
    inc.completed_grade = parseFloat(completed_grade);
    inc.completed_date = new Date();
    inc.notes = (inc.notes || '') + ' [Overridden by admin]';
    await inc.save();

    const status = inc.completed_grade <= 3.0 ? 'Completed' : 'Failed';
    await Grade.findOneAndUpdate(
      { student_id: inc.student_id, subject_code: inc.subject_code, year_level: inc.year_level, semester: inc.semester },
      { grade: inc.completed_grade, status }
    );

    res.json({ success: true, message: 'Failed INC overridden successfully', data: inc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAllINC, getStudentINC, updateINC, setDueDate, overrideFailedINC };
