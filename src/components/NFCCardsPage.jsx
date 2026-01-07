import React, { useEffect } from 'react';
import Navbar from './Navbar';
import HomePage from './HomePage';

const NFCCardsPage = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      {/* Navbar Component */}
      <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <Navbar />
      </div>
      
      {/* HomePage Component (which includes HeroSection) */}
      <div>
        <HomePage />
      </div>
    </div>
  );
};

export default NFCCardsPage;