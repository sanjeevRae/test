// Firebase core setup for React app
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { Cloudinary } from 'cloudinary-core';

// Network connectivity check
const checkNetworkConnectivity = () => {
  // Return true by default instead of just navigator.onLine
  // The actual connectivity will be tested during Firebase operations
  return true;
};

// Ping test to verify actual connectivity to Firebase - can be called when needed
const pingFirebase = async () => {
  try {
    // Attempt a lightweight operation to check Firebase connectivity
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
    });
    return response.ok || response.status === 200;
  } catch (error) {
    console.error('Firebase ping failed:', error);
    return false;
  }
};

// Try to load Firebase configuration from environment variables first
let firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check for missing Firebase config
const missingConfigKeys = Object.keys(firebaseConfig).filter(key => !firebaseConfig[key]);

// If any essential config is missing, log the issue and use fallback config
if (missingConfigKeys.length > 0) {
  console.warn('Missing Firebase configuration keys from environment variables:', missingConfigKeys);
  console.warn('Using hardcoded fallback configuration for development - this should not be used in production.');
  
  // Fallback Firebase config - REPLACE THESE WITH YOUR ACTUAL VALUES
  // These are needed if environment variables aren't loading
  firebaseConfig = {
    apiKey: "AIzaSyBs2e6VUELX4S_D7CIobxBkCuOB217LovU",
    authDomain: "evox-card.firebaseapp.com",
    projectId: "evox-card",
    storageBucket: "evox-card.appspot.com",
    messagingSenderId: "566960653523",
    appId: "1:566960653523:web:b6074aceb1ba7dffcc8026",
    measurementId: "G-J1GSZSN3MY"
  };
  
  console.log('Firebase fallback configuration loaded');
}

// Check if config is properly formed
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Critical Firebase configuration is missing!', firebaseConfig);
}

// Cloudinary configuration with fallbacks
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnqa3pqtc';
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '638125756951238';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'evox_uploads';

// Initialize Cloudinary
const cloudinary = new Cloudinary({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  secure: true
});

// Cloudinary upload URL
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Initialize Firebase with better error logging and connectivity check
let app;
let auth;
let db;

try {
  if (!checkNetworkConnectivity()) {
    console.error('No network connectivity detected. Firebase services may not work properly.');
  }

  // Initialize Firebase App
  app = initializeApp(firebaseConfig);
  
  // Get Firebase Auth and Firestore instances
  auth = getAuth(app);
  db = getFirestore(app);

  // Check for local emulator environment
  const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
  if (useEmulator) {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
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

// Add network status monitoring
window.addEventListener('online', () => {
  console.log('Network connection restored');
});

window.addEventListener('offline', () => {
  console.error('Network connection lost. Firebase services may not work properly.');
});

// Create a Cloudinary-based storage implementation
const cloudinaryStorage = {
  // Upload a file to Cloudinary
  async uploadFile(file, path) {
    try {
      console.log('Starting file upload to Cloudinary...', {
        cloudName: CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!CLOUDINARY_API_KEY,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET
      });
      
      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      // Add API key if available
      if (CLOUDINARY_API_KEY) {
        formData.append('api_key', CLOUDINARY_API_KEY);
      }
      
      // Use path components as folder structure in Cloudinary
      const folder = path.split('/').slice(0, -1).join('/');
      if (folder) {
        formData.append('folder', folder);
      }
      
      // Upload to Cloudinary with CORS headers
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        headers: {
          // Remove content-type header to let the browser set it with the correct boundary for FormData
          // 'Content-Type': 'multipart/form-data',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload failed:', response.status, response.statusText, errorText);
        throw new Error(`Cloudinary upload failed (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Cloudinary upload successful:', data.secure_url);
      
      // Store reference in Firestore for tracking
      try {
        const filesRef = collection(db, 'files');
        const fileDoc = await addDoc(filesRef, {
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          path: path,
          cloudinaryId: data.public_id,
          cloudinaryUrl: data.secure_url,
          createdAt: new Date().toISOString(),
          userId: auth.currentUser?.uid || 'anonymous'
        });
        
        console.log('File reference saved to Firestore:', fileDoc.id);
      } catch (firestoreError) {
        // If Firestore saving fails, we still return the upload result
        // since the image was successfully uploaded to Cloudinary
        console.error('Error saving file reference to Firestore:', firestoreError);
      }
      
      return {
        id: data.public_id,
        fullPath: path,
        name: file.name,
        getDownloadURL: () => Promise.resolve(data.secure_url)
      };
    } catch (error) {
      console.error('Error in Cloudinary upload:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  },
  
  // Create a reference to a file path
  ref(path) {
    return {
      fullPath: path,
      // Get download URL from Cloudinary or find in Firestore
      getDownloadURL: async () => {
        try {
          // Search for file in Firestore by path
          const filesRef = collection(db, 'files');
          const q = query(filesRef, where('path', '==', path));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Return the URL stored in Firestore
            return querySnapshot.docs[0].data().cloudinaryUrl;
          }
          
          // If not found, return a placeholder
          return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/placeholder`;
        } catch (error) {
          console.error('Error getting download URL:', error);
          return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/placeholder`;
        }
      },
      // Upload method
      put: (file) => cloudinaryStorage.uploadFile(file, path),
      // Delete method - mimics Firebase Storage's delete method
      delete: async () => {
        try {
          // Find the file reference in Firestore
          const filesRef = collection(db, 'files');
          const q = query(filesRef, where('path', '==', path));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const fileDoc = querySnapshot.docs[0];
            
            // Delete the Firestore record
            await deleteDoc(doc(db, 'files', fileDoc.id));
            console.log('File reference deleted from Firestore');
          }
          
          return Promise.resolve();
        } catch (error) {
          console.error('Error deleting file:', error);
          return Promise.reject(error);
        }
      }
    };
  }
};

// Use Cloudinary-based storage implementation instead of Firebase Storage
const storage = cloudinaryStorage;

// Enhanced Firebase auth functions with retry mechanism
const enhancedSignInWithEmailAndPassword = async (auth, email, password, maxRetries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retrying login (attempt ${attempt} of ${maxRetries})...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(`Login attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Don't retry for certain errors (like wrong password)
      if (error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password' || 
          error.code === 'auth/invalid-credential') {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
};

const enhancedCreateUserWithEmailAndPassword = async (auth, email, password, maxRetries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (!checkNetworkConnectivity()) {
        throw new Error('No network connection available');
      }
      
      if (attempt > 0) {
        console.log(`Retrying signup (attempt ${attempt} of ${maxRetries})...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(`Signup attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Don't retry for certain errors (like email already in use)
      if (error.code === 'auth/email-already-in-use' || 
          error.code === 'auth/invalid-email' || 
          error.code === 'auth/weak-password') {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
};

// Export Firebase services and functions
export { 
  auth, 
  db, 
  storage, 
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
  checkNetworkConnectivity,
  pingFirebase
};