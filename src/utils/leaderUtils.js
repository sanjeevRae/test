import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  collection, 
  where, 
  getDocs, 
  setDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Assigns the current user to an organization as a leader
 * @param {string} organizationId - ID of the organization to assign
 * @returns {Promise<Object>} Result object with success status and message
 */
export const assignLeaderToOrganization = async (organizationId) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        message: 'No user is logged in'
      };
    }
    
    // Verify organization exists
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      return {
        success: false,
        message: `Organization with ID ${organizationId} does not exist`
      };
    }
    
    // Update user document
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {
        success: false,
        message: 'User document does not exist in Firestore'
      };
    }
    
    // Update user with organization ID and ensure role is leader
    await updateDoc(userRef, {
      organizationId: organizationId,
      role: 'leader'
    });
    
    return {
      success: true,
      message: `Successfully assigned to organization ${orgDoc.data().name || organizationId}`
    };
  } catch (error) {
    console.error('Error assigning leader to organization:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Creates a sample organization and assigns the current user as a leader
 * @returns {Promise<Object>} Result object with success status and organizationId
 */
export const createSampleOrganizationForLeader = async () => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        message: 'No user is logged in'
      };
    }
    
    // Import functions only when needed to prevent circular dependencies
    const { createOrganization, setUserRole, getUserRole } = await import('./auth');
    
    // Check if the user already has a role
    const currentRole = await getUserRole();
    
    // Only allow users with leader role or users with no specific role yet
    if (currentRole !== 'leader' && currentRole !== 'user') {
      return {
        success: false,
        message: `Cannot create organization for users with ${currentRole} role`
      };
    }
    
    // Create a sample organization
    const orgName = `${auth.currentUser.email.split('@')[0]}'s Organization`;
    const orgData = {
      name: orgName,
      description: 'Sample organization created for leader testing'
    };
    
    const orgId = await createOrganization(orgData);
    
    if (!orgId) {
      return {
        success: false,
        message: 'Failed to create organization'
      };
    }
    
    // Assign user as leader of this organization
    const result = await setUserRole(auth.currentUser.uid, 'leader', orgId);
    
    return {
      success: true,
      message: `Created organization "${orgName}" and assigned you as leader`,
      organizationId: orgId
    };
  } catch (error) {
    console.error('Error creating sample organization:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get all users in a leader's organization
 * @param {string} organizationId - The organization to get users from
 * @returns {Promise<Array>} Array of user objects
 */
export const getOrganizationMembers = async (organizationId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is logged in');
    }

    // First check if the current user is a leader in this organization
    const currentUserRef = doc(db, 'users', auth.currentUser.uid);
    const currentUserDoc = await getDoc(currentUserRef);

    if (!currentUserDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = currentUserDoc.data();
    const userRole = userData.role || 'user';
    const userOrgId = userData.organizationId;

    // Verify user is a leader or admin
    if (userRole !== 'leader' && userRole !== 'admin') {
      throw new Error('Only leaders and admins can view organization members');
    }

    // For leaders, verify they're viewing their own organization
    if (userRole === 'leader' && userOrgId !== organizationId) {
      throw new Error('Leaders can only view members in their own organization');
    }

    // Get all users in the organization
    const usersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', organizationId)
    );

    const querySnapshot = await getDocs(usersQuery);
    const members = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      members.push({
        id: doc.id,
        email: userData.email,
        name: userData.name || '',
        role: userData.role || 'user',
        status: userData.status || 'active',
        joinedAt: userData.createdAt || null
      });
    });

    return members;
  } catch (error) {
    console.error('Error getting organization members:', error);
    throw error;
  }
};

/**
 * Update a user's role within the organization (only for leaders managing their own org)
 * @param {string} userId - The user ID to update
 * @param {string} role - The new role (user or leader)
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} Result object with success status
 */
export const updateMemberRole = async (userId, role, organizationId) => {
  try {
    if (!auth.currentUser) {
      return { success: false, message: 'No user is logged in' };
    }

    // Verify current user is a leader or admin
    const currentUserRef = doc(db, 'users', auth.currentUser.uid);
    const currentUserDoc = await getDoc(currentUserRef);

    if (!currentUserDoc.exists()) {
      return { success: false, message: 'User document not found' };
    }

    const userData = currentUserDoc.data();
    const userRole = userData.role || 'user';
    const userOrgId = userData.organizationId;

    // Only allow admins and leaders to update roles
    if (userRole !== 'leader' && userRole !== 'admin') {
      return { success: false, message: 'Only leaders and admins can update member roles' };
    }

    // Leaders can only update members in their own organization
    if (userRole === 'leader' && userOrgId !== organizationId) {
      return { success: false, message: 'Leaders can only update members in their own organization' };
    }

    // Leaders cannot update other leaders' roles
    if (userRole === 'leader') {
      const targetUserRef = doc(db, 'users', userId);
      const targetUserDoc = await getDoc(targetUserRef);

      if (targetUserDoc.exists() && targetUserDoc.data().role === 'leader' && role !== 'leader') {
        return { success: false, message: 'Leaders cannot downgrade other leaders' };
      }
    }

    // Update the user's role
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: role,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid
    });

    // Also update the organization's members collection
    const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
    const memberDoc = await getDoc(memberRef);

    if (memberDoc.exists()) {
      await updateDoc(memberRef, {
        role: role,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      });
    } else {
      // Create the member document if it doesn't exist
      const targetUserRef = doc(db, 'users', userId);
      const targetUserDoc = await getDoc(targetUserRef);
      
      if (!targetUserDoc.exists()) {
        return { success: false, message: 'Target user not found' };
      }
      
      const targetUserData = targetUserDoc.data();
      
      await setDoc(memberRef, {
        userId: userId,
        name: targetUserData.name || targetUserData.email?.split('@')[0] || 'Unknown User',
        email: targetUserData.email || 'Unknown',
        role: role,
        addedAt: serverTimestamp(),
        addedBy: auth.currentUser.uid
      });
    }

    // Create an audit log
    const auditRef = doc(db, 'audit_logs', `role_update_${Date.now()}`);
    await setDoc(auditRef, {
      action: 'update_role',
      targetUser: userId,
      newRole: role,
      organizationId: organizationId,
      performedBy: auth.currentUser.uid,
      timestamp: serverTimestamp()
    });

    return { success: true, message: `User role updated to ${role}` };
  } catch (error) {
    console.error('Error updating member role:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update a user's status (active/blocked) within the organization
 * @param {string} userId - The user ID to update
 * @param {string} status - The new status ('active' or 'blocked')
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} Result object with success status
 */
export const updateMemberStatus = async (userId, status, organizationId) => {
  try {
    if (!auth.currentUser) {
      return { success: false, message: 'No user is logged in' };
    }

    // Verify current user is a leader or admin
    const currentUserRef = doc(db, 'users', auth.currentUser.uid);
    const currentUserDoc = await getDoc(currentUserRef);

    if (!currentUserDoc.exists()) {
      return { success: false, message: 'User document not found' };
    }

    const userData = currentUserDoc.data();
    const userRole = userData.role || 'user';
    const userOrgId = userData.organizationId;

    // Only allow admins and leaders to update status
    if (userRole !== 'leader' && userRole !== 'admin') {
      return { success: false, message: 'Only leaders and admins can update member status' };
    }

    // Leaders can only update members in their own organization
    if (userRole === 'leader' && userOrgId !== organizationId) {
      return { success: false, message: 'Leaders can only update members in their own organization' };
    }

    // Leaders cannot update other leaders' status
    if (userRole === 'leader') {
      const targetUserRef = doc(db, 'users', userId);
      const targetUserDoc = await getDoc(targetUserRef);

      if (targetUserDoc.exists() && targetUserDoc.data().role === 'leader') {
        return { success: false, message: 'Leaders cannot update other leaders\' status' };
      }
    }

    // Update the user's status
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: status,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid
    });

    // Also update any profiles the user might have
    // Get user's profile cards
    const userDoc = await getDoc(userRef);
    if (userDoc.exists() && userDoc.data().cards) {
      const cards = userDoc.data().cards;
      for (const cardId of cards) {
        const cardRef = doc(db, 'profiles', cardId);
        const cardDoc = await getDoc(cardRef);
        
        if (cardDoc.exists()) {
          await updateDoc(cardRef, {
            status: status,
            updatedAt: serverTimestamp()
          });
        }
      }
    }

    // Create an audit log
    const auditRef = doc(db, 'audit_logs', `status_update_${Date.now()}`);
    await setDoc(auditRef, {
      action: 'update_status',
      targetUser: userId,
      newStatus: status,
      organizationId: organizationId,
      performedBy: auth.currentUser.uid,
      timestamp: serverTimestamp()
    });

    return { success: true, message: `User status updated to ${status}` };
  } catch (error) {
    console.error('Error updating member status:', error);
    return { success: false, message: error.message };
  }
};
