import React, { useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  getUserRole, 
  isUserLeader, 
  isUserAdmin,
  getUserOrganization,
  setUserRole 
} from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { createSampleOrganizationForLeader } from '../utils/leaderUtils';

const RoleDebugger = () => {
  const [currentRole, setCurrentRole] = useState('loading...');
  const [isLeader, setIsLeader] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [permissionResults, setPermissionResults] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    checkUserRolesFromFirestore();
  }, []);

  const checkUserRolesFromFirestore = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        setMessage('No user is logged in');
        setLoading(false);
        return;
      }
      
      // Get user document from Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setMessage('User document not found in Firestore');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      const firestoreRole = userData.role || 'user';
      const orgId = userData.organizationId || null;
      
      // Check organization access if role is leader
      let orgName = null;
      if (firestoreRole === 'leader' && !orgId) {
        setMessage('Firestore role is leader but no organization ID is assigned. Please use the Admin Dashboard to assign an organization.');
      } else if (firestoreRole === 'leader' && orgId) {
        // Get organization details
        const orgRef = doc(db, 'organizations', orgId);
        const orgDoc = await getDoc(orgRef);
        
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          orgName = orgData.name;
          setMessage(`Firestore role: ${firestoreRole}, Organization: ${orgName || orgId}`);
        } else {
          setMessage(`Firestore role: ${firestoreRole}, but organization ${orgId} not found`);
        }
      } else {
        setMessage(`Firestore role: ${firestoreRole}, Organization ID: ${orgId || 'None'}`);
      }
      
      // Update the state variables
      setCurrentRole(firestoreRole);
      setOrganization(orgId);
      setIsLeader(firestoreRole === 'leader');
      setIsAdmin(firestoreRole === 'admin');
    } catch (error) {
      console.error('Error checking Firestore role:', error);
      setMessage(`Error checking Firestore: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSetRole = async (role) => {
    try {
      setLoading(true);
      setMessage(`Setting role to ${role}...`);
      
      // Use mock organization ID for testing
      const testOrgId = 'test_leader_org';
      
      const result = await setUserRole(
        auth.currentUser.uid, 
        role,
        role !== 'admin' ? testOrgId : null
      );
      
      if (result.success) {
        setMessage(`Role updated to ${role}. Refreshing...`);
        // Refresh the page to apply the new role
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(`Failed to update role: ${result.error}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error setting role:', error);
      setMessage(`Error: ${error.message}`);
      setLoading(false);
    }
  };
  
  const handleCreateSampleOrg = async () => {
    try {
      setLoading(true);
      setMessage('Creating a sample organization...');
      
      const result = await createSampleOrganizationForLeader();
      
      if (result.success) {
        setMessage(`${result.message}. Refreshing...`);
        // Refresh the page to apply the changes
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(`Failed to create organization: ${result.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating sample organization:', error);
      setMessage(`Error: ${error.message}`);
      setLoading(false);
    }
  };
  
  // Method to test all permissions at once
  const testAllPermissions = async () => {
    setLoading(true);
    setMessage('Testing all permissions...');
    
    try {
      // Import the checkUserAccess function
      const { checkUserAccess } = await import('../utils/auth');
      
      // Define all actions to test
      const actions = [
        'view_profile',
        'edit_profile',
        'view_organization',
        'manage_organization',
        'view_users',
        'edit_user',
        'add_user',
        'remove_user'
      ];
      
      // Test each action
      const results = {};
      for (const action of actions) {
        const hasPermission = await checkUserAccess(
          action, 
          organization || 'test_org_id', 
          action.includes('profile') ? auth.currentUser?.uid : 'test_user_id'
        );
        
        results[action] = hasPermission;
      }
      
      // Store results in state
      setPermissionResults(results);
      
      setMessage(`Permission test results complete`);
    } catch (error) {
      console.error('Error testing permissions:', error);
      setMessage(`Error testing permissions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="role-debugger">Loading...</div>;
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '40px auto', 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '10px', color: '#343a40' }}>
        Role Debugger & Access Control Test
      </h2>
      
      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Current User Status</h3>
        <p><strong>User ID:</strong> {auth.currentUser?.uid || 'Not logged in'}</p>
        <p><strong>Email:</strong> {auth.currentUser?.email || 'N/A'}</p>
        <p><strong>Current Role:</strong> <span style={{ 
          fontWeight: 'bold',
          color: currentRole === 'admin' ? '#2b6cb0' : 
                 currentRole === 'leader' ? '#38a169' : '#718096'
        }}>{currentRole}</span></p>
        <p><strong>Organization:</strong> {organization || 'None'}</p>
        <p><strong>Admin Status:</strong> <span style={{ color: isAdmin ? 'green' : 'red' }}>{isAdmin ? '✓ Yes' : '✗ No'}</span></p>
        <p><strong>Leader Status:</strong> <span style={{ color: isLeader ? 'green' : 'red' }}>{isLeader ? '✓ Yes' : '✗ No'}</span></p>
      </div>      {currentRole === 'leader' && !organization && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#fed7d7', 
          borderRadius: '4px',
          border: '1px solid #fc8181'
        }}>
          <h4 style={{ color: '#e53e3e', marginTop: 0 }}>Leader Organization Issue Detected</h4>
          <p>You have the leader role but no organization is assigned. This is why you can't access the Leader Dashboard.</p>
          <button 
            onClick={handleCreateSampleOrg} 
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '10px'
            }}
          >
            Create Sample Organization & Fix Role
          </button>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '10px', color: '#495057' }}>Role Testing Tools</h3>
        {message && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            backgroundColor: message.includes('Error') ? '#fed7d7' : '#c6f6d5',
            borderRadius: '4px'
          }}>
            {message}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleSetRole('admin')} 
            disabled={loading || currentRole === 'admin'}
            style={{
              padding: '8px 16px',
              backgroundColor: currentRole === 'admin' ? '#cbd5e0' : '#2b6cb0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || currentRole === 'admin' ? 'not-allowed' : 'pointer',
              opacity: loading || currentRole === 'admin' ? 0.7 : 1
            }}
          >
            Set as Admin
          </button>
          
          <button 
            onClick={() => handleSetRole('leader')} 
            disabled={loading || currentRole === 'leader'}
            style={{
              padding: '8px 16px',
              backgroundColor: currentRole === 'leader' ? '#cbd5e0' : '#38a169',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || currentRole === 'leader' ? 'not-allowed' : 'pointer',
              opacity: loading || currentRole === 'leader' ? 0.7 : 1
            }}
          >
            Set as Leader
          </button>
          
          <button 
            onClick={() => handleSetRole('user')} 
            disabled={loading || currentRole === 'user'}
            style={{
              padding: '8px 16px',
              backgroundColor: currentRole === 'user' ? '#cbd5e0' : '#718096',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || currentRole === 'user' ? 'not-allowed' : 'pointer',
              opacity: loading || currentRole === 'user' ? 0.7 : 1
            }}
          >
            Set as Regular User
          </button>
        </div>
      </div>      
      
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '10px', color: '#495057' }}>Test Organization Access</h3>
        <button 
          onClick={() => {
            navigate('/organizations');
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Go to Organization Management
        </button>
        
        <button 
          onClick={() => {
            navigate('/leader');
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#38a169',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Leader Dashboard
        </button>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '10px', color: '#495057' }}>Firebase Role Verification</h3>
        <button 
          onClick={checkUserRolesFromFirestore}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Verify Firestore Role
        </button>
        
        <button 
          onClick={testAllPermissions}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#805ad5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginLeft: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Test All Permissions
        </button>
      </div>
      
      {/* Permission Results Table */}
      {Object.keys(permissionResults).length > 0 && (
        <div style={{ marginTop: '30px', overflowX: 'auto' }}>
          <h3 style={{ marginBottom: '10px', color: '#495057' }}>Permission Results</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', backgroundColor: '#f7fafc' }}>Action</th>
                <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', backgroundColor: '#f7fafc' }}>Status</th>
                <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', backgroundColor: '#f7fafc' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissionResults).map(([action, hasPermission]) => (
                <tr key={action}>
                  <td style={{ border: '1px solid #e2e8f0', padding: '10px' }}>{action}</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '10px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: hasPermission ? '#c6f6d5' : '#fed7d7',
                      color: hasPermission ? '#22543d' : '#822727'
                    }}>
                      {hasPermission ? 'GRANTED' : 'DENIED'}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '10px' }}>
                    {action === 'view_profile' && 'View user profiles'}
                    {action === 'edit_profile' && 'Edit own profile'}
                    {action === 'view_organization' && 'View organization details'}
                    {action === 'manage_organization' && 'Manage organization settings'}
                    {action === 'view_users' && 'View users in organization'}
                    {action === 'edit_user' && 'Edit users in organization'}
                    {action === 'add_user' && 'Add new users to organization'}
                    {action === 'remove_user' && 'Remove users from organization'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RoleDebugger;
