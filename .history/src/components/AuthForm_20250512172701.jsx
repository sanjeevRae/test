import React, { useState, useEffect } from 'react';
import { auth, db, doc, setDoc, getDoc, checkNetworkConnectivity, pingFirebase } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const AuthForm = ({ isSignup = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(true); // Default to true to prevent false negatives
  const navigate = useNavigate();

  // Monitor network status changes with improved handling
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(true);
      setError('');
    };
    
    const handleOffline = () => {
      // Verify offline status before showing the error
      // This helps prevent false negatives
      setTimeout(() => {
        if (!navigator.onLine) {
          setNetworkStatus(false);
          setError('No internet connection. Please check your network settings.');
        }
      }, 1000);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial network check - assume online by default
    setNetworkStatus(true);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const validateInputs = () => {
    // Regular validation
    if (!email || !EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (isSignup && !name) {
      setError('Name is required');
      return false;
    }
    
    return true;
  };

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user.uid);
      
      // Check if user has a document in Firestore
      try {
        const userRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Create a user document if it doesn't exist
          const isAdmin = email === 'admin@evox.com';
          await setDoc(userRef, {
            email,
            role: isAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            cards: []
          });
          
          if (isAdmin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          // Update last login time
          await setDoc(userRef, {
            lastLogin: new Date().toISOString()
          }, { merge: true });
          
          // Navigate based on role
          const userData = userDoc.data();
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (firestoreError) {
        console.error('Firestore error after login:', firestoreError);
        // Even if Firestore operations fail, we navigate to dashboard
        // since authentication was successful
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Network-related errors
      if (error.code === 'auth/network-request-failed' || !networkStatus) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || 
          error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  const handleSignUp = async () => {
    try {
      // We're not checking network connectivity here anymore since:
      // 1. The Firebase operation will fail with a proper error if there's no connectivity
      // 2. Our checkNetworkConnectivity now returns true by default to avoid false negatives
      
      console.log('Starting signup process for:', email);
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signup successful:', userCredential.user.uid);
      
      // Determine if this is the admin account
      const isAdmin = email === 'admin@evox.com';
      
      try {
        // Create user document in Firestore
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          email,
          name,
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
        
        console.log('User document created in Firestore');
        
        // Navigate to appropriate page
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch (firestoreError) {
        console.error('Firestore error during signup:', firestoreError);
        // If Firestore fails, we can still proceed with navigation since the user account was created
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle network-related errors specifically
      if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
        // Update network status if Firebase detected a network issue
        setNetworkStatus(false);
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please login instead.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Sign up is not enabled. Please contact support.');
      } else if (error.code === 'auth/internal-error') {
        setError('An internal error occurred. Please try again later.');
      } else {
        setError(`Signup failed: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isSignup) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (unexpectedError) {
      console.error('Unexpected error:', unexpectedError);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {!networkStatus && (
          <div className="network-error-banner">
            <p>⚠️ No internet connection detected. Please check your network settings.</p>
          </div>
        )}
        
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
                required
                maxLength={100}
              />
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
              autoComplete={isSignup ? "new-email" : "email"}
              maxLength={255}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder={isSignup ? "Min. 6 characters" : "Your password"} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={6}
              maxLength={64}
            />
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || !networkStatus}
          >
            {loading ? <span className="loading-spinner"></span> : (isSignup ? 'Create Account' : 'Login')}
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
          <p>By {isSignup ? 'signing up' : 'logging in'}, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;