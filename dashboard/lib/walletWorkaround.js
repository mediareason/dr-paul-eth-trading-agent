// /dashboard/lib/walletWorkaround.js
// Workaround for crypto wallet extension conflicts

export const initializeWalletWorkaround = () => {
  if (typeof window === 'undefined') return;

  // Store the original ethereum object if it exists
  const originalEthereum = window.ethereum;
  
  // Prevent wallet extensions from redefining ethereum property
  try {
    // Create a defensive ethereum object that won't conflict
    const safeEthereum = originalEthereum || {
      isMetaMask: false,
      isPhantom: false,
      request: () => Promise.reject(new Error('No wallet connected')),
      on: () => {},
      removeListener: () => {},
      removeAllListeners: () => {}
    };

    // Use Object.defineProperty with configurable: true to allow extensions to work
    Object.defineProperty(window, 'ethereum', {
      value: safeEthereum,
      writable: false,
      enumerable: true,
      configurable: true // This allows extensions to still modify it
    });

    console.log('🛡️ Wallet conflict workaround initialized');
  } catch (error) {
    console.warn('⚠️ Wallet workaround failed, continuing anyway:', error.message);
  }
};

// Additional workaround for extension conflicts
export const handleExtensionConflicts = () => {
  if (typeof window === 'undefined') return;

  // Suppress wallet-related errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Skip wallet/ethereum related errors
    if (
      message.includes('ethereum') ||
      message.includes('MetaMask') ||
      message.includes('Phantom') ||
      message.includes('Cannot redefine property') ||
      message.includes('chrome-extension://')
    ) {
      console.warn('🚫 Suppressed wallet extension error:', message);
      return;
    }
    
    // Log other errors normally
    originalError.apply(console, args);
  };

  // Handle unhandled promise rejections from wallet extensions
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (
      error?.message?.includes('ethereum') ||
      error?.message?.includes('wallet') ||
      error?.message?.includes('chrome-extension')
    ) {
      console.warn('🚫 Suppressed wallet promise rejection:', error.message);
      event.preventDefault(); // Prevent the error from being thrown
    }
  });

  console.log('🛡️ Extension conflict handler initialized');
};

// Safe wallet detection that won't throw errors
export const detectWallets = () => {
  if (typeof window === 'undefined') return { hasWallet: false, wallets: [] };

  const wallets = [];
  
  try {
    if (window.ethereum) {
      if (window.ethereum.isMetaMask) wallets.push('MetaMask');
      if (window.ethereum.isPhantom) wallets.push('Phantom');
      if (window.ethereum.isCoinbaseWallet) wallets.push('Coinbase');
      if (!wallets.length) wallets.push('Unknown Wallet');
    }
  } catch (error) {
    console.warn('Wallet detection failed:', error.message);
  }

  return {
    hasWallet: wallets.length > 0,
    wallets
  };
};

// Initialize everything safely
export const initializeSafeEnvironment = () => {
  try {
    initializeWalletWorkaround();
    handleExtensionConflicts();
    
    // Add a small delay to let extensions finish loading
    setTimeout(() => {
      const detection = detectWallets();
      if (detection.hasWallet) {
        console.log('💰 Detected wallets:', detection.wallets.join(', '));
      }
    }, 1000);
    
    return true;
  } catch (error) {
    console.warn('Safe environment initialization failed:', error.message);
    return false;
  }
};