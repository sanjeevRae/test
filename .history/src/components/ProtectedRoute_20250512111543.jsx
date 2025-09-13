import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../utils/firebase';

const ProtectedRoute = ({ children }) => {
  const user = auth.currentUser;
  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;