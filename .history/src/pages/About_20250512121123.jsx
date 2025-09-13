import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1>About <span className="highlight">E-VOX</span></h1>
          <p className="subtitle">The future of networking is here</p>
        </div>
      </section>

      <section className="about-content">
        <div className="container">
          <div className="about-description">
            <p>
              E-VOX (Environment Voice) is revolutionizing the way professionals connect in the digital age. 
              Our premium NFC business cards combine elegant design with cutting-edge technology, allowing 
              you to share your complete digital profile with a simple tap.
            </p>
            <p>
              Founded in 2025, E-VOX was born from the vision to eliminate paper waste while enhancing networking 
              capabilities. Our motto "Sustainable Connections for a Digital Future" reflects our commitment to 
              eco-friendly networking solutions.
            </p>
          </div>

          <div className="impact-stats">
            <div className="stat-box">
              <span className="stat-number">500K+</span>
              <span className="stat-label">Paper Cards Saved</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">60%</span>
              <span className="stat-label">Carbon Footprint Reduction</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">100%</span>
              <span className="stat-label">Recyclable Materials</span>
            </div>
          </div>
        </div>
      </section>

      <section className="product-pricing">
        <div className="container">
          <h2>Our Product</h2>
          <p className="subtitle">For Direct Purchase</p>

          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="card-header">
                <h3>Standard E-VOX Card</h3>
                <span className="popular-tag">Popular</span>
              </div>
              <div className="card-title">Standard</div>
              <p className="card-description">Our classic NFC business card with essential features.</p>
              <div className="card-price">Rs500</div>
              <Link to="/order/standard">
                <button className="order-btn">Order Now</button>
              </Link>
            </div>

            <div className="pricing-card featured">
              <div className="card-header">
                <h3>Premium E-VOX Card</h3>
                <span className="value-tag">Best Value</span>
              </div>
              <div className="card-title">Premium</div>
              <p className="card-description">Enhanced design options with advanced analytics.</p>
              <div className="card-price">Rs900</div>
              <Link to="/order/premium">
                <button className="order-btn">Order Now</button>
              </Link>
            </div>

            <div className="pricing-card">
              <div className="card-header">
                <h3>Elite E-VOX Card</h3>
                <span className="elite-tag">Top Rated</span>
              </div>
              <div className="card-title">Elite</div>
              <p className="card-description">Luxury metal cards with premium finishes and all features.</p>
              <div className="card-price">Rs1500</div>
              <Link to="/order/elite">
                <button className="order-btn">Order Now</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Networking?</h2>
          <p>Join thousands of professionals who have upgraded to E-VOX NFC business cards.</p>
          <Link to="/signup">
            <button className="cta-btn primary-btn">Get Started Today</button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;