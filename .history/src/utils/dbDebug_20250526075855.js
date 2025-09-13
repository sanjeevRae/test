// Scroll to Top Button utility (React component)
import React, { useEffect, useState } from 'react';

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    visible && (
      <button
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 9999,
          padding: '14px 18px',
          background: '#222',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          fontSize: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          opacity: 0.85,
          transition: 'opacity 0.2s',
        }}
        aria-label="Scroll to top"
        title="Scroll to top"
        onMouseOver={e => (e.currentTarget.style.opacity = 1)}
        onMouseOut={e => (e.currentTarget.style.opacity = 0.85)}
      >
        ↑
      </button>
    )
  );
};

export default ScrollToTopButton;
