import React from 'react';
import { Link } from 'react-router-dom';
import './BentoLayout.css';

// Import icons from public folder
const iconShare = '/vite.svg';
const iconDesign = '/vite.svg';
const iconAnalytics = '/vite.svg';

const BentoLayout = () => {
  return (
    <section className="features" id="features">
      <div className="features-container">
        <div className="features-header">
          <span className="section-tagline">Why Choose Us</span>
          <h2 className="section-title">The Complete Business Card Solution</h2>
          <p className="section-subtitle">
            Our digital business cards are packed with features that elevate your networking experience
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <img src={iconShare} alt="Instant sharing icon" />
              </div>
            </div>
            <h3>Instant Sharing</h3>
            <p>One tap to share your digital profile with anyone, anywhere. No apps needed for the recipient.</p>
            <Link to="/features/sharing" className="feature-link">
              Learn more <span className="arrow">→</span>
            </Link>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <img src={iconDesign} alt="Custom design icon" />
              </div>
            </div>
            <h3>Custom Design</h3>
            <p>Personalize your card with your brand colors, logo, and choose from premium templates.</p>
            <Link to="/features/design" className="feature-link">
              Learn more <span className="arrow">→</span>
            </Link>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <img src={iconAnalytics} alt="Analytics icon" />
              </div>
            </div>
            <h3>Analytics Dashboard</h3>
            <p>Track engagement with detailed stats on views, interactions, and connection requests.</p>
            <Link to="/features/analytics" className="feature-link">
              Learn more <span className="arrow">→</span>
            </Link>
          </div>
        </div>
        
        <div className="features-cta">
          <Link to="/signup" className="btn-cta">
            Start Your Free Trial <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BentoLayout;