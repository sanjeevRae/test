import React, { useState } from 'react';
import { auth, db, doc, setDoc, getDoc } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
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
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      let userCredential;
      
      if (isSignup) {
        // Signup with Firebase
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Signup successful');
        
        // Check if this is the admin email
        const isAdmin = email.toLowerCase() === 'admin@evox.com';
        
        // Create user document in Firestore
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          email: email,
          name: name || '',
          role: isAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          cards: []
        });
        
        // Navigate to dashboard after signup
        navigate('/dashboard');
      } else {
        // Login with Firebase
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful');
        
        // Check if user has a document in Firestore
        const userRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Create a user document if it doesn't exist
          const isAdmin = email.toLowerCase() === 'admin@evox.com';
          await setDoc(userRef, {
            email: email,
            role: isAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            cards: []
          });
          
          // Navigate based on role
          if (isAdmin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          // User exists, update last login
          await setDoc(userRef, {
            lastLogin: new Date().toISOString()
          }, { merge: true });
          
          // Get user role for navigation
          const userData = userDoc.data();
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (err) {
      console.error(isSignup ? 'Signup error:' : 'Login error:', err);
      
      // Handle different Firebase auth errors
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(isSignup ? 'Signup failed. Please try again.' : 'Login failed. Please try again.');
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
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder={isSignup ? "Min. 6 characters" : "Your password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
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