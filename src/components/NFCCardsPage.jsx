import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import HomePage from './HomePage';

const NFCCardsPage = () => {
  const location = useLocation();
  
  // Handle initial scroll based on hash
  useEffect(() => {
    // Check if there's a hash in the URL (e.g., #about)
    if (location.hash) {
      const sectionId = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollToY = rect.top + scrollTop - 80;
          window.scrollTo({
            top: scrollToY,
            behavior: 'smooth'
          });
        }
      }, 300); // Delay to ensure content is rendered
    } else {
      // Instantly set to top if no hash (no smooth animation)
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
      overflowY: 'auto'
    }}>
      {/* Navbar Component */}
      <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <Navbar />
      </div>
      
      {/* HeroSection Component - shown first */}
      <div style={{ width: '100%' }}>
        <HeroSection />
      </div>
      
      {/* HomePage content without HeroSection - flows below */}
      <div style={{ width: '100%' }}>
        <HomePage skipHeroSection={true} />
      </div>
    </div>
  );
};

export default NFCCardsPage;