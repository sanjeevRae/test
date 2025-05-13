// Auth utility functions for role-based access control
import { auth, db, doc, getDoc, setDoc } from './firebase';

/**
 * Check if the current user has admin privileges using Firebase custom claims
 * @returns {Promise<boolean>} True if the user has admin privileges
 */
export const isUserAdmin = async () => {
  try {
    if (!auth.currentUser) return false;
    
    // Force refresh to get the latest claims
    await auth.currentUser.getIdToken(true);
    
    // Get the ID token result which includes custom claims
    const tokenResult = await auth.currentUser.getIdTokenResult();
    
    // Check if the admin claim exists and is true
    return tokenResult?.claims?.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get the current user's role from Firebase claims
 * @returns {Promise<string>} The user's role ('admin' or 'user')
 */
export const getUserRole = async () => {
  try {
    if (!auth.currentUser) return 'user';
    
    // Force refresh to get the latest claims
    await auth.currentUser.getIdToken(true);
    
    // Get the ID token result which includes custom claims
    const tokenResult = await auth.currentUser.getIdTokenResult();
    
    // Return admin if the claim exists, otherwise return 'user'
    return tokenResult?.claims?.admin === true ? 'admin' : 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};

/**
 * Synchronizes Firestore role with custom claims to ensure consistency
 * This should be called after login or when a role might have changed
 */
export const syncUserRole = async () => {
  try {
    if (!auth.currentUser) return;
    
    // First get current claims from token
    await auth.currentUser.getIdToken(true); // Force refresh
    const tokenResult = await auth.currentUser.getIdTokenResult();
    const isAdminInClaims = tokenResult?.claims?.admin === true;
    
    // Then get role from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return;
    
    const userData = userDoc.data();
    const isAdminInFirestore = userData.role === 'admin';
    
    // If there's a mismatch between claims and Firestore,
    // update Firestore to match claims (since claims are the source of truth)
    if (isAdminInClaims !== isAdminInFirestore) {
      await setDoc(userRef, {
        role: isAdminInClaims ? 'admin' : 'user'
      }, { merge: true });
      
      console.log(`Role synced for user ${auth.currentUser.uid, admin: ${isAdminInClaims}`);
    }
    
    return isAdminInClaims ? 'admin' : 'user';
  } catch (error) {
    console.error('Error syncing user role:', error);
    return null;
  }
};