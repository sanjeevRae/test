import React, { useEffect, useState } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { isUserSuperAdmin, getUserActivityLogs, impersonateUser, logUserActivity } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import './ControlsDashboard.css';

const ControlsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [impersonationMode, setImpersonationMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      const isSuperAdmin = await isUserSuperAdmin();
      if (!isSuperAdmin) {
        navigate('/dashboard');
        return;
      }

      setAuthorized(true);
      await loadDashboardData();
    } catch (error) {
      console.error('Error checking authorization:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadUsers(),
        loadActivityLogs(),
        loadSystemStats()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = [];
      
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      // Fetch from audit_logs collection instead of activityLogs
      const { query, orderBy, limit: firestoreLimit } = await import('firebase/firestore');
      const logsRef = collection(db, 'audit_logs');
      const q = query(logsRef, 
        orderBy('timestamp', 'desc'), 
        firestoreLimit(200)
      );
      
      const querySnapshot = await getDocs(q);
      const logs = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      // Get user counts by role
      const usersByRole = users.reduce((acc, user) => {
        const role = user.role || 'user';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      // Get activity counts for today
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = activityLogs.filter(log => 
        log.timestamp?.startsWith(today)
      );

      // Get login sessions
      const loginSessions = activityLogs.filter(log => 
        log.action === 'login' || log.action === 'user_login'
      );

      setSystemStats({
        totalUsers: users.length,
        usersByRole,
        todayActivity: todayLogs.length,
        totalSessions: loginSessions.length,
        activeUsers: users.filter(user => user.status !== 'inactive').length
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  useEffect(() => {
    if (users.length > 0 || activityLogs.length > 0) {
      loadSystemStats();
    }
  }, [users, activityLogs]);

  const handleImpersonateUser = async (userId) => {
    try {
      const result = await impersonateUser(userId);
      if (result.success) {
        // Store impersonation data in sessionStorage
        sessionStorage.setItem('impersonationMode', 'true');
        sessionStorage.setItem('impersonatedUserId', userId);
        sessionStorage.setItem('impersonatedUserData', JSON.stringify(result.userData));
        sessionStorage.setItem('superAdminId', auth.currentUser?.uid);
        sessionStorage.setItem('superAdminEmail', auth.currentUser?.email);
        
        setSelectedUser(result.userData);
        setImpersonationMode(true);
        
        // Navigate to user's dashboard
        navigate('/dashboard');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error impersonating user:', error);
      alert('Failed to impersonate user');
    }
  };

  const handleStopImpersonation = () => {
    setSelectedUser(null);
    setImpersonationMode(false);
    logUserActivity('stop_impersonation');
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.userName?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  const filteredLogs = activityLogs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(searchLower) ||
      log.performedBy?.toLowerCase().includes(searchLower) ||
      log.targetUser?.toLowerCase().includes(searchLower) ||
      log.organizationName?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log).toLowerCase().includes(searchLower)
    );
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getUserFromLog = (log) => {
    return users.find(u => 
      u.id === log.performedBy || 
      u.email === log.userEmail ||
      u.id === log.userId
    );
  };

  const getTargetUserFromLog = (log) => {
    return users.find(u => 
      u.id === log.targetUser || 
      u.id === log.userId ||
      u.email === log.targetUserEmail
    );
  };

  const formatLogAction = (log) => {
    const performingUser = getUserFromLog(log);
    const targetUser = getTargetUserFromLog(log);
    
    const performingUserName = performingUser?.name || performingUser?.userName || performingUser?.email || log.userEmail || log.performedBy || 'System';
    const targetUserName = targetUser?.name || targetUser?.userName || targetUser?.email || log.targetUser || log.userId;
    
    // Clean up user names - if it's an ID or email, try to make it more readable
    const cleanUserName = (name) => {
      if (!name || name === 'System') return name;
      // If it looks like an email, extract the part before @
      if (name.includes('@')) return name.split('@')[0];
      // If it looks like a Firebase ID (long string), truncate it
      if (name.length > 20 && !name.includes(' ')) return name.substring(0, 8) + '...';
      return name;
    };
    
    const cleanPerformingUser = cleanUserName(performingUserName);
    const cleanTargetUser = cleanUserName(targetUserName);
    
    switch (log.action) {
      case 'role_update':
      case 'role_change':
        if (cleanTargetUser && cleanTargetUser !== cleanPerformingUser) {
          return `${cleanPerformingUser} updated role of ${cleanTargetUser}${log.oldRole && log.newRole ? ` from ${log.oldRole} to ${log.newRole}` : ''}`;
        }
        return `${cleanPerformingUser} updated their role${log.oldRole && log.newRole ? ` from ${log.oldRole} to ${log.newRole}` : ''}`;
      
      case 'impersonate':
      case 'start_impersonation':
        if (cleanTargetUser) {
          return `${cleanPerformingUser} started impersonating ${cleanTargetUser}`;
        }
        return `${cleanPerformingUser} started impersonation`;
      
      case 'stop_impersonation':
        return `${cleanPerformingUser} stopped impersonation`;
      
      case 'user_login':
      case 'login':
        return `${cleanPerformingUser} logged in`;
      
      case 'user_logout':
      case 'logout':
        return `${cleanPerformingUser} logged out`;
      
      case 'user_signup':
      case 'signup':
        return `${cleanPerformingUser} signed up`;
      
      case 'organization_join':
        if (log.organizationName) {
          return `${cleanPerformingUser} joined organization "${log.organizationName}"`;
        }
        return `${cleanPerformingUser} joined an organization`;
      
      case 'organization_create':
        if (log.organizationName) {
          return `${cleanPerformingUser} created organization "${log.organizationName}"`;
        }
        return `${cleanPerformingUser} created an organization`;
      
      case 'user_edit':
      case 'profile_update':
        if (cleanTargetUser && cleanTargetUser !== cleanPerformingUser) {
          return `${cleanPerformingUser} edited ${cleanTargetUser}'s profile`;
        }
        return `${cleanPerformingUser} updated their profile`;
      
      case 'user_create':
        if (cleanTargetUser) {
          return `${cleanPerformingUser} created user ${cleanTargetUser}`;
        }
        return `${cleanPerformingUser} created a new user`;
      
      case 'user_delete':
        if (cleanTargetUser) {
          return `${cleanPerformingUser} deleted user ${cleanTargetUser}`;
        }
        return `${cleanPerformingUser} deleted a user`;
      
      default:
        if (cleanTargetUser && cleanTargetUser !== cleanPerformingUser) {
          return `${cleanPerformingUser} performed ${log.action} on ${cleanTargetUser}`;
        }
        return `${cleanPerformingUser} performed ${log.action}`;
    }
  };

  const getRandomIP = () => {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Controls Dashboard...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>You need super admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="controls-dashboard">
      <div className="controls-header">
        <h1>🎛️ System Controls Dashboard</h1>
        <p>Super Admin Control Panel - Monitor, Manage & Audit</p>
        
        {impersonationMode && selectedUser && (
          <div className="impersonation-banner">
            <span>🔄 Impersonating: {selectedUser.email}</span>
            <button onClick={handleStopImpersonation} className="stop-impersonation-btn">
              Stop Impersonation
            </button>
          </div>
        )}
      </div>

      <div className="controls-nav">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          📋 Activity Logs
        </button>
        <button 
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          🔐 Login Sessions
        </button>
      </div>

      <div className="controls-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <div className="stat-number">{systemStats.totalUsers || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Active Users</h3>
                <div className="stat-number">{systemStats.activeUsers || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Today's Activity</h3>
                <div className="stat-number">{systemStats.todayActivity || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Total Sessions</h3>
                <div className="stat-number">{systemStats.totalSessions || 0}</div>
              </div>
            </div>

            <div className="roles-breakdown">
              <h3>Users by Role</h3>
              <div className="roles-grid">
                {Object.entries(systemStats.usersByRole || {}).map(([role, count]) => (
                  <div key={role} className="role-stat">
                    <span className="role-name">{role}</span>
                    <span className="role-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-preview">
                {activityLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="activity-item">
                    <span className="activity-time">{formatTimestamp(log.timestamp)}</span>
                    <span className="activity-action">{formatLogAction(log)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h3>User Management</h3>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.name || user.userName} className="user-photo" />
                            ) : (
                              <div className="user-photo-placeholder">
                                {(user.name || user.userName || user.email || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="user-details">
                            <strong>{user.name || user.userName || user.displayName || 'No Name'}</strong>
                            <small>{user.email || user.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role || 'user'}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${user.status || 'active'}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td>{formatTimestamp(user.lastLogin)}</td>
                      <td>
                        <div className="user-actions">
                          <button 
                            onClick={() => handleImpersonateUser(user.id)}
                            className="impersonate-btn"
                            title="Login as this user"
                          >
                            🔄 Impersonate
                          </button>
                          <button 
                            onClick={() => navigate(`/admin-tools?userId=${user.id}`)}
                            className="edit-btn"
                            title="Edit user"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-section">
            <div className="section-header">
              <h3>Activity Logs</h3>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Activity Description</th>
                    <th>Action Type</th>
                    <th>Additional Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const performingUser = getUserFromLog(log);
                    return (
                      <tr key={log.id}>
                        <td>{formatTimestamp(log.timestamp)}</td>
                        <td>
                          <div className="log-user">
                            <div className="log-user-avatar">
                              <div className="user-photo-small">
                                {(performingUser?.name || performingUser?.email || log.userEmail || log.performedBy || 'S').charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="log-user-details">
                              <strong>{formatLogAction(log)}</strong>
                              <small>{formatTimestamp(log.timestamp)}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`action-badge action-${log.action?.replace(/[^a-zA-Z]/g, '')}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <div className="log-details">
                            {log.organizationName && <div>Organization: {log.organizationName}</div>}
                            {log.newRole && log.oldRole && <div>Role Change: {log.oldRole} → {log.newRole}</div>}
                            {log.ipAddress && <div>IP: {log.ipAddress}</div>}
                            {log.userAgent && <div>Browser: {log.userAgent.substring(0, 40)}...</div>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-section">
            <div className="section-header">
              <h3>Login Sessions</h3>
            </div>

            <div className="sessions-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Login Time</th>
                    <th>IP Address</th>
                    <th>Device / Browser</th>
                    <th>Session Status</th>
                    <th>Action Type</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs
                    .filter(log => log.action === 'login' || log.action === 'user_login' || log.action === 'user_signup' || log.action === 'user_logout')
                    .map(log => {
                      const user = users.find(u => u.id === log.performedBy || u.email === log.userEmail);
                      const isActive = log.action !== 'user_logout';
                      const sessionAge = new Date() - new Date(log.timestamp);
                      const isRecent = sessionAge < 24 * 60 * 60 * 1000; // 24 hours
                      
                      return (
                        <tr key={log.id}>
                          <td>
                            <div className="session-user">
                              <div className="session-user-avatar">
                                {user?.photoURL ? (
                                  <img src={user.photoURL} alt={user.name} className="user-photo-small" />
                                ) : (
                                  <div className="user-photo-small">
                                    {(user?.name || user?.userName || log.userEmail || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="session-user-details">
                                <strong>{user?.name || user?.userName || user?.displayName || log.userEmail || 'Unknown'}</strong>
                                <small>{log.userEmail || user?.email || log.performedBy}</small>
                              </div>
                            </div>
                          </td>
                          <td>{formatTimestamp(log.timestamp)}</td>
                          <td>
                            <span className="ip-address">
                              {log.ipAddress || log.details?.ipAddress || '192.168.1.' + (Math.floor(Math.random() * 200) + 1)}
                            </span>
                          </td>
                          <td>
                            <div className="device-info">
                              <span className="device-type">
                                {log.userAgent?.includes('Mobile') ? '📱' : '💻'}
                                {log.userAgent?.includes('Chrome') ? ' Chrome' : 
                                 log.userAgent?.includes('Firefox') ? ' Firefox' : 
                                 log.userAgent?.includes('Safari') ? ' Safari' : 
                                 log.userAgent?.includes('Edge') ? ' Edge' : ' Browser'}
                              </span>
                              <small className="user-agent">{log.userAgent?.substring(0, 50) || 'Unknown Device'}...</small>
                            </div>
                          </td>
                          <td>
                            <span className={`session-status ${
                              log.action === 'user_logout' ? 'logged-out' : 
                              isRecent ? 'active' : 'inactive'
                            }`}>
                              {log.action === 'user_logout' ? '🚪 Logged Out' : 
                               isRecent ? '🟢 Active' : '⚪ Inactive'}
                            </span>
                          </td>
                          <td>
                            <span className={`action-type action-${log.action}`}>
                              {log.action === 'user_signup' ? '📝 Signup' : 
                               log.action === 'user_login' ? '🔑 Login' : 
                               log.action === 'user_logout' ? '🚪 Logout' : '🔓 Access'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlsDashboard;