import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import emailjs from 'emailjs-com';
import './EvoxPage.css';
import './ContactStyles.css';
import './FooterStyles.css';
import './CybersecurityServices.css';
import './CyberProcessSection.css';
import backgroundVideo from '../../public/src/assets/background.webm';



const EvoxPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [isAutoAnimating, setIsAutoAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const contactRef = useRef(null);
  const sliderRef = useRef(null);
  const carouselRef = useRef(null);
  
  // Form field states
  const [formFields, setFormFields] = useState({
    firstName: { focused: false, hasContent: false },
    email: { focused: false, hasContent: false },
    phone: { focused: false, hasContent: false },
    comments: { focused: false, hasContent: false }
  });
  
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ text: '', type: '' });
  
  // Handle form field focus/blur/change
  const handleFieldFocus = (fieldName) => {
    setFormFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], focused: true }
    }));
  };
  
  const handleFieldBlur = (fieldName, value) => {
    setFormFields(prev => ({
      ...prev,
      [fieldName]: { focused: false, hasContent: value.length > 0 }
    }));
  };
  
  const handleFieldChange = (fieldName, value) => {
    setFormFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], hasContent: value.length > 0 }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ text: '', type: '' });

    try {
      const result = await emailjs.sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID, 
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID, 
        e.target,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY 
      );

      console.log('Email sent successfully:', result.text);
      setSubmitMessage({ text: 'Message sent successfully! We\'ll get back to you soon.', type: 'success' });
      e.target.reset(); 
      
      setFormFields({
        firstName: { focused: false, hasContent: false },
        email: { focused: false, hasContent: false },
        phone: { focused: false, hasContent: false },
        comments: { focused: false, hasContent: false }
      });
    } catch (error) {
      console.error('Email sending failed:', error.text);
      setSubmitMessage({ text: 'Failed to send message. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleEvoxScroll = () => {
      // Only trigger if we're on EvoxPage and the component is mounted
      if (location.pathname !== '/evox' || !document.querySelector('.evox-container')) return;
      
      setScrollY(window.scrollY);
      
      const evoxSections = ['hero', 'services', 'process', 'innovation', 'about', 'contact'];
      const scrollPosition = window.scrollY + 200;
      
      evoxSections.forEach(section => {
        const element = document.getElementById(section);
        if (element && element.closest('.evox-container')) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
          }
        }
      });
    };

    // Only add listener if we're on EvoxPage
    if (location.pathname === '/evox') {
      window.addEventListener('scroll', handleEvoxScroll, { passive: true });
    }
    
    return () => {
      window.removeEventListener('scroll', handleEvoxScroll);
    };
  }, [location.pathname]);

  // Handle navigation from other pages with scroll target
  useEffect(() => {
    const handleInitialScroll = () => {
      if (location.state && location.state.scrollTo) {
        const sectionId = location.state.scrollTo;
        const element = document.getElementById(sectionId);
        if (element) {
          setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollToY = rect.top + scrollTop - 80; // 80px offset for navbar
            
            window.scrollTo({
              top: scrollToY,
              behavior: 'smooth'
            });
          }, 200);
        }
        // Clear the navigation state
        window.history.replaceState({}, document.title, location.pathname);
      }
    };

    handleInitialScroll();
  }, [location]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            setIsAutoAnimating(true);
            
            const sliderElement = document.querySelector('.slider-wrapper');
            if (sliderElement) {
              sliderElement.classList.add('auto-animating');
              
              setTimeout(() => {
                setIsAutoAnimating(false);
                if (sliderElement) {
                  sliderElement.classList.remove('auto-animating');
                }
                setTimeout(() => {
                  setSliderValue(50);
                }, 500);
              }, 4000);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sliderRef.current) {
      observer.observe(sliderRef.current);
    }

    return () => {
      if (sliderRef.current) {
        observer.unobserve(sliderRef.current);
      }
    };
  }, []); 

  useEffect(() => {
    if (carouselRef.current) {
      const stepWidth = 100 / 3; 
      const translateX = -(currentStep * stepWidth);
      
      carouselRef.current.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      carouselRef.current.style.transform = `translateX(${translateX}%)`;
      
      const indicators = document.querySelectorAll('.carousel-indicators .indicator');
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentStep);
      });
    }
  }, [currentStep]);

  const nextStep = () => {
    setCurrentStep((prev) => prev < 5 ? prev + 1 : prev); 
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev > 0 ? prev - 1 : prev); 
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const evoxScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false); 
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="evox-container">
      <Helmet>
        <title>E-VOX | Top IT Company Nepal | NFC Business Cards | Nepali IT Solutions</title>
        <meta name="description" content="E-VOX is Nepal's leading IT company, providing innovative digital solutions, NFC business cards, cybersecurity, and IT infrastructure. Trusted Nepali IT company for businesses and professionals." />
        <meta name="keywords" content="E-VOX, e-vox, EVOX, e-VOX, eVOX, evox, E-voX, Evox, IT, IT Nepal, Nepali IT Company, IT Company, Nepal IT, Nepal IT company, Top IT company, NEPAL TOP IT COMPANY, NFC business cards Nepal, digital business cards, Kathmandu IT, best IT company Nepal, Exoa, Exoa Nepal, digital transformation Nepal, technology Nepal, Nepali tech, Nepali IT, Nepali NFC, Nepali digital card, Nepali business card, Nepali software, Nepali cybersecurity, Nepali IT infrastructure" />
        <meta property="og:title" content="E-VOX | Nepal's Top IT Company & NFC Business Cards" />
        <meta property="og:description" content="Nepal's trusted IT company for digital transformation, NFC business cards, cybersecurity, and more. E-VOX: Your partner for IT in Nepal." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://e-voxtech.com/" />
        <meta property="og:image" content="https://evoxnepal.com/media/social-preview.jpg" />
          <meta property="og:site_name" content="E-VOX" />
          <meta property="og:locale" content="en_NP" />
          <meta property="article:publisher" content="https://www.facebook.com/evoxtechofficial/" />
          <meta property="og:image" content="https://www.facebook.com/photo/?fbid=122093364452979541&set=a.122093347208979541" />
        <meta property="og:title" content="E-VOX | Nepal's Top IT Company & NFC Business Cards" />
        <meta property="og:description" content="Nepal's trusted IT company for digital transformation, NFC business cards, cybersecurity, and more. E-VOX: Your partner for IT in Nepal." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.facebook.com/evoxtechofficial/" />
        <meta property="og:image" content="https://www.facebook.com/photo/?fbid=122093364452979541&set=a.122093347208979541" />
        {/* Structured Data for Organization */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "E-VOX Pvt. Ltd.",
            "legalName": "E-VOX Pvt. Ltd.",
            "url": "https://evoxnepal.com",
            "logo": "https://evoxnepal.com/media/logo.png",
            "sameAs": [
              "https://www.facebook.com/evoxtechofficial/",
              "https://www.linkedin.com/company/evox-tech/",
              "https://www.instagram.com/e.voxtech/"
            ],
            "description": "E-VOX is Nepal's leading IT company, providing NFC business cards, cybersecurity, digital transformation, and IT solutions for Nepali businesses.",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Putalisadak",
              "addressLocality": "Kathmandu",
              "addressRegion": "Bagmati",
              "postalCode": "44600",
              "addressCountry": "NP"
            },
            "contactPoint": [
              {
                "@type": "ContactPoint",
                "telephone": "+977-1-5971342",
                "contactType": "office",
                "areaServed": "NP",
                "availableLanguage": ["English", "Nepali"]
              }
            ],
            "founder": "E-VOX Team",
            "foundingDate": "2025-01-01",
            "foundingLocation": "Kathmandu, Nepal"
          }
        `}</script>
      </Helmet>
      {/* Navigation */}
      <nav className="evox-nav">
        <div className="nav-brand">
          <span className="brand-text">E-VOX</span>
          <span className="brand-subtitle">Technology</span>
        </div>
        <div className="nav-links desktop-nav">
          {['Cyber Security', 'IT Infrastructure', 'E-VOX Card', 'Career', 'Contact'].map((item) => {
            let isActive = false;
            if (item === 'Cyber Security' && activeSection === 'services') {
              isActive = true;
            } else if (item === 'IT Infrastructure' && activeSection === 'process') {
              isActive = true;
            } else if (item === 'E-VOX Card' && activeSection === 'innovation') {
              isActive = true;
            }
             else if (item === 'Contact' && activeSection === 'contact') {
              isActive = true;
            }
           
            
            return (
              <button
                key={item}
                className={`evox-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item === 'Cyber Security') {
                    evoxScrollToSection('services');
                  } else if (item === 'IT Infrastructure') {
                    evoxScrollToSection('process');
                  } else if (item === 'E-VOX Card') {
                    evoxScrollToSection('innovation');
                  }
                  else if (item === 'Career') {
                    navigate('/careers');
                  }
                  else if (item === 'Contact') {
                    evoxScrollToSection('contact');
                  }
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
        <button className="lets-talk-btn" onClick={() => navigate('/login')}>Login →</button>
      </nav>


      {/* explore section */}
      <section id="hero" className="hero-section">
        <video className="hero-video-bg" autoPlay loop muted playsInline>
          <source src={backgroundVideo} type="video/webm" />
        </video>
        <h1 style={{position:'absolute',left:'-9999px',height:0,width:0,overflow:'hidden'}}>E-VOX | Evox | Top IT Company Nepal | Nepali IT Company | NFC Business Cards | Exoa | IT Nepal | Nepal IT Company | Digital Solutions Kathmandu</h1>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="title-white">E-VOX Nepal’s Leading IT and </span>{' '}
              <span className="title-green">Cybersecurity Company</span>
            </h1>
            <div className="hero-cta" style={{ marginTop: '3rem', paddingTop: '2rem' }}>
              <button 
                className="cta-primary"
                onClick={() => evoxScrollToSection('about')}
                aria-label="Explore E-VOX, Nepal's leading IT company"
              >
                Explore E-VOX
              </button>
              <button 
                className="cta-secondary"
                onClick={() => evoxScrollToSection('services')}
                aria-label="Discover IT and NFC solutions in Nepal"
              >
                Discover Our IT Solutions →
              </button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-folder-open"></i></div>
            <div className="stat-number">50+</div>
            <div className="stat-label">IT Solutions</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-thumbs-up"></i></div>
            <div className="stat-number">99%</div>
            <div className="stat-label">Nepal Client Satisfaction</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-shield-alt"></i></div>
            <div className="stat-number">10K+</div>
            <div className="stat-label">Cyber Threats Neutralized</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-clock"></i></div>
            <div className="stat-number">24hr</div>
            <div className="stat-label">24/7 IT Support Nepal</div>
          </div>
        </div>
      </section>

      {/* explore Section */}
      <section id="services" className="cybersecurity-services-section">
        <div className="cybersecurity-container">
          <div className="cybersecurity-content">
            <div className="cybersecurity-header">
              <h2>
                <span className="title-light">Guarding</span>{' '}
                <span className="title-highlight">Your</span>{' '}
                <span className="title-highlight">Critical</span>{' '}
                <span className="title-light">Infrastructure.</span>
              </h2>
              <p className="cybersecurity-subtitle">
                Our IT operations specialists ensure the relentless security and integrity of your core systems and data.
              </p>
              <button className="all-services-btn">
                ALL SERVICES <i className="fas fa-arrow-right"></i>
              </button>
            </div>

            <div className="security-services-grid">
              {/* Network Security Card */}
              <div className="security-service-card" data-number="01">
                <div className="service-number">01</div>
                <div className="service-icon">
                  <div className="icon-container network-security-icon">
                    <img src="./src/assets/shield.png" alt="Network Security" className="service-icon-image" />
                  </div>
                </div>
                <div className="service-content">
                  <h3>Network Security & Protection</h3>
                  <p>We secure your digital perimeter. Our Network Protection Service is engineered to detect and block unauthorized access across your entire infrastructure.</p>
                  <button className="view-details-btn">
                    View Details <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>

              {/* Threat Intelligence Card */}
              <div className="security-service-card" data-number="02">
                <div className="service-number">02</div>
                <div className="service-icon">
                  <div className="icon-container threat-intelligence-icon">
                    <img src="./src/assets/laptop.png" alt="Threat Intelligence" className="service-icon-image" />
                  </div>
                </div>
                <div className="service-content">
                  <h3>Threat Intelligence & Analysis</h3>
                  <p>Transform uncertainty into a strategic defense plan. We don't just report threats; we analyze them to predict their likely impact on your unique environment, enabling faster, more accurate incident response.</p>
                  <button className="view-details-btn">
                    View Details <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>

              {/* Endpoint Security Card */}
              <div className="security-service-card" data-number="03">
                <div className="service-number">03</div>
                <div className="service-icon">
                  <div className="icon-container endpoint-security-icon">
                    <img src="./src/assets/lock.png" alt="Endpoint Security" className="service-icon-image" />
                  </div>
                </div>
                <div className="service-content">
                  <h3>Endpoint Security Management</h3>
                  <p>Secure your workforce, wherever they work. We ensure every device connecting to your network is protected, compliant, and monitored, closing the most common attack vector for modern breaches.</p>
                  <button className="view-details-btn">
                    View Details <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* our solution section */}
      <section id="process" className="cyber-process-section">
        <div className="process-container">
          <div className="process-header">
            <h2>
              <span className="process-title-light">Our Proven Process</span>{' '}
              <span className="process-title-highlight">For</span>{' '}
              <span className="process-title-highlight">Modern</span>{' '}
              <span className="process-title-light">IT Infrastructure.</span>
            </h2>
            <p className="process-subtitle">
              We deliver secure, reliable, and high-performance IT infrastructure solutions covering networks, servers, and systems to support smooth and efficient business operations.
            </p>
          </div>

          <div className="process-carousel-container">
            <div 
              className="process-steps-carousel" 
              ref={carouselRef}
            >
              {/* First Set of Steps */}
              {/* Step 01 */}
              <div className="process-step step-01">
                <div className="step-device">
                  <div className="device-screen">
                    <img src="./src/assets/cctv.jpeg" alt="Initial Assessment" className="step-background-image" />
                    <div className="screen-overlay"></div>
                  </div>
                </div>
                <div className="step-info">
                  <div className="step-number">[Advanced Surveillance]</div>
                  <h3>Intelligent CCTV Systems</h3>
                  <p>Our surveillance solutions provide comprehensive monitoring and remote access for 24/7 security and peace of mind.</p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="process-step step-02">
                <div className="step-device">
                  <div className="device-screen">
                    <img src="./src/assets/server.jpeg" alt="Threat Detection" className="step-background-image" />
                    <div className="screen-overlay"></div>
                  </div>
                </div>
                <div className="step-info">
                  <div className="step-number">[Data & Application Core]</div>
                  <h3>Enterprise-Grade Servers</h3>
                  <p>Our scalable server solutions ensure optimal performance, redundancy, and readiness for your business growth.</p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="process-step step-03">
                <div className="step-device">
                  <div className="device-screen">
                    <img src="./src/assets/AP.jpeg" alt="Security Implementation" className="step-background-image" />
                    <div className="screen-overlay"></div>
                  </div>
                </div>
                <div className="step-info">
                  <div className="step-number">[Seamless Connectivity]</div>
                  <h3>High-Performance Access Points</h3>
                  <p>Our professional systems deliver secure, reliable Wi-Fi coverage across your entire workspace without bottlenecks.</p>
                </div>
              </div>

              {/* Step 04 */}
              <div className="process-step step-04">
                <div className="step-device">
                  <div className="device-screen">
                    <img src="./src/assets/cable.jpeg" alt="Monitoring & Analytics" className="step-background-image" />
                    <div className="screen-overlay"></div>
                  </div>
                </div>
                <div className="step-info">
                  <div className="step-number">[Network Foundation]</div>
                  <h3>Structured Cabling Solutions</h3>
                  <p>We provide certified, organized cabling for maximum speed and long-term network reliability.</p>
                </div>
              </div>

              {/* Step 05*/}
              <div className="process-step step-05">
                <div className="step-device">
                  <div className="device-screen">
                    <img src="./src/assets/router.png" alt="Response & Recovery" className="step-background-image" />
                    <div className="screen-overlay"></div>
                  </div>
                </div>
                <div className="step-info">
                  <div className="step-number">[Intelligent Traffic Control]</div>
                  <h3>Routers & Switches</h3>
                  <p>Our devices efficiently manage and prioritize network traffic for seamless business connectivity.</p>
                </div>
              </div>

              {/* Step 06*/}
              <div className="process-step step-06">
                <div className="step-device">
                  <div className="device-screen">
                    <img src="./src/assets/firewall.jpeg" alt="Optimization & Maintenance" className="step-background-image" />
                    <div className="screen-overlay"></div>
                  </div>
                </div>
                <div className="step-info">
                  <div className="step-number">[Essential Digital Security]</div>
                  <h3>Enterprise Firewalls</h3>
                  <p>Our advanced solutions provide a powerful, configurable barrier against modern cyber threats.</p>
                </div>
              </div>


            </div>

            {/* Carousel Navigation */}
            <div className="carousel-navigation">
              <button 
                className={`carousel-prev ${currentStep === 0 ? 'disabled' : ''}`} 
                onClick={prevStep} 
                disabled={currentStep === 0}
                aria-label="Previous steps"
              >
                ←
              </button>
              <button 
                className={`carousel-next ${currentStep === 2 ? 'disabled' : ''}`} 
                onClick={nextStep} 
                disabled={currentStep === 2}
                aria-label="Next steps"
              >
                →
              </button>
            </div>

            {/* Carousel Indicators */}
            <div className="carousel-indicators">
              {[0, 1, 2].map((index) => (
                <span 
                  key={index}
                  className={`indicator ${currentStep === index ? 'active' : ''}`}
                  onClick={() => goToStep(index)}
                ></span>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* services section */}
      <section id="innovation" className="innovation-section">
        <div className="innovation-container">
          <div className="innovation-content">
            <div className="innovation-header">
              <span className="innovation-badge">Featured Innovation</span>
              <h2>NFC Digital Business Cards Nepal</h2>
              <p className="innovation-subtitle">
                Revolutionary networking technology in Nepal that transforms how professionals connect. E-VOX NFC business cards are the top choice for Nepali businesses and IT professionals.
              </p>
            </div>

            <div className="before-after-slider" ref={sliderRef}>
              <div className="slider-container">
                {/* <div className="slider-header">
                  <h3>Transform Your Digital Presence</h3>
                  <p>Drag the slider to see the transformation</p>
                </div> */}
                <div className="slider-wrapper">
                  <div className="slider-images">
                    <div className="before-image">
                      <img src="/src/assets/Before.png" alt="Before transformation" />
                      <div className="image-label before-label">BEFORE</div>
                    </div>
                    <div 
                      className="after-image" 
                      style={{
                        clipPath: isAutoAnimating ? undefined : `inset(0 0 0 ${sliderValue}%)`
                      }}
                    >
                      <img src="/src/assets/After.png" alt="After transformation" loading="lazy" />
                      <div className="image-label after-label">AFTER</div>
                    </div>
                  </div>
                  <div className="slider-control">
                    <input 
                      type="range" 
                      className="slider-input" 
                      min="0" 
                      max="100" 
                      value={sliderValue}
                      disabled={isAutoAnimating}
                      onChange={(e) => {
                        if (!isAutoAnimating) {
                          const value = parseInt(e.target.value);
                          setSliderValue(value);
                        }
                      }}
                    />
                    <div 
                      className="slider-handle" 
                      style={{
                        left: isAutoAnimating ? undefined : `${sliderValue}%`
                      }}
                    >
                      <div className="handle-line"></div>
                      <div className="handle-circle">
                        <i className="fas fa-arrows-alt-h"></i>
                      </div>
                    </div>
                  </div>
                  {isAutoAnimating && (
                    <div className="auto-animation-indicator">
                      <span>Auto Demo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="innovation-cta">
              <button 
                className="cta-primary"
                onClick={() => navigate('/nfc-cards')}
              >
                Get Your E-VOX Card
              </button>
              <button 
                className="cta-secondary"
                onClick={() => navigate('/nfc-cards')}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section" style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        padding: '8rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 30% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 70% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)`,
          pointerEvents: 'none'
        }}></div>
        <div className="about-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="about-header">
            <h2>Why Choose E-VOX? | Nepal's Trusted IT Company</h2>
            <p>Your trusted partner in digital transformation, IT, and NFC business cards in Nepal.</p>
          </div>

          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon"><i className="fas fa-bullseye"></i></div>
              <h4>Strategic IT Expertise in Nepal</h4>
              <p>Deep industry knowledge and technical excellence as a leading Nepali IT company, delivering solutions that align with your business goals.</p>
            </div>
            <div className="about-card">
              <div className="about-icon"><i className="fas fa-rocket"></i></div>
              <h4>Innovation First: Nepali IT Solutions</h4>
              <p>Staying ahead of technology trends in Nepal to provide cutting-edge IT and digital solutions for your competitive advantage.</p>
            </div>
            <div className="about-card">
              <div className="about-icon"><i className="fas fa-handshake"></i></div>
              <h4>Partnership Approach for Nepali Businesses</h4>
              <p>Building long-term relationships with Nepali businesses through transparent communication and dedicated IT support.</p>
            </div>
            <div className="about-card">
              <div className="about-icon"><i className="fas fa-bolt"></i></div>
              <h4>Rapid IT Deployment Nepal</h4>
              <p>Efficient project management and agile methodologies ensure quick time-to-value for your IT investments in Nepal.</p>
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
                <h2>Build Your Solution </h2>
                <p> With Us.</p>
                
              </div>
                <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-field-group">
                  <div className="form-field animated-field">
                    <label htmlFor="firstName">First name</label>
                    <div className="input-container" style={{ position: 'relative' }}>
                      {!formFields.firstName.focused && !formFields.firstName.hasContent && (
                        <i className="field-icon" style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}>👤</i>
                      )}
                      <input 
                        type="text" 
                        id="firstName"
                        name="first_name"
                        placeholder="First name" 
                        required 
                        style={{
                          paddingLeft: (!formFields.firstName.focused && !formFields.firstName.hasContent) ? '40px' : '12px',
                          transition: 'padding-left 0.2s ease'
                        }}
                        onFocus={() => handleFieldFocus('firstName')}
                        onBlur={(e) => handleFieldBlur('firstName', e.target.value)}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="form-field animated-field">
                    <label htmlFor="lastName">Last name</label>
                    <div className="input-container">
                      <input type="text" id="lastName" name="last_name" placeholder="Last name" required />
                    </div>
                  </div>
                </div>
                
                <div className="form-field animated-field">
                  <label htmlFor="email">Email</label>
                  <div className="input-container" style={{ position: 'relative' }}>
                    {!formFields.email.focused && !formFields.email.hasContent && (
                      <i className="field-icon" style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}>✉️</i>
                    )}
                    <input 
                      type="email" 
                      id="email"
                      name="user_email"
                      placeholder="Your email address" 
                      required 
                      style={{
                        paddingLeft: (!formFields.email.focused && !formFields.email.hasContent) ? '40px' : '12px',
                        transition: 'padding-left 0.2s ease'
                      }}
                      onFocus={() => handleFieldFocus('email')}
                      onBlur={(e) => handleFieldBlur('email', e.target.value)}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-field animated-field">
                  <label htmlFor="phone">Phone number</label>
                  <div className="input-container" style={{ position: 'relative' }}>
                    {!formFields.phone.focused && !formFields.phone.hasContent && (
                      <i className="field-icon" style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}>📱</i>
                    )}
                    <input 
                      type="tel" 
                      id="phone"
                      name="phone_number"
                      placeholder="Phone number" 
                      required 
                      style={{
                        paddingLeft: (!formFields.phone.focused && !formFields.phone.hasContent) ? '40px' : '12px',
                        transition: 'padding-left 0.2s ease'
                      }}
                      onFocus={() => handleFieldFocus('phone')}
                      onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                    />
                  </div>
                  
                </div>
                
                <div className="form-field animated-field">
                  <label htmlFor="comments">Comments</label>
                  <div className="input-container textarea-container" style={{ position: 'relative' }}>
                    {!formFields.comments.focused && !formFields.comments.hasContent && (
                      <i className="field-icon textarea-icon" style={{
                        position: 'absolute',
                        left: '12px',
                        top: '20px',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}>💬</i>
                    )}
                    <textarea 
                      id="comments"
                      name="message"
                      placeholder="Additional details..." 
                      rows="3"
                      required
                      style={{
                        paddingLeft: (!formFields.comments.focused && !formFields.comments.hasContent) ? '40px' : '12px',
                        transition: 'padding-left 0.2s ease'
                      }}
                      onFocus={() => handleFieldFocus('comments')}
                      onBlur={(e) => handleFieldBlur('comments', e.target.value)}
                      onChange={(e) => handleFieldChange('comments', e.target.value)}
                    ></textarea>
                  </div>
                </div>
                
                {/* Submission message */}
                {submitMessage.text && (
                  <div className={`submit-message ${submitMessage.type}`} style={{
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    backgroundColor: submitMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: submitMessage.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${submitMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                  }}>
                    {submitMessage.text}
                  </div>
                )}
                
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  <span className="btn-text">{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  <span className="btn-icon">→</span>
                </button>
              </form>
            </div>
            
            <div className="contact-image contact-image-mobile-hidden">
              <div className="studio-label">
                <p>EVOX</p>
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
      </section>


      {/* Footer */}
      <footer className="evox-footer">
        <div className="footer-container">
          {/* Top Section with CTA */}
          <div className="footer-top">
            <div className="footer-social">
              <span className="join-text">JOIN NOW</span>
              <div className="social-icons">
                <a href="https://www.instagram.com/e.voxtech/" className="social-icon" title="Instagram" target="_blank" rel="noopener noreferrer">
                  <img src="./src/assets/instagram.png" alt="Instagram" className="social-icon-img" />
                </a>
                <a href="https://www.linkedin.com/company/evox-tech/" className="social-icon" title="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <img src="./src/assets/linkedin.png" alt="LinkedIn" className="social-icon-img" />
                </a>
                <a href="https://www.facebook.com/evoxtechofficial/" className="social-icon" title="Facebook" target="_blank" rel="noopener noreferrer">
                  <img src="./src/assets/facebook.png" alt="Facebook" className="social-icon-img" />
                </a>
              </div>
            </div>
            
            <div className="footer-cta">
              <h2>Start your tech journey with us </h2>
              <button className="cta-button">
                <span>Learn more</span>
                <i className="fas fa-arrow-right"></i>
                <span className="icon-fallback">→</span>
              </button>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="footer-main">
            <div className="footer-brand-section">
              <div className="footer-brand">
                <div className="brand-logo">
                  {/* <img src="./src/assets/evox.png" alt="E-VOX" className="brand-logo-img" /> */}
                  <span>E-VOX</span>
                </div>
                <p>AI-powered tech intelligence designed to help understand your business needs.</p>
              </div>
            </div>

            <div className="footer-links-grid">
              <div className="footer-column">
                <h4>Platform</h4>
                <ul>
                  <li><a href="#">Product</a></li>
                  <li><a href="#" onClick={e => { e.preventDefault(); evoxScrollToSection('about'); }}>Why E-VOX</a></li>
                  {/* <li><a href="#">How it works</a></li> */}
                </ul>
              </div>

              <div className="footer-column">
                <h4>Resources</h4>
                <ul>
                  {/* <li><a href="#">Blog</a></li> */}
                  <li><a href="#">FAQ</a></li>
                  <li><a href="#" onClick={e => { e.preventDefault(); evoxScrollToSection('contact'); }}>Support</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>About</a></li>
                  {/* <li><a href="#">Careers</a></li> */}
                  <li><a href="#" onClick={e => { e.preventDefault(); evoxScrollToSection('contact'); }}>Contact</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-legal">
              <a href="#">Terms of service</a>
              <a href="#">Privacy policy</a>
            </div>
            <div className="footer-copyright">
              ©2025 E-VOX. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EvoxPage;