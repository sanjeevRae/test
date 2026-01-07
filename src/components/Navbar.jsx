import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection } from 'firebase/firestore';
import { logUserActivity } from '../utils/auth';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('user');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [logoData, setLogoData] = useState({ url: '', link: '', text: 'E-VOX' });
  const navigate = useNavigate();
  const location = useLocation();
  // Function to fetch logo data from Firestore
  const fetchLogoData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setLogoData({
          url: userData.logoURL || '',
          link: userData.logoLink || '/',
          text: userData.companyName || 'E.VOX'
        });
      } else {
        // Reset to default if user document doesn't exist
        setLogoData({ url: '', link: '/', text: 'E.VOX' });
      }
    } catch (error) {
      console.error('Error fetching logo data:', error);
      // Keep default values if error
      setLogoData({ url: '', link: '/', text: 'E.VOX' });
    }
  };

  // Function to refresh logo data (can be called from other components)
  const refreshLogoData = (userId = null) => {
    const targetUserId = userId || auth.currentUser?.uid;
    if (targetUserId) {
      fetchLogoData(targetUserId);
    }
  };

  // Make refreshLogoData available globally
  useEffect(() => {
    window.refreshNavbarLogo = refreshLogoData;
    return () => {
      delete window.refreshNavbarLogo;
    };
  }, []);

  // Function to determine whose logo should be shown based on current route
  const determineLogoContext = async () => {
    const path = location.pathname;
    
    // Check if we're viewing a specific user's card/profile
    if (path.startsWith('/card/')) {
      const cardId = path.split('/card/')[1];
      try {
        // Fetch the card to get the userId
        const cardDoc = await getDoc(doc(db, 'profiles', cardId));
        if (cardDoc.exists()) {
          const cardData = cardDoc.data();
          if (cardData.userId) {
            fetchLogoData(cardData.userId);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching card data:', error);
      }
    }
    
    // For dashboard and other authenticated routes, show current user's logo
    if (user && (path === '/dashboard' || path === '/admin' || path === '/leader' || path === '/organization')) {
      fetchLogoData(user.uid);
      return;
    }
    
    // For homepage and public routes, show default logo
    setLogoData({ url: '', link: '/', text: 'E-VOX' });
  };

  // Listen to route changes to update logo context
  useEffect(() => {
    determineLogoContext();
  }, [location.pathname, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const { getUserRole } = await import('../utils/auth');
          const role = await getUserRole();
          setUserRole(role);
          
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); 
        }
      } else {
        setLogoData({ url: '', link: '/', text: 'E.VOX' });
      }
      
      setLoading(false);
    });
    
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        closeUserMenu();
      }
      
      if (menuOpen && !event.target.closest('.navbar-menu') && !event.target.closest('.menu-icon')) {
        closeMenu();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    const handleScroll = () => {
      // Don't interfere with EvoxPage navigation
      if (location.pathname === '/evox') return;
      
      const currentScrollPos = window.scrollY;
      
      if (currentScrollPos > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      if (currentScrollPos > 150) {
        const isScrollingDown = currentScrollPos > prevScrollPos;
        setHidden(isScrollingDown);
      } else {
        setHidden(false);
      }
      
      setPrevScrollPos(currentScrollPos);
      // Handle section detection for both HomePage and NFCCardsPage (since NFCCardsPage renders HomePage)
      if (location.pathname === '/' || location.pathname === '/nfc-cards') {
        const sections = ['about', 'features', 'pricing', 'contact'];
        const currentOffset = currentScrollPos + 100; 
        
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const top = element.offsetTop - 100;
            const bottom = top + element.offsetHeight;
            
            if (currentOffset >= top && currentOffset < bottom) {
              setActiveSection(section);
              break;
            } else if (currentOffset < document.getElementById('features')?.offsetTop - 100) {
              setActiveSection('');
            }
          }
        }
      } else {
        setActiveSection('');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
      return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [location.pathname, userMenuOpen, menuOpen]);

  const generateMockIP = () => {
    // Generate a realistic mock IP for demo purposes
    const segments = [];
    for (let i = 0; i < 4; i++) {
      if (i === 0) {
        segments.push(Math.floor(Math.random() * 223) + 1);
      } else {
        segments.push(Math.floor(Math.random() * 256));
      }
    }
    return segments.join('.');
  };

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  };

  const handleLogout = async () => {
    try {
      // Create audit log for logout before signing out
      try {
        const { addDoc } = await import('firebase/firestore');
        const auditRef = collection(db, 'audit_logs');
        await addDoc(auditRef, {
          action: 'user_logout',
          performedBy: user?.uid || 'unknown',
          userEmail: user?.email || 'unknown',
          role: userRole,
          timestamp: new Date().toISOString()
        });
        console.log('Logout audit log created');
      } catch (auditError) {
        console.error('Error creating logout audit log:', auditError);
      }
      
      // Log the logout activity for additional tracking
      await logUserActivity('logout', {
        email: user?.email,
        role: userRole
      });
      
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);
  const closeUserMenu = () => setUserMenuOpen(false);
  const scrollToSection = (sectionId) => {
    closeMenu();
    closeUserMenu();
    setActiveSection(sectionId);
    
    // Special handling for different navigation targets
    if (sectionId === 'nfc-cards') {
      // Navigate to NFC Cards page for Home (only if not already there)
      if (location.pathname !== '/nfc-cards') {
        navigate('/nfc-cards');
      }
      return;
    }
    
    if (sectionId === 'home-about') {
      // Navigate to HomePage for About (only if not on /nfc-cards)
      if (location.pathname === '/nfc-cards') {
        // If on NFCCardsPage, scroll to about section within the page
        const element = document.getElementById('about');
        if (element) {
          setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollToY = rect.top + scrollTop - 80; 
            window.scrollTo({
              top: scrollToY,
              behavior: 'smooth'
            });
          }, 50);
        }
      } else {
        navigate('/');
      }
      return;
    }
    
    // For pricing and contact, check if we're on NFCCardsPage first
    if (sectionId === 'pricing' || sectionId === 'contact') {
      if (location.pathname === '/nfc-cards') {
        // If on NFCCardsPage, scroll to section within the page
        const element = document.getElementById(sectionId);
        if (element) {
          setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollToY = rect.top + scrollTop - 80; 
            window.scrollTo({
              top: scrollToY,
              behavior: 'smooth'
            });
          }, 50);
        }
        return;
      } else if (location.pathname !== '/') {
        // If not on HomePage, navigate to HomePage with scroll state
        navigate('/', { state: { scrollTo: sectionId } });
        return;
      }
    }
    
    // Default behavior: scroll to section on current page
    const element = document.getElementById(sectionId);
    if (element) {
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        const scrollToY = rect.top + scrollTop - 80; 
        
        window.scrollTo({
          top: scrollToY,
          behavior: 'smooth'
        });
      }, 50);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${hidden ? 'navbar-hidden' : ''}`}>
      <div className="navbar-container">
        {logoData.url ? (
          <a 
            href={logoData.link} 
            className="navbar-logo" 
            onClick={(e) => {
              closeMenu();
              if (logoData.link === '/' || logoData.link === '') {
                e.preventDefault();
                navigate('/');
              }
            }}
          >
            <img 
              src={logoData.url} 
              alt={logoData.text || 'Company Logo'} 
              className="navbar-logo-image"
            />
          </a>
        ) : (
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <span className="logo-e">E</span>.VOX
          </Link>
        )}
        
        <div className="menu-icon" onClick={toggleMenu} aria-label="Toggle menu">
          <div className={menuOpen ? "hamburger open" : "hamburger"}>
            <span></span><span></span><span></span>
          </div>
        </div>
        
        <ul className={menuOpen ? "navbar-menu active" : "navbar-menu"}>
          {/* Mobile User Avatar at the very top */}
          {!loading && user && (
            <li className="mobile-user-avatar-container">
              <div className="mobile-user-header">
                <div 
                  className="mobile-user-avatar"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleUserMenu();
                  }}
                >
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="mobile-user-info">
                  <p className="mobile-user-name">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="mobile-user-email">
                    {user.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              {/* Mobile User Dropdown Menu */}
              <div className={`user-dropdown-menu mobile ${userMenuOpen ? 'active' : ''}`}>
                <div className="user-info">
                  <div className="user-avatar-large">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.displayName || 'User'}</span>
                    <span className="user-email">{user.email || ''}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                
                {/* Role-specific navigation */}
                {userRole === 'superadmin' && (
                  <Link to="/controls" className="dropdown-item" onClick={() => {closeUserMenu(); closeMenu();}}>
                    <span className="dropdown-icon">🎛️</span> System Controls
                  </Link>
                )}
                {(userRole === 'admin' || userRole === 'superadmin') && (
                  <Link to="/admin" className="dropdown-item" onClick={() => {closeUserMenu(); closeMenu();}}>
                    <span className="dropdown-icon">👑</span> Admin Dashboard
                  </Link>
                )}
                {(userRole === 'leader' || userRole === 'admin' || userRole === 'superadmin') && (
                  <Link to="/leader" className="dropdown-item" onClick={() => {closeUserMenu(); closeMenu();}}>
                    <span className="dropdown-icon">👥</span> Team Dashboard
                  </Link>
                )}
                {userRole === 'orgmanager' && (
                  <Link to="/organization" className="dropdown-item" onClick={() => {closeUserMenu(); closeMenu();}}>
                    <span className="dropdown-icon">🏢</span> Organization
                  </Link>
                )}
                
                <Link to="/dashboard" className="dropdown-item" onClick={() => {closeUserMenu(); closeMenu();}}>
                  <span className="dropdown-icon">⚙️</span> Dashboard
                </Link>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item logout-btn" onClick={() => {handleLogout(); closeUserMenu(); closeMenu();}}>
                  <span className="dropdown-icon">🚪</span> Sign Out
                </button>
              </div>
            </li>
          )}
          
          <li className="nav-item" style={{"--item-index": 0}}>
            <button
              className={`nav-link nav-button ${location.pathname === '/nfc-cards' ? 'active' : ''}`}
              onClick={() => scrollToSection('nfc-cards')}
            >
              Home
            </button>
          </li>
          <li className="nav-item" style={{"--item-index": 1}}>
            <button
              className={`nav-link nav-button ${location.pathname === '/' && activeSection === '' ? 'active' : ''}`}
              onClick={() => scrollToSection('home-about')}
            >
              About
            </button>
          </li>
          {/* <li className="nav-item" style={{"--item-index": 2}}>
            <a 
              href="#features" 
              className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('features');
                closeMenu();
              }}
            >
              Features
            </a>
          </li> */}
          <li className="nav-item" style={{"--item-index": 3}}>
            <button
              className={`nav-link nav-button ${activeSection === 'pricing' ? 'active' : ''}`}
              onClick={() => scrollToSection('pricing')}
            >
              Pricing
            </button>
          </li>
          <li className="nav-item" style={{"--item-index": 4}}>
            <button
              className={`nav-link nav-button ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={() => scrollToSection('contact')}
            >
              Contact
            </button>
          </li>
          
          {!loading && (
            <>              {user ? (
                <>                  <li className="nav-item" style={{"--item-index": 5}}>
                    <Link 
                      to="/dashboard" 
                      className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} 
                      onClick={closeMenu}
                    >
                      Dashboard
                      {hasNotifications && <span className="notification-badge"></span>}
                    </Link>
                  </li>
                  <li className="nav-item user-menu-container" style={{"--item-index": 6}}>
                    <div 
                      className="user-menu-trigger" 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleUserMenu();
                      }}
                    >
                      <div className="desktop-user-avatar">
                        {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </div>
                    <div className={`user-dropdown-menu desktop ${userMenuOpen ? 'active' : ''}`}>
                      <div className="user-info">
                        <div className="user-avatar-large">
                          {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="user-details">
                          <span className="user-name">{user.displayName || 'User'}</span>
                          <span className="user-email">{user.email || ''}</span>
                        </div>
                      </div>                      
                      <div className="dropdown-divider"></div>
                      
                      {/* Role-specific navigation */}
                      {userRole === 'superadmin' && (
                        <Link to="/controls" className="dropdown-item" onClick={closeUserMenu}>
                          <span className="dropdown-icon">🎛️</span> System Controls
                        </Link>
                      )}
                      {(userRole === 'admin' || userRole === 'superadmin') && (
                        <Link to="/admin" className="dropdown-item" onClick={closeUserMenu}>
                          <span className="dropdown-icon">👑</span> Admin Dashboard
                        </Link>
                      )}
                      {(userRole === 'leader' || userRole === 'admin' || userRole === 'superadmin') && (
                        <Link to="/leader" className="dropdown-item" onClick={closeUserMenu}>
                          <span className="dropdown-icon">👥</span> Team Dashboard
                        </Link>
                      )}
                      
                      {userRole === 'orgmanager' && (
                        <Link to="/organization" className="dropdown-item" onClick={closeUserMenu}>
                          <span className="dropdown-icon">🏢</span> Organization Management
                        </Link>
                      )}
                      
            
                      
                      {userRole === 'admin' && (
                        <Link to="/admin-tools" className="dropdown-item" onClick={closeUserMenu}>
                          <span className="dropdown-icon">🛠️</span> Admin Tools
                        </Link>
                      )}
                      
                      <div className="dropdown-divider"></div>
                      <button onClick={handleLogout} className="dropdown-item logout-item">
                        <span className="dropdown-icon">🚪</span> Logout
                      </button>
                    </div>
                  </li>
                </>
              ) : (
                <>
                <li className="nav-item" style={{"--item-index": 5}}>
                    <Link to="/login" className="login-button" onClick={closeMenu}>
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