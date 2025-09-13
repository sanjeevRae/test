// Firebase core setup for React app
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { Cloudinary } from 'cloudinary-core';

// Network connectivity check with better reliability
const checkNetworkConnectivity = () => {
  return navigator.onLine && localStorage.getItem('network_failed') !== 'true';
};

// Ping test to verify actual connectivity to Firebase
const pingFirebase = async () => {
  try {
    const timestamp = Date.now();
    const response = await fetch(`https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?database=projects/${firebaseConfig.projectId}/databases/(default)&VER=8&RID=${timestamp}&CVER=22`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    localStorage.removeItem('network_failed');
    return response.ok || response.status === 200;
  } catch (error) {
    console.error('Firebase ping failed:', error);
    if (error.name !== 'AbortError') {
      localStorage.setItem('network_failed', 'true');
    }
    return false;
  }
};

// Load Firebase configuration from environment variables with validation
const loadFirebaseConfig = () => {
  // Try to load configuration from environment variables first
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
  
  // Check for missing config
  const missingKeys = Object.keys(envConfig).filter(key => 
    !envConfig[key] && key !== 'measurementId' // measurementId is optional
  );

//   if (missingKeys.length > 0) {
//     console.warn('Missing Firebase configuration keys from environment variables:', missingKeys);
//     console.warn('Using fallback configuration - NOT RECOMMENDED FOR PRODUCTION');
    
//     // Fallback config for development only
//     return {
//       apiKey: "AIzaSyBs2e6VUELX4S_D7CIobxBkCuOB217LovU",
//       authDomain: "evox-card.firebaseapp.com",
//       projectId: "evox-card",
//       storageBucket: "evox-card.appspot.com",
//       messagingSenderId: "566960653523",
//       appId: "1:566960653523:web:b6074aceb1ba7dffcc8026",
//       measurementId: "G-J1GSZSN3MY"
//     };
//   }
  
  return envConfig;
};

// Initialize Firebase config
const firebaseConfig = loadFirebaseConfig();

// Validate critical configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Critical Firebase configuration is missing!', 
    Object.keys(firebaseConfig)
      .filter(key => !['apiKey', 'measurementId'].includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: firebaseConfig[key] }), {})
  );
}

// Cloudinary configuration with enhanced security
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnqa3pqtc';
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '638125756951238';
const CLOUDINARY_API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET; // This should be only used server-side
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'evox_uploads';

// Initialize Cloudinary with optimizations
const cloudinary = new Cloudinary({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  secure: true,
  cname: import.meta.env.VITE_CLOUDINARY_CNAME, // Optional custom domain
});

// Cloudinary upload URL
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Function to generate Cloudinary signature (would normally be done server-side)
// We'll use a Firebase Function or proxy endpoint in production
const generateCloudinarySignature = async (params) => {
  // For client-side uploads using upload presets, we'll rely on the preset's settings
  // This is a placeholder for a server-side implementation
  
  try {
    // In production, this would be a call to your backend to generate the signature
    // Example: const response = await fetch('/api/cloudinary/signature', { method: 'POST', body: JSON.stringify(params) });
    
    // For now, we'll return null to rely on upload presets for client-side uploads
    return null;
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return null;
  }
};

// Initialize Firebase with error handling
let app, auth, db;

try {
  // Check network before initializing
  if (!checkNetworkConnectivity()) {
    console.warn('Network connectivity issues detected. Firebase services may be limited.');
  }

  // Initialize Firebase App
  app = initializeApp(firebaseConfig);
  
  // Get Firebase Auth and Firestore instances
  auth = getAuth(app);
  db = getFirestore(app);

  // Set up emulators for local development
  if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    const firestoreEmulatorHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080';
    
    connectAuthEmulator(auth, `http://${authEmulatorHost}`);
    connectFirestoreEmulator(db, 
      firestoreEmulatorHost.split(':')[0], 
      parseInt(firestoreEmulatorHost.split(':')[1])
    );
    
    console.log('Firebase emulators connected for local development');
  }
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  console.error('Firebase config used:', { 
    apiKey: firebaseConfig.apiKey ? '[PRESENT]' : '[MISSING]',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
  });
}

// Add network status monitoring with reconnection logic
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

window.addEventListener('online', async () => {
  console.log('Network connection restored, checking Firebase connectivity...');
  reconnectAttempts = 0;
  
  // Verify actual connectivity to Firebase
  const isConnected = await pingFirebase();
  if (isConnected) {
    console.log('Firebase connectivity confirmed');
    // You could trigger reloading of any cached operations here
  } else {
    console.warn('Network available but Firebase is unreachable');
  }
});

window.addEventListener('offline', () => {
  console.error('Network connection lost. Firebase services will not work until connection is restored.');
});

// Helper function to convert base64 to Blob
const base64ToBlob = (base64, contentType = '') => {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

// Create a Cloudinary-based storage implementation with direct uploads
// Modified to use direct upload without Cloud Functions dependency
const cloudinaryStorage = {
  // Upload a file to Cloudinary with improved reliability
  async uploadFile(file, path, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Validate inputs
      if (!file || !(file instanceof File || file instanceof Blob)) {
        throw new Error('Invalid file object provided');
      }
      
      if (!path || typeof path !== 'string') {
        throw new Error('Invalid path provided');
      }
      
      console.log('Starting direct file upload to Cloudinary...', {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        fileType: file.type,
      });
      
      // Get current user for metadata
      if (!auth.currentUser) {
        throw new Error('You must be logged in to upload files');
      }
      
      const userId = auth.currentUser.uid;
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      
      // Create form data for direct Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('api_key', CLOUDINARY_API_KEY);
      
      // Add folder path if provided
      if (path) {
        // Extract folder without filename
        const folderPath = path.split('/').slice(0, -1).join('/');
        if (folderPath) {
          formData.append('folder', folderPath);
        }
        
        // Use path as public_id, but ensure proper formatting
        const publicId = `${path.replace(/\.[^/.]+$/, "")}_${userId.substring(0, 5)}_${timestamp}_${randomString}`;
        formData.append('public_id', publicId);
      }
      
      // Add metadata
      const context = {
        userId: userId,
        uploadTimestamp: timestamp,
        originalFilename: file.name
      };
      
      // Add custom metadata if provided
      if (options.metadata) {
        Object.assign(context, options.metadata);
      }
      
      // Convert context object to Cloudinary context format
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join('|');
      
      formData.append('context', contextStr);
      
      // Direct upload to Cloudinary
      console.log('Uploading directly to Cloudinary');
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Cloudinary upload failed:', errorData);
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          const errorText = await response.text();
          console.error('Cloudinary upload failed:', response.status, response.statusText, errorText);
        }
        throw new Error(`Cloudinary upload failed (${response.status}): ${errorMessage}`);
      }
      
      const data = await response.json();
      console.log('Cloudinary upload successful:', data.secure_url);
      
      // Save reference in Firestore
      try {
        await addDoc(collection(db, 'files'), {
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          path: path || '',
          cloudinaryId: data.public_id,
          cloudinaryUrl: data.secure_url,
          createdAt: new Date(),
          userId: userId
        });
      } catch (dbError) {
        console.warn('Failed to save file reference to Firestore:', dbError);
        // Continue anyway since the upload was successful
      }
      
      // Return a Firebase Storage-like result
      return {
        id: data.public_id,
        fullPath: path,
        name: file.name,
        contentType: file.type,
        size: file.size,
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        getDownloadURL: () => Promise.resolve(data.secure_url),
        metadata: {
          customMetadata: options.metadata || {},
          ...data
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort errors specially
      if (error.name === 'AbortError') {
        console.error('Upload timed out after 30 seconds');
        throw new Error('Upload timed out. Please check your connection and try again.');
      }
      
      console.error('Error in Cloudinary upload:', error, error.stack);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  },
  
  // Get a storage reference - Firebase Storage compatibility
  ref(path) {
    return {
      fullPath: path,
      name: path.split('/').pop(),
      
      // Get download URL from Cloudinary or Firestore
      getDownloadURL: async () => {
        try {
          // Try to find reference in Firestore
          const filesRef = collection(db, 'files');
          const q = query(filesRef, where('path', '==', path));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Return the URL stored in Firestore
            return querySnapshot.docs[0].data().cloudinaryUrl;
          }
          
          // If not found, construct direct URL if possible
          const pathParts = path.split('/');
          const fileName = pathParts.pop();
          const folder = pathParts.join('/');
          
          if (folder && fileName) {
            return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/${folder}/${fileName}`;
          }
          
          // Last resort - return placeholder
          return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/placeholder`;
        } catch (error) {
          console.error('Error getting download URL:', error);
          return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/placeholder`;
        }
      },
      
      // Upload method (Firebase Storage compatibility)
      put: (file) => cloudinaryStorage.uploadFile(file, path),
      
      // Upload with metadata (Firebase Storage compatibility)
      putString: (dataString, format = 'raw', metadata = {}) => {
        // Convert data string to Blob based on format
        let blob;
        const contentType = metadata.contentType || 'text/plain';
        
        if (format === 'data_url' && dataString.startsWith('data:')) {
          const [mimeInfo, base64Data] = dataString.split(',');
          const mime = mimeInfo.match(/:(.*?);/)[1];
          blob = base64ToBlob(base64Data, mime);
        } else if (format === 'base64') {
          blob = base64ToBlob(dataString, contentType);
        } else {
          // Raw format
          blob = new Blob([dataString], { type: contentType });
        }
        
        // Create a file from the blob
        const file = new File([blob], path.split('/').pop() || 'file', { type: contentType });
        return cloudinaryStorage.uploadFile(file, path, { metadata });
      },
      
      // Delete method
      delete: async () => {
        try {
          // Find the file reference in Firestore
          const filesRef = collection(db, 'files');
          const q = query(filesRef, where('path', '==', path));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            console.warn('No file reference found to delete:', path);
            return Promise.resolve();
          }
          
          const fileDoc = querySnapshot.docs[0];
          const fileData = fileDoc.data();
          
          // Delete the Firestore record
          await deleteDoc(doc(db, 'files', fileDoc.id));
          console.log('File reference deleted from Firestore:', fileDoc.id);
          
          // Note: In this implementation, we're not actually deleting from Cloudinary
          // as it would require server-side authentication.
          // In a production app, you would call a secure backend to delete the asset.
          
          return Promise.resolve();
        } catch (error) {
          console.error('Error deleting file:', error);
          return Promise.reject(error);
        }
      },
      
      // List all files under this reference (directory)
      list: async (options = { maxResults: 100 }) => {
        try {
          const maxResults = options.maxResults || 100;
          const filesRef = collection(db, 'files');
          
          // Query files that start with this path (as a prefix)
          const q = query(
            filesRef, 
            where('path', '>=', path),
            where('path', '<', path + '\uf8ff')
          );
          
          const querySnapshot = await getDocs(q);
          
          // Convert to Firebase Storage format
          const items = querySnapshot.docs
            .slice(0, maxResults)
            .map(doc => {
              const data = doc.data();
              return {
                fullPath: data.path,
                name: data.fileName,
                contentType: data.contentType,
                size: data.size,
                bucket: CLOUDINARY_CLOUD_NAME,
                getDownloadURL: () => Promise.resolve(data.cloudinaryUrl)
              };
            });
            
          return { 
            items,
            prefixes: [] // Directories not supported in this simple implementation
          };
        } catch (error) {
          console.error('Error listing files:', error);
          return { items: [], prefixes: [] };
        }
      }
    };
  },
  
  // Helper method to generate a unique path
  generateUniquePath: (prefix, fileName) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${prefix}/${timestamp}-${randomString}-${safeName}`;
  }
};

// Helper function to convert base64 to Blob
function base64ToBlob(base64, contentType = '') {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
}

// Use Cloudinary-based storage implementation
const storage = cloudinaryStorage;

// Enhanced Firebase auth functions with retry and better error handling
const enhancedSignInWithEmailAndPassword = async (auth, email, password, maxRetries = 2) => {
  let lastError;
  
  // Validate inputs
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retrying login (attempt ${attempt} of ${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
      return result;
    } catch (error) {
      console.error(`Login attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // User-friendly error mapping
      const userFriendlyError = mapAuthErrorToUserFriendly(error);
      if (userFriendlyError.permanent) {
        throw userFriendlyError.error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw userFriendlyError.error;
      }
    }
  }
};

const enhancedCreateUserWithEmailAndPassword = async (auth, email, password, maxRetries = 2) => {
  let lastError;
  
  // Validate inputs
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  // Password strength check
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (!checkNetworkConnectivity()) {
        throw new Error('No network connection available');
      }
      
      if (attempt > 0) {
        console.log(`Retrying signup (attempt ${attempt} of ${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signup successful');
      return result;
    } catch (error) {
      console.error(`Signup attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // User-friendly error mapping
      const userFriendlyError = mapAuthErrorToUserFriendly(error);
      if (userFriendlyError.permanent) {
        throw userFriendlyError.error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw userFriendlyError.error;
      }
    }
  }
};

// Helper function to map Firebase auth errors to user-friendly messages
function mapAuthErrorToUserFriendly(error) {
  const errorMap = {
    'auth/email-already-in-use': { 
      message: 'This email is already in use. Please try logging in instead.',
      permanent: true
    },
    'auth/invalid-email': { 
      message: 'Please enter a valid email address.',
      permanent: true
    },
    'auth/user-disabled': { 
      message: 'This account has been disabled. Please contact support.',
      permanent: true
    },
    'auth/user-not-found': { 
      message: 'No account found with this email. Please check your email or sign up.',
      permanent: true
    },
    'auth/wrong-password': { 
      message: 'Incorrect password. Please try again or reset your password.',
      permanent: true
    },
    'auth/invalid-credential': {
      message: 'Invalid login credentials. Please try again.',
      permanent: true
    },
    'auth/weak-password': {
      message: 'Password is too weak. Please choose a stronger password.',
      permanent: true
    },
    'auth/network-request-failed': {
      message: 'Network error. Please check your connection and try again.',
      permanent: false
    },
    'auth/too-many-requests': {
      message: 'Too many unsuccessful login attempts. Please try again later.',
      permanent: true
    }
  };
  
  const errorInfo = errorMap[error.code] || { 
    message: `Authentication error: ${error.message}`, 
    permanent: false 
  };
  
  return {
    error: new Error(errorInfo.message),
    permanent: errorInfo.permanent
  };
}

// Export Firebase services and functions
export { 
  app,
  auth, 
  db, 
  storage,
  cloudinary, // Export the Cloudinary instance for direct use if needed
  
  // Firestore utility functions
  doc, 
  getDoc, 
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs, 
  
  // Auth functions with retry mechanism
  enhancedSignInWithEmailAndPassword as signInWithEmailAndPassword,
  enhancedCreateUserWithEmailAndPassword as createUserWithEmailAndPassword,
  
  // Network utilities
  checkNetworkConnectivity,
  pingFirebase
};