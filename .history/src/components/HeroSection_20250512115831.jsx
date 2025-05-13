import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => (
  <section className="hero-section">
    <div className="hero-content">
      <h1>Eco-Friendly Digital Business Cards</h1>
      <p>Join the sustainable revolution with E-vox. Our NFC business cards reduce paper waste while enhancing your professional networking experience.</p>
      <Link to="/signup">
        <button className="cta-btn">Go Paperless Today</button>
      </Link>
    </div>
    <div className="hero-media">
      <img 
        src="https://images.unsplash.com/photo-1622556498246-755f44ca76f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fG5mYyUyMGNhcmR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60" 
        alt="E-vox Digital Business Card" 
        className="hero-img"
      />
    </div>
  </section>
);

export default HeroSection;