import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppShell from './components/Layout/AppShell';

// Public pages
import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import JoinExam from './pages/public/JoinExam';
import NotFound from './pages/public/NotFound';

// App pages
import Dashboard from './pages/app/Dashboard';
import AiStudio from './pages/app/AiStudio';
import QuestionsList from './pages/app/QuestionsList';
import QuestionCreate from './pages/app/QuestionCreate';
import ExamsList from './pages/app/ExamsList';
import ExamCreate from './pages/app/ExamCreate';
import ExamDetail from './pages/app/ExamDetail';
import ResourcesList from './pages/app/ResourcesList';
import EvaluationQueue from './pages/app/EvaluationQueue';
import Analytics from './pages/app/Analytics';
import Members from './pages/app/Members';
import AppSettings from './pages/app/AppSettings';

// Student pages
import ExamPlayer from './pages/student/ExamPlayer';
import MyAttempts from './pages/student/MyAttempts';
import SubmissionSuccess from './pages/student/SubmissionSuccess';

// Admin pages
import AdminInstitutions from './pages/admin/AdminInstitutions';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFlags from './pages/admin/AdminFlags';
import AdminLogs from './pages/admin/AdminLogs';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app/dashboard" />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to="/app/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/app/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/app/dashboard" /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/join" element={<JoinExam />} />
      <Route path="/join/:code" element={<JoinExam />} />

      {/* Student exam flow */}
      <Route path="/exam/:attemptId" element={<ProtectedRoute><ExamPlayer /></ProtectedRoute>} />
      <Route path="/submission-success" element={<ProtectedRoute><SubmissionSuccess /></ProtectedRoute>} />

      {/* App routes */}
      <Route path="/app/*" element={
        <ProtectedRoute>
          <AppShell>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="ai-studio" element={<AiStudio />} />
              <Route path="questions" element={<QuestionsList />} />
              <Route path="questions/create" element={<QuestionCreate />} />
              <Route path="exams" element={<ExamsList />} />
              <Route path="exams/create" element={<ExamCreate />} />
              <Route path="exams/:id" element={<ExamDetail />} />
              <Route path="resources" element={<ResourcesList />} />
              <Route path="evaluations" element={<EvaluationQueue />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="institution/members" element={<Members />} />
              <Route path="my-attempts" element={<MyAttempts />} />
              <Route path="my-results" element={<MyAttempts />} />
              <Route path="settings" element={<AppSettings />} />
              <Route path="admin/institutions" element={<ProtectedRoute roles={['super_admin']}><AdminInstitutions /></ProtectedRoute>} />
              <Route path="admin/users" element={<ProtectedRoute roles={['super_admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="admin/flags" element={<ProtectedRoute roles={['super_admin']}><AdminFlags /></ProtectedRoute>} />
              <Route path="admin/logs" element={<ProtectedRoute roles={['super_admin']}><AdminLogs /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
