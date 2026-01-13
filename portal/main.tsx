import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import './src/index.css'

console.log('Portal initializing...');
console.log('Root element:', document.getElementById('root'));
console.log('Current location:', window.location.href);
console.log('Base path:', '/portal/');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  
  console.log('Portal React app mounted successfully');
} catch (error) {
  console.error('Failed to mount Portal app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1 style="color: #ef4444;">Portal Failed to Load</h1>
      <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
      <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px; overflow: auto;">${error instanceof Error ? error.stack : ''}</pre>
    </div>
  `;
}
