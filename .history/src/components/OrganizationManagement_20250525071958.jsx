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
  getUserRole 
} from '../utils/auth';
import { getSuccessFromResult, getErrorFromResult } from '../utils/compatHelpers';
import { db, auth } from '../utils/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import './OrganizationManagement.css';
import './OrganizationManagementEnhanced.css';

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
    loadOrganizations();
    checkUserPermissions();
  }, []);

  const checkUserPermissions = async () => {
    try {
      setLoading(true);
      const admin = await isUserAdmin();
      const role = await getUserRole();
      setIsAdmin(admin);
      setUserRole(role);
      console.log('User permissions checked:', { isAdmin: admin, role });
    } catch (error) {
      console.error('Error checking user permissions:', error);
      setError('Failed to check user permissions');
    } finally {
      setLoading(false);
    }
  };  const loadOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching organizations...');
      const orgs = await getOrganizations();
      console.log('Organizations fetched:', orgs.length);
      console.log('Organization data:', orgs);
      setOrganizations(orgs);
      
      if (orgs && orgs.length > 0 && !activeOrg) {
        console.log('Auto-selecting first organization:', orgs[0].id);
        await handleSelectOrg(orgs[0].id);
      } else if (orgs.length === 0) {
        console.log('No organizations found or user lacks permissions');
        setOrgMembers([]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      setError(`Failed to load organizations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };  const handleSelectOrg = async (orgId) => {
    if (!orgId) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Loading organization details for:', orgId);
      
      const orgDetails = await getOrganizationWithMembers(orgId);
      console.log('Org details loaded:', orgDetails);
      
      if (orgDetails) {
        setActiveOrg(orgDetails);
        
        if (orgDetails.members && orgDetails.members.length > 0) {
          console.log('Members found:', orgDetails.members.length);
          console.log('Members with roles:', orgDetails.members.map(m => ({ id: m.id, name: m.name, role: m.role })));
          setOrgMembers(orgDetails.members);
        } else {
          console.log('No members found in this organization');
          setOrgMembers([]);
        }
      } else {
        console.error('Failed to load organization details');
        setError('Failed to load organization details');
        setOrgMembers([]);
      }
      
      await loadAvailableUsers(orgId);
    } catch (error) {
      console.error('Error loading organization details:', error);
      setError('Failed to load organization details. Please try again.');
      setOrgMembers([]);
    } finally {
      setLoading(false);
    }
  };
    const loadAvailableUsers = async (orgId) => {
    if (!orgId) orgId = activeOrg?.id;
    if (!orgId) return;
    
    try {
      console.log('Loading available users (not in current org)...');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out users already in this organization
      const availUsers = allUsers.filter(user => {
        return !user.organizationId || user.organizationId !== orgId;
      });
      
      console.log(`Found ${availUsers.length} available users`);
      setAvailableUsers(availUsers);
    } catch (error) {
      console.error('Error loading available users:', error);
      setError('Failed to load available users');
    }
  };  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!newOrgData.name.trim()) {
        setError('Organization name is required');
        setLoading(false);
        return;
      }
      
      console.log('Creating organization with data:', newOrgData);
      const orgId = await createOrganization(newOrgData);
      console.log('Organization created with ID:', orgId);
      
      if (orgId) {
        // Reset form
        setShowNewOrgForm(false);
        setNewOrgData({
          name: '',
          description: ''
        });
        
        await loadOrganizations();
        
        console.log('Selecting newly created organization:', orgId);
        await handleSelectOrg(orgId);
      } else {
        console.error('Failed to create organization - no ID returned');
        setError('Failed to create organization. Please make sure you have admin permissions.');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      setError(`Error creating organization: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!activeOrg) {
      setError('No organization selected');
      return;
    }
    
    if (userRole === 'leader') {
      setError('Leaders cannot add new members to organizations');
      return;
    }
    
    // Validate form
    if (!newUserData.name.trim() || !newUserData.email.trim() || !newUserData.password.trim()) {
      setError('All fields are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('Creating new user:', newUserData.email);
      const userId = await createUserInOrganization(
        newUserData,
        activeOrg.id,
        newUserData.role
      );
      
      if (userId) {
        console.log('User created successfully with ID:', userId);
        // Refresh org members
        await handleSelectOrg(activeOrg.id);
        setShowAddUserForm(false);
        setNewUserData({
          name: '',
          email: '',
          password: '',
          role: 'user'
        });
      } else {
        setError('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError(`Failed to create user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleAddExistingUser = async () => {
    if (!selectedUserId || !activeOrg) return;
    
    if (userRole === 'leader') {
      alert('Leaders cannot add new members to organizations.');
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Adding existing user ${selectedUserId} to organization ${activeOrg.id}`);
      
      const userRef = doc(db, 'users', selectedUserId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error(`User with ID ${selectedUserId} not found in database`);
        alert('Selected user could not be found in the database. Please refresh the page and try again.');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      console.log(`User data:`, userData);
      
      const success = await addUserToOrganization(
        selectedUserId,
        activeOrg.id,
        'user' 
      );
      
      if (success) {
        console.log(`Successfully added user ${selectedUserId} to organization ${activeOrg.id}`);
        alert('User was successfully added to the organization');
        
        // Refresh org members
        await handleSelectOrg(activeOrg.id);
        setSelectedUserId('');
        
        // Also refresh available users list
        await loadAvailableUsers();
      } else {
        console.error('Failed to add user to organization');
        alert('Failed to add user to organization. Please try again.');
      }
    } catch (error) {
      console.error('Error adding user to organization:', error);
      alert(`Failed to add user to organization: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
    const handleRemoveUser = async (userId) => {
    if (!activeOrg) return;
    
    // Find the member to check their role
    const member = orgMembers.find(m => m.id === userId);
    
    // Leaders cannot remove other leaders
    if (userRole === 'leader' && member?.role === 'leader') {
      alert('Leaders cannot remove other leaders from the organization.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to remove this user from the organization?')) {
      return;
    }
    
    setLoading(true);
    try {
      const success = await removeUserFromOrganization(userId, activeOrg.id);
      
      if (success) {
        // Refresh org members
        await handleSelectOrg(activeOrg.id);
      }
    } catch (error) {
      console.error('Error removing user from organization:', error);
      alert('Failed to remove user from organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };  const handleChangeUserRole = async (userId, newRole) => {
    if (!activeOrg) return;
    
    setLoading(true);
    try {
      console.log(`Changing role for user ${userId} to ${newRole}`);
      console.log(`Organization ID: ${activeOrg.id}`);
      
      const memberToUpdate = orgMembers.find(member => member.id === userId);
      
      if (!memberToUpdate) {
        console.error(`Member with ID ${userId} not found in local state`);
        console.log('Available members:', orgMembers.map(m => ({ id: m.id, email: m.email, role: m.role })));
        alert('User not found. Please refresh the page and try again.');
        setLoading(false);
        return;
      }
      
      console.log('Member data being updated:', memberToUpdate);
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error(`User document with ID ${userId} not found in Firestore`);
        alert('User not found in the database. Please refresh the page and try again.');
        setLoading(false);
        return;
      }
      
      const currentUserRole = await getUserRole();
      console.log(`Current user's role: ${currentUserRole}`);
      
      // First call the API to update the role
      const result = await setUserRole(userId, newRole, activeOrg.id);
      
      if (getSuccessFromResult(result)) {
        console.log(`User role updated successfully to ${newRole}`);
        
        // Only update local state after the API call succeeds
        setOrgMembers(prevMembers => 
          prevMembers.map(member => 
            member.id === userId ? {...member, role: newRole} : member
          )
        );
        
        // Refresh data from server to ensure consistency
        setTimeout(() => {
          handleSelectOrg(activeOrg.id);
        }, 500);
      } else {
        const errorMsg = getErrorFromResult(result, 'Failed to update user role. Please try again.');
        console.error('setUserRole failed:', errorMsg);
        alert(errorMsg);
        
        // Refresh from server to reset UI state
        await handleSelectOrg(activeOrg.id);
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      alert(`Failed to update user role: ${error.message}`);

      // Refresh from server to reset UI state
      await handleSelectOrg(activeOrg.id);
    } finally {
      setLoading(false);
    }
  };
    return (
    <div className="organization-management">
      <div className="org-header">
        <h3>Organization Management</h3>
        {isAdmin && (
          <button 
            className="add-org-btn" 
            onClick={() => setShowNewOrgForm(true)}
          >
            Add Organization
          </button>
        )}
      </div>

      {loading && <div className="loading">Loading...</div>}
      
      <div className="org-container">
        <div className="org-list">
          <h4>Organizations {organizations.length > 0 ? `(${organizations.length})` : ''}</h4>
          {organizations.length === 0 ? (
            <div className="no-orgs">
              <p>No organizations found.</p>
              <p className="hint-text">Click "Add Organization" to create one.</p>
            </div>
          ) : (
            <ul className="org-items">
              {organizations.map(org => (
                <li 
                  key={org.id} 
                  className={`org-item ${activeOrg?.id === org.id ? 'active' : ''}`}
                  onClick={() => handleSelectOrg(org.id)}
                >
                  <span className="org-name">{org.name || 'Unnamed Organization'}</span>
                  {org.description && <span className="org-desc">{org.description}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>          <div className="org-details">
          {loading && <div className="loading">Loading organization details...</div>}
          
          {!loading && !activeOrg && (
            <div className="no-org-selected">
              <h4>No Organization Selected</h4>
              <p>Select an organization from the list or create a new one to manage its members.</p>
            </div>
          )}
          
          {!loading && activeOrg && (
            <>
              <div className="org-info">
                <h4>{activeOrg.name}</h4>
                <p>{activeOrg.description || 'No description provided'}</p>
                <p><strong>Created:</strong> {new Date(activeOrg.createdAt).toLocaleDateString()}</p>
              </div>
                <div className="org-members">
                  <div className="members-header">
                  <h4>Members ({orgMembers.length})</h4>
                  {isAdmin && userRole !== 'leader' && (
                    <button 
                      className="add-user-btn"
                      onClick={() => setShowAddUserForm(true)}
                    >
                      Add New User
                    </button>
                  )}
                </div>
                
                <div className="existing-users">
                  {isAdmin && userRole !== 'leader' && (
                    <>
                      <select 
                        value={selectedUserId} 
                        onChange={(e) => setSelectedUserId(e.target.value)}
                      >
                        <option value="">-- Select Existing User --</option>
                        {availableUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email} ({user.email})
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={handleAddExistingUser} 
                        disabled={!selectedUserId}
                        className="add-existing-btn"
                      >
                        Add to Organization
                      </button>
                    </>
                  )}
                </div>
                
                {orgMembers.length > 0 ? (
                  <table className="members-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>                      {orgMembers.map(member => (
                        <tr key={member.id}>
                          <td>{member.name || 'N/A'}</td>
                          <td>{member.email}</td>
                          <td>
                            {/* show the role badge */}
                            <div className="role-display">
                              {member.role === 'leader' ? (
                                <span className="role-badge leader">Leader</span>
                              ) : (
                                <span className="role-badge user">User</span>
                              )}
                              
                              {/* Only show role  for admins */}
                              {isAdmin && (
                                <select 
                                  value={member.role}
                                  onChange={(e) => handleChangeUserRole(member.id, e.target.value)}
                                  className="role-selector"
                                >
                                  <option value="user">User</option>
                                  <option value="leader">Leader</option>
                                </select>
                              )}
                            </div>
                          </td>                          <td>
                            <button 
                              className="remove-user-btn"
                              onClick={() => handleRemoveUser(member.id)}
                              disabled={userRole === 'leader' && member.role === 'leader'}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No members in this organization.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* New Organization Modal */}
      {showNewOrgForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Organization</h3>
            <form onSubmit={handleCreateOrg}>
              <div className="form-group">
                <label>Organization Name</label>
                <input 
                  type="text" 
                  value={newOrgData.name} 
                  onChange={(e) => setNewOrgData({...newOrgData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={newOrgData.description} 
                  onChange={(e) => setNewOrgData({...newOrgData, description: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowNewOrgForm(false)}>Cancel</button>
                <button type="submit" disabled={loading}>Create Organization</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddUserForm && isAdmin && userRole !== 'leader' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add User to {activeOrg?.name}</h3>
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
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={newUserData.role} 
                  onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                  disabled={userRole === 'leader'}
                >
                  <option value="user">User</option>
                  <option value="leader">Leader</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddUserForm(false)}>Cancel</button>
                <button type="submit" disabled={loading}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
