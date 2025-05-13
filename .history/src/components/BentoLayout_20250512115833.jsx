import React from 'react';
import { Link } from 'react-router-dom';

const BentoLayout = () => (
  <section className="bento-layout">
    <Link to="/about" className="bento-item bento-about">
      <div className="bento-content">
        <h3>Sustainable Choice</h3>
        <p>Save trees with our eco-friendly digital alternative to paper cards.</p>
        <img 
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fHN1c3RhaW5hYmxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60" 
          alt="Sustainability" 
          className="bento-img"
        />
      </div>
    </Link>
    
    <Link to="/contact" className="bento-item bento-contact">
      <div className="bento-content">
        <h3>Instant Sharing</h3>
        <p>Share your details with a simple tap of your NFC-enabled card.</p>
        <img 
          src="https://images.unsplash.com/photo-1551730459-92db2a308d6a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bmZjfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60" 
          alt="NFC Sharing" 
          className="bento-img"
        />
      </div>
    </Link>
    
    <Link to="/pricing" className="bento-item bento-pricing">
      <div className="bento-content">
        <h3>Flexible Plans</h3>
        <p>Choose a subscription that fits your professional needs.</p>
        <img 
          src="https://images.unsplash.com/photo-1580519542036-c47de6196ba5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cHJpY2luZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60" 
          alt="Pricing Plans" 
          className="bento-img"
        />
      </div>
    </Link>
    
    <Link to="/dashboard" className="bento-item bento-media">
      <div className="bento-content">
        <h3>Analytics & Insights</h3>
        <p>Track engagement with your digital business card.</p>
        <img 
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzB8fGFuYWx5dGljc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60" 
          alt="Analytics" 
          className="bento-img"
        />
      </div>
    </Link>
  </section>
);

export default BentoLayout;