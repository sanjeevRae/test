import React, { useState } from 'react';
import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

const AuthForm = ({ isSignup = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
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
            <p>Already have an account? <Link to="/login">Login</Link></p>
          ) : (
            <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;