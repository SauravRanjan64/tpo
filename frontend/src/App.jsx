import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { DashboardSkeleton } from './components/common/LoadingSkeleton';

// Guards
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleRoute from './components/routing/RoleRoute';
import ConsentGuard from './components/routing/ConsentGuard';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import CompanyLayout from './layouts/CompanyLayout';

// Lazy-loaded Public Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

// Lazy-loaded Student Pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const JobList = lazy(() => import('./pages/student/JobList'));
const JobDetails = lazy(() => import('./pages/student/JobDetails'));
const MyApplications = lazy(() => import('./pages/student/MyApplications'));
const ApplicationDetails = lazy(() => import('./pages/student/ApplicationDetails'));
const ResumePage = lazy(() => import('./pages/student/ResumePage'));
const ResumeMatcher = lazy(() => import('./pages/student/ResumeMatcher'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const NotificationsPage = lazy(() => import('./pages/student/NotificationsPage'));

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentManagement = lazy(() => import('./pages/admin/StudentManagement'));
const CompanyManagement = lazy(() => import('./pages/admin/CompanyManagement'));
const JobDriveManagement = lazy(() => import('./pages/admin/JobDriveManagement'));
const CreateJobDrive = lazy(() => import('./pages/admin/CreateJobDrive'));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminExports = lazy(() => import('./pages/admin/AdminExports'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));

// Lazy-loaded Company Pages
const CompanyDashboard = lazy(() => import('./pages/company/CompanyDashboard'));
const CompanyDrives = lazy(() => import('./pages/company/CompanyDrives'));
const CompanyApplicants = lazy(() => import('./pages/company/CompanyApplicants'));
const CompanyShortlisted = lazy(() => import('./pages/company/CompanyShortlisted'));
const CompanyProfile = lazy(() => import('./pages/company/CompanyProfile'));

// Root Redirect Component
const RootRedirect = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'COMPANY') return <Navigate to="/company/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const App = () => {
  return (
    <Suspense fallback={<div className="p-6"><DashboardSkeleton /></div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Student Protected Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['STUDENT']}>
                <ConsentGuard>
                  <StudentLayout />
                </ConsentGuard>
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="jobs" element={<JobList />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="applications/:id" element={<ApplicationDetails />} />
          <Route path="resume" element={<ResumePage />} />
          <Route path="resume/match" element={<ResumeMatcher />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* T&P Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="companies" element={<CompanyManagement />} />
          <Route path="jobs" element={<JobDriveManagement />} />
          <Route path="jobs/create" element={<CreateJobDrive />} />
          <Route path="jobs/:id/edit" element={<CreateJobDrive />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="exports" element={<AdminExports />} />
          <Route path="audit" element={<AdminAuditLogs />} />
        </Route>

        {/* Company Recruiter Protected Routes */}
        <Route
          path="/company"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['COMPANY']}>
                <CompanyLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/company/dashboard" replace />} />
          <Route path="dashboard" element={<CompanyDashboard />} />
          <Route path="jobs" element={<CompanyDrives />} />
          <Route path="jobs/create" element={<CreateJobDrive />} />
          <Route path="jobs/:id/edit" element={<CreateJobDrive />} />
          <Route path="applicants" element={<CompanyApplicants />} />
          <Route path="shortlisted" element={<CompanyShortlisted />} />
          <Route path="profile" element={<CompanyProfile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
