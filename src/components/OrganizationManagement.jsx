import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createOrganization, 
  getOrganizations, 
  getOrganizationWithMembers, 
  createUserInOrganization,
  addUserToOrganization,
  removeUserFromOrganization,
  isUserAdmin,
  getUserRole,
  refreshUserPermissions,
  getAllUsers,
  deleteOrganization,
  setUserRole,
  getUserProfile,
  updateUserProfile,
  canEditUserProfile
} from '../utils/auth';
import { testFirestoreConnection, addDebuggingButton } from '../utils/dbDebug';
import Navbar from './Navbar';
import './OrganizationManagement.css';
import './OrganizationManagementEnhanced.css';
import './RoleUpdateStyles.css';
import './LeaderOrganizationStyles.css';

const OrganizationManagement = () => {
  // State management
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userRole, setUserRole] = useState('user');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [error, setError] = useState(null);
  const [canManageOrg, setCanManageOrg] = useState(false);
  const [canAddUsers, setCanAddUsers] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ name: '', description: '' });
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    email: '',
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
    category: 'Basic',
    status: 'active'
  });

  // Check user permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const admin = await isUserAdmin();
        const role = await getUserRole();
        const superAdmin = role === 'superadmin';
        setIsAdmin(admin || superAdmin);
        setIsSuperAdmin(superAdmin);
        setUserRole(role);
        setCanManageOrg(admin || superAdmin || role === 'leader');
        setCanAddUsers(admin || superAdmin || role === 'leader');
      } catch (error) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setUserRole('user');
        setCanManageOrg(false);
        setCanAddUsers(false);
      }
    };
    const testConnection = async () => {
      const connected = await testFirestoreConnection();
      if (!connected) setError('Database connection issue detected. Some features may not work properly.');
      if (import.meta.env.DEV) addDebuggingButton();
    };
    checkPermissions();
    testConnection();
  }, []);

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, [userRole]);

  const updatePermissionStates = async () => {
    try {
      const result = await refreshUserPermissions();
      if (result.success) {
        const superAdmin = result.role === 'superadmin';
        setUserRole(result.role || 'user');
        setIsSuperAdmin(superAdmin);
        setIsAdmin(result.role === 'admin' || superAdmin);
        setCanManageOrg(result.role === 'admin' || superAdmin || result.role === 'leader');
        setCanAddUsers(result.role === 'admin' || superAdmin || result.role === 'leader');
      }
    } catch {}
  };

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await getOrganizations();
      setOrganizations(orgs);
      setActiveOrg(null);
      setOrgMembers([]);
    } catch {
      setOrganizations([]);
      setActiveOrg(null);
      setOrgMembers([]);
      setCanManageOrg(false);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async (orgId) => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      if (orgId && orgMembers.length > 0) {
        const memberIds = orgMembers.map(member => member.id);
        setAvailableUsers(allUsers.filter(user => !memberIds.includes(user.id)));
      } else {
        setAvailableUsers(allUsers);
      }
    } catch {
      setAvailableUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = async (orgId) => {
    try {
      setLoading(true);
      setError(null);
      const org = await getOrganizationWithMembers(orgId);
      if (org) {
        setActiveOrg(org);
        setOrgMembers(org.members || []);
        await loadAvailableUsers(orgId);
        await updatePermissionStates();
      } else {
        setError('Failed to load organization details');
        setActiveOrg(null);
        setOrgMembers([]);
      }
    } catch {
      setError('Failed to load organization details');
      setActiveOrg(null);
      setOrgMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (!newOrgData.name) {
        setError('Organization name is required');
        return;
      }
      const orgId = await createOrganization(newOrgData);
      if (orgId) {
        setNewOrgData({ name: '', description: '' });
        setShowNewOrgForm(false);
        await loadOrganizations();
      } else {
        setError('Failed to create organization');
      }
    } catch (error) {
      setError('Error creating organization: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (!newUserData.name || !newUserData.email || !newUserData.password) {
        setError('All fields are required');
        return;
      }
      if (!activeOrg) {
        setError('No active organization selected');
        return;
      }
      if (!isAdmin && userRole !== 'leader') {
        setError('You do not have permission to add users');
        alert('You do not have permission to add new users to this organization.');
        return;
      }
      const userId = await createUserInOrganization(newUserData, activeOrg.id, newUserData.role);
      if (userId) {
        setNewUserData({ name: '', email: '', password: '', role: 'user' });
        setShowAddUserForm(false);
        await handleSelectOrg(activeOrg.id);
      } else {
        setError('Failed to create user');
      }
    } catch (error) {
      setError('Error creating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExistingUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (!selectedUserId) {
        setError('Please select a user');
        return;
      }
      if (!activeOrg) {
        setError('No active organization selected');
        return;
      }
      if (!isAdmin && userRole !== 'leader') {
        setError('You do not have permission to add users');
        return;
      }
      const selectedUser = availableUsers.find(user => user.id === selectedUserId);
      if (!selectedUser) {
        setError('Selected user not found');
        return;
      }
      const success = await addUserToOrganization(selectedUserId, activeOrg.id, 'user');
      if (success) {
        setSelectedUserId('');
        await handleSelectOrg(activeOrg.id);
      } else {
        setError('Failed to add user to organization');
      }
    } catch (error) {
      setError('Error adding user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId, userName, memberRole) => {
    try {
      if (memberRole === 'leader' && !isAdmin) {
        setError('Leaders cannot remove other leaders from the organization');
        return;
      }
      if (!isAdmin && userRole !== 'leader') {
        setError('You do not have permission to remove users');
        alert('You do not have permission to remove this user from the organization.');
        return;
      }
      if (!window.confirm(`Are you sure you want to remove ${userName || userId} from this organization?`)) {
        return;
      }
      setLoading(true);
      const success = await removeUserFromOrganization(userId, activeOrg.id);
      if (success) {
        await handleSelectOrg(activeOrg.id);
      } else {
        setError('Failed to remove user from organization');
      }
    } catch (error) {
      setError('Error removing user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      if (!activeOrg) {
        setError('No active organization selected');
        return;
      }
      // Only admin/superadmin can change roles
      if (!isAdmin && !isSuperAdmin) {
        setError('Only admins can update user roles');
        return;
      }
      // Super admins can assign any role, regular admins can only assign user/leader
      if (!isSuperAdmin && newRole !== 'user' && newRole !== 'leader') {
        setError('Admins can only assign user or leader roles');
        return;
      }
      setLoading(true);
      setError(null);
      // Use the imported setUserRole function directly
      import('../utils/auth').then(({ setUserRole }) => {
        setUserRole(userId, newRole, activeOrg.id).then(result => {
          if (result && result.success) {
            handleSelectOrg(activeOrg.id);
          } else {
            setError('Failed to update user role: ' + (result && result.error ? result.error : 'Unknown error'));
          }
          setLoading(false);
        }).catch(error => {
          setError('Error updating role: ' + error.message);
          setLoading(false);
        });
      });
    } catch (error) {
      setError('Error updating role: ' + error.message);
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!activeOrg) return;
    if (!window.confirm(`Are you sure you want to delete the organization "${activeOrg.name}"? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const success = await deleteOrganization(activeOrg.id);
      if (success) {
        await loadOrganizations(); // reload org list, clears activeOrg
        setActiveOrg(null);
        setOrgMembers([]);
      } else {
        setError('Failed to delete organization.');
      }
    } catch (error) {
      setError('Error deleting organization: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if current user can edit this profile
      const canEdit = await canEditUserProfile(userId, activeOrg?.id);
      if (!canEdit) {
        setError('You do not have permission to edit this user\'s profile');
        return;
      }

      // Get user profile
      const profile = await getUserProfile(userId);
      const user = orgMembers.find(member => member.id === userId);
      
      if (profile || user) {
        setEditingUser({ id: userId, ...user });
        setEditProfileForm({
          name: profile?.name || user?.name || '',
          email: profile?.email || user?.email || '',
          phone: profile?.phone || '',
          company: profile?.company || '',
          position: profile?.position || '',
          bio: profile?.bio || '',
          website: profile?.website || '',
          linkedin: profile?.linkedin || '',
          twitter: profile?.twitter || '',
          instagram: profile?.instagram || '',
          facebook: profile?.facebook || '',
          youtube: profile?.youtube || '',
          tiktok: profile?.tiktok || '',
          github: profile?.github || '',
          whatsapp: profile?.whatsapp || '',
          telegram: profile?.telegram || '',
          address: profile?.address || '',
          category: profile?.category || 'Basic',
          status: profile?.status || 'active'
        });
        setShowEditProfileModal(true);
      } else {
        setError('User profile not found');
      }
    } catch (error) {
      setError('Error loading user profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await updateUserProfile(editingUser.id, editProfileForm, activeOrg?.id);
      
      setShowEditProfileModal(false);
      setEditingUser(null);
      // Refresh organization members to show updated data
      await handleSelectOrg(activeOrg.id);
      alert('User profile updated successfully!');
    } catch (error) {
      setError('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfileFormChange = (e) => {
    setEditProfileForm({
      ...editProfileForm,
      [e.target.name]: e.target.value
    });
  };

  const closeEditProfileModal = () => {
    setShowEditProfileModal(false);
    setEditingUser(null);
    setEditProfileForm({
      name: '',
      email: '',
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
      category: 'Basic',
      status: 'active'
    });
  };

  const navigate = useNavigate();
  
  // Count roles
  const leaderCount = orgMembers.filter(m => m.role === 'leader').length;
  const userCount = orgMembers.filter(m => m.role === 'user' || !m.role).length;

  return (
    <div className="org-management-page">
      <Navbar />
      
      <div className="org-management-wrapper">
        {/* Header Section */}
        <div className="org-header-section">
          <div className="org-header-content">
            <button className="back-button" onClick={() => navigate(-1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <div className="org-header-text">
              <h1>Organization Management</h1>
              <p>Manage your organizations, members, and roles</p>
            </div>
          </div>
          <div className="org-header-stats">
            <div className="header-stat-card">
              <div className="stat-icon orgs">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">{organizations.length}</span>
                <span className="stat-label">Organizations</span>
              </div>
            </div>
            <div className="header-stat-card">
              <div className="stat-icon members">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">{orgMembers.length}</span>
                <span className="stat-label">Total Members</span>
              </div>
            </div>
            <div className="header-stat-card">
              <div className="stat-icon role">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-number">{isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : userRole === 'leader' ? 'Leader' : 'User'}</span>
                <span className="stat-label">Your Role</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="org-error-banner">
            <div className="error-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="error-dismiss">×</button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="org-loading-overlay">
            <div className="loading-spinner"></div>
            <span>Loading...</span>
          </div>
        )}

        {/* Main Content */}
        <div className="org-main-content">
          {/* Organizations Sidebar */}
          <div className="org-sidebar">
            <div className="sidebar-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                </svg>
                Organizations
              </h3>
              {(isAdmin || userRole === 'leader') && (
                <button 
                  className="new-org-btn"
                  onClick={() => setShowNewOrgForm(!showNewOrgForm)}
                  title={showNewOrgForm ? 'Cancel' : 'Create New Organization'}
                >
                  {showNewOrgForm ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* New Organization Form */}
            {showNewOrgForm && (
              <form onSubmit={handleCreateOrg} className="new-org-form">
                <div className="form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={newOrgData.name}
                    onChange={e => setNewOrgData({...newOrgData, name: e.target.value})}
                    placeholder="Enter organization name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newOrgData.description}
                    onChange={e => setNewOrgData({...newOrgData, description: e.target.value})}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
                <button type="submit" className="create-btn" disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Create Organization
                </button>
              </form>
            )}

            {/* Organizations List */}
            <div className="org-list-container">
              {organizations.length > 0 ? (
                organizations.map(org => (
                  <div 
                    key={org.id} 
                    className={`org-list-item ${activeOrg?.id === org.id ? 'active' : ''}`}
                    onClick={() => handleSelectOrg(org.id)}
                  >
                    <div className="org-item-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                      </svg>
                    </div>
                    <div className="org-item-info">
                      <span className="org-name">{org.name || 'Unnamed Organization'}</span>
                      <span className="org-date">Created {new Date(org.createdAt).toLocaleDateString()}</span>
                    </div>
                    {activeOrg?.id === org.id && (
                      <div className="active-indicator"></div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                  </svg>
                  <p>No organizations found</p>
                  <span>Create your first organization to get started</span>
                </div>
              )}
            </div>
          </div>

          {/* Organization Details */}
          <div className="org-details-panel">
            {activeOrg ? (
              <>
                {/* Organization Info Card */}
                <div className="org-info-card">
                  <div className="org-info-header">
                    <div className="org-avatar">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                      </svg>
                    </div>
                    <div className="org-info-text">
                      <h2>{activeOrg.name}</h2>
                      <p>{activeOrg.description || 'No description provided'}</p>
                    </div>
                    {(isAdmin || isSuperAdmin) && (
                      <button
                        onClick={handleDeleteOrganization}
                        className="delete-org-btn"
                        disabled={loading}
                        title="Delete Organization"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="org-stats-row">
                    <div className="org-stat">
                      <span className="stat-value">{orgMembers.length}</span>
                      <span className="stat-label">Members</span>
                    </div>
                    <div className="org-stat">
                      <span className="stat-value">{leaderCount}</span>
                      <span className="stat-label">Leaders</span>
                    </div>
                    <div className="org-stat">
                      <span className="stat-value">{userCount}</span>
                      <span className="stat-label">Users</span>
                    </div>
                    <div className="org-stat">
                      <span className="stat-value">{new Date(activeOrg.createdAt).toLocaleDateString()}</span>
                      <span className="stat-label">Created</span>
                    </div>
                  </div>
                </div>

                {/* Add User Section - Always visible when org is selected */}
                <div className="add-user-section">
                  <div className="section-header">
                    <h3>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8M20 8v6M23 11h-6"/>
                      </svg>
                      Add Members
                    </h3>
                    {canAddUsers && (
                      <button 
                        className={`toggle-form-btn ${showAddUserForm ? 'active' : ''}`}
                        onClick={() => setShowAddUserForm(!showAddUserForm)}
                      >
                        {showAddUserForm ? 'Hide Form' : 'Create New User'}
                      </button>
                    )}
                  </div>

                  {!canAddUsers && (
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0' }}>
                      You need admin or leader permissions to add members.
                    </p>
                  )}

                  {canAddUsers && showAddUserForm && (
                      <form onSubmit={handleCreateUser} className="create-user-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Full Name</label>
                            <input
                              type="text"
                              value={newUserData.name}
                              onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                              placeholder="John Doe"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Email Address</label>
                            <input
                              type="email"
                              value={newUserData.email}
                              onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                              placeholder="john@example.com"
                              required
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Password</label>
                            <input
                              type="password"
                              value={newUserData.password}
                              onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                              placeholder="••••••••"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Role</label>
                            <select
                              value={newUserData.role}
                              onChange={e => setNewUserData({...newUserData, role: e.target.value})}
                            >
                              <option value="user">User</option>
                              {(isAdmin || isSuperAdmin) && <option value="leader">Leader</option>}
                              {isSuperAdmin && <option value="admin">Admin</option>}
                              {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                            </select>
                          </div>
                        </div>
                        <button type="submit" className="submit-btn" disabled={loading}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8M20 8v6M23 11h-6"/>
                          </svg>
                          Create User
                        </button>
                      </form>
                    )}

                    {canAddUsers && availableUsers.length > 0 && (
                      <form onSubmit={handleAddExistingUser} className="add-existing-form">
                        <div className="form-group">
                          <label>Add Existing User</label>
                          <div className="select-with-btn">
                            <select
                              value={selectedUserId}
                              onChange={e => setSelectedUserId(e.target.value)}
                            >
                              <option value="">Select a user to add...</option>
                              {availableUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.name} ({user.email})
                                </option>
                              ))}
                            </select>
                            <button type="submit" disabled={loading || !selectedUserId}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                              Add
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>

                {/* Members Table */}
                <div className="members-section">
                  <div className="section-header">
                    <h3>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      Team Members ({orgMembers.length})
                    </h3>
                  </div>

                  {orgMembers.length > 0 ? (
                    <div className="members-grid">
                      {orgMembers.map(member => (
                        <div key={member.id} className="member-card">
                          <div className="member-avatar">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt={member.name} />
                            ) : (
                              <span>{(member.name || 'U').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="member-info">
                            <h4>{member.name || 'Unknown User'}</h4>
                            <span className="member-email">{member.email || 'No email'}</span>
                            <div className="member-role-badge">
                              {(isAdmin || isSuperAdmin) ? (
                                <select
                                  className={`role-select ${member.role || 'user'}`}
                                  value={member.role || 'user'}
                                  onChange={e => handleUpdateUserRole(member.id, e.target.value)}
                                  disabled={loading || (member.role === 'superadmin' && !isSuperAdmin)}
                                >
                                  <option value="user">User</option>
                                  <option value="leader">Leader</option>
                                  {isSuperAdmin && <option value="admin">Admin</option>}
                                  {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                                </select>
                              ) : (
                                <span className={`role-badge ${member.role || 'user'}`}>
                                  {member.role === 'superadmin' ? '🛡️ Super Admin' : member.role === 'admin' ? '⚙️ Admin' : member.role === 'leader' ? '👑 Leader' : '👤 User'}
                                </span>
                              )}
                            </div>
                          </div>
                          {(isSuperAdmin || isAdmin || (userRole === 'leader' && member.role !== 'leader' && member.role !== 'admin' && member.role !== 'superadmin')) && (
                            <div className="member-actions">
                              <button
                                onClick={() => handleEditProfile(member.id)}
                                className="action-btn edit"
                                disabled={loading}
                                title="Edit Profile"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRemoveUser(member.id, member.name, member.role)}
                                className="action-btn remove"
                                disabled={loading}
                                title="Remove from Organization"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8M18 8l5 5M23 8l-5 5"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-members">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      <p>No members in this organization</p>
                      <span>Add members using the form above</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-org-selected">
                <div className="no-org-content">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                  </svg>
                  <h3>Select an Organization</h3>
                  <p>Choose an organization from the sidebar to view details and manage members</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && editingUser && (
        <div className="modal-overlay" onClick={closeEditProfileModal}>
          <div className="edit-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <div>
                  <h3>Edit Profile</h3>
                  <span>{editingUser.name || editingUser.email}</span>
                </div>
              </div>
              <button 
                onClick={closeEditProfileModal}
                className="close-modal-btn"
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="edit-profile-form">
              <div className="form-section">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8"/>
                  </svg>
                  Personal Information
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      name="name" 
                      value={editProfileForm.name} 
                      onChange={handleEditProfileFormChange} 
                      placeholder="John Doe"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      name="email" 
                      value={editProfileForm.email} 
                      onChange={handleEditProfileFormChange} 
                      type="email"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      name="phone" 
                      value={editProfileForm.phone} 
                      onChange={handleEditProfileFormChange}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    <input 
                      name="website" 
                      value={editProfileForm.website} 
                      onChange={handleEditProfileFormChange} 
                      type="url"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                  </svg>
                  Work Information
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Company</label>
                    <input 
                      name="company" 
                      value={editProfileForm.company} 
                      onChange={handleEditProfileFormChange}
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <input 
                      name="position" 
                      value={editProfileForm.position} 
                      onChange={handleEditProfileFormChange}
                      placeholder="Job Title"
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea 
                    name="bio" 
                    value={editProfileForm.bio} 
                    onChange={handleEditProfileFormChange} 
                    rows="3"
                    placeholder="Brief description about the user..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea 
                    name="address" 
                    value={editProfileForm.address} 
                    onChange={handleEditProfileFormChange} 
                    rows="2"
                    placeholder="Full address..."
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4"/>
                  </svg>
                  Account Settings
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Category</label>
                    <select 
                      name="category" 
                      value={editProfileForm.category} 
                      onChange={handleEditProfileFormChange}
                    >
                      <option value="Basic">Basic</option>
                      <option value="Premium">Premium</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                  {isAdmin && (
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        name="status" 
                        value={editProfileForm.status} 
                        onChange={handleEditProfileFormChange}
                      >
                        <option value="active">✅ Active</option>
                        <option value="suspended">⏸️ Suspended</option>
                        <option value="blocked">🚫 Blocked</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                  Social Media Links
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>LinkedIn</label>
                    <input 
                      name="linkedin" 
                      value={editProfileForm.linkedin} 
                      onChange={handleEditProfileFormChange} 
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Twitter</label>
                    <input 
                      name="twitter" 
                      value={editProfileForm.twitter} 
                      onChange={handleEditProfileFormChange} 
                      type="url"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Instagram</label>
                    <input 
                      name="instagram" 
                      value={editProfileForm.instagram} 
                      onChange={handleEditProfileFormChange} 
                      type="url"
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Facebook</label>
                    <input 
                      name="facebook" 
                      value={editProfileForm.facebook} 
                      onChange={handleEditProfileFormChange} 
                      type="url"
                      placeholder="https://facebook.com/username"
                    />
                  </div>
                  <div className="form-group">
                    <label>GitHub</label>
                    <input 
                      name="github" 
                      value={editProfileForm.github} 
                      onChange={handleEditProfileFormChange} 
                      type="url"
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input 
                      name="whatsapp" 
                      value={editProfileForm.whatsapp} 
                      onChange={handleEditProfileFormChange}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={closeEditProfileModal}
                  className="btn-cancel"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn-save"
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                        <path d="M17 21v-8H7v8M7 3v5h8"/>
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
