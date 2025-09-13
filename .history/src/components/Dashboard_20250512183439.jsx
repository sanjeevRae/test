import React, { useState, useEffect, useRef } from 'react';
import { auth, db, doc, getDoc, setDoc, deleteDoc, storage } from '../utils/firebase';
import { getUserRole } from '../utils/auth';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    bio: '',
    photoURL: '',
    socials: {
      linkedin: '',
      twitter: '',
      instagram: '',
      facebook: ''
    }
  });
  const [formMode, setFormMode] = useState('create');
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          setUser(currentUser);
          
          // Get user role from custom claims
          const role = await getUserRole();
          setUserRole(role);
          
          // Fetch user's data
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Update role in Firestore if it doesn't match the claims
            if (userData.role !== role) {
              await setDoc(userDocRef, { role }, { merge: true });
            }
            
            if (userData.cards && userData.cards.length > 0) {
              const fetchedCards = [];
              
              for (const cardId of userData.cards) {
                const cardDocRef = doc(db, 'profiles', cardId);
                const cardDoc = await getDoc(cardDocRef);
                
                if (cardDoc.exists()) {
                  fetchedCards.push({
                    id: cardId,
                    ...cardDoc.data()
                  });
                }
              }
              
              setCards(fetchedCards);
              
              if (fetchedCards.length > 0) {
                setActiveCard(fetchedCards[0]);
                setFormData(fetchedCards[0]);
                setFormMode('edit');
                setShareUrl(`${window.location.origin}/card/${fetchedCards[0].id}`);
              }
            }
          } else {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              email: currentUser.email,
              displayName: currentUser.displayName || '',
              role: role,
              createdAt: new Date().toISOString(),
              cards: []
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      showToastMessage("Please select an image file (JPEG, PNG, etc.)");
      return;
    }
    
    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showToastMessage("Image is too large. Please select an image under 5MB.");
      return;
    }
    
    setUploadingPhoto(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      
      // Create a unique path for the image
      const path = `profile-photos/${currentUser.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      
      console.log(`Starting upload for file: ${file.name} (${file.size} bytes) to path: ${path}`);
      
      // Use direct upload method rather than using ref() to avoid multiple layers of abstraction
      const uploadResult = await storage.uploadFile(file, path, {
        metadata: {
          userId: currentUser.uid,
          uploadedAt: new Date().toISOString()
        }
      });
      
      if (!uploadResult) {
        throw new Error("Upload failed - no result returned");
      }
      
      // Get the URL directly from the upload result
      const downloadURL = await uploadResult.getDownloadURL();
      
      console.log("File uploaded successfully, URL:", downloadURL);
      
      // Update form data with new photo URL
      setFormData({
        ...formData,
        photoURL: downloadURL
      });
      
      showToastMessage("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      showToastMessage("Failed to upload photo: " + (error.message || "Please try again"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      if (formMode === 'create') {
        // Check if user already has a card (limit to one card per user unless admin)
        if (cards.length > 0 && userRole !== 'admin') {
          throw new Error("You can only have one business card. Please update your existing card.");
        }
        
        // Generate a unique ID for the card
        const cardId = `${currentUser.uid}_${Date.now()}`;
        
        // Save card data in profiles collection
        const cardDocRef = doc(db, 'profiles', cardId);
        await setDoc(cardDocRef, {
          ...formData,
          userId: currentUser.uid,
          createdAt: new Date().toISOString()
        });
        
        // Update user's cards array
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          let updatedCards;
          
          // If admin, can have multiple cards. If regular user, replace existing card
          if (userRole === 'admin') {
            updatedCards = userData.cards ? [...userData.cards, cardId] : [cardId];
          } else {
            // For regular users, only have one card
            updatedCards = [cardId];
          }
          
          await setDoc(userDocRef, {
            ...userData,
            cards: updatedCards
          });
          
          // Update local state
          const newCard = {
            id: cardId,
            ...formData,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
          };
          
          if (userRole === 'admin') {
            setCards([...cards, newCard]);
          } else {
            setCards([newCard]);
          }
          
          setActiveCard(newCard);
          setFormMode('edit');
          setShareUrl(`${window.location.origin}/card/${cardId}`);
          
          // Show success toast
          showToastMessage("Card created successfully!");
          
        } else {
          // Create new user document
          await setDoc(userDocRef, {
            email: currentUser.email,
            displayName: currentUser.displayName || '',
            role: userRole,
            cards: [cardId]
          });
          
          // Update local state
          const newCard = {
            id: cardId,
            ...formData,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
          };
          
          setCards([newCard]);
          setActiveCard(newCard);
          setFormMode('edit');
          setShareUrl(`${window.location.origin}/card/${cardId}`);
          
          // Show success toast
          showToastMessage("Card created successfully!");
        }
        
      } else if (formMode === 'edit' && activeCard) {
        // Update existing card
        const cardDocRef = doc(db, 'profiles', activeCard.id);
        await setDoc(cardDocRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // Update local state
        const updatedCards = cards.map(card => 
          card.id === activeCard.id ? { ...card, ...formData, updatedAt: new Date().toISOString() } : card
        );
        
        setCards(updatedCards);
        setActiveCard({ ...activeCard, ...formData, updatedAt: new Date().toISOString() });
        
        // Show success toast
        showToastMessage("Card updated successfully!");
      }
    } catch (error) {
      console.error("Error saving card:", error);
      showToastMessage(error.message || "Error saving card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    // Only allow new card creation for admin or if user has no cards
    if (userRole !== 'admin' && cards.length > 0) {
      showToastMessage("You can only have one business card. Please update your existing card.");
      return;
    }
    
    setActiveCard(null);
    setFormData({
      name: '',
      role: '',
      company: '',
      email: '',
      phone: '',
      website: '',
      location: '',
      bio: '',
      photoURL: '',
      socials: {
        linkedin: '',
        twitter: '',
        instagram: '',
        facebook: ''
      }
    });
    setFormMode('create');
    setShareUrl('');
    setActiveTab('edit');
  };

  const handleSelectCard = (card) => {
    setActiveCard(card);
    setFormData(card);
    setFormMode('edit');
    setShareUrl(`${window.location.origin}/card/${card.id}`);
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to delete this card? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Delete card from profiles collection
      const cardDocRef = doc(db, 'profiles', cardId);
      await deleteDoc(cardDocRef);
      
      // Update user's cards array
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const updatedCards = userData.cards.filter(id => id !== cardId);
          
          await setDoc(userDocRef, {
            ...userData,
            cards: updatedCards
          });
        }
      }
      
      // Update local state
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
      
      if (activeCard && activeCard.id === cardId) {
        if (updatedCards.length > 0) {
          handleSelectCard(updatedCards[0]);
        } else {
          handleCreateNew();
        }
      }
      
      showToastMessage("Card deleted successfully!");
    } catch (error) {
      console.error("Error deleting card:", error);
      showToastMessage("Error deleting card. Please try again.");
    }
  };

  const viewCardProfile = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };
  
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Business Card Manager</h1>
        <p className="dashboard-subtitle">
          {userRole === 'admin' 
            ? 'Admin Dashboard - Create and manage multiple business cards' 
            : 'Create and manage your professional digital business card'}
        </p>
        {userRole === 'admin' && (
          <div className="admin-badge">Admin Account</div>
        )}
      </div>
      
      {showToast && (
        <div className="toast-message">
          <p>{toastMessage}</p>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Your {userRole === 'admin' ? 'Cards' : 'Card'}</h2>
            {(userRole === 'admin' || cards.length === 0) && (
              <button className="new-card-button" onClick={handleCreateNew}>
                <span className="icon">+</span>
                <span>New Card</span>
              </button>
            )}
          </div>
          
          <div className="cards-list">
            {cards.length > 0 ? (
              cards.map((card) => (
                <div 
                  key={card.id} 
                  className={`card-item ${activeCard && activeCard.id === card.id ? 'active' : ''}`}
                  onClick={() => handleSelectCard(card)}
                >
                  {card.photoURL ? (
                    <div className="card-item-avatar">
                      <img src={card.photoURL} alt={card.name} />
                    </div>
                  ) : (
                    <div className="card-item-avatar card-item-avatar-placeholder">
                      {card.name ? card.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  
                  <div className="card-item-details">
                    <h3>{card.name || 'Unnamed Card'}</h3>
                    <p>{card.role} {card.company && `at ${card.company}`}</p>
                  </div>
                  
                  <button 
                    className="card-delete-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(card.id);
                    }}
                    aria-label="Delete card"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="no-cards">
                <div className="no-cards-icon">📇</div>
                <p>No business card yet</p>
                <p className="no-cards-hint">Create your first card to get started!</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="dashboard-main">
          {activeCard && formMode === 'edit' && (
            <div className="card-tabs">
              <button 
                className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                Edit Card
              </button>
              <button 
                className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Preview Card
              </button>
            </div>
          )}
          
          {activeTab === 'edit' ? (
            <div className="card-form-container">
              <h2>{formMode === 'create' ? 'Create New Card' : 'Edit Card'}</h2>
              
              <form onSubmit={handleSubmit} className="card-form">
                <div className="form-section">
                  <h3>Personal Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Name*</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="photoURL">Profile Photo</label>
                      <div className="photo-upload-container">
                        <input
                          type="url"
                          id="photoURL"
                          name="photoURL"
                          value={formData.photoURL}
                          onChange={handleInputChange}
                          placeholder="https://example.com/photo.jpg"
                        />
                        <div className="upload-buttons">
                          <button 
                            type="button" 
                            className="upload-photo-button"
                            onClick={() => fileInputRef.current.click()}
                            disabled={uploadingPhoto}
                          >
                            {uploadingPhoto ? (
                              <>
                                <span className="loading-spinner-small"></span>
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <span>Upload Photo</span>
                            )}
                          </button>
                          <input 
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                        </div>
                      </div>
                      {formData.photoURL && (
                        <div className="photo-preview">
                          <img src={formData.photoURL} alt="Profile preview" />
                          {formData.photoURL && (
                            <button
                              type="button"
                              className="remove-photo-button"
                              onClick={() => setFormData({...formData, photoURL: ''})}
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="role">Job Title</label>
                      <input
                        type="text"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        placeholder="Your job title"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="company">Company</label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Your company name"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Write a short bio about yourself"
                      rows="3"
                    />
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Contact Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email*</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Your email address"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone">Phone</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="website">Website</label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://your-website.com"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="location">Location</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Social Media</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="socials.linkedin">
                        <i className="social-icon linkedin"></i> LinkedIn
                      </label>
                      <input
                        type="url"
                        id="socials.linkedin"
                        name="socials.linkedin"
                        value={formData.socials.linkedin}
                        onChange={handleInputChange}
                        placeholder="LinkedIn profile URL"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="socials.twitter">
                        <i className="social-icon twitter"></i> Twitter
                      </label>
                      <input
                        type="url"
                        id="socials.twitter"
                        name="socials.twitter"
                        value={formData.socials.twitter}
                        onChange={handleInputChange}
                        placeholder="Twitter profile URL"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="socials.instagram">
                        <i className="social-icon instagram"></i> Instagram
                      </label>
                      <input
                        type="url"
                        id="socials.instagram"
                        name="socials.instagram"
                        value={formData.socials.instagram}
                        onChange={handleInputChange}
                        placeholder="Instagram profile URL"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="socials.facebook">
                        <i className="social-icon facebook"></i> Facebook
                      </label>
                      <input
                        type="url"
                        id="socials.facebook"
                        name="socials.facebook"
                        value={formData.socials.facebook}
                        onChange={handleInputChange}
                        placeholder="Facebook profile URL"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="submit-button" 
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        <span>{formMode === 'create' ? 'Creating...' : 'Updating...'}</span>
                      </>
                    ) : (
                      <span>{formMode === 'create' ? 'Create Card' : 'Update Card'}</span>
                    )}
                  </button>
                  
                  {formMode === 'edit' && shareUrl && (
                    <button 
                      type="button" 
                      className="share-button"
                      onClick={viewCardProfile}
                    >
                      <span className="share-icon">👁️</span>
                      <span>View Your Card</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="card-preview-container">
              <h2>Card Preview</h2>
              
              <div className="card-preview">
                <div className="preview-header">
                  {formData.photoURL ? (
                    <img 
                      src={formData.photoURL} 
                      alt={formData.name} 
                      className="preview-avatar"
                    />
                  ) : (
                    <div className="preview-avatar-placeholder">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  
                  <div className="preview-title">
                    <h1>{formData.name || 'Your Name'}</h1>
                    <h2>
                      {formData.role || 'Your Title'}
                      {formData.company && ` at ${formData.company}`}
                    </h2>
                  </div>
                </div>
                
                {formData.bio && (
                  <div className="preview-section">
                    <h3>About</h3>
                    <p>{formData.bio}</p>
                  </div>
                )}
                
                <div className="preview-section">
                  <h3>Contact</h3>
                  <ul className="preview-contact-list">
                    {formData.email && (
                      <li>
                        <span className="contact-icon">✉️</span>
                        <span>{formData.email}</span>
                      </li>
                    )}
                    {formData.phone && (
                      <li>
                        <span className="contact-icon">📱</span>
                        <span>{formData.phone}</span>
                      </li>
                    )}
                    {formData.website && (
                      <li>
                        <span className="contact-icon">🌐</span>
                        <span>{formData.website}</span>
                      </li>
                    )}
                    {formData.location && (
                      <li>
                        <span className="contact-icon">📍</span>
                        <span>{formData.location}</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                {(formData.socials.linkedin || formData.socials.twitter || 
                  formData.socials.instagram || formData.socials.facebook) && (
                  <div className="preview-section">
                    <h3>Social Media</h3>
                    <div className="preview-social-links">
                      {formData.socials.linkedin && (
                        <a href={formData.socials.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin">LinkedIn</a>
                      )}
                      {formData.socials.twitter && (
                        <a href={formData.socials.twitter} target="_blank" rel="noopener noreferrer" className="social-link twitter">Twitter</a>
                      )}
                      {formData.socials.instagram && (
                        <a href={formData.socials.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram">Instagram</a>
                      )}
                      {formData.socials.facebook && (
                        <a href={formData.socials.facebook} target="_blank" rel="noopener noreferrer" className="social-link facebook">Facebook</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="preview-actions">
                <button 
                  className="edit-button"
                  onClick={() => setActiveTab('edit')}
                >
                  Back to Editing
                </button>
                
                {shareUrl && (
                  <button 
                    className="share-button"
                    onClick={viewCardProfile}
                  >
                    View Your Card
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;