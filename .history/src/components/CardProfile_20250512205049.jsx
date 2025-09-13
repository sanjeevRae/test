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
        return '🐦';
      case 'instagram':
        return '📸';
      case 'facebook':
        return '👤';
      default:
        return '🌐';
    }
  };
  
  // Contact icons mapping
  const getContactIcon = (type) => {
    switch(type.toLowerCase()) {
      case 'email':
        return '📧';
      case 'phone':
        return '📱';
      case 'website':
        return '🌐';
      case 'location':
        return '📍';
      default:
        return '✉️';
    }
  };
  
  // Share modal for sharing the profile
  const ShareModal = () => (
    <div className={`share-modal ${isShareModalOpen ? 'open' : ''}`}>
      <div className="share-modal-content glass-effect">
        <button className="close-modal-btn" onClick={() => setIsShareModalOpen(false)}>✕</button>
        <h3>Share {profile?.name}'s Profile</h3>
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
          <div className="card-badge">
            {profile.category === 'Executive' ? 'Executive' : (profile.category === 'Premium' ? 'Premium' : 'E-VOX Card')}
          </div>
          
          <div className="card-header">
            <div className="card-header-pattern"></div>
            {profile.photoURL && (
              <div className="card-photo-wrapper">
                <img src={profile.photoURL} alt={profile.name} className="card-photo" loading="lazy" />
              </div>
            )}
            <h1 className="card-name">{profile.name}</h1>
            <p className="card-title">{profile.role} {profile.company && `at ${profile.company}`}</p>
            
            {profile.category && (
              <div className="status-badge">
                <span className={`status-indicator status-${profile.status || 'active'}`}></span>
                {profile.status === 'active' ? 'Available' : 'Unavailable'}
              </div>
            )}
          </div>
          
          <div className="card-content">
            <div className="card-section" id="contact-info">
              <h3>Contact Information</h3>
              <div className="contact-grid">
                {profile.email && (
                  <div className="contact-item" title="Send an email" onClick={() => window.location.href = `mailto:${profile.email}`}>
                    <div className="contact-icon">
                      <span>{getContactIcon('email')}</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">Email</span>
                      <a href={`mailto:${profile.email}`} className="contact-value">{profile.email}</a>
                    </div>
                  </div>
                )}
                
                {profile.phone && (
                  <div className="contact-item" title="Call or message" onClick={() => window.location.href = `tel:${profile.phone}`}>
                    <div className="contact-icon">
                      <span>{getContactIcon('phone')}</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">Phone</span>
                      <a href={`tel:${profile.phone}`} className="contact-value">{profile.phone}</a>
                    </div>
                  </div>
                )}
                
                {profile.website && (
                  <div className="contact-item" title="Visit website" onClick={() => window.open(profile.website, '_blank')}>
                    <div className="contact-icon">
                      <span>{getContactIcon('website')}</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">Website</span>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="contact-value">{profile.website}</a>
                    </div>
                  </div>
                )}
                
                {profile.location && (
                  <div className="contact-item" title="View location" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(profile.location)}`, '_blank')}>
                    <div className="contact-icon">
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
            
            {profile.bio && (
              <div className="card-section" ref={bioRef}>
                <h3>About</h3>
                <p className="card-bio">{profile.bio}</p>
              </div>
            )}
            
            {profile.socials && Object.keys(profile.socials).length > 0 && (
              <div className="card-section" id="social-links">
                <h3>Social Media</h3>
                <div className="social-links">
                  {Object.entries(profile.socials).map(([platform, url]) => (
                    url && (
                      <a 
                        key={platform} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`social-link ${platform.toLowerCase()}`}
                      >
                        <span>{getSocialIcon(platform)}</span> {platform}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="card-footer">
            <div className="eco-badge" title="This digital card helps reduce paper waste">
              <span className="eco-icon">♻️</span>
              <span>Eco-friendly digital card</span>
            </div>
            
            <p className="powered-by">
              Powered by <a href="/" className="e-vox-link"><span className="highlight">E</span>-VOX</a>
            </p>
            
            <div className="card-actions">
              <button 
                onClick={() => window.open(`mailto:${profile.email}?subject=Connecting%20with%20${profile.name}&body=Hi%20${profile.name},%0A%0AI%20found%20your%20digital%20business%20card%20and%20wanted%20to%20connect.%0A%0ABest%20regards,`)} 
                className="action-button" 
                title="Send email"
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
                title="Save to contacts"
              >
                Save Contact
              </button>
              <button 
                onClick={() => setIsShareModalOpen(true)} 
                className="action-button share-button" 
                title="Share this profile"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {isShareModalOpen && <ShareModal />}
    </>
  );
};

export default CardProfile;
