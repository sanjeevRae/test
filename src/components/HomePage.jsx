import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import emailjs from 'emailjs-com';
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
import './SmoothScrollStyles.css';
import './FivePreviewComplete.css';
import './FivePreviewMobileFix.css';

const HomePage = ({ skipHeroSection = false }) => {  const location = useLocation();
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const contactRef = useRef(null);
  // Ref for five cards section
  const fiveCardsRef = useRef(null);
  const [activeTab, setActiveTab] = useState('team');
  const [billingCycle, setBillingCycle] = useState('monthly');
  
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
  
  // Card stacking animation states
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [cardTransforms, setCardTransforms] = useState({
    card1: 'translate(0px, 0px) rotate(0deg)',
    card2: 'translate(0px, 0px) rotate(0deg)',
    card3: 'translate(0px, 0px) rotate(0deg)',
    card4: 'translate(0px, 0px) rotate(0deg)',
    card5: 'translate(0px, 0px) rotate(0deg)'
  });

  // Counter animation states
  const trustedSectionRef = useRef(null);
  const [countersStarted, setCountersStarted] = useState(false);
  const [counters, setCounters] = useState({
    countries: 0,
    cards: 0,
    rating: 0,
    paper: 0,
    connections: 0,
    companies: 0
  });
  
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
      e.target.reset(); // Reset form
      
      // Reset form field states
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

  // Five Cards Stacking Animation
  useEffect(() => {
    const handleScroll = () => {
      if (fiveCardsRef.current) {
        const section = fiveCardsRef.current;
        const rect = section.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate scroll progress through the section
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const sectionBottom = rect.bottom;
        
        // Determine if section is in view
        const sectionInView = sectionTop < windowHeight && sectionBottom > 0;
        
        if (sectionInView) {
          // Calculate progress (0 to 1) as user scrolls through section
          const scrollProgress = Math.max(0, Math.min(1, (windowHeight - sectionTop) / (windowHeight + sectionHeight * 0.5)));
          
          if (scrollProgress > 0.2 && scrollProgress < 0.8) {
            // Expand cards when in the middle of section view
            if (!cardsExpanded) {
              setCardsExpanded(true);
              // Mobile responsive transforms
              if (window.innerWidth <= 480) {
                setCardTransforms({
                  card1: 'translate(-80px, -60px) rotate(-8deg)',
                  card2: 'translate(-80px, 60px) rotate(5deg)',
                  card3: 'translate(0px, 0px) rotate(0deg)',
                  card4: 'translate(80px, -60px) rotate(8deg)',
                  card5: 'translate(80px, 60px) rotate(-5deg)'
                });
              } else if (window.innerWidth <= 768) {
                setCardTransforms({
                  card1: 'translate(-160px, -80px) rotate(-8deg)',
                  card2: 'translate(-160px, 80px) rotate(5deg)',
                  card3: 'translate(0px, 0px) rotate(0deg)',
                  card4: 'translate(160px, -80px) rotate(8deg)',
                  card5: 'translate(160px, 80px) rotate(-5deg)'
                });
              } else {
                setCardTransforms({
                  card1: 'translate(-320px, -100px) rotate(-8deg)',
                  card2: 'translate(-320px, 100px) rotate(5deg)',
                  card3: 'translate(0px, 0px) rotate(0deg)',
                  card4: 'translate(320px, -100px) rotate(8deg)',
                  card5: 'translate(320px, 100px) rotate(-5deg)'
                });
              }
            }
          } else {
            // Stack cards when entering or leaving section
            if (cardsExpanded) {
              setCardsExpanded(false);
              setCardTransforms({
                card1: 'translate(0px, 0px) rotate(2deg)',
                card2: 'translate(0px, 0px) rotate(-1deg)',
                card3: 'translate(0px, 0px) rotate(0deg)',
                card4: 'translate(0px, 0px) rotate(1deg)',
                card5: 'translate(0px, 0px) rotate(-2deg)'
              });
            }
          }
        } else {
          // Reset to stacked position when section is out of view
          if (cardsExpanded) {
            setCardsExpanded(false);
            setCardTransforms({
              card1: 'translate(0px, 0px) rotate(0deg)',
              card2: 'translate(0px, 0px) rotate(0deg)',
              card3: 'translate(0px, 0px) rotate(0deg)',
              card4: 'translate(0px, 0px) rotate(0deg)',
              card5: 'translate(0px, 0px) rotate(0deg)'
            });
          }
        }
      }
    };

    // Add scroll listener with throttling for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', throttledScroll);
    // Trigger once on mount
    handleScroll();
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [cardsExpanded]);

  // Counter Animation for Trusted Section
  useEffect(() => {
    const animateCounter = (start, end, duration, callback, isDecimal = false) => {
      const startTime = Date.now();
      
      const updateCounter = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = start + (end - start) * easeOutQuart;
        
        callback(isDecimal ? Math.round(currentValue * 10) / 10 : Math.floor(currentValue));
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersStarted) {
            setCountersStarted(true);
            
            animateCounter(0, 500, 10000, (value) => 
              setCounters(prev => ({ ...prev, countries: value }))
            );
            
            animateCounter(0, 1, 1000, (value) => 
              setCounters(prev => ({ ...prev, cards: value }))
            );
            
            animateCounter(0, 99, 10000, (value) => 
              setCounters(prev => ({ ...prev, rating: value })), true
            );
            
            animateCounter(0, 50, 10000, (value) => 
              setCounters(prev => ({ ...prev, paper: value }))
            );
            
            animateCounter(0, 10, 10000, (value) => 
              setCounters(prev => ({ ...prev, connections: value }))
            );
            
            animateCounter(0, 100, 10000, (value) => 
              setCounters(prev => ({ ...prev, companies: value }))
            );
          }
        });
      },
      { threshold: 0.3 }
    );

    if (trustedSectionRef.current) {
      observer.observe(trustedSectionRef.current);
    }

    return () => {
      if (trustedSectionRef.current) {
        observer.unobserve(trustedSectionRef.current);
      }
    };
  }, [countersStarted]);

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
  
  // Function to handle scrolling to sections by ID
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Navbar height offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
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
  };  useEffect(() => {
    // Set smooth scrolling for the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.scrollBehavior = 'smooth';
    
    // Add CSS for smoother transitions
    const style = document.createElement('style');
    style.innerHTML = `
      html {
        scroll-behavior: smooth !important;
      }
      body {
        scroll-behavior: smooth !important;
      }
      * {
        -webkit-overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);
    
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
          }, 200);
        }
        return;
      }
      
      // Then check for hash in URL
      if (location.hash) {
        const id = location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            const yOffset = -80;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
              top: y,
              behavior: 'smooth'
            });
          }, 200);
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

    // Execute all functions
    ensureSectionsVisible();
    handleInitialScroll();

    // Clean up on unmount
    return () => {
      document.documentElement.style.scrollBehavior = '';
      document.body.style.scrollBehavior = '';
      document.head.removeChild(style);
    };
  }, [location]);
  return (
    <div className="home-page">
      {/* Hero Section */}
      {!skipHeroSection && <HeroSection />}
      
      {/* About Section */}
      <section id="about" className="about-section workforce-hero" ref={aboutRef}>
        <div className="container">
          <div className="workforce-content">

            <div className="profile-showcase">              
              <div className="profile-cards">
                <div className="profile-card" style={{ minWidth: '280px', width: '100%' }}>
                  <div className="card-header" style={{ 
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0',
                    padding: '0.8rem 1.2rem',
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '8px 8px 0 0',
                    backdropFilter: 'blur(10px)',
                    minHeight: '50px',
                    boxSizing: 'border-box',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <span style={{ 
                      color: '#ffffff', 
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      whiteSpace: 'nowrap',
                      overflow: 'visible'
                    }}>Digital Profile</span>
                    <span className="arrow-icon" style={{ 
                      color: '#00ffff', 
                      fontSize: '1.2rem',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      marginLeft: '10px'
                    }}>↗</span>
                  </div>                  <div className="profile-image" style={{ position: 'relative', zIndex: 1 }}>
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
            
            </div>
        </div>  
      </section>

      

      {/* Five Preview Cards Section */}
        <section className="five-preview-container" id="five-preview" ref={fiveCardsRef} style={{
           padding: window.innerWidth <= 768 ? '4rem 1rem' : '6rem 2rem',
           background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
           minHeight: window.innerWidth <= 480 ? '60vh' : window.innerWidth <= 768 ? '65vh' : '80vh',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           position: 'relative',
           overflow: 'hidden'
         }}>
           {/* Background decorative elements */}
           <div style={{
             position: 'absolute',
             top: '10%',
             right: window.innerWidth <= 768 ? '5%' : '10%',
             width: window.innerWidth <= 768 ? '150px' : '300px',
             height: window.innerWidth <= 768 ? '150px' : '300px',
             background: 'radial-gradient(circle, rgba(0,255,255,0.05) 0%, transparent 70%)',
             borderRadius: '50%',
             filter: 'blur(60px)'
           }}></div>
           <div style={{
             position: 'absolute',
             bottom: '20%',
             left: window.innerWidth <= 768 ? '2%' : '5%',
             width: window.innerWidth <= 768 ? '120px' : '250px',
             height: window.innerWidth <= 768 ? '120px' : '250px',
             background: 'radial-gradient(circle, rgba(138,43,226,0.05) 0%, transparent 70%)',
             borderRadius: '50%',
             filter: 'blur(50px)'
           }}></div>
           
           {/* Section Header Text */}
           <div style={{
             position: 'absolute',
             top: window.innerWidth <= 480 ? '5%' : window.innerWidth <= 768 ? '6%' : '5%',
             left: '50%',
             transform: 'translateX(-50%)',
             textAlign: 'center',
             color: 'white',
             zIndex: 10,
             padding: window.innerWidth <= 768 ? '0 1rem' : '0',
             width: window.innerWidth <= 768 ? '100%' : 'auto'
           }}>
             <h2 style={{
               fontSize: window.innerWidth <= 480 ? '1.5rem' : window.innerWidth <= 768 ? '1.8rem' : '2.5rem',
               fontWeight: '700',
               margin: '0 0 0.5rem 0',
               background: 'linear-gradient(45deg, #00ffff, #ff6b6b)',
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent',
               backgroundClip: 'text',
               lineHeight: '1.2'
             }}>Our Innovation Showcase</h2>
           </div>

           <div className="stacked-cards-container" style={{
             position: 'relative',
             width: '100%',
             maxWidth: window.innerWidth <= 768 ? '100%' : '1400px',
             height: window.innerWidth <= 768 ? '400px' : '700px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             margin: '0 auto',
             marginTop: window.innerWidth <= 480 ? '2rem' : window.innerWidth <= 768 ? '1rem' : '0',
           }}>

             {/* Card 1 - Left Top */}
             <div 
               className="preview-card card-1" 
               style={{
                 position: 'absolute',
                 width: window.innerWidth <= 480 ? '120px' : window.innerWidth <= 768 ? '160px' : '280px',
                 height: window.innerWidth <= 480 ? '160px' : window.innerWidth <= 768 ? '200px' : '360px',
                 borderRadius: window.innerWidth <= 768 ? '15px' : '25px',
                 overflow: 'hidden',
                 background: 'transparent',
                 transition: 'all 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
                 cursor: 'pointer',
                 transform: cardTransforms.card1,
                 zIndex: 4
               }}
               onMouseEnter={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card1 + ' scale(1.05)';
                 }
               }}
               onMouseLeave={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card1;
                 }
               }}
             >
               <img src="/src/assets/leftA.jpg" alt="Innovation" style={{
                 width: '100%',
                 height: '100%',
                 objectFit: 'contain',
                 objectPosition: 'center',
                 padding: window.innerWidth <= 768 ? '5px' : '10px',
                 boxSizing: 'border-box',
                 transition: 'transform 0.6s ease'
               }}/>
             </div>

             {/* Card 2 - Left Bottom */}
             <div 
               className="preview-card card-2" 
               style={{
                 position: 'absolute',
                 width: window.innerWidth <= 480 ? '120px' : window.innerWidth <= 768 ? '160px' : '280px',
                 height: window.innerWidth <= 480 ? '150px' : window.innerWidth <= 768 ? '190px' : '340px',
                 borderRadius: window.innerWidth <= 768 ? '15px' : '25px',
                 overflow: 'hidden',
                 background: 'transparent',
                 transition: 'all 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
                 cursor: 'pointer',
                 transform: cardTransforms.card2,
                 zIndex: 3
               }}
               onMouseEnter={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card2 + ' scale(1.05)';
                 }
               }}
               onMouseLeave={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card2;
                 }
               }}
             >
               <img src="/src/assets/leftB.jpg" alt="Solutions" style={{
                 width: '100%',
                 height: '100%',
                 objectFit: 'contain',
                 objectPosition: 'center',
                 padding: window.innerWidth <= 768 ? '5px' : '10px',
                 boxSizing: 'border-box',
                 transition: 'transform 0.6s ease'
               }}/>
             </div>

             {/* Card 3 - Center (Featured) */}
             <div 
               className="preview-card card-3" 
               style={{
                 position: 'absolute',
                 width: window.innerWidth <= 480 ? '180px' : window.innerWidth <= 768 ? '220px' : '350px',
                 height: window.innerWidth <= 480 ? '240px' : window.innerWidth <= 768 ? '300px' : '480px',
                 borderRadius: window.innerWidth <= 768 ? '20px' : '30px',
                 overflow: 'hidden',
                 background: 'transparent',
                 transition: 'all 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
                 cursor: 'pointer',
                 transform: cardTransforms.card3,
                 zIndex: 5
               }}
               onMouseEnter={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card3 + ' scale(1.03)';
                 }
               }}
               onMouseLeave={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card3;
                 }
               }}
             >
               <img src="/src/assets/Mid.png" alt="Featured Project" style={{
                 width: '100%',
                 height: '100%',
                 objectFit: 'contain',
                 objectPosition: 'center',
                 padding: window.innerWidth <= 768 ? '8px' : '15px',
                 boxSizing: 'border-box',
                 transition: 'transform 0.6s ease'
               }}/>
               <div style={{
                 position: 'absolute',
                 top: window.innerWidth <= 768 ? '10px' : '20px',
                 right: window.innerWidth <= 768 ? '10px' : '20px',
                 background: 'rgba(0,255,255,0.15)',
                 color: '#00ffff',
                 padding: window.innerWidth <= 768 ? '4px 8px' : '8px 16px',
                 borderRadius: window.innerWidth <= 768 ? '12px' : '20px',
                 fontSize: window.innerWidth <= 768 ? '0.6rem' : '0.75rem',
                 fontWeight: '700',
                 backdropFilter: 'blur(10px)',
                 border: '1px solid rgba(0,255,255,0.2)',
                 opacity: cardsExpanded ? 1 : 0,
                 transition: 'opacity 0.8s ease 0.3s'
               }}>FEATURED</div>
             </div>

             {/* Card 4 - Right Top */}
             <div 
               className="preview-card card-4" 
               style={{
                 position: 'absolute',
                 width: window.innerWidth <= 480 ? '120px' : window.innerWidth <= 768 ? '160px' : '280px',
                 height: window.innerWidth <= 480 ? '155px' : window.innerWidth <= 768 ? '195px' : '350px',
                 borderRadius: window.innerWidth <= 768 ? '15px' : '25px',
                 overflow: 'hidden',
                 background: 'transparent',
                 transition: 'all 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
                 cursor: 'pointer',
                 transform: cardTransforms.card4,
                 zIndex: 2
               }}
               onMouseEnter={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card4 + ' scale(1.05)';
                 }
               }}
               onMouseLeave={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card4;
                 }
               }}
             >
               <img src="/src/assets/rightA.gif" alt="Dynamic Content" style={{
                 width: '100%',
                 height: '100%',
                 objectFit: 'contain',
                 objectPosition: 'center',
                 padding: window.innerWidth <= 768 ? '5px' : '10px',
                 boxSizing: 'border-box',
                 transition: 'transform 0.6s ease'
               }}/>
             </div>

             {/* Card 5 - Right Bottom */}
             <div 
               className="preview-card card-5" 
               style={{
                 position: 'absolute',
                 width: window.innerWidth <= 480 ? '120px' : window.innerWidth <= 768 ? '160px' : '280px',
                 height: window.innerWidth <= 480 ? '145px' : window.innerWidth <= 768 ? '185px' : '330px',
                 borderRadius: window.innerWidth <= 768 ? '15px' : '25px',
                 overflow: 'hidden',
                 background: 'transparent',
                 transition: 'all 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
                 cursor: 'pointer',
                 transform: cardTransforms.card5,
                 zIndex: 1
               }}
               onMouseEnter={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card5 + ' scale(1.05)';
                 }
               }}
               onMouseLeave={(e) => {
                 if (cardsExpanded && window.innerWidth > 768) {
                   e.currentTarget.style.transform = cardTransforms.card5;
                 }
               }}
             >
               <img src="/src/assets/rightB.jpg" alt="Future Ready" style={{
                 width: '100%',
                 height: '100%',
                 objectFit: 'contain',
                 objectPosition: 'center',
                 padding: window.innerWidth <= 768 ? '5px' : '10px',
                 boxSizing: 'border-box',
                 transition: 'transform 0.6s ease'
               }}/>
             </div>
           </div>          
         </section>
         




         {/* Trusted by Section */}
      <section className="trusted-by-section" ref={trustedSectionRef} style={{
        padding: window.innerWidth <= 768 ? '4rem 1rem' : '6rem 2rem',
        background: 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ marginBottom: window.innerWidth <= 768 ? '3rem' : '4rem' }}>
            <h2 style={{
              fontSize: window.innerWidth <= 480 ? '1.8rem' : window.innerWidth <= 768 ? '2.2rem' : '2.8rem',
              fontWeight: '700',
              color: '#2c3e50',
              marginBottom: '1rem',
              lineHeight: '1.2'
            }}>
              Trusted by Forward-Thinking Professionals
            </h2>
            <p style={{
              fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem',
              color: '#000000ff',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.5'
            }}>
            Selected by innovators and industry leaders, E-VOX NFC cards are for those who values their Connections.            </p>
          </div>

          {/* Statistics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: window.innerWidth <= 768 ? '2rem' : '3rem',
            marginBottom: window.innerWidth <= 768 ? '3rem' : '4rem'
          }}>
            {/* Stat 1 */}
            <div style={{
              background: '#edf2f7',
              borderRadius: '20px',
              padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              height: window.innerWidth <= 768 ? '240px' : '320px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-10px)';
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}>
              {/* Text section - 20% desktop, 45% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '45%' : '20%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: window.innerWidth <= 480 ? '1rem' : window.innerWidth <= 768 ? '2rem' : '2rem',
                  fontWeight: '400',
                  color: '#010101ff',
                  marginBottom: '0.25rem'
                }}>{counters.countries}+</div>
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                  color: '#000000ff',
                  fontWeight: '500'
                }}>active users</div>
              </div>
              {/* Divider */}
              <div style={{
                height: '2px',
                
                margin: window.innerWidth <= 768 ? '0.5rem 0' : '1rem 0',
                borderRadius: '1px',
                opacity: '0.3'
              }}></div>
              {/* Image section - 80% desktop, 55% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '55%' : '80%',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <img src="/src/assets/connection.jpeg" alt="Global reach" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }} />
              </div>
            </div>

            {/* Stat 2 */}
            <div style={{
              background: '#edf2f7',
              borderRadius: '20px',
              padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              height: window.innerWidth <= 768 ? '240px' : '320px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-10px)';
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}>
              {/* Text section - 20% desktop, 45% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '45%' : '20%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: window.innerWidth <= 480 ? '1.8rem' : window.innerWidth <= 768 ? '2rem' : '2rem',
                  fontWeight: '400',
                  color: '#000000ff',
                  marginBottom: '0.25rem'
                }}>{counters.cards}K+</div>
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                  color: '#000000ff',
                  fontWeight: '500'
                }}>NFC cards distributed</div>
              </div>
              {/* Divider */}
              <div style={{
                height: '2px',
              
                margin: window.innerWidth <= 768 ? '0.5rem 0' : '1rem 0',
                borderRadius: '1px',
                opacity: '0.3'
              }}></div>
              {/* Image section - 80% desktop, 55% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '55%' : '80%',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <img src="/src/assets/phone1.png" alt="NFC Technology" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }} />
              </div>
            </div>

            {/* Stat 3 */}
            <div style={{
              background: '#edf2f7',
              borderRadius: '20px',
              padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              height: window.innerWidth <= 768 ? '240px' : '320px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-10px)';
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}>
              {/* Text section - 20% desktop, 45% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '45%' : '20%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: window.innerWidth <= 480 ? '1.8rem' : window.innerWidth <= 768 ? '2rem' : '2rem',
                  fontWeight: '400',
                  color: '#000000ff',
                  marginBottom: '0.25rem'
                }}>{counters.rating}%</div>
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                  color: '#000000ff',
                  fontWeight: '500'
                }}>satisfied customer</div>
              </div>
              {/* Divider */}
              <div style={{
                height: '2px',
                
                margin: window.innerWidth <= 768 ? '0.5rem 0' : '1rem 0',
                borderRadius: '1px',
                opacity: '0.3'
              }}></div>
              {/* Image section - 80% desktop, 55% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '55%' : '80%',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <img src="/src/assets/happy.png" alt="User Reviews" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }} />
              </div>
            </div>

            {/* Stat 4 */}
            <div style={{
              background: '#edf2f7',
              borderRadius: '20px',
              padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              height: window.innerWidth <= 768 ? '240px' : '320px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-10px)';
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}>
              {/* Text section - 20% desktop, 45% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '45%' : '20%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: window.innerWidth <= 480 ? '1.8rem' : window.innerWidth <= 768 ? '2rem' : '2rem',
                  fontWeight: '400',
                  color: '#000000ff',
                  marginBottom: '0.25rem'
                }}>{counters.paper}+</div>
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                  color: '#060606ff',
                  fontWeight: '500'
                }}>tons of paper saved</div>
              </div>
              {/* Divider */}
              <div style={{
                height: '2px',
               
                margin: window.innerWidth <= 768 ? '0.5rem 0' : '1rem 0',
                borderRadius: '1px',
                opacity: '0.3'
              }}></div>
              {/* Image section - 80% desktop, 55% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '55%' : '80%',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <img src="/src/assets/papers.jpg" alt="Environmental Impact" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }} />
              </div>
            </div>
          </div>

          {/* Bottom Large Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
            gap: window.innerWidth <= 768 ? '2rem' : '3rem'
          }}>
            {/* Large Stat 1 */}
            <div style={{
              background: '#edf2f7',
              borderRadius: '25px',
              padding: window.innerWidth <= 768 ? '1.5rem' : '2rem',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              height: window.innerWidth <= 768 ? '300px' : '400px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-10px)';
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}>
              {/* Text section - 20% desktop, 45% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '45%' : '20%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: window.innerWidth <= 480 ? '2.2rem' : window.innerWidth <= 768 ? '2.8rem' : '3.2rem',
                  fontWeight: '400',
                  color: '#000000ff',
                  marginBottom: '0.25rem'
                }}>{counters.connections}K+</div>
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                  color: '#000000ff',
                  fontWeight: '500',
                  lineHeight: '1.3'
                }}>
                  connections made with <span style={{ color: '#000000ff', fontWeight: '700' }}>E-VOX</span>
                </div>
              </div>
              {/* Divider */}
              <div style={{
                height: '2px',
                
                margin: window.innerWidth <= 768 ? '0.5rem 0' : '1rem 0',
                borderRadius: '1px',
                opacity: '0.3'
              }}></div>
              {/* Image section - 80% desktop, 55% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '55%' : '80%',
                borderRadius: '20px',
                overflow: 'hidden'
              }}>
                <img src="/src/assets/people.jpeg" alt="Professional Connections" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '20px'
                }} />
              </div>
            </div>

            {/* Large Stat 2 */}
            <div style={{
              background: '#edf2f7',
              borderRadius: '25px',
              padding: window.innerWidth <= 768 ? '1.5rem' : '2rem',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              height: window.innerWidth <= 768 ? '300px' : '400px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-10px)';
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}>
              {/* Text section - 20% desktop, 45% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '45%' : '20%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: window.innerWidth <= 480 ? '2.2rem' : window.innerWidth <= 768 ? '2.8rem' : '3.2rem',
                  fontWeight: '400',
                  color: '#000000ff',
                  marginBottom: '0.25rem'
                }}>{counters.companies}+</div>
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.9rem',
                  color: '#000000ff',
                  fontWeight: '500',
                  lineHeight: '1.3'
                }}>
                  companies using <span style={{ color: '#000000ff', fontWeight: '700' }}>E-VOX</span> cards
                </div>
              </div>
              {/* Divider */}
              <div style={{
                height: '2px',
                
                margin: window.innerWidth <= 768 ? '0.5rem 0' : '1rem 0',
                borderRadius: '1px',
                opacity: '0.3'
              }}></div>
              {/* Image section - 80% desktop, 55% mobile */}
              <div style={{
                height: window.innerWidth <= 768 ? '55%' : '80%',
                borderRadius: '20px',
                overflow: 'hidden'
              }}>
                <img src="/src/assets/evox card.png" alt="Business Growth" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '20px'
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* Pricing Section */}
      <section id="pricing" className="pricing-section" ref={pricingRef}>
        <div className="container">
          <div className="pricing-header">
            <h2>Choose your right plan!</h2>
            <p className="pricing-subtitle">
              Select from best plans, ensuring a perfect match. 
            </p>
            {/* <div className="pricing-toggle">
              <button 
                className={`toggle-option ${billingCycle === 'direct' ? 'active' : ''}`}
                onClick={() => handleBillingToggle('direct')}
                aria-pressed={billingCycle === 'direct'}
              >
                Direct Purchase
              </button>
            </div> */}
          </div>
    
          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="plan-badge">
                <span>Standard</span>
              </div>
              <p className="plan-description">
              Our classic NFC business card with essential features.
              </p>              <div className="plan-price">                <h3> Rs550
                  {/* {billingCycle === 'monthly' && 'Rs15'}
                  {billingCycle === 'quarterly' && 'Rs162'}
                  {billingCycle === 'direct' && 'Rs500'} */}
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
                 </p>              <div className="plan-price">                <h3> Rs900
                  {/* {billingCycle === 'monthly' && 'Rs30'}
                  {billingCycle === 'quarterly' && 'Rs324'}
                  {billingCycle === 'direct' && 'Rs900'} */}
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
                 </p>              <div className="plan-price">                <h3> Rs1500
                  {/* {billingCycle === 'monthly' && 'Rs60'}
                  {billingCycle === 'quarterly' && 'Rs648'}
                  {billingCycle === 'direct' && 'Rs1500'} */}
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
      
      {/* Enterprise-Ready Section */}
      <section className="enterprise-section" style={{
        padding: window.innerWidth <= 768 ? '4rem 1rem' : '6rem 2rem',
        background: '#000000',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: window.innerWidth <= 768 ? '-5%' : '-10%',
          width: window.innerWidth <= 768 ? '200px' : '400px',
          height: window.innerWidth <= 768 ? '200px' : '400px',
          background: 'radial-gradient(circle, rgba(0, 0, 0, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: window.innerWidth <= 768 ? '-5%' : '-10%',
          width: window.innerWidth <= 768 ? '180px' : '350px',
          height: window.innerWidth <= 768 ? '180px' : '350px',
          background: 'radial-gradient(circle, rgba(0,255,255,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(70px)'
        }}></div>

        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Top Section - Enterprise-Ready Digital Business Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr',
            gap: window.innerWidth <= 768 ? '1.5rem' : '4rem',
            alignItems: 'center',
            marginBottom: window.innerWidth <= 768 ? '4rem' : '6rem'
          }}>
            {/* Text Content */}
            <div style={{ order: window.innerWidth <= 768 ? 2 : 1 }}>
              <h2 style={{
                fontSize: window.innerWidth <= 480 ? '2rem' : window.innerWidth <= 768 ? '2.5rem' : '3.2rem',
                fontWeight: '700',
                marginBottom: '1.5rem',
                color: 'white',
                lineHeight: '1.2'
              }}>
               The Card That Works for You
              </h2>
              <p style={{
                fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem',
                lineHeight: '1.6',
                opacity: '0.9',
                marginBottom: '2rem',
                maxWidth: '500px',
                textAlign: 'justify'
              }}>
Forget the paper stack in your drawer. Welcome to the smarter way to connect: a digital business card that never runs out. Update your details in real time they change for everyone, instantly. Get a helpful insight to see how many views your profile, so you never miss a real opportunity. the straightforward, modern solution for building and maintaining an authentic professional network that grows with your career.    </p>
              <button style={{
                background: '#6c32cd',
                border: 'none',
                padding: window.innerWidth <= 768 ? '0.8rem 2rem' : '1rem 2.5rem',
                borderRadius: '50px',
                color: 'white',
                fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                boxShadow: '0 4px 20px rgba(108,50,205,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(108,50,205,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(108,50,205,0.3)';
              }}>
                Get Started
              </button>
            </div>
            
            {/* Image */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              order: window.innerWidth <= 768 ? 1 : 2
            }}>
              <div style={{
                position: 'relative',
                width: window.innerWidth <= 768 ? '360px' : '700px',
                height: window.innerWidth <= 768 ? '260px' : '500px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                overflow: 'hidden'
              }}>
                <img 
                  src="/src/assets/profile.jpg" 
                  alt="Digital Business Card Showcase" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '20px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Section - Team Management Features */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr',
            gap: window.innerWidth <= 768 ? '0.7rem' : '4rem',
            alignItems: 'center'
          }}>
            {/* Image */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              order: window.innerWidth <= 768 ? 1 : 1
            }}>
              <div style={{
                position: 'relative',
                width: window.innerWidth <= 768 ? '340px' : '700px',
                height: window.innerWidth <= 768 ? '240px' : '500px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img 
                  src="/src/assets/Scale.png" 
                  alt="Team Management and Business Scaling" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '20px'
                  }}
                />
              </div>
            </div>

            {/* Text Content */}
            <div style={{ order: window.innerWidth <= 768 ? 2 : 2 }}>
              <h3 style={{
                fontSize: window.innerWidth <= 480 ? '1.8rem' : window.innerWidth <= 768 ? '2.2rem' : '2.8rem',
                fontWeight: '700',
                marginBottom: '2rem',
                background: 'linear-gradient(45deg, #8a2be2, #00ffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: '1.3'
              }}>
                
              </h3>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{
                  fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.3rem',
                  fontWeight: '600',
                  marginBottom: '0.8rem',
                  color: 'white'
                }}>
                  Simplify Digital Networking
                </h4>
                <p style={{
                  fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                  lineHeight: '1.5',
                  opacity: '0.8',
                  marginBottom: '0',
                  textAlign: 'justify'
                }}>
Empower every team member with a modern, professional presence, while you maintain perfect brand control from a central dashboard.                </p>
              </div>
             
              {/* Divider Line */}
              <div style={{
                height: '2px',
                background: '#6c32cd',
                margin: window.innerWidth <= 768 ? '1.5rem 0' : '2rem 0',
                borderRadius: '1px'
              }}>

              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{
                  fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.3rem',
                  fontWeight: '600',
                  marginBottom: '0.8rem',
                  color: 'white'
                }}>
                  Turn Every Exchange Into an Opportunity
                </h4>
                <p style={{
                  fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                  lineHeight: '1.5',
                  opacity: '0.8',
                  marginBottom: '0'
                }}>
When every digital card is connected, so is every new relationship. Capture leads seamlessly and keep customer connections secure, even as your team grows and changes.                </p>
              
              <div style={{
                height: '2px',
                background: '#6c32cd',
                margin: window.innerWidth <= 768 ? '1.5rem 0' : '2rem 0',
                borderRadius: '1px'
              }}></div>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{
                  fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.3rem',
                  fontWeight: '600',
                  marginBottom: '0.8rem',
                  color: 'white'
                }}>
                  Stay Updated, Always, Everywhere
                </h4>
                <p style={{
                  fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                  lineHeight: '1.5',
                  opacity: '0.8',
                  marginBottom: '0'
                }}>
Ensure contact details, roles, and branding are instantly accurate and consistent across your entire organization—no matter the department, location, or time zone.                </p>
              </div>
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
                    <li><a href="#" onClick={e => { e.preventDefault(); scrollToSection('about'); }}>Why E-VOX</a></li>
                    {/* <li><a href="#">How it works</a></li> */}
                  </ul>
                </div>

                <div className="footer-column">
                  <h4>Resources</h4>
                  <ul>
                    {/* <li><a href="#">Blog</a></li> */}
                    <li><a href="#">FAQ</a></li>
                    <li><a href="#" onClick={e => { e.preventDefault(); scrollToSection('contact'); }}>Support</a></li>
                  </ul>
                </div>

                <div className="footer-column">
                  <h4>Company</h4>
                  <ul>
                    <li><a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>About</a></li>
                    {/* <li><a href="#">Careers</a></li> */}
                    <li><a href="#" onClick={e => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
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

export default HomePage;