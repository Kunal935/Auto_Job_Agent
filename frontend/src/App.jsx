import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Overview from './pages/dashboard/Overview';
import ResumeUpload from './pages/dashboard/ResumeUpload';
import JobMatches from './pages/dashboard/JobMatches';
import CoverLetter from './pages/dashboard/CoverLetter';
import Settings from './pages/dashboard/Settings';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ResumeProvider } from './context/ResumeContext';

// Mock Auth Guard
// Mock Auth Guard - Bypassed for development
const ProtectedRoute = ({ children }) => {
  // Always allow access as requested
  return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
  return (
    <ErrorBoundary>
      <ResumeProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Dashboard Routes wrapped in Layout and Guard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Overview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume"
              element={
                <ProtectedRoute>
                  <ResumeUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <JobMatches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cover-letter"
              element={
                <ProtectedRoute>
                  <CoverLetter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ResumeProvider>
    </ErrorBoundary>
  );
}

export default App;
