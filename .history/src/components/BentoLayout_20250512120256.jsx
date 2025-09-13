import React from 'react';
import { Link } from 'react-router-dom';

const BentoLayout = () => (
  <section className="features-section">
    <h2 className="section-title">Why Choose <span className="highlight">E-VOX</span></h2>
    <div className="features-grid">
      <div className="feature-card">
        <div className="feature-icon">
          <img 
            src="https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80" 
            alt="Tap to share" 
          />
        </div>
        <h3>Instant Sharing</h3>
        <p>One tap to share your digital profile</p>
        <Link to="/features/sharing" className="feature-link">Learn more</Link>
      </div>
      
      <div className="feature-card">
        <div className="feature-icon">
          <img 
            src="https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1964&q=80" 
            alt="Custom Design" 
          />
        </div>
        <h3>Custom Design</h3>
        <p>Personalized to match your brand</p>
        <Link to="/features/design" className="feature-link">Learn more</Link>
      </div>
      
      <div className="feature-card">
        <div className="feature-icon">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
            alt="Analytics" 
          />
        </div>
        <h3>Analytics</h3>
        <p>Track engagement with your card</p>
        <Link to="/features/analytics" className="feature-link">Learn more</Link>
      </div>
    </div>
  </section>
);

export default BentoLayout;