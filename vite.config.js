import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { transformWithEsbuild } from 'vite'
import fs from 'fs'

// Custom plugin to modify CSP in HTML files
const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      // Update the Content Security Policy to include Firebase Cloud Functions and Google APIs
      return html.replace(
        /<meta http-equiv="Content-Security-Policy"[^>]*>/,
        `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://api.emailjs.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com https://*.firebase.io https://*.firebaseapp.com https://firestore.googleapis.com https://securetoken.googleapis.com https://*.cloudinary.com https://*.cloudfunctions.net https://www.googletagmanager.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://apis.google.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://pro.fontawesome.com; img-src 'self' https://*.cloudinary.com data: blob:; font-src 'self' https://cdnjs.cloudflare.com https://pro.fontawesome.com; media-src 'self' https://*.cloudinary.com; frame-src 'self' https://accounts.google.com;" />`
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
  server: {
    allowedHosts: [
      'systematically-filtre-kandice.ngrok-free.dev'
    ]
  }
})
