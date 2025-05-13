import React, { useState, useEffect } from 'react';
import { auth, db, doc, setDoc, getDoc } from '../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../utils/auth';
import './AuthForm.css';

// Regular expressions for validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 1 * 1 * 1000; // 1 second in milliseconds

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if account is locked
    const storedLockTime = localStorage.getItem('auth_lockUntil');
    if (storedLockTime) {
      const lockTimeExpires = parseInt(storedLockTime, 10);
      if (Date.now() < lockTimeExpires) {
        setLockedUntil(lockTimeExpires);
        const remainingTime = Math.ceil((lockTimeExpires - Date.now()) / 60000); // minutes
        setError(`Too many failed attempts. Please try again in ${remainingTime} minutes.`);
      } else {
        // Lock expired, reset
        localStorage.removeItem('auth_lockUntil');
        localStorage.removeItem('auth_attempts');
      }
    }
    
    // Get stored login attempts
    const storedAttempts = localStorage.getItem('auth_attempts');
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  // Input sanitization to prevent XSS - only used for storing data, not for authentication
  const sanitizeInput = (input) => {
    if (!input) return '';
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFailedLogin = () => {
    const currentAttempts = (loginAttempts || 0) + 1;
    setLoginAttempts(currentAttempts);
    
    if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_TIME;
      setLockedUntil(lockUntil);
      // Store the lockout time in localStorage
      localStorage.setItem('auth_lockUntil', lockUntil.toString());
      localStorage.setItem('auth_attempts', '0'); // Reset attempts since we're now locked
      setError(`Too many failed attempts. Your account is locked for 1 second.`);
    } else {
      // Store the updated attempt count
      localStorage.setItem('auth_attempts', currentAttempts.toString());
      setError(`Invalid credentials. ${MAX_LOGIN_ATTEMPTS - currentAttempts} attempts remaining.`);
    }
  };

  const resetLoginAttempts = () => {
    setLoginAttempts(0);
    localStorage.removeItem('auth_attempts');
    localStorage.removeItem('auth_lockUntil');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if account is locked
    if (lockedUntil && Date.now() < lockedUntil) {
      const remainingTime = Math.ceil((lockedUntil - Date.now()) / 60000); // minutes
      setError(`Too many failed attempts. Please try again in ${remainingTime} minutes.`);
      return;
    }
    
    // Validate form inputs
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Use email directly - don't sanitize for authentication
      const cleanEmail = email.trim().toLowerCase();
      
      // Firebase authentication - using the imported function directly 
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      console.log("Login successful:", userCredential.user.uid);
      
      // Reset failed login attempts on successful login
      resetLoginAttempts();
      
      try {
        // Check if user document exists, if not create one
        const userRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // If for some reason the user exists in Auth but not in Firestore
          const isAdmin = cleanEmail === 'admin@evox.com';
          
          await setDoc(userRef, {
            email: cleanEmail,
            role: isAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            cards: [],
            loginHistory: [{
              timestamp: new Date().toISOString(),
              success: true,
              userAgent: navigator.userAgent
            }]
          });
          
          // Navigate based on newly created role
          if (isAdmin) {
            navigate('/admin');
            return;
          } else {
            navigate('/dashboard');
            return;
          }
        } else {
          // Update last login time and add to history
          await setDoc(userRef, {
            lastLogin: new Date().toISOString(),
            loginHistory: [...(userDoc.data().loginHistory || []), {
              timestamp: new Date().toISOString(),
              success: true,
              userAgent: navigator.userAgent
            }].slice(-10) // Keep only last 10 logins
          }, { merge: true });
          
          // Check user role and navigate
          const role = userDoc.data()?.role || 'user';
          if (role === 'admin') {
            navigate('/admin');
            return;
          } else {
            navigate('/dashboard');
            return;
          }
        }
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        // If there's an error with Firestore, still navigate to dashboard
        navigate('/dashboard');
        return;
      }
        
    } catch (err) {
      console.error("Login error:", err);
      
      // Handle failed login attempts
      handleFailedLogin();
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Access temporarily disabled due to many failed login attempts. Please try again later.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please check and try again.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid login credentials. Please check email and password.';
      } else if (err.code === 'auth/invalid-login-credentials') {
        errorMessage = 'Invalid login credentials. Please check email and password.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to manage your digital business cards</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className={validationErrors.email ? 'input-error' : ''}
              autoComplete="email"
              maxLength={255}
            />
            {validationErrors.email && <div className="validation-error">{validationErrors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="Your password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              autoComplete="current-password"
              minLength={6}
              maxLength={64}
              className={validationErrors.password ? 'input-error' : ''}
            />
            {validationErrors.password && <div className="validation-error">{validationErrors.password}</div>}
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading || (lockedUntil && Date.now() < lockedUntil)}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : 'Login'}
          </button>
        </form>
        
        <div className="auth-disclaimer">
          <p>By logging in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;