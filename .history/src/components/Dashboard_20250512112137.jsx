import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../utils/firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Dashboard.css';

const Dashboard = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    socials: '',
    photoURL: '',
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          // Access control
          if (data.status === 'blocked' || data.status === 'suspended') {
            setAccessDenied(true);
            return;
          }
          if (data.subscriptionExpires) {
            const now = new Date();
            const exp = new Date(data.subscriptionExpires);
            if (exp < now) {
              setAccessDenied(true);
              return;
            }
          }
          // Placeholder: fetch analytics for premium/executive
          if (['Premium', 'Executive'].includes(data.category)) {
            setAnalytics({ views: 123, qrScans: 45 }); // Replace with real data
          }
        }
      };
      fetchProfile();
    }
  }, [user]);

  // Track profile views and QR scans in Firestore
  useEffect(() => {
    if (!user) return;
    // Only run for premium/executive users
    if (['Premium', 'Executive'].includes(profile.category)) {
      const incrementAnalytics = async () => {
        const analyticsRef = doc(db, 'analytics', user.uid);
        // Increment profile views
        await setDoc(analyticsRef, { views: (profile.views || 0) + 1 }, { merge: true });
        // Fetch analytics
        const analyticsSnap = await getDoc(analyticsRef);
        if (analyticsSnap.exists()) {
          setAnalytics(analyticsSnap.data());
        }
      };
      incrementAnalytics();
    }
  }, [user, profile.category]);

  const handleChange = e => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = e => {
    if (e.target.files[0]) setPhoto(e.target.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    let photoURL = profile.photoURL;
    if (photo) {
      const storageRef = ref(storage, `profile_photos/${user.uid}`);
      await uploadBytes(storageRef, photo);
      photoURL = await getDownloadURL(storageRef);
    }
    const profileData = { ...profile, photoURL };
    await setDoc(doc(db, 'profiles', user.uid), profileData, { merge: true });
    setProfile(profileData);
    setLoading(false);
    alert('Profile saved!');
  };

  if (accessDenied) {
    return (
      <div className="dashboard access-denied">
        <h2>Access Denied</h2>
        <p>Your account is blocked, suspended, or your subscription has expired. Please contact support or renew your subscription.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2>My Digital Business Card</h2>
      {analytics && (
        <div className="analytics">
          <h3>Analytics</h3>
          <div>Profile Views: {analytics.views || 0}</div>
          <div>QR Code Scans: {analytics.qrScans || 0}</div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-row">
          <input name="name" placeholder="Name" value={profile.name} onChange={handleChange} required />
          <input name="email" placeholder="Email" value={profile.email} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <input name="company" placeholder="Company" value={profile.company} onChange={handleChange} />
          <input name="role" placeholder="Role" value={profile.role} onChange={handleChange} />
        </div>
        <div className="form-row">
          <input name="phone" placeholder="Phone" value={profile.phone} onChange={handleChange} />
          <input name="socials" placeholder="Social Media Links" value={profile.socials} onChange={handleChange} />
        </div>
        <div className="form-row">
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>
        {profile.photoURL && <img src={profile.photoURL} alt="Profile" className="profile-photo" />}
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Card'}</button>
      </form>
    </div>
  );
};

export default Dashboard;