// Firebase core setup for React app
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { Cloudinary } from 'cloudinary-core';

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Cloudinary
const cloudinary = new Cloudinary({
  cloud_name: 'demo', // Replace with your Cloudinary cloud name when you sign up
  secure: true
});

// Convert unsigned upload to signed (safer) when you have your own account
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; // Default unsigned preset
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/demo/image/upload`;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create a Cloudinary-based storage implementation
const cloudinaryStorage = {
  // Upload a file to Cloudinary
  async uploadFile(file, path) {
    try {
      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', path.split('/')[0]); // Use first part of path as folder
      
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
      });
      
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
  
  // Create a reference to a file
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
          return 'https://res.cloudinary.com/demo/image/upload/v1/placeholder';
        } catch (error) {
          console.error('Error getting download URL:', error);
          return 'https://res.cloudinary.com/demo/image/upload/v1/placeholder';
        }
      },
      // Upload method
      put: (file) => cloudinaryStorage.uploadFile(file, path),
      // Delete method
      delete: async () => {
        try {
          // Find the file reference in Firestore
          const filesRef = collection(db, 'files');
          const q = query(filesRef, where('path', '==', path));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const fileDoc = querySnapshot.docs[0];
            const fileData = fileDoc.data();
            
            // For actual implementation with your own Cloudinary account:
            // 1. Use Cloudinary Admin API to delete the file
            // 2. You'll need to implement server-side deletion with proper authentication
            
            // Delete the Firestore record
            await deleteDoc(doc(db, 'files', fileDoc.id));
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
  getDocs
};