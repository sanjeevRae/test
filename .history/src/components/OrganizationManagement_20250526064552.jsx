import React, { useState, useEffect, useCallback } from 'react';
import { 
  createOrganization, 
  getOrganizations, 
  getOrganizationWithMembers, 
  createUserInOrganization,
  setUserRole,
  addUserToOrganization,
  removeUserFromOrganization,
  isUserAdmin,
  getUserRole,
  refreshUserPermissions,
  getAllUsers
} from '../utils/auth';
import { getSuccessFromResult, getErrorFromResult } from '../utils/compatHelpers';
import { db, auth } from '../utils/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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
  const [error, setError] = useState(null);
  const [canManageOrg, setCanManageOrg] = useState(false);
  const [canAddUsers, setCanAddUsers] = useState(false);
  
  // Form states
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    description: ''
  });

  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // Check user permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const admin = await isUserAdmin();
        const role = await getUserRole();
        
        setIsAdmin(admin);
        setUserRole(role);
        
        setCanManageOrg(admin || role === 'leader');
        setCanAddUsers(admin || role === 'leader');
        
        console.log('User permissions checked:', { isAdmin: admin, role });
      } catch (error) {
        console.error('Error checking permissions:', error);
        // Set fallback permissions
        setIsAdmin(false);
        setUserRole('user');
        setCanManageOrg(false);
        setCanAddUsers(false);
        console.log('User permissions checked (fallback):', { isAdmin: false, role: 'user' });
      }
    };
    
    checkPermissions();
  }, []);

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, [userRole]);

  const updatePermissionStates = async () => {
    try {
      const result = await refreshUserPermissions();
      if (result.success) {
        setUserRole(result.role || 'user');
        // Update other permission states as needed
        setCanManageOrg(result.role === 'admin' || result.role === 'leader');
        setCanAddUsers(result.role === 'admin' || result.role === 'leader');
      }
    } catch (error) {
      console.error('Error updating permission states:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await getOrganizations();
      setOrganizations(orgs);
      console.log('Organizations loaded:', orgs.length);
      
      // Clear active org when reloading
      setActiveOrg(null);
      setOrgMembers([]);
      
    } catch (error) {
      console.error('Error loading organizations:', error);
      setError('Failed to load organizations');
      
      // Clear data on error
      setOrganizations([]);
      setActiveOrg(null);
      setOrgMembers([]);
      setCanManageOrg(false);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async (orgId) => {
    try {
      setLoading(true);
      
      // Get all users from Firestore
      const allUsers = await getAllUsers();
      
      // If we have an active organization, filter out users already in the org
      if (orgId && orgMembers.length > 0) {
        const memberIds = orgMembers.map(member => member.id);
        const filteredUsers = allUsers.filter(user => !memberIds.includes(user.id));
        setAvailableUsers(filteredUsers);
        console.log(`Loaded ${filteredUsers.length} available users (filtered from ${allUsers.length} total users)`);
      } else {
        setAvailableUsers(allUsers);
        console.log(`Loaded ${allUsers.length} available users`);
      }
    } catch (error) {
      console.error('Error loading available users:', error);
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
        console.log('Organization selected:', org.name);
        console.log('Members:', org.members?.length || 0);
        
        // Load available users AFTER setting orgMembers to properly filter
        await loadAvailableUsers(orgId);
        await updatePermissionStates();
      } else {
        setError('Failed to load organization details');
        setActiveOrg(null);
        setOrgMembers([]);
      }
    } catch (error) {
      console.error('Error selecting organization:', error);
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
      
      console.log('Creating organization:', newOrgData);
      const orgId = await createOrganization(newOrgData);
      
      if (orgId) {
        console.log('Organization created with ID:', orgId);
        setNewOrgData({ name: '', description: '' });
        setShowNewOrgForm(false);
        
        // Reload organizations
        await loadOrganizations();
      } else {
        setError('Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
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
      
      // Check permissions
      if (!isAdmin && userRole !== 'leader') {
        setError('You do not have permission to add users');
        alert('You do not have permission to add new users to this organization.');
        return;
      }
      
      console.log('Creating user in organization:', {
        ...newUserData,
        password: '*****', // Don't log passwords
        organizationId: activeOrg.id
      });
      
      const userId = await createUserInOrganization(
        newUserData,
        activeOrg.id,
        newUserData.role
      );
      
      if (userId) {
        console.log('User created with ID:', userId);
        setNewUserData({
          name: '',
          email: '',
          password: '',
          role: 'user'
        });
        setShowAddUserForm(false);
        
        // Reload organization to show new member
        await handleSelectOrg(activeOrg.id);
      } else {
        setError('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
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
      
      // Check permissions
      if (!isAdmin && userRole !== 'leader') {
        setError('You do not have permission to add users');
        return;
      }
      
      // Find the selected user from availableUsers array
      const selectedUser = availableUsers.find(user => user.id === selectedUserId);
      if (!selectedUser) {
        setError('Selected user not found');
        return;
      }
      
      console.log('Adding existing user to organization:', {
        userId: selectedUserId,
        userName: selectedUser.name,
        userEmail: selectedUser.email,
        organizationId: activeOrg.id,
        role: 'user' // Default role
      });
      
      const success = await addUserToOrganization(
        selectedUserId,
        activeOrg.id,
        'user' // Default role for added users
      );
      
      if (success) {
        console.log('User added to organization successfully');
        setSelectedUserId('');
        
        // Reload organization to show new member
        await handleSelectOrg(activeOrg.id);
      } else {
        setError('Failed to add user to organization');
      }
    } catch (error) {
      console.error('Error adding user to organization:', error);
      setError('Error adding user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId, userName, userRole) => {
    try {
      // Check if trying to remove a leader when not an admin
      if (userRole === 'leader' && !isAdmin) {
        setError('Leaders cannot remove other leaders from the organization');
        return;
      }
      
      // Check permissions
      if (!isAdmin && userRole !== 'leader') {
        setError('You do not have permission to remove users');
        alert('You do not have permission to remove this user from the organization.');
        return;
      }
      
      if (!window.confirm(`Are you sure you want to remove ${userName || userId} from this organization?`)) {
        return;
      }
      
      setLoading(true);
      // Show a specific loading state for this operation
      
      console.log('Removing user from organization:', {
        userId,
        organizationId: activeOrg.id
      });
      
      const success = await removeUserFromOrganization(userId, activeOrg.id);
      
      if (success) {
        console.log('User removed from organization successfully');
        
        // Reload organization to update member list
        await handleSelectOrg(activeOrg.id);
      } else {
        setError('Failed to remove user from organization');
      }
    } catch (error) {
      console.error('Error removing user from organization:', error);
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
      
      // Check permissions for role updates
      if (!isAdmin && userRole !== 'leader') {
        setError('You do not have permission to update user roles');
        return;
      }
      
      setLoading(true);
      
      console.log('Updating user role:', {
        userId,
        newRole,
        organizationId: activeOrg.id
      });
      
      try {
        const result = await setUserRole(userId, newRole, activeOrg.id);
        console.log('Role update result:', result);
        
        if (result && result.success) {
          console.log('User role updated successfully');
          
          // Reload organization to update member list
          await handleSelectOrg(activeOrg.id);
        } else {
          const errorMsg = result && result.error ? result.error : 'Unknown error';
          setError('Failed to update user role: ' + errorMsg);
        }
      } catch (updateError) {
        console.error('Error in setUserRole function:', updateError);
        setError('Failed to update user role: ' + updateError.message);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Error updating role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organization-management">
      <h2>Organization Management</h2>
      {error && <div className="error-message">{error}</div>}
      
      {/* Loading indicator */}
      {loading && <div className="loading">Loading...</div>}
      
      <div className="org-management-container">
        <div className="org-list">
          <h3>Organizations</h3>
          {organizations.length > 0 ? (
            <ul>
              {organizations.map(org => (
                <li 
                  key={org.id} 
                  className={activeOrg?.id === org.id ? 'active' : ''}
                  onClick={() => handleSelectOrg(org.id)}
                >
                  {org.name || 'Unnamed Organization'}
                </li>
              ))}
            </ul>
          ) : (
            <p>No organizations found.</p>
          )}
          
          {(isAdmin || userRole === 'leader') && (
            <button 
              onClick={() => setShowNewOrgForm(!showNewOrgForm)}
              className="create-org-btn"
            >
              {showNewOrgForm ? 'Cancel' : 'Create New Organization'}
            </button>
          )}
          
          {showNewOrgForm && (
            <form onSubmit={handleCreateOrg} className="org-form">
              <div className="form-group">
                <label htmlFor="orgName">Organization Name:</label>
                <input
                  type="text"
                  id="orgName"
                  value={newOrgData.name}
                  onChange={e => setNewOrgData({...newOrgData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="orgDescription">Description:</label>
                <textarea
                  id="orgDescription"
                  value={newOrgData.description}
                  onChange={e => setNewOrgData({...newOrgData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <button type="submit" disabled={loading}>
                Create Organization
              </button>
            </form>
          )}
        </div>
        
        {activeOrg && (
          <div className="org-details">
            <h3>{activeOrg.name}</h3>
            <div className="org-info">
              <div className="org-metadata">
                <p>{activeOrg.description || 'No description provided'}</p>
                <p><strong>Created:</strong> {new Date(activeOrg.createdAt).toLocaleDateString()}</p>
                <p><strong>Members:</strong> {orgMembers.length}</p>
                
                <div className="org-actions">
                  {canAddUsers && (
                    <button 
                      onClick={() => setShowAddUserForm(!showAddUserForm)}
                      className="add-user-btn"
                    >
                      {showAddUserForm ? 'Cancel' : 'Add New User'}
                    </button>
                  )}
                </div>
                
                {showAddUserForm && (
                  <form onSubmit={handleCreateUser} className="user-form">
                    <h4>Create New User</h4>
                    <div className="form-group">
                      <label htmlFor="userName">Name:</label>
                      <input
                        type="text"
                        id="userName"
                        value={newUserData.name}
                        onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="userEmail">Email:</label>
                      <input
                        type="email"
                        id="userEmail"
                        value={newUserData.email}
                        onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="userPassword">Password:</label>
                      <input
                        type="password"
                        id="userPassword"
                        value={newUserData.password}
                        onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="userRole">Role:</label>
                      <select
                        id="userRole"
                        value={newUserData.role}
                        onChange={e => setNewUserData({...newUserData, role: e.target.value})}
                      >
                        <option value="user">User</option>
                        {isAdmin && <option value="leader">Leader</option>}
                        {isAdmin && <option value="admin">Admin</option>}
                      </select>
                    </div>
                    
                    <button type="submit" disabled={loading}>
                      Create User
                    </button>
                  </form>
                )}
                
                {availableUsers.length > 0 && (
                  <form onSubmit={handleAddExistingUser} className="existing-user-form">
                    <h4>Add Existing User</h4>
                    <div className="form-group">
                      <label htmlFor="existingUser">Select User:</label>
                      <select
                        id="existingUser"
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        required
                      >
                        <option value="">-- Select User --</option>
                        {availableUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button type="submit" disabled={loading || !selectedUserId}>
                      Add to Organization
                    </button>
                  </form>
                )}
              </div>
              
              <div className="member-list">
                <h4>Members</h4>
                {orgMembers.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgMembers.map(member => (
                        <tr key={member.id}>
                          <td>{member.name || 'N/A'}</td>
                          <td>{member.email || 'No email'}</td>
                          <td>
                            {(isAdmin || (userRole === 'leader' && member.role !== 'leader')) ? (
                              <div className="role-selector">
                                <select
                                  value={member.role || 'user'}
                                  onChange={e => handleUpdateUserRole(member.id, e.target.value)}
                                  disabled={loading}
                                >
                                  <option value="user">User</option>
                                  {isAdmin && <option value="leader">Leader</option>}
                                  {isAdmin && <option value="admin">Admin</option>}
                                </select>
                              </div>
                            ) : (
                              <span className={`role-badge ${member.role || 'user'}`}>
                                {member.role || 'User'}
                              </span>
                            )}
                          </td>
                          <td>
                            {(isAdmin || (userRole === 'leader' && member.role !== 'leader')) && (
                              <button
                                onClick={() => handleRemoveUser(member.id, member.name, member.role)}
                                className="remove-user-btn"
                                disabled={loading}
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No members in this organization.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationManagement;
