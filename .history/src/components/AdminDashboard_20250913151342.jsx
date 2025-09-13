import React, { useEffect, useState } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, getDocs, doc, updateDoc, getDoc, where, query } from 'firebase/firestore';
import { isUserAdmin, setUserRole } from '../utils/auth';
import { getSuccessFromResult, getErrorFromResult } from '../utils/compatHelpers';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import OrganizationManagement from './OrganizationManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);  const [activeTab, setActiveTab] = useState('all'); 
  const [activeSection, setActiveSection] = useState('users'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);  const navigate = useNavigate();

  // CSV Export Function
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    // Define CSV headers
    const headers = [
      'User ID',
      'Email',
      'Name', 
      'Role',
      'Company',
      'Job Title',
      'Phone',
      'Website',
      'Location',
      'Bio',
      'Status',
      'Category',
      'LinkedIn',
      'Instagram',
      'Facebook',
      'YouTube',
      'TikTok',
      'Snapchat'
    ];
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes by doubling them and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    const csvRows = [
      headers.join(','), 
      ...data.map(user => [
        escapeCSV(user.userId || ''),
        escapeCSV(user.userEmail || ''),
        escapeCSV(user.name || user.userName || ''),
        escapeCSV(user.role || ''),
        escapeCSV(user.company || ''),
        escapeCSV(user.jobTitle || user.title || ''),
        escapeCSV(user.phone || ''),
        escapeCSV(user.website || ''),
        escapeCSV(user.location || ''),
        escapeCSV(user.bio || ''),
        escapeCSV(user.status || 'active'),
        escapeCSV(user.category || 'basic'),
        escapeCSV(user.socials?.linkedin || ''),
        escapeCSV(user.socials?.instagram || ''),
        escapeCSV(user.socials?.facebook || ''),
        escapeCSV(user.socials?.youtube || ''),
        escapeCSV(user.socials?.tiktok || ''),
        escapeCSV(user.socials?.snapchat || '')
      ].join(','))
    ];
    
    return csvRows.join('\n');
  };

  const downloadUsersCSV = () => {
    try {
      console.log('Starting CSV download...', users.length, 'users');
      
      if (!users || users.length === 0) {
        alert('No user data available to download.');
        return;
      }
      
      const csvContent = convertToCSV(users);
      console.log('CSV content generated, length:', csvContent.length);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
      console.log('CSV download completed successfully');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert(`Error downloading CSV file: ${error.message}. Please try again.`);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    console.log('Fetching users...');
    
    try {
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
                role: userData.role || 'user',
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
            role: userData.role || 'user',
            status: 'active',
            category: 'basic',
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

  const refreshData = () => {
    fetchUsers();
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      const isAdmin = await isUserAdmin();
      
      if (!isAdmin) {
        // Redirect non-admin users
        navigate('/dashboard');
        return;
      }
      
      setAuthorized(true);
      fetchUsers();
    };
    
    checkAdminStatus();
  }, [navigate]);

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
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      
      const emailMatch = 
        (user.email && user.email.toLowerCase().includes(term)) || 
        (user.userEmail && user.userEmail.toLowerCase().includes(term));
        
      if (emailMatch) return true;
      
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
      // Update the profile document
      await updateDoc(doc(db, 'profiles', uid), { category });
      
      // Find the user to get their userId
      const user = users.find(u => u.id === uid);
      if (user && user.userId) {
        // Update the user's plan in the users collection
        await updateDoc(doc(db, 'users', user.userId), { plan: category });
      }
      
      // Update local state
      setUsers(users => users.map(u => u.id === uid ? { ...u, category } : u));
      
      console.log(`User plan updated to ${category} for user ${user?.userEmail || uid}`);
    } catch (error) {
      console.error("Error updating user category:", error);
      alert("Failed to update user category. Please try again.");
    }
  };
  const handleRoleChange = async (uid, role) => {
    try {
      const user = users.find(u => u.id === uid);
      const userId = user.userId;
      
      console.log(`Changing role for user ${userId} to ${role}`);      
      
      const orgsCol = collection(db, 'organizations');
      const orgsSnapshot = await getDocs(orgsCol);
      
      let organizationId = null;
      
      if (role === 'leader') {
        const organizations = orgsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        
        if (organizations.length === 0) {
          alert('Cannot set as leader: No organizations available. Please create an organization first.');
          return;
        }
        
        const orgList = organizations.map((org, index) => `${index + 1}. ${org.name}`).join('\n');
        
        const selection = prompt(
          `Select an organization number for this leader:\n${orgList}\n\nEnter the number:`
        );
        
        if (!selection || isNaN(parseInt(selection))) {
          alert('Invalid selection. Role change cancelled.');
          return;
        }
        
        const selectedIndex = parseInt(selection) - 1;
        if (selectedIndex < 0 || selectedIndex >= organizations.length) {
          alert('Invalid organization number. Role change cancelled.');
          return;
        }
        
        organizationId = organizations[selectedIndex].id;
        console.log(`Selected organization: ${organizations[selectedIndex].name} (${organizationId})`);
      }
      
      const result = await setUserRole(userId, role, organizationId);
      
      const success = getSuccessFromResult(result);
      
      if (success) {
        setUsers(users => users.map(u => u.id === uid ? { ...u, role } : u));
        console.log(`User role updated to ${role}`);
        
        const userRef = doc(db, 'users', userId);
        const updatedUserDoc = await getDoc(userRef);
        if (updatedUserDoc.exists()) {
          const updatedRole = updatedUserDoc.data().role;
          const updatedOrgId = updatedUserDoc.data().organizationId;
          console.log(`Verified role in database: ${updatedRole}, Organization: ${updatedOrgId || 'None'}`);
          
          if (updatedRole !== role) {
            console.log('Database and UI mismatch, refreshing data...');
            fetchUsers();
          }
        }
        
        alert(`User role successfully changed to ${role}${organizationId ? ' and assigned to organization' : ''}`);
      } else {
        const errorMsg = getErrorFromResult(result, 'Failed to update user role. Please try again.');
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      alert(`Failed to update user role: ${error.message}`);
    }
  };

  const handleSubscriptionChange = async (uid, duration) => {
    try {
      const now = new Date();
      let expiresAt = null;
      
      if (duration === 'none') {
        expiresAt = null;
      } else if (duration === 'lifetime') {
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
    
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 365 * 90) { 
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
    <div className="admin-dashboard">      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <p className="admin-subtitle">Manage user plans (Basic/Elite/Premium), roles, organizations, and access control</p>
        
        <div className="section-tabs">
          <button 
            className={`section-tab ${activeSection === 'users' ? 'active-section' : ''}`}
            onClick={() => setActiveSection('users')}
          >
            Users Management
          </button>
          <button 
            className={`section-tab ${activeSection === 'organizations' ? 'active-section' : ''}`}
            onClick={() => setActiveSection('organizations')}
          >
            Organizations
          </button>
          <button 
            className="refresh-button"
            onClick={refreshData}
            title="Refresh Data"
          >
            ⟳  Refresh
          </button>
          <button 
            className="download-button"
            onClick={downloadUsersCSV}
            title="Download Users Data as CSV"
          >
            📥 Download CSV
          </button>
        </div>
      </div>
        {activeSection === 'organizations' ? (
        <OrganizationManagement />
      ) : (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.status === 'active').length}</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.category === 'basic' || u.category === 'Basic').length}</div>
              <div className="stat-label">Basic Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.category === 'elite').length}</div>
              <div className="stat-label">Elite Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.category === 'premium' || u.category === 'Premium').length}</div>
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
        <table className="admin-table">          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Plan</th>
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
                </td>                <td>{user.email || user.userEmail}</td>
                <td>
                  <select 
                    value={user.role || 'user'} 
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    className="admin-select"
                  >
                    <option value="user">User</option>
                    <option value="leader">Leader</option>
                    <option value="orgmanager">Org Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <select 
                    value={user.category || 'basic'} 
                    onChange={e => handleCategoryChange(user.id, e.target.value)}
                    className="admin-select"
                  >
                    <option value="basic">Basic</option>
                    <option value="elite">Elite</option>
                    <option value="premium">Premium</option>
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
                             user.subscriptionExpires && new Date(user.subscriptionExpires) > new Date() ? 
                             (new Date(user.subscriptionExpires).getFullYear() > new Date().getFullYear() ? '12' : '1') : '1'}
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
                    <Link 
                      className="action-button edit-btn"
                      to={`/dashboard/edit/${user.id}`}
                    >
                      Edit
                    </Link>
                  </div>                </td>
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
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
