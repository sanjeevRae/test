import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, doc, getDoc, setDoc } from '../utils/firebase';
import { QRCodeSVG } from 'qrcode.react';
import { trackProfileView, trackSocialLinkClick, trackContactSave } from '../utils/analytics';
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
          
          // Track profile view (always track, even for own profile for testing)
          try {
            console.log('=== PROFILE TRACKING DEBUG ===');
            console.log('About to track profile view for userId:', userId);
            console.log('Current URL:', window.location.href);
            
            await trackProfileView(userId, {
              type: 'profile_card_view',
              timestamp: Date.now(),
              viewer: 'direct_visit'
            });
            console.log('✅ Profile view tracked successfully for:', userId);
            console.log('=== PROFILE TRACKING SUCCESS ===');
          } catch (trackingError) {
            console.error('=== PROFILE TRACKING ERROR ===');
            console.error('Failed to track profile view:', trackingError);
            console.error('Error details:', trackingError.message);
            console.error('Error stack:', trackingError.stack);
          }
          
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

  const generateVCard = () => {
    if (!profile) {
      alert('Profile data not available');
      return;
    }

    const createAndDownloadVCard = (photoBase64 = null) => {
      const photoLine = photoBase64
        ? `PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}`
        : (profile.photoURL ? `PHOTO;VALUE=URI:${profile.photoURL}` : '');
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${profile.name || 'Unknown'}\nN:${profile.name ? profile.name.split(' ').reverse().join(';') : 'Unknown;;;;'}\nORG:${profile.company || ''}\nTITLE:${profile.role || ''}\nEMAIL:${profile.email || ''}\nTEL:${profile.phone || ''}\nURL:${profile.website || ''}\nADR:;;;;;;${profile.location || ''}\nNOTE:${profile.bio || ''}\n${photoLine}\nEND:VCARD`;
      try {
        const blob = new Blob([vcard], { type: 'text/vcard' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(profile.name || 'contact').replace(/\s+/g, '_')}_contact.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        // Track the contact save
        try {
          trackContactSave(userId, 'vcard_download');
        } catch (error) {
          console.error('Failed to track vCard download:', error);
        }
      } catch (error) {
        console.error('Failed to generate vCard:', error);
        alert('Failed to generate contact file');
      }
    };

    if (profile.photoURL) {
      fetch(profile.photoURL)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = function () {
            // Remove the data:image/jpeg;base64, prefix if present
            let base64 = reader.result;
            if (base64.startsWith('data:image')) {
              base64 = base64.substring(base64.indexOf(',') + 1);
            }
            createAndDownloadVCard(base64);
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          // If image fetch fails, fallback to URL
          createAndDownloadVCard(null);
        });
    } else {
      createAndDownloadVCard(null);
    }
  };

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


  // Only use default theme
  const themeClass = 'theme1';

  // Debug logging
  console.log('Profile data:', profile);
  console.log('Theme class:', themeClass);
  console.log('Loading state:', loading);
  console.log('generateVCard function:', typeof generateVCard);

  if (loading) {
    return (
      <div className={`card-profile-container loading ${themeClass}`}>
        <div className="loading-spinner-large"></div>
        <p className="loading-text">Loading profile...</p>
      </div>
    );
  }


  if (notFound) {
    return (
      <div className={`card-profile-container not-found ${themeClass}`}>
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
      <div className={`card-profile-container blocked ${themeClass}`}>
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
      <div className={`card-profile-container suspended ${themeClass}`}>
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
      <div className={`card-profile-container ${themeClass}`}>
        <div className="digital-card" ref={cardRef}>
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
                  <h3 className="card-title">{profile.role}</h3>
                </div>
                <div className="card-title-row">
                  {profile.company && <p className="card-company">{profile.company}</p>}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                  <span className={`status-indicator ${profile.status !== 'active' ? 'offline' : ''}`}></span>
                  <span className="status-text">{profile.status === 'active' ? 'Available' : 'Unavailable'}</span>
                </div>
              </div>
            </div>
            <div className="profile-action-buttons">
              <button 
                onClick={async () => {
                  try {
                    await trackContactSave(userId, 'email_click');
                    window.open(`mailto:${profile.email}?subject=Connecting%20with%20${profile.name}&body=Hi%20${profile.name},%0A%0AI%20found%20your%20digital%20business%20card%20and%20wanted%20to%20connect.%0A%0ABest%20regards,`);
                  } catch (error) {
                    console.error('Failed to track email click:', error);
                    window.open(`mailto:${profile.email}?subject=Connecting%20with%20${profile.name}&body=Hi%20${profile.name},%0A%0AI%20found%20your%20digital%20business%20card%20and%20wanted%20to%20connect.%0A%0ABest%20regards,`);
                  }
                }} 
                className="action-button primary-button"
                style={{ minWidth: '80px', minHeight: '40px' }}
              >
                Contact
              </button>
              <button 
                onClick={generateVCard} 
                className="action-button outline-button"
                style={{ minWidth: '100px', minHeight: '40px' }}
              >
                Save Contact
              </button>
              <button 
                onClick={() => setIsShareModalOpen(true)} 
                className="action-button outline-button"
                style={{ minWidth: '80px', minHeight: '40px' }}
              >
                Share
              </button>
            </div>
            {profile.bio && (
              <div className="bio-section">
                <div className="section-title"></div>
                <p className="card-bio">{profile.bio}</p>
              </div>
            )}
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
            <div className="tab-content">
              {activeTab === 'info' && (
                <div className="contact-grid">
                  {profile.email && (
                    <div className="contact-item" onClick={() => {
                      trackContactSave(userId, 'email_contact_click');
                      window.location.href = `mailto:${profile.email}`;
                    }}>
                      <div className="contact-icon email">✉️</div>
                      <div className="contact-info">
                        <span className="contact-label">Email</span>
                        <a href={`mailto:${profile.email}`} className="contact-value" onClick={(e) => {
                          e.preventDefault();
                          trackContactSave(userId, 'email_link_click');
                          window.location.href = `mailto:${profile.email}`;
                        }}>{profile.email}</a>
                      </div>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="contact-item" onClick={() => {
                      trackContactSave(userId, 'phone1_contact_click');
                      window.location.href = `tel:${profile.phone}`;
                    }}>
                      <div className="contact-icon phone">📱</div>
                      <div className="contact-info">
                        <span className="contact-label">Phone 1</span>
                        <a href={`tel:${profile.phone}`} className="contact-value" onClick={(e) => {
                          e.preventDefault();
                          trackContactSave(userId, 'phone1_link_click');
                          window.location.href = `tel:${profile.phone}`;
                        }}>{profile.phone}</a>
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
                      <a 
                        href={profile.socials.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link linkedin" 
                        title="LinkedIn"
                        onClick={async (e) => {
                          try {
                            await trackSocialLinkClick(userId, 'linkedin', profile.socials.linkedin);
                          } catch (error) {
                            console.error('Failed to track LinkedIn click:', error);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      </a>
                    )}
                    {profile.socials && profile.socials.tiktok && (
                      <a 
                        href={profile.socials.tiktok} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link tiktok" 
                        title="TikTok"
                        onClick={async (e) => {
                          try {
                            await trackSocialLinkClick(userId, 'tiktok', profile.socials.tiktok);
                          } catch (error) {
                            console.error('Failed to track TikTok click:', error);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-tiktok" viewBox="0 0 16 16">
                          <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
                        </svg>
                      </a>
                    )}
                    {profile.socials && profile.socials.instagram && (
                      <a 
                        href={profile.socials.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link instagram" 
                        title="Instagram"
                        onClick={async (e) => {
                          try {
                            await trackSocialLinkClick(userId, 'instagram', profile.socials.instagram);
                          } catch (error) {
                            console.error('Failed to track Instagram click:', error);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {profile.socials && profile.socials.facebook && (
                      <a 
                        href={profile.socials.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link facebook" 
                        title="Facebook"
                        onClick={async (e) => {
                          try {
                            await trackSocialLinkClick(userId, 'facebook', profile.socials.facebook);
                          } catch (error) {
                            console.error('Failed to track Facebook click:', error);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                      </a>
                    )}
                    {profile.website && (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link website" 
                        title="Website"
                        onClick={() => trackSocialLinkClick(userId, 'website', profile.website)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm1 16.057v-3.057h2.994c-.059 1.143-.212 2.24-.456 3.279-.823-.12-1.674-.188-2.538-.222zm1.957 2.162c-.499 1.33-1.159 2.497-1.957 3.456v-3.62c.666.028 1.319.081 1.957.164zm-1.957-7.219v-3.015c.868-.034 1.721-.103 2.548-.224.238 1.027.389 2.111.446 3.239h-2.994zm0-5.014v-3.661c.806.969 1.471 2.15 1.971 3.496-.642.084-1.3.137-1.971.165zm2.703-3.267c1.237.496 2.354 1.228 3.29 2.146-.642.234-1.311.442-2.019.607-.344-.992-.775-1.91-1.271-2.753zm-7.241 13.56c-.244-1.039-.398-2.136-.456-3.279h2.994v3.057c-.865.034-1.714.102-2.538.222zm2.538 1.776v3.62c-.798-.959-1.458-2.126-1.957-3.456.638-.083 1.291-.136 1.957-.164zm-2.994-7.055c.057-1.128.207-2.212.446-3.239.827.121 1.68.19 2.548.224v3.015h-2.994zm1.024-5.179c.5-1.346 1.165-2.527 1.97-3.496v3.661c-.671-.028-1.329-.081-1.97-.165zm-2.005-.35c-.708-.165-1.377-.373-2.018-.607.937-.918 2.053-1.65 3.29-2.146-.496.844-.927 1.762-1.272 2.753zm-.549 1.918c-.264 1.151-.434 2.36-.492 3.611h-3.933c.165-1.658.739-3.197 1.617-4.518.88.361 1.816.67 2.808.907zm.009 9.262c-.988.236-1.92.542-2.797.9-.89-1.328-1.471-2.879-1.637-4.551h3.934c.058 1.265.231 2.488.5 3.651zm.553 1.917c.342.976.768 1.881 1.257 2.712-1.223-.49-2.326-1.211-3.256-2.115.636-.229 1.299-.435 1.999-.597zm9.924 0c.7.163 1.362.367 1.999.597-.931.903-2.034 1.625-3.257 2.116.489-.832.915-1.737 1.258-2.713zm.553-1.917c.27-1.163.442-2.386.501-3.651h3.934c-.167 1.672-.748 3.223-1.638 4.551-.877-.358-1.81-.664-2.797-.9zm.501-5.651c-.058-1.251-.229-2.46-.492-3.611.992-.237 1.929-.546 2.809-.907.877 1.321 1.451 2.86 1.616 4.518h-3.933z"/>
                        </svg>
                      </a>
                    )}
                    {profile.socials && profile.socials.youtube && (
                      <a 
                        href={profile.socials.youtube} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link youtube" 
                        title="YouTube"
                        onClick={() => trackSocialLinkClick(userId, 'youtube', profile.socials.youtube)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'qr' && (
                <div className="qr-code-container">
                  <div className="qr-code">
                    <QRCodeSVG value={window.location.href} size={150} />
                  </div>
                  <p className="qr-label">Scan to view this digital card</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isShareModalOpen && <ShareModal />}
    </>
  );
};

export default CardProfile;