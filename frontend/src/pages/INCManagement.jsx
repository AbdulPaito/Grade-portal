import { useState, useEffect } from 'react';
import { useINC, useReports, useGrades, useStudents } from '../hooks/useApi';
import { AlertCircle, CheckCircle, Clock, Calendar, Edit2, AlertTriangle, Search, X, Filter, GraduationCap, Layers, BookOpen, XCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const INCManagement = () => {
  const { getAllINC, updateINC, setDueDate, overrideFailedINC } = useINC();
  const { getOverdueINC, getCompletedINC } = useReports();
  const { getAllGrades, updateGrade } = useGrades();
  const { getAllStudents } = useStudents();
  
  const [incRecords, setIncRecords] = useState([]);
  const [overdueRecords, setOverdueRecords] = useState([]);
  const [completedRecords, setCompletedRecords] = useState([]);
  const [failedRecords, setFailedRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    year_level: '',
    semester: '',
    course: '',
    section: ''
  });
  
  const [editingINC, setEditingINC] = useState(null);
  const [editForm, setEditForm] = useState({
    completed: false,
    completed_grade: '',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'active') {
        const [response, studentsRes] = await Promise.all([
          getAllINC({ completed: false, auto_failed: false }),
          getAllStudents()
        ]);
        setIncRecords(response.data);
        setStudents(studentsRes.data);
      } else if (activeTab === 'overdue') {
        const [response, studentsRes] = await Promise.all([
          getOverdueINC(),
          getAllStudents()
        ]);
        setOverdueRecords(response.data);
        setStudents(studentsRes.data);
      } else if (activeTab === 'completed') {
        const [response, studentsRes] = await Promise.all([
          getCompletedINC(),
          getAllStudents()
        ]);
        setCompletedRecords(response.data);
        setStudents(studentsRes.data);
      } else if (activeTab === 'failed-to-comply') {
        const [response, studentsRes] = await Promise.all([
          getAllINC({ auto_failed: true }),
          getAllStudents()
        ]);
        setIncRecords(response.data);
        setStudents(studentsRes.data);
      } else if (activeTab === 'failed') {
        const [gradesRes, studentsRes] = await Promise.all([
          getAllGrades({ status: 'Failed' }),
          getAllStudents()
        ]);
        setFailedRecords(gradesRes.data);
        setStudents(studentsRes.data);
      }
    } catch (error) {
      console.error('Error fetching INC records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingINC) {
        const updates = {};
        if (editForm.completed) {
          updates.completed = true;
          updates.completed_grade = parseFloat(editForm.completed_grade);
        }
        if (editForm.due_date) {
          updates.due_date = new Date(editForm.due_date).toISOString();
        }
        
        await updateINC(editingINC._id, updates);
        setEditingINC(null);
        fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating INC');
    }
  };

  const handleOverride = async (inc, grade) => {
    if (!confirm('Are you sure you want to override this failed INC?')) return;
    try {
      await overrideFailedINC(inc._id, grade);
      fetchData();
    } catch (error) {
      alert('Error overriding INC');
    }
  };

  const handleEditGrade = async (record, newGrade) => {
    try {
      const gradeValue = parseFloat(newGrade);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
        alert('Please enter a valid grade between 0 and 5');
        return;
      }
      
      // Calculate new status based on grade
      const newStatus = gradeValue <= 3.0 ? 'Passed' : 'Failed';
      
      await updateGrade(record._id, {
        grade: gradeValue,
        status: newStatus
      });
      
      fetchData();
      alert('Grade updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating grade');
    }
  };

  const openEditModal = (inc) => {
    setEditingINC(inc);
    setEditForm({
      completed: inc.completed,
      completed_grade: inc.completed_grade || '',
      due_date: inc.due_date ? new Date(inc.due_date).toISOString().split('T')[0] : ''
    });
  };

  const getDaysLeft = (dueDate) => {
    if (!dueDate) return 0;
    try {
      const days = differenceInDays(new Date(dueDate), new Date());
      return isNaN(days) ? 0 : days;
    } catch (e) {
      return 0;
    }
  };

  const filteredRecords = (activeTab === 'active' || activeTab === 'pending' || activeTab === 'failed-to-comply' ? incRecords :
    activeTab === 'overdue' ? overdueRecords :
    activeTab === 'completed' ? completedRecords :
    activeTab === 'failed' ? failedRecords : []).filter(record => {
    if (!record) return false;
    
    // Search filter
    const matchesSearch = !search || 
      (record.student_id && record.student_id.toLowerCase().includes(search.toLowerCase())) ||
      (record.full_name && record.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (record.subject_code && record.subject_code.toLowerCase().includes(search.toLowerCase()));
    
    // Dropdown filters
    const matchesYear = !filters.year_level || (record.year_level && record.year_level.toString() === filters.year_level);
    const matchesSemester = !filters.semester || record.semester === filters.semester;
    const matchesCourse = !filters.course || record.course === filters.course;
    const matchesSection = !filters.section || record.section === filters.section;
    
    // Tab-specific filters
    const daysLeft = getDaysLeft(record?.due_date);
    const isOverdue = daysLeft < 0;
    const isDueSoon = daysLeft <= 7 && daysLeft >= 0;
    
    // For pending tab, show only active INCs that are not overdue and not due soon
    const matchesPending = activeTab !== 'pending' || (!record.completed && !record.auto_failed && !isOverdue && !isDueSoon);
    
    // For failed-to-comply tab, only show auto_failed records
    const matchesFailedToComply = activeTab !== 'failed-to-comply' || record.auto_failed === true;
    
    return matchesSearch && matchesYear && matchesSemester && matchesCourse && matchesSection && matchesPending && matchesFailedToComply;
  });

  // Get unique values for filter dropdowns
  const allRecords = [...(incRecords || []), ...(overdueRecords || []), ...(completedRecords || []), ...(failedRecords || [])];
  const uniqueCourses = [...new Set(allRecords.map(r => r?.course).filter(Boolean))].sort();
  const uniqueSections = [...new Set(allRecords.map(r => r?.section).filter(Boolean))].sort();

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
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">INC Management</h1>
              <p className="text-primary-100">Track and manage incomplete grades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'active', label: 'Active INC', icon: Clock, color: 'orange' },
          { id: 'pending', label: 'Pending', icon: Clock, color: 'blue' },
          { id: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'red' },
          { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'green' },
          { id: 'failed', label: 'Failed', icon: XCircle, color: 'red' },
          { id: 'failed-to-comply', label: 'Failed to Comply', icon: AlertCircle, color: 'gray' }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? `bg-${tab.color}-100 text-${tab.color}-700`
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filters - Modern Design */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-5">
        <div className="flex flex-col gap-4">
          {/* Header with Filter Icon */}
          <div className="flex items-center gap-2 text-gray-700">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-orange-600" />
            </div>
            <span className="font-semibold text-sm">Filter INC Records</span>
          </div>

          {/* Filter Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search student or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all duration-200"
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

            {/* Year Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filters.year_level}
                onChange={(e) => setFilters(prev => ({ ...prev, year_level: e.target.value }))}
                className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300"
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

            {/* Semester Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filters.semester}
                onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300"
              >
                <option value="">All Semesters</option>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="summer">Summer</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Course Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GraduationCap className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filters.course}
                onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
                className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300"
              >
                <option value="">All Courses</option>
                {uniqueCourses?.map(course => (
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
                className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300"
              >
                <option value="">All Sections</option>
                {uniqueSections?.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(search || filters.year_level || filters.semester || filters.course || filters.section) && (
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
              <button 
                onClick={() => { setSearch(''); setFilters({ year_level: '', semester: '', course: '', section: '' }); }}
                className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* INC Records Table */}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-primary-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((record) => {
                if (!record) return null;
                
                // Check if this is a failed grade (from Grade model) or INC record
                const isFailedGrade = activeTab === 'failed';
                const isGradeRecord = record.status === 'Failed' && !record.due_date;
                
                // Find student data for records that don't have complete course/section info
                const needsStudentLookup = !record.course || !record.section || !record.year_level;
                const studentData = needsStudentLookup ? students.find(s => s.student_id === record.student_id) : null;
                const displayCourse = record.course || studentData?.course;
                const displaySection = record.section || studentData?.section;
                const displayYear = record.year_level || studentData?.year_level;
                
                // For INC records
                const daysLeft = !isGradeRecord ? getDaysLeft(record?.due_date) : 0;
                const isOverdue = !isGradeRecord && daysLeft < 0;
                const isCompleted = !isGradeRecord && record?.completed;
                const isAutoFailed = !isGradeRecord && record?.auto_failed;
                
                return (
                  <tr 
                    key={record._id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      isCompleted ? 'bg-blue-50/50' :
                      isAutoFailed ? 'bg-red-50/50' :
                      isOverdue ? 'bg-red-50/50' :
                      isGradeRecord ? 'bg-red-50/50' :
                      daysLeft <= 7 ? 'bg-orange-50/50' :
                      ''
                    }`}
                  >
                    {/* Student ID */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.student_id}
                    </td>

                    {/* Full Name with Avatar */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-700">
                            {record.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{record.full_name}</span>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {displayCourse && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                          <GraduationCap className="w-3 h-3" />
                          {displayCourse}
                        </span>
                      )}
                    </td>

                    {/* Section */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {displaySection && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                          <Layers className="w-3 h-3" />
                          {displaySection}
                        </span>
                      )}
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-50 text-green-700 rounded text-xs font-semibold">
                        {displayYear}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{record.subject_code}</span>
                        <span className="text-xs text-gray-500">{record.subject_name}</span>
                      </div>
                    </td>

                    {/* Semester */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{record.semester}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                        isCompleted 
                          ? 'bg-blue-100 text-blue-700' :
                          isAutoFailed 
                          ? 'bg-red-100 text-red-700' :
                          isGradeRecord
                          ? 'bg-red-100 text-red-700' :
                          isOverdue 
                          ? 'bg-red-100 text-red-700' :
                          daysLeft <= 7 
                          ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                      }`}>
                        {isCompleted && <CheckCircle className="w-3 h-3" />}
                        {isAutoFailed && <AlertCircle className="w-3 h-3" />}
                        {isGradeRecord && <XCircle className="w-3 h-3" />}
                        {isOverdue && <AlertTriangle className="w-3 h-3" />}
                        {!isCompleted && !isAutoFailed && !isGradeRecord && !isOverdue && <Clock className="w-3 h-3" />}
                        {isCompleted ? 'Completed' :
                         isAutoFailed ? 'Failed to Comply' :
                         isGradeRecord ? 'Failed' :
                         isOverdue ? 'Overdue' :
                         daysLeft <= 7 ? 'Due Soon' :
                         'Active'}
                      </span>
                    </td>

                    {/* Grade */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        isCompleted ? 'text-blue-600' :
                        isGradeRecord || isAutoFailed ? 'text-red-600' :
                        'text-orange-500'
                      }`}>
                        {isCompleted ? record.completed_grade : 
                         isGradeRecord ? record.grade :
                         isAutoFailed ? '5.0' :
                         'INC'}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        {isGradeRecord ? (
                          <>
                            <span className="text-xs text-gray-600">Grade: {record.grade}</span>
                            <span className="text-xs text-gray-500">From batch upload</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-gray-600">{format(new Date(record.due_date), 'MMM d, yyyy')}</span>
                            <span className={`text-xs ${isOverdue ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                              {isOverdue ? `${Math.abs(daysLeft)} days overdue` : 
                               isCompleted ? 'Done' :
                               `${daysLeft} days left`}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {isCompleted ? (
                          <span className="text-xs text-gray-500">Grade: <span className="font-bold text-blue-600">{record.completed_grade}</span></span>
                        ) : isAutoFailed ? (
                          <button
                            onClick={() => {
                              const grade = prompt('Enter final grade to override:');
                              if (grade) handleOverride(record, parseFloat(grade));
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Override
                          </button>
                        ) : isGradeRecord ? (
                          <button
                            onClick={() => {
                              const newGrade = prompt('Enter new grade for this student:');
                              if (newGrade) handleEditGrade(record, newGrade);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit Grade
                          </button>
                        ) : (
                          <button
                            onClick={() => openEditModal(record)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Manage
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No {activeTab} INC records found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Edit Modal - Improved Design */}
      {editingINC && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Manage INC Record</h2>
                  <p className="text-sm text-gray-500">{editingINC.subject_code} - {editingINC.full_name}</p>
                </div>
              </div>
              <button onClick={() => setEditingINC(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {/* Student Info Card */}
              <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-xl border border-orange-200">
                {/* Student Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-xl font-bold text-orange-700">
                      {editingINC.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{editingINC.full_name}</p>
                    <p className="text-sm text-gray-500">{editingINC.student_id}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Course */}
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Course</p>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-primary-600" />
                      <span className="font-semibold text-gray-900">{editingINC.course || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Section */}
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Section</p>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-gray-900">{editingINC.section || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Year */}
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Year Level</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-900">Year {editingINC.year_level}</span>
                    </div>
                  </div>

                  {/* Semester */}
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Semester</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-900">{editingINC.semester}</span>
                    </div>
                  </div>
                </div>

                {/* Subject - Same design as 4 boxes */}
                <div className="mt-3 bg-white p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Subject</p>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900">{editingINC.subject_code} - {editingINC.subject_name}</span>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <label className="label flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))}
                  className="input w-full"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="completed"
                  checked={editForm.completed}
                  onChange={(e) => setEditForm(prev => ({ ...prev, completed: e.target.checked }))}
                  className="w-5 h-5 text-primary-600 rounded-lg border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="completed" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Mark as Completed
                </label>
              </div>

              {editForm.completed && (
                <div className="animate-fadeIn">
                  <label className="label flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    Final Grade
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="5"
                    value={editForm.completed_grade}
                    onChange={(e) => setEditForm(prev => ({ ...prev, completed_grade: e.target.value }))}
                    className="input"
                    required={editForm.completed}
                    placeholder="Enter grade (1.0 - 5.0)"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingINC(null)}
                  className="btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 py-3 shadow-lg shadow-primary-500/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default INCManagement;
