import React, { useEffect, useState } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, getDocs, doc, updateDoc, getDoc, where, query } from 'firebase/firestore';
import { isUserAdmin } from '../utils/auth';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, active, suspended, expired
  const [searchTerm, setSearchTerm] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Check if the current user has admin privileges
      const isAdmin = await isUserAdmin();
      
      if (!isAdmin) {
        // Redirect non-admin users
        navigate('/dashboard');
        return;
      }
      
      setAuthorized(true);
      fetchUsers();
    };
    
    const fetchUsers = async () => {
      setLoading(true);
      
      try {
        // Fetch all users from the users collection (not just profiles)
        const usersCol = collection(db, 'users');
        const userSnapshot = await getDocs(usersCol);
        const usersList = [];
        
        // For each user, get their profile information
        for (const userDoc of userSnapshot.docs) {
          const userData = userDoc.data();
          
          // Get all cards associated with this user
          if (userData.cards && userData.cards.length > 0) {
            for (const cardId of userData.cards) {
              const cardRef = doc(db, 'profiles', cardId);
              const cardSnap = await getDoc(cardRef);
              
              if (cardSnap.exists()) {
                usersList.push({
                  id: cardId,
                  userId: userDoc.id,
                  userEmail: userData.email,
                  userName: userData.name,
                  ...cardSnap.data(),
                });
              }
            }
          } else {
            // Users without cards
            usersList.push({
              id: userDoc.id,
              userId: userDoc.id,
              userEmail: userData.email,
              userName: userData.name,
              status: 'active',
              category: 'Basic',
              subscriptionExpires: null,
            });
          }
        }
        
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);

  // Filter users based on active tab and search term
  const filteredUsers = users.filter(user => {
    // First filter by tab
    if (activeTab === 'active' && user.status !== 'active') return false;
    if (activeTab === 'suspended' && user.status !== 'suspended') return false;
    if (activeTab === 'blocked' && user.status !== 'blocked') return false;
    if (activeTab === 'expired') {
      // Check if subscription is expired
      if (!user.subscriptionExpires) return false;
      const now = new Date();
      const expiryDate = new Date(user.subscriptionExpires);
      if (expiryDate > now) return false;
    }
    
    // Then filter by search term if present, prioritizing email search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      
      // Check email first (prioritized search)
      const emailMatch = 
        (user.email && user.email.toLowerCase().includes(term)) || 
        (user.userEmail && user.userEmail.toLowerCase().includes(term));
        
      if (emailMatch) return true;
      
      // Fall back to other fields if no email match
      return (
        (user.name && user.name.toLowerCase().includes(term)) ||
        (user.userName && user.userName.toLowerCase().includes(term)) ||
        (user.company && user.company.toLowerCase().includes(term))
      );
    }
    
    return true;
  });

  const handleStatusChange = async (uid, status) => {
    try {
      await updateDoc(doc(db, 'profiles', uid), { status });
      setUsers(users => users.map(u => u.id === uid ? { ...u, status } : u));
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status. Please try again.");
    }
  };

  const handleCategoryChange = async (uid, category) => {
    try {
      await updateDoc(doc(db, 'profiles', uid), { category });
      setUsers(users => users.map(u => u.id === uid ? { ...u, category } : u));
    } catch (error) {
      console.error("Error updating user category:", error);
      alert("Failed to update user category. Please try again.");
    }
  };

  const handleSubscriptionChange = async (uid, duration) => {
    try {
      // Calculate new expiration date
      const now = new Date();
      let expiresAt = null;
      
      if (duration === 'none') {
        expiresAt = null;
      } else if (duration === 'lifetime') {
        // For lifetime, set a date far in the future (100 years)
        expiresAt = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
      } else if (duration === '1') {
        // 1 month
        expiresAt = new Date(now.setMonth(now.getMonth() + 1));
      } else if (duration === '12') {
        // 1 year
        expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
      } else {
        // Any other number of months
        expiresAt = new Date(now.setMonth(now.getMonth() + parseInt(duration)));
      }
      
      await updateDoc(doc(db, 'profiles', uid), { 
        subscriptionExpires: expiresAt ? expiresAt.toISOString() : null 
      });
      
      setUsers(users => users.map(u => u.id === uid ? { 
        ...u, 
        subscriptionExpires: expiresAt ? expiresAt.toISOString() : null 
      } : u));
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Failed to update subscription. Please try again.");
    }
  };

  const generateQRCode = (value) => {
    // Simple QR code placeholder with URL
    // In a real implementation, you would use a QR code library
    return (
      <div className="qr-code-container">
        <QRCodeSVG value={value} size={64} />
        <div className="qr-actions">
          <a href={value} target="_blank" rel="noopener noreferrer" className="qr-download-link">
            View
          </a>
          <button 
            className="qr-download-link"
            onClick={() => {
              // Open modal with larger QR code
              setSelectedUser({ url: value });
              setShowQrModal(true);
            }}
          >
            Share
          </button>
        </div>
      </div>
    );
  };

  const getSubscriptionStatus = (user) => {
    if (!user.subscriptionExpires) return 'No Subscription';
    
    const now = new Date();
    const expiryDate = new Date(user.subscriptionExpires);
    
    if (expiryDate < now) {
      return 'Expired';
    }
    
    // Calculate days remaining
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 365 * 90) { // ~90 years is considered lifetime
      return 'Lifetime';
    }
    
    return `${daysRemaining} days left`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => alert('Link copied to clipboard!'),
      (err) => console.error('Failed to copy text: ', err)
    );
  };

  // Show loading state if still checking authorization or loading data
  if (!authorized || loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{!authorized ? 'Verifying admin access...' : 'Loading users...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <p className="admin-subtitle">Manage users, subscriptions and access control</p>
      </div>
      
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.category === 'Premium').length}</div>
          <div className="stat-label">Premium Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.category === 'Executive').length}</div>
          <div className="stat-label">Executive Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.subscriptionExpires && new Date(u.subscriptionExpires) < new Date()).length}</div>
          <div className="stat-label">Expired Subscriptions</div>
        </div>
      </div>
      
      <div className="admin-filters">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Users
          </button>
          <button 
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button 
            className={`tab-button ${activeTab === 'suspended' ? 'active' : ''}`}
            onClick={() => setActiveTab('suspended')}
          >
            Suspended
          </button>
          <button 
            className={`tab-button ${activeTab === 'blocked' ? 'active' : ''}`}
            onClick={() => setActiveTab('blocked')}
          >
            Blocked
          </button>
          <button 
            className={`tab-button ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            Expired
          </button>
        </div>
        
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Category</th>
              <th>Status</th>
              <th>Subscription</th>
              <th>Share</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <tr key={user.id} className={
                user.status === 'blocked' ? 'row-blocked' : 
                user.status === 'suspended' ? 'row-suspended' :
                (user.subscriptionExpires && new Date(user.subscriptionExpires) < new Date()) ? 'row-expired' : ''
              }>
                <td className="user-name-cell">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name || user.userName} className="user-thumbnail" />
                  ) : (
                    <div className="user-thumbnail-placeholder">
                      {(user.name || user.userName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="user-name-container">
                    <span className="user-name">{user.name || user.userName || 'Unnamed User'}</span>
                    {user.company && <span className="user-company">{user.company}</span>}
                  </div>
                </td>
                <td>{user.email || user.userEmail}</td>
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
                    style={{
                      backgroundColor: 
                        user.status === 'active' ? '#e6f7e6' : 
                        user.status === 'suspended' ? '#fff3cd' : 
                        user.status === 'blocked' ? '#f8d7da' : '#eee'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </td>
                <td>
                  <div className="subscription-cell">
                    <select 
                      value={!user.subscriptionExpires ? 'none' : 
                             new Date(user.subscriptionExpires).getFullYear() > 2100 ? 'lifetime' : 
                             '1'}
                      onChange={e => handleSubscriptionChange(user.id, e.target.value)}
                      className="admin-select"
                    >
                      <option value="none">No Subscription</option>
                      <option value="1">1 Month</option>
                      <option value="12">1 Year</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                    <div className="subscription-status">
                      <span className={
                        !user.subscriptionExpires ? 'status-none' : 
                        new Date(user.subscriptionExpires) < new Date() ? 'status-expired' : 
                        new Date(user.subscriptionExpires).getFullYear() > 2100 ? 'status-lifetime' : 
                        'status-active'
                      }>
                        {getSubscriptionStatus(user)}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="share-cell">
                    <a 
                      href={`${window.location.origin}/card/${user.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="share-link"
                    >
                      View Card
                    </a>
                    <button 
                      className="copy-link-btn"
                      onClick={() => copyToClipboard(`${window.location.origin}/card/${user.id}`)}
                    >
                      Copy URL
                    </button>
                    {generateQRCode(`${window.location.origin}/card/${user.id}`)}
                  </div>
                </td>
                <td>
                  <div className="actions-cell">
                    <a 
                      href={`${window.location.origin}/card/${user.id}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="action-button view-btn"
                    >
                      View Card
                    </a>
                    <button 
                      className="action-button edit-btn"
                      onClick={() => navigate(`/dashboard/edit/${user.id}`)}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="no-results">
                  <div className="no-results-message">
                    {searchTerm ? 
                      `No users found matching "${searchTerm}"` : 
                      `No users found in the "${activeTab}" category`}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* QR Code Modal */}
      {showQrModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowQrModal(false)}>×</button>
            <h3>Share Business Card</h3>
            
            <div className="qr-large">
              {/* In a real app, you'd use a QR code library to generate this */}
              <QRCodeSVG value={selectedUser.url} size={256} />
            </div>
            
            <div className="share-options">
              <input 
                type="text" 
                readOnly 
                value={selectedUser.url} 
                className="share-url-input" 
              />
              <button 
                className="copy-url-btn"
                onClick={() => copyToClipboard(selectedUser.url)}
              >
                Copy URL
              </button>
            </div>
            
            <div className="modal-footer">
              <p>Scan this QR code to view the business card</p>
              <button 
                className="download-qr-btn"
                onClick={() => alert("In a real application, this would download the QR code as an image")}
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
