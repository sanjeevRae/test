import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-e">E</span>-VOX
        </Link>
        
        <div className="menu-icon" onClick={toggleMenu}>
          <div className={menuOpen ? "hamburger open" : "hamburger"}>
            <span></span><span></span><span></span>
          </div>
        </div>
        
        <ul className={menuOpen ? "navbar-menu active" : "navbar-menu"}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-link" onClick={closeMenu}>About</Link>
          </li>
          <li className="nav-item">
            <Link to="/pricing" className="nav-link" onClick={closeMenu}>Pricing</Link>
          </li>
          <li className="nav-item">
            <Link to="/contact" className="nav-link" onClick={closeMenu}>Contact</Link>
          </li>
          
          {!loading && (
            <>
              {user ? (
                <>
                  <li className="nav-item">
                    <Link to="/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>
                  </li>
                  <li className="nav-item">
                    <button onClick={handleLogout} className="logout-button">
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link login-link" onClick={closeMenu}>
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/signup" className="nav-link signup-link" onClick={closeMenu}>
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;