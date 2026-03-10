import React, { useState, useEffect } from 'react';
import './WelcomeModal.css';

const WelcomeModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hasSeenNotice = localStorage.getItem('evox_vacancy_notice_seen');
    if (!hasSeenNotice) {
      setTimeout(() => {
        setIsVisible(true);
      }, 500);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('evox_vacancy_notice_seen', 'true');
    }
    setIsVisible(false);
  };

  const handleViewJob = () => {
    window.open('/src/assets/job.pdf', '_blank', 'noopener,noreferrer');
  };

  if (!isVisible) return null;

  return (
    <div className="welcome-modal-overlay" onClick={handleClose}>
      <div className="welcome-modal-content vacancy-notice" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-banner">
          <span>N</span>
          <span>O</span>
          <span>T</span>
          <span>I</span>
          <span>C</span>
          <span>E</span>
        </div>

        <h2 className="welcome-title">Job Vacancy: Graphic &amp; Web Designer</h2>

        <div className="welcome-body">
          <p className="welcome-description">
            <strong>E-VOX Pvt. Ltd.</strong> is hiring a <strong>Graphic &amp; Web Designer</strong>. 
            If you meet the following requirements, we'd love to hear from you!
          </p>
          <ul className="vacancy-requirements">
            <li>Minimum Experience: At least 2 years in a Graphic &amp; Web Design role.</li>
            <li>Bachelor's degree in BCA, BIM, BIT or a related field.</li>
            <li>Minimum 1 year of professional experience in graphic or web design.</li>
            <li>Familiarity with design software such as Adobe Creative Suite (Photoshop, Illustrator, etc.).</li>
            <li>Strong attention to detail, organizational skills, and proactive work ethic.</li>
            <li>Ability to work independently and meet deadlines.</li>
          </ul>
        </div>

        <div className="welcome-footer">
          <label className="welcome-checkbox">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Don't show this again</span>
          </label>

          <div className="vacancy-buttons">
            <button className="welcome-button vacancy-view-btn" onClick={handleViewJob}>
              View Job
            </button>
            <button className="welcome-button" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
   
   
  );
};

export default WelcomeModal;
