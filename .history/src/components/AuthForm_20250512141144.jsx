import React, { useState } from 'react';
import { auth, db, doc, setDoc, getDoc } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { syncUserRole } from '../utils/auth';
import './AuthForm.css';

const AuthForm = ({ isSignup = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let userCredential;
      
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // The admin role will be assigned automatically by the cloud function if email matches
        // We still create a basic user document here, admin claim will be added by the cloud function
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          email: email,
          name: name || '',
          createdAt: new Date().toISOString(),
          cards: []
          // Role will be set by the cloud function based on custom claims
        });
        
        // Force token refresh to get the latest claims
        await auth.currentUser.getIdToken(true);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if user document exists, if not create one
        const userRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            email: email,
            createdAt: new Date().toISOString(),
            cards: []
            // Role will be set by the cloud function based on custom claims
          });
        } else {
          // Synchronize the user's role between Firestore and custom claims
          await syncUserRole();
        }
        
        // Force token refresh to get the latest claims
        await auth.currentUser.getIdToken(true);
        
        // Get the ID token result to check if user is admin
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        const isAdmin = idTokenResult.claims.admin === true;
        
        // Navigate based on role
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please log in instead.');
      } else {
        setError(err.message);
      }
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
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="Min. 6 characters" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              minLength="6"
            />
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-button" disabled={loading}>
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