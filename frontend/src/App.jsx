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
function App() {
  return (
    <ErrorBoundary>
      <ResumeProvider>
        <Router>
          <Routes>
            {/* Direct Dashboard Routes (No Auth) */}
            <Route path="/" element={<DashboardLayout><Overview /></DashboardLayout>} />
            <Route path="/resume" element={<DashboardLayout><ResumeUpload /></DashboardLayout>} />
            <Route path="/matches" element={<DashboardLayout><JobMatches /></DashboardLayout>} />
            <Route path="/cover-letter" element={<DashboardLayout><CoverLetter /></DashboardLayout>} />
            <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ResumeProvider>
    </ErrorBoundary>
  );
}

export default App;
