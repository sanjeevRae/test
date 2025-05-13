// Auth utility functions for role-based access control
import { auth } from './firebase';

/**
 * Check if the current user has admin privileges using Firebase custom claims
 * @returns {Promise<boolean>} True if the user has admin privileges
 */
export const isUserAdmin = async () => {
  try {
    // Force refresh to get the latest claims
    await auth.currentUser?.getIdToken(true);
    
    // Get the ID token result which includes custom claims
    const tokenResult = await auth.currentUser?.getIdTokenResult();
    
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
    // Force refresh to get the latest claims
    await auth.currentUser?.getIdToken(true);
    
    // Get the ID token result which includes custom claims
    const tokenResult = await auth.currentUser?.getIdTokenResult();
    
    // Return admin if the claim exists, otherwise return 'user'
    return tokenResult?.claims?.admin === true ? 'admin' : 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};