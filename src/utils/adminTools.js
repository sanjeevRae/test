// Admin tools for managing user roles directly
import { auth, db, doc, setDoc, getDoc } from './firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';


export const makeUserAdmin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    
    await setDoc(userRef, { role: 'admin' }, { merge: true });
    console.log(`Updated Firestore role for user ${userId} to admin`);
    
 
    const functions = getFunctions();
    const setAdminRole = httpsCallable(functions, 'setAdminRole');
    
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

export const fixAdminStatus = async () => {
  const specificUserId = "";
  return await makeUserAdmin(specificUserId);
};