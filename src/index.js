import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
const rootElement = document.getElementById('root');
if (!rootElement) {
 console.error("Root element with id 'root' not found. Ensure public/index.html contains <div id=\"root\"></div>.");
} else {
 const root = ReactDOM.createRoot(rootElement);
 root.render(
 <React.StrictMode>
 <App />
 </React.StrictMode>
 );
}
--- end src/index.js ---
