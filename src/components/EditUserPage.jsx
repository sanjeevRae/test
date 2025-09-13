import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { isUserAdmin } from '../utils/auth';
import './EditUserPage.css';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    phone2: '',
    phone3: '',
    phone4: '',
    company: '',
    position: '',
    bio: '',
    website: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    facebook: '',
    youtube: '',
    tiktok: '',
    snapchat: '',
    github: '',
    whatsapp: '',
    telegram: '',
    address: '',
    category: 'Basic',
    status: 'active',
    profilePhoto: '',
    logo: '',
    themeColor: '#6c5ce7'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAdminAndFetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if user is admin
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
          navigate('/dashboard');
          return;
        }
        setAuthorized(true);

        // Fetch profile from profiles collection
        const profileDoc = await getDoc(doc(db, 'profiles', id));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfile(data);
          setForm({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            phone2: data.phone2 || '',
            phone3: data.phone3 || '',
            phone4: data.phone4 || '',
            company: data.company || '',
            position: data.position || '',
            bio: data.bio || '',
            website: data.website || '',
            linkedin: data.linkedin || '',
            twitter: data.twitter || '',
            instagram: data.instagram || '',
            facebook: data.facebook || '',
            youtube: data.youtube || '',
            tiktok: data.tiktok || '',
            snapchat: data.snapchat || '',
            github: data.github || '',
            whatsapp: data.whatsapp || '',
            telegram: data.telegram || '',
            address: data.address || '',
            category: data.category || 'Basic',
            status: data.status || 'active',
            profilePhoto: data.profilePhoto || '',
            logo: data.logo || '',
            themeColor: data.themeColor || '#6c5ce7'
          });
        } else {
          setError('User profile not found');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminAndFetchProfile();
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Update profile in profiles collection
      const updateData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        phone2: form.phone2,
        phone3: form.phone3,
        phone4: form.phone4,
        company: form.company,
        position: form.position,
        bio: form.bio,
        website: form.website,
        linkedin: form.linkedin,
        twitter: form.twitter,
        instagram: form.instagram,
        facebook: form.facebook,
        youtube: form.youtube,
        tiktok: form.tiktok,
        snapchat: form.snapchat,
        github: form.github,
        whatsapp: form.whatsapp,
        telegram: form.telegram,
        address: form.address,
        category: form.category,
        status: form.status,
        profilePhoto: form.profilePhoto,
        logo: form.logo,
        themeColor: form.themeColor,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      };

      await updateDoc(doc(db, 'profiles', id), updateData);
      
      setProfile(prev => ({ ...prev, ...updateData }));
      alert('User profile updated successfully!');
      
      // Optionally navigate back to admin dashboard
      // navigate('/admin');
      
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update user profile');
    } finally {
      setSaving(false);
    }
  };

  if (!authorized) {
    return <div style={{padding: 32}}>Checking authorization...</div>;
  }

  if (loading) return <div style={{padding: 32}}>Loading user profile...</div>;
  if (error) return <div style={{padding: 32, color: 'red'}}>{error}</div>;
  if (!profile) return null;

  return (
    <div className="edit-user-page">
      <div className="edit-user-header">
        <h2>Edit User Profile</h2>
        <p>Editing profile for: {profile.name || profile.email}</p>
        <button 
          onClick={() => navigate('/admin')}
          className="back-button"
        >
          ← Back to Admin Dashboard
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Name:</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email:</label>
            <input 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              type="email"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone 1:</label>
            <input 
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone 2:</label>
            <input 
              name="phone2" 
              value={form.phone2} 
              onChange={handleChange} 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone 3:</label>
            <input 
              name="phone3" 
              value={form.phone3} 
              onChange={handleChange} 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone 4:</label>
            <input 
              name="phone4" 
              value={form.phone4} 
              onChange={handleChange} 
              className="form-input"
            />
          </div>
        <div className="form-group">
          <label className="form-label">Profile Photo:</label>
          <input 
            type="url"
            name="profilePhoto"
            value={form.profilePhoto}
            onChange={handleChange}
            className="form-input"
            placeholder="Image URL or upload logic here"
          />
          {form.profilePhoto && (
            <img src={form.profilePhoto} alt="Profile Preview" style={{width:60,height:60,borderRadius:'50%',marginTop:8}} />
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Brand Logo:</label>
          <input 
            type="url"
            name="logo"
            value={form.logo}
            onChange={handleChange}
            className="form-input"
            placeholder="Logo Image URL or upload logic here"
          />
          {form.logo && (
            <img src={form.logo} alt="Logo Preview" style={{width:60,height:60,borderRadius:8,marginTop:8}} />
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Theme Color:</label>
          <input 
            type="color"
            name="themeColor"
            value={form.themeColor}
            onChange={handleChange}
            className="form-input"
            style={{width:40,height:40,padding:0,border:'none',background:'none'}}
          />
        </div>
          <div className="form-group">
            <label className="form-label">Company:</label>
            <input 
              name="company" 
              value={form.company} 
              onChange={handleChange} 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Position:</label>
            <input 
              name="position" 
              value={form.position} 
              onChange={handleChange} 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Website:</label>
            <input 
              name="website" 
              value={form.website} 
              onChange={handleChange} 
              type="url"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Bio:</label>
          <textarea 
            name="bio" 
            value={form.bio} 
            onChange={handleChange} 
            rows="4"
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Address:</label>
          <textarea 
            name="address" 
            value={form.address} 
            onChange={handleChange} 
            rows="2"
            className="form-textarea"
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Category:</label>
            <select 
              name="category" 
              value={form.category} 
              onChange={handleChange} 
              className="form-select"
            >
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
              <option value="Executive">Executive</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status:</label>
            <select 
              name="status" 
              value={form.status} 
              onChange={handleChange} 
              className="form-select"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        <h3 className="section-title">Social Media Links</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">LinkedIn:</label>
            <input 
              name="linkedin" 
              value={form.linkedin} 
              onChange={handleChange} 
              type="url"
              className="form-input"
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Twitter:</label>
            <input 
              name="twitter" 
              value={form.twitter} 
              onChange={handleChange} 
              type="url"
              className="form-input"
              placeholder="https://twitter.com/username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Instagram:</label>
            <input 
              name="instagram" 
              value={form.instagram} 
              onChange={handleChange} 
              type="url"
              className="form-input"
              placeholder="https://instagram.com/username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Facebook:</label>
            <input 
              name="facebook" 
              value={form.facebook} 
              onChange={handleChange} 
              type="url"
              className="form-input"
              placeholder="https://facebook.com/username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">YouTube:</label>
            <input 
              name="youtube" 
              value={form.youtube} 
              onChange={handleChange} 
              type="url"
              className="form-input"
              placeholder="https://youtube.com/@username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">TikTok:</label>
            <input 
              name="tiktok" 
              value={form.tiktok} 
              onChange={handleChange} 
              type="url"
              className="form-input"
              placeholder="https://tiktok.com/@username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Snapchat:</label>
            <input 
              name="snapchat" 
              value={form.snapchat} 
              onChange={handleChange} 
              type="url"
              className="form-input"
              placeholder="https://snapchat.com/add/username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">GitHub:</label>
            <input 
              name="github" 
              value={form.github} 
              onChange={handleChange} 
              type="url"
              className="form-input"
              placeholder="https://github.com/username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp:</label>
            <input 
              name="whatsapp" 
              value={form.whatsapp} 
              onChange={handleChange} 
              className="form-input"
              placeholder="Phone number or WhatsApp link"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telegram:</label>
            <input 
              name="telegram" 
              value={form.telegram} 
              onChange={handleChange} 
              className="form-input"
              placeholder="@username or Telegram link"
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button"
            onClick={() => navigate('/admin')}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving} 
            className="btn-save"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserPage;
