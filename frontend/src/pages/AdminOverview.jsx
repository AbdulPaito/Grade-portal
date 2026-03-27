import { useState, useEffect } from 'react';
import { useReports, useAdmin } from '../hooks/useApi';
import { 
  Users, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Upload,
  Clock,
  GraduationCap,
  Info,
  Award,
  LayoutDashboard,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const AdminOverview = () => {
  const { getSectionSummary, getINCList, getOverdueINC } = useReports();
  const { processOverdue } = useAdmin();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGrades: 0,
    activeINC: 0,
    overdueINC: 0,
    completedINC: 0
  });
  const [recentGrades, setRecentGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOverdue, setProcessingOverdue] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, incRes, overdueRes] = await Promise.all([
        getSectionSummary(),
        getINCList(),
        getOverdueINC()
      ]);

      const students = summaryRes.data || [];
      const totalGrades = students.reduce((sum, s) => sum + parseInt(s.total_subjects || 0), 0);
      
      setStats({
        totalStudents: students.length,
        totalGrades,
        activeINC: incRes.pagination?.total || 0,
        overdueINC: overdueRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOverdue = async () => {
    setProcessingOverdue(true);
    try {
      const result = await processOverdue();
      alert(`Processed ${result.auto_failed_count} overdue INC records`);
      fetchDashboardData();
    } catch (error) {
      alert('Error processing overdue INC');
    } finally {
      setProcessingOverdue(false);
    }
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
      {/* Hero Section - Clean without logos */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>
        <div className="relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <p className="text-primary-100">Manage grades, students, and monitor INC records</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Modern Cards like Student Portal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students - Blue Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-medium">Total Students</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalStudents}</p>
            <p className="text-blue-100 text-xs mt-1">Enrolled</p>
          </div>
        </div>

        {/* Total Grades - Green */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Total Grades</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalGrades}</p>
            <p className="text-gray-400 text-xs mt-1">Records</p>
          </div>
        </div>

        {/* Active INC - Orange Gradient */}
        <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg border transition-all duration-300 ${stats.activeINC > 0 ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : 'bg-white border-gray-100 hover:shadow-xl'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 ${stats.activeINC > 0 ? 'bg-white/10' : 'bg-orange-50'}`}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.activeINC > 0 ? 'bg-white/20' : 'bg-orange-100'}`}>
                <Clock className={`w-5 h-5 ${stats.activeINC > 0 ? 'text-white' : 'text-orange-600'}`} />
              </div>
              <span className={`text-sm font-medium ${stats.activeINC > 0 ? 'text-orange-100' : 'text-gray-500'}`}>Active INC</span>
            </div>
            <p className={`text-3xl font-bold ${stats.activeINC > 0 ? 'text-white' : 'text-gray-900'}`}>{stats.activeINC}</p>
            <p className={`text-xs mt-1 ${stats.activeINC > 0 ? 'text-orange-100' : 'text-gray-400'}`}>Incomplete</p>
          </div>
        </div>

        {/* Overdue INC - Red Gradient */}
        <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg border transition-all duration-300 ${stats.overdueINC > 0 ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-white border-gray-100 hover:shadow-xl'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 ${stats.overdueINC > 0 ? 'bg-white/10' : 'bg-red-50'}`}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.overdueINC > 0 ? 'bg-white/20' : 'bg-red-100'}`}>
                <AlertCircle className={`w-5 h-5 ${stats.overdueINC > 0 ? 'text-white' : 'text-red-600'}`} />
              </div>
              <span className={`text-sm font-medium ${stats.overdueINC > 0 ? 'text-red-100' : 'text-gray-500'}`}>Overdue INC</span>
            </div>
            <p className={`text-3xl font-bold ${stats.overdueINC > 0 ? 'text-white' : 'text-gray-900'}`}>{stats.overdueINC}</p>
            <p className={`text-xs mt-1 ${stats.overdueINC > 0 ? 'text-red-100' : 'text-gray-400'}`}>Needs action</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Modern Cards */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-primary-600" />
          </div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/admin/students" className="relative overflow-hidden group">
            <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Manage Students</p>
                <p className="text-sm text-gray-600">Add, edit, or remove students</p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          <a href="/admin/grades" className="relative overflow-hidden group">
            <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-lg">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Upload className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">Upload Grades</p>
                <p className="text-sm text-gray-600">Batch upload via CSV/Excel</p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          <a href="/admin/inc" className="relative overflow-hidden group">
            <div className={`flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 hover:shadow-lg ${stats.overdueINC > 0 ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 hover:border-orange-500' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:border-orange-400'}`}>
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <AlertCircle className={`w-7 h-7 ${stats.overdueINC > 0 ? 'text-red-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-orange-700 transition-colors">Manage INC</p>
                <p className="text-sm text-gray-600">
                  {stats.overdueINC > 0 ? (
                    <span className="text-red-600 font-semibold">{stats.overdueINC} overdue records</span>
                  ) : (
                    'Track incomplete grades'
                  )}
                </p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                <svg className={`w-6 h-6 ${stats.overdueINC > 0 ? 'text-red-500' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Auto-Fail Action */}
      {stats.overdueINC > 0 && (
        <div className="card p-6 bg-red-50 border border-red-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Overdue INC Records Detected</h3>
                <p className="text-sm text-red-700 mt-1">
                  There are {stats.overdueINC} INC records that have passed their due date.
                  Run the auto-fail process to mark them as Failed.
                </p>
              </div>
            </div>
            <button
              onClick={handleProcessOverdue}
              disabled={processingOverdue}
              className="btn-danger whitespace-nowrap"
            >
              {processingOverdue ? 'Processing...' : 'Run Auto-Fail'}
            </button>
          </div>
        </div>
      )}

      {/* System Information - Modern Design */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Info className="w-4 h-4 text-purple-600" />
          </div>
          System Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSV Format */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-gray-500" />
              CSV Upload Format
            </h3>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <code className="text-xs font-mono text-gray-700 block">
                student_id,full_name,subject_code,subject_name,grade,year,semester,section
              </code>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Use <span className="font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs">"INC"</span> as grade value for incomplete grades. They will be automatically tracked.
            </p>
          </div>

          {/* Grade Scale */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-gray-500" />
              Grade Scale
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">1.0 - 3.0</p>
                  <p className="text-xs text-gray-500">Passed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">3.1 - 5.0</p>
                  <p className="text-xs text-gray-500">Failed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">INC</p>
                  <p className="text-xs text-gray-500">Incomplete (tracked)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
