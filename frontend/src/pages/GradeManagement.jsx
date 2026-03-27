import { useState, useEffect, useRef } from 'react';
import { useGrades, useAdmin, useStudents } from '../hooks/useApi';
import { Upload, Plus, Search, X, FileSpreadsheet, Users, GraduationCap, Edit, CheckCircle, XCircle, Filter, Clock, Calendar, Trash2, Layers, AlertCircle } from 'lucide-react';

const GradeManagement = () => {
  const { getAllGrades, addGrade, updateGrade, deleteGrade } = useGrades();
  const { uploadCSV, uploadExcel } = useAdmin();
  const { getAllStudents } = useStudents();
  
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ section: '', year_level: '', semester: '', course: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('csv');
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [gradeForm, setGradeForm] = useState({
    student_id: '',
    subject_code: '',
    subject_name: '',
    grade: '',
    year_level: '',
    semester: ''
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const studentDropdownRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [pagination.page, search, filters]);

  // Close student dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, studentsRes] = await Promise.all([
        getAllGrades({
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        }),
        getAllStudents({ limit: 1000 })
      ]);
      
      setGrades(gradesRes.data);
      setStudents(studentsRes.data);
      setPagination(prev => ({
        ...prev,
        total: gradesRes.pagination.total,
        pages: gradesRes.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const result = uploadType === 'csv' 
        ? await uploadCSV(uploadFile)
        : await uploadExcel(uploadFile);
      
      setUploadResult(result);
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: error.response?.data?.message || 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    try {
      await addGrade(gradeForm);
      setIsAddModalOpen(false);
      resetGradeForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding grade');
    }
  };

  const handleEditGrade = async (e) => {
    e.preventDefault();
    if (!editingGrade) return;
    try {
      await updateGrade(editingGrade._id, {
        subject_code: editingGrade.subject_code,
        subject_name: editingGrade.subject_name,
        grade: editingGrade.grade,
        year_level: editingGrade.year_level,
        semester: editingGrade.semester
      });
      setIsEditModalOpen(false);
      setEditingGrade(null);
      fetchData();
      alert('Grade updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating grade');
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;
    try {
      await deleteGrade(gradeId);
      fetchData();
      alert('Grade deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting grade');
    }
  };

  const openEditModal = (grade) => {
    setEditingGrade({ ...grade });
    setIsEditModalOpen(true);
  };

  const handleStudentSelect = (student_id) => {
    if (!student_id) return;
    const student = students?.find(s => s.student_id === student_id);
    if (student) {
      setSelectedStudent(student);
      setGradeForm(prev => ({
        ...prev,
        student_id,
        section: student?.section,
        year_level: student?.year_level?.toString() || ''
      }));
      setStudentSearch('');
    }
  };

  const filteredStudents = (students || []).filter(s => 
    !studentSearch || 
    s.student_id?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.full_name?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const resetGradeForm = () => {
    setGradeForm({
      student_id: '',
      subject_code: '',
      subject_name: '',
      grade: '',
      year_level: '',
      semester: ''
    });
    setSelectedStudent(null);
  };

  const getGradeColor = (grade, status) => {
    if (status === 'INC') return 'text-orange-600 bg-orange-50';
    if (status === 'Failed') return 'text-red-600 bg-red-50';
    if (status === 'Completed') return 'text-blue-600 bg-blue-50';
    if (typeof grade === 'number') {
      if (grade <= 1.5) return 'text-emerald-600 bg-emerald-50';
      if (grade <= 2.0) return 'text-green-600 bg-green-50';
      if (grade <= 3.0) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    }
    return 'text-gray-600 bg-gray-50';
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
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Grade Management</h1>
                <p className="text-primary-100">Upload and manage student grades</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsUploadModalOpen(true)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 backdrop-blur-sm">
                <Upload className="w-5 h-5" />
                Batch Upload
              </button>
              <button onClick={() => setIsAddModalOpen(true)} className="bg-white hover:bg-white/90 text-primary-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 shadow-lg">
                <Plus className="w-5 h-5" />
                Add Grade
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
            <span className="font-semibold text-sm">Filter Grades</span>
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
                placeholder="Search student or subject..."
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
                {(students && students.length > 0 ? [...new Set(students.map(s => s?.course).filter(Boolean))] : []).map(course => (
                  <option key={course} value={course}>{course}</option>
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
                {(students && students.length > 0 ? [...new Set(students.map(s => s?.section).filter(Boolean))] : []).map(section => (
                  <option key={section} value={section}>{section}</option>
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
          {(search || filters.year_level || filters.semester || filters.section || filters.course) && (
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
              {filters.semester && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  {filters.semester} Sem
                  <button onClick={() => setFilters(prev => ({ ...prev, semester: '' }))} className="hover:text-yellow-900 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button 
                onClick={() => { setSearch(''); setFilters({ section: '', year_level: '', semester: '', course: '' }); }}
                className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grades Table */}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Sem</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-primary-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(grades || []).map((grade) => {
                // Find student to get course and section
                const student = (students || []).find(s => s?.student_id === grade?.student_id);
                
                if (!grade) return null;
                
                return (
                  <tr key={grade._id} className="hover:bg-gray-50 transition-colors">
                    {/* Student ID */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {grade.student_id}
                    </td>

                    {/* Full Name with Avatar */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-700">
                            {grade.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{grade.full_name}</span>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {student?.course && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                          <GraduationCap className="w-3 h-3" />
                          {student.course}
                        </span>
                      )}
                    </td>

                    {/* Section */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {student?.section && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                          <Layers className="w-3 h-3" />
                          {student.section}
                        </span>
                      )}
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-50 text-green-700 rounded text-xs font-semibold">
                        {grade.year_level}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{grade.subject_code}</span>
                        <span className="text-xs text-gray-500">{grade.subject_name}</span>
                      </div>
                    </td>

                    {/* Semester */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-100">
                        <Clock className="w-3.5 h-3.5" />
                        {grade.semester}
                      </span>
                    </td>

                    {/* Grade */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg text-sm font-bold ${
                        grade.status === 'INC' ? 'bg-orange-100 text-orange-700' :
                        grade.status === 'Failed' ? 'bg-red-100 text-red-700' :
                        grade.grade <= 1.5 ? 'bg-emerald-100 text-emerald-700' :
                        grade.grade <= 2.0 ? 'bg-green-100 text-green-700' :
                        grade.grade <= 3.0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {typeof grade.grade === 'number' ? grade.grade.toFixed(2) : grade.grade}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                        grade.status === 'Passed' ? 'bg-green-100 text-green-700' :
                        grade.status === 'Failed' ? 'bg-red-100 text-red-700' :
                        grade.status === 'INC' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {grade.status === 'Passed' && <CheckCircle className="w-3 h-3" />}
                        {grade.status === 'Failed' && <XCircle className="w-3 h-3" />}
                        {grade.status === 'INC' && <Clock className="w-3 h-3" />}
                        {grade.status === 'Completed' ? 'Passed' : grade.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(grade)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGrade(grade._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {grades.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No grades found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Edit Grade Modal - Improved Design */}
      {isEditModalOpen && editingGrade && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Edit className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Grade</h2>
                  <p className="text-sm text-gray-500">Update grade information</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditGrade} className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{editingGrade.full_name}</p>
                    <p className="text-sm text-gray-600">ID: {editingGrade.student_id}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Subject Code</label>
                  <input
                    type="text"
                    value={editingGrade.subject_code}
                    onChange={(e) => setEditingGrade(prev => ({ ...prev, subject_code: e.target.value }))}
                    className="input"
                    placeholder="e.g. MATH101"
                    required
                  />
                </div>
                <div>
                  <label className="label">Subject Name</label>
                  <input
                    type="text"
                    value={editingGrade.subject_name}
                    onChange={(e) => setEditingGrade(prev => ({ ...prev, subject_name: e.target.value }))}
                    className="input"
                    placeholder="e.g. Mathematics 1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Grade</label>
                  <input
                    type="text"
                    value={editingGrade.grade}
                    onChange={(e) => setEditingGrade(prev => ({ ...prev, grade: e.target.value }))}
                    className="input"
                    placeholder="1.0-5.0 or INC"
                    required
                  />
                </div>
                <div>
                  <label className="label">Year</label>
                  <select
                    value={editingGrade.year_level}
                    onChange={(e) => setEditingGrade(prev => ({ ...prev, year_level: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="">Select</option>
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="4">4th</option>
                  </select>
                </div>
                <div>
                  <label className="label">Semester</label>
                  <select
                    value={editingGrade.semester}
                    onChange={(e) => setEditingGrade(prev => ({ ...prev, semester: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="">Select</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 py-3 shadow-lg shadow-primary-500/30"
                >
                  Update Grade
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
                  <h2 className="text-xl font-bold text-gray-900">Batch Upload Grades</h2>
                  <p className="text-sm text-gray-500">Upload multiple grades via CSV or Excel</p>
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
                    student_id,subject_code,subject_name,grade,year,semester
                  </code>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Use <span className="font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">"INC"</span> for incomplete grades
                </p>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="label">Select File</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept={uploadType === 'csv' ? '.csv' : '.xlsx,.xls'}
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      required
                    />
                  </div>
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
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-red-700 text-sm">Errors:</p>
                      <ul className="text-sm text-red-600 mt-1 max-h-32 overflow-y-auto">
                        {uploadResult.errors.map((err, i) => (
                          <li key={i} className="text-xs">{err.errors?.join(', ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Grade Modal - Improved Design */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add Single Grade</h2>
                  <p className="text-sm text-gray-500">Enter grade details below</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddGrade} className="p-6 space-y-5">
              {/* Student Search */}
              <div ref={studentDropdownRef} className="relative">
                <label className="label flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  Select Student
                </label>
                
                {/* Custom Dropdown Trigger */}
                <div 
                  onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${
                    isStudentDropdownOpen 
                      ? 'border-primary-500 shadow-lg shadow-primary-500/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedStudent ? (
                      <>
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-700">
                            {selectedStudent.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{selectedStudent.full_name}</p>
                          <p className="text-xs text-gray-500">{selectedStudent.student_id} • {selectedStudent.course}</p>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Choose a student...</span>
                    )}
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isStudentDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Custom Dropdown Menu */}
                {isStudentDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-72">
                    {/* Search in dropdown */}
                    <div className="p-3 border-b border-gray-100 bg-white sticky top-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search student ID or name..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
                          autoFocus
                        />
                        {studentSearch && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setStudentSearch(''); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Student list */}
                    <div className="max-h-48 overflow-y-auto">
                      {(filteredStudents || []).length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No students found
                        </div>
                      ) : (
                        (filteredStudents || []).map((s) => (
                          <div
                            key={s.student_id}
                            onClick={() => {
                              handleStudentSelect(s.student_id);
                              setIsStudentDropdownOpen(false);
                              setStudentSearch('');
                            }}
                            className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 ${
                              gradeForm.student_id === s.student_id
                                ? 'bg-primary-50 border-l-4 border-primary-500'
                                : 'hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-gray-700">
                                {s.full_name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{s.full_name}</p>
                              <p className="text-xs text-gray-500">{s.student_id} • {s.course} - {s.section}</p>
                            </div>
                            {gradeForm.student_id === s.student_id && (
                              <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 sticky bottom-0">
                      Showing {(filteredStudents?.length || 0)} of {(students?.length || 0)} students
                    </div>
                  </div>
                )}
              </div>

              {selectedStudent && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedStudent.full_name}</p>
                      <p className="text-sm text-blue-600">{selectedStudent.course} - {selectedStudent.section}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Subject Code</label>
                  <input
                    type="text"
                    value={gradeForm.subject_code}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, subject_code: e.target.value }))}
                    className="input"
                    placeholder="e.g. MATH101"
                    required
                  />
                </div>
                <div>
                  <label className="label">Subject Name</label>
                  <input
                    type="text"
                    value={gradeForm.subject_name}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, subject_name: e.target.value }))}
                    className="input"
                    placeholder="e.g. Mathematics 1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Grade</label>
                  <input
                    type="text"
                    value={gradeForm.grade}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, grade: e.target.value }))}
                    className="input"
                    placeholder="1.0-5.0"
                    required
                  />
                </div>
                <div>
                  <label className="label">Year</label>
                  <select
                    value={gradeForm.year_level}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, year_level: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="">Select</option>
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="4">4th</option>
                  </select>
                </div>
                <div>
                  <label className="label">Semester</label>
                  <select
                    value={gradeForm.semester}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, semester: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="">Select</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 py-3 shadow-lg shadow-primary-500/30"
                >
                  Add Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeManagement;
