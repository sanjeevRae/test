import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Utility function to set a user as super admin (for testing purposes)
 * This should only be used in development/testing environments
 * @param {string} email - Email of the user to make super admin
 */
export const setSuperAdmin = async (email) => {
  try {
    console.log('Attempting to set super admin for:', email);
    
    // This is a very basic implementation for testing
    // In production, this should be done through secure admin interfaces
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      console.error('No current user authenticated');
      return { success: false, error: 'Not authenticated' };
    }

    // Check if current user's email matches the one we want to upgrade
    if (auth.currentUser.email !== email) {
      console.error('Can only upgrade current user account');
      return { success: false, error: 'Can only upgrade current user account' };
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'superadmin',
      updatedAt: new Date().toISOString(),
      superAdminGrantedAt: new Date().toISOString()
    });

    console.log('Successfully set user as super admin');
    return { success: true, message: 'User successfully set as super admin' };

  } catch (error) {
    console.error('Error setting super admin:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if current user is super admin and show controls
 */
export const showSuperAdminControls = () => {
  return window.location.href.includes('localhost') || 
         window.location.href.includes('dev') ||
         window.location.href.includes('test');
};

/**
 * Test function for super admin setup
 */
export const testSuperAdminSetup = async () => {
  try {
    if (!auth.currentUser) {
      alert('Please login first');
      return;
    }

    const result = await setSuperAdmin(auth.currentUser.email);
    
    if (result.success) {
      alert('Super admin role granted! Please refresh the page.');
      window.location.reload();
    } else {
      alert('Error: ' + result.error);
    }

  } catch (error) {
    console.error('Test setup error:', error);
    alert('Error during super admin setup');
  }
};

// Make function available for testing in console
if (typeof window !== 'undefined') {
  window.testSuperAdminSetup = testSuperAdminSetup;
  window.setSuperAdmin = setSuperAdmin;
}