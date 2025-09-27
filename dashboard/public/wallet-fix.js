// Simple wallet error prevention - add to document head
const script = document.createElement('script');
script.innerHTML = `
  // Prevent ethereum redefinition errors
  (function() {
    if (typeof window !== 'undefined') {
      const originalDefineProperty = Object.defineProperty;
      Object.defineProperty = function(obj, prop, descriptor) {
        if (obj === window && prop === 'ethereum') {
          // Make ethereum property configurable to prevent conflicts
          descriptor.configurable = true;
          descriptor.writable = true;
        }
        return originalDefineProperty.call(this, obj, prop, descriptor);
      };
      
      // Suppress specific wallet errors
      const originalError = console.error;
      console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('Cannot redefine property: ethereum') || 
            message.includes('chrome-extension') && message.includes('ethereum')) {
          return; // Suppress these specific errors
        }
        return originalError.apply(console, args);
      };
    }
  })();
`;
document.head.appendChild(script);