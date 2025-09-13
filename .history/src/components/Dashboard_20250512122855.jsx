import React, { useState, useEffect } from 'react';
import { auth, db, doc, getDoc, setDoc, deleteDoc } from '../utils/firebase';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
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

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          setUser(currentUser);
          
          // Fetch user's business cards
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      if (formMode === 'create') {
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
          const updatedCards = userData.cards ? [...userData.cards, cardId] : [cardId];
          
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
          
          setCards([...cards, newCard]);
          setActiveCard(newCard);
          setFormMode('edit');
          setShareUrl(`${window.location.origin}/card/${cardId}`);
          
        } else {
          // Create new user document
          await setDoc(userDocRef, {
            email: currentUser.email,
            displayName: currentUser.displayName || '',
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
      }
      
      // Show success message or toast
    } catch (error) {
      console.error("Error saving card:", error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
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
      
      // Show success message
    } catch (error) {
      console.error("Error deleting card:", error);
      // Show error message
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    // Show toast or message that URL was copied
    alert("Share URL copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner-large"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Business Card Manager</h1>
        <p>Create and manage your digital business cards</p>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Your Cards</h2>
            <button className="new-card-button" onClick={handleCreateNew}>
              + New Card
            </button>
          </div>
          
          <div className="cards-list">
            {cards.length > 0 ? (
              cards.map((card) => (
                <div 
                  key={card.id} 
                  className={`card-item ${activeCard && activeCard.id === card.id ? 'active' : ''}`}
                  onClick={() => handleSelectCard(card)}
                >
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
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="no-cards">
                <p>You haven't created any business cards yet.</p>
                <p>Create your first card to get started!</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="dashboard-main">
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
                    <label htmlFor="photoURL">Photo URL</label>
                    <input
                      type="url"
                      id="photoURL"
                      name="photoURL"
                      value={formData.photoURL}
                      onChange={handleInputChange}
                      placeholder="https://example.com/photo.jpg"
                    />
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
                      placeholder="Your website URL"
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
                <h3>About</h3>
                
                <div className="form-group full-width">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell others about yourself"
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>Social Media</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="linkedin">LinkedIn</label>
                    <input
                      type="url"
                      id="linkedin"
                      name="socials.linkedin"
                      value={formData.socials.linkedin}
                      onChange={handleInputChange}
                      placeholder="LinkedIn profile URL"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="twitter">Twitter</label>
                    <input
                      type="url"
                      id="twitter"
                      name="socials.twitter"
                      value={formData.socials.twitter}
                      onChange={handleInputChange}
                      placeholder="Twitter profile URL"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="instagram">Instagram</label>
                    <input
                      type="url"
                      id="instagram"
                      name="socials.instagram"
                      value={formData.socials.instagram}
                      onChange={handleInputChange}
                      placeholder="Instagram profile URL"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="facebook">Facebook</label>
                    <input
                      type="url"
                      id="facebook"
                      name="socials.facebook"
                      value={formData.socials.facebook}
                      onChange={handleInputChange}
                      placeholder="Facebook profile URL"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                {formMode === 'edit' && (
                  <div className="share-actions">
                    <div className="share-url-container">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="share-url-input"
                      />
                      <button 
                        type="button" 
                        className="copy-url-btn"
                        onClick={copyShareUrl}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="save-btn" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : formMode === 'create' ? 'Create Card' : 'Update Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;