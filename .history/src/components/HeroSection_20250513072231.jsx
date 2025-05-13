import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  // Add smooth scrolling functionality
  useEffect(() => {
    // Smooth scroll implementation for the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Clean up on unmount
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // Function to handle scroll to sections
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero" id="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">Next-Gen Digital Networking</div>
          <h1 className="hero-title">Transform Your <span className="highlight">Professional Connections</span></h1>
          <p className="hero-description">
            Share your complete digital profile with a simple tap. E-VOX NFC business cards combine elegant design with cutting-edge technology for a seamless networking experience.
          </p>
          
          <div className="hero-cta-group">
            <Link to="/login" className="hero-cta primary">
              Get Your Card
            </Link>
            <a href="#how-it-works" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('features');
              }}
              className="hero-cta secondary">
              See How It Works
            </a>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">10K+</div>
              <div className="stat-label">Happy Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">99%</div>
              <div className="stat-label">Satisfaction</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>
          
          <div className="scroll-indicator">
            <a href="#about" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}
              aria-label="Scroll down">
              <div className="mouse">
                <div className="wheel"></div>
              </div>
              <div className="scroll-text">Discover More</div>
            </a>
          </div>
        </div>
        
        <div className="hero-image">
          <div className="image-grid">
            <div className="main-image">
              <img 
                src="https://images.unsplash.com/photo-1625728577342-dab5dcd758b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="E-VOX NFC Business Card" 
                loading="eager"
              />
            </div>
            <div className="secondary-image">
              <img 
                src="https://images.unsplash.com/photo-1589758438368-0ad531db3366?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1412&q=80"
                alt="Digital card being tapped on phone"
                loading="eager"
              />
            </div>
          </div>
          
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
          
          <div className="floating-card">
            <div className="card-header">E-VOX</div>
            <div className="card-name">Sarah Johnson</div>
            <div className="card-role">Marketing Director</div>
            <div className="card-nfc"></div>
          </div>
          
          <div className="floating-element floating-element-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M5.5 8.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1z"/>
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8"/>
            </svg>
            <span>NFC Technology</span>
          </div>
          
          <div className="floating-element floating-element-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664z"/>
            </svg>
            <span>Digital Profile</span>
          </div>
          
          <div className="floating-element floating-element-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293z"/>
            </svg>
            <span>One-Tap Sharing</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;