import React, { useState, useEffect } from 'react';
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
  getAllUsers
} from '../utils/auth';
import { testFirestoreConnection, addDebuggingButton } from '../utils/dbDebug';
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
  const [newOrgData, setNewOrgData] = useState({ name: '', description: '' });
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'user' });
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
      } catch (error) {
        setIsAdmin(false);
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
        setUserRole(result.role || 'user');
        setCanManageOrg(result.role === 'admin' || result.role === 'leader');
        setCanAddUsers(result.role === 'admin' || result.role === 'leader');
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
      if (!isAdmin && userRole !== 'leader') {
        setError('You do not have permission to update user roles');
        return;
      }
      if (userRole === 'leader' && (newRole === 'leader' || newRole === 'admin')) {
        setError('Leaders can only assign the user role');
        return;
      }
      setLoading(true);
      setError(null);
      // setUserRole is not imported, so this should be handled in the backend or utils/auth
      if (typeof window.setUserRole === 'function') {
        const result = await window.setUserRole(userId, newRole, activeOrg.id);
        if (result && result.success) {
          await handleSelectOrg(activeOrg.id);
        } else {
          setError('Failed to update user role: ' + (result && result.error ? result.error : 'Unknown error'));
        }
      } else {
        setError('Role update function not available');
      }
    } catch (error) {
      setError('Error updating role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organization-management">
      <h2>Organization Management</h2>
      {error && (
        <div className="error-message">
          {error}
          {error.includes('Failed to update user role') && (
            <button 
              onClick={() => {
                setError(null);
                testFirestoreConnection()
                  .then(connected => {
                    if (connected) {
                      alert('Database connection is working. You can try again.');
                    } else {
                      alert('Database connection issue detected. Please check your internet connection.');
                    }
                  });
              }}
              className="retry-btn"
              style={{marginLeft: '10px'}}
            >
              Check Connection
            </button>
          )}
        </div>
      )}
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
