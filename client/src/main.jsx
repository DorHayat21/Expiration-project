import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // CRITICAL: This must load the global styles

ReactDOM.createRoot(document.getElementById('root')).render(
  // React.StrictMode is a standard practice for development
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);