import { useState, useEffect } from 'react';
import { useStudents, useAdmin } from '../hooks/useApi';
import { Plus, Search, Edit, Trash2, X, ChevronLeft, ChevronRight, Upload, FileSpreadsheet, CreditCard, User, UserPlus, GraduationCap, Users, Calendar, Activity, CheckCircle, XCircle, Filter, Layers, AlertCircle } from 'lucide-react';

const StudentManagement = () => {
  const { getAllStudents, createStudent, updateStudent, deleteStudent, getFilterMetadata } = useStudents();
  const { uploadCSV, uploadExcel } = useAdmin();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ course: '', section: '', year_level: '' });
  const [metadata, setMetadata] = useState({ courses: [], sections: [] });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('csv');
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    full_name: '',
    course: '',
    section: '',
    year_level: '',
    status: 'active'
    // Note: No password field - students login with ID only
  });

  useEffect(() => {
    fetchStudents();
    fetchMetadata();
  }, [pagination.page, search, filters]);

  const fetchStudents = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        ...filters
      };
      const response = await getAllStudents(params);
      setStudents(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const response = await getFilterMetadata();
      setMetadata(response.data || { courses: [], sections: [] });
    } catch (error) {
      console.error('Error fetching metadata:', error);
      // Fallback: extract from students data
      if (students.length > 0) {
        setMetadata({
          courses: [...new Set(students.map(s => s.course).filter(Boolean))].sort(),
          sections: [...new Set(students.map(s => s.section).filter(Boolean))].sort()
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.student_id, formData);
      } else {
        await createStudent(formData);
      }
      setIsModalOpen(false);
      setEditingStudent(null);
      resetForm();
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving student');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      full_name: student.full_name,
      course: student.course,
      section: student.section,
      year_level: student.year_level.toString(),
      status: student.status
      // Note: No password for edit - students login with ID only
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (student_id) => {
    if (!confirm('Are you sure you want to delete this student? This will also delete all their grades.')) return;
    try {
      await deleteStudent(student_id);
      fetchStudents();
    } catch (error) {
      alert('Error deleting student');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadResult(null);

    try {
      // Create custom upload function for students
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/upload-students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      setUploadResult(result);
      if (result.success) {
        fetchStudents();
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Upload failed. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      full_name: '',
      course: '',
      section: '',
      year_level: '',
      status: 'active'
      // Note: No password field - students login with ID only
    });
  };

  const openAddModal = () => {
    setEditingStudent(null);
    resetForm();
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section - Blue Gradient Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Student Management</h1>
                <p className="text-primary-100">Manage student accounts and information</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsUploadModalOpen(true)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 backdrop-blur-sm">
                <Upload className="w-5 h-5" />
                Batch Upload
              </button>
              <button onClick={openAddModal} className="bg-white hover:bg-white/90 text-primary-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 shadow-lg">
                <Plus className="w-5 h-5" />
                Add Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Modern Design */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-5">
        <div className="flex flex-col gap-4">
          {/* Header with Filter Icon */}
          <div className="flex items-center gap-2 text-gray-700">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-primary-600" />
            </div>
            <span className="font-semibold text-sm">Filter Students</span>
          </div>

          {/* Filter Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search ID or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all duration-200"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Course Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GraduationCap className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filters.course}
                onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
                className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300"
              >
                <option value="">All Courses</option>
                {metadata?.courses?.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Section Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Layers className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filters.section}
                onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
                className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300"
              >
                <option value="">All Sections</option>
                {metadata?.sections?.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filters.year_level}
                onChange={(e) => setFilters(prev => ({ ...prev, year_level: e.target.value }))}
                className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300"
              >
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Filters & Clear Button */}
          {(search || filters.course || filters.section || filters.year_level) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Active:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Search: "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-blue-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.course && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {filters.course}
                  <button onClick={() => setFilters(prev => ({ ...prev, course: '' }))} className="hover:text-purple-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.section && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  {filters.section}
                  <button onClick={() => setFilters(prev => ({ ...prev, section: '' }))} className="hover:text-orange-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.year_level && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {filters.year_level} Year
                  <button onClick={() => setFilters(prev => ({ ...prev, year_level: '' }))} className="hover:text-green-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button 
                onClick={() => { setSearch(''); setFilters({ course: '', section: '', year_level: '' }); }}
                className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary-50 to-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Student ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Full Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Section</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-primary-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...students]
                .sort((a, b) => {
                  // First sort by course
                  if (a.course !== b.course) {
                    return a.course.localeCompare(b.course);
                  }
                  // Then by year level
                  return a.year_level - b.year_level;
                }).map((student) => (
                <tr key={student?.student_id} className="hover:bg-gray-50 transition-colors">
                  {/* Student ID */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student?.student_id}
                  </td>

                  {/* Full Name with Avatar */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-700">
                          {student?.full_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{student?.full_name}</span>
                    </div>
                  </td>

                  {/* Course */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                      <GraduationCap className="w-3 h-3" />
                      {student?.course}
                    </span>
                  </td>

                  {/* Section */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                      <Layers className="w-3 h-3" />
                      {student?.section}
                    </span>
                  </td>

                  {/* Year */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-50 text-green-700 rounded text-xs font-semibold">
                      {student?.year_level}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                      student?.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {student?.status === 'active' && <CheckCircle className="w-3 h-3" />}
                      {student?.status !== 'active' && <XCircle className="w-3 h-3" />}
                      {student?.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.student_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(students?.length || 0) === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No students found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal - Improved Design */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingStudent ? 'bg-blue-100' : 'bg-primary-100'}`}>
                  {editingStudent ? (
                    <Edit className="w-5 h-5 text-blue-600" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {editingStudent ? 'Update student information' : 'Create new student account'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="label flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  Student ID
                </label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                  className="input"
                  placeholder="e.g. 2022-007807"
                  required
                  disabled={editingStudent}
                />
                {editingStudent && (
                  <p className="text-xs text-gray-500 mt-1">Student ID cannot be changed</p>
                )}
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="input"
                  placeholder="e.g. Juan Dela Cruz"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    Course
                  </label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                    className="input"
                    placeholder="e.g. BSIS"
                    required
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    Section
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    className="input"
                    placeholder="e.g. Prova"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Year Level
                  </label>
                  <select
                    value={formData.year_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, year_level: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 py-3 shadow-lg shadow-primary-500/30"
                >
                  {editingStudent ? 'Update Student' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal - Improved Design */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Batch Upload Students</h2>
                  <p className="text-sm text-gray-500">Upload multiple students via CSV or Excel</p>
                </div>
              </div>
              <button onClick={() => { setIsUploadModalOpen(false); setUploadResult(null); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex gap-4">
                <button
                  onClick={() => setUploadType('csv')}
                  className={`flex-1 p-5 rounded-xl border-2 text-center transition-all duration-300 ${uploadType === 'csv' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                  <span className="font-semibold block">CSV File</span>
                  <span className="text-xs text-gray-500">.csv format</span>
                </button>
                <button
                  onClick={() => setUploadType('excel')}
                  className={`flex-1 p-5 rounded-xl border-2 text-center transition-all duration-300 ${uploadType === 'excel' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-green-600" />
                  <span className="font-semibold block">Excel File</span>
                  <span className="text-xs text-gray-500">.xlsx format</span>
                </button>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Required CSV Format:
                </p>
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <code className="text-xs font-mono text-gray-700 block">
                    student_id,full_name,course,section,year_level
                  </code>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Example: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">2022-007807,Juan Dela Cruz,BSIS,Prova,4</span>
                </p>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="label">Select File</label>
                  <input
                    type="file"
                    accept={uploadType === 'csv' ? '.csv' : '.xlsx,.xls'}
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    required
                  />
                  {uploadFile && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {uploadFile.name}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="btn-primary w-full py-3 shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    'Upload'
                  )}
                </button>
              </form>

              {uploadResult && (
                <div className={`p-4 rounded-xl ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {uploadResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <p className={`font-semibold ${uploadResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {uploadResult.message}
                    </p>
                  </div>
                  {uploadResult.summary && (
                    <div className="mt-2 text-sm text-gray-700 grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded-lg text-center">
                        <p className="text-green-600 font-bold">{uploadResult.summary.successful}</p>
                        <p className="text-xs text-gray-500">Successful</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg text-center">
                        <p className="text-red-600 font-bold">{uploadResult.summary.failed}</p>
                        <p className="text-xs text-gray-500">Failed</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg text-center">
                        <p className="text-gray-900 font-bold">{uploadResult.summary.total}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
