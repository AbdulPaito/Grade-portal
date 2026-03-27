import { Routes, Route, Navigate } from 'react-router-dom';
import AdminOverview from './AdminOverview';
import StudentManagement from './StudentManagement';
import GradeManagement from './GradeManagement';
import INCManagement from './INCManagement';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminOverview />} />
      <Route path="/students" element={<StudentManagement />} />
      <Route path="/grades" element={<GradeManagement />} />
      <Route path="/inc" element={<INCManagement />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default AdminDashboard;
