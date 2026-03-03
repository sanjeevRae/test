import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import ProtectedRoute from './components/ProtectedRoute';
import CardProfile from './components/CardProfile';
import About from './pages/About'; 
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import LeaderDashboard from './components/LeaderDashboard';
import ControlsDashboard from './components/ControlsDashboard';
import AdminTools from './components/AdminTools';
import OrganizationManagement from './components/OrganizationManagement';
import EvoxPage from './components/EvoxPage';
import RoleDebugger from './components/RoleDebugger';
import EditUserPage from './components/EditUserPage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NFCCardsPage from './components/NFCCardsPage';
import WelcomeModal from './components/WelcomeModal';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check user role on app load
    const checkUserRole = async () => {
      try {
        const { auth } = await import('./utils/firebase');
        const { getUserRole } = await import('./utils/auth');
        
        if (auth.currentUser) {
          const role = await getUserRole();
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUserRole();
  }, []);
  
  return (
    <Router>
      <WelcomeModal />
      <Routes>
        <Route path="/" element={<EvoxPage />} />
        <Route path="/nfc-cards" element={<NFCCardsPage />} />
        <Route path="/login" element={<AuthForm />} />
        <Route path="/addmein" element={<AuthForm isSignup={true} />} />        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AnalyticsDashboard />
          </ProtectedRoute>
        } />
        
        {/* Role-based redirect route */}
        <Route path="/role-dashboard" element={
          <ProtectedRoute>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            ) : userRole === 'superadmin' ? (
              <Navigate to="/controls" replace />
            ) : userRole === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : userRole === 'leader' ? (
              <Navigate to="/leader" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </ProtectedRoute>
        } />
        <Route path="/controls" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <ControlsDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />        <Route path="/leader" element={
          <ProtectedRoute requireLeader={true}>
            <LeaderDashboard />
          </ProtectedRoute>
        } />        <Route path="/admin-tools" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminTools />
          </ProtectedRoute>
        } />        <Route path="/organization" element={
          <ProtectedRoute requireLeader={true}>
            <OrganizationManagement />
          </ProtectedRoute>
        } />
        <Route path="/card/:userId" element={<CardProfile />} />
        <Route path="/role-debug" element={<RoleDebugger />} />
          {/* Routes for dedicated pages */}
        <Route path="/about" element={<About />} />
        
        {/* Redirect other routes */}
        <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
        <Route path="/dashboard/edit/:id" element={
          <ProtectedRoute requireLeader={true}>
            <EditUserPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
