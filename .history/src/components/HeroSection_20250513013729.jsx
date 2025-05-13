import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  // Add smooth scrolling functionality
  useEffect(() => {
    const handleLinkClick = (e) => {
      const links = document.querySelectorAll('a[href^="#"]');
      links.forEach(link => {
        if (e.target === link) {
          e.preventDefault();
          const targetId = link.getAttribute('href');
          if (targetId === '#') return;
          
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      });
    };

    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return (
    <section className="hero" id="home">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">Next-Gen Digital Networking</div>
          <h1 className="hero-title">Transform Your <span className="highlight">Professional</span> Connections</h1>
          <p className="hero-description">
            Share your complete digital profile with a simple tap. E-VOX NFC business cards combine elegant design with cutting-edge technology for a seamless networking experience.
          </p>
          
          <div className="hero-cta-group">
            <Link to="/login" className="hero-cta primary">
              Get Your Card
              <span className="cta-arrow">→</span>
            </Link>
            <Link to="/how-it-works" className="hero-cta secondary">
              See How It Works
            </Link>
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
            <a href="#about" className="scroll-down">
              <span>Scroll Down</span>
              <div className="chevron"></div>
            </a>
          </div>
        </div>
        
        <div className="hero-image">
          <div className="image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1582845512747-e42001c95638?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
              alt="E-VOX NFC Business Card" 
            />
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
            <div className="dot-pattern"></div>
          </div>
          <div className="floating-element floating-element-2">
            <div className="wave-pattern"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;