const jwt = require('jsonwebtoken');
const { Student } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Student.findOne({ student_id: decoded.student_id });
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    req.user = {
      student_id: user.student_id,
      full_name: user.full_name,
      role: user.role,
      course: user.course,
      section: user.section,
      year_level: user.year_level
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
