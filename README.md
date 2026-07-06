<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=26&duration=3500&pause=500&color=14B8A6&center=true&vCenter=true&width=500&lines=EVOX+App;Full-Stack+SaaS+Platform;React+Firebase" alt="Typing SVG" />
</p>

---

## 📱 E-VOX NFC Digital Business Card System

![App Banner](https://github.com/sanjeevRae/EVOX-SaaS-Platform/blob/main/public/src/assets/evox%20card.png)

## Complete Technical Documentation for Developers

---

## Table of Contents
1. [Introduction](#introduction)
2. [What is NFC Technology?](#what-is-nfc-technology)
3. [System Architecture](#system-architecture)
4. [Key Features](#key-features)
5. [Technology Stack](#technology-stack)
6. [Database Structure](#database-structure)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Profile Card System](#profile-card-system)
9. [Analytics & Tracking](#analytics--tracking)
10. [File Upload System](#file-upload-system)
11. [Theme System](#theme-system)
12. [API & Functions](#api--functions)
13. [Security Implementation](#security-implementation)
14. [Testing & Development](#testing--development)
15. [Deployment Guide](#deployment-guide)
16. [Common Issues & Solutions](#common-issues--solutions)

---

## Introduction

E-VOX is a digital business card platform that uses **NFC (Near Field Communication)** technology to instantly share contact information. Instead of traditional paper business cards, users get a smart digital card that can be shared by:
- **Tapping** an NFC-enabled card against a smartphone
- **Scanning** a QR code
- **Sharing** a simple web link

### Why NFC Business Cards?
- ✅ **Instant Sharing**: One tap to share all your information
- ✅ **Always Updated**: Change your info anytime, card stays current
- ✅ **Eco-Friendly**: No paper waste
- ✅ **Professional**: Modern, tech-forward impression
- ✅ **Analytics**: Track who views and saves your card
- ✅ **Rich Content**: Photos, videos, social links, multiple phones/emails

---

## What is NFC Technology?

**NFC (Near Field Communication)** is a wireless technology that allows devices to communicate when they're very close together (usually within 4 cm or 1.5 inches).

### How It Works:
1. **NFC Card**: A physical card with an NFC chip embedded inside
2. **Smartphone**: Most modern smartphones have NFC readers built-in
3. **One Tap**: When you tap the card on a phone, the NFC chip sends a URL
4. **Auto-Open**: The phone automatically opens that URL in a browser
5. **View Profile**: User sees your digital business card instantly

### Technical Specs:
- **Frequency**: 13.56 MHz
- **Range**: 0-4 cm (very short range)
- **Speed**: Up to 424 kbit/s
- **Power**: Passive (no battery needed in card)
- **Standards**: ISO/IEC 14443, ISO/IEC 18092

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Device                          │
│  (Smartphone with NFC or Camera for QR)                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Tap NFC / Scan QR / Click Link
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Web Application                          │
│                    (React + Vite)                           │
│                                                             │
│  Routes:                                                    │
│  • /card/:userId  → Public Profile View                    │
│  • /dashboard     → User Card Editor                        │
│  • /admin         → Admin Panel                             │
│  • /leader        → Team Leader Panel                       │
│  • /controls      → Super Admin Controls                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Firebase SDK
                   │
┌──────────────────┴──────────────────────────────────────────┐
│                    Firebase Backend                         │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Firebase   │  │  Firestore   │  │  Firebase    │      │
│  │  Auth       │  │  Database    │  │  Functions   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐                         │
│  │  Analytics  │  │  Storage     │                         │
│  └─────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Cloudinary (Image CDN)                     │
│              (Profile & Logo Image Storage)                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow - Profile View

```
User Taps NFC Card
       │
       ▼
Phone reads NFC URL: https://evoxnepal.com/card/userId123
       │
       ▼
Browser opens CardProfile.jsx component
       │
       ▼
Fetch profile data from Firestore (/profiles/userId123)
       │
       ▼
Track analytics (profile view, device info)
       │
       ▼
Render profile card with:
  • Photo, Name, Title, Company
  • Contact buttons (Email, Phone, Website)
  • Social media links
  • Save Contact button (vCard download)
  • QR code for sharing
       │
       ▼
User clicks "Save Contact"
       │
       ▼
Generate vCard file & Track save event
       │
       ▼
Download contact.vcf file (importable to phone contacts)
```

---

## Key Features

### 1. **Digital Profile Cards**
Each user can create a digital business card with:
- Full name with profile photo
- Job title and company
- Multiple phone numbers (up to 4)
- Multiple websites (2)
- Multiple email addresses
- Physical location/address
- Bio/description
- Social media links (LinkedIn, Instagram, Facebook, YouTube, TikTok)
- Company logo with clickable link
- Custom themes (3 design options)
- Office hours and availability

### 2. **Instant Contact Sharing**
- **vCard Export**: Download as .vcf file (works with all phone contacts apps)
- **QR Code**: Built-in QR code for each profile
- **Direct Link**: Shareable URL like `evoxnepal.com/card/user123`
- **One-Click Actions**: Direct tap-to-call, tap-to-email buttons

### 3. **Analytics Dashboard**
Track your card's performance:
- **Profile Views**: Total and daily view counts
- **Contact Saves**: How many people saved your contact
- **Social Link Clicks**: Which social links get clicked most
- **Geographic Data**: Where viewers are from
- **Device Info**: Mobile vs Desktop viewers
- **Time-based Trends**: View patterns over time

### 4. **Multi-Theme Support**
- **Theme 1**: Classic professional design
- **Theme 2**: Modern gradient style
- **Theme 3**: Minimalist clean layout
- Users can switch themes anytime
- Theme is saved and remembered

### 5. **Organization Management**
- **Team Cards**: Organizations can have multiple users
- **Branding**: Shared company logo across team cards
- **Centralized**: Leaders manage their team members
- **Hierarchy**: Admin → Leader → User

### 6. **Real-Time Updates**
- **Instant Changes**: Edit profile, changes reflect immediately
- **No Reprinting**: Physical NFC card always points to latest data
- **Cloud Sync**: All data synced across devices

---

## Technology Stack

### Frontend
- **React 18**: UI library (component-based)
- **Vite**: Build tool (fast development server)
- **React Router v6**: Client-side routing
- **CSS3**: Styling with animations
- **EmailJS**: Client-side email sending (contact forms)
- **QRCode React**: QR code generation
- **React Helmet**: SEO meta tags

### Backend & Services
- **Firebase Authentication**: User login/signup/password management
- **Firestore Database**: NoSQL database (real-time, scalable)
- **Firebase Functions**: Serverless backend functions
- **Firebase Analytics**: Usage tracking and insights
- **Cloudinary**: Image hosting and optimization (CDN)

### Development Tools
- **ESLint**: Code linting and quality
- **Vite Config**: Build configuration
- **Environment Variables**: Secure configuration (.env)

### Hosting & Deployment
- **Firebase Hosting**: Static site hosting (recommended)
- **Custom Domain**: Can use custom domains
- **SSL/HTTPS**: Automatic HTTPS encryption
- **CDN**: Global content delivery

---

## Database Structure

### Firestore Collections

#### 1. **users** Collection
Main user account data.

```javascript
users/{userId}
{
  email: "user@example.com",
  displayName: "John Doe",
  role: "user",              // user | leader | admin | superadmin
  plan: "premium",           // premium | executive
  createdAt: "2025-01-15T10:30:00Z",
  status: "active",          // active | suspended | blocked
  
  // Organization
  organizationId: "org_123", // Optional: if part of organization
  
  // Card references
  cards: ["profileId1", "profileId2"], // Array of profile IDs
  
  // Branding
  logoURL: "https://cloudinary.com/...", // Company logo
  logoLink: "https://company.com",       // Logo click destination
  companyName: "E-VOX Tech",
  
  // Subscription
  subscriptionExpires: "2026-01-15T10:30:00Z", // Optional
  
  // Metadata
  lastLogin: "2025-03-09T08:00:00Z",
  loginCount: 142
}
```

#### 2. **profiles** Collection
Individual digital business cards.

```javascript
profiles/{profileId}
{
  // Owner
  userId: "user_abc123",     // Who owns this card
  
  // Basic Info
  name: "John Doe",
  email: "john@company.com",
  phone: ["555-1234", "555-5678"], // Array of phone numbers
  role: "Senior Developer",         // Job title
  company: "E-VOX Technologies",
  location: "Kathmandu, Nepal",
  bio: "Full-stack developer specializing in React and Firebase",
  
  // Additional Contacts
  website: "https://johndoe.com",
  website2: "https://blog.johndoe.com", // Optional second website
  
  // Images
  photoURL: "https://cloudinary.com/photo.jpg",
  logoURL: "https://cloudinary.com/logo.png",  // Can override user's logo
  logoLink: "https://company.com",
  
  // Theme
  theme: "theme1",           // theme1 | theme2 | theme3
  
  // Office Hours (Optional)
  availableDays1: "Mon-Fri 9AM-5PM",
  officeName1: "Main Office",
  availableDays2: "Sat 10AM-2PM",
  officeName2: "Branch Office",
  
  // Social Links
  socials: {
    linkedin: "https://linkedin.com/in/johndoe",
    instagram: "https://instagram.com/johndoe",
    facebook: "https://facebook.com/johndoe",
    youtube: "https://youtube.com/@johndoe",
    tiktok: "@johndoe"
  },
  
  // Status
  status: "active",          // active | blocked | suspended
  category: "Premium",       // Premium | Executive
  
  // Metadata
  createdAt: "2025-01-15T10:30:00Z",
  updatedAt: "2025-03-09T08:00:00Z"
}
```

#### 3. **analytics** Collection
Tracks all profile interactions.

```javascript
analytics/{analyticsId}
{
  // Event Type
  eventType: "profile_view", // profile_view | social_link_click | contact_save
  
  // Who
  profileId: "profile_123",  // Which profile was viewed/clicked
  
  // When
  timestamp: Timestamp,      // Firebase Timestamp object
  
  // Event-specific data
  platform: "linkedin",      // For social_link_click
  method: "vcard_download",  // For contact_save
  url: "https://...",        // For social_link_click
  
  // Viewer Info
  viewerInfo: {
    userAgent: "Mozilla/5.0...",
    referrer: "https://google.com",
    type: "anonymous"        // Anonymous viewers (not logged in)
  },
  
  // Technical Info
  metadata: {
    url: "https://evoxnepal.com/card/profile_123",
    device: {
      type: "mobile",        // mobile | desktop
      userAgent: "Mozilla/5.0..."
    }
  }
}
```

#### 4. **organizations** Collection
Group management for teams.

```javascript
organizations/{orgId}
{
  name: "E-VOX Technologies",
  createdAt: "2025-01-01T00:00:00Z",
  createdBy: "admin_user_id",
  
  // Members
  members: ["userId1", "userId2"],  // Array of user IDs
  leaders: ["leader_userId"],       // Users with leader role
  
  // Branding
  logoURL: "https://cloudinary.com/org-logo.png",
  companyName: "E-VOX Tech Pvt. Ltd.",
  
  // Settings
  settings: {
    allowMemberInvites: true,
    requireApproval: false
  }
}
```

#### 5. **activityLogs** Collection
System-wide activity logging (for admins).

```javascript
activityLogs/{logId}
{
  userId: "user_123",
  userEmail: "user@example.com",
  action: "login",           // login | logout | role_change | impersonation | signup
  
  details: {
    role: "admin",
    loginMethod: "email_password",
    // ... action-specific details
  },
  
  targetUserId: "target_user_id", // For actions affecting other users
  timestamp: "2025-03-09T10:30:00Z",
  userAgent: "Mozilla/5.0...",
  ipAddress: "192.168.1.1"    // Optional
}
```

#### 6. **sessions** Collection
Active login sessions (for monitoring).

```javascript
sessions/{sessionId}
{
  userId: "user_123",
  userEmail: "user@example.com",
  loginTime: "2025-03-09T08:00:00Z",
  lastActivity: "2025-03-09T10:30:00Z",
  
  device: {
    type: "mobile",
    userAgent: "Mozilla/5.0...",
    browser: "Chrome 120"
  },
  
  status: "active",          // active | expired
  expiresAt: "2025-03-10T08:00:00Z"
}
```

---

## User Roles & Permissions

### Role Hierarchy
```
superadmin (Highest Power)
    │
    ├─→ Full system access
    ├─→ Can access /controls dashboard
    ├─→ Can view all logs and sessions
    └─→ Can impersonate any user
    
admin
    │
    ├─→ Manage all users and organizations
    ├─→ Can access /admin dashboard
    ├─→ Can create/delete organizations
    └─→ Can assign leaders
    
leader
    │
    ├─→ Manage users in their organization only
    ├─→ Can access /leader dashboard
    ├─→ Can add/remove team members
    └─→ Cannot create other leaders
    
user (Default)
    │
    ├─→ Manage own profile card only
    ├─→ Can access /dashboard
    └─→ View own analytics
```

### Permission Matrix

| Feature | User | Leader | Admin | Superadmin |
|---------|------|--------|-------|------------|
| Edit own card | ✅ | ✅ | ✅ | ✅ |
| View own analytics | ✅ | ✅ | ✅ | ✅ |
| Manage team members | ❌ | ✅ | ✅ | ✅ |
| Create organizations | ❌ | ❌ | ✅ | ✅ |
| Assign leaders | ❌ | ❌ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ | ✅ |
| Access logs | ❌ | ❌ | ❌ | ✅ |
| Impersonate users | ❌ | ❌ | ❌ | ✅ |

### Checking Roles in Code

```javascript
// Get current user's role
import { getUserRole, isAdmin, isSuperAdmin } from './utils/auth';

const role = await getUserRole(); // Returns: 'user' | 'leader' | 'admin' | 'superadmin'

// Check specific role
const hasAdminAccess = await isAdmin(); // Returns true/false
const hasSuperAdminAccess = await isSuperAdmin();

// In components - protect routes
<ProtectedRoute requireAdmin={true}>
  <AdminDashboard />
</ProtectedRoute>

<ProtectedRoute requireSuperAdmin={true}>
  <ControlsDashboard />
</ProtectedRoute>
```

---

## Profile Card System

### CardProfile Component
Located at: `/src/components/CardProfile.jsx`

This is the **public-facing** profile view that users see when they:
- Tap the NFC card
- Scan the QR code
- Click the shared link

#### Flow:
1. **URL**: `https://evoxnepal.com/card/{userId}`
2. **Load Profile**: Fetch from `profiles/{userId}` in Firestore
3. **Track View**: Log analytics event
4. **Render**: Display profile with all info
5. **Actions**: 
   - Save Contact (vCard download)
   - Click social links
   - Copy profile URL
   - Show QR code

### vCard Generation

The system generates **vCard 3.0** format files for contact saving.

```javascript
// vCard Structure
BEGIN:VCARD
VERSION:3.0
FN:John Doe                           // Full Name
N:Doe;John;Middle;;                   // Name parts (Last;First;Middle;Prefix;Suffix)
ORG:E-VOX Technologies                // Organization
TITLE:Senior Developer                // Job Title
EMAIL:john@company.com                // Email
TEL:555-1234                          // Phone (can have multiple)
TEL:555-5678
URL:https://johndoe.com               // Website (can have multiple)
URL:https://blog.johndoe.com
ADR:;;;;;;Kathmandu, Nepal            // Address
NOTE:Full-stack developer...          // Bio
PHOTO;ENCODING=b;TYPE=JPEG:base64...  // Profile photo (base64 encoded)
END:VCARD
```

**Multiple Phones/Websites**: The system supports:
- Up to 4 phone numbers
- Up to 2 websites
- All are included in the vCard export

### Profile Photo Handling

Photos are stored on **Cloudinary** for:
- ✅ **Fast Loading**: CDN delivery worldwide
- ✅ **Optimization**: Automatic compression and resizing
- ✅ **Transformations**: Can apply filters, crops, etc.
- ✅ **Free Tier**: Generous free usage limits

```javascript
// Photo Upload Flow
1. User selects image file
2. Upload to Cloudinary via API
3. Get back secure URL: https://res.cloudinary.com/.../photo.jpg
4. Save URL to Firestore profile
5. Display image with URL
```

### QR Code

Each profile has a built-in QR code that:
- Points to the same URL as the NFC card
- Can be printed or shared digitally
- Generated client-side (no server needed)
- Backup method if NFC doesn't work

```javascript
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG 
  value={`https://evoxnepal.com/card/${userId}`}
  size={200}
  level="H" // Error correction level (L, M, Q, H)
/>
```

---

## Analytics & Tracking

### Tracked Events

#### 1. Profile View
When someone views your card.

```javascript
await trackProfileView(profileId, {
  type: 'profile_card_view',
  timestamp: Date.now(),
  viewer: 'direct_visit'
});
```

#### 2. Social Link Click
When someone clicks a social media link.

```javascript
await trackSocialLinkClick(profileId, 'linkedin', 'https://linkedin.com/in/...');
```

#### 3. Contact Save
When someone downloads your vCard.

```javascript
await trackContactSave(profileId, 'vcard_download');
```

### Analytics Dashboard

Users see analytics in `/dashboard` under the Analytics tab:

**Metrics Displayed:**
- **Total Profile Views**
- **Daily/Weekly/Monthly Views**
- **Total Contact Saves**
- **Social Link Click Breakdown** (which platform gets clicked most)
- **View Trends** (increasing/decreasing)
- **Recent Activity** (last 7 days chart)

**Data Aggregation:**
```javascript
// Fetch all analytics for a user
const analytics = await getUserAnalytics(userId);

{
  profileViews: {
    total: 152,
    daily: {
      "2025-03-09": 15,
      "2025-03-08": 12,
      // ...
    }
  },
  socialLinkClicks: {
    total: 45,
    byPlatform: {
      linkedin: 20,
      instagram: 15,
      facebook: 10
    }
  },
  contactSaves: {
    total: 23,
    byMethod: {
      vcard_download: 23
    }
  }
}
```

---

## File Upload System

### Cloudinary Integration

All image uploads use Cloudinary:
- Profile photos
- Company logos
- Organization branding

**Configuration** (in `.env`):
```bash
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
VITE_CLOUDINARY_UPLOAD_PRESET=evox_uploads
```

### Upload Flow

```javascript
// 1. User selects file
<input type="file" accept="image/*" onChange={handleFileUpload} />

// 2. Upload to Cloudinary
const formData = new FormData();
formData.append('file', file);
formData.append('upload_preset', 'evox_uploads');
formData.append('cloud_name', 'your_cloud_name');

const response = await fetch(
  `https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`,
  {
    method: 'POST',
    body: formData
  }
);

const data = await response.json();
const imageUrl = data.secure_url; // https://res.cloudinary.com/.../image.jpg

// 3. Save URL to Firestore
await setDoc(doc(db, 'profiles', userId), {
  photoURL: imageUrl
}, { merge: true });

// 4. Display image
<img src={imageUrl} alt="Profile" />
```

### Image Optimization

Cloudinary automatically:
- Compresses images
- Converts to WebP for modern browsers
- Generates responsive sizes
- Serves from CDN

You can also apply transformations:
```javascript
// Original: https://res.cloudinary.com/.../image.jpg
// Transformed: https://res.cloudinary.com/.../w_400,h_400,c_fill/image.jpg
//   w_400: width 400px
//   h_400: height 400px
//   c_fill: crop to fill
```

---

## Theme System

### Available Themes

Users can choose from 3 professionally designed themes:

#### Theme 1: Classic Professional
- Clean layout
- Blue/white color scheme
- Traditional business card style
- Best for: Corporate professionals

#### Theme 2: Modern Gradient
- Vibrant gradient backgrounds
- Animated elements
- Bold typography
- Best for: Creative professionals, startups

#### Theme 3: Minimalist Clean
- Whitespace-focused
- Simple, elegant design
- Easy to read
- Best for: Consultants, executive roles

### Switching Themes

```javascript
// In Dashboard component
const handleThemeSelect = async (theme) => {
  // Update local state
  setFormData({ ...formData, theme });
  
  // Save to Firestore
  await setDoc(doc(db, 'profiles', profileId), 
    { theme }, 
    { merge: true }
  );
};

// In CardProfile component
// Theme is loaded from profile data and CSS classes applied
<div className={`profile-card ${profile.theme}`}>
  {/* Card content */}
</div>
```

### Creating New Themes

To add a new theme:

1. **Create CSS file**: `src/components/CardProfileTheme4.css`
2. **Import in CardProfile.jsx**:
   ```javascript
   import './CardProfileTheme4.css';
   ```
3. **Add styles**:
   ```css
   .profile-card.theme4 {
     /* Your custom styles */
   }
   ```
4. **Update theme selector** in Dashboard

---

## API & Functions

### Firebase Functions

Located at: `/server/functions/index.js`

#### Deployed Functions:

##### 1. onUserCreated (Trigger)
Automatically runs when a new user signs up.

```javascript
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  // Create user document in Firestore
  // Set default role
  // Send welcome email
  // Log activity
});
```

##### 2. User Management Functions
- `createUserInOrganization`: Add user to organization
- `removeUserFromOrganization`: Remove user from organization
- `updateUserRole`: Change user's role

### Client-Side Functions

Located at: `/src/utils/auth.js`

#### Key Functions:

```javascript
// Authentication
export const loginUser = async (email, password) => { ... }
export const signUpUser = async (email, password, userData) => { ... }
export const logoutUser = async () => { ... }

// Role Management
export const getUserRole = async () => { ... }
export const isAdmin = async () => { ... }
export const isSuperAdmin = async () => { ... }

// Organization Management
export const createOrganization = async (orgData) => { ... }
export const addUserToOrganization = async (userId, organizationId) => { ... }

// Activity Logging
export const logActivity = async (action, details) => { ... }
```

#### Analytics Functions

Located at: `/src/utils/analytics.js`

```javascript
// Track Events
export const trackProfileView = async (profileId, viewerInfo) => { ... }
export const trackSocialLinkClick = async (profileId, platform, url) => { ... }
export const trackContactSave = async (profileId, method) => { ... }

// Get Data
export const getUserAnalytics = async (userId) => { ... }
```

---

## Security Implementation

### 1. Firebase Security Rules

Located at: `/firestore.rules`

#### profiles Collection
```javascript
match /profiles/{profileId} {
  // Anyone can read profiles (they're public business cards)
  allow read: if true;
  
  // Only owner can write
  allow write: if request.auth != null 
                && request.auth.uid == resource.data.userId;
  
  // Admins can write any profile
  allow write: if request.auth != null 
                && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
}
```

#### users Collection
```javascript
match /users/{userId} {
  // Users can read their own document
  allow read: if request.auth != null 
               && request.auth.uid == userId;
  
  // Users can update their own document (except role)
  allow update: if request.auth != null 
                 && request.auth.uid == userId
                 && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
  
  // Admins can read/write any user
  allow read, write: if request.auth != null 
                      && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
}
```

#### analytics Collection
```javascript
match /analytics/{analyticsId} {
  // Anyone can write analytics (tracking events)
  allow write: if true;
  
  // Only owner can read their analytics
  allow read: if request.auth != null 
               && request.auth.uid == resource.data.userId;
  
  // Admins can read all analytics
  allow read: if request.auth != null 
               && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
}
```

### 2. Environment Variables

**Never commit** these to Git! Use `.env` file:

```bash
# Firebase
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
VITE_CLOUDINARY_UPLOAD_PRESET=evox_uploads

# EmailJS (for contact forms)
VITE_EMAILJS_SERVICE_ID=service_xxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 3. Protected Routes

```javascript
// Wrap sensitive routes with ProtectedRoute component
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

<Route path="/admin" element={
  <ProtectedRoute requireAdmin={true}>
    <AdminDashboard />
  </ProtectedRoute>
} />

<Route path="/controls" element={
  <ProtectedRoute requireSuperAdmin={true}>
    <ControlsDashboard />
  </ProtectedRoute>
} />
```

### 4. Password Security

- **Minimum Length**: 6 characters (Firebase default)
- **Hashing**: Firebase handles password hashing
- **Password Reset**: Email-based reset flow
- **Re-authentication**: Required for sensitive operations

```javascript
// Change password requires re-authentication
const credential = EmailAuthProvider.credential(
  user.email,
  currentPassword
);
await reauthenticateWithCredential(user, credential);
await updatePassword(user, newPassword);
```

---

## Testing & Development

### Local Development Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd evox-nfc-app
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

4. **Run Development Server**
```bash
npm run dev
```

5. **Open in Browser**
```
http://localhost:5173
```

### Testing Modes

#### 1. Test with Firebase Emulators (Optional)

Run local Firebase emulators for testing without affecting production:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulators
firebase emulators:start
```

Update `firebase.js`:
```javascript
if (location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

#### 2. Test User Accounts

Create test users with different roles:
- Test User: `testuser@evox.com`
- Test Leader: `testleader@evox.com`
- Test Admin: `testadmin@evox.com`

#### 3. Test NFC Simulation

Since you can't test NFC on desktop:
- **Option 1**: Use direct URL: `http://localhost:5173/card/{userId}`
- **Option 2**: Generate QR code and scan with phone
- **Option 3**: Deploy to Firebase Hosting and test on phone

### Common Testing Scenarios

```javascript
// Test 1: Profile View Tracking
// 1. Open /card/{userId}
// 2. Check Firestore analytics collection
// 3. Verify new document created with eventType: 'profile_view'

// Test 2: vCard Export
// 1. Open profile card
// 2. Click "Save Contact"
// 3. Verify .vcf file downloads
// 4. Import to phone contacts to verify format

// Test 3: Social Link Tracking
// 1. Click a social media link on profile
// 2. Check analytics collection
// 3. Verify eventType: 'social_link_click' with correct platform

// Test 4: Theme Switching
// 1. Login to dashboard
// 2. Select different theme
// 3. View public profile
// 4. Verify theme CSS is applied correctly

// Test 5: Role-Based Access
// 1. Login as regular user
// 2. Try accessing /admin route
// 3. Verify redirect or access denied
```

---

## Deployment Guide

### Deploying to Firebase Hosting

1. **Build Production App**
```bash
npm run build
```

2. **Initialize Firebase (first time only)**
```bash
firebase login
firebase init hosting
# Select your Firebase project
# Public directory: dist
# Single page app: Yes
# Overwrite index.html: No
```

3. **Deploy**
```bash
firebase deploy --only hosting
```

4. **Your site is now live!**
```
https://your-project.firebaseapp.com
```

### Custom Domain Setup

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `evoxnepal.com`)
4. Follow DNS configuration instructions
5. Add these DNS records at your domain provider:
   ```
   Type: A
   Name: @
   Value: [Firebase IP addresses shown in console]
   
   Type: TXT
   Name: @
   Value: [Verification code from Firebase]
   ```

6. Wait for DNS propagation (up to 24 hours)
7. Firebase automatically provisions SSL certificate

### Deploying Firebase Functions

```bash
firebase deploy --only functions
```

### Environment Variables in Production

Set production environment variables:

```bash
# Option 1: Use Firebase Hosting environment
# Edit firebase.json to include environment config

# Option 2: Use .env.production file
# Vite automatically uses .env.production in production builds
```

**Important**: Never commit `.env` files to Git. Use:
```bash
# .gitignore
.env
.env.local
.env.production
```

---

## Common Issues & Solutions

### Issue 1: "Firebase not defined"
**Cause**: Environment variables not loaded correctly.

**Solution**:
1. Check `.env` file exists in project root
2. Verify variable names start with `VITE_`
3. Restart development server: `npm run dev`

### Issue 2: "Permission denied" on Firestore
**Cause**: Firestore security rules too restrictive.

**Solution**:
1. Check `firestore.rules` file
2. Deploy rules: `firebase deploy --only firestore:rules`
3. Verify user is authenticated
4. Check user role in Firestore

### Issue 3: Analytics not tracking
**Cause**: Analytics function failing silently.

**Solution**:
1. Check browser console for errors
2. Verify Firestore rules allow writes to `analytics` collection
3. Test with: `await trackProfileView('test123')`
4. Check Firestore console for new documents

### Issue 4: Images not uploading
**Cause**: Cloudinary credentials incorrect or CORS issue.

**Solution**:
1. Verify Cloudinary environment variables
2. Check upload preset exists and is unsigned
3. Enable CORS in Cloudinary settings
4. Check browser network tab for API response

### Issue 5: vCard not downloading
**Cause**: Browser blocking download or vCard format error.

**Solution**:
1. Check browser console for errors
2. Verify Blob creation and URL generation
3. Test in different browsers
4. Check vCard format syntax

### Issue 6: NFC not working on phone
**Cause**: Phone NFC disabled or card not programmed.

**Solution**:
1. Enable NFC in phone settings
2. Verify NFC card is programmed with correct URL
3. Use NFC TagWriter app to verify card data
4. Try QR code as backup method

### Issue 7: Profile changes not reflecting
**Cause**: Cache or old data in state.

**Solution**:
1. Hard refresh browser: `Ctrl+F5` or `Cmd+Shift+R`
2. Clear browser cache
3. Check Firestore console to verify data saved
4. Add timestamp to force re-fetch

### Issue 8: Role not updating
**Cause**: Role cached in session or Firestore rules preventing update.

**Solution**:
1. Logout and login again
2. Check Firestore rules allow role updates for admins
3. Verify admin is using correct function to update role
4. Check `users/{userId}` document in Firestore

---

## Additional Resources

### Learning NFC Technology
- [NFC Forum](https://nfc-forum.org/) - Official NFC standards
- [Android NFC Guide](https://developer.android.com/guide/topics/connectivity/nfc) - How NFC works on Android
- [Apple Core NFC](https://developer.apple.com/documentation/corenfc) - How NFC works on iOS

### Firebase Documentation
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Firestore Database](https://firebase.google.com/docs/firestore)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

### React & Vite
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com/)

### Cloudinary
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Image Upload](https://cloudinary.com/documentation/image_upload_api_reference)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)

---

## Future Enhancements

### Planned Features
- [ ] **Multi-language Support**: Add multiple languages
- [ ] **Advanced Analytics**: Heatmaps, click tracking, conversion funnels
- [ ] **Custom Themes**: Let users create fully custom themes
- [ ] **Video Backgrounds**: Allow video in profile cards
- [ ] **Calendar Integration**: Book meetings directly from card
- [ ] **Chat Integration**: Live chat on profile cards
- [ ] **Payment Integration**: Accept payments through card (e.g., for freelancers)
- [ ] **Apple Wallet Integration**: Save card to Apple Wallet
- [ ] **Google Pay Integration**: Save card to Google Pay
- [ ] **Bulk vCard Import**: Import existing contacts
- [ ] **Team Analytics**: Aggregated analytics for organizations
- [ ] **API for Third-Party**: Allow external apps to integrate

### Technical Improvements
- [ ] **Progressive Web App (PWA)**: Offline support, installable
- [ ] **Server-Side Rendering**: Better SEO with Next.js or similar
- [ ] **GraphQL API**: More efficient data fetching
- [ ] **Real-time Presence**: Show who's viewing your card live
- [ ] **Caching Strategy**: Better performance with service workers
- [ ] **Automated Testing**: Unit and integration tests
- [ ] **CI/CD Pipeline**: Automated deployments
- [ ] **Monitoring**: Error tracking with Sentry or similar

---

## Support & Contact

For questions or support:
- **Email**: sanzeeprae@gmail.com
- **Website**: https://www.sanjeevrai1.com.np
- **Documentation**: This file

---

