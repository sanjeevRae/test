const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// IP-based rate limiting to prevent brute force attacks
const ipRequestCounts = {};
const MAX_REQUESTS_PER_MINUTE = 30;

// Function to check rate limits
function checkRateLimit(ip) {
  const now = Date.now();
  const minute = Math.floor(now / 60000); // Current minute
  
  if (!ipRequestCounts[ip]) {
    ipRequestCounts[ip] = { count: 0, minute };
  } else if (ipRequestCounts[ip].minute !== minute) {
    ipRequestCounts[ip] = { count: 0, minute };
  }
  
  ipRequestCounts[ip].count++;
  
  if (ipRequestCounts[ip].count > MAX_REQUESTS_PER_MINUTE) {
    throw new functions.https.HttpsError(
      'resource-exhausted', 
      'Too many requests, please try again later.'
    );
  }
}

// Helper function to validate user input
function validateInput(data, schema) {
  for (const [key, requirements] of Object.entries(schema)) {
    // Check if required field is present
    if (requirements.required && (data[key] === undefined || data[key] === null)) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        `Missing required field: ${key}`
      );
    }
    
    // Check field type
    if (data[key] !== undefined && requirements.type && typeof data[key] !== requirements.type) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        `Field ${key} must be of type ${requirements.type}`
      );
    }
    
    // Check string length
    if (requirements.type === 'string' && data[key] && 
        (requirements.minLength && data[key].length < requirements.minLength || 
         requirements.maxLength && data[key].length > requirements.maxLength)) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        `Field ${key} must be between ${requirements.minLength || 0} and ${requirements.maxLength || 'unlimited'} characters`
      );
    }
  }
  return true;
}

// Enhanced admin verification with IP monitoring
async function verifyAdmin(context, ip) {
  // Check authentication
  if (!context.auth) {
    console.warn(`Unauthenticated admin access attempt from IP: ${ip}`);
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'Authentication required.'
    );
  }
  
  const { uid } = context.auth;
  
  // Rate limiting based on IP for admin operations
  checkRateLimit(ip);
  
  // Get token claims to verify admin status
  const idTokenResult = await admin.auth().getUser(uid);
  const customClaims = idTokenResult.customClaims || {};
  
  if (!customClaims.admin) {
    // Log unauthorized admin access attempts
    console.warn(`Unauthorized admin access attempt by user: ${uid} from IP: ${ip}`);
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Admin privileges required.'
    );
  }
  
  return uid;
}

// Secure function to set admin claims with enhanced security and audit logging
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  const ip = context.rawRequest.ip || 'unknown';
  
  try {
    // Validate input
    validateInput(data, {
      uid: { required: true, type: 'string', minLength: 10 },
      isAdmin: { required: true, type: 'boolean' }
    });
    
    // More thorough admin verification
    await verifyAdmin(context, ip);
    
    // Get the target user
    const { uid, isAdmin } = data;
    
    // Verify user exists
    try {
      await admin.auth().getUser(uid);
    } catch (error) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    // Set custom claim
    await admin.auth().setCustomUserClaims(uid, { admin: !!isAdmin });
    
    // Update Firestore with audit trail
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.update({
      role: isAdmin ? 'admin' : 'user',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid,
      updateSource: 'Cloud Function'
    });
    
    // Create audit log for security monitoring
    await admin.firestore().collection('audit_logs').add({
      action: 'role_change',
      targetUser: uid,
      newRole: isAdmin ? 'admin' : 'user',
      performedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: ip
    });
    
    console.log(`Admin role ${isAdmin ? 'granted to' : 'revoked from'} user ${uid} by ${context.auth.uid}`);
    return { success: true };
  } catch (error) {
    console.error('Error in setAdminRole:', error);
    throw error;
  }
});

// Enhanced new user processing with security checks
exports.processNewUser = functions.auth.user().onCreate(async (user) => {
  try {
    const { uid, email, displayName } = user;
    
    // Check for suspicious email patterns (add more patterns as needed)
    const suspiciousPatterns = [
      /admin.*@(?!evox\.com$)/i,  // Blocks emails with "admin" unless they're from evox.com
      /[^a-zA-Z0-9.@_-]/g,       // Checks for unusual characters in email
    ];
    
    let isSuspicious = false;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(email)) {
        isSuspicious = true;
        break;
      }
    }
    
    // Check if this is the official admin email
    const isAdmin = email.toLowerCase() === 'admin@evox.com';
    
    // Set initial claims
    await admin.auth().setCustomUserClaims(uid, { 
      admin: isAdmin,
      verified: false
    });
    
    // Create user document with security flags if suspicious
    await admin.firestore().collection('users').doc(uid).set({
      email: email,
      name: displayName || '',
      role: isAdmin ? 'admin' : 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      cards: [],
      flags: isSuspicious ? ['suspicious_email'] : [],
      status: isSuspicious ? 'review' : 'active'
    });
    
    // Log new user creation for audit
    await admin.firestore().collection('audit_logs').add({
      action: 'user_created',
      user: uid,
      email: email,
      isAdmin: isAdmin,
      isSuspicious: isSuspicious,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return null;
  } catch (error) {
    console.error('Error processing new user:', error);
    return null;
  }
});

// Secure role synchronization with audit logging
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
      await admin.auth().setCustomUserClaims(userId, { 
        admin: isAdmin,
        // Preserve other claims by getting current user
        ...(await admin.auth().getUser(userId)).customClaims
      });
      
      // Create audit log for role change
      await admin.firestore().collection('audit_logs').add({
        action: 'role_sync',
        user: userId,
        previousRole: before.role,
        newRole: after.role,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: 'database_trigger'
      });
      
      console.log(`Updated custom claims for user ${userId}, admin: ${isAdmin}`);
      return null;
    } catch (error) {
      console.error('Error updating custom claims:', error);
      return null;
    }
  });

// Secure data cleanup for deleted users to prevent data leakage
exports.cleanupDeletedUser = functions.auth.user().onDelete(async (user) => {
  try {
    const { uid } = user;
    
    // Get user data for backup before deletion
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Create backup record
      await admin.firestore().collection('deleted_users').doc(uid).set({
        email: user.email,
        userData: userData,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Delete user's cards
      if (userData.cards && Array.isArray(userData.cards)) {
        const batch = admin.firestore().batch();
        for (const cardId of userData.cards) {
          const cardRef = admin.firestore().collection('profiles').doc(cardId);
          batch.delete(cardRef);
        }
        await batch.commit();
      }
      
      // Delete user document
      await userRef.delete();
      
      // Delete analytics
      const analyticsRef = admin.firestore().collection('analytics').doc(uid);
      await analyticsRef.delete();
      
      // Log user deletion for audit
      await admin.firestore().collection('audit_logs').add({
        action: 'user_deleted',
        userId: uid,
        email: user.email,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return null;
  } catch (error) {
    console.error('Error cleaning up deleted user:', error);
    return null;
  }
});

// Add a function to scan and monitor for security threats
exports.securityScan = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    // Check for suspicious admin promotions
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const suspiciousRoleChanges = await admin.firestore()
      .collection('audit_logs')
      .where('action', '==', 'role_change')
      .where('newRole', '==', 'admin')
      .where('timestamp', '>=', yesterday)
      .get();
    
    if (!suspiciousRoleChanges.empty) {
      // Create security alert for admin review
      await admin.firestore().collection('security_alerts').add({
        type: 'admin_promotion',
        count: suspiciousRoleChanges.size,
        details: suspiciousRoleChanges.docs.map(doc => doc.data()),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'unresolved'
      });
    }
    
    // Check for multiple failed login attempts
    // This would require implementing login failure logging in your app
    
    return null;
  } catch (error) {
    console.error('Error in security scan:', error);
    return null;
  }
});

// Note: uploadToCloudinary function has been removed as we're now using direct client-side uploads to Cloudinary.
// Client implementation can be found in src/utils/firebase.js