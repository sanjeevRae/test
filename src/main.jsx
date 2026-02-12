import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Developer Console Greeting
console.log(
  '%c\n' +
  ' Contact Me \n' +
  '  __      __\n' +
  ' ( _\\    /_ )\n' +
  '  \\ _\\  /_ / \n' +
  '   \\ _\\/_ /_ _\n' +
  '   |_____/_/ /|\n' +
  '   (  (_)__)J-)\n' +
  '   (  /`.,   /\n' +
  '    \\/  ;   /\n' +
  '     | === |\n\n' +
  'Email: sanzeeprae@gmail.com\n',
  'color: #03dd2f; font-weight: bold; font-size: 14px; font-family: monospace;'
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
