import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => (
  <section className="hero-section">
    <div className="hero-content">
      <span className="eyebrow">Next-Gen Networking</span>
      <h1>Transform Your Professional Connections</h1>
      <p>Share your complete digital profile with a simple tap. E-VOX NFC business cards combine elegant design with cutting-edge technology.</p>
      
      <div className="hero-cta">
        <Link to="/signup">
          <button className="cta-btn primary-btn">Get Your Card</button>
        </Link>
        <Link to="/how-it-works">
          <button className="cta-btn secondary-btn">See How It Works</button>
        </Link>
      </div>
      
      <div className="hero-stats">
        <div className="stat-item">
          <span className="stat-number">10K+</span>
          <span className="stat-label">Happy Users</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">99%</span>
          <span className="stat-label">Satisfaction</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">24/7</span>
          <span className="stat-label">Support</span>
        </div>
      </div>
    </div>
    <div className="hero-media">
      <img 
        src="https://images.unsplash.com/photo-1596526131083-e8c633c948d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80" 
        alt="E-VOX Digital Business Card" 
        className="hero-img"
      />
      <div className="hero-decorative-element"></div>
    </div>
  </section>
);

export default HeroSection;