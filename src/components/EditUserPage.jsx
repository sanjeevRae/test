import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { isUserAdmin, isUserLeader } from '../utils/auth';
import Navbar from './Navbar';
import './Dashboard.css';
import './EditUserPage.css';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    phone2: '',
    phone3: '',
    phone4: '',
    company: '',
    role: '',
    bio: '',
    website: '',
    website2: '',
    location: '',
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
    },
    category: 'Basic',
    status: 'active',
    photoURL: '',
    logoURL: '',
    theme: 'theme1'
  });
  const [saving, setSaving] = useState(false);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  useEffect(() => {
    const checkAdminAndFetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if user is admin or leader
        const isAdmin = await isUserAdmin();
        const isLeader = await isUserLeader();
        if (!isAdmin && !isLeader) {
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
            phone: Array.isArray(data.phone) ? data.phone[0] || '' : data.phone || '',
            phone2: Array.isArray(data.phone) ? data.phone[1] || '' : data.phone2 || '',
            phone3: Array.isArray(data.phone) ? data.phone[2] || '' : data.phone3 || '',
            phone4: Array.isArray(data.phone) ? data.phone[3] || '' : data.phone4 || '',
            company: data.company || '',
            role: data.role || data.position || '',
            bio: data.bio || '',
            website: data.website || '',
            website2: data.website2 || '',
            location: data.location || data.address || '',
            availableDays1: data.availableDays1 || '',
            officeName1: data.officeName1 || '',
            availableDays2: data.availableDays2 || '',
            officeName2: data.officeName2 || '',
            socials: {
              linkedin: data.socials?.linkedin || data.linkedin || '',
              instagram: data.socials?.instagram || data.instagram || '',
              facebook: data.socials?.facebook || data.facebook || '',
              youtube: data.socials?.youtube || data.youtube || '',
              tiktok: data.socials?.tiktok || data.tiktok || ''
            },
            category: data.category || 'Basic',
            status: data.status || 'active',
            photoURL: data.photoURL || data.profilePhoto || '',
            logoURL: data.logoURL || data.logo || '',
            theme: data.theme || 'theme1'
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
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm({
        ...form,
        [parent]: {
          ...form[parent],
          [child]: value
        }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      showToastMessage("Please select an image file (JPEG, PNG, etc.)");
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToastMessage("Image is too large. Please select an image under 5MB.");
      return;
    }
    
    setUploadingPhoto(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      
      const path = `profile-photos/${id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      
      const uploadResult = await storage.uploadFile(file, path, {
        metadata: {
          userId: id,
          uploadedAt: new Date().toISOString()
        }
      });
      
      if (!uploadResult) {
        throw new Error("Upload failed - no result returned");
      }
      
      const downloadURL = await uploadResult.getDownloadURL();
      
      setForm({
        ...form,
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
    
    if (!file.type.match('image.*')) {
      showToastMessage("Please select an image file (JPEG, PNG, etc.)");
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToastMessage("Logo is too large. Please select an image under 5MB.");
      return;
    }
    
    setUploadingLogo(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      
      const path = `company-logos/${id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      
      const uploadResult = await storage.uploadFile(file, path, {
        metadata: {
          userId: id,
          uploadedAt: new Date().toISOString(),
          type: 'logo'
        }
      });
      
      if (!uploadResult) {
        throw new Error("Logo upload failed - no result returned");
      }
      
      const downloadURL = await uploadResult.getDownloadURL();
      
      setForm({
        ...form,
        logoURL: downloadURL
      });
      
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
    setError(null);
    
    try {
      const phoneNumbers = [form.phone, form.phone2, form.phone3, form.phone4].filter(Boolean);
      
      const updateData = {
        name: form.name,
        email: form.email,
        phone: phoneNumbers,
        company: form.company,
        role: form.role,
        bio: form.bio,
        website: form.website,
        website2: form.website2,
        location: form.location,
        availableDays1: form.availableDays1,
        officeName1: form.officeName1,
        availableDays2: form.availableDays2,
        officeName2: form.officeName2,
        socials: form.socials,
        category: form.category,
        status: form.status,
        photoURL: form.photoURL,
        logoURL: form.logoURL,
        theme: form.theme,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      };

      await updateDoc(doc(db, 'profiles', id), updateData);
      
      setProfile(prev => ({ ...prev, ...updateData }));
      showToastMessage('User profile updated successfully!');
      
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update user profile');
      showToastMessage('Failed to update user profile');
    } finally {
      setSaving(false);
    }
  };

  if (!authorized) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Checking authorization...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading user profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Error</h1>
          <p className="dashboard-subtitle" style={{color: '#e53e3e'}}>{error}</p>
          <button onClick={() => navigate('/admin')} className="back-button" style={{marginTop: '1rem'}}>
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        {showToast && (
          <div className="toast-message">
            <p>{toastMessage}</p>
          </div>
        )}
        
        <div className="dashboard-header">
          <h1>Edit User Profile</h1>
          <p className="dashboard-subtitle">
            Editing profile for: {profile.name || profile.email}
          </p>
          <button 
            onClick={() => navigate('/admin')}
            className="back-button"
            style={{
              marginTop: '1rem',
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ← Back to Admin Dashboard
          </button>
        </div>

        <div className="dashboard-content" style={{maxWidth: '900px', margin: '0 auto'}}>
          <div className="dashboard-main" style={{width: '100%'}}>
            <div className="card-form-container">
              <h2>Profile Information</h2>
              
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
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Full name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="photoURL">Profile Photo</label>
                      <div className="photo-upload-container">
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
                      {form.photoURL && (
                        <div className="photo-preview">
                          <img src={form.photoURL} alt="Profile preview" />
                          <button
                            type="button"
                            className="remove-photo-button"
                            onClick={() => setForm({...form, photoURL: ''})}
                          >
                            Remove Photo
                          </button>
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
                        value={form.role}
                        onChange={handleChange}
                        placeholder="Job title"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="company">Company</label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      placeholder="Write a short bio"
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
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="Email address"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone">Phone 1</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
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
                        value={form.phone2}
                        onChange={handleChange}
                        placeholder="Secondary phone number"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone3">Phone 3</label>
                      <input
                        type="tel"
                        id="phone3"
                        name="phone3"
                        value={form.phone3}
                        onChange={handleChange}
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
                        value={form.phone4}
                        onChange={handleChange}
                        placeholder="Additional phone number"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="website">Website</label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={form.website}
                        onChange={handleChange}
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
                        value={form.website2}
                        onChange={handleChange}
                        placeholder="https://your-other-site.com"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="location">Location</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
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
                        value={form.availableDays1}
                        onChange={handleChange}
                        placeholder="Available Days"
                      />
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label htmlFor="officeName1">Office Name</label>
                      <input
                        type="text"
                        id="officeName1"
                        name="officeName1"
                        value={form.officeName1}
                        onChange={handleChange}
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
                        value={form.availableDays2}
                        onChange={handleChange}
                        placeholder="Available Days"
                      />
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label htmlFor="officeName2">Office Name</label>
                      <input
                        type="text"
                        id="officeName2"
                        name="officeName2"
                        value={form.officeName2}
                        onChange={handleChange}
                        placeholder="Office Name"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Social Media</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="socials.linkedin">LinkedIn</label>
                      <input
                        type="url"
                        id="socials.linkedin"
                        name="socials.linkedin"
                        value={form.socials.linkedin}
                        onChange={handleChange}
                        placeholder="LinkedIn profile URL"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="socials.tiktok">TikTok</label>
                      <input
                        type="url"
                        id="socials.tiktok"
                        name="socials.tiktok"
                        value={form.socials.tiktok}
                        onChange={handleChange}
                        placeholder="TikTok profile URL"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="socials.instagram">Instagram</label>
                      <input
                        type="url"
                        id="socials.instagram"
                        name="socials.instagram"
                        value={form.socials.instagram}
                        onChange={handleChange}
                        placeholder="Instagram profile URL"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="socials.facebook">Facebook</label>
                      <input
                        type="url"
                        id="socials.facebook"
                        name="socials.facebook"
                        value={form.socials.facebook}
                        onChange={handleChange}
                        placeholder="Facebook profile URL"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="socials.youtube">Youtube</label>
                      <input
                        type="url"
                        id="socials.youtube"
                        name="socials.youtube"
                        value={form.socials.youtube}
                        onChange={handleChange}
                        placeholder="Youtube profile URL"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Account Settings <span className="admin-badge" style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: '0.5rem'}}>Admin Only</span></h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Category</label>
                      <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        style={{
                          padding: '0.625rem 0.875rem',
                          border: '1.5px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '0.9375rem',
                          backgroundColor: '#ffffff',
                          color: '#1f2937',
                          width: '100%'
                        }}
                      >
                        <option value="Basic">Basic</option>
                        <option value="Premium">Premium</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        style={{
                          padding: '0.625rem 0.875rem',
                          border: '1.5px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '0.9375rem',
                          backgroundColor: '#ffffff',
                          color: '#1f2937',
                          width: '100%'
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="logoURL">Company Logo</label>
                      <div className="photo-upload-container">
                        <div className="upload-buttons">
                          <button 
                            type="button" 
                            className="upload-photo-button"
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
                      </div>
                      {form.logoURL && (
                        <div className="photo-preview" style={{borderRadius: '0.5rem'}}>
                          <img src={form.logoURL} alt="Logo preview" style={{borderRadius: '0.5rem'}} />
                          <button
                            type="button"
                            className="remove-photo-button"
                            onClick={() => setForm({...form, logoURL: ''})}
                          >
                            Remove Logo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="share-button"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-button" 
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditUserPage;
