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
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      };
      fetchProfile();
    }
  }, [user]);

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

  return (
    <div className="dashboard">
      <h2>My Digital Business Card</h2>
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