import { useAuth } from '../contexts/AuthContext';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  AlertCircle, 
  LogOut,
  GraduationCap,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/students', label: 'Students', icon: Users },
    { path: '/admin/grades', label: 'Grades', icon: FileSpreadsheet },
    { path: '/admin/inc', label: 'INC Management', icon: AlertCircle },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ];

  const studentNavItems = [
    { path: '/dashboard', label: 'My Grades', icon: GraduationCap },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Logo */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/10 rounded-lg blur-md scale-110"></div>
            <img 
              src="/school logo.png" 
              alt="School Logo" 
              className="relative w-10 h-10 object-contain drop-shadow-md"
              onError={(e) => { 
                e.target.style.display = 'none'; 
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-10 h-10 bg-primary-100 rounded-lg items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div>
            <span className="font-bold text-gray-900 block leading-tight">Grade Portal</span>
            <span className="text-xs font-medium text-gray-700">{isAdmin ? 'Admin' : user?.course}</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Fixed for mobile visibility */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:top-0 top-16 bottom-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Logo - Single School Logo Only */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-500/10 rounded-xl blur-lg scale-110"></div>
                <img 
                  src="/school logo.png" 
                  alt="School Logo" 
                  className="relative w-14 h-14 object-contain drop-shadow-lg"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg">Grade Portal</h1>
                <p className="text-sm font-semibold text-gray-700">{isAdmin ? 'Admin Panel' : user?.course}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="mb-4 px-4 py-3 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100">
              <p className="font-bold text-gray-900">{user?.full_name}</p>
              <p className="text-sm text-primary-700 font-medium">{user?.student_id}</p>
              {!isAdmin && (
                <p className="text-xs text-gray-600 mt-1">
                  {user?.course} - {user?.section}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Overlay - Higher z-index */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
