import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exitImpersonation } from '../utils/auth';

const ImpersonationBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [impersonatedEmail, setImpersonatedEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're in impersonation mode
    const isImpersonating = sessionStorage.getItem('impersonationMode') === 'true';
    
    if (isImpersonating) {
      const userData = JSON.parse(sessionStorage.getItem('impersonatedUserData') || '{}');
      setImpersonatedEmail(userData.email || 'Unknown User');
      setIsVisible(true);
    }
  }, []);

  const handleExitImpersonation = async () => {
    try {
      await exitImpersonation();
      
      // Clear all impersonation data
      sessionStorage.removeItem('impersonationMode');
      sessionStorage.removeItem('impersonatedUserId');
      sessionStorage.removeItem('impersonatedUserData');
      sessionStorage.removeItem('superAdminId');
      sessionStorage.removeItem('superAdminEmail');
      
      // Navigate back to controls
      navigate('/controls');
    } catch (error) {
      console.error('Error exiting impersonation:', error);
      // Force navigation anyway
      navigate('/controls');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="impersonation-banner">
      <div className="impersonation-content">
        <span className="impersonation-icon">👤</span>
        <span className="impersonation-text">
          You are impersonating <strong>{impersonatedEmail}</strong>
        </span>
        <button 
          className="exit-impersonation-btn"
          onClick={handleExitImpersonation}
          title="Exit impersonation and return to Controls"
        >
          🚪 Exit Impersonation
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;