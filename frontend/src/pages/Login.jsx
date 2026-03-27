import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Lock, User, UserCog } from 'lucide-react';

/**
 * ==========================================
 * LOGIN PAGE
 * ==========================================
 * 
 * 📝 WHAT THIS PAGE DOES:
 * - Shows login form for students and admins
 * - Students login with ID only (no password needed!)
 * - Admins login with ID + password
 * 
 * 🔗 CONNECTS TO:
 * - AuthContext.jsx for login functions
 * - POST /api/auth/student-login (students)
 * - POST /api/auth/admin-login (admins)
 * 
 * 🧪 HOW TO TEST:
 * 
 * Student Login:
 * 1. Enter student ID: 2022007807 (or 2022-007807 with dash)
 * 2. Click "Sign In"
 * 3. System validates ID format and logs you in
 * 
 * Admin Login:
 * 1. Enter admin ID: admin
 * 2. Enter password: admin123
 * 3. Click "Sign In"
 */

const Login = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'admin'
  const [student_id, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get login functions from AuthContext
  const { studentLogin, adminLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      
      if (activeTab === 'student') {
        // Student login - ID only
        result = await studentLogin(student_id);
      } else {
        // Admin login - ID + password
        result = await adminLogin(student_id, password);
      }

      if (!result.success) {
        setError(result.message);
      }
      // If successful, AuthContext will update user state
      // and App.jsx will redirect to appropriate dashboard
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card p-8">
          <div className="text-center mb-8">
            {/* Logo - Clean without background */}
            <div className="flex items-center justify-center mb-6">
              {activeTab === 'student' ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-2xl scale-110"></div>
                  <img 
                    src="/Bsis logo.png" 
                    alt="BSIS Logo" 
                    className="relative w-32 h-32 object-contain drop-shadow-2xl"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-2xl scale-110"></div>
                  <img 
                    src="/school logo.png" 
                    alt="School Logo" 
                    className="relative w-32 h-32 object-contain drop-shadow-2xl"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Grade Portal</h1>
            <p className="text-gray-500">Sign in to access your academic records</p>
          </div>

          {/* Tab Switcher - Modern Pills */}
          <div className="flex mb-8 bg-gray-100/80 rounded-xl p-1.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setError('');
                setPassword('');
              }}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'student'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Student
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserCog className="w-4 h-4 mr-2" />
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student/Admin ID Field - Modern Design */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {activeTab === 'student' ? 'Student ID' : 'Admin ID'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={student_id}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                  placeholder={activeTab === 'student' ? 'e.g., 2022007807' : 'e.g., admin'}
                  required
                />
              </div>
              {activeTab === 'student' && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                  Format: 4 digits + optional dash + more digits
                </p>
              )}
            </div>

            {/* Password Field - Only for Admin - Modern Design */}
            {activeTab === 'admin' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Help Text - Modern Design */}
          <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-blue-900">How to Log In</p>
            </div>
            {activeTab === 'student' ? (
              <div className="text-sm text-blue-800 space-y-2">
                <p className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>Students login with ID only (no password required)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>Example IDs: <strong className="font-semibold">2022007807</strong> or <strong className="font-semibold">2022-007807</strong></span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>Ask admin to create your account if ID doesn't work</span>
                </p>
              </div>
            ) : (
              <div className="text-sm text-blue-800 space-y-2">
                <p className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>Admins require ID + password</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>Demo: ID=<strong className="font-semibold">admin</strong>, Password=<strong className="font-semibold">admin123</strong></span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
