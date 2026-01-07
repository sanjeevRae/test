# Controls Dashboard - Super Admin Features

## Overview
The Controls Dashboard is a comprehensive system management interface designed exclusively for Super Administrators. It provides advanced monitoring, user management, and system control capabilities.

## Features

### 🎛️ System Controls Dashboard
- **Overview Statistics**: Total users, active users, daily activity counts, and role distribution
- **Real-time Activity Monitoring**: Comprehensive logging of all user actions
- **User Management**: Advanced user controls with impersonation capabilities
- **Session Tracking**: Monitor login sessions and user activity patterns

### 👥 User Management
- **User Impersonation**: Login as any user without requiring their password
- **Role Management**: Manage all user roles including admin, leader, and regular users
- **User Search**: Filter and search through all system users
- **Activity Tracking**: View detailed activity logs for any user

### 📋 Activity Logs
- **Comprehensive Logging**: All user actions are logged with timestamps
- **Search and Filter**: Find specific activities or user actions
- **Audit Trail**: Complete audit trail for security and compliance

### 🔐 Login Sessions
- **Active Session Monitoring**: View all active user sessions
- **Device Information**: Track device types and user agents
- **Login History**: Complete login history with timestamps

## Access Control

### Super Admin Role
- **Exclusive Access**: Only users with 'superadmin' role can access the Controls dashboard
- **Inherited Privileges**: Super admins have all admin and leader privileges
- **Role Hierarchy**: superadmin > admin > leader > user

### Role Checking
The system uses Firebase Firestore to manage roles:
```javascript
// Check if user is super admin
const isSuperAdmin = await isUserSuperAdmin();

// Super admins also have admin access
if (userRole === 'superadmin' || userRole === 'admin') {
  // Allow admin access
}
```

## Activity Logging

### Automatic Logging
The system automatically logs:
- ✅ User login/logout
- ✅ Role changes
- ✅ User impersonation
- ✅ User signup
- ✅ Administrative actions

### Log Structure
```javascript
{
  userId: "user_id",
  userEmail: "user@example.com",
  action: "login",
  details: { role: "admin", loginMethod: "email_password" },
  targetUserId: "target_user_id", // For actions affecting other users
  timestamp: "2025-12-10T10:30:00.000Z",
  userAgent: "Browser information"
}
```

## Routes

### New Routes Added
- `/controls` - Controls Dashboard (Super Admin only)
- Updated `/role-dashboard` to redirect super admins to Controls

### Protected Routes
```javascript
// Super Admin only
<Route path="/controls" element={
  <ProtectedRoute requireSuperAdmin={true}>
    <ControlsDashboard />
  </ProtectedRoute>
} />

// Admin access (includes super admin)
<Route path="/admin" element={
  <ProtectedRoute requireAdmin={true}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

## Navigation

### Navbar Integration
- Super admins see "🎛️ System Controls" in their dropdown menu
- Role-based menu items show appropriate access levels
- Hierarchical access (super admin sees all options)

## Testing and Development

### Role Debugger
Use the `/role-debug` page to test different roles:
- Set any user as super admin for testing
- Test role hierarchies and access controls
- Debug permission issues

### Console Utilities
```javascript
// In browser console for testing
window.testSuperAdminSetup(); // Grant super admin to current user
window.setSuperAdmin(email);  // Grant super admin to specific user
```

## Security Considerations

### Authentication Required
- All Controls features require authentication
- Role verification happens server-side through Firestore
- Unauthorized access attempts are logged

### Activity Auditing
- All administrative actions are logged
- User impersonation is tracked and auditable
- Failed access attempts are recorded

### Data Protection
- User activity logs contain only necessary information
- Sensitive data is not stored in plain text logs
- Access controls prevent data exposure

## File Structure

### New Components
```
src/components/
├── ControlsDashboard.jsx     # Main dashboard component
├── ControlsDashboard.css     # Dashboard styling
```

### Updated Files
```
src/utils/
├── auth.js                   # Added super admin functions
├── superAdminUtils.js        # Testing utilities

src/components/
├── ProtectedRoute.jsx        # Added super admin support
├── Navbar.jsx               # Added Controls menu
├── RoleDebugger.jsx         # Added super admin testing
├── AuthForm.jsx             # Added activity logging
├── App.jsx                  # Added Controls route
```

## Usage Instructions

### For Super Admins
1. **Login** with super admin account
2. **Navigate** to Controls dashboard from user menu
3. **Monitor** system activity in Overview tab
4. **Manage Users** in User Management tab
5. **Impersonate Users** by clicking "Impersonate" button
6. **Review Logs** in Activity Logs tab
7. **Track Sessions** in Login Sessions tab

### For Developers
1. **Set up super admin**: Use Role Debugger or console utilities
2. **Test functionality**: Navigate to `/controls` 
3. **Monitor logs**: Check browser console and activity logs
4. **Debug issues**: Use `/role-debug` page

## Future Enhancements
- 📊 Advanced analytics and reporting
- 🔔 Real-time notifications for admin actions
- 🛡️ Enhanced security monitoring
- 📈 Performance metrics and system health
- 🔍 Advanced search and filtering
- 📤 Export capabilities for audit logs