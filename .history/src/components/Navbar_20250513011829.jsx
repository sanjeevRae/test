import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    // Handle scroll for navbar styling
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
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

  const scrollToSection = (sectionId) => {
    closeMenu();
    
    // If not on homepage, navigate to home first
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }
    
    // If on homepage, scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        behavior: 'smooth',
        top: element.offsetTop - 80 // Offset for navbar
      });
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
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
            <a href="#about" className="nav-link" onClick={() => scrollToSection('about')}>About</a>
          </li>
          <li className="nav-item">
            <a href="#features" className="nav-link" onClick={() => scrollToSection('features')}>Features</a>
          </li>
          <li className="nav-item">
            <a href="#pricing" className="nav-link" onClick={() => scrollToSection('pricing')}>Pricing</a>
          </li>
          <li className="nav-item">
            <a href="#contact" className="nav-link" onClick={() => scrollToSection('contact')}>Contact</a>
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