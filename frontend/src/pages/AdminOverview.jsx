import { useState, useEffect } from 'react';
import { useReports, useAdmin, useINC, useGrades, useStudents } from '../hooks/useApi';
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
  XCircle,
  History,
  FileDown,
  FileText,
  BarChart3,
  Download,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { format, differenceInDays, isWithinInterval, addDays } from 'date-fns';

const AdminOverview = () => {
  const { getSectionSummary, getINCList, getOverdueINC } = useReports();
  const { processOverdue } = useAdmin();
  const { getAllINC } = useINC();
  const { getAllGrades } = useGrades();
  const { getAllStudents } = useStudents();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGrades: 0,
    activeINC: 0,
    overdueINC: 0,
    completedINC: 0,
    passedGrades: 0,
    failedGrades: 0,
    incGrades: 0
  });
  const [recentGrades, setRecentGrades] = useState([]);
  const [criticalINCs, setCriticalINCs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOverdue, setProcessingOverdue] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showAutoFailModal, setShowAutoFailModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateReport = async (type) => {
    setGeneratingReport(true);
    try {
      let data = [];
      let filename = '';
      
      switch (type) {
        case 'inc':
          const incRes = await getAllINC();
          data = incRes.data || [];
          filename = 'INC_Summary_Report.csv';
          break;
        case 'grades':
          const gradesRes = await getAllGrades();
          data = gradesRes.data || [];
          filename = 'Grade_Report.csv';
          break;
        case 'students':
          const studentsRes = await getAllStudents();
          data = studentsRes.data || [];
          filename = 'Student_List.csv';
          break;
        default:
          break;
      }
      
      // Convert to CSV and download
      if (data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        alert(`${filename} downloaded successfully!`);
      } else {
        alert('No data available for report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, incRes, overdueRes, gradesRes, studentsRes] = await Promise.all([
        getSectionSummary(),
        getAllINC({ completed: false, auto_failed: false }),
        getOverdueINC(),
        getAllGrades(),
        getAllStudents()
      ]);

      const students = summaryRes.data || [];
      const totalGrades = students.reduce((sum, s) => sum + parseInt(s.total_subjects || 0), 0);
      
      // Calculate grade distribution
      const grades = gradesRes.data || [];
      const passedCount = grades.filter(g => g.status === 'Passed').length;
      const failedCount = grades.filter(g => g.status === 'Failed').length;
      const incCount = grades.filter(g => g.status === 'INC').length;
      
      // Get critical INCs (due within 7 days but not overdue)
      const allIncRecords = incRes.data || [];
      const now = new Date();
      const critical = allIncRecords.filter(inc => {
        const dueDate = new Date(inc.due_date);
        const daysLeft = differenceInDays(dueDate, now);
        return daysLeft > 0 && daysLeft <= 7 && !inc.completed && !inc.auto_failed;
      }).slice(0, 5);
      
      // Generate activities
      const mockActivities = [
        { type: 'grade_upload', message: 'Batch grades uploaded', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), icon: Upload, color: 'blue' },
        { type: 'inc_completed', message: '3 INC records marked as completed', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), icon: CheckCircle, color: 'green' },
        { type: 'new_student', message: '5 new students registered', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), icon: Users, color: 'purple' },
        { type: 'auto_fail', message: '1 overdue INC auto-failed', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), icon: AlertCircle, color: 'red' }
      ];
      
      setStats({
        totalStudents: students.length,
        totalGrades,
        activeINC: incRes.pagination?.total || 0,
        overdueINC: overdueRes.count || 0,
        completedINC: grades.filter(g => g.status === 'Completed').length,
        passedGrades: passedCount,
        failedGrades: failedCount,
        incGrades: incCount
      });
      
      setRecentGrades(grades.slice(0, 5));
      setCriticalINCs(critical);
      setActivities(mockActivities);
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

  const handleConfirmAutoFail = async () => {
    setShowAutoFailModal(false);
    setProcessingOverdue(true);
    try {
      const result = await processOverdue();
      alert(`Successfully marked ${result.auto_failed_count} overdue INC records as Failed (5.0)`);
      fetchDashboardData();
    } catch (error) {
      alert('Error processing overdue INC records');
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
              <span className={`text-sm font-medium ${stats.overdueINC > 0 ? 'text-red-100' : 'text-gray-500'}`}>Failed to Comply</span>
            </div>
            <p className={`text-3xl font-bold ${stats.overdueINC > 0 ? 'text-white' : 'text-gray-900'}`}>{stats.overdueINC}</p>
            <p className={`text-xs mt-1 ${stats.overdueINC > 0 ? 'text-red-100' : 'text-gray-400'}`}>Auto-marked as failed</p>
            {stats.overdueINC > 0 && (
              <button
                onClick={() => setShowAutoFailModal(true)}
                disabled={processingOverdue}
                className="mt-2 w-full px-3 py-2 bg-white text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
              >
                {processingOverdue ? 'Processing...' : 'Run Auto-Fail'}
              </button>
            )}
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

      {/* Analytics & Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            Grade Distribution
          </h2>
          <div className="space-y-4">
            {/* Passed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-gray-600">Passed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${stats.totalGrades > 0 ? (stats.passedGrades / stats.totalGrades) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-8">{stats.passedGrades}</span>
              </div>
            </div>
            {/* Failed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${stats.totalGrades > 0 ? (stats.failedGrades / stats.totalGrades) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-8">{stats.failedGrades}</span>
              </div>
            </div>
            {/* INC */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-600">INC</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${stats.totalGrades > 0 ? (stats.incGrades / stats.totalGrades) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-8">{stats.incGrades}</span>
              </div>
            </div>
            {/* Completed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${stats.totalGrades > 0 ? (stats.completedINC / stats.totalGrades) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-8">{stats.completedINC}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">Total Records: {stats.totalGrades}</p>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <History className="w-4 h-4 text-purple-600" />
            </div>
            Recent Activity
          </h2>
          <div className="space-y-4">
            {activities.length > 0 ? activities.map((activity, index) => {
              const Icon = activity.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-emerald-100 text-emerald-600',
                purple: 'bg-purple-100 text-purple-600',
                red: 'bg-red-100 text-red-600',
                orange: 'bg-orange-100 text-orange-600'
              };
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color] || colorClasses.blue}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Critical INCs Section */}
      {criticalINCs.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 shadow-lg border border-orange-200">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            Critical INCs (Due Within 7 Days)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalINCs.map((inc, index) => {
              const daysLeft = differenceInDays(new Date(inc.due_date), new Date());
              return (
                <div key={inc._id || index} className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{inc.full_name}</p>
                      <p className="text-sm text-gray-600">{inc.subject_code}</p>
                      <p className="text-xs text-gray-500">{inc.student_id}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      daysLeft <= 2 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {daysLeft} days left
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Due: {format(new Date(inc.due_date), 'MMM d, yyyy')}
                    </span>
                    <a 
                      href="/admin/inc" 
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      Manage <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Auto-Fail Confirmation Modal */}
      {showAutoFailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Confirm Auto-Fail</h3>
                  <p className="text-red-100 text-sm">Action cannot be undone</p>
                </div>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-6">
              <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-100">
                <p className="text-gray-700 text-sm leading-relaxed">
                  You are about to mark <strong className="text-red-600">{stats.overdueINC} overdue INC record(s)</strong> as <strong>Failed (5.0)</strong>.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  These students have not complied within the 3-month deadline and will receive a failing grade.
                </p>
              </div>
              
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>This action is permanent. You can still override individual grades later if needed.</span>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowAutoFailModal(false)}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAutoFail}
                disabled={processingOverdue}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
              >
                {processingOverdue ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Yes, Mark as Failed'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOverview;
