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
  refreshUserPermissions
} from '../utils/auth';
import { getSuccessFromResult, getErrorFromResult } from '../utils/compatHelpers';
import { db, auth } from '../utils/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import './OrganizationManagement.css';
import './OrganizationManagementEnhanced.css';
import './RoleUpdateStyles.css';

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
      const result = await refreshUserPermissions();
      
      if (result.success) {
        setIsAdmin(result.isAdmin);
        setUserRole(result.role);
        console.log('User permissions refreshed:', { 
          isAdmin: result.isAdmin, 
          role: result.role,
          organizationId: result.organizationId
        });
      } else {
        // Fallback to old method if refresh fails
        const admin = await isUserAdmin();
        const role = await getUserRole();
        setIsAdmin(admin);
        setUserRole(role);
        console.log('User permissions checked (fallback):', { isAdmin: admin, role });
      }
    } catch (error) {
      console.error('Error checking user permissions:', error);
      setError('Failed to check user permissions');
    } finally {
      setLoading(false);
    }
  };const loadOrganizations = async () => {
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
    
    // Leaders can now create users in their organization
    const canCreateUser = userRole === 'admin' || userRole === 'leader';
    if (!canCreateUser) {
      setError('You don\'t have permission to add new members to organizations');
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
  };const handleAddExistingUser = async () => {
    if (!selectedUserId || !activeOrg) {
      setError('Please select a user and organization');
      return;
    }
    
    // Leaders can now add users to their organization
    const canAddUser = userRole === 'admin' || userRole === 'leader';
    if (!canAddUser) {
      setError('You don\'t have permission to add users to this organization');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log(`Adding existing user ${selectedUserId} to organization ${activeOrg.id}`);
      
      const userRef = doc(db, 'users', selectedUserId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error(`User with ID ${selectedUserId} not found in database`);
        setError('Selected user could not be found in the database');
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
        
        // Refresh org members
        await handleSelectOrg(activeOrg.id);
        setSelectedUserId('');
        
        // Also refresh available users list
        await loadAvailableUsers();
      } else {
        console.error('Failed to add user to organization');
        setError('Failed to add user to organization. Please try again.');
      }
    } catch (error) {
      console.error('Error adding user to organization:', error);
      setError(`Failed to add user to organization: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };const handleRemoveUser = async (userId) => {
    if (!activeOrg) {
      setError('No organization selected');
      return;
    }
    
    // Find the member to check their role
    const member = orgMembers.find(m => m.id === userId);
    if (!member) {
      setError('User not found in this organization');
      return;
    }
    
    // Leaders cannot remove other leaders
    if (userRole === 'leader' && member.role === 'leader') {
      setError('Leaders cannot remove other leaders from the organization');
      return;
    }
    
    if (!window.confirm('Are you sure you want to remove this user from the organization?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log(`Removing user ${userId} from organization ${activeOrg.id}`);
      const success = await removeUserFromOrganization(userId, activeOrg.id);
      
      if (success) {
        console.log('User successfully removed from organization');
        // Refresh org members
        await handleSelectOrg(activeOrg.id);
      } else {
        setError('Failed to remove user from organization');
      }
    } catch (error) {
      console.error('Error removing user from organization:', error);
      setError('Failed to remove user from organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };  const handleChangeUserRole = async (userId, newRole) => {
    if (!activeOrg) {
      setError('No organization selected');
      return;
    }
    
    // Check if the role is actually changing
    const memberToUpdate = orgMembers.find(member => member.id === userId);
    if (!memberToUpdate) {
      setError('User not found in organization');
      return;
    }

    // Don't do anything if the role is the same
    if (memberToUpdate.role === newRole) {
      console.log(`User already has role ${newRole}, no change needed`);
      return;
    }
    
    // Clear previous errors
    setError(null);
    
    // Show a specific loading state for this operation
    setLoading(true);
    
    // Update UI immediately to show change is in progress
    setOrgMembers(prevMembers => 
      prevMembers.map(member => 
        member.id === userId ? {...member, roleUpdating: true} : member
      )
    );
    
    try {
      console.log(`Changing role for user ${userId} from ${memberToUpdate.role} to ${newRole}`);
      console.log(`Organization ID: ${activeOrg.id}`);
      
      // Verify user exists in database
      const userRef = doc(db, 'users', userId);
      let userDoc;
      
      try {
        userDoc = await getDoc(userRef);
      } catch (fetchError) {
        throw new Error(`Error fetching user document: ${fetchError.message}`);
      }
      
      if (!userDoc.exists()) {
        console.error(`User document with ID ${userId} not found in Firestore`);
        setError('User not found in the database');
        
        // Reset UI state
        setOrgMembers(prevMembers => 
          prevMembers.map(member => 
            member.id === userId ? {...member, roleUpdating: false} : member
          )
        );
        return;
      }
      
      // Special handling for promotion to leader role
      let isLeaderPromotion = newRole === 'leader' && memberToUpdate.role !== 'leader';
      
      // First ensure any existing permissions are properly refreshed
      if (!isLeaderPromotion) {
        await refreshUserPermissions(userId);
      }
      
      // Then attempt to set the new role
      const result = await setUserRole(userId, newRole, activeOrg.id);
      
      console.log('setUserRole result:', result);
      
      if (getSuccessFromResult(result)) {
        console.log(`User role updated successfully to ${newRole}`);
        
        // Additional handling for leader promotions
        if (isLeaderPromotion) {
          try {
            console.log('Special handling for leader promotion...');
            
            // First force refresh to ensure DB consistency
            const refreshResult = await refreshUserPermissions(userId);
            console.log('Initial refresh result after promotion:', refreshResult);
            
            // Double-check that the user actually appears in the leaders array
            const orgRef = doc(db, 'organizations', activeOrg.id);
            const orgDoc = await getDoc(orgRef);
            
            if (orgDoc.exists()) {
              const orgData = orgDoc.data();
              const leaders = Array.isArray(orgData.leaders) ? orgData.leaders : [];
              
              if (!leaders.includes(userId)) {
                console.log('Leader promotion issue detected! User not found in leaders array');
                console.log('Attempting to fix by directly updating organization document...');
                
                // Fix by directly adding to leaders array
                await setDoc(orgRef, {
                  leaders: [...leaders, userId],
                  updatedAt: new Date().toISOString()
                }, { merge: true });
                
                // Refresh again after the fix
                await refreshUserPermissions(userId);
              } else {
                console.log('User properly added to leaders array');
              }
            }
          } catch (leaderPromotionError) {
            console.error('Error during leader promotion special handling:', leaderPromotionError);
            // Continue despite this error
          }
        } else {
          // Standard refresh for non-leader role changes
          await refreshUserPermissions(userId);
        }
        
        // If the current user is the one being updated, refresh their permissions
        if (userId === auth.currentUser?.uid) {
          console.log('Current user role changed, refreshing permissions...');
          // Add a delay to ensure Firebase has time to update
          setTimeout(async () => {
            // Use our refreshUserPermissions function for more thorough refresh
            const refreshResult = await refreshUserPermissions();
            if (refreshResult.success) {
              console.log('User permissions refreshed after role change:', refreshResult);
              setUserRole(refreshResult.role);
              setIsAdmin(refreshResult.isAdmin);
            } else {
              await checkUserPermissions();
            }
            
            // Force reload to ensure all UI and permissions are properly refreshed
            alert(`Your role has been changed to ${newRole}. The page will now reload to apply your new permissions.`);
            window.location.reload();
          }, 1000);
        } else {
          // Update local state with the new role
          setOrgMembers(prevMembers => 
            prevMembers.map(member => 
              member.id === userId ? {...member, role: newRole, roleUpdating: false} : member
            )
          );
          
          // Force a refresh from server to ensure UI shows correct permissions
          setTimeout(() => {
            handleSelectOrg(activeOrg.id);
          }, 500);
        }
      } else {
        const errorMsg = getErrorFromResult(result, 'Failed to update user role');
        console.error('setUserRole failed:', errorMsg);
        setError(errorMsg);
        
        // Reset UI state for the user row
        setOrgMembers(prevMembers => 
          prevMembers.map(member => 
            member.id === userId ? {...member, roleUpdating: false} : member
          )
        );
        
        // Add a short delay before refreshing from server to avoid race conditions
        setTimeout(async () => {
          await handleSelectOrg(activeOrg.id);
        }, 800);
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      setError(`Failed to update user role: ${error.message}`);
      
      // Reset UI state for the user row
      setOrgMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === userId ? {...member, roleUpdating: false} : member
        )
      );
      
      // Add a short delay before refreshing from server to avoid race conditions
      setTimeout(async () => {
        await handleSelectOrg(activeOrg.id);
      }, 800);
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
            disabled={loading}
          >
            Add Organization
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {loading && <div className="loading">Loading...</div>}
      
      {/* Error message */}
      {error && <div className="error-message">{error}</div>}
      
      <div className="org-container">
        <div className="org-list">
          <h4>Organizations {organizations.length > 0 ? `(${organizations.length})` : ''}</h4>
          {organizations.length === 0 ? (
            <div className="no-orgs">
              <p>No organizations found.</p>
              {isAdmin && (
                <p className="hint-text">Click "Add Organization" to create one.</p>
              )}
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
                <div className="org-members">                <div className="members-header">
                  <h4>Members ({orgMembers.length})</h4>
                  {(isAdmin || userRole === 'leader') && (
                    <button 
                      className="add-user-btn"
                      onClick={() => setShowAddUserForm(true)}
                      disabled={loading}
                    >
                      Add New User
                    </button>
                  )}
                </div>
                
                <div className="existing-users">
                  {(isAdmin || userRole === 'leader') && (
                    <>
                      <select 
                        value={selectedUserId} 
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        disabled={loading || availableUsers.length === 0}
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
                              )}                                {/* Only show role selector for admins and leaders */}
                              {(isAdmin || userRole === 'leader') && (
                                <div className="role-selector-container">
                                  <select 
                                    value={member.role}
                                    onChange={(e) => handleChangeUserRole(member.id, e.target.value)}
                                    className="role-selector"
                                    disabled={loading || (userRole === 'leader' && member.role === 'leader')}
                                  >
                                    <option value="user">User</option>
                                    {/* Only admins can promote to leader */}
                                    {isAdmin && <option value="leader">Leader</option>}
                                  </select>
                                  {member.roleUpdating && (
                                    <span className="role-updating">
                                      <span className="spinner"></span> Updating...
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>                          <td>
                            <button 
                              className="remove-user-btn"
                              onClick={() => handleRemoveUser(member.id)}
                              disabled={loading || (userRole === 'leader' && member.role === 'leader')}
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
      {showAddUserForm && (isAdmin || userRole === 'leader') && (
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
                <label>Role</label>                <select 
                  value={newUserData.role} 
                  onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                  disabled={userRole === 'leader'}
                ><option value="user">User</option>
                  {isAdmin && <option value="leader">Leader</option>}
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
