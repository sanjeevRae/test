import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from './HeroSection';
import './HomePage.css';
import './HomePageUpdate.css';
import './PricingStyles.css';
import './ContactStyles.css';
import './FooterStyles.css';
import './ProfileCardFixes.css';
import './HomePageResponsive.css';
import './FeaturesResponsive.css';
import './ProfileCardResponsive.css';
import './ProfileCardFullImage.css';

const HomePage = () => {
  const location = useLocation();
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const contactRef = useRef(null);
  const [activeTab, setActiveTab] = useState('team');
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Improved scroll to section function
  const scrollToRef = (ref) => {
    if (ref && ref.current) {
      const yOffset = -80; // Navbar height offset
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };
  const handleTabChange = (tab) => {
    // Add fade-out effect before changing tab
    const teamContent = document.querySelector('.team-content');
    if (teamContent) {
      teamContent.style.opacity = '0';
      
      // Change tab after brief animation
      setTimeout(() => {
        setActiveTab(tab);
        // Fade back in
        setTimeout(() => {
          teamContent.style.opacity = '1';
        }, 50);
      }, 200);
    } else {
      setActiveTab(tab);
    }
  };
    // Function to handle next tab with animation
  const handleNextTab = () => {
    // Determine next tab
    let nextTab;
    if (activeTab === 'team') {
      nextTab = 'support';
    } else if (activeTab === 'support') {
      nextTab = 'strategy';
    } else {
      nextTab = 'team';
    }
    
    // Use the enhanced tab change function
    handleTabChange(nextTab);
  };
  
  // Function to handle previous tab with animation
  const handlePrevTab = () => {
    // Determine previous tab
    let prevTab;
    if (activeTab === 'team') {
      prevTab = 'strategy';
    } else if (activeTab === 'support') {
      prevTab = 'team';
    } else {
      prevTab = 'support';
    }
    
    // Use the enhanced tab change function
    handleTabChange(prevTab);
  };

  const handleBillingToggle = (cycle) => {
    setBillingCycle(cycle);
  };
  useEffect(() => {
    // Set smooth scrolling for the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
      // Handle hash navigation or scrollTo from router state
    const handleInitialScroll = () => {
      // First, check if there's a scrollTo in router state
      if (location.state && location.state.scrollTo) {
        const section = document.getElementById(location.state.scrollTo);
        if (section) {
          // Use a slightly longer timeout to ensure all elements are fully rendered
          setTimeout(() => {
            // Get the element's position relative to the document
            const rect = section.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Calculate the absolute position
            const scrollToY = rect.top + scrollTop - 80; // 80px offset for navbar
            
            // Scroll to that position
            window.scrollTo({
              top: scrollToY,
              behavior: 'smooth'
            });
          }, 150);
        }
        return;
      }
      
      // Then check for hash in URL
      if (location.hash) {
        const id = location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
            
            // Additional offset adjustment for navbar
            window.scrollBy({
              top: -80,
              behavior: 'smooth'
            });
          }, 100);
        }
      }
    };

    // Ensure sections are visible with necessary CSS properties
    const ensureSectionsVisible = () => {
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        section.style.display = 'block';
        section.style.visibility = 'visible';
        section.style.opacity = '1';
      });
    };

    // Handle stacked cards scroll animation
    const handleStackedCardsScroll = () => {
      const sevenPreviewContainer = document.querySelector('.seven-preview-container');
      if (!sevenPreviewContainer) return;

      const scrollHandler = () => {
        const rect = sevenPreviewContainer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate scroll progress through the section
        const scrollProgress = Math.max(0, Math.min(1, 
          (windowHeight - rect.top) / (windowHeight + rect.height)
        ));
        
        // Add 'spread' class when user scrolls into the section
        if (scrollProgress > 0.1 && scrollProgress < 0.9) {
          sevenPreviewContainer.classList.add('spread');
        } else {
          sevenPreviewContainer.classList.remove('spread');
        }

        // Optional: Add individual card interactions
        const cards = sevenPreviewContainer.querySelectorAll('.preview-section');
        cards.forEach((card, index) => {
          const cardProgress = Math.max(0, Math.min(1, 
            (scrollProgress - (index * 0.1)) * 2
          ));
          
          // You can add more dynamic effects here based on cardProgress
          if (cardProgress > 0.3) {
            card.style.opacity = '1';
          }
        });
      };

      // Attach scroll listener
      window.addEventListener('scroll', scrollHandler);
      
      // Initial check
      scrollHandler();
      
      // Return cleanup function
      return () => {
        window.removeEventListener('scroll', scrollHandler);
      };
    };

    // Execute all functions
    ensureSectionsVisible();
    handleInitialScroll();
    const cleanupScrollHandler = handleStackedCardsScroll();

    // Clean up on unmount
    return () => {
      document.documentElement.style.scrollBehavior = '';
      if (cleanupScrollHandler) cleanupScrollHandler();
    };
  }, [location]);
  return (
    <div className="home-page">
      {/* Hero Section */}
      <HeroSection />
      
      {/* About Section */}
      <section id="about" className="about-section workforce-hero" ref={aboutRef}>
        <div className="container">
          <div className="workforce-content">

            <div className="profile-showcase">              
              <div className="profile-cards">
                <div className="profile-card">
                  <div className="card-header">
                    <span>Digital Profile</span>
                    <span className="arrow-icon">↗</span>
                  </div>                  <div className="profile-image">
                    <img src="/src/assets/About1.png" alt="About" loading="lazy" />
                  </div>
                  <div className="card-content">
                    <p>Your NFC-powered identity—always current, instantly shared.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="workforce-text">
              <h1>Quickly Expand Your  <span className="highlight">Network</span>.</h1>
              <p className="subtitle">Take advantage of smart NFC technology to connect with who you want, whenever you want – with just one tap.</p>
              
              <div className="options-container">
                <div className="option-card employees">
                  <div className="option-label">Connect</div>
                  <div className="avatars-group">
                    <div className="avatar"><img src="/src/assets/user1.jpg" alt="Employee 1" loading="lazy" /></div>
                    <div className="avatar"><img src="/src/assets/avatar2.jpg" alt="Employee 2" loading="lazy" /></div>
                    <div className="avatar"><img src="/src/assets/user2.jpg" alt="Employee 3" loading="lazy" /></div>
                  </div>
                  <h3>Build Your Digital Network</h3>
                  <div className="arrow-icon"></div>
                </div>
                <div className="option-card contractors">
                  <div className="option-label">Scale</div>
                  <div className="contractor-image">
                    <img src="/src/assets/Scale1.jpg" alt="Contractor" loading="lazy" />
                  </div>
                  <h3>Grow Your Business Network
                  </h3>
                 
                </div>

                
              </div>
            </div>         
            
           {/* hh */}

          </div>
        </div>  
      </section>
         
         {/* {Seven item preview section} */}
         <section className="seven-preview-container" id="seven-preview">
           <div className="stacked-cards">
             <div className="preview-section section-1">
               <div className="section-content">
                 <h2>Digital Identity</h2>
                 <p>Transform your professional presence with smart NFC technology that creates lasting impressions</p>
                 <video 
                   src="/src/assets/intro.mp4" 
                   autoPlay 
                   muted 
                   loop 
                   className="section-video"
                 />
                 <div className="card-metric">
                   <span className="metric-label">Active Users</span>
                   <span className="metric-value">2.4K+</span>
                 </div>
               </div>
             </div>
             
             <div className="preview-section section-2">
               <div className="section-content">
                 <h2>Instant Connection</h2>
                 <p>Share your details with just one tap - no apps required. Universal NFC compatibility across all devices</p>
                 <div className="card-metric">
                   <span className="metric-label">Avg. Share Time</span>
                   <span className="metric-value">2.1s</span>
                 </div>
               </div>
             </div>
             
             <div className="preview-section section-3">
               <div className="section-content">
                 <h2>Eco-Friendly</h2>
                 <p>Replace hundreds of paper cards with one sustainable solution that reduces environmental impact</p>
                 <div className="card-metric">
                   <span className="metric-label">Paper Cards Saved</span>
                   <span className="metric-value">500+</span>
                 </div>
               </div>
             </div>
             
             <div className="preview-section section-4">
               <div className="section-content">
                 <h2>Always Updated</h2>
                 <p>Cloud-based profiles ensure your information is never outdated. Real-time synchronization across all cards</p>
                 <div className="card-metric">
                   <span className="metric-label">Update Speed</span>
                   <span className="metric-value">Instant</span>
                 </div>
               </div>
             </div>
             
             <div className="preview-section section-5">
               <div className="section-content">
                 <h2>Multi-Profile</h2>
                 <p>Switch between work, personal, and event profiles seamlessly. One card, infinite possibilities</p>
                 <div className="card-metric">
                   <span className="metric-label">Profile Types</span>
                   <span className="metric-value">3+</span>
                 </div>
               </div>
             </div>
             
             <div className="preview-section section-6">
               <div className="section-content">
                 <h2>Analytics</h2>
                 <p>Track your networking success with detailed insights and engagement metrics for better connections</p>
                 <div className="card-metric">
                   <span className="metric-label">Data Points</span>
                   <span className="metric-value">15+</span>
                 </div>
               </div>
             </div>
             
             <div className="preview-section section-7">
               <div className="section-content">
                 <h2>Future Ready</h2>
                 <p>Quantum-resistant security for tomorrow's networking needs. Built for the next generation of technology</p>
                 <div className="card-metric">
                   <span className="metric-label">Security Level</span>
                   <span className="metric-value">256-bit</span>
                 </div>
               </div>
             </div>
           </div>
         </section>
         
          {/* Features Section */}
      <section id="features" className="features-section" ref={featuresRef}>
        <div className="container">
          <div className="section-header">
            <h2 className="main-title">
             Smart Networking, <span className="line-break">On Demand.</span>
            </h2>
          </div>
          <div className="features-showcase">
            <button className="showcase-nav-btn prev" aria-label="Previous slide" onClick={handlePrevTab}>
              <span>←</span>
            </button>
            <button className="showcase-nav-btn next" aria-label="Next slide" onClick={handleNextTab}>
              <span>→</span>
            </button>
            
            <div className="team-tabs">
              <button 
                className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                onClick={() => handleTabChange('team')}
                aria-selected={activeTab === 'team'}
                role="tab"
              >
                Green NFC 
              </button>
              <button 
                className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`}
                onClick={() => handleTabChange('support')}
                aria-selected={activeTab === 'support'}
                role="tab"
              >
                Instant Sharing
              </button>
              <button 
                className={`tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
                onClick={() => handleTabChange('strategy')}
                aria-selected={activeTab === 'strategy'}
                role="tab"
              >
                Future-Proof
              </button>
            </div><div className="team-content">
              {activeTab === 'team' && (
                <>
                  <div className="team-cards">
                    <div className="team-card">
                      <div className="team-member-info">
                        <h3>100% Paperless</h3>
                       
                      </div>
                      <div className="team-member-image">
                        <img src="/src/assets/paperless.jpg" alt="No paper" />
                      </div>
                      <div className="team-member-role">
                        <span>500+ cards saved yearly</span>
                        
                      </div>
                    </div>
                    
                    <div className="team-card">
                      <div className="team-member-info">
                        <h3>Recycled Materials</h3>
                       
                      </div>
                      <div className="team-member-image">
                        <img src="/src/assets/recycle1.jpg" alt="Recycle" />
                      </div>
                      <div className="team-member-role">
                          <span>Biodegradable premium chips</span>
                        
                      </div>
                    </div>
                    
                    <div className="team-card">
                      <div className="team-member-info">
                        <h3> Climate Positive</h3>
                       
                      </div>
                      <div className="team-member-image">
                        <img src="/src/assets/carbon.jpg" alt="Carbon Neutral" />
                      </div>
                      <div className="team-member-role">
                        <span>Removes 2x our carbon footprint</span>
                       
                      </div>
                    </div>
                  </div>
                  
                  <div className="team-description">
                    <p className="team-tag">Green Networking</p>
                    <h2>Transforming Business Connections Sustainably</h2>
                    <p>
                     EVOX replaces 500+ paper cards annually per user with elegant, tap-to-share technology that grows relationships - not landfills.
                    </p>
                    <a href="#" className="read-more-link">Read More</a>
                  </div>
                </>
              )}

              {activeTab === 'support' && (
                <>
                  <div className="team-cards">
                    <div className="team-card">
                      <div className="team-member-info">
                        <h3>Tap-to-Share</h3>
                       
                      </div>
                      <div className="team-member-image">
                        <img src="/src/assets/tap&share.jpg" alt="T&S" />
                      </div>
                      <div className="team-member-role">
                        <span>Supports NFC smartphones</span>
                       
                      </div>
                    </div>
                    
                    <div className="team-card">
                      <div className="team-member-info">
                        <h3>Zero App Needed</h3>
                       
                      </div>
                      <div className="team-member-image">
                        <img src="/src/assets/NoAPP2.jpg" alt="Zero-App" />
                      </div>
                      <div className="team-member-role">
                        <span>No app's need to downloads </span>
                        
                      </div>
                    </div>
                    
                    <div className="team-card">
                      <div className="team-member-info">
                        <h3>Multi-Profile</h3>
                      </div>
                      <div className="team-member-image">
                        <img src="/src/assets/multi profile.jpg" alt="Multi-Profile" />
                      </div>
                      <div className="team-member-role">
                        <span>Work/Personal/Event</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="team-description">
                    <p className="team-tag">Connections in seconds</p>
                    <h2>Redefining Professional First Impressions</h2>
                    <p>
                    EVOX delivers contact details faster than handshakes through universal NFC/QR technology - no apps, no typing, just instant credibility.</p>
                    <a href="#" className="read-more-link">Read More</a>
                  </div>
                </>
              )}

              {activeTab === 'strategy' && (
                <>
                  <div className="team-cards">
                    <div className="team-card">
                      <div className="team-member-info">
                        <h3>Cloud-Based Profiles </h3>
                      </div>
                      <div className="team-member-image">
                        <img src="/src/assets/cloud.jpg" alt="Future-Proof " />
                      </div>
                      <div className="team-member-role">
                        <span>Update all cards</span>
                      </div>
                    </div>
                    
                    <div className="team-card">
                      <div className="team-member-info">
                        <h3>Cross-Platform Ready</h3>
                      </div>
                      <div className="team-member-image">
                        <img src="/src/assets/cross platform.jpg" alt="Cross Platform" />
                      </div>
                      <div className="team-member-role">
                        <span>5+ year compatibility</span>
                      </div>
                    </div>
                    
                    <div className="team-card">
                      <div className="team-member-info">
                        <h3>Encrypted Mode</h3>
                      </div>
                      <div className="team-member-image">
                        <img src="/src/assets/encryption.jpg" alt="Encrypted Future Mode" />
                      </div>
                      <div className="team-member-role">
                        <span>Quantum-ready security</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="team-description">
                    <p className="team-tag">Always ahead</p>
                    <h2>Architecting Tomorrow’s Networking Today</h2>
                    <p>
                     EVOX cards self-update with cloud-based profiles and quantum-resistant security, ensuring your connections never go obsolete.
                      </p>
                    <a href="#" className="read-more-link">Read More</a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>        {/* Pricing Section */}
      <section id="pricing" className="pricing-section" ref={pricingRef}>
        <div className="container">
          <div className="pricing-header">
            <h2>Choose your right plan!</h2>
            <p className="pricing-subtitle">
              Select from best plans, ensuring a perfect match. Need more or less?
              Customize your subscription for a seamless fit!
            </p>
            <div className="pricing-toggle">
              <button 
                className={`toggle-option ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => handleBillingToggle('monthly')}
                aria-pressed={billingCycle === 'monthly'}
              >
                Monthly
              </button>
              <button 
                className={`toggle-option ${billingCycle === 'quarterly' ? 'active' : ''}`}
                onClick={() => handleBillingToggle('quarterly')}
                aria-pressed={billingCycle === 'quarterly'}
              >
                Annually (save 10%)
              </button>
              <button 
                className={`toggle-option ${billingCycle === 'direct' ? 'active' : ''}`}
                onClick={() => handleBillingToggle('direct')}
                aria-pressed={billingCycle === 'direct'}
              >
                Direct
              </button>
            </div>
          </div>
          
          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="plan-badge">
                <span>Standard</span>
              </div>
              <p className="plan-description">
              Our classic NFC business card with essential features.
              </p>              <div className="plan-price">                <h3>
                  {billingCycle === 'monthly' && 'Rs15'}
                  {billingCycle === 'quarterly' && 'Rs162'}
                  {billingCycle === 'direct' && 'Rs500'}
                </h3>
                
              </div>
              <ul className="plan-features">
                <li>
                  <span className="check-icon">✓</span>
                  <span>Personalized Card</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span> Unlimited Sharing </span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Update Anytime </span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Limited Contact Details, Social Media links, etc</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Cost Rs 100 per card if need to re-print in case of damage</span>
                </li>
              </ul>
              <button className="plan-cta">Get started</button>
            </div>
            
            <div className="pricing-card">
              <div className="plan-badge plus">
                <span>Premium</span>
              </div>
              <p className="plan-description">
                Enhanced design options with advanced analytics.
                 </p>              <div className="plan-price">                <h3>
                  {billingCycle === 'monthly' && 'Rs30'}
                  {billingCycle === 'quarterly' && 'Rs324'}
                  {billingCycle === 'direct' && 'Rs900'}
                </h3>
               
              </div>
              <ul className="plan-features">
                <li>
                  <span className="check-icon">✓</span>
                  <span>All Standard Features</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Custom Design Options</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Analytics and Insights</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Unlimited Contact Details, Bio, etc</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Up to two cards can be reprinted for free, after that, each damaged card will cost Rs 50</span>
                </li>
              </ul>
              <button className="plan-cta">Get started</button>
            </div>
            
            <div className="pricing-card custom">
              <div className="plan-badge custom">
                <span>Elite</span>
              </div>
              <p className="plan-description">
               Advanced security cards with premium finishes and all features.
                 </p>              <div className="plan-price">                <h3>
                  {billingCycle === 'monthly' && 'Rs60'}
                  {billingCycle === 'quarterly' && 'Rs648'}
                  {billingCycle === 'direct' && 'Rs1500'}
                </h3>
                
              </div>
              <ul className="plan-features">
                <li>
                  <span className="check-icon">✓</span>
                  <span>All Premium Features</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Custom Design Options</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Limited team trials available</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Advanced security, integration, and authentication</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Unlimited replacement in the case of damage, but not in the situation of mishandling</span>
                </li>
              </ul>
              <button className="plan-cta custom">Get started</button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section id="contact" className="contact-section" ref={contactRef}>
        <div className="container">
          <div className="contact-container">
            <div className="contact-form-container">
              <div className="contact-form-header">
                <h2>Get matched with the perfect</h2>
                <p>freelancer for your design project</p>
              </div>
                <form className="contact-form">
                <div className="form-field-group">
                  <div className="form-field animated-field">
                    <label htmlFor="firstName">First name</label>
                    <div className="input-container">
                      <i className="field-icon">👤</i>
                      <input type="text" id="firstName" placeholder="First name" required />
                    </div>
                  </div>
                  
                  <div className="form-field animated-field">
                    <label htmlFor="lastName">Last name</label>
                    <div className="input-container">
                      <input type="text" id="lastName" placeholder="Last name" required />
                    </div>
                  </div>
                </div>
                
                <div className="form-field animated-field">
                  <label htmlFor="email">Email</label>
                  <div className="input-container">
                    <i className="field-icon">✉️</i>
                    <input type="email" id="email" placeholder="Your email address" required />
                  </div>
                </div>
                
                <div className="form-field animated-field">
                  <label htmlFor="phone">Phone number</label>
                  <div className="phone-select">
                    <div className="select-wrapper">
                      <i className="field-icon phone-icon">📱</i>
                      <select id="countryCode" aria-label="Country code">
                        <option value="+977">NP</option>
                        <option value="+1">US</option>
                        <option value="+91">IN</option>
                        {/* Reduced country list for mobile */}
                        <option value="+44">GB</option>
                        <option value="+61">AU</option>
                        <option value="+86">CN</option>
                        <option value="+49">DE</option>
                        <option value="+33">FR</option>
                        <option value="+81">JP</option>
                        <option value="+7">RU</option>
                        <option value="+971">AE</option>
                        {/* Add more options as needed but keep it concise for mobile */}
                      </select>
                    </div>
                    <input type="tel" className="phone-input" placeholder="Phone number" aria-label="Phone number" />
                  </div>
                </div>
                
                <div className="form-field animated-field">
                  <label htmlFor="comments">Comments</label>
                  <div className="input-container textarea-container">
                    <i className="field-icon textarea-icon">💬</i>
                    <textarea 
                      id="comments" 
                      placeholder="Additional details..." 
                      rows="3"
                      required
                    ></textarea>
                  </div>
                </div>
                
                <button type="submit" className="submit-btn">
                  <span className="btn-text">Send Message</span>
                  <span class="btn-icon">→</span>
                </button>
              </form>
            </div>
            
            <div className="contact-image">
              <div className="studio-label">
                <p>Evox</p>
                <p>• Kathmandu, Nepal</p>
              </div>
              
              <div className="contact-info-content">
                <h2 className="contact-info-title">Access our global talent network</h2>
                <p className="contact-info-subtitle"></p>
              </div>
              
              <div className="footer-feature-icons">
                <div className="footer-feature-icon">
                  <span>🌐</span>
                  <span>Access our global talent network of 100k+ star talents.</span>
                </div>
                <div className="footer-feature-icon">
                  <span>🛠️</span>
                  <span>Explore projects and pick the perfect match for you.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>         {/* Footer Section */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>COMPANY</h3>
              <ul className="footer-links">
                <li><a href="#about" onClick={(e) => {e.preventDefault(); scrollToSection('about');}}>About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#contact" onClick={(e) => {e.preventDefault(); scrollToSection('contact');}}>Contact</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>SUPPORT</h3>
              <ul className="footer-links">
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>SOCIAL</h3>
              <div className="social-icons">
                <a href="#" className="social-icon" aria-label="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="LinkedIn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Evox. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;