/**
 * ==========================================
 * AUTHENTICATION CONTEXT
 * ==========================================
 * 
 * 📝 WHAT THIS FILE DOES:
 * - Manages user login/logout state
 * - Stores JWT token in localStorage
 * - Sets up Axios API client with authentication
 * - Provides login functions for students and admins
 * 
 * 🔗 API ENDPOINTS USED:
 * - POST /auth/student-login (Student login - ID only)
 * - POST /auth/admin-login (Admin login - ID + password)
 * - GET /auth/me (Get current user profile)
 * 
 * 🚀 HOW LOGIN WORKS:
 * 1. Student enters ID (e.g., 2022007807 or 2022-007807)
 * 2. Frontend sends POST to /auth/student-login
 * 3. Backend validates ID format (4 digits + optional dash + digits)
 * 4. If valid, returns JWT token and user data
 * 5. Token is stored in localStorage for future requests
 * 6. All API calls automatically include the token in header
 */

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Get API URL from .env file, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create Axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (on page refresh)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  /**
   * STUDENT LOGIN - Uses ID only (no password)
   * Endpoint: POST /auth/student-login
   * Body: { student_id: "2022007807" }
   */
  const studentLogin = async (student_id) => {
    try {
      const response = await api.post('/auth/student-login', { student_id });
      const { token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Invalid Student ID' 
      };
    }
  };

  /**
   * ADMIN LOGIN - Uses ID + password
   * Endpoint: POST /auth/admin-login
   * Body: { student_id: "admin", password: "admin123" }
   */
  const adminLogin = async (student_id, password) => {
    try {
      const response = await api.post('/auth/admin-login', { student_id, password });
      const { token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Invalid credentials' 
      };
    }
  };

  /**
   * LEGACY LOGIN - For backward compatibility
   * Tries both student and admin endpoints based on input
   */
  const login = async (student_id, password) => {
    // If password provided, try admin login first
    if (password) {
      const result = await adminLogin(student_id, password);
      if (result.success) return result.user;
    }
    
    // Try student login (ID only)
    const result = await studentLogin(student_id);
    if (result.success) return result.user;
    
    // Both failed
    throw new Error(result.message || 'Login failed');
  };

  /**
   * LOGOUT - Clear all stored data
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Values provided to all components
  const value = {
    user,
    login,           // Legacy login function
    studentLogin,    // New: Student login (ID only)
    adminLogin,      // New: Admin login (ID + password)
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    api
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export { api };
