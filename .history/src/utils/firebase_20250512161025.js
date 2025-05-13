// Firebase core setup for React app
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { Cloudinary } from 'cloudinary-core';

// Check if environment variables are defined
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if any required Firebase config is missing
const hasMissingFirebaseConfig = !firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId;
if (hasMissingFirebaseConfig) {
  console.error('Firebase configuration missing one or more required values:', 
    Object.entries(firebaseConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
      .join(', ')
  );
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const cloudinary = new Cloudinary({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  secure: true
});

// Construct the Cloudinary upload URL with your cloud name
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Add authentication functions to the auth object for easier usage
  auth.signInWithEmailAndPassword = (email, password) => signInWithEmailAndPassword(auth, email, password);
  auth.createUserWithEmailAndPassword = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Create a Cloudinary-based storage implementation
const cloudinaryStorage = {
  // Upload a file to Cloudinary
  async uploadFile(file, path) {
    try {
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
      
      // Upload to Cloudinary
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Store reference in Firestore for tracking
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
      
      console.log('File uploaded successfully to Cloudinary:', data.secure_url);
      
      return {
        id: fileDoc.id,
        fullPath: path,
        name: file.name,
        // Return function that provides the Cloudinary URL
        getDownloadURL: () => Promise.resolve(data.secure_url)
      };
    } catch (error) {
      console.error('Error in Cloudinary upload:', error);
      throw error;
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
            const fileData = fileDoc.data();
            
            // Note: Actual deletion from Cloudinary would require a server-side implementation
            // with proper authentication for security reasons
            
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
  // Auth functions
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};