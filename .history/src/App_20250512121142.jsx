import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import BentoLayout from './components/BentoLayout';
import AuthForm from './components/AuthForm';
import ProtectedRoute from './components/ProtectedRoute';
import CardProfile from './components/CardProfile';
import About from './pages/About';
// Placeholder components for Dashboard and Admin
const Dashboard = () => <div>User Dashboard (CRUD Business Card)</div>;
const AdminDashboard = () => <div>Admin Dashboard (User Management, QR/URL, Subscription)</div>;

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={
          <>
            <HeroSection />
            <BentoLayout />
          </>
        } />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<div>Pricing Section</div>} />
        <Route path="/contact" element={<div>Contact Section</div>} />
        <Route path="/login" element={<AuthForm />} />
        <Route path="/signup" element={<AuthForm isSignup />} />
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
        <Route path="/card/:userId" element={<CardProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
