import React, { useState } from 'react';
import { fixAdminStatus } from '../utils/adminTools';

/**
 * A utility component to fix admin status issues
 * This is a temporary component for troubleshooting
 */
const AdminTools = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFixAdminStatus = async () => {
    setLoading(true);
    try {
      const success = await fixAdminStatus();
      setResult({
        success,
        message: success 
          ? 'Successfully updated admin status! Please logout and login again to apply changes.' 
          : 'Failed to update admin status.'
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
          Use this button to fix the admin status for user with ID: UIdyrGgpmRSJ8YOH70ISSCTablI2_1747037863598
        </p>
        <button 
          onClick={handleFixAdminStatus}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Updating...' : 'Fix Admin Status'}
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
        <p>After fixing the admin status:</p>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Sign out from your current session</li>
          <li>Sign back in using your admin credentials</li>
          <li>You should now be redirected to the admin dashboard</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminTools;