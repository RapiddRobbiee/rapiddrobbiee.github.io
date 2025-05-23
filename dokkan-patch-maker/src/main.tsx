import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext'; // Import AuthProvider
import './index.css'; // Import global styles and Tailwind directives
import '@fortawesome/fontawesome-free/css/all.min.css' ; // Import Font Awesome

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);