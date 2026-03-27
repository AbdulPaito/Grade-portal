const { AuditLog } = require('../models');

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, UPLOAD, LOGIN, etc.)
 * @param {string} params.entity_type - Type of entity (student, grade, inc, admin)
 * @param {string} params.entity_id - ID of the entity
 * @param {string} params.performed_by - ID of user who performed the action
 * @param {string} params.performed_by_role - Role of user (student, admin)
 * @param {Object} params.details - Additional details
 */
const createAuditLog = async ({
  action,
  entity_type,
  entity_id,
  performed_by,
  performed_by_role,
  details = {}
}) => {
  try {
    const log = new AuditLog({
      action,
      entity_type,
      entity_id,
      performed_by,
      performed_by_role,
      details
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging should not break main functionality
  }
};

/**
 * Middleware to log grade uploads
 */
const logGradeUpload = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // Restore original json method
    res.json = originalJson;
    
    // Log if upload was successful
    if (data && data.success && req.user) {
      createAuditLog({
        action: 'UPLOAD',
        entity_type: 'grade',
        entity_id: 'batch',
        performed_by: req.user.student_id,
        performed_by_role: req.user.role,
        details: {
          filename: req.file?.originalname,
          successful: data.summary?.successful || 0,
          failed: data.summary?.failed || 0,
          total: data.summary?.total || 0
        }
      });
    }
    
    return res.json(data);
  };
  
  next();
};

/**
 * Log student creation
 */
const logStudentCreate = async (student, performed_by) => {
  await createAuditLog({
    action: 'CREATE',
    entity_type: 'student',
    entity_id: student.student_id,
    performed_by: performed_by.student_id,
    performed_by_role: performed_by.role,
    details: {
      full_name: student.full_name,
      course: student.course,
      section: student.section,
      year_level: student.year_level
    }
  });
};

/**
 * Log student update
 */
const logStudentUpdate = async (student_id, updates, performed_by) => {
  await createAuditLog({
    action: 'UPDATE',
    entity_type: 'student',
    entity_id: student_id,
    performed_by: performed_by.student_id,
    performed_by_role: performed_by.role,
    details: { updates }
  });
};

/**
 * Log student deletion
 */
const logStudentDelete = async (student_id, studentData, performed_by) => {
  await createAuditLog({
    action: 'DELETE',
    entity_type: 'student',
    entity_id: student_id,
    performed_by: performed_by.student_id,
    performed_by_role: performed_by.role,
    details: { deleted_student: studentData }
  });
};

/**
 * Log INC update
 */
const logINCUpdate = async (inc_id, updates, performed_by) => {
  await createAuditLog({
    action: updates.completed ? 'INC_COMPLETED' : 'UPDATE',
    entity_type: 'inc',
    entity_id: inc_id,
    performed_by: performed_by.student_id,
    performed_by_role: performed_by.role,
    details: { updates }
  });
};

/**
 * Log INC auto-fail
 */
const logINCAutoFail = async (inc, failed_count) => {
  await createAuditLog({
    action: 'INC_FAILED',
    entity_type: 'inc',
    entity_id: inc._id,
    performed_by: 'system',
    performed_by_role: 'admin',
    details: {
      student_id: inc.student_id,
      subject_code: inc.subject_code,
      due_date: inc.due_date,
      auto_failed_count: failed_count
    }
  });
};

/**
 * Log grade creation
 */
const logGradeCreate = async (grade, performed_by) => {
  await createAuditLog({
    action: 'CREATE',
    entity_type: 'grade',
    entity_id: grade._id,
    performed_by: performed_by.student_id,
    performed_by_role: performed_by.role,
    details: {
      student_id: grade.student_id,
      subject_code: grade.subject_code,
      grade: grade.grade,
      status: grade.status
    }
  });
};

/**
 * Log grade update
 */
const logGradeUpdate = async (grade_id, updates, performed_by) => {
  await createAuditLog({
    action: 'UPDATE',
    entity_type: 'grade',
    entity_id: grade_id,
    performed_by: performed_by.student_id,
    performed_by_role: performed_by.role,
    details: { updates }
  });
};

/**
 * Log admin login
 */
const logAdminLogin = async (admin) => {
  await createAuditLog({
    action: 'LOGIN',
    entity_type: 'admin',
    entity_id: admin.student_id,
    performed_by: admin.student_id,
    performed_by_role: 'admin',
    details: {
      full_name: admin.full_name
    }
  });
};

/**
 * Log student login
 */
const logStudentLogin = async (student) => {
  await createAuditLog({
    action: 'LOGIN',
    entity_type: 'student',
    entity_id: student.student_id,
    performed_by: student.student_id,
    performed_by_role: 'student',
    details: {
      full_name: student.full_name
    }
  });
};

module.exports = {
  createAuditLog,
  logGradeUpload,
  logStudentCreate,
  logStudentUpdate,
  logStudentDelete,
  logINCUpdate,
  logINCAutoFail,
  logGradeCreate,
  logGradeUpdate,
  logAdminLogin,
  logStudentLogin
};
