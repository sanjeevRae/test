import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, doc, getDoc, setDoc } from '../utils/firebase';
import './CardProfile.css';

const CardProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [accountStatus, setAccountStatus] = useState('active');
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'profiles', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          
          // Check if account is blocked or suspended
          if (data.status === 'blocked' || data.status === 'suspended') {
            setAccountStatus(data.status);
          }
          
          // Check if subscription has expired
          if (data.subscriptionExpires) {
            const now = new Date();
            const expiryDate = new Date(data.subscriptionExpires);
            if (expiryDate < now) {
              setSubscriptionExpired(true);
            }
          }
          
          // QR code scan tracking for premium/executive users
          if (["Premium", "Executive"].includes(data.category)) {
            const analyticsRef = doc(db, 'analytics', userId);
            const analyticsSnap = await getDoc(analyticsRef);
            const prev = analyticsSnap.exists() ? analyticsSnap.data().qrScans || 0 : 0;
            await setDoc(analyticsRef, { qrScans: prev + 1 }, { merge: true });
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="card-profile-container loading">
        <div className="loading-spinner-large"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="card-profile-container not-found">
        <div className="not-found-content">
          <div className="not-found-icon">404</div>
          <h2>Card Not Found</h2>
          <p>This digital business card doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (accountStatus === 'blocked') {
    return (
      <div className="card-profile-container blocked">
        <div className="status-message">
          <div className="status-icon">🚫</div>
          <h2>Account Blocked</h2>
          <p>This digital business card has been blocked by the administrator.</p>
          <p>Please contact support for more information.</p>
        </div>
      </div>
    );
  }

  if (accountStatus === 'suspended') {
    return (
      <div className="card-profile-container suspended">
        <div className="status-message">
          <div className="status-icon">⚠️</div>
          <h2>Account Suspended</h2>
          <p>This digital business card has been temporarily suspended.</p>
          <p>Please contact the account owner for more information.</p>
        </div>
      </div>
    );
  }

  if (subscriptionExpired && (profile.category === 'Premium' || profile.category === 'Executive')) {
    return (
      <div className="card-profile-container expired">
        <div className="status-message">
          <div className="status-icon">⏱️</div>
          <h2>Subscription Expired</h2>
          <p>The subscription for this digital business card has expired.</p>
          <p>Please contact the account owner to renew the subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-profile-container">
      <div className="digital-card">
        <div className="card-badge">E-VOX Card</div>
        
        <div className="card-header">
          {profile.photoURL && (
            <div className="card-photo-wrapper">
              <img src={profile.photoURL} alt={profile.name} className="card-photo" />
            </div>
          )}
          <h1 className="card-name">{profile.name}</h1>
          <p className="card-title">{profile.role} {profile.company && `at ${profile.company}`}</p>
        </div>
        
        <div className="card-content">
          <div className="card-section">
            <h3>Contact Information</h3>
            <div className="contact-grid">
              {profile.email && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <span>📧</span>
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Email</span>
                    <a href={`mailto:${profile.email}`} className="contact-value">{profile.email}</a>
                  </div>
                </div>
              )}
              
              {profile.phone && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <span>📱</span>
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Phone</span>
                    <a href={`tel:${profile.phone}`} className="contact-value">{profile.phone}</a>
                  </div>
                </div>
              )}
              
              {profile.website && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <span>🌐</span>
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Website</span>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="contact-value">{profile.website}</a>
                  </div>
                </div>
              )}
              
              {profile.location && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <span>📍</span>
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Location</span>
                    <span className="contact-value">{profile.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {profile.bio && (
            <div className="card-section">
              <h3>About</h3>
              <p className="card-bio">{profile.bio}</p>
            </div>
          )}
          
          {profile.socials && Object.keys(profile.socials).length > 0 && (
            <div className="card-section">
              <h3>Social Media</h3>
              <div className="social-links">
                {profile.socials.linkedin && (
                  <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin">LinkedIn</a>
                )}
                {profile.socials.twitter && (
                  <a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer" className="social-link twitter">Twitter</a>
                )}
                {profile.socials.instagram && (
                  <a href={profile.socials.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram">Instagram</a>
                )}
                {profile.socials.facebook && (
                  <a href={profile.socials.facebook} target="_blank" rel="noopener noreferrer" className="social-link facebook">Facebook</a>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="card-footer">
          <div className="eco-badge">
            <span className="eco-icon">♻️</span>
            <span>Eco-friendly digital card</span>
          </div>
          
          <p className="powered-by">
            Powered by <a href="/" className="e-vox-link"><span className="highlight">E</span>-VOX</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardProfile;
