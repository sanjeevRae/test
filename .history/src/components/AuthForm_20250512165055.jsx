import React, { useState } from 'react';
import { auth, db, doc, setDoc, getDoc } from '../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      
      // Simple email and password authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
      
      // Check if user has a document in Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create a user document if it doesn't exist
        const isAdmin = email === 'admin@evox.com';
        await setDoc(userRef, {
          email: email,
          role: isAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        
        // Navigate based on email
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
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different Firebase auth errors
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
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
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="Your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? <span className="loading-spinner"></span> : 'Login'}
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