import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './Dashboard.css';

const CardProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
        // QR code scan tracking for premium/executive users
        const data = docSnap.data();
        if (["Premium", "Executive"].includes(data.category)) {
          const analyticsRef = doc(db, 'analytics', userId);
          const analyticsSnap = await getDoc(analyticsRef);
          const prev = analyticsSnap.exists() ? analyticsSnap.data().qrScans || 0 : 0;
          await setDoc(analyticsRef, { qrScans: prev + 1 }, { merge: true });
        }
      } else {
        setNotFound(true);
      }
    };
    fetchProfile();
  }, [userId]);

  if (notFound) {
    return (
      <div className="dashboard">
        <div className="card-not-found">
          <h2>Card Not Found</h2>
          <p>This digital business card doesn't exist or has been removed.</p>
          <img 
            src="https://images.unsplash.com/photo-1581397867210-97b0a3ba3477?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGVycm9yfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60" 
            alt="Not Found" 
            className="not-found-img" 
          />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="dashboard"><h2>Loading...</h2></div>;
  }

  return (
    <div className="dashboard card-profile">
      <div className="card-header">
        <div className="eco-badge">
          <span className="eco-icon">♻️</span>
          <span>eco-friendly digital card</span>
        </div>
        {profile.photoURL && (
          <img src={profile.photoURL} alt={profile.name} className="profile-photo" />
        )}
        <h2>{profile.name}</h2>
        <p className="profile-role">{profile.role} at {profile.company}</p>
      </div>
      
      <div className="card-details">
        <div className="detail-item">
          <span className="detail-icon">📧</span>
          <span className="detail-text">{profile.email}</span>
        </div>
        
        {profile.phone && (
          <div className="detail-item">
            <span className="detail-icon">📱</span>
            <span className="detail-text">{profile.phone}</span>
          </div>
        )}
        
        {profile.socials && (
          <div className="detail-item">
            <span className="detail-icon">🔗</span>
            <span className="detail-text">{profile.socials}</span>
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <p>Powered by <span className="e-vox-text"><span className="gold">E</span>-vox</span></p>
        <p className="trees-saved">You just saved a tree by using our digital card!</p>
      </div>
    </div>
  );
};

export default CardProfile;
