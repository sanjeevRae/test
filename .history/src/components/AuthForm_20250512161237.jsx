import React, { useState, useEffect } from 'react';
import { auth, db, doc, setDoc, getDoc, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../utils/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { getUserRole } from '../utils/auth';
import './AuthForm.css';

// Regular expressions for validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const NAME_REGEX = /^[a-zA-Z0-9 ._-]{2,100}$/;

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 1 * 1 * 1000; // 1 second in milliseconds

const AuthForm = ({ isSignup = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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

  // Input sanitization to prevent XSS
  const sanitizeInput = (input) => {
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
    
    if (isSignup) {
      if (!PASSWORD_REGEX.test(password)) {
        errors.password = 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character';
      }
      
      if (name && !NAME_REGEX.test(name)) {
        errors.name = 'Name contains invalid characters';
      }
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
      // Sanitize inputs before using them
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
      const sanitizedName = isSignup ? sanitizeInput(name.trim()) : '';
      
      let userCredential;
      
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
        
        // Check if this is the admin email (admin@evox.com)
        const isAdmin = sanitizedEmail === 'admin@evox.com';
        
        // Create user document securely
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          email: sanitizedEmail,
          name: sanitizedName,
          role: isAdmin ? 'admin' : 'user', // Set role directly in Firestore
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          cards: [],
          loginHistory: [{
            timestamp: new Date().toISOString(),
            success: true,
            userAgent: navigator.userAgent
          }]
        });
        
        // Reset any failed login attempts
        resetLoginAttempts();
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        try {
          userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
          
          // Reset failed login attempts on successful login
          resetLoginAttempts();
          
          // Check if user document exists, if not create one
          const userRef = doc(db, 'users', userCredential.user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            // If for some reason the user exists in Auth but not in Firestore
            const isAdmin = sanitizedEmail === 'admin@evox.com';
            
            await setDoc(userRef, {
              email: sanitizedEmail,
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
          }
          
          // Get the user's role from Firestore
          const userRole = await getUserRole();
          
          // Navigate based on role
          if (userRole === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } catch (loginError) {
          // Track failed login attempts but don't throw the error again
          // This prevents "unexpected error" from showing up
          handleFailedLogin();
          console.error("Login error:", loginError);
          // Don't throw loginError here, just let the error handling finish
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Please log in instead.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Access temporarily disabled due to many failed login attempts. Please try again later.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please check and try again.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
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
          <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <p>{isSignup 
            ? 'Join E-VOX and start your digital networking journey' 
            : 'Sign in to manage your digital business cards'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                id="name" 
                type="text" 
                placeholder="Your full name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className={validationErrors.name ? 'input-error' : ''}
                maxLength={100}
              />
              {validationErrors.name && <div className="validation-error">{validationErrors.name}</div>}
            </div>
          )}
          
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
              autoComplete={isSignup ? "new-email" : "email"}
              maxLength={255}
            />
            {validationErrors.email && <div className="validation-error">{validationErrors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder={isSignup ? "Min. 8 chars with letters, numbers & symbols" : "Your password"} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className={validationErrors.password ? 'input-error' : ''}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              maxLength={64}
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
            ) : isSignup ? 'Create Account' : 'Login'}
          </button>
        </form>
        
        <div className="auth-footer">
          {isSignup ? (
            <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
          ) : (
            <p>Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link></p>
          )}
        </div>
        
        <div className="auth-disclaimer">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;