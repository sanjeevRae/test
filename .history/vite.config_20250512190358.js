import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { transformWithEsbuild } from 'vite'
import fs from 'fs'

// Custom plugin to modify CSP in HTML files
const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      // Update the Content Security Policy to include Firebase Cloud Functions
      return html.replace(
        /<meta http-equiv="Content-Security-Policy"[^>]*>/,
        `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com https://*.firebase.io https://*.firebaseapp.com https://firestore.googleapis.com https://securetoken.googleapis.com https://*.cloudinary.com https://*.cloudfunctions.net; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.cloudinary.com data: blob:; font-src 'self'; media-src 'self' https://*.cloudinary.com; frame-src 'self';" />`
      );
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    htmlPlugin()
  ],
})
