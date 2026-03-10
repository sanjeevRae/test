import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOpenJobs } from '../utils/jobs';
import Navbar from './Navbar';
import './CareerPage.css';

const CareerPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const openJobs = await fetchOpenJobs();
        setJobs(openJobs);
      } catch (err) {
        console.error('Error loading jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  const isExpired = (deadline) => {
    if (!deadline) return false;
    const d = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return d < new Date();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <>
      <Navbar />
      <div className="career-page">
        <div className="career-header">
          <h1>Career Opportunities</h1>
          <p>Join E-VOX Pvt. Ltd. and be part of Nepal's leading IT and cybersecurity company.</p>
        </div>

        {loading ? (
          <div className="career-loading">
            <div className="career-spinner"></div>
            <p>Loading job listings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="career-empty">
            <div className="career-empty-icon">📋</div>
            <h2>No Open Positions</h2>
            <p>There are currently no open positions. Please check back later!</p>
            <button className="career-back-btn" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
          </div>
        ) : (
          <div className="career-grid">
            {jobs.filter(job => !isExpired(job.deadline)).map((job) => (
              <div key={job.id} className="career-card">
                <div className="career-card-header">
                  <h2>{job.title}</h2>
                  {job.type && <span className="career-tag">{job.type}</span>}
                </div>

                {job.description && (
                  <p className="career-description">{job.description}</p>
                )}

                {job.requirements && job.requirements.length > 0 && (
                  <div className="career-requirements">
                    <h3>Requirements</h3>
                    <ul>
                      {job.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.salary && (
                  <div className="career-detail">
                    <span className="career-detail-label">Salary:</span>
                    <span>{job.salary}</span>
                  </div>
                )}

                {job.location && (
                  <div className="career-detail">
                    <span className="career-detail-label">Location:</span>
                    <span>{job.location}</span>
                  </div>
                )}

                <div className="career-card-footer">
                  {job.deadline && (
                    <span className="career-deadline">
                      Deadline: {formatDate(job.deadline)}
                    </span>
                  )}
                  <a
                    href={`mailto:info@e-voxtech.com?subject=Application for ${encodeURIComponent(job.title)}&body=Dear E-VOX Team,%0A%0AI am writing to apply for the position of ${encodeURIComponent(job.title)}.%0A%0A`}
                    className="career-apply-btn"
                  >
                    ✉ Apply Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default CareerPage;
