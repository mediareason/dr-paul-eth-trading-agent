// /dashboard/pages/_app.js
// Next.js App Component with Wallet Extension Conflict Workaround

import { useEffect } from 'react';
import { initializeSafeEnvironment } from '../lib/walletWorkaround';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize wallet workaround as soon as the app loads
    console.log('🚀 Initializing Dr. Paul\'s Trading App...');
    
    try {
      // Initialize safe environment to prevent wallet conflicts
      const success = initializeSafeEnvironment();
      
      if (success) {
        console.log('✅ Safe environment initialized successfully');
      } else {
        console.warn('⚠️ Safe environment initialization had issues, but continuing...');
      }
      
      // Additional defensive measures
      setTimeout(() => {
        console.log('🎯 Dr. Paul\'s Trading System Ready');
      }, 1500);
      
    } catch (error) {
      console.warn('App initialization error (non-critical):', error.message);
    }
  }, []);

  // Error boundary for wallet-related errors
  useEffect(() => {
    const handleError = (error) => {
      if (
        error.message?.includes('ethereum') ||
        error.message?.includes('Cannot redefine property') ||
        error.filename?.includes('chrome-extension')
      ) {
        console.warn('🚫 Suppressed wallet extension error:', error.message);
        return true; // Mark as handled
      }
      return false;
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <div className="app-container">
      {/* App-wide error handling wrapper */}
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;