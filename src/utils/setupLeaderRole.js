// This script helps ensure that leader roles can be properly set
// You can run this directly in the browser console when logged in

(async function() {
  // Import auth utilities
  const { auth, db, doc, getDoc, setDoc } = await import('./utils/firebase.js');
  
  console.log('Setting current user as leader for testing...');
  
  if (!auth.currentUser) {
    console.error('No user is logged in. Please log in first.');
    return;
  }
  
  try {
    // Create a test organization if needed
    const testOrgId = 'test_leader_org';
    const orgRef = doc(db, 'organizations', testOrgId);
    
    // Set up test organization
    await setDoc(orgRef, {
      id: testOrgId,
      name: 'Test Leader Organization',
      description: 'Organization for testing leader role',
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser.uid,
      status: 'active'
    }, { merge: true });
    
    console.log('Test organization created or updated:', testOrgId);
    
    // Set current user as leader
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userRef, {
      role: 'leader',
      organizationId: testOrgId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('User updated with leader role:', auth.currentUser.uid);
    
    // Add user to organization members collection
    const memberRef = doc(db, 'organizations', testOrgId, 'members', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    await setDoc(memberRef, {
      userId: auth.currentUser.uid,
      role: 'leader',
      email: auth.currentUser.email,
      name: userData.name || auth.currentUser.email.split('@')[0] || 'Leader User',
      addedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('User added to organization members collection');
    
    // Log current status
    console.log('Leader role setup complete. Try refreshing the page and accessing the Leader Dashboard.');
  } catch (error) {
    console.error('Error setting up leader role:', error);
  }
})();
