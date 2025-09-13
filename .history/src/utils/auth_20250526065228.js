// Auth utility functions for role-based access control
import { auth, db, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from './firebase';

/**
 * Check if the current user has admin privileges based on Firestore role
 * @returns {Promise<boolean>} True if the user has admin privileges
 */
export const isUserAdmin = async () => {
  try {
    if (!auth.currentUser) return false;
    
    // Get the user document from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;
    
    // Check if user role is admin
    const userData = userDoc.data();
    return userData.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false; // Default to no admin access on error
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
    
    // Check if user role is leader or admin (admins have leader privileges)
    const userData = userDoc.data();
    return userData.role === 'leader' || userData.role === 'admin';
  } catch (error) {
    console.error('Error checking leader status:', error);
    return false; // Default to no leader access on error
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
    
    // Get the role from user document or default to 'user'
    const userData = userDoc.data();
    const role = userData.role || 'user';
    
    console.log(`Current user role from Firestore: ${role}`);
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
 * @param {string} userId - The user ID to update
 * @param {string} role - The role to assign ('admin', 'leader', or 'user')
 * @param {string|null} organizationId - The organization ID (required for leaders and users)
 * @returns {Promise<object>} Result object with success flag and error message if applicable
 */
export const setUserRole = async (userId, role, organizationId = null) => {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get the user's current role for audit log
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const oldRole = userData.role || 'user';

    // Update data to set
    const updateData = {
      role: role,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    };
    
    // Add organization ID if provided
    if (organizationId) {
      updateData.organizationId = organizationId;
    }
    
    // Update the user's role in Firestore
    await setDoc(userRef, updateData, { merge: true });
    console.log(`Successfully updated user role in users collection`);
    
    // If organizationId is provided, also update the member role in the organization
    if (organizationId) {
      try {
        const orgMemberRef = doc(db, 'organizations', organizationId, 'members', userId);
        const memberDoc = await getDoc(orgMemberRef);
        
        if (memberDoc.exists()) {
          // Update existing member document
          await setDoc(orgMemberRef, {
            role: role,
            updatedAt: new Date().toISOString(),
            updatedBy: auth.currentUser.uid
          }, { merge: true });
          console.log(`Successfully updated user role in organization members collection`);
        } else {
          // Create new member document if it doesn't exist
          await setDoc(orgMemberRef, {
            userId: userId,
            role: role,
            addedAt: new Date().toISOString(),
            addedBy: auth.currentUser.uid,
            updatedAt: new Date().toISOString(),
            updatedBy: auth.currentUser.uid,
            name: userData.displayName || userData.name || '',
            email: userData.email || ''
          });
          console.log(`Added user to organization members collection with role: ${role}`);
        }
      } catch (memberError) {
        console.error(`Error updating organization member: ${memberError.message}`);
        return { success: false, error: `Error updating organization member: ${memberError.message}` };
      }
    }
    
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
  return setUserRole(userId, 'admin');
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
  } catch (error) {
    console.error('Error creating organization:', error);
    alert(`Error creating organization: ${error.message}`);
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
    
    // Update the user's data in Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      organizationId: organizationId,
      role: role,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    }, { merge: true });
    
    // Add the user to the organization's members collection
    const orgUserRef = doc(db, 'organizations', organizationId, 'members', userId);
    await setDoc(orgUserRef, {
      userId: userId,
      role: role,
      addedAt: new Date().toISOString(),
      addedBy: auth.currentUser.uid
    });
    
    // Create an audit log entry
    const auditRef = doc(db, 'audit_logs', `org_add_user_${Date.now()}`);
    await setDoc(auditRef, {
      action: 'organization_add_user',
      organizationId: organizationId,
      userId: userId,
      role: role,
      performedBy: auth.currentUser.uid,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error adding user to organization:', error);
    alert(`Error adding user to organization: ${error.message}`);
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
    
    // Update the user's data in Firestore to remove organization
    const userRef = doc(db, 'users', userId);
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
    alert(`Error removing user from organization: ${error.message}`);
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
    // Placeholder for user creation - in a real app, this would be handled by Firebase Auth Admin SDK
    const simulatedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a complete user document with all required fields
    const userRef = doc(db, 'users', simulatedUserId);
    await setDoc(userRef, {
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      role: role,
      organizationId: organizationId,
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser?.uid || 'system',
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'system',
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
    alert(`Error creating user: ${error.message}`);
    return null;
  }
};

/**
 * Get all organizations 
 * @returns {Promise<Array>} Array of organizations
 */
export const getOrganizations = async () => {
  try {
    console.log('Fetching all organizations...');
    
    // Force create an admin user if logged in
    if (auth.currentUser) {
      try {
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
        console.error('Error ensuring admin user:', userError);
      }
    }
    
    // Fetch organizations directly
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
    let membersSnapshot = { docs: [] };
    
    try {
      membersSnapshot = await getDocs(collection(db, 'organizations', organizationId, 'members'));
      memberIds = membersSnapshot.docs.map(doc => doc.id);
      console.log('Organization members fetched:', memberIds.length);
    } catch (membersError) {
      console.error('Error fetching organization members:', membersError);
      memberIds = [];
    }
    
    // Get full user details for each member
    const members = [];
    for (const memberId of memberIds) {
      try {
        const userRef = doc(db, 'users', memberId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const memberData = membersSnapshot.docs.find(doc => doc.id === memberId)?.data() || {};
          members.push({
            id: userDoc.id,
            ...userDoc.data(),
            ...memberData
          });
        }
      } catch (userError) {
        console.error(`Error fetching user ${memberId}:`, userError);
      }
    }
    
    return { ...orgData, members };
  } catch (error) {
    console.error('Error getting organization with members:', error);
    alert(`Error loading organization: ${error.message}`);
    return null;
  }
};

/**
 * Refreshes the current user's permissions from Firestore
 * @param {string} userId - Optional user ID, defaults to current user
 * @returns {Promise<object>} Object with success flag and user role/organization
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
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`User document with ID ${userId} not found in Firestore`);
      return { success: false, error: `User with ID ${userId} not found` };
    }
    
    const userData = userDoc.data();
    console.log(`User data refreshed:`, userData);
    
    // Return success with user data
    return { 
      success: true, 
      role: userData.role || 'user',
      organizationId: userData.organizationId || null
    };
  } catch (error) {
    console.error('Error refreshing user permissions:', error);
    return { success: false, error: `Error refreshing permissions: ${error.message}` };
  }
};

/**
 * Get a user's role by their user ID
 * @param {string} userId - The user ID to check
 * @returns {Promise<string>} The user's role ('admin', 'leader', or 'user')
 */
export const getUserRoleById = async (userId) => {
  try {
    if (!userId) {
      console.error('Invalid user ID provided');
      return 'user';
    }
    
    // Get the user document from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`User with ID ${userId} not found`);
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
 * Get all users from Firestore
 * @returns {Promise<Array>} Array of user objects
 */
export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        name: userData.displayName || userData.name || 'Unknown',
        email: userData.email || 'No email',
        role: userData.role || 'user'
      });
    });
    
    console.log(`Retrieved ${users.length} users from Firestore`);
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};
