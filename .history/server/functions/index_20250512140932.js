const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Secure function to set admin claims
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'The function must be called while authenticated.'
    );
  }
  
  // Only allow this operation from authorized users (superadmins)
  const callerUid = context.auth.uid;
  const callerData = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerData.exists || !callerData.data().superadmin) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only superadmins can assign admin roles.'
    );
  }

  // Get the target user
  const { uid, isAdmin } = data;
  
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  try {
    // Set custom claim on the target user
    await admin.auth().setCustomUserClaims(uid, { admin: !!isAdmin });
    
    // Update the user document in Firestore to reflect the change
    await admin.firestore().collection('users').doc(uid).update({
      role: isAdmin ? 'admin' : 'user',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Function to verify a user's email address and set initial claims
exports.processNewUser = functions.auth.user().onCreate(async (user) => {
  // Check if the user email is an admin email (this is just a temporary setup mechanism)
  const isAdmin = user.email.toLowerCase() === 'admin@evox.com';
  
  try {
    // Set custom claims for the new user
    await admin.auth().setCustomUserClaims(user.uid, { 
      admin: isAdmin
    });
    
    // Create or update the user document in Firestore
    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      name: user.displayName || '',
      role: isAdmin ? 'admin' : 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      cards: []
    }, { merge: true });
    
    return null;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return null;
  }
});

// This function listens for changes to user roles in Firestore and updates custom claims accordingly
exports.syncUserRoles = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();
    
    // Only proceed if the role field has changed
    if (before.role === after.role) {
      return null;
    }
    
    try {
      // Update the user's custom claims based on the new role
      const isAdmin = after.role === 'admin';
      await admin.auth().setCustomUserClaims(userId, { admin: isAdmin });
      
      console.log(`Updated custom claims for user ${userId}, admin: ${isAdmin}`);
      return null;
    } catch (error) {
      console.error('Error updating custom claims:', error);
      return null;
    }
  });