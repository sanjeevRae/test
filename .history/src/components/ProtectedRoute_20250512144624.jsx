import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin } from '../utils/auth';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If we require admin access, check if the user has admin role in Firestore
      if (currentUser && requireAdmin) {
        try {
          // Check admin status using Firestore (Spark plan compatible)
          const adminStatus = await isUserAdmin();
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [requireAdmin]);
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If requireAdmin is true but user is not admin, redirect to dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  // Authenticated and authorized
  return children;
};

export default ProtectedRoute;