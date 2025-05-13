import React from 'react';

const HeroSection = () => (
  <section className="hero-section">
    <div className="hero-content">
      <h1>Modern NFC Digital Business Cards</h1>
      <p>Share your professional identity instantly. Stylish. Secure. Smart.</p>
      <button className="cta-btn">Get Started</button>
    </div>
    <div className="hero-media">
      {/* Example GIF or video placeholder */}
      <img src="/vite.svg" alt="Hero Visual" className="hero-img" />
    </div>
  </section>
);

export default HeroSection;