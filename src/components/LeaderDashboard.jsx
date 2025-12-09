import React, { useEffect, useState } from 'react';
import { db, auth, cloudinaryStorage } from '../utils/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  where,
  query,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  isUserLeader, 
  getUserOrganization,
  addUserToOrganization,
  removeUserFromOrganization,
  createUserInOrganization,
  getUserRoleById,
  setUserRole,
  checkUserAccess
} from '../utils/auth';
import {
  getOrganizationMembers,
  updateMemberRole,
  updateMemberStatus
} from '../utils/leaderUtils';
import './LeaderDashboard.css';

const LeaderDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: 'user',
    phone: '',
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
    github: '',
    whatsapp: '',
    telegram: '',
    address: '',
    photoURL: ''
  });
  // Add organization details state
  const [organizationName, setOrganizationName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Image upload states
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const navigate = useNavigate();
  useEffect(() => {
    const checkLeaderStatus = async () => {
      try {
        if (!auth.currentUser) {
          navigate('/login');
          return;
        }
        
        // Get the user document directly from Firestore
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log('User document not found, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }
        
        const userData = userDoc.data();
        const userRole = userData.role || 'user';
        const orgId = userData.organizationId || null;
        
        console.log('User role from Firestore:', userRole);
        console.log('User organization ID from Firestore:', orgId);
        
        // If not a leader, redirect
        if (userRole !== 'leader') {
          console.log('User is not a leader, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }
        
        // If leader but no organization, show error
        if (!orgId) {
          console.log('Leader has no organization assigned');
          setAuthorized(false);
          return;
        }
        
        // If leader with organization, proceed
        setOrganizationId(orgId);
        setAuthorized(true);
        
        // Fetch the organization details
        const orgRef = doc(db, 'organizations', orgId);
        const orgDoc = await getDoc(orgRef);
        if (orgDoc.exists()) {
          setOrganizationName(orgDoc.data().name || 'Your Organization');
        }
        
        // Fetch all organization members
        fetchOrganizationMembers(orgId);
      } catch (error) {
        console.error('Error in checkLeaderStatus:', error);
        navigate('/dashboard');
      }
    };
    
    checkLeaderStatus();
  }, [navigate]);
  const fetchOrganizationMembers = async (orgId) => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      // Use our utility function to get organization members
      const members = await getOrganizationMembers(orgId);
      const usersList = [];
      
      // Process each member to get their profiles/cards if available
      for (const member of members) {
        // Get all cards associated with this user if they have any
        const userRef = doc(db, 'users', member.id);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        if (userData && userData.cards && userData.cards.length > 0) {
          for (const cardId of userData.cards) {
            const cardRef = doc(db, 'profiles', cardId);
            const cardSnap = await getDoc(cardRef);
            
            if (cardSnap.exists()) {
              usersList.push({
                id: cardId,
                userId: member.id,
                userEmail: member.email,
                userName: member.name,
                userRole: member.role,
                ...cardSnap.data(),
              });
            }
          }
        } else {
          // Users without cards
          usersList.push({
            id: member.id,
            userId: member.id,
            userEmail: member.email,
            userName: member.name,
            userRole: member.role,
            status: member.status || 'active',
            category: 'Basic',
            subscriptionExpires: null,
          });
        }
      }
      
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Failed to load team members: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    // Filter by tab
    if (activeTab === 'active' && user.status !== 'active') return false;
    if (activeTab === 'blocked' && user.status !== 'blocked') return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      
      const emailMatch = 
        (user.email && user.email.toLowerCase().includes(term)) || 
        (user.userEmail && user.userEmail.toLowerCase().includes(term));
        
      if (emailMatch) return true;
      
      return (
        (user.name && user.name.toLowerCase().includes(term)) ||
        (user.userName && user.userName.toLowerCase().includes(term)) ||
        (user.company && user.company.toLowerCase().includes(term))
      );
    }
    
    return true;
  });
  const handleStatusChange = async (uid, status) => {
    try {
      setLoading(true);
      
      // Use the new utility function to update member status
      const result = await updateMemberStatus(uid, status, organizationId);
      
      if (result.success) {
        // Update the local state to reflect the change
        setUsers(users.map(user => {
          if (user.id === uid || user.userId === uid) {
            return { ...user, status };
          }
          return user;
        }));
        
        console.log(result.message);
      } else {
        console.error("Error updating user status:", result.message);
        alert(`Failed to update user status: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async (actionType, userId = null) => {
    try {
      const hasPermission = await checkUserAccess(actionType, organizationId, userId);
      
      if (!hasPermission) {
        console.log(`Permission denied for action: ${actionType} on user: ${userId}`);
      }
      
      return hasPermission;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  const handleEditUser = async (user) => {
    if (await checkPermissions('edit_user', user.userId)) {
      setUserToEdit(user);
      
      // Fetch profile data if user has a profile card
      let profileData = {};
      if (user.id && user.id !== user.userId) {
        try {
          const profileRef = doc(db, 'profiles', user.id);
          const profileDoc = await getDoc(profileRef);
          if (profileDoc.exists()) {
            profileData = profileDoc.data();
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      }
      
      setEditUserData({
        name: user.userName || '',
        email: user.userEmail || '',
        role: user.userRole || 'user',
        phone: profileData.phone || '',
        company: profileData.company || '',
        position: profileData.position || '',
        bio: profileData.bio || '',
        website: profileData.website || '',
        linkedin: profileData.linkedin || '',
        twitter: profileData.twitter || '',
        instagram: profileData.instagram || '',
        facebook: profileData.facebook || '',
        youtube: profileData.youtube || '',
        tiktok: profileData.tiktok || '',
        github: profileData.github || '',
        whatsapp: profileData.whatsapp || '',
        telegram: profileData.telegram || '',
        address: profileData.address || '',
        photoURL: profileData.photoURL || user.photoURL || ''
      });
      
      // Set image preview
      setImagePreview(profileData.photoURL || user.photoURL || null);
      setShowEditUserModal(true);
    } else {
      alert('You do not have permission to edit this user');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setImageUploadLoading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const uploadPath = `profiles/${userToEdit.userId}/avatar`;
      const uploadResult = await cloudinaryStorage.uploadFile(file, uploadPath);
      
      // Update the editUserData with new photoURL
      setEditUserData(prev => ({
        ...prev,
        photoURL: uploadResult.secure_url
      }));

      console.log('Image uploaded successfully:', uploadResult.secure_url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setImagePreview(editUserData.photoURL || null);
    } finally {
      setImageUploadLoading(false);
    }
  };

  const removeImage = () => {
    setEditUserData(prev => ({
      ...prev,
      photoURL: ''
    }));
    setImagePreview(null);
  };

  const closeEditUserModal = () => {
    setShowEditUserModal(false);
    setImagePreview(null);
    setImageUploadLoading(false);
    setUserToEdit(null);
  };
  const saveUserEdits = async (e) => {
    e.preventDefault();
    if (!userToEdit) return;
    
    setLoading(true);
    try {
      // Update user document
      const userRef = doc(db, 'users', userToEdit.userId);
      
      await updateDoc(userRef, {
        name: editUserData.name,
        photoURL: editUserData.photoURL,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid
      });
      
      // Update role if changed
      if (editUserData.role !== userToEdit.userRole) {
        const result = await updateMemberRole(
          userToEdit.userId, 
          editUserData.role, 
          organizationId
        );
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to update user role');
        }
      }
      
      // Update profile document if user has a profile card
      if (userToEdit.id && userToEdit.id !== userToEdit.userId) {
        try {
          const profileRef = doc(db, 'profiles', userToEdit.id);
          const profileDoc = await getDoc(profileRef);
          
          if (profileDoc.exists()) {
            const profileUpdateData = {
              name: editUserData.name,
              email: editUserData.email,
              phone: editUserData.phone,
              company: editUserData.company,
              position: editUserData.position,
              bio: editUserData.bio,
              website: editUserData.website,
              linkedin: editUserData.linkedin,
              twitter: editUserData.twitter,
              instagram: editUserData.instagram,
              facebook: editUserData.facebook,
              youtube: editUserData.youtube,
              tiktok: editUserData.tiktok,
              github: editUserData.github,
              whatsapp: editUserData.whatsapp,
              telegram: editUserData.telegram,
              address: editUserData.address,
              photoURL: editUserData.photoURL,
              updatedAt: new Date().toISOString(),
              updatedBy: auth.currentUser.uid
            };
            
            await updateDoc(profileRef, profileUpdateData);
          }
        } catch (profileError) {
          console.error('Error updating profile:', profileError);
          // Don't throw here - user data was updated successfully
          alert('User data updated, but there was an issue updating the profile. Please try again.');
        }
      }
      
      await fetchOrganizationMembers(organizationId);
      closeEditUserModal();
      alert('User profile updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (await checkPermissions('remove_user', userId)) {
      if (window.confirm('Are you sure you want to remove this user from your organization?')) {
        try {
          const success = await removeUserFromOrganization(userId, organizationId);
          if (success) {
            // Refresh user list
            fetchOrganizationMembers(organizationId);
          }
        } catch (error) {
          console.error('Error removing user:', error);
          alert('Failed to remove user from organization');
        }
      }
    } else {
      alert('You do not have permission to remove this user');
    }
  };
  
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!organizationId) return;
    
    setLoading(true);
    try {
      if (!newUserData.name || !newUserData.email || !newUserData.password) {
        throw new Error('Please fill in all required fields');
      }
      
      const role = 'user';
      
      const userId = await createUserInOrganization(
        newUserData,
        organizationId,
        role
      );
      
      if (userId) {
        await fetchOrganizationMembers(organizationId);
        setShowAddUserForm(false);
        setNewUserData({
          name: '',
          email: '',
          password: '',
          role: 'user'
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Failed to create user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (value) => {
    return (
      <div className="qr-code-container">
        <QRCodeSVG value={value} size={64} />
        <div className="qr-actions">
          <a href={value} target="_blank" rel="noopener noreferrer" className="qr-download-link">
            View
          </a>
          <button 
            className="qr-download-link"
            onClick={() => {
              setSelectedUser({ url: value });
              setShowQrModal(true);
            }}
          >
            Share
          </button>
        </div>
      </div>
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => alert('Link copied to clipboard!'),
      (err) => console.error('Failed to copy text: ', err)
    );
  };

  if (!authorized || loading) {
    return (
      <div className="leader-dashboard">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="error-container" style={{
            maxWidth: '600px',
            margin: '40px auto',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#e53e3e', marginBottom: '15px' }}>Organization Required</h2>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>
              You have leader permissions, but no organization is assigned to your account.
            </p>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>
              Leaders must be assigned to an organization to access the Leader Dashboard.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '25px' }}>
              <button 
                onClick={() => navigate('/role-debug')} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Debug Your Role
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#a0aec0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="leader-dashboard">
      <div className="leader-header">
        <h2>{organizationName} - Team Dashboard</h2>
        <p className="leader-subtitle">Manage your team members</p>
      </div>
      
      <div className="leader-stats">
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.userRole !== 'leader').length}</div>
          <div className="stat-label">Total Team Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.status === 'active' && u.userRole !== 'leader').length}</div>
          <div className="stat-label">Active Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.status === 'blocked' && u.userRole !== 'leader').length}</div>
          <div className="stat-label">Blocked Members</div>
        </div>
      </div>
      
      {errorMessage && (
        <div className="error-message" style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {errorMessage}
        </div>
      )}
      
      <div className="action-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        {/* <button 
          className="add-member-btn"
          onClick={() => setShowAddUserForm(true)}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span> Add Team Member
        </button> */}
        
        <button 
          className="refresh-btn"
          onClick={() => fetchOrganizationMembers(organizationId)}
          style={{
            backgroundColor: '#4CAF50',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh List
        </button>
      </div>
      
      <div className="leader-filters">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Members
          </button>
          <button 
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button 
            className={`tab-button ${activeTab === 'blocked' ? 'active' : ''}`}
            onClick={() => setActiveTab('blocked')}
          >
            Blocked
          </button>
        </div>
        
        <div className="search-container">
          <input 
            type="text" 
            placeholder="       Search team members..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="leader-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Share</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <tr key={user.id} className={user.status === 'blocked' ? 'row-blocked' : ''}>
                <td className="user-name-cell">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name || user.userName} className="user-thumbnail" />
                  ) : (
                    <div className="user-thumbnail-placeholder">
                      {(user.name || user.userName || 'U').charAt(0).toUpperCase()
                      }
                    </div>
                  )}
                  <div className="user-name-container">
                    <span className="user-name">{user.name || user.userName || 'Unnamed User'}</span>
                    {user.company && <span className="user-company">{user.company}</span>}
                  </div>
                </td>
                <td>{user.email || user.userEmail}</td>
                <td>
                  <span className={`role-badge ${user.userRole}`}>
                    {user.userRole || 'user'}
                  </span>
                </td>
                <td>
                  <select 
                    value={user.status || 'active'} 
                    onChange={e => handleStatusChange(user.id, e.target.value)}
                    className="leader-select"
                    style={{
                      backgroundColor: user.status === 'active' ? '#e6f7e6' : '#f8d7da'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </td>
                <td>
                  <div className="share-cell">
                    <a 
                      href={`${window.location.origin}/card/${user.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="share-link"
                    >
                      View Card
                    </a>
                    <button 
                      className="copy-link-btn"
                      onClick={() => copyToClipboard(`${window.location.origin}/card/${user.id}`)}
                    >
                      Copy URL
                    </button>
                    {generateQRCode(`${window.location.origin}/card/${user.id}`)}
                  </div>
                </td>
                <td>
                  <div className="actions-cell">
                    <a 
                      href={`${window.location.origin}/card/${user.id}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="action-button view-btn"
                    >
                      View Card
                    </a>
                    <button 
                      className="action-button edit-btn"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-button remove-btn"
                      onClick={() => handleRemoveUser(user.userId)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="no-results">
                  <div className="no-results-message">
                    {searchTerm ? 
                      `No users found matching "${searchTerm}"` : 
                      `No users found in the "${activeTab}" category`}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* QR Code Modal */}
      {showQrModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowQrModal(false)}>×</button>
            <h3>Share Business Card</h3>
            
            <div className="qr-large">
              <QRCodeSVG value={selectedUser.url} size={256} />
            </div>
            
            <div className="share-options">
              <input 
                type="text" 
                readOnly 
                value={selectedUser.url} 
                className="share-url-input" 
              />
              <button 
                className="copy-url-btn"
                onClick={() => copyToClipboard(selectedUser.url)}
              >
                Copy URL
              </button>
            </div>
            
            <div className="modal-footer">
              <p>Scan this QR code to view the business card</p>
              <button 
                className="download-qr-btn"
                onClick={() => alert("In a real application, this would download the QR code as an image")}
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddUserForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setShowAddUserForm(false)}>×</button>
            <h3>Add New Team Member</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={newUserData.name} 
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={newUserData.email} 
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={newUserData.password} 
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddUserForm(false)} className="cancel-btn">Cancel</button>
                <button type="submit" disabled={loading} className="submit-btn">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditUserModal && userToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '80vh', overflowY: 'auto', maxWidth: '600px' }}>
            <button className="close-modal" onClick={closeEditUserModal}>×</button>
            <h3>Edit Team Member Profile</h3>
            <form onSubmit={saveUserEdits}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                
                {/* Basic Information */}
                <div className="form-section" style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ marginBottom: '15px', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>Basic Information</h4>
                </div>
                
                {/* Profile Image Upload */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Profile Image</label>
                  <div className="image-upload-container" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                    {imagePreview && (
                      <div className="image-preview" style={{ position: 'relative' }}>
                        <img 
                          src={imagePreview} 
                          alt="Profile preview" 
                          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }}
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          style={{ 
                            position: 'absolute', 
                            top: '-5px', 
                            right: '-5px', 
                            background: '#ff4444', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '50%', 
                            width: '20px', 
                            height: '20px', 
                            cursor: 'pointer', 
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        id="profile-image-upload"
                        disabled={imageUploadLoading}
                      />
                      <label 
                        htmlFor="profile-image-upload"
                        className="upload-btn"
                        style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          backgroundColor: imageUploadLoading ? '#ccc' : '#007bff',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: imageUploadLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {imageUploadLoading ? 'Uploading...' : 'Choose Image'}
                      </label>
                      <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                        Max 5MB. Supported: JPG, PNG, GIF
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Name *</label>
                  <input 
                    type="text" 
                    value={editUserData.name} 
                    onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={editUserData.email} 
                    readOnly
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                  <small>Email cannot be changed</small>
                </div>
                
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    value={editUserData.phone} 
                    onChange={(e) => setEditUserData({...editUserData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({...editUserData, role: e.target.value})}
                  >
                    <option value="user">Regular User</option>
                    {auth.currentUser && auth.currentUser.uid !== userToEdit.userId && (
                      <option value="leader">Team Leader</option>
                    )}
                  </select>
                </div>
                
                {/* Professional Information */}
                <div className="form-section" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '15px', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>Professional Information</h4>
                </div>
                
                <div className="form-group">
                  <label>Company</label>
                  <input 
                    type="text" 
                    value={editUserData.company} 
                    onChange={(e) => setEditUserData({...editUserData, company: e.target.value})}
                    placeholder="Company name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Position/Title</label>
                  <input 
                    type="text" 
                    value={editUserData.position} 
                    onChange={(e) => setEditUserData({...editUserData, position: e.target.value})}
                    placeholder="Job title or position"
                  />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Bio/Description</label>
                  <textarea 
                    value={editUserData.bio} 
                    onChange={(e) => setEditUserData({...editUserData, bio: e.target.value})}
                    placeholder="Brief description or bio"
                    rows="3"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <input 
                    type="text" 
                    value={editUserData.address} 
                    onChange={(e) => setEditUserData({...editUserData, address: e.target.value})}
                    placeholder="Business or personal address"
                  />
                </div>
                
                {/* Contact & Social Links */}
                <div className="form-section" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '15px', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>Contact & Social Links</h4>
                </div>
                
                <div className="form-group">
                  <label>Website</label>
                  <input 
                    type="url" 
                    value={editUserData.website} 
                    onChange={(e) => setEditUserData({...editUserData, website: e.target.value})}
                    placeholder="https://website.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input 
                    type="url" 
                    value={editUserData.linkedin} 
                    onChange={(e) => setEditUserData({...editUserData, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                
                <div className="form-group">
                  <label>Twitter</label>
                  <input 
                    type="url" 
                    value={editUserData.twitter} 
                    onChange={(e) => setEditUserData({...editUserData, twitter: e.target.value})}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                
                <div className="form-group">
                  <label>Instagram</label>
                  <input 
                    type="url" 
                    value={editUserData.instagram} 
                    onChange={(e) => setEditUserData({...editUserData, instagram: e.target.value})}
                    placeholder="https://instagram.com/username"
                  />
                </div>
                
                <div className="form-group">
                  <label>Facebook</label>
                  <input 
                    type="url" 
                    value={editUserData.facebook} 
                    onChange={(e) => setEditUserData({...editUserData, facebook: e.target.value})}
                    placeholder="https://facebook.com/username"
                  />
                </div>
                
                <div className="form-group">
                  <label>YouTube</label>
                  <input 
                    type="url" 
                    value={editUserData.youtube} 
                    onChange={(e) => setEditUserData({...editUserData, youtube: e.target.value})}
                    placeholder="https://youtube.com/@username"
                  />
                </div>
                
                <div className="form-group">
                  <label>TikTok</label>
                  <input 
                    type="url" 
                    value={editUserData.tiktok} 
                    onChange={(e) => setEditUserData({...editUserData, tiktok: e.target.value})}
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
                
                <div className="form-group">
                  <label>GitHub</label>
                  <input 
                    type="url" 
                    value={editUserData.github} 
                    onChange={(e) => setEditUserData({...editUserData, github: e.target.value})}
                    placeholder="https://github.com/username"
                  />
                </div>
                
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input 
                    type="text" 
                    value={editUserData.whatsapp} 
                    onChange={(e) => setEditUserData({...editUserData, whatsapp: e.target.value})}
                    placeholder="WhatsApp number or link"
                  />
                </div>
                
                <div className="form-group">
                  <label>Telegram</label>
                  <input 
                    type="text" 
                    value={editUserData.telegram} 
                    onChange={(e) => setEditUserData({...editUserData, telegram: e.target.value})}
                    placeholder="Telegram username or link"
                  />
                </div>
              </div>
              
              <div className="form-actions" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button type="button" onClick={closeEditUserModal} className="cancel-btn">Cancel</button>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderDashboard;
