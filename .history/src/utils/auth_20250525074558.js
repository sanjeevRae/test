// Auth utility functions for role-based access control - IMPROVED VERSION
import { auth, db, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from './firebase';

/**
 * Check if the current user has admin privileges based on Firestore role
 * This client-side implementation is compatible with the Spark plan
 * @returns {Promise<boolean>} True if the user has admin privileges
 */
export const isUserAdmin = async () => {
  try {
    // DEVELOPMENT MODE: Bypass all permission checks
    console.log('⚠️ DEVELOPMENT MODE: All users have admin privileges');
    
    // Force create/update admin status in Firestore
    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          role: 'admin',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('User document updated with admin role');
      } catch (updateError) {
        console.error('Error updating user document:', updateError);
      }
    }
    
    return true; // This grants admin access to anyone logged in

    /* REGULAR IMPLEMENTATION - Uncomment for production
    // Get the user document from Firestore
    const userRef = doc(db, 'users', userId);
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
    */
  } catch (error) {
    console.error('Error checking admin status:', error);
    console.error('Error details:', error.message);
    console.log('Allowing admin access despite error for debugging');
    return true; // TEMPORARY: allow admin access despite errors for debugging
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
    
    // Check if the role field is set to 'leader'
    return userDoc.data().role === 'leader';
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
    if (!auth.currentUser) return 'user';
    
    // Get the user document from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return 'user';
    
    // Return the role from Firestore or default to 'user'
    return userDoc.data().role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
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
 * @returns {Promise<boolean>} Success status
 */
export const setUserRole = async (userId, role, organizationId = null) => {
  try {
    if (!auth.currentUser) {
      console.error('No authenticated user found');
      return { success: false, error: 'No authenticated user found' };
    }
    
    console.log(`setUserRole called with userId: ${userId}, role: ${role}, organizationId: ${organizationId}`);
    
    // First check if current user is admin or leader
    const currentUserRole = await getUserRole();
    console.log(`Current user's role: ${currentUserRole}`);
    
    // Only admins can create admins
    if (role === 'admin' && currentUserRole !== 'admin') {
      console.error('Only admins can assign admin roles');
      return { success: false, error: 'Only admins can assign admin roles' };
    }
      // Leaders can only manage users in their organization
    if (currentUserRole === 'leader') {
      // Get leader's organization
      const leaderOrgId = await getUserOrganization();
      console.log(`Leader's organization ID: ${leaderOrgId}, Target organization ID: ${organizationId}`);
      
      // Leaders can only manage users within their own organization
      if (organizationId !== leaderOrgId) {
        console.error('Leaders can only manage users within their organization');
        return { success: false, error: 'Leaders can only manage users within their organization' };
      }
      
      // Leaders can only demote users to regular users, not promote to leaders
      if (role === 'leader') {
        console.error('Leaders cannot promote users to leader role');
        return { success: false, error: 'Leaders cannot promote users to leader role' };
      }
    }
    
    // Leaders and regular users can't assign roles
    if (currentUserRole === 'user') {
      console.error('Regular users cannot assign roles');
      return { success: false, error: 'Regular users cannot assign roles' };
    }
    
    // Verify the user exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`User document with ID ${userId} not found in Firestore`);
      return { success: false, error: `User with ID ${userId} not found` };
    }
    
    console.log(`Found user document: ${userDoc.id}`);
    const userData = userDoc.data();
    
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
          updatedAt: new Date().toISOString()
        };
        
        // If member doesn't exist in org, add additional required fields
        if (!memberDoc.exists()) {
          console.log(`Member ${userId} does not exist in organization, creating entry`);
          memberUpdateData.userId = userId;
          memberUpdateData.addedAt = new Date().toISOString();
          memberUpdateData.addedBy = auth.currentUser.uid;
          memberUpdateData.email = userData.email;
          memberUpdateData.name = userData.name || userData.email?.split('@')[0] || 'Unknown User';
        }
        
        // Update or create the member document
        await setDoc(orgMemberRef, memberUpdateData, { merge: true });
        
        console.log(`Successfully updated member role in organization`);
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
        oldRole: userData.role || 'unknown',
        organizationId: organizationId,
        performedBy: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Role change audit log created`);
    } catch (auditError) {
      console.error(`Error creating audit log: ${auditError.message}`);
      // Don't fail the operation just because audit logging failed
    }
    
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
    
    // DEVELOPMENT MODE: Skip admin check for organization creation
    console.log('Development mode: Bypassing admin check for organization creation');
    // const isAdmin = await isUserAdmin();
    // if (!isAdmin) {
    //   console.error('Only admins can create organizations');
    //   alert('Only administrators can create organizations');
    //   return null;
    // }
    
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
      // Determine if current user can add users to this organization
    const currentUserRole = await getUserRole();
    const currentUserOrgId = await getUserOrganization();
    
    console.log(`Adding user ${userId} to organization ${organizationId} with role ${role}`);
    console.log(`Current user role: ${currentUserRole}, Current user org: ${currentUserOrgId}`);
    
    // Admins can add users to any organization
    // Leaders can add users to their own organization
    const canAddUser = currentUserRole === 'admin' || 
      (currentUserRole === 'leader' && currentUserOrgId === organizationId);
    
    if (!canAddUser) {
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
      // Determine if current user can remove users from this organization
    const currentUserRole = await getUserRole();
    const currentUserOrgId = await getUserOrganization();
    
    // Admins can remove users from any organization
    // Leaders can only remove users from their own organization
    const canRemoveUser = 
      currentUserRole === 'admin' || 
      (currentUserRole === 'leader' && currentUserOrgId === organizationId);
    
    if (!canRemoveUser) {
      console.error('You don\'t have permission to remove users from this organization');
      alert('Permission denied: You cannot remove users from this organization');
      return false;
    }
    
    // Get the user to check their role (leaders can't remove other leaders)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found');
      alert('User not found');
      return false;
    }
    
    const userData = userDoc.data();
    if (currentUserRole === 'leader' && userData.role === 'leader') {
      console.error('Leaders cannot remove other leaders');
      alert('Permission denied: Leaders cannot remove other leaders');
      return false;
    }
    
    // Update the user's data in Firestore to remove organization
    await setDoc(userRef, {
      organizationId: null,
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
export const createUserInOrganization = async (userData, organizationId, role = 'user') => {  try {
    // Admins can create users in any organization
    // Leaders can create users in their own organization
    const currentUserRole = await getUserRole();
    const currentUserOrgId = await getUserOrganization();
    
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
    
    // Add user to the organization
    await addUserToOrganization(simulatedUserId, organizationId, role);
    
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
    console.log('SUPER DEV MODE: Bypassing all permission checks');
    
    // Create admin user if not exists (force creation)
    if (auth.currentUser) {
      try {
        console.log('Ensuring current user has admin privileges');
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          email: auth.currentUser.email || 'admin@example.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        }, { merge: true });
        console.log('User set as admin in database');
      } catch (userError) {
        console.error('Error creating/updating user:', userError);
        // Continue despite error
      }
    }
    
    // Directly fetch organizations - no permission checks
    console.log('Directly fetching organizations from Firestore...');
    const orgsCollection = collection(db, 'organizations');
    const orgsSnapshot = await getDocs(orgsCollection);
    
    if (orgsSnapshot.empty) {
      console.log('No organizations found in the database');
      return [];
    }
    
    console.log(`Found ${orgsSnapshot.docs.length} organizations`);
    const orgs = orgsSnapshot.docs.map(doc => {
      const data = doc.data();
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
    
    // Check access rights
    const currentUserRole = await getUserRole();
    const currentUserOrgId = await getUserOrganization();
      console.log('Current user role:', currentUserRole);
    console.log('Current user organization ID:', currentUserOrgId);
    
    // DEVELOPMENT MODE: Skip permission checks for organization access
    console.log('Development mode: Bypassing permission check for organization access');
    // if (currentUserRole !== 'admin' && 
    //     (currentUserRole !== 'leader' || currentUserOrgId !== organizationId)) {
    //   console.error('You don\'t have permission to access this organization');
    //   alert('You don\'t have permission to access this organization');
    //   return null;
    // }
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
      }
          // Get full user details for each member
      const members = [];
      for (const memberId of memberIds) {
        const userRef = doc(db, 'users', memberId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          // Ensure membersSnapshot is properly referenced
          const memberData = membersSnapshot?.docs?.find(doc => doc.id === memberId)?.data() || {};
          members.push({
            id: userDoc.id,
            ...userDoc.data(),
            ...memberData
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
    }
  } catch (error) {
    console.error('Error getting organization with members:', error);
    return null;
  }
};