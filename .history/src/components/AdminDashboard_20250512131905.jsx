import React, { useEffect, useState } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const usersCol = collection(db, 'profiles');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleStatusChange = async (uid, status) => {
    await updateDoc(doc(db, 'profiles', uid), { status });
    setUsers(users => users.map(u => u.id === uid ? { ...u, status } : u));
  };

  const handleCategoryChange = async (uid, category) => {
    await updateDoc(doc(db, 'profiles', uid), { category });
    setUsers(users => users.map(u => u.id === uid ? { ...u, category } : u));
  };

  const handleSubscriptionChange = async (uid, duration) => {
    // Calculate new expiration date
    const now = new Date();
    let expiresAt = null;
    if (duration !== 'none') {
      expiresAt = new Date(now.setMonth(now.getMonth() + parseInt(duration)));
    }
    await updateDoc(doc(db, 'profiles', uid), { subscriptionExpires: expiresAt ? expiresAt.toISOString() : null });
    setUsers(users => users.map(u => u.id === uid ? { ...u, subscriptionExpires: expiresAt ? expiresAt.toISOString() : null } : u));
  };

  const generateQRCode = (value) => {
    // Simple QR code placeholder with URL
    return (
      <div className="qr-code-container">
        <div className="qr-code-placeholder">QR</div>
        <a href={value} target="_blank" rel="noopener noreferrer" className="qr-download-link">
          View
        </a>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Total Cards</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.category === 'Premium').length}</div>
              <div className="stat-label">Premium Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.category === 'Executive').length}</div>
              <div className="stat-label">Executive Users</div>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Share URL</th>
                  <th>QR Code</th>
                  <th>Subscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="user-name-cell">
                      {user.photoURL && <img src={user.photoURL} alt={user.name} className="user-thumbnail" />}
                      <span>{user.name || 'Unnamed User'}</span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select 
                        value={user.category || 'Basic'} 
                        onChange={e => handleCategoryChange(user.id, e.target.value)}
                        className="admin-select"
                      >
                        <option value="Basic">Basic</option>
                        <option value="Premium">Premium</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        value={user.status || 'active'} 
                        onChange={e => handleStatusChange(user.id, e.target.value)}
                        className="admin-select"
                      >
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td>
                      <a 
                        href={`${window.location.origin}/card/${user.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="share-link"
                      >
                        Share Link
                      </a>
                    </td>
                    <td>
                      {generateQRCode(`${window.location.origin}/card/${user.id}`)}
                    </td>
                    <td>
                      <select 
                        value={user.subscriptionExpires ? 'active' : 'none'} 
                        onChange={e => handleSubscriptionChange(user.id, e.target.value)}
                        className="admin-select"
                      >
                        <option value="none">No Subscription</option>
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="12">12 Months</option>
                      </select>
                      {user.subscriptionExpires && 
                        <div className="expiration-date">
                          Expires: {new Date(user.subscriptionExpires).toLocaleDateString()}
                        </div>
                      }
                    </td>
                    <td>
                      <button className="action-button">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="no-users-message">
              <p>No users found in the database</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
