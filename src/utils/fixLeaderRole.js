// This script can be pasted into the browser console to debug leader role issues

(async function() {
  // Check Firebase auth user
  console.log("Checking current user...");
  
  try {
    // Import Firebase auth
    const { auth, db, doc, getDoc, setDoc } = await import('./utils/firebase.js');
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error("No user is logged in");
      return;
    }
    
    console.log("Current user:", currentUser.email);
    
    // Check user role in Firestore
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("User document not found in Firestore");
      return;
    }
    
    const userData = userDoc.data();
    console.log("User data:", userData);
    
    // Create test organization if needed
    console.log("Creating test organization...");
    const testOrgId = 'test_leader_org';
    const orgRef = doc(db, 'organizations', testOrgId);
    
    await setDoc(orgRef, {
      id: testOrgId,
      name: 'Test Leader Organization',
      description: 'Organization for testing leader role',
      createdAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      status: 'active'
    }, { merge: true });
    
    // Set user as leader
    console.log("Setting user as leader...");
    await setDoc(userRef, {
      role: 'leader',
      organizationId: testOrgId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    // Add user to organization members collection
    console.log("Adding user to organization members collection...");
    const memberRef = doc(db, 'organizations', testOrgId, 'members', currentUser.uid);
    
    await setDoc(memberRef, {
      userId: currentUser.uid,
      role: 'leader',
      email: currentUser.email,
      name: userData.name || currentUser.email.split('@')[0] || 'Leader User',
      addedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log("Leader role setup complete!");
    console.log("Refresh the page and try accessing the leader dashboard.");
    
    // Alert the user
    alert("Leader role has been set up. Please refresh the page.");
  } catch (error) {
    console.error("Error setting up leader role:", error);
  }
})();
