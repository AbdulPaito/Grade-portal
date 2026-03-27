/**
 * ==========================================
 * STUDENT GRADE PORTAL - FRONTEND ENTRY POINT
 * ==========================================
 * 
 * 🚀 HOW TO RUN (for beginners):
 * 
 * 1. Make sure you have a .env file in the frontend folder
 *    - Copy .env.example and rename to .env
 *    - Or create new file named .env
 *    - VITE_API_URL should point to your backend (http://localhost:5000/api)
 * 
 * 2. Open terminal in the frontend folder
 *    - Type: npm run dev
 *    - Wait for "ready" message
 *    - Vite will open your browser automatically
 *    - App runs on http://localhost:3000
 * 
 * 3. Make sure backend is running first!
 *    - Backend must be on http://localhost:5000
 *    - Check: http://localhost:5000/api/health
 * 
 * 📝 WHAT THIS FILE DOES:
 * - This is the starting point of the React app
 * - It renders the App component into the HTML page
 * - React.StrictMode helps catch potential problems
 * 
 * 🔗 IMPORTANT FILES:
 * - App.jsx: Main router and route definitions
 * - contexts/AuthContext.jsx: Login/logout logic
 * - pages/Login.jsx: Login page UI
 * - hooks/useApi.js: API calls to backend
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
