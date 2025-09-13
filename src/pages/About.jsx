import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

const About = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Navigate to the homepage and scroll to the about section
    navigate('/', { state: { scrollTo: 'about' }, replace: true });
  }, [navigate]);

  // This component will render briefly before redirecting
  return (
    <div className="about-page">
      <h1>Redirecting to About section...</h1>
    </div>
  );
};

export default About;