import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';
import introVideo from '../assets/intro.mp4';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Add smooth scrolling functionality
  useEffect(() => {
    // Smooth scroll implementation for the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Animation trigger
    setIsVisible(true);
    
    // Clean up on unmount
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
  // Function to handle scroll to sections
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
  };return (
    <section className={`hero ${isVisible ? 'visible' : ''}`} id="hero">
      <div className="hero-top-section">
        <div className="hero-content-wrapper center-align">          <h1 className="hero-title">
           Where Networking   <span className="highlight">Meets</span><br /> Innovation.
          </h1>
          <p className="hero-description">
           We bring contactless technology to life with smart, sustainable business solutions.
          </p>
          
          <div className="hero-cta-group">            <Link to="/login" className="hero-cta primary">
              <span>Get Started</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
              </svg>
            </Link>
            <a href="#about" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }} >
            </a>
            <a href="#contact" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}
              className="hero-cta outline">
              <span>Contact us</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>    
      <div className="hero-showcase">
        <div className="hero-showcase-bg">
          <video 
            className="video-background" 
            autoPlay 
            loop 
            muted 
            playsInline
            preload="auto"
            src={introVideo}
          >
            Your browser does not support the video tag.
          </video>
          <div className="showcase-container">
            <div className="showcase-section">
              <div className="showcase-content">              
                <div className="showcase-headline">
                  <h2>Transform Your Professional<br /> Connections</h2>
                  <p>Share your digital profile with a tap. E-VOX NFC cards combine elegant design and seamless networking.</p>
                </div>
              </div>
            </div>          
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;