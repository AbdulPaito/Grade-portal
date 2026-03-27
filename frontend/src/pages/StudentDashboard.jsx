import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGrades, useStudents, useINC } from '../hooks/useApi';
import { ChevronDown, ChevronRight, AlertTriangle, Search, Filter, BookOpen, GraduationCap, AlertCircle, CheckCircle, XCircle, Clock, TrendingUp, Award, Calendar, FileText } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { getStudentGrades } = useGrades();
  const { getStudentSummary } = useStudents();
  const { getStudentINC } = useINC();
  
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [incRecords, setIncRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedSemesters, setExpandedSemesters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, summaryRes, incRes] = await Promise.all([
        getStudentGrades(user.student_id),
        getStudentSummary(user.student_id),
        getStudentINC(user.student_id)
      ]);
      
      setGrades(gradesRes.data);
      setSummary(summaryRes.data);
      setIncRecords(incRes.data);
      
      // Expand all years by default
      const years = {};
      [1, 2, 3, 4].forEach(y => years[y] = true);
      setExpandedYears(years);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleSemester = (key) => {
    setExpandedSemesters(prev => ({ ...prev, [key]: !prev[key] }));
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Passed': return <span className="badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passed</span>;
      case 'Failed': return <span className="badge-danger flex items-center gap-1"><XCircle className="w-3 h-3" /> Failed</span>;
      case 'INC': return <span className="badge-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> INC</span>;
      case 'Completed': return <span className="badge-info flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  // Filter grades
  const filteredGrades = grades.filter(g => {
    const matchesSearch = searchTerm === '' || 
      g.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.subject_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === '' || g.year_level === parseInt(filterYear);
    const matchesSemester = filterSemester === '' || g.semester === filterSemester;
    return matchesSearch && matchesYear && matchesSemester;
  });

  // Organize grades by year and semester
  const organizedGrades = {};
  [1, 2, 3, 4].forEach(year => {
    organizedGrades[year] = {
      '1st': [],
      '2nd': [],
      'summer': []
    };
  });

  filteredGrades.forEach(grade => {
    if (organizedGrades[grade.year_level]) {
      organizedGrades[grade.year_level][grade.semester].push(grade);
    }
  });

  const activeINC = incRecords.filter(inc => !inc.completed && !inc.auto_failed);
  const overdueINC = incRecords.filter(inc => !inc.completed && new Date() > new Date(inc.due_date));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section - Clean without logos */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Academic Records</h1>
              <p className="text-primary-100">Track your progress and grades</p>
            </div>
          </div>
        </div>
      </div>

      {/* INC Warning Banner */}
      {activeINC.length > 0 && (
        <div className={`p-4 rounded-lg ${overdueINC.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${overdueINC.length > 0 ? 'text-red-600' : 'text-orange-600'}`} />
            <div>
              <h3 className={`font-semibold ${overdueINC.length > 0 ? 'text-red-900' : 'text-orange-900'}`}>
                {overdueINC.length > 0 ? 'URGENT: Overdue INC Records' : 'Active INC Records'}
              </h3>
              <p className={`text-sm mt-1 ${overdueINC.length > 0 ? 'text-red-700' : 'text-orange-700'}`}>
                You have {activeINC.length} incomplete grade{activeINC.length > 1 ? 's' : ''}.
                {overdueINC.length > 0 && ` ${overdueINC.length} ${overdueINC.length === 1 ? 'is' : 'are'} overdue and marked as FAILED.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards - Modern Design */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* GPA Card - Highlighted */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <span className="text-emerald-100 text-sm font-medium">GPA</span>
              </div>
              <p className="text-3xl font-bold">{summary.gpa}</p>
              <p className="text-emerald-100 text-xs mt-1">General Average</p>
            </div>
          </div>

          {/* Subjects Card */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-500 text-sm font-medium">Subjects</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.total_subjects}</p>
              <p className="text-gray-400 text-xs mt-1">Total enrolled</p>
            </div>
          </div>

          {/* Passed Card */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-500 text-sm font-medium">Passed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.passed_count}</p>
              <p className="text-gray-400 text-xs mt-1">Completed</p>
            </div>
          </div>

          {/* INC Card */}
          <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg border transition-shadow ${summary.inc_count > 0 ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : 'bg-white border-gray-100 hover:shadow-xl'}`}>
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 ${summary.inc_count > 0 ? 'bg-white/10' : 'bg-orange-50'}`}></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${summary.inc_count > 0 ? 'bg-white/20' : 'bg-orange-100'}`}>
                  <AlertCircle className={`w-5 h-5 ${summary.inc_count > 0 ? 'text-white' : 'text-orange-600'}`} />
                </div>
                <span className={`text-sm font-medium ${summary.inc_count > 0 ? 'text-orange-100' : 'text-gray-500'}`}>INC</span>
              </div>
              <p className={`text-2xl font-bold ${summary.inc_count > 0 ? 'text-white' : 'text-gray-900'}`}>{summary.inc_count}</p>
              <p className={`text-xs mt-1 ${summary.inc_count > 0 ? 'text-orange-100' : 'text-gray-400'}`}>Incomplete</p>
            </div>
          </div>

          {/* Failed Card */}
          <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg border transition-shadow ${summary.failed_count > 0 ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-white border-gray-100 hover:shadow-xl'}`}>
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 ${summary.failed_count > 0 ? 'bg-white/10' : 'bg-red-50'}`}></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${summary.failed_count > 0 ? 'bg-white/20' : 'bg-red-100'}`}>
                  <XCircle className={`w-5 h-5 ${summary.failed_count > 0 ? 'text-white' : 'text-red-600'}`} />
                </div>
                <span className={`text-sm font-medium ${summary.failed_count > 0 ? 'text-red-100' : 'text-gray-500'}`}>Failed</span>
              </div>
              <p className={`text-2xl font-bold ${summary.failed_count > 0 ? 'text-white' : 'text-gray-900'}`}>{summary.failed_count}</p>
              <p className={`text-xs mt-1 ${summary.failed_count > 0 ? 'text-red-100' : 'text-gray-400'}`}>Needs retake</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters - Modern Compact Design */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">All Semesters</option>
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
              <option value="summer">Summer</option>
            </select>
          </div>
        </div>
      </div>

      {/* INC Records - Modern Timeline Design - Show only active/pending INCs */}
      {activeINC.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              INC Records & Deadlines
            </h2>
            <p className="text-gray-600 text-sm mt-1 ml-12">Complete these requirements before the deadline to avoid failing</p>
          </div>
          <div className="divide-y divide-gray-100">
            {activeINC.map((inc, index) => {
              const daysLeft = differenceInDays(new Date(inc.due_date), new Date());
              const isOverdue = daysLeft < 0;
              const isCompleted = inc.completed;
              const isAutoFailed = inc.auto_failed;

              return (
                <div
                  key={inc._id}
                  className={`p-5 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-blue-100' : 
                        isAutoFailed ? 'bg-red-100' : 
                        isOverdue ? 'bg-red-100' : 
                        daysLeft <= 7 ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-6 h-6 text-blue-600" /> :
                         isAutoFailed ? <XCircle className="w-6 h-6 text-red-600" /> :
                         isOverdue ? <AlertTriangle className="w-6 h-6 text-red-600" /> :
                         <Clock className={`w-6 h-6 ${daysLeft <= 7 ? 'text-orange-600' : 'text-yellow-600'}`} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {inc.subject_code} - {inc.subject_name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                            <Calendar className="w-3 h-3" />
                            {inc.year_level} Year - {inc.semester} Semester
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 lg:justify-end">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Completed - Grade: {inc.completed_grade}
                        </span>
                      ) : isAutoFailed ? (
                        <span className="inline-flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          <XCircle className="w-4 h-4" />
                          FAILED
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          OVERDUE
                        </span>
                      ) : (
                        <>
                          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            daysLeft <= 7 ? 'bg-red-100 text-red-700' : 
                            daysLeft <= 14 ? 'bg-orange-100 text-orange-700' : 
                            'bg-green-100 text-green-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{daysLeft} days left</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            Due {format(new Date(inc.due_date), 'MMM d, yyyy')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grades Accordion - Modern Cards */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((year) => {
          const hasGrades = Object.values(organizedGrades[year]).some(sem => sem.length > 0);
          if (!hasGrades && (filterYear || filterSemester || searchTerm)) return null;

          return (
            <div key={year} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleYear(year)}
                className={`w-full flex items-center justify-between p-5 transition-colors ${
                  expandedYears[year] ? 'bg-primary-50' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                    expandedYears[year] ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-700'
                  }`}>
                    {year}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-gray-900 text-lg">{year}{getYearSuffix(year)} Year</span>
                    <p className="text-sm text-gray-500">
                      {Object.values(organizedGrades[year]).flat().length} subjects
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  expandedYears[year] ? 'bg-primary-500 text-white rotate-180' : 'bg-gray-100 text-gray-500'
                }`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              {expandedYears[year] && (
                <div className="p-5 pt-0 space-y-4">
                  {['1st', '2nd', 'summer'].map((semester) => {
                    const semGrades = organizedGrades[year][semester];
                    if (semGrades.length === 0) return null;

                    const semKey = `${year}-${semester}`;
                    const isExpanded = expandedSemesters[semKey] !== false;

                    return (
                      <div key={semester} className="bg-gray-50 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleSemester(semKey)}
                          className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <FileText className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="font-semibold text-gray-800">{semester} Semester</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                              {semGrades.length} subjects
                            </span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isExpanded ? 'bg-primary-500 text-white rotate-180' : 'bg-white text-gray-500 shadow-sm'
                            }`}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="divide-y divide-gray-200">
                            {semGrades.map((grade) => (
                              <div
                                key={grade._id}
                                className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-white transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                      grade.status === 'Passed' ? 'bg-emerald-100' :
                                      grade.status === 'Failed' ? 'bg-red-100' :
                                      grade.status === 'INC' ? 'bg-orange-100' : 'bg-blue-100'
                                    }`}>
                                      {grade.status === 'Passed' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                                       grade.status === 'Failed' ? <XCircle className="w-5 h-5 text-red-600" /> :
                                       grade.status === 'INC' ? <AlertCircle className="w-5 h-5 text-orange-600" /> :
                                       <BookOpen className="w-5 h-5 text-blue-600" />}
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900">
                                        {grade.subject_code} - {grade.subject_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Uploaded {format(new Date(grade.date_uploaded), 'MMM d, yyyy')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getGradeColor(grade.grade, grade.status)}`}>
                                    {typeof grade.grade === 'number' ? grade.grade.toFixed(2) : grade.grade}
                                  </span>
                                  {getStatusBadge(grade.status)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {Object.values(organizedGrades[year]).every(sem => sem.length === 0) && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No grades recorded for this year</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredGrades.length === 0 && !loading && (
        <div className="card p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No grades found matching your filters</p>
        </div>
      )}
    </div>
  );
};

const getYearSuffix = (year) => {
  if (year === 1) return 'st';
  if (year === 2) return 'nd';
  if (year === 3) return 'rd';
  return 'th';
};

export default StudentDashboard;
