import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from './HeroSection';
import './HomePage.css';

const HomePage = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle hash navigation on page load
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          window.scrollTo({
            behavior: 'smooth',
            top: element.offsetTop - 80 // Offset for navbar
          });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <HeroSection />
      
      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="section-header">
            <h2>About <span className="highlight">E-VOX</span></h2>
            <p className="section-subtitle">The future of networking is here</p>
          </div>
          
          <div className="about-content">
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
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Smart Features</h2>
            <p className="section-subtitle">Why choose E-VOX digital cards</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Instant Share</h3>
              <p>Share your digital profile with a simple tap using NFC technology</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Always Updated</h3>
              <p>Update your information anytime without needing new cards</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Track when and how often your card is viewed</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure</h3>
              <p>You control what information is shared and with whom</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>Eco-friendly</h3>
              <p>Eliminate paper waste and reduce your carbon footprint</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Customizable</h3>
              <p>Personalize your digital card with your brand colors and logo</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="container">
          <div className="section-header">
            <h2>Simple Pricing</h2>
            <p className="section-subtitle">Choose the plan that works for you</p>
          </div>
          
          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="card-header">
                <h3>Standard</h3>
                <span className="popular-tag">Popular</span>
              </div>
              <div className="card-price">
                <span className="price">Rs500</span>
                <span className="period">one-time</span>
              </div>
              <ul className="card-features">
                <li>NFC-enabled card</li>
                <li>Basic digital profile</li>
                <li>Contact information</li>
                <li>Social media links</li>
                <li>Email support</li>
              </ul>
              <button className="order-btn">Get Started</button>
            </div>
            
            <div className="pricing-card featured">
              <div className="card-header">
                <h3>Premium</h3>
                <span className="value-tag">Best Value</span>
              </div>
              <div className="card-price">
                <span className="price">Rs900</span>
                <span className="period">one-time</span>
              </div>
              <ul className="card-features">
                <li>Everything in Standard</li>
                <li>Enhanced design options</li>
                <li>Analytics dashboard</li>
                <li>Link tracking</li>
                <li>Priority support</li>
              </ul>
              <button className="order-btn">Get Started</button>
            </div>
            
            <div className="pricing-card">
              <div className="card-header">
                <h3>Elite</h3>
                <span className="elite-tag">Top Rated</span>
              </div>
              <div className="card-price">
                <span className="price">Rs1500</span>
                <span className="period">one-time</span>
              </div>
              <ul className="card-features">
                <li>Everything in Premium</li>
                <li>Metal card options</li>
                <li>Premium finishes</li>
                <li>Custom branding</li>
                <li>24/7 VIP support</li>
              </ul>
              <button className="order-btn">Get Started</button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="section-header">
            <h2>Get In Touch</h2>
            <p className="section-subtitle">We'd love to hear from you</p>
          </div>
          
          <div className="contact-container">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div className="contact-text">
                  <h3>Address</h3>
                  <p>123 Business Avenue, Tech Park, Bangalore 560001, India</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-text">
                  <h3>Phone</h3>
                  <p>+91 8800 123 456</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div className="contact-text">
                  <h3>Email</h3>
                  <p>contact@evox.com</p>
                </div>
              </div>
              
              <div className="social-links">
                <a href="#" className="social-link facebook">Facebook</a>
                <a href="#" className="social-link twitter">Twitter</a>
                <a href="#" className="social-link instagram">Instagram</a>
                <a href="#" className="social-link linkedin">LinkedIn</a>
              </div>
            </div>
            
            <div className="contact-form-container">
              <form className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input type="text" id="name" placeholder="John Doe" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" placeholder="you@example.com" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" placeholder="How can we help?" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" rows="5" placeholder="Your message here..." required></textarea>
                </div>
                
                <button type="submit" className="submit-btn">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Networking?</h2>
          <p>Join thousands of professionals who have upgraded to E-VOX NFC business cards.</p>
          <button className="cta-btn">Get Started Today</button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;