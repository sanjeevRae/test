import React, { useState } from 'react';
import { setAdminRole } from '../utils/auth';

/**
 * A utility component to fix admin status issues - Spark plan version
 * This uses client-side role management instead of Cloud Functions
 */
const AdminTools = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userId, setUserId] = useState('UIdyrGgpmRSJ8YOH70ISSCTablI2_1747037863598');

  const handleFixAdminStatus = async () => {
    setLoading(true);
    try {
      const success = await setAdminRole(userId);
      setResult({
        success,
        message: success 
          ? 'Successfully updated admin status in Firestore! Please logout and login again to apply changes.' 
          : 'Failed to update admin status. Make sure you have admin privileges.'
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px auto',
      maxWidth: '600px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#1a202c' }}>Admin Tools</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', color: '#2d3748' }}>Fix Admin Status</h3>
        <p style={{ marginBottom: '15px', color: '#4a5568' }}>
          Use this tool to fix the admin status for specific users (Spark plan compatible version)
        </p>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="userId" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4a5568' }}>
            User ID to promote to admin:
          </label>
          <input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #cbd5e0',
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          />
        </div>
        <button 
          onClick={handleFixAdminStatus}
          disabled={loading || !userId.trim()}
          style={{
            padding: '10px 15px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !userId.trim() ? 0.7 : 1
          }}
        >
          {loading ? 'Updating...' : 'Make Admin'}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: result.success ? '#c6f6d5' : '#fed7d7',
          borderRadius: '4px',
          color: result.success ? '#22543d' : '#9b2c2c'
        }}>
          {result.message}
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#718096' }}>
        <p>Spark Plan Limitations:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>This implementation uses Firestore directly instead of Cloud Functions</li>
          <li>After making a user admin, they need to logout and login again to see the admin dashboard</li>
          <li>The role change is protected by Firestore security rules</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminTools;