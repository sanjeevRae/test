// Admin tools for managing user roles directly
import { auth, db, doc, setDoc, getDoc } from './firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Manually set admin privileges for a specific user
 * This is a temporary utility function to fix role issues
 */
export const makeUserAdmin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // First update the role in Firestore
    await setDoc(userRef, { role: 'admin' }, { merge: true });
    console.log(`Updated Firestore role for user ${userId} to admin`);
    
    // The syncUserRoles cloud function should automatically update the custom claims
    // But we can also trigger a manual function call to ensure it happens immediately
    const functions = getFunctions();
    const setAdminRole = httpsCallable(functions, 'setAdminRole');
    
    // Attempt to call the cloud function (may fail if you don't have permission)
    try {
      await setAdminRole({ uid: userId, isAdmin: true });
      console.log('Successfully called setAdminRole function');
    } catch (functionError) {
      console.warn('Could not call cloud function. This is expected if you are not a superadmin:', functionError);
      console.log('The role change will still take effect through the syncUserRoles trigger');
    }
    
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
};

/**
 * Fix admin claims for the specific user mentioned in your issue
 * This is a direct fix for the user with UID "UIdyrGgpmRSJ8YOH70ISSCTablI2_1747037863598"
 */
export const fixAdminStatus = async () => {
  const specificUserId = "UIdyrGgpmRSJ8YOH70ISSCTablI2_1747037863598";
  return await makeUserAdmin(specificUserId);
};