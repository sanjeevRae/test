import React, { useState, useEffect, useRef } from 'react';
import { auth, db, doc, getDoc, setDoc, deleteDoc, storage } from '../utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getUserRole, exitImpersonation } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import ImpersonationBanner from './ImpersonationBanner';
import Navbar from './Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [userPlan, setUserPlan] = useState('premium'); 
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [impersonationMode, setImpersonationMode] = useState(false);
  const [impersonatedUserData, setImpersonatedUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    phone: '',
    phone2: '',
    phone3: '',
    phone4: '',
    website: '',
    website2: '',
    location: '',
    bio: '',
    photoURL: '',
    logoURL: '',
    logoLink: '',
    companyName: '',
    theme: 'theme1', 
    availableDays1: '',
    officeName1: '',
    availableDays2: '',
    officeName2: '',
    socials: {
      linkedin: '',
      instagram: '',
      facebook: '',
      youtube: '',
      tiktok: ''
    }
  });
  
  const handleThemeSelect = async (theme) => {
    setFormData({
      ...formData,
      theme
    });
   
    try {
      const currentUser = auth.currentUser;
      if (formMode === 'edit' && activeCard && currentUser) {
        const cardDocRef = doc(db, 'profiles', activeCard.id);
        await setDoc(cardDocRef, { theme }, { merge: true });
       
        setActiveCard({ ...activeCard, theme });
      }
    } catch (err) {
      console.error('Failed to update theme:', err);
    }
  };
  const [formMode, setFormMode] = useState('create');
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Check for impersonation mode first
        const isImpersonating = sessionStorage.getItem('impersonationMode') === 'true';
        const impersonatedUserData = sessionStorage.getItem('impersonatedUserData');
        
        let targetUserId;
        let targetUser;
        
        if (isImpersonating && impersonatedUserData) {
          // We're impersonating - load the impersonated user's data
          const userData = JSON.parse(impersonatedUserData);
          targetUserId = userData.id;
          targetUser = userData;
          setImpersonationMode(true);
          setImpersonatedUserData(userData);
          
          // Set the user role to the impersonated user's role
          setUserRole(userData.role || 'user');
        } else {
          // Normal mode - load current user's data
          const currentUser = auth.currentUser;
          if (!currentUser) {
            setLoading(false);
            return;
          }
          
          targetUserId = currentUser.uid;
          setUser(currentUser);
          
          const role = await getUserRole();
          setUserRole(role);
        }
        
        // Load the target user's document (either current user or impersonated user)
        const userDocRef = doc(db, 'users', targetUserId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          setUserPlan(userData.plan || 'premium');
          
          // Only update role in Firestore if we're not impersonating
          if (!isImpersonating && userData.role !== await getUserRole()) {
            await setDoc(userDocRef, { role: await getUserRole() }, { merge: true });
          }
          
          if (userData.cards && userData.cards.length > 0) {
            const fetchedCards = [];
            for (const cardId of userData.cards) {
              const cardDocRef = doc(db, 'profiles', cardId);
              const cardDoc = await getDoc(cardDocRef);
              if (cardDoc.exists()) {
                const cardData = cardDoc.data();
                // Support old entries: if phone is string, merge with phone2-4
                let phoneNumbers = [];
                if (Array.isArray(cardData.phone)) {
                  phoneNumbers = cardData.phone;
                } else {
                  phoneNumbers = [cardData.phone, cardData.phone2, cardData.phone3, cardData.phone4].filter(Boolean);
                }
                fetchedCards.push({
                  id: cardId,
                  ...cardData,
                  phone: phoneNumbers.length > 0 ? phoneNumbers : cardData.phone || '',
                  availableDays1: cardData.availableDays1 || '',
                  officeName1: cardData.officeName1 || '',
                  availableDays2: cardData.availableDays2 || '',
                  officeName2: cardData.officeName2 || '',
                });
              }
            }
            setCards(fetchedCards);
            if (fetchedCards.length > 0) {
              const cardData = fetchedCards[0];
              setActiveCard(cardData);
              setFormData({
                ...cardData,
                logoURL: userData.logoURL || '',
                logoLink: userData.logoLink || '/',
                companyName: userData.companyName || cardData.company || ''
              });
              setFormMode('edit');
              setShareUrl(`${window.location.origin}/card/${fetchedCards[0].id}`);
            }
          }
        } else if (!isImpersonating) {
          // Only create new user document if we're not impersonating
          const currentUser = auth.currentUser;
          if (currentUser) {
            await setDoc(userDocRef, {
              email: currentUser.email,
              displayName: currentUser.displayName || '',
              role: await getUserRole(),
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
    
    if (!file.type.match('image.*')) {
      showToastMessage("Please select an image file (JPEG, PNG, etc.)");
      return;
    }
    
    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; 
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      showToastMessage("Please select an image file (JPEG, PNG, etc.)");
      return;
    }
    
    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; 
    if (file.size > maxSize) {
      showToastMessage("Logo is too large. Please select an image under 5MB.");
      return;
    }
    
    setUploadingLogo(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      
      // Create a unique path for the logo
      const path = `company-logos/${currentUser.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      
      console.log(`Starting logo upload for file: ${file.name} (${file.size} bytes) to path: ${path}`);
      
      // Use direct upload method
      const uploadResult = await storage.uploadFile(file, path, {
        metadata: {
          userId: currentUser.uid,
          uploadedAt: new Date().toISOString(),
          type: 'logo'
        }
      });
      
      if (!uploadResult) {
        throw new Error("Logo upload failed - no result returned");
      }
      
      const downloadURL = await uploadResult.getDownloadURL();
      
      console.log("Logo uploaded successfully, URL:", downloadURL);
      
      setFormData({
        ...formData,
        logoURL: downloadURL
      });
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        logoURL: downloadURL,
        logoLink: formData.logoLink || '/',
        companyName: formData.companyName || formData.company
      }, { merge: true });
      
      if (window.refreshNavbarLogo) {
        window.refreshNavbarLogo();
      }
      
      showToastMessage("Logo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      showToastMessage("Failed to upload logo: " + (error.message || "Please try again"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Determine the target user ID (current user or impersonated user)
      let targetUserId;
      const isImpersonating = sessionStorage.getItem('impersonationMode') === 'true';
      
      if (isImpersonating) {
        const impersonatedUserData = sessionStorage.getItem('impersonatedUserData');
        if (impersonatedUserData) {
          const userData = JSON.parse(impersonatedUserData);
          targetUserId = userData.id;
        } else {
          throw new Error("Impersonation data not found");
        }
      } else {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("User not authenticated");
        }
        targetUserId = currentUser.uid;
      }

      const flattenPhone = (val) => Array.isArray(val) ? val.join(', ') : val;
      const phoneNumbers = [
        flattenPhone(formData.phone),
        flattenPhone(formData.phone2),
        flattenPhone(formData.phone3),
        flattenPhone(formData.phone4)
      ].filter(Boolean);
      const cardDataToSave = {
        ...formData,
        phone: phoneNumbers,
         availableDays1: formData.availableDays1 || '',
         officeName1: formData.officeName1 || '',
         availableDays2: formData.availableDays2 || '',
         officeName2: formData.officeName2 || '',
      };

      delete cardDataToSave.phone2;
      delete cardDataToSave.phone3;
      delete cardDataToSave.phone4;

      if (formMode === 'create') {
        if (cards.length > 0 && userRole !== 'admin') {
          throw new Error("You can only have one business card. Please update your existing card.");
        }
        const cardId = `${targetUserId}_${Date.now()}`;
        const cardDocRef = doc(db, 'profiles', cardId);
        await setDoc(cardDocRef, {
          ...cardDataToSave,
          userId: targetUserId,
          createdAt: new Date().toISOString()
        });
        const userDocRef = doc(db, 'users', targetUserId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          let updatedCards;
          if (userRole === 'admin') {
            updatedCards = userData.cards ? [...userData.cards, cardId] : [cardId];
          } else {
            updatedCards = [cardId];
          }
          await setDoc(userDocRef, {
            ...userData,
            cards: updatedCards,
            logoURL: formData.logoURL || '',
            logoLink: formData.logoLink || '/',
            companyName: formData.companyName || formData.company || ''
          });
          const newCard = {
            id: cardId,
            ...cardDataToSave,
            userId: targetUserId,
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
          showToastMessage("Card created successfully!");
        } else {
          // Get current user for email/displayName in non-impersonation mode
          const currentUser = auth.currentUser;
          await setDoc(userDocRef, {
            email: currentUser?.email || '',
            displayName: currentUser?.displayName || '',
            role: userRole,
            cards: [cardId],
            logoURL: formData.logoURL || '',
            logoLink: formData.logoLink || '/',
            companyName: formData.companyName || formData.company || ''
          });
          const newCard = {
            id: cardId,
            ...cardDataToSave,
            userId: targetUserId,
            createdAt: new Date().toISOString()
          };
          setCards([newCard]);
          setActiveCard(newCard);
          setFormMode('edit');
          setShareUrl(`${window.location.origin}/card/${cardId}`);
          showToastMessage("Card created successfully!");
        }
      } else if (formMode === 'edit' && activeCard) {
        const cardDocRef = doc(db, 'profiles', activeCard.id);
        await setDoc(cardDocRef, {
          ...cardDataToSave,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        const userDocRef = doc(db, 'users', targetUserId);
        await setDoc(userDocRef, {
          logoURL: formData.logoURL || '',
          logoLink: formData.logoLink || '/',
          companyName: formData.companyName || formData.company || ''
        }, { merge: true });
        const updatedCards = cards.map(card =>
          card.id === activeCard.id ? { ...card, ...cardDataToSave, updatedAt: new Date().toISOString() } : card
        );
        setCards(updatedCards);
        setActiveCard({ ...activeCard, ...cardDataToSave, updatedAt: new Date().toISOString() });
        showToastMessage("Card updated successfully!");
        if (window.refreshNavbarLogo) {
          window.refreshNavbarLogo();
        }
      }
    } catch (error) {
      console.error("Error saving card:", error);
      showToastMessage(error.message || "Error saving card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
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
      phone2: '',
      phone3: '',
      phone4: '',
      website: '',
      website2: '',
      location: '',
      bio: '',
      photoURL: '',
      availableDays1: '',
      officeName1: '',
      availableDays2: '',
      officeName2: '',
      socials: {
        linkedin: '',
        X: '',
        instagram: '',
        facebook: '',
        youtube: ''
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
      const cardDocRef = doc(db, 'profiles', cardId);
      await deleteDoc(cardDocRef);
      
      // Determine the target user ID (current user or impersonated user)
      let targetUserId;
      const isImpersonating = sessionStorage.getItem('impersonationMode') === 'true';
      
      if (isImpersonating) {
        const impersonatedUserData = sessionStorage.getItem('impersonatedUserData');
        if (impersonatedUserData) {
          const userData = JSON.parse(impersonatedUserData);
          targetUserId = userData.id;
        }
      } else {
        const currentUser = auth.currentUser;
        if (currentUser) {
          targetUserId = currentUser.uid;
        }
      }
      
      if (targetUserId) {
        const userDocRef = doc(db, 'users', targetUserId);
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
    <>
      <Navbar />
      <div className="dashboard-container">
      <ImpersonationBanner />
      <div className="dashboard-header">
        <h1>Business Card Manager</h1>
        <p className="dashboard-subtitle">
          {impersonationMode 
            ? `Managing cards for: ${impersonatedUserData?.email || 'Unknown User'} (${impersonatedUserData?.role || 'user'})` 
            : userRole === 'admin' 
              ? 'Admin Dashboard - Create and manage multiple business cards' 
              : 'Create and manage your professional digital business card'}
        </p>
        {userRole === 'admin' && !impersonationMode && (
          <div className="admin-badge">Admin Account</div>
        )}
        {impersonationMode && (
          <div className="impersonation-mode-badge">
            Impersonation Mode - Managing {impersonatedUserData?.name || impersonatedUserData?.email || 'User'}'s Account
          </div>
        )}

        <div className="theme-options" style={{ margin: '24px 0 0 0', textAlign: 'center' }}>
          {['theme1'   ].map((theme) => ( //here theme2 ra 3
            <button
              type="button"
              key={theme}
              className={`theme-btn${formData.theme === theme ? ' active' : ''}`}
              onClick={() => handleThemeSelect(theme)}
              style={{
                marginRight: '10px',
                padding: '8px 18px',
                borderRadius: '6px',
                border: formData.theme === theme ? '2px solid #007bff' : '1px solid #ccc',
                background: formData.theme === theme ? '#e6f0ff' : '#fff',
                color: formData.theme === theme ? '#007bff' : '#333',
                fontWeight: formData.theme === theme ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </div>

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
            <div className="sidebar-buttons">
              {(userRole === 'admin' || cards.length === 0) && (
                <button className="new-card-button" onClick={handleCreateNew}>
                  <span className="icon">+</span>
                  <span>New Card</span>
                </button>
              )}
              
              {userPlan !== 'basic' && (
                <button className="analytics-button" onClick={() => navigate('/analytics')}>
                  <span className="icon">📊</span>
                  <span>View Analytics</span>
                 
                </button>
              )}
            </div>
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
                        {/* <input
                          type="url"
                          id="photoURL"
                          name="photoURL"
                          value={formData.photoURL}
                          onChange={handleInputChange}
                          placeholder=""
                        /> */}
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
                      <label htmlFor="phone">Phone 1</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Primary phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone2">Phone 2</label>
                      <input
                        type="tel"
                        id="phone2"
                        name="phone2"
                        value={formData.phone2}
                        onChange={handleInputChange}
                        placeholder="Secondary phone number"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone3">Phone 3</label>
                      <input
                        type="tel"
                        id="phone3"
                        name="phone3"
                        value={formData.phone3}
                        onChange={handleInputChange}
                        placeholder="Alternative phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone4">Phone 4</label>
                      <input
                        type="tel"
                        id="phone4"
                        name="phone4"
                        value={formData.phone4}
                        onChange={handleInputChange}
                        placeholder="Additional phone number"
                      />
                    </div>
                    
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
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="website2">Website 2</label>
                      <input
                        type="url"
                        id="website2"
                        name="website2"
                        value={formData.website2}
                        onChange={handleInputChange}
                        placeholder="https://your-other-site.com"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
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
                  <div className="form-row">
                    <div className="form-group" style={{flex:1}}>
                      <label htmlFor="availableDays1">Available Days (Sunday, Monday, Tuesday ..)</label>
                      <input
                        type="text"
                        id="availableDays1"
                        name="availableDays1"
                        value={formData.availableDays1}
                        onChange={handleInputChange}
                        placeholder="Available Days"
                      />
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label htmlFor="officeName1">Office Name</label>
                      <input
                        type="text"
                        id="officeName1"
                        name="officeName1"
                        value={formData.officeName1}
                        onChange={handleInputChange}
                        placeholder="Office Name"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{flex:1}}>
                      <label htmlFor="availableDays2">Available Days (Sunday, Monday, Tuesday ..)</label>
                      <input
                        type="text"
                        id="availableDays2"
                        name="availableDays2"
                        value={formData.availableDays2}
                        onChange={handleInputChange}
                        placeholder="Available Days"
                      />
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label htmlFor="officeName2">Office Name</label>
                      <input
                        type="text"
                        id="officeName2"
                        name="officeName2"
                        value={formData.officeName2}
                        onChange={handleInputChange}
                        placeholder="Office Name"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Social Media</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="socials.linkedin">
                        
                        LinkedIn
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
                      <label htmlFor="socials.tiktok">
                       TikTok
                      </label>
                      <input
                        type="url"
                        id="socials.tiktok"
                        name="socials.tiktok"
                        value={formData.socials.tiktok}
                        onChange={handleInputChange}
                        placeholder="TikTok profile URL"
                      />
                    </div>


                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="socials.instagram">
                         Instagram
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
                      Facebook
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
                 
                       <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="socials.youtube">
                         Youtube
                      </label>
                      <input
                        type="url"
                        id="socials.youtube"
                        name="socials.youtube"
                        value={formData.socials.youtube}
                        onChange={handleInputChange}
                        placeholder="Youtube profile URL"
                      />
                    </div>
                    
                  </div>

                </div>
                
                {userPlan === 'elite' && (
                  <div className="form-section">
                    <h3>Brand Settings <span className="premium-badge">Elite Only</span></h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="companyName">Company Name for Logo</label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="Company name to display as fallback"
                        />
                        <small className="form-hint">This will be shown if no logo is uploaded</small>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="logoLink">Logo Link</label>
                        <input
                          type="url"
                          id="logoLink"
                          name="logoLink"
                          value={formData.logoLink}
                          onChange={handleInputChange}
                          placeholder="https://your-website.com"
                        />
                        <small className="form-hint">Where should the logo link to when clicked?</small>
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label htmlFor="logoURL">Company Logo</label>
                      <div className="logo-upload-container">
                        {formData.logoURL && (
                          <div className="logo-preview">
                            <img src={formData.logoURL} alt="Company logo preview" />
                          </div>
                        )}
                        <div className="upload-buttons">
                          <button 
                            type="button" 
                            className="upload-logo-button"
                            onClick={() => logoInputRef.current.click()}
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? (
                              <>
                                <span className="loading-spinner-small"></span>
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <span>Upload Logo</span>
                            )}
                          </button>
                          <input 
                            type="file"
                            ref={logoInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                        </div>
                        {formData.logoURL && (
                          <button
                            type="button"
                            className="remove-logo-button"
                            onClick={() => setFormData({...formData, logoURL: ''})}
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>
                      <small className="form-hint">Upload your company logo (max 5MB). Recommended size: 180x40px</small>
                    </div>
                  </div>
                )}
                


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
                        <span>Phone 1: {formData.phone}</span>
                      </li>
                    )}
                    {formData.phone2 && (
                      <li>
                        <span className="contact-icon">📱</span>
                        <span>Phone 2: {formData.phone2}</span>
                      </li>
                    )}
                    {formData.phone3 && (
                      <li>
                        <span className="contact-icon">📱</span>
                        <span>Phone 3: {formData.phone3}</span>
                      </li>
                    )}
                    {formData.phone4 && (
                      <li>
                        <span className="contact-icon">📱</span>
                        <span>Phone 4: {formData.phone4}</span>
                      </li>
                    )}
                    {formData.website && (
                      <li>
                        <span className="contact-icon">🌐</span>
                        <span>{formData.website}</span>
                      </li>
                    )}
                    {formData.website2 && (
                      <li>
                        <span className="contact-icon">🌐</span>
                        <span>Website 2: {formData.website2}</span>
                      </li>
                    )}
                    {(formData.availableDays1 || formData.officeName1) && (
                      <li>
                        <span className="contact-icon">🗓️</span>
                        <span>
                          {formData.availableDays1 ? `Available: ${formData.availableDays1}` : ''}
                          {formData.officeName1 ? ` (${formData.officeName1})` : ''}
                        </span>
                      </li>
                    )}
                    {(formData.availableDays2 || formData.officeName2) && (
                      <li>
                        <span className="contact-icon">🗓️</span>
                        <span>
                          {formData.availableDays2 ? `Available: ${formData.availableDays2}` : ''}
                          {formData.officeName2 ? ` (${formData.officeName2})` : ''}
                        </span>
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
                
                {(formData.socials.linkedin || formData.socials.X || 
                  formData.socials.instagram || formData.socials.facebook || formData.socials.youtube || formData.socials.tiktok) && (
                  <div className="preview-section">
                    <h3>Social Media</h3>
                    <div className="preview-social-links">
                      {formData.socials.linkedin && (
                        <a href={formData.socials.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                          <span className="social-icon">💼</span>
                          <span>LinkedIn</span>
                        </a>
                      )}
                    
                      {formData.socials.instagram && (
                        <a href={formData.socials.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                          <span className="social-icon">📷</span>
                          <span>Instagram</span>
                        </a>
                      )}
                      {formData.socials.facebook && (
                        <a href={formData.socials.facebook} target="_blank" rel="noopener noreferrer" className="social-link facebook">
                          <span className="social-icon">👥</span>
                          <span>Facebook</span>
                        </a>
                      )}
                      {formData.socials.youtube && (
                        <span style={{display:'flex',gap:'8px',alignItems:'center'}}>
                          <a href={formData.socials.youtube} target="_blank" rel="noopener noreferrer" className="social-link youtube">
                            <span className="social-icon">📺</span>
                            <span>YouTube</span>
                          </a>
                          {formData.socials.tiktok && (
                            <a href={formData.socials.tiktok} target="_blank" rel="noopener noreferrer" className="social-link tiktok">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-tiktok" viewBox="0 0 16 16" style={{marginRight:'4px'}}>
                                <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
                              </svg>
                              <span>TikTok</span>
                            </a>
                          )}
                        </span>
                      )}
                      {formData.socials.tiktok && (
                        !formData.socials.youtube ? (
                          <span style={{display:'flex',gap:'8px',alignItems:'center'}}>
                            <a href={formData.socials.tiktok} target="_blank" rel="noopener noreferrer" className="social-link tiktok">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-tiktok" viewBox="0 0 16 16" style={{marginRight:'4px'}}>
                                <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
                              </svg>
                              <span>TikTok</span>
                            </a>
                          </span>
                        ) : null
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
    </>
  );
};

export default Dashboard;