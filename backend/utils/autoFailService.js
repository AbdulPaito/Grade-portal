const Grade = require('../models/Grade');
const INC = require('../models/INC');
const Student = require('../models/Student');
const { logINCAutoFail } = require('./auditLogger');

const processOverdueINC = async () => {
  try {
    const today = new Date();
    const overdueINC = await INC.find({
      due_date: { $lt: today },
      completed: false,
      auto_failed: false
    });

    for (const inc of overdueINC) {
      inc.auto_failed = true;
      await inc.save();

      await Grade.findOneAndUpdate(
        { student_id: inc.student_id, subject_code: inc.subject_code, year_level: inc.year_level, semester: inc.semester },
        { status: 'Failed' }
      );

      // Log the auto-fail
      await logINCAutoFail(inc, overdueINC.length);

      console.log(`Auto-failed INC for student ${inc.student_id}, subject ${inc.subject_code}`);
    }

    return overdueINC.length;
  } catch (error) {
    console.error('Auto-fail process error:', error);
    throw error;
  }
};

const manualFailCheck = async (req, res) => {
  try {
    const count = await processOverdueINC();
    res.json({ success: true, message: `${count} overdue INC records processed`, auto_failed_count: count });
  } catch (error) {
    res.status(500).json({ message: 'Error processing overdue INC', error: error.message });
  }
};

module.exports = { processOverdueINC, manualFailCheck };
