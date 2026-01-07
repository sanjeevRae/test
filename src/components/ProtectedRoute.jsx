import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from '../utils/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin, isUserLeader, isUserSuperAdmin, getUserRole } from '../utils/auth';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, requireAdmin = false, requireLeader = false, requireSuperAdmin = false }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userOrganization, setUserOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If user is logged in, check their role
      if (currentUser) {
        try {
          // Check Firestore directly for accurate role information
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const firestoreRole = userData.role || 'user';
            const orgId = userData.organizationId || null;
            
            console.log('User role from Firestore in ProtectedRoute:', firestoreRole);
            console.log('User organization ID in ProtectedRoute:', orgId);
            
            setUserRole(firestoreRole);
            setUserOrganization(orgId);
            
            // If leader is required, verify leader has a valid organization
            if (requireLeader && firestoreRole === 'leader' && !orgId) {
              setError('Leader role detected but no organization assigned. Contact administrator.');
            } else {
              setError(null);
            }
            
            // Additional check for leader - verify organization exists
            if (requireLeader && firestoreRole === 'leader' && orgId) {
              const orgRef = doc(db, 'organizations', orgId);
              const orgDoc = await getDoc(orgRef);
              
              if (!orgDoc.exists()) {
                console.error(`Organization ${orgId} assigned to leader ${currentUser.uid} does not exist`);
                setError('Organization not found. Please contact administrator.');
              }
              
              // Also verify user is listed in organization members
              const memberRef = doc(db, 'organizations', orgId, 'members', currentUser.uid);
              const memberDoc = await getDoc(memberRef);
              
              if (!memberDoc.exists()) {
                console.warn(`Leader ${currentUser.uid} is not listed in organization members`);
                // This is not a critical error, but we should log it
              }
            }
          } else {
            console.log('User document not found in Firestore, defaulting to user role');
            setUserRole('user');
          }
        } catch (error) {
          console.error('Error checking user role in ProtectedRoute:', error);
          setUserRole('user'); // Default to regular user on error
          setError('Error verifying user permissions. Please try again.');
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [requireAdmin, requireLeader, requireSuperAdmin]);
  
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
  
  // Handle super admin access requirement
  if (requireSuperAdmin && userRole !== 'superadmin') {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  // Handle admin access requirement (superadmin has admin access too)
  if (requireAdmin && userRole !== 'admin' && userRole !== 'superadmin') {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  // Handle leader access requirement (admin and superadmin have leader access too)
  if (requireLeader && userRole !== 'admin' && userRole !== 'leader' && userRole !== 'superadmin') {
    console.log('Redirecting: User role is', userRole, 'but leader or admin role is required');
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  // If there's an error (like leader without organization), show error instead of redirecting
  if (error && (userRole === 'leader' || userRole === 'admin' || userRole === 'superadmin')) {
    return (
      <div className="error-container">
        <h2>Access Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</button>
        <button onClick={() => window.location.href = '/role-debug'}>Debug Role</button>
      </div>
    );
  }
  
  // Authenticated and authorized
  return children;
};

export default ProtectedRoute;