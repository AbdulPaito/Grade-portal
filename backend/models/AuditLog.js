const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'UPLOAD', 'LOGIN', 'LOGOUT', 'INC_COMPLETED', 'INC_FAILED']
  },
  entity_type: {
    type: String,
    required: true,
    enum: ['student', 'grade', 'inc', 'admin']
  },
  entity_id: {
    type: String,
    required: true
  },
  performed_by: {
    type: String,
    required: true
  },
  performed_by_role: {
    type: String,
    enum: ['student', 'admin'],
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity_type: 1, entity_id: 1 });
auditLogSchema.index({ performed_by: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
