

# E-VOX Dashboard Application

This application implements a 3-tier role-based architecture for dashboard management with organization-level control.

## Role-Based Architecture

The application uses a hierarchical role-based access control system:

### 1. Admin
- Can manage all users, organizations, and system settings
- Can create, modify, and delete organizations
- Can assign users to organizations and set their roles
- Has full access to all features and data

### 2. Leader
- Can manage users within their organization/team
- Can view and edit details of team members
- Can add/remove users from their organization (but can't create leaders)
- Limited to managing only their organization

### 3. User
- Regular user with limited permissions
- Can only view and edit their own card/profile
- Cannot access organization management features
- Cannot manage other users

## Routes

- `/dashboard` - Regular user dashboard
- `/leader` - Team leader dashboard for managing organization members
- `/admin` - Admin dashboard for system-wide management
- `/role-dashboard` - Smart redirect based on user's role

## Security Implementation

This application implements security at multiple levels:

1. **Client-side routing protection** using the `ProtectedRoute` component with role checks
2. **Firestore security rules** that enforce the permission model on the database level
3. **Role validation** in all action functions in the `auth.js` utility

## Organization Management

Organizations are structured as follows:
- Each organization has a unique ID
- Users are assigned to one organization at a time
- Each organization can have multiple leaders and users
- Leaders can only manage users in their own organization
- Only admins can create organizations and assign leaders

## Technologies Used

- React with Vite
- Firebase Authentication
- Firestore Database
- React Router
#
