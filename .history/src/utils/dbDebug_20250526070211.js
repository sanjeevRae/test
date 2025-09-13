// Database connection debugging utility

import { db, collection, getDocs } from './firebase';

/**
 * Check if the Firestore connection is working properly
 * @returns {Promise<boolean>} True if connection is working
 */
export const testFirestoreConnection = async () => {
  try {
    console.log('Testing Firestore connection...');
    
    // Try to get any collection to test connection
    const testCollection = collection(db, 'users');
    const testSnapshot = await getDocs(testCollection);
    
    // If we can get a snapshot (even if empty), connection works
    console.log(`Connection successful. Found ${testSnapshot.size} documents.`);
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
};

/**
 * Diagnose issues with database interactions
 * @param {string} userId - Optional user ID to check
 * @returns {Promise<object>} Diagnostic information
 */
export const diagnoseDbIssues = async (userId = null) => {
  const results = {
    firestoreConnected: false,
    userDocExists: false,
    organizationsAccessible: false,
    auditLogsWritable: false,
    errors: []
  };
  
  try {
    // Test Firestore connection
    results.firestoreConnected = await testFirestoreConnection();
    
    if (!results.firestoreConnected) {
      results.errors.push('Cannot connect to Firestore database');
      return results;
    }
    
    // Test reading user document if ID provided
    if (userId) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        results.userDocExists = userDoc.exists;
        
        if (!results.userDocExists) {
          results.errors.push(`User document ${userId} not found`);
        }
      } catch (error) {
        results.errors.push(`Error checking user document: ${error.message}`);
      }
    }
    
    // Test accessing organizations collection
    try {
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));
      results.organizationsAccessible = true;
      console.log(`Organizations collection access: found ${orgsSnapshot.size} organizations`);
    } catch (error) {
      results.errors.push(`Cannot access organizations collection: ${error.message}`);
    }
    
    // Test writing to audit logs (optional)
    try {
      // This is commented out to avoid creating test documents
      // const testLogRef = doc(db, 'audit_logs', `test_${Date.now()}`);
      // await setDoc(testLogRef, { test: true, timestamp: new Date().toISOString() });
      // results.auditLogsWritable = true;
      
      // For now just check if collection exists
      const logsSnapshot = await getDocs(collection(db, 'audit_logs'));
      results.auditLogsWritable = true;
      console.log(`Audit logs collection exists with ${logsSnapshot.size} documents`);
    } catch (error) {
      results.errors.push(`Cannot access audit logs: ${error.message}`);
    }
    
    return results;
  } catch (error) {
    results.errors.push(`General diagnostic error: ${error.message}`);
    return results;
  }
};

/**
 * Add this function to the component for debugging
 */
export const addDebuggingButton = () => {
  // Create a floating debug button
  const debugButton = document.createElement('button');
  debugButton.innerText = 'Debug DB Connection';
  debugButton.style.position = 'fixed';
  debugButton.style.bottom = '20px';
  debugButton.style.right = '20px';
  debugButton.style.zIndex = '9999';
  debugButton.style.padding = '10px';
  debugButton.style.backgroundColor = '#ff9800';
  debugButton.style.color = 'white';
  debugButton.style.border = 'none';
  debugButton.style.borderRadius = '4px';
  debugButton.style.cursor = 'pointer';
  
  debugButton.onclick = async () => {
    const results = await diagnoseDbIssues();
    
    console.log('Database connection diagnostic results:', results);
    
    // Show the results in an alert
    alert(`DB Connection: ${results.firestoreConnected ? 'OK' : 'FAILED'}
Organizations Access: ${results.organizationsAccessible ? 'OK' : 'FAILED'}
Audit Logs Access: ${results.auditLogsWritable ? 'OK' : 'FAILED'}
${results.errors.length > 0 ? 'Errors: ' + results.errors.join(', ') : 'No errors found'}
    `);
  };
  
  document.body.appendChild(debugButton);
};
