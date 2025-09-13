import React, { useEffect, useState, useRef } from 'react';
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const cardRef = useRef(null);
  
  // Add animation effect on mount
  useEffect(() => {
    if (cardRef.current) {
      setTimeout(() => {
        cardRef.current.classList.add('card-loaded');
      }, 100);
    }
  }, [loading]);
  
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

  // Share modal for sharing the profile
  const ShareModal = () => (
    <div className={`share-modal ${isShareModalOpen ? 'open' : ''}`}>
      <div className="share-modal-content">
        <button className="close-modal-btn" onClick={() => setIsShareModalOpen(false)}>✕</button>
        <h3>Share {profile?.name}'s Card</h3>
        <p>Share this digital business card with others</p>
        <div className="copy-link">
          <input 
            type="text" 
            readOnly 
            value={window.location.href} 
            onClick={(e) => e.target.select()}
          />
          <button onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
          }}>
            Copy
          </button>
        </div>
        <div className="share-options">
          <a href={`https://wa.me/?text=${encodeURIComponent(`Check out ${profile?.name}'s digital business card: ${window.location.href}`)}`} 
             target="_blank" rel="noopener noreferrer" className="share-option whatsapp">
            WhatsApp
          </a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${profile?.name}'s digital business card`)}`}
             target="_blank" rel="noopener noreferrer" className="share-option telegram">
            Telegram
          </a>
          <a href={`mailto:?subject=Digital Business Card - ${profile?.name}&body=Check out ${profile?.name}'s digital business card: ${window.location.href}`}
             className="share-option email">
            Email
          </a>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="card-profile-container loading">
        <div className="loading-spinner-large"></div>
        <p className="loading-text">Loading profile...</p>
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
    <>
      <div className="card-profile-container">
        <div className="digital-card" ref={cardRef}>
          {/* Profile hero with large image (50% of screen) */}
          <div className="profile-hero">
            <div className="profile-cover"></div>
            <div className="profile-photo-container">
              {profile.photoURL ? (
                <div className="profile-photo-wrapper" style={{ overflow: "hidden", borderRadius: 0 }}>
                  <img 
                    src={profile.photoURL} 
                    alt={profile.name} 
                    className="profile-photo" 
                    loading="lazy" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 0 }}
                  />
                </div>
              ) : (
                <div className="profile-photo-wrapper" style={{ background: '#6c5ce7', borderRadius: 0 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%', 
                    fontSize: '5rem',
                    color: 'white'
                  }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Profile info section */}
          <div className="profile-info">
            <div className="profile-header">
              <div className="profile-name-section">
                <h1 className="card-name">
                  {profile.name}
                  {profile.category === 'Executive' && (
                    <span className="verified-badge" title="Verified">✓</span>
                  )}
                </h1>
                <div className="card-title-row">
                  <p className="card-title">{profile.role}</p>
                  {profile.company && <p className="card-company">@{profile.company}</p>}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                  <span className={`status-indicator ${profile.status !== 'active' ? 'offline' : ''}`}></span>
                  <span className="status-text">{profile.status === 'active' ? 'Available' : 'Unavailable'}</span>
                </div>
              </div>
              
              <div className="profile-stats">
                <div className="stat-item" title="Category">
                  <div className="stat-value">{profile.category || 'Basic'}</div>
                  {/* Removed the "Level" label as requested */}
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="profile-action-buttons">
              <button 
                onClick={() => window.open(`mailto:${profile.email}?subject=Connecting%20with%20${profile.name}&body=Hi%20${profile.name},%0A%0AI%20found%20your%20digital%20business%20card%20and%20wanted%20to%20connect.%0A%0ABest%20regards,`)} 
                className="action-button primary-button"
              >
                Contact
              </button>
              <button 
                onClick={() => {
                  const vcfData = `BEGIN:VCARD
VERSION:3.0
FN:${profile.name}
TITLE:${profile.role || ''}
ORG:${profile.company || ''}
EMAIL:${profile.email || ''}
TEL:${profile.phone || ''}
URL:${profile.website || ''}
NOTE:${profile.bio || ''}
END:VCARD`;
                  
                  const blob = new Blob([vcfData], { type: 'text/vcard' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${profile.name.replace(/\s+/g, '_')}.vcf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }} 
                className="action-button secondary-button"
              >
                Save
              </button>
              <button 
                onClick={() => setIsShareModalOpen(true)} 
                className="action-button outline-button"
              >
                Share
              </button>
            </div>
            
            {/* Bio section */}
            {profile.bio && (
              <div className="bio-section">
                <p className="card-bio">{profile.bio}</p>
              </div>
            )}
            
            {/* Tab navigation */}
            <div className="profile-tabs">
              <div 
                className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </div>
              <div 
                className={`profile-tab ${activeTab === 'socials' ? 'active' : ''}`}
                onClick={() => setActiveTab('socials')}
              >
                Social
              </div>
              <div 
                className={`profile-tab ${activeTab === 'qr' ? 'active' : ''}`}
                onClick={() => setActiveTab('qr')}
              >
                QR Code
              </div>
            </div>
            
            {/* Tab content */}
            <div className="tab-content">
              {activeTab === 'info' && (
                <div className="contact-grid">
                  {profile.email && (
                    <div className="contact-item" onClick={() => window.location.href = `mailto:${profile.email}`}>
                      <div className="contact-icon email">✉️</div>
                      <div className="contact-info">
                        <span className="contact-label">Email</span>
                        <a href={`mailto:${profile.email}`} className="contact-value">{profile.email}</a>
                      </div>
                    </div>
                  )}
                  
                  {profile.phone && (
                    <div className="contact-item" onClick={() => window.location.href = `tel:${profile.phone}`}>
                      <div className="contact-icon phone">📱</div>
                      <div className="contact-info">
                        <span className="contact-label">Phone</span>
                        <a href={`tel:${profile.phone}`} className="contact-value">{profile.phone}</a>
                      </div>
                    </div>
                  )}
                  
                  {profile.website && (
                    <div className="contact-item" onClick={() => window.open(profile.website, '_blank')}>
                      <div className="contact-icon website">🌐</div>
                      <div className="contact-info">
                        <span className="contact-label">Website</span>
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="contact-value">
                          {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {profile.location && (
                    <div className="contact-item" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(profile.location)}`, '_blank')}>
                      <div className="contact-icon location">📍</div>
                      <div className="contact-info">
                        <span className="contact-label">Location</span>
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(profile.location)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="contact-value"
                        >
                          {profile.location}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'socials' && (
                <div className="social-section">
                  <div className="social-links">
                    {profile.socials && profile.socials.linkedin && (
                      <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin" title="LinkedIn">
                        👔
                      </a>
                    )}
                    {profile.socials && profile.socials.twitter && (
                      <a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer" className="social-link twitter" title="Twitter/X">
                        𝕏
                      </a>
                    )}
                    {profile.socials && profile.socials.instagram && (
                      <a href={profile.socials.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram" title="Instagram">
                        📸
                      </a>
                    )}
                    {profile.socials && profile.socials.facebook && (
                      <a href={profile.socials.facebook} target="_blank" rel="noopener noreferrer" className="social-link facebook" title="Facebook">
                        👤
                      </a>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="social-link website" title="Website">
                        🌐
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'qr' && (
                <div className="qr-code-container">
                  <div className="qr-code">
                    {/* This would be a QR code image in a real implementation */}
                    <div style={{
                      width: '150px',
                      height: '150px',
                      margin: '0 auto',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #ddd'
                    }}>
                      QR Code
                    </div>
                  </div>
                  <p className="qr-label">Scan to view this digital card</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="card-footer">
              <div className="eco-badge">
                <span>♻️</span>
                <span>Eco-friendly digital card</span>
              </div>
              
              <p className="powered-by">
                Powered by <a href="/" className="e-vox-link"><span>E</span>-VOX</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {isShareModalOpen && <ShareModal />}
    </>
  );
};

export default CardProfile;
