// Auth utility functions for role-based access control
import { auth, db, doc, getDoc, setDoc } from './firebase';

/**
 * Check if the current user has admin privileges based on Firestore role
 * This client-side implementation is compatible with the Spark plan
 * @returns {Promise<boolean>} True if the user has admin privileges
 */
export const isUserAdmin = async () => {
  try {
    if (!auth.currentUser) return false;
    
    // Get the user document from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;
    
    // Check if the role field is set to 'admin'
    return userDoc.data().role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get the current user's role from Firestore
 * @returns {Promise<string>} The user's role ('admin' or 'user')
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
 * Set admin role for a user (client-side implementation)
 * Note: This should be protected by Firestore security rules
 * @param {string} userId - The user ID to grant admin access to
 * @returns {Promise<boolean>} Success status
 */
export const setAdminRole = async (userId) => {
  try {
    if (!auth.currentUser) return false;
    
    // First check if current user is admin
    const isAdmin = await isUserAdmin();
    if (!isAdmin) {
      console.error('Only admins can assign roles');
      return false;
    }
    
    // Update the user's role in Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      role: 'admin',
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    }, { merge: true });
    
    // Create an audit log entry
    const auditRef = doc(db, 'audit_logs', `role_change_${Date.now()}`);
    await setDoc(auditRef, {
      action: 'role_change',
      targetUser: userId,
      newRole: 'admin',
      performedBy: auth.currentUser.uid,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error setting admin role:', error);
    return false;
  }
};