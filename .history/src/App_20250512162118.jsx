import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import BentoLayout from './components/BentoLayout';
import AuthForm from './components/AuthForm';
import ProtectedRoute from './components/ProtectedRoute';
import CardProfile from './components/CardProfile';
import About from './pages/About'; // Corrected import path
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminTools from './components/AdminTools';
import HomePage from './components/HomePage';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthForm />} />
        {/* Signup route removed */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-tools" element={
          <ProtectedRoute>
            <AdminTools />
          </ProtectedRoute>
        } />
        <Route path="/card/:userId" element={<CardProfile />} />
        
        {/* Redirect old routes to homepage with anchor */}
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
        
        {/* Redirect signup to login */}
        <Route path="/signup" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
