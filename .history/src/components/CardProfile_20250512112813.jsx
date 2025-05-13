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
    return <div className="dashboard"><h2>Card Not Found</h2></div>;
  }
  if (!profile) {
    return <div className="dashboard"><h2>Loading...</h2></div>;
  }

  return (
    <div className="dashboard">
      <h2>{profile.name}</h2>
      {profile.photoURL && <img src={profile.photoURL} alt="Profile" className="profile-photo" />}
      <div style={{marginTop: '1.5rem'}}>
        <div><strong>Email:</strong> {profile.email}</div>
        <div><strong>Company:</strong> {profile.company}</div>
        <div><strong>Role:</strong> {profile.role}</div>
        <div><strong>Phone:</strong> {profile.phone}</div>
        <div><strong>Socials:</strong> {profile.socials}</div>
      </div>
    </div>
  );
};

export default CardProfile;
