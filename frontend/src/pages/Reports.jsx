import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, 
  Users, 
  AlertCircle,
  Download,
  ChevronRight,
  BarChart3,
  TrendingUp,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  History,
  Layers,
  UserCircle,
  Award,
  AlertTriangle,
  Printer,
  ArrowLeft,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  Eye,
  FileDown,
  Printer as PrinterIcon,
  ChevronDown,
  Sparkles,
  Lightbulb,
  TrendingDown,
  Medal,
  CalendarDays,
  Timer
} from 'lucide-react';
import { useINC, useGrades, useStudents } from '../hooks/useApi';
import { format, differenceInDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';

const Reports = () => {
  const { getAllINC } = useINC();
  const { getAllGrades } = useGrades();
  const { getAllStudents } = useStudents();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState({
    students: [],
    grades: [],
    incRecords: []
  });
  
  // Global Filters
  const [filters, setFilters] = useState({
    year: '',
    semester: '',
    section: '',
    subject: '',
    status: ''
  });
  
  // Search for Student History
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Date Range Filters
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Compare Mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareFilters, setCompareFilters] = useState({
    year: '',
    semester: ''
  });
  
  // Insights
  const [showInsights, setShowInsights] = useState(true);
  
  // Export Confirmation Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    filename: '',
    data: null
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [studentsRes, gradesRes, incRes] = await Promise.all([
        getAllStudents(),
        getAllGrades(),
        getAllINC()
      ]);

      setData({
        students: studentsRes.data || [],
        grades: gradesRes.data || [],
        incRecords: incRes.data || []
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Apply global filters
  const applyFilters = (items, type) => {
    return items.filter(item => {
      // Year filter
      if (filters.year && item.year_level?.toString() !== filters.year) return false;
      
      // Semester filter - case insensitive
      if (filters.semester) {
        const itemSem = item.semester?.toLowerCase();
        const filterSem = filters.semester.toLowerCase();
        // Handle variations like "1st", "1st Semester", "summer", "Summer"
        if (!itemSem || !itemSem.includes(filterSem.replace(' semester', ''))) return false;
      }
      
      // Section filter
      if (filters.section && item.section !== filters.section) return false;
      
      // Subject filter
      if (filters.subject && item.subject_code !== filters.subject) return false;
      
      // Status filter
      if (filters.status && item.status !== filters.status) return false;
      
      return true;
    });
  };

  // 1. SUMMARY OVERVIEW DATA
  const getSummaryStats = () => {
    const filteredGrades = applyFilters(data.grades, 'grades');
    const filteredINC = applyFilters(data.incRecords, 'inc');
    const now = new Date();
    
    const totalStudents = [...new Set(filteredGrades.map(g => g.student_id))].length;
    const totalSubjects = [...new Set(filteredGrades.map(g => g.subject_code))].length;
    const passed = filteredGrades.filter(g => g.status === 'Passed').length;
    const failed = filteredGrades.filter(g => g.status === 'Failed').length;
    const inc = filteredGrades.filter(g => g.status === 'INC').length;
    const overdueINC = filteredINC.filter(inc => {
      const dueDate = new Date(inc.due_date);
      return !inc.completed && dueDate < now;
    }).length;
    
    // Calculate average GPA (passed grades only)
    const passedGrades = filteredGrades.filter(g => g.status === 'Passed');
    const avgGPA = passedGrades.length > 0 
      ? (passedGrades.reduce((sum, g) => sum + parseFloat(g.grade), 0) / passedGrades.length).toFixed(2)
      : '0.00';
    
    return { totalStudents, totalSubjects, avgGPA, passed, failed, inc, overdueINC, totalGrades: filteredGrades.length };
  };

  // 2. SECTION PERFORMANCE DATA
  const getSectionPerformance = () => {
    const sections = [...new Set(data.students.map(s => s.section))].filter(Boolean);
    const filteredGrades = applyFilters(data.grades, 'grades');
    
    return sections.map(section => {
      const sectionStudents = data.students.filter(s => s.section === section);
      const sectionGrades = filteredGrades.filter(g => sectionStudents.some(s => s.student_id === g.student_id));
      const passed = sectionGrades.filter(g => g.status === 'Passed').length;
      const failed = sectionGrades.filter(g => g.status === 'Failed').length;
      const inc = sectionGrades.filter(g => g.status === 'INC').length;
      const avgGPA = sectionGrades.filter(g => g.status === 'Passed').length > 0
        ? (sectionGrades.filter(g => g.status === 'Passed').reduce((sum, g) => sum + parseFloat(g.grade), 0) / sectionGrades.filter(g => g.status === 'Passed').length).toFixed(2)
        : '0.00';
      
      return { section, totalStudents: sectionStudents.length, avgGPA, passed, failed, inc };
    });
  };

  // 3. INC REPORT DATA
  const getINCReport = () => {
    const now = new Date();
    const filteredINC = applyFilters(data.incRecords, 'inc');
    
    return filteredINC.map(inc => {
      const dueDate = new Date(inc.due_date);
      const isOverdue = !inc.completed && dueDate < now;
      const daysOverdue = isOverdue ? differenceInDays(now, dueDate) : 0;
      
      let status = 'Active';
      if (inc.completed) status = 'Completed';
      else if (inc.auto_failed) status = 'Failed';
      else if (isOverdue) status = 'Overdue';
      
      return {
        studentId: inc.student_id,
        studentName: inc.full_name,
        subjectCode: inc.subject_code,
        subjectName: inc.subject_name,
        year: inc.year_level,
        semester: inc.semester,
        incDate: format(new Date(inc.inc_date || inc.created_at), 'MMM d, yyyy'),
        dueDate: format(dueDate, 'MMM d, yyyy'),
        status,
        daysOverdue
      };
    });
  };

  // 4. OVERDUE INC REPORT DATA
  const getOverdueINCReport = () => {
    const now = new Date();
    const filteredINC = applyFilters(data.incRecords, 'inc');
    
    return filteredINC
      .filter(inc => {
        const dueDate = new Date(inc.due_date);
        return !inc.completed && !inc.auto_failed && dueDate < now;
      })
      .map(inc => ({
        studentId: inc.student_id,
        studentName: inc.full_name,
        subjectCode: inc.subject_code,
        subjectName: inc.subject_name,
        dueDate: format(new Date(inc.due_date), 'MMM d, yyyy'),
        daysOverdue: differenceInDays(now, new Date(inc.due_date))
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  };

  // 5. FAILED STUDENTS REPORT DATA
  const getFailedStudentsReport = () => {
    const filteredGrades = applyFilters(data.grades, 'grades');
    const failedGrades = filteredGrades.filter(g => g.status === 'Failed');
    
    return failedGrades.map(g => ({
      studentId: g.student_id,
      studentName: g.full_name,
      subjectCode: g.subject_code,
      subjectName: g.subject_name,
      grade: g.grade,
      year: g.year_level,
      semester: g.semester
    }));
  };

  // 6. GRADE DISTRIBUTION DATA
  const getGradeDistribution = () => {
    const filteredGrades = applyFilters(data.grades, 'grades');
    const distribution = {};
    
    filteredGrades.forEach(g => {
      const grade = g.status === 'INC' ? 'INC' : parseFloat(g.grade).toFixed(2);
      distribution[grade] = (distribution[grade] || 0) + 1;
    });
    
    return distribution;
  };

  // 7. STUDENT ACADEMIC HISTORY
  const getStudentHistory = (studentId) => {
    const student = data.students.find(s => s.student_id === studentId);
    if (!student) return null;
    
    const studentGrades = data.grades.filter(g => g.student_id === studentId);
    const studentINC = data.incRecords.filter(inc => inc.student_id === studentId);
    
    // Group by year and semester
    const history = {};
    studentGrades.forEach(g => {
      const key = `Year ${g.year_level} - ${g.semester}`;
      if (!history[key]) history[key] = { grades: [], inc: [] };
      history[key].grades.push(g);
    });
    
    studentINC.forEach(inc => {
      const key = `Year ${inc.year_level} - ${inc.semester}`;
      if (!history[key]) history[key] = { grades: [], inc: [] };
      history[key].inc.push(inc);
    });
    
    // Calculate overall GPA
    const passedGrades = studentGrades.filter(g => g.status === 'Passed');
    const overallGPA = passedGrades.length > 0
      ? (passedGrades.reduce((sum, g) => sum + parseFloat(g.grade), 0) / passedGrades.length).toFixed(2)
      : 'N/A';
    
    return { student, history, overallGPA, totalSubjects: studentGrades.length };
  };

  // 8. SUBJECT PERFORMANCE DATA
  const getSubjectPerformance = () => {
    const subjects = [...new Set(data.grades.map(g => g.subject_code))].filter(Boolean);
    const filteredGrades = applyFilters(data.grades, 'grades');
    
    return subjects.map(subject => {
      const subjectGrades = filteredGrades.filter(g => g.subject_code === subject);
      const subjectInfo = data.grades.find(g => g.subject_code === subject);
      const failed = subjectGrades.filter(g => g.status === 'Failed').length;
      const inc = subjectGrades.filter(g => g.status === 'INC').length;
      const avgGrade = subjectGrades.filter(g => g.status === 'Passed').length > 0
        ? (subjectGrades.filter(g => g.status === 'Passed').reduce((sum, g) => sum + parseFloat(g.grade), 0) / subjectGrades.filter(g => g.status === 'Passed').length).toFixed(2)
        : 'N/A';
      
      return {
        subjectCode: subject,
        subjectName: subjectInfo?.subject_name || subject,
        totalStudents: subjectGrades.length,
        avgGrade,
        failed,
        inc
      };
    });
  };

  // Export Functions
  const exportToCSV = (reportData, filename) => {
    setExportConfig({
      filename,
      data: reportData
    });
    setShowExportModal(true);
  };
  
  const confirmExport = () => {
    setExporting(true);
    try {
      const { data, filename } = exportConfig;
      let csv = '';
      
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
        csv = `${headers}\n${rows}`;
      }
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report');
    } finally {
      setExporting(false);
    }
  };

  // PDF Export Function
  const exportToPDF = async () => {
    try {
      setExporting(true);
      const element = reportRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Grade_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      alert('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error exporting PDF');
    } finally {
      setExporting(false);
    }
  };

  // Print Function
  const handlePrint = () => {
    window.print();
  };

  // Get Data Insights
  const getInsights = () => {
    const insights = [];
    const filteredGrades = applyFilters(data.grades, 'grades');
    const filteredINC = applyFilters(data.incRecords, 'inc');
    
    // Pass rate insight
    const passRate = summary.totalGrades > 0 ? (summary.passed / summary.totalGrades * 100).toFixed(1) : 0;
    if (passRate < 70) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Low Pass Rate',
        message: `Pass rate is ${passRate}%. Consider reviewing teaching methods or student support.`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      });
    } else if (passRate > 90) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Excellent Pass Rate',
        message: `Pass rate is ${passRate}%. Great job! Students are performing well.`,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    }
    
    // INC insights
    if (summary.overdueINC > 0) {
      insights.push({
        type: 'critical',
        icon: AlertCircle,
        title: 'Overdue INC Records',
        message: `${summary.overdueINC} students have overdue incomplete grades. Immediate action required.`,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      });
    }
    
    // Failed students insight
    if (summary.failed > 5) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'High Failure Rate',
        message: `${summary.failed} students failed. Consider offering remedial classes.`,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      });
    }
    
    // GPA insight
    if (summary.avgGPA && parseFloat(summary.avgGPA) > 2.0) {
      insights.push({
        type: 'info',
        icon: Medal,
        title: 'Academic Performance',
        message: `Average GPA is ${summary.avgGPA}. Monitor students with grades below 2.0.`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      });
    }
    
    return insights;
  };
  const getUniqueValues = (field) => [...new Set(data[field].map(item => item[field === 'students' ? 'year_level' : field === 'incRecords' ? 'year_level' : 'year_level']).filter(Boolean))];
  const sections = [...new Set(data.students.map(s => s.section).filter(Boolean))];
  const subjects = [...new Set(data.grades.map(g => g.subject_code).filter(Boolean))];

  const handleDownloadReport = async (type) => {
    setGenerating(true);
    try {
      let csvContent = '';
      let filename = '';

      switch (type) {
        case 'students':
          filename = `Students_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          csvContent = 'Student ID,Full Name,Course,Section,Year Level\n';
          data.students.forEach(s => {
            csvContent += `${s.student_id},${s.full_name},${s.course},${s.section},${s.year_level}\n`;
          });
          break;
        case 'grades':
          filename = `Grades_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          csvContent = 'Student ID,Subject Code,Subject Name,Grade,Status,Semester\n';
          data.grades.forEach(g => {
            csvContent += `${g.student_id},${g.subject_code},${g.subject_name},${g.grade},${g.status},${g.semester}\n`;
          });
          break;
        case 'inc':
          filename = `INC_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          csvContent = 'Student ID,Full Name,Subject Code,Due Date,Status\n';
          data.incRecords.forEach(inc => {
            const status = inc.completed ? 'Completed' : inc.auto_failed ? 'Failed' : 'Active';
            csvContent += `${inc.student_id},${inc.full_name},${inc.subject_code},${format(new Date(inc.due_date), 'MMM d, yyyy')},${status}\n`;
          });
          break;
        default:
          break;
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`${filename} downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const summary = getSummaryStats();

  return (
    <div className="space-y-6 print:p-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          </div>
          <p className="text-primary-100 text-center">Complete overview of your grade portal data</p>
        </div>
      </div>

      {/* Global Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Global Filters</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Applies to all reports</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({...filters, year: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              value={filters.semester}
              onChange={(e) => setFilters({...filters, semester: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Semesters</option>
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={filters.section}
              onChange={(e) => setFilters({...filters, section: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Sections</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({...filters, subject: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="INC">INC</option>
            </select>
          </div>
          
          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-gray-100">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'section', label: 'Section Performance', icon: Layers },
          { id: 'inc', label: 'INC Report', icon: AlertCircle },
          { id: 'overdue', label: 'Overdue INC', icon: AlertTriangle },
          { id: 'failed', label: 'Failed Students', icon: XCircle },
          { id: 'distribution', label: 'Grade Distribution', icon: TrendingUp },
          { id: 'history', label: 'Student History', icon: UserCircle },
          { id: 'subject', label: 'Subject Performance', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. SUMMARY OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: Main Stats + Export Button */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-blue-100 text-sm">Total Students</span>
              </div>
              <p className="text-3xl font-bold">{summary.totalStudents}</p>
              <div className="mt-3 h-1 bg-blue-400 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-green-100 text-sm">Total Passed</span>
              </div>
              <p className="text-3xl font-bold">{summary.passed}</p>
              <div className="mt-3 h-1 bg-green-400 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: summary.totalGrades > 0 ? `${(summary.passed/summary.totalGrades)*100}%` : '0%' }} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="text-red-100 text-sm">Total Failed</span>
              </div>
              <p className="text-3xl font-bold">{summary.failed}</p>
              <div className="mt-3 h-1 bg-red-400 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: summary.totalGrades > 0 ? `${(summary.failed/summary.totalGrades)*100}%` : '0%' }} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-orange-100 text-sm">Total INC</span>
              </div>
              <p className="text-3xl font-bold">{summary.inc}</p>
              <div className="mt-3 h-1 bg-orange-400 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: summary.totalGrades > 0 ? `${(summary.inc/summary.totalGrades)*100}%` : '0%' }} />
              </div>
            </div>
            
            {/* Export Button */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 flex flex-col justify-center items-center hover:shadow-lg transition-shadow">
              <button
                onClick={() => exportToCSV([summary], 'Summary_Report.csv')}
                disabled={exporting}
                className="w-full h-full px-3 py-2 bg-primary-50 text-primary-700 rounded-xl text-xs font-medium hover:bg-primary-100 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <Download className="w-6 h-6" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
          
          {/* Row 2: Secondary Stats + Data Insights */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <span className="text-gray-500 text-sm">Total Subjects</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalSubjects}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span className="text-gray-500 text-sm">Average GPA</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.avgGPA}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-gray-500 text-sm">Overdue INC</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.overdueINC}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span className="text-gray-500 text-sm">Total Grades</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalGrades}</p>
            </div>
            
            {/* Data Insights - Only in Overview */}
            {showInsights && getInsights().length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Insights</h3>
                  <button
                    onClick={() => setShowInsights(false)}
                    className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {getInsights().slice(0, 2).map((insight, idx) => (
                    <div key={idx} className={`p-2 ${insight.bgColor} rounded-lg border border-gray-100`}>
                      <div className="flex items-start gap-2">
                        <insight.icon className={`w-4 h-4 ${insight.color} mt-0.5 flex-shrink-0`} />
                        <div>
                          <h4 className={`font-semibold text-xs ${insight.color}`}>{insight.title}</h4>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Distribution Pie Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary-600" />
                Grade Status Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Passed', value: summary.passed, color: '#22c55e' },
                        { name: 'Failed', value: summary.failed, color: '#ef4444' },
                        { name: 'INC', value: summary.inc, color: '#f97316' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#f97316" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Trend Bar Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Academic Performance Summary
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Passed', value: summary.passed, fill: '#22c55e' },
                    { name: 'Failed', value: summary.failed, fill: '#ef4444' },
                    { name: 'INC', value: summary.inc, fill: '#f97316' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION PERFORMANCE */}
      {activeTab === 'section' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-600" />
              Section Performance Report
            </h2>
            <button
              onClick={() => exportToCSV(getSectionPerformance(), 'Section_Performance.csv')}
              disabled={exporting}
              className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Section</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total Students</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Average GPA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Passed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Failed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">INC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getSectionPerformance().map((section, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{section.section}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{section.totalStudents}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{section.avgGPA}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">{section.passed}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">{section.failed}</td>
                    <td className="px-4 py-3 text-sm text-orange-600 font-medium">{section.inc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. INC REPORT */}
      {activeTab === 'inc' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              INC Report (All Incomplete Grades)
            </h2>
            <button
              onClick={() => exportToCSV(getINCReport(), 'INC_Report.csv')}
              disabled={exporting}
              className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Semester</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">INC Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getINCReport().map((inc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{inc.studentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{inc.studentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="font-medium">{inc.subjectCode}</div>
                      <div className="text-xs text-gray-400">{inc.subjectName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inc.year}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inc.semester}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inc.incDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inc.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${
                        inc.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        inc.status === 'Failed' ? 'bg-red-100 text-red-700' :
                        inc.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. OVERDUE INC REPORT */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Overdue INC Report (Critical 🔥)
            </h2>
            <button
              onClick={() => exportToCSV(getOverdueINCReport(), 'Overdue_INC_Report.csv')}
              disabled={exporting}
              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-red-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getOverdueINCReport().map((inc, idx) => (
                  <tr key={idx} className="hover:bg-red-50/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{inc.studentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{inc.studentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="font-medium">{inc.subjectCode}</div>
                      <div className="text-xs text-gray-400">{inc.subjectName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inc.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                        {inc.daysOverdue} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. FAILED STUDENTS REPORT */}
      {activeTab === 'failed' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Failed Students Report
            </h2>
            <button
              onClick={() => exportToCSV(getFailedStudentsReport(), 'Failed_Students_Report.csv')}
              disabled={exporting}
              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-red-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getFailedStudentsReport().map((student, idx) => (
                  <tr key={idx} className="hover:bg-red-50/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.studentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.studentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="font-medium">{student.subjectCode}</div>
                      <div className="text-xs text-gray-400">{student.subjectName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-bold">
                        {student.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.year}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. GRADE DISTRIBUTION */}
      {activeTab === 'distribution' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Grade Distribution Report
            </h2>
            <button
              onClick={() => exportToCSV(Object.entries(getGradeDistribution()).map(([grade, count]) => ({ Grade: grade, Count: count })), 'Grade_Distribution.csv')}
              disabled={exporting}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          
          {/* Grade Distribution Chart */}
          <div className="mb-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={Object.entries(getGradeDistribution())
                  .sort((a, b) => {
                    const order = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '5.00', 'INC'];
                    return order.indexOf(a[0]) - order.indexOf(b[0]);
                  })
                  .map(([grade, count]) => ({ 
                    grade: grade === 'INC' ? 'INC' : grade, 
                    count,
                    fill: grade === '5.00' ? '#ef4444' : grade === 'INC' ? '#f97316' : '#22c55e'
                  }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(getGradeDistribution())
              .sort((a, b) => {
                const order = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '5.00', 'INC'];
                return order.indexOf(a[0]) - order.indexOf(b[0]);
              })
              .map(([grade, count]) => (
              <div key={grade} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                <div className="text-sm text-gray-600">{grade === 'INC' ? 'INC' : `Grade ${grade}`}</div>
                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${grade === '5.00' ? 'bg-red-500' : grade === 'INC' ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: summary.totalGrades > 0 ? `${(count/summary.totalGrades)*100}%` : '0%' }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {summary.totalGrades > 0 ? ((count/summary.totalGrades)*100).toFixed(1) : '0'}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. STUDENT ACADEMIC HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-purple-600" />
            Student Academic History
          </h2>
          
          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Student ID or Name..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Search Results */}
          {studentSearch && !selectedStudent && (
            <div className="mb-4 bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
              {data.students
                .filter(s => 
                  s.student_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
                )
                .map(student => (
                  <button
                    key={student.student_id}
                    onClick={() => setSelectedStudent(student.student_id)}
                    className="w-full text-left px-4 py-2 hover:bg-white rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium">{student.full_name}</span>
                      <span className="text-sm text-gray-500 ml-2">({student.student_id})</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
            </div>
          )}
          
          {/* Student History Details */}
          {selectedStudent && (
            <div>
              <button
                onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                className="mb-4 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Search
              </button>
              
              {(() => {
                const history = getStudentHistory(selectedStudent);
                if (!history) return <p>No data found</p>;
                
                return (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                      <h3 className="font-bold text-lg text-gray-900">{history.student.full_name}</h3>
                      <p className="text-sm text-gray-600">ID: {history.student.student_id}</p>
                      <div className="flex gap-4 mt-3">
                        <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                          <span className="text-xs text-gray-500">Overall GPA</span>
                          <p className="font-bold text-purple-600">{history.overallGPA}</p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                          <span className="text-xs text-gray-500">Total Subjects</span>
                          <p className="font-bold text-blue-600">{history.totalSubjects}</p>
                        </div>
                      </div>
                    </div>
                    
                    {Object.entries(history.history).map(([semester, data]) => (
                      <div key={semester} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-700">{semester}</div>
                        <div className="p-4">
                          {data.grades.map((grade, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <div>
                                <span className="font-medium">{grade.subject_code}</span>
                                <span className="text-sm text-gray-500 ml-2">{grade.subject_name}</span>
                              </div>
                              <span className={`px-2 py-1 rounded-lg text-sm font-semibold ${
                                grade.status === 'Passed' ? 'bg-green-100 text-green-700' :
                                grade.status === 'Failed' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {grade.status === 'Passed' ? grade.grade : grade.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* 8. SUBJECT PERFORMANCE */}
      {activeTab === 'subject' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Subject Performance Report
            </h2>
            <button
              onClick={() => exportToCSV(getSubjectPerformance(), 'Subject_Performance.csv')}
              disabled={exporting}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-indigo-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700">Subject Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700">Subject Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700">Total Students</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700">Average Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700">Failed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-700">INC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getSubjectPerformance().map((subject, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject.subjectCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{subject.subjectName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{subject.totalStudents}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{subject.avgGrade}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">{subject.failed}</td>
                    <td className="px-4 py-3 text-sm text-orange-600 font-medium">{subject.inc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Export Confirmation Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                <FileDown className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Export Report</h3>
                <p className="text-sm text-gray-500">{exportConfig.filename}</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to export this report? The file will be downloaded as a CSV file.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExport}
                disabled={exporting}
                className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
