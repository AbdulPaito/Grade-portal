import { useAuth } from '../contexts/AuthContext';

export const useStudents = () => {
  const { api } = useAuth();

  const getAllStudents = async (params = {}) => {
    const response = await api.get('/students', { params });
    return response.data;
  };

  const getStudent = async (student_id) => {
    const response = await api.get(`/students/${student_id}`);
    return response.data;
  };

  const createStudent = async (data) => {
    const response = await api.post('/students', data);
    return response.data;
  };

  const updateStudent = async (student_id, data) => {
    const response = await api.put(`/students/${student_id}`, data);
    return response.data;
  };

  const deleteStudent = async (student_id) => {
    const response = await api.delete(`/students/${student_id}`);
    return response.data;
  };

  const getStudentSummary = async (student_id) => {
    const response = await api.get(`/students/${student_id}/summary`);
    return response.data;
  };

  const getFilterMetadata = async () => {
    const response = await api.get('/students/filters/metadata');
    return response.data;
  };

  return {
    getAllStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentSummary,
    getFilterMetadata
  };
};

export const useGrades = () => {
  const { api } = useAuth();

  const getStudentGrades = async (student_id, params = {}) => {
    const response = await api.get(`/grades/${student_id}`, { params });
    return response.data;
  };

  const getAllGrades = async (params = {}) => {
    const response = await api.get('/grades/all', { params });
    return response.data;
  };

  const addGrade = async (data) => {
    const response = await api.post('/grades', data);
    return response.data;
  };

  const updateGrade = async (id, data) => {
    const response = await api.put(`/grades/${id}`, data);
    return response.data;
  };

  const deleteGrade = async (id) => {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  };

  const getGradeStats = async (student_id) => {
    const response = await api.get(`/grades/stats/${student_id}`);
    return response.data;
  };

  return {
    getStudentGrades,
    getAllGrades,
    addGrade,
    updateGrade,
    deleteGrade,
    getGradeStats
  };
};

export const useINC = () => {
  const { api } = useAuth();

  const getAllINC = async (params = {}) => {
    const response = await api.get('/inc', { params });
    return response.data;
  };

  const getStudentINC = async (student_id) => {
    const response = await api.get(`/inc/student/${student_id}`);
    return response.data;
  };

  const updateINC = async (id, data) => {
    const response = await api.put(`/inc/${id}`, data);
    return response.data;
  };

  const setDueDate = async (id, due_date) => {
    const response = await api.put(`/inc/${id}/due-date`, { due_date });
    return response.data;
  };

  const overrideFailedINC = async (id, completed_grade) => {
    const response = await api.put(`/inc/${id}/override`, { completed_grade });
    return response.data;
  };

  const deleteINC = async (id) => {
    const response = await api.delete(`/inc/${id}`);
    return response.data;
  };

  const bulkDeleteINC = async (ids) => {
    const response = await api.post('/inc/bulk-delete', { ids });
    return response.data;
  };

  const markAsFailed = async (id) => {
    const response = await api.put(`/inc/${id}/mark-failed`);
    return response.data;
  };

  const bulkMarkAsFailed = async (ids) => {
    const response = await api.post('/inc/bulk-mark-failed', { ids });
    return response.data;
  };

  return {
    getAllINC,
    getStudentINC,
    updateINC,
    setDueDate,
    overrideFailedINC,
    deleteINC,
    bulkDeleteINC,
    markAsFailed,
    bulkMarkAsFailed
  };
};

export const useReports = () => {
  const { api } = useAuth();

  const getAllGradesReport = async (params = {}) => {
    const response = await api.get('/reports/all-grades', { params });
    return response.data;
  };

  const getINCList = async (params = {}) => {
    const response = await api.get('/reports/inc-list', { params });
    return response.data;
  };

  const getOverdueINC = async () => {
    const response = await api.get('/reports/overdue-inc');
    return response.data;
  };

  const getCompletedINC = async () => {
    const response = await api.get('/reports/completed-inc');
    return response.data;
  };

  const getStudentReport = async (student_id) => {
    const response = await api.get(`/reports/student-grades/${student_id}`);
    return response.data;
  };

  const getSectionSummary = async (params = {}) => {
    const response = await api.get('/reports/section-summary', { params });
    return response.data;
  };

  return {
    getAllGradesReport,
    getINCList,
    getOverdueINC,
    getCompletedINC,
    getStudentReport,
    getSectionSummary
  };
};

export const useAdmin = () => {
  const { api } = useAuth();

  const uploadCSV = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  };

  const uploadExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/upload-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  };

  const processOverdue = async () => {
    const response = await api.post('/admin/process-overdue');
    return response.data;
  };

  return {
    uploadCSV,
    uploadExcel,
    processOverdue
  };
};
