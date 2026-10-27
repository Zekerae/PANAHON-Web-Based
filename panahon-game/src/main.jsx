import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { initGuiScale } from './guiScale.js';

// Apply saved GUI Scale immediately before rendering
initGuiScale();

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
