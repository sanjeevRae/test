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
  const cardRef = useRef(null);
  const bioRef = useRef(null);
  
  // Add animation effect on mount and content reveal
  useEffect(() => {
    if (cardRef.current) {
      setTimeout(() => {
        cardRef.current.classList.add('card-loaded');
      }, 100);
    }
    
    // Bio text reveal animation
    if (bioRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            bioRef.current.style.opacity = '1';
            bioRef.current.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.3 }
      );
      
      observer.observe(bioRef.current);
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

  // Social media icons mapping
  const getSocialIcon = (platform) => {
    switch(platform.toLowerCase()) {
      case 'linkedin':
        return '👔';
      case 'twitter':
        return '𝕏';
      case 'instagram':
        return '📸';
      case 'facebook':
        return '👤';
      case 'website':
        return '🌐';
      default:
        return '🔗';
    }
  };
  
  // Contact icons mapping
  const getContactIcon = (type) => {
    switch(type.toLowerCase()) {
      case 'email':
        return '✉️';
      case 'phone':
        return '📱';
      case 'website':
        return '🌐';
      case 'location':
        return '📍';
      default:
        return '📇';
    }
  };
  
  // Share modal for sharing the profile
  const ShareModal = () => (
    <div className={`share-modal ${isShareModalOpen ? 'open' : ''}`}>
      <div className="share-modal-content">
        <button className="close-modal-btn" onClick={() => setIsShareModalOpen(false)}>✕</button>
        <h3>Share {profile?.name}'s Card</h3>
        <p>Share this digital business card with others:</p>
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
          <div className="content-wrapper">
            {/* Profile header with photo */}
            <div className="profile-header">
              <div className="profile-photo-container">
                {profile.photoURL && (
                  <div className="profile-photo-wrapper">
                    <div className="glow-effect"></div>
                    <img src={profile.photoURL} alt={profile.name} className="card-photo" loading="lazy" />
                  </div>
                )}
              </div>
              
              <h1 className="card-name">{profile.name}</h1>
              <p className="card-title">{profile.role}</p>
              {profile.company && <p className="card-company">at {profile.company}</p>}
              
              {profile.status && (
                <div className="status-badge">
                  <span className={`status-indicator status-${profile.status || 'active'}`}></span>
                  {profile.status === 'active' ? 'Available' : 'Unavailable'}
                </div>
              )}
            </div>
            
            {/* Bio section */}
            {profile.bio && (
              <>
                <div className="bio-section" ref={bioRef}>
                  <p className="card-bio">{profile.bio}</p>
                </div>
                <hr className="glowing-divider" />
              </>
            )}
            
            {/* Contact information */}
            <div className="contact-section">
              <div className="contact-grid">
                {profile.email && (
                  <div className="contact-item" onClick={() => window.location.href = `mailto:${profile.email}`}>
                    <div className="contact-icon email">
                      <span>{getContactIcon('email')}</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">Email</span>
                      <a href={`mailto:${profile.email}`} className="contact-value">{profile.email}</a>
                    </div>
                  </div>
                )}
                
                {profile.phone && (
                  <div className="contact-item" onClick={() => window.location.href = `tel:${profile.phone}`}>
                    <div className="contact-icon phone">
                      <span>{getContactIcon('phone')}</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">Phone</span>
                      <a href={`tel:${profile.phone}`} className="contact-value">{profile.phone}</a>
                    </div>
                  </div>
                )}
                
                {profile.website && (
                  <div className="contact-item" onClick={() => window.open(profile.website, '_blank')}>
                    <div className="contact-icon website">
                      <span>{getContactIcon('website')}</span>
                    </div>
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
                    <div className="contact-icon location">
                      <span>{getContactIcon('location')}</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">Location</span>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(profile.location)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="contact-value location-link"
                      >
                        {profile.location}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <hr className="glowing-divider" />
            
            {/* Social media links */}
            {profile.socials && Object.keys(profile.socials).length > 0 && (
              <div className="social-section">
                <div className="social-links">
                  {Object.entries(profile.socials).map(([platform, url]) => (
                    url && (
                      <a 
                        key={platform} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`social-link ${platform.toLowerCase()}`}
                        title={platform}
                      >
                        <span className="social-icon">{getSocialIcon(platform)}</span>
                      </a>
                    )
                  ))}
                  {profile.website && !profile.socials.website && (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-link website"
                      title="Website"
                    >
                      <span className="social-icon">{getSocialIcon('website')}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Footer with actions */}
            <div className="card-footer">
              <div className="action-buttons">
                <button 
                  onClick={() => window.open(`mailto:${profile.email}?subject=Connecting%20with%20${profile.name}&body=Hi%20${profile.name},%0A%0AI%20found%20your%20digital%20business%20card%20and%20wanted%20to%20connect.%0A%0ABest%20regards,`)}
                  className="action-button" 
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
                  className="action-button" 
                >
                  Save Contact
                </button>
              </div>
              
              <div className="eco-badge">
                <span>♻️</span>
                <span>Eco-friendly digital card</span>
              </div>
              
              <p className="powered-by">
                Powered by <a href="/" className="e-vox-link"><span className="highlight">E</span>-VOX</a>
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
