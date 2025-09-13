// Auth utility functions for role-based access control - IMPROVED VERSION
import { auth, db, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from './firebase';

/**
 * Check if the current user has admin privileges based on Firestore role
 * This client-side implementation is compatible with the Spark plan
 * @returns {Promise<boolean>} True if the user has admin privileges
 */
export const isUserAdmin = async () => {
  try {
    if (!auth.currentUser) {
      console.log('No authenticated user');
      return false;
    }
    
    // Get the user document from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('User document does not exist in Firestore');
      return false;
    }
    
    const userData = userDoc.data();
    console.log(`User data retrieved:`, userData);
    
    // Check if the role field is set to 'admin'
    const isAdmin = userData && userData.role === 'admin';
    console.log(`User has admin role: ${isAdmin}`);
    
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    console.error('Error details:', error.message);
    return false; // Don't allow admin access on error
  }
};

/**
 * Check if the current user has leader privileges
 * @returns {Promise<boolean>} True if the user has leader privileges
 */
export const isUserLeader = async () => {
  try {
    if (!auth.currentUser) return false;
    
    // Get the user document from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    console.log('User data for leader check:', userData);
    
    // Check if the role field is set to 'leader'
    const isLeader = userData.role === 'leader';
    console.log('User is leader:', isLeader);
    
    return isLeader;
  } catch (error) {
    console.error('Error checking leader status:', error);
    return false;
  }
};

/**
 * Get the current user's role from Firestore
 * @returns {Promise<string>} The user's role ('admin', 'leader', or 'user')
 */
export const getUserRole = async () => {
  try {
    if (!auth.currentUser) {
      console.log('No current user, returning default role: user');
      return 'user';
    }
    
    // Get the user document from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('User document does not exist, returning default role: user');
      return 'user';
    }
    
    const userData = userDoc.data();
    const role = userData.role || 'user';
    
    console.log(`User role from Firestore: ${role}`);
    
    // Return the role from Firestore or default to 'user'
    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user'; // Default to regular user on error
  }
};

/**
 * Get the organization ID for the current user
 * @returns {Promise<string|null>} The organization ID or null if not in an organization
 */
export const getUserOrganization = async () => {
  try {
    if (!auth.currentUser) return null;
    
    // Get the user document from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return null;
    
    // Return the organization ID from the user document
    return userDoc.data().organizationId || null;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
};

/**
 * Set a role for a user (client-side implementation)
 * Note: This should be protected by Firestore security rules
 * @param {string} userId - The user ID to update
 * @param {string} role - The role to assign ('admin', 'leader', or 'user')
 * @param {string|null} organizationId - The organization ID (required for leaders and users)
 * @returns {Promise<Object>} Result object with success status
 */
export const setUserRole = async (userId, role, organizationId = null) => {
  try {
    if (!auth.currentUser) {
      console.error('No authenticated user found');
      return { success: false, error: 'No authenticated user found' };
    }
    
    if (!userId) {
      console.error('Invalid user ID provided');
      return { success: false, error: 'Invalid user ID provided' };
    }
    
    if (!role || !['admin', 'leader', 'user'].includes(role)) {
      console.error(`Invalid role provided: ${role}`);
      return { success: false, error: `Invalid role: ${role}. Must be 'admin', 'leader', or 'user'` };
    }
    
    console.log(`setUserRole called with userId: ${userId}, role: ${role}, organizationId: ${organizationId}`);
    
    // First check if current user can edit the target user
    const currentUserRole = await getUserRole();
    console.log(`Current user's role: ${currentUserRole}`);
    
    // Check if user has permission to edit users in this organization
    if (role === 'admin') {
      // Only admins can create other admins
      if (currentUserRole !== 'admin') {
        console.error('Only admins can assign admin roles');
        return { success: false, error: 'Only admins can assign admin roles' };
      }
    } else {
      // For leader and user roles, check with the access control system
      const hasAccess = await checkUserAccess('edit_user', organizationId, userId);
      if (!hasAccess && currentUserRole !== 'admin') {
        console.error('You don\'t have permission to edit this user\'s role');
        return { success: false, error: 'You don\'t have permission to edit this user\'s role' };
      }
    }
    }
    
    // Verify the user exists
    const userRef = doc(db, 'users', userId);
    let userDoc;
    
    try {
      userDoc = await getDoc(userRef);
    } catch (fetchError) {
      console.error(`Error fetching user document: ${fetchError.message}`);
      return { success: false, error: `Failed to fetch user document: ${fetchError.message}` };
    }
    
    if (!userDoc.exists()) {
      console.error(`User document with ID ${userId} not found in Firestore`);
      return { success: false, error: `User with ID ${userId} not found` };
    }
    
    console.log(`Found user document: ${userDoc.id}`);
    const userData = userDoc.data();
    const oldRole = userData.role || 'user';
    
    // If role is not changing, return early with success
    if (oldRole === role) {
      console.log(`User already has role ${role}, no change needed`);
      return { success: true, message: 'No change needed - user already has this role' };
    }
    
    // Update data to set
    const updateData = {
      role: role,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    };
    
    // Add organization ID if provided
    if (organizationId) {
      updateData.organizationId = organizationId;
    } else if (role !== 'admin') {
      // Non-admins must be part of an organization
      console.error('Organization ID is required for leaders and users');
      return { success: false, error: 'Organization ID is required for leaders and users' };
    }
    
    console.log(`Updating user ${userId} with data:`, updateData);
      try {
      // Update the user's role in Firestore users collection
      await setDoc(userRef, updateData, { merge: true });
      console.log(`Successfully updated user role in users collection`);
    } catch (userError) {
      console.error(`Error updating user document: ${userError.message}`);
      return { success: false, error: `Error updating user document: ${userError.message}` };
    }
    
    // Also update the user's role in the organization's members collection
    if (organizationId) {
      try {
        console.log(`Updating user role in organization members collection: ${organizationId}/members/${userId}`);
        
        // First check if the member exists in the org's members collection
        const orgMemberRef = doc(db, 'organizations', organizationId, 'members', userId);
        const memberDoc = await getDoc(orgMemberRef);
        
        const memberUpdateData = {
          role: role,
          updatedAt: new Date().toISOString(),
          userId: userId // Make sure this field exists for indexing
        };
        
        // If member doesn't exist in org, add additional required fields
        if (!memberDoc.exists()) {
          console.log(`Member ${userId} does not exist in organization, creating entry`);
          memberUpdateData.userId = userId;
          memberUpdateData.addedAt = new Date().toISOString();
          memberUpdateData.addedBy = auth.currentUser.uid;
          memberUpdateData.email = userData.email;
          memberUpdateData.name = userData.name || userData.email?.split('@')[0] || 'Unknown User';
        } else {
          console.log(`Existing member found, updating role from ${memberDoc.data().role || 'unknown'} to ${role}`);
        }
        
        // Update or create the member document
        await setDoc(orgMemberRef, memberUpdateData, { merge: true });
        console.log(`Successfully updated member role in organization`);
        
        // Update the organizations collection to track leaders
        try {
          const orgRef = doc(db, 'organizations', organizationId);
          const orgDoc = await getDoc(orgRef);
          
          if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            const leaders = orgData.leaders || [];
            
            // Handle role changes for leaders list in organization document
            if (role === 'leader' && !leaders.includes(userId)) {
              // Promotion to leader - add to leaders array
              console.log(`Adding ${userId} to leaders list in organization document`);
              await setDoc(orgRef, {
                leaders: [...leaders, userId],
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } else if (oldRole === 'leader' && role !== 'leader' && leaders.includes(userId)) {
              // Demotion from leader - remove from leaders array
              console.log(`Removing ${userId} from leaders list in organization document`);
              await setDoc(orgRef, {
                leaders: leaders.filter(id => id !== userId),
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          } else {
            console.error(`Organization ${organizationId} document does not exist`);
          }
        } catch (leaderUpdateError) {        console.error(`Error updating organization leaders array: ${leaderUpdateError.message}`);
          // Continue despite error - don't fail the entire operation
        }
      } catch (orgError) {
        console.error(`Error updating organization member role: ${orgError.message}`);
        // Log but don't fail the entire operation if just the org member update fails
        // since we've already updated the user's main document
      }
    }
    
    try {
      // Create an audit log entry
      const auditRef = doc(db, 'audit_logs', `role_change_${Date.now()}`);
      await setDoc(auditRef, {
        action: 'role_change',
        targetUser: userId,
        newRole: role,
        oldRole: oldRole,
        organizationId: organizationId,
        performedBy: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Role change audit log created`);
    } catch (auditError) {
      console.error(`Error creating audit log: ${auditError.message}`);
      // Don't fail the operation just because audit logging failed
    }    // Refresh permissions to ensure consistency across collections with retry
    try {
      console.log(`Refreshing permissions for user ${userId} after role change`);
      const refreshResult = await refreshUserPermissions(userId);
      
      if (!refreshResult.success) {
        console.warn(`Initial permission refresh failed, retrying once...`);
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryResult = await refreshUserPermissions(userId);
        
        if (!retryResult.success) {
          console.warn(`Retry also failed: ${retryResult.error}. Attempting targeted role consistency check.`);
          
          // Additional targeted fix for leaders
          if (role === 'leader') {
            try {
              // Ensure user appears in the organization's leaders array
              const orgRef = doc(db, 'organizations', organizationId);
              const orgDoc = await getDoc(orgRef);
              
              if (orgDoc.exists()) {
                const orgData = orgDoc.data();
                const leaders = orgData.leaders || [];
                
                if (!leaders.includes(userId)) {
                  console.log(`Final attempt: Adding ${userId} to leaders array in organization`);
                  await setDoc(orgRef, {
                    leaders: [...leaders, userId],
                    updatedAt: new Date().toISOString()
                  }, { merge: true });
                }
              }
            } catch (finalFixError) {
              console.error(`Error in final leaders array fix attempt: ${finalFixError.message}`);
            }
          }
        } else {
          console.log(`Permission refresh retry succeeded`);
        }
      } else {
        console.log(`Permission refresh succeeded on first attempt`);
      }
    } catch (refreshError) {
      console.error(`Error during permission refresh: ${refreshError.message}`);
      // Don't fail the operation just because refresh failed - the role change itself was successful
    }
    
    console.log(`Role change operation completed successfully for user ${userId} to role ${role}`);
    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    console.error(`Error details: ${error.message}`);
    return { success: false, error: `Error setting user role: ${error.message}` };
  }
};

/**
 * Set admin role for a user (for backward compatibility)
 * @param {string} userId - The user ID to grant admin access to
 * @returns {Promise<boolean>} Success status
 */
export const setAdminRole = async (userId) => {
  const result = await setUserRole(userId, 'admin');
  // Handle the result which could be either an object with success property or a boolean
  return result && typeof result === 'object' ? result.success : result;
};

/**
 * Create a new organization
 * @param {Object} orgData - The organization data
 * @returns {Promise<string|null>} The organization ID if successful, null otherwise
 */
export const createOrganization = async (orgData) => {
  try {
    if (!auth.currentUser) {
      console.error('No authenticated user found');
      alert('You must be signed in to create an organization');
      return null;
    }
    
    // Check if the current user has admin privileges
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      console.error('Only admins can create organizations');
      alert('Only administrators can create organizations');
      return null;
    }
    
    // Generate a unique ID for the organization
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Creating organization with ID: ${orgId}`);
    
    // Create the organization document with mandatory fields
    const orgDoc = {
      ...orgData,
      id: orgId,
      name: orgData.name || 'New Organization',
      description: orgData.description || '',
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser.uid,
      members: [],
      status: 'active'
    };
    
    try {
      // Create the organization document
      const orgRef = doc(db, 'organizations', orgId);
      console.log('Writing organization to Firestore:', orgDoc);
      await setDoc(orgRef, orgDoc);
      
      // Create an audit log entry
      const auditRef = doc(db, 'audit_logs', `org_create_${Date.now()}`);
      await setDoc(auditRef, {
        action: 'organization_create',
        organizationId: orgId,
        organizationName: orgData.name || 'New Organization',
        performedBy: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      });
      
      console.log('Organization created successfully with ID:', orgId);
      return orgId;
    } catch (firestoreError) {
      console.error('Firestore error creating organization:', firestoreError);
      if (firestoreError.code === 'permission-denied') {
        alert('Permission denied: Ensure your account has admin privileges and check Firestore rules');
      } else {
        alert(`Error creating organization: ${firestoreError.message}`);
      }
      return null;
    }
  } catch (error) {
    console.error('Error creating organization:', error);
    alert(`Unexpected error: ${error.message}`);
    return null;
  }
};

/**
 * Add a user to an organization
 * @param {string} userId - The user ID to add to the organization
 * @param {string} organizationId - The organization ID
 * @param {string} role - The role to assign ('leader' or 'user')
 * @returns {Promise<boolean>} Success status
 */
export const addUserToOrganization = async (userId, organizationId, role = 'user') => {
  try {
    if (!auth.currentUser) return false;
<<<<<<< HEAD
      // Determine if current user can add users to this organization
    const currentUserRole = await getUserRole();
    const currentUserOrgId = await getUserOrganization();
=======
>>>>>>> 0f11832e241997d17f6aea3dcae050a42dc0c9c9
    
    console.log(`Adding user ${userId} to organization ${organizationId} with role ${role}`);
    
<<<<<<< HEAD
    // Admins can add users to any organization
    // Leaders can add users to their own organization
    const canAddUser = currentUserRole === 'admin' || 
      (currentUserRole === 'leader' && currentUserOrgId === organizationId);
=======
    // Check if user has permission to add users to this organization
    const hasAccess = await checkUserAccess('add_user', organizationId);
>>>>>>> 0f11832e241997d17f6aea3dcae050a42dc0c9c9
    
    if (!hasAccess) {
      console.error('You don\'t have permission to add users to this organization');
      alert('Permission denied: Only administrators and leaders can add users to organizations');
      return false;
    }
    
    // Verify the user exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`User document with ID ${userId} not found in Firestore`);
      alert(`User with ID ${userId} not found. Cannot add to organization.`);
      return false;
    }
    
    const userData = userDoc.data();
    console.log(`Found user document: ${userDoc.id}, data:`, userData);
    
    // Use the improved setUserRole function which handles both collections
    const result = await setUserRole(userId, role, organizationId);
    
    if (!result.success) {
      console.error(`Failed to add user to organization: ${result.error}`);
      alert(`Failed to add user to organization: ${result.error}`);
      return false;
    }
    
    // Verify both collections were updated correctly
    try {
      // Verify user document was updated
      const updatedUserDoc = await getDoc(userRef);
      if (!updatedUserDoc.exists() || updatedUserDoc.data().organizationId !== organizationId) {
        console.error('User document was not correctly updated with organization ID');
      } else {
        console.log('User document was correctly updated with organization ID');
      }
      
      // Verify organization member was added
      const orgMemberRef = doc(db, 'organizations', organizationId, 'members', userId);
      const orgMemberDoc = await getDoc(orgMemberRef);
      if (!orgMemberDoc.exists()) {
        console.error('Organization member document was not created');
        
        // Create it if missing
        await setDoc(orgMemberRef, {
          userId: userId,
          role: role,
          addedAt: new Date().toISOString(),
          addedBy: auth.currentUser.uid,
          name: userData.name || userData.email?.split('@')[0] || 'Unknown User',
          email: userData.email || 'No email'
        });
        console.log('Organization member document was created as fallback');
      } else {
        console.log('Organization member document exists');
      }
    } catch (verificationError) {
      console.error('Error verifying user addition:', verificationError);
    }
    
    // Create an audit log entry
    try {
      const auditRef = doc(db, 'audit_logs', `org_add_user_${Date.now()}`);
      await setDoc(auditRef, {
        action: 'organization_add_user',
        organizationId: organizationId,
        userId: userId,
        role: role,
        performedBy: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      });
      console.log('Audit log created for adding user to organization');
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding user to organization:', error);
    return false;
  }
};

/**
 * Remove a user from an organization
 * @param {string} userId - The user ID to remove from the organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<boolean>} Success status
 */
export const removeUserFromOrganization = async (userId, organizationId) => {
  try {
    if (!auth.currentUser) return false;
    
    // Check if user has permission to remove users from this organization
    const hasAccess = await checkUserAccess('remove_user', organizationId, userId);
    
    if (!hasAccess) {
      console.error('You don\'t have permission to remove users from this organization');
      alert('Permission denied: You cannot remove users from this organization');
      return false;
    }
    
    // Get the user to verify it exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found');
      alert('User not found');
      return false;
    }
    
<<<<<<< HEAD
    const userData = userDoc.data();
    if (currentUserRole === 'leader' && userData.role === 'leader') {
      console.error('Leaders cannot remove other leaders');
      alert('Permission denied: Leaders cannot remove other leaders');
      return false;
    }
      // Update the user's data in Firestore to remove organization
=======
    // Update the user's data in Firestore to remove organization
>>>>>>> 0f11832e241997d17f6aea3dcae050a42dc0c9c9
    await setDoc(userRef, {
      organizationId: null,
      role: 'user', // Reset role to user when removed from organization
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    }, { merge: true });
    
    // Remove the user from the organization's members collection
    const orgUserRef = doc(db, 'organizations', organizationId, 'members', userId);
    await deleteDoc(orgUserRef);
    
    // Create an audit log entry
    const auditRef = doc(db, 'audit_logs', `org_remove_user_${Date.now()}`);
    await setDoc(auditRef, {
      action: 'organization_remove_user',
      organizationId: organizationId,
      userId: userId,
      performedBy: auth.currentUser.uid,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error removing user from organization:', error);
    return false;
  }
};

/**
 * Create a new user account and add them to an organization
 * @param {Object} userData - User data including email, password, name
 * @param {string} organizationId - Organization ID
 * @param {string} role - Role to assign ('leader' or 'user')
 * @returns {Promise<string|null>} User ID if successful, null otherwise
 */
export const createUserInOrganization = async (userData, organizationId, role = 'user') => {  
  try {
    if (!auth.currentUser) {
      console.error('No authenticated user found');
      return null;
    }
    
    // Admins can create users in any organization
    // Leaders can create users in their own organization
    const currentUserRole = await getUserRole();
    const currentUserOrgId = await getUserOrganization();
    
    console.log(`Creating user in organization: ${organizationId}, with role: ${role}`);
    console.log(`Current user role: ${currentUserRole}, organization: ${currentUserOrgId}`);
    
    const canCreateUser = 
      currentUserRole === 'admin' || 
      (currentUserRole === 'leader' && currentUserOrgId === organizationId);
    
    if (!canCreateUser) {
      console.error('You don\'t have permission to create users in this organization');
      alert('Permission denied: Only administrators and leaders can create users in their organizations');
      return null;
    }
    
    // Leaders can only create regular users, not other leaders
    if (currentUserRole === 'leader' && role === 'leader') {
      console.error('Leaders cannot create other leaders');
      alert('Permission denied: Leaders can only create regular users');
      return null;
    }
    
    // This is a simplified example - in a real app, you would call a Cloud Function
    // to securely create users server-side. For demo purposes, we simulate this:
    console.warn('In a real application, user creation would happen securely on the server');
    
    // Placeholder for user creation - in a real app, this would be handled by Firebase Auth Admin SDK
    // For now, we'll just return a simulated user ID to demonstrate the flow
    const simulatedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a complete user document with all required fields
    const userRef = doc(db, 'users', simulatedUserId);
    await setDoc(userRef, {
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      role: role,
      organizationId: organizationId,
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser.uid,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid,
      status: 'active',
      cards: [],
      settings: {
        notifications: true,
        theme: 'light'
      }
    });
    
    console.log(`Created user document for ${simulatedUserId} with role ${role}`);
    
    // Create the member document in the organization
    const orgMemberRef = doc(db, 'organizations', organizationId, 'members', simulatedUserId);
    await setDoc(orgMemberRef, {
      userId: simulatedUserId,
      role: role,
      addedAt: new Date().toISOString(),
      addedBy: auth.currentUser.uid,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Created member document in organization ${organizationId}`);
    
    // If creating a leader, update the organization's leaders array
    if (role === 'leader') {
      console.log(`User is a leader, updating organization's leaders array`);
      const orgRef = doc(db, 'organizations', organizationId);
      const orgDoc = await getDoc(orgRef);
      
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        const leaders = orgData.leaders || [];
        
        if (!leaders.includes(simulatedUserId)) {
          await setDoc(orgRef, {
            leaders: [...leaders, simulatedUserId],
            updatedAt: new Date().toISOString()
          }, { merge: true });
          console.log(`Added ${simulatedUserId} to leaders array in organization document`);
        }
      }
    }
    
    // Create an audit log entry
    try {
      const auditRef = doc(db, 'audit_logs', `user_create_${Date.now()}`);
      await setDoc(auditRef, {
        action: 'user_create',
        userId: simulatedUserId,
        organizationId: organizationId,
        role: role,
        createdBy: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      });
      console.log(`Created audit log entry for user creation`);
    } catch (auditError) {
      console.error(`Error creating audit log: ${auditError.message}`);
    }
    
    return simulatedUserId;
  } catch (error) {
    console.error('Error creating user in organization:', error);
    return null;
  }
};

/**
 * Get all organizations (admin only)
 * @returns {Promise<Array>} Array of organizations
 */
export const getOrganizations = async () => {
  try {
    if (!auth.currentUser) {
      console.log('No authenticated user found');
      return [];
    }
    
    // Get the current user's role
    const userRole = await getUserRole();
    console.log(`Current user role: ${userRole}`);
    
    // Get the current user's organization ID if they are a leader
    const userOrgId = userRole === 'leader' ? await getUserOrganization() : null;
    console.log(`Current user organization ID: ${userOrgId}`);
    
    // Query to fetch organizations based on user role
    let orgsCollection, orgsSnapshot;
    
    if (userRole === 'admin') {
      // Admins can see all organizations
      console.log('User is admin - fetching all organizations');
      orgsCollection = collection(db, 'organizations');
      orgsSnapshot = await getDocs(orgsCollection);
    } else if (userRole === 'leader' && userOrgId) {
      // Check if leader has access to view their organization
      const hasAccess = await checkUserAccess('view_organization', userOrgId);
      if (!hasAccess) {
        console.log('Leader does not have permission to view organization');
        return [];
      }
      
      // Leaders can only see their own organization
      console.log(`User is leader - fetching only organization: ${userOrgId}`);
      const orgRef = doc(db, 'organizations', userOrgId);
      const orgDoc = await getDoc(orgRef);
      
      if (orgDoc.exists()) {
        // Create a snapshot-like structure with just this organization
        orgsSnapshot = {
          empty: false,
          docs: [orgDoc]
        };
      } else {
        console.log('Leader organization not found');
        return [];
      }
    } else {
      // Regular users should not see any organizations
      console.log('User is a regular user - no organizations access');
      return [];
    }
    
    if (orgsSnapshot.empty) {
      console.log('No organizations found in the database');
      return [];
    }
    
    console.log(`Found ${orgsSnapshot.docs.length} organizations`);
    const orgs = orgsSnapshot.docs.map(doc => {      const data = doc.data();
      return { 
        id: doc.id,
        name: data.name || 'Unnamed Organization',
        description: data.description || '',
        createdAt: data.createdAt || new Date().toISOString(),
        createdBy: data.createdBy || 'unknown',
        ...data
      };
    });
    
    console.log('Organizations data:', JSON.stringify(orgs));
    return orgs;
  } catch (error) {
    console.error('Error in getOrganizations:', error);
    alert(`Error fetching organizations: ${error.message}`);
    return [];
  }
};

/**
 * Get organization details including members
 * @param {string} organizationId - Organization ID 
 * @returns {Promise<Object|null>} Organization data with members
 */
export const getOrganizationWithMembers = async (organizationId) => {
  try {
    console.log('Fetching organization details for ID:', organizationId);
    
    // Check if user has access to view this organization
    const hasAccess = await checkUserAccess('view_organization', organizationId);
    
    if (!hasAccess) {
      console.error('You don\'t have permission to access this organization');
      alert('You don\'t have permission to access this organization');
      return null;
    }
    
    try {
      // Get organization details
      const orgRef = doc(db, 'organizations', organizationId);
      const orgDoc = await getDoc(orgRef);
      
      if (!orgDoc.exists()) {
        console.error('Organization not found');
        alert('Organization not found');
        return null;
      }
      
      const orgData = { id: orgDoc.id, ...orgDoc.data() };
      console.log('Organization data retrieved:', orgData);
      
      // Get organization members
      let memberIds = [];
      let membersSnapshot;
      try {
        membersSnapshot = await getDocs(collection(db, 'organizations', organizationId, 'members'));
        memberIds = membersSnapshot.docs.map(doc => doc.id);
        console.log('Organization members fetched:', memberIds.length);
      } catch (membersError) {
        console.error('Error fetching organization members:', membersError);
        if (membersError.code === 'permission-denied') {
          console.log('Permission denied when accessing organization members. Checking security rules...');
          alert('Permission denied when accessing organization members. Please check Firestore rules.');
        }
        // Continue with empty members array
        memberIds = [];
        membersSnapshot = { docs: [] };
      }      // Get full user details for each member
      const members = [];
      for (const memberId of memberIds) {
        const userRef = doc(db, 'users', memberId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          // Ensure membersSnapshot is properly referenced
          const memberData = membersSnapshot?.docs?.find(doc => doc.id === memberId)?.data() || {};
          
          // Force a consistent role by using the role from the organization's members collection
          // This ensures the UI properly reflects the role
          const role = memberData.role || userDoc.data().role || 'user';
          
          members.push({
            id: userDoc.id,
            ...userDoc.data(),
            ...memberData,
            role: role // Ensure the role is correctly reflected
          });
        }
      }
      
      console.log('Returning organization with members:', { ...orgData, members });
      return { ...orgData, members };
      } catch (error) {
      console.error('Error fetching organization details:', error);
      console.log('Error info:', error.code, error.message);
      alert(`Error loading organization: ${error.message}`);
      return null;
    }  } catch (error) {
    console.error('Error getting organization with members:', error);
    return null;
  }
};

/**
<<<<<<< HEAD
 * Force refresh a user's role and permissions
 * @param {string} userId - The user ID to refresh permissions for (defaults to current user)
 * @returns {Promise<Object>} The updated user role and permissions
 */
export const refreshUserPermissions = async (userId = null) => {
  try {
    // Default to current user
    userId = userId || auth.currentUser?.uid;
    
    if (!userId) {
      console.error('No user ID provided and no user is logged in');
      return { success: false, error: 'No user ID provided and no user is logged in' };
    }
    
    console.log(`Refreshing permissions for user: ${userId}`);
    
    // Get fresh user data from Firestore
=======
 * Check if the current user has access to perform specific actions based on their role
 * @param {string} actionType - Type of action to check ('view_user', 'edit_user', 'manage_organization', etc.)
 * @param {string|null} targetOrgId - Organization ID related to the action (if applicable)
 * @param {string|null} targetUserId - User ID related to the action (if applicable)
 * @returns {Promise<boolean>} Whether the user has permission to perform the action
 */
export const checkUserAccess = async (actionType, targetOrgId = null, targetUserId = null) => {
  try {
    if (!auth.currentUser) return false;
    
    // Get current user's role and organization
    const currentUserRole = await getUserRole();
    const currentUserOrgId = await getUserOrganization();
    const currentUserId = auth.currentUser.uid;
    
    // Log all parameters for debugging
    console.log('Checking access for:', {
      action: actionType,
      userRole: currentUserRole,
      userOrg: currentUserOrgId,
      targetOrg: targetOrgId,
      targetUser: targetUserId
    });
    
    // Admins have full access to everything
    if (currentUserRole === 'admin') {
      console.log('Admin access granted');
      return true;
    }
    
    // Define access rights for different action types
    switch (actionType) {
      // User profile actions
      case 'view_profile':
        // Users can view their own profile, leaders can view profiles in their org
        return currentUserId === targetUserId || 
               (currentUserRole === 'leader' && currentUserOrgId === targetOrgId);
      
      case 'edit_profile':
        // Users can only edit their own profile
        return currentUserId === targetUserId;
      
      // Organization management actions
      case 'view_organization':
        // Leaders can view their own organization, users can't view any
        return currentUserRole === 'leader' && currentUserOrgId === targetOrgId;
      
      case 'manage_organization':
        // Only leaders can manage their own organization
        return currentUserRole === 'leader' && currentUserOrgId === targetOrgId;
        // User management actions
      case 'view_users':
        // Leaders can view users in their organization
        return currentUserRole === 'leader' && currentUserOrgId === targetOrgId;
      
      case 'edit_user':
        // Leaders can edit users in their organization (but not themselves or other leaders)
        if (currentUserRole === 'leader' && currentUserOrgId === targetOrgId) {
          if (targetUserId === currentUserId) {
            console.log('Leaders cannot edit their own role through this function');
            return false;
          }
          
          // Check if target user is also a leader (leaders can't edit other leaders)
          if (targetUserId) {
            const targetUserRole = await getUserRoleById(targetUserId);
            
            if (targetUserRole === 'leader') {
              console.log('Leaders cannot edit other leaders');
              return false;
            }
          }
          
          return true;
        }
        return false;
      
      case 'add_user':
        // Only admins can add users to organizations
        return false;
      
      case 'remove_user':
        // Leaders can remove users from their organization (except other leaders)
        if (currentUserRole === 'leader' && currentUserOrgId === targetOrgId) {
          if (targetUserId) {
            const targetUserRef = doc(db, 'users', targetUserId);
            const targetUserDoc = await getDoc(targetUserRef);
            
            if (targetUserDoc.exists() && targetUserDoc.data().role === 'leader') {
              console.log('Leaders cannot remove other leaders');
              return false;
            }
          }
          
          return true;
        }
        return false;
      
      // Default case - deny access
      default:
        console.log(`Unknown action type: ${actionType}`);
        return false;
    }
  } catch (error) {
    console.error('Error checking user access:', error);
    return false; // Deny access on error
  }
};

/**
 * Get a specific user's role from Firestore
 * @param {string} userId - The user ID to check
 * @returns {Promise<string>} The user's role ('admin', 'leader', or 'user')
 */
export const getUserRoleById = async (userId) => {
  try {
    if (!userId) {
      console.log('No user ID provided, returning default role: user');
      return 'user';
    }
    
    // Get the user document from Firestore
>>>>>>> 0f11832e241997d17f6aea3dcae050a42dc0c9c9
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
<<<<<<< HEAD
      console.error(`User with ID ${userId} not found`);
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    console.log(`User data refreshed:`, userData);
    
    let updateNeeded = false;
    let userUpdates = {};    // If the user has an organization, check if they are a leader
    if (userData.organizationId) {
      try {
        const orgRef = doc(db, 'organizations', userData.organizationId);
        const orgDoc = await getDoc(orgRef);
        
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          // Add safety check to prevent "leaders is not iterable" errors
          const orgLeaders = Array.isArray(orgData.leaders) ? orgData.leaders : [];
          
          console.log(`User ID: ${userId}, Role: ${userData.role}, In leaders array: ${orgLeaders.includes(userId)}`);
          
          // Ensure role consistency - if they're in the leaders array, they should have leader role
          if (orgLeaders.includes(userId) && userData.role !== 'leader') {
            console.log(`Fixing inconsistency: User is in leaders array but role is ${userData.role}`);
            userUpdates.role = 'leader';
            userUpdates.updatedAt = new Date().toISOString();
            updateNeeded = true;
            userData.role = 'leader'; // Update local copy for further checks
          } else if (!orgLeaders.includes(userId) && userData.role === 'leader') {
            console.log(`Fixing inconsistency: User role is leader but not in leaders array`);
            // Add to leaders array
            try {
              await setDoc(orgRef, {
                leaders: [...orgLeaders, userId],
                updatedAt: new Date().toISOString()
              }, { merge: true });
              console.log(`Added user ${userId} to organization's leaders array`);
            } catch (leaderUpdateError) {
              console.error(`Error updating leaders array: ${leaderUpdateError.message}`);
            }
          }
        } else {
          console.warn(`Organization ${userData.organizationId} not found for user ${userId}`);
          // If org doesn't exist, reset user's organization
          userUpdates.organizationId = null;
          userUpdates.role = 'user';
          userUpdates.updatedAt = new Date().toISOString();
          updateNeeded = true;
        }
      } catch (orgError) {
        console.error(`Error checking organization: ${orgError.message}`);
      }
      
      try {
        // Also check the organization members collection for consistency
        const memberRef = doc(db, 'organizations', userData.organizationId, 'members', userId);
        const memberDoc = await getDoc(memberRef);
        
        if (memberDoc.exists()) {
          const memberData = memberDoc.data();
          
          // If roles are inconsistent, update the member document
          if (memberData.role !== userData.role) {
            console.log(`Fixing role inconsistency in members collection: ${memberData.role} vs ${userData.role}`);
            await setDoc(memberRef, { 
              role: userData.role,
              updatedAt: new Date().toISOString() 
            }, { merge: true });
            console.log(`Updated member document with consistent role: ${userData.role}`);
          }
        } else {
          // If user has an org but no member document, create one
          console.log(`User has organization but no member document, creating one`);
          await setDoc(memberRef, {
            userId: userId,
            role: userData.role,
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            email: userData.email || 'Unknown',
            name: userData.name || userData.email?.split('@')[0] || 'Unknown User'
          });
          console.log(`Created missing member document for user ${userId}`);
        }
      } catch (memberError) {
        console.error(`Error checking member document: ${memberError.message}`);
      }
    }
    
    // If we need to update the user document, do it now
    if (updateNeeded && Object.keys(userUpdates).length > 0) {
      try {
        await setDoc(userRef, userUpdates, { merge: true });
        console.log(`Updated user document with fixes:`, userUpdates);
        
        // If we updated the role, reflect that in our local userData
        if (userUpdates.role) {
          userData.role = userUpdates.role;
        }
      } catch (updateError) {
        console.error(`Error updating user document: ${updateError.message}`);
      }
    }
    
    return { 
      success: true, 
      role: userData.role || 'user',
      organizationId: userData.organizationId || null,
      isAdmin: userData.role === 'admin',
      isLeader: userData.role === 'leader'
    };
  } catch (error) {
    console.error('Error refreshing user permissions:', error);
    return { success: false, error: error.message };
  }
};
=======
      console.log('User document does not exist, returning default role: user');
      return 'user';
    }
    
    const userData = userDoc.data();
    const role = userData.role || 'user';
    
    console.log(`User ${userId} role from Firestore: ${role}`);
    
    // Return the role from Firestore or default to 'user'
    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user'; // Default to regular user on error
  }
};

/**
 * Get a specific user's organization ID from Firestore
 * @param {string} userId - The user ID to check
 * @returns {Promise<string|null>} The organization ID or null if not in an organization
 */
export const getUserOrganizationById = async (userId) => {
  try {
    if (!userId) return null;
    
    // Get the user document from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return null;
    
    // Return the organization ID from the user document
    return userDoc.data().organizationId || null;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
};

// Original functions below
>>>>>>> 0f11832e241997d17f6aea3dcae050a42dc0c9c9
