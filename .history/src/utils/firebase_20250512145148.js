// Firebase core setup for React app
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

// Removed actual Firebase storage import since it's not available in your region with Spark plan

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create a mock/alternative storage implementation
// This will replace Firebase Storage with Firestore-based storage or external URLs for the Spark plan
const storageMock = {
  // Store file references in Firestore instead
  async uploadFile(file, path) {
    // In a real implementation, you could use:
    // 1. Upload files to a free service like Imgur, ImgBB, or Cloudinary free tier
    // 2. Save the URL in Firestore
    // 3. Return a reference to the URL
    
    try {
      // For now, we'll just simulate a successful upload and return a placeholder URL
      console.warn('Using mock storage. In production, connect to a real storage service.');
      
      // Create a "files" record in Firestore containing metadata
      const filesRef = collection(db, 'files');
      const fileDoc = await addDoc(filesRef, {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        path: path,
        createdAt: new Date().toISOString(),
        // In production, you'd store the actual URL from an external service here
        url: `https://placeholder.com/image_${Date.now()}.jpg`,
      });
      
      return {
        id: fileDoc.id,
        fullPath: path,
        name: file.name,
        // Mock download URL
        getDownloadURL: () => Promise.resolve(`https://placeholder.com/image_${fileDoc.id}.jpg`)
      };
    } catch (error) {
      console.error('Error in storage mock:', error);
      throw error;
    }
  },
  
  // Create a reference to a file
  ref(path) {
    return {
      fullPath: path,
      // Get download URL (gets a placeholder or finds URL in Firestore)
      getDownloadURL: async () => {
        console.warn('Using mock storage. In production, connect to a real storage service.');
        // In a real implementation, you would query Firestore to get the stored URL
        return `https://placeholder.com/image_placeholder.jpg`;
      },
      // Mock upload method
      put: (file) => storageMock.uploadFile(file, path),
      delete: async () => {
        console.warn('Mock storage delete operation');
        // In a real implementation, you would:
        // 1. Delete the file from the external service if possible
        // 2. Remove the reference from Firestore
        return Promise.resolve();
      }
    };
  }
};

// Use the mock storage implementation instead of Firebase Storage
const storage = storageMock;

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