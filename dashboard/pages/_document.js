import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Load wallet fix script before anything else */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
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
                          (message.includes('chrome-extension') && message.includes('ethereum'))) {
                        console.warn('Wallet extension error suppressed:', message);
                        return; // Suppress these specific errors
                      }
                      return originalError.apply(console, args);
                    };
                    
                    // Handle unhandled errors too
                    window.addEventListener('error', function(event) {
                      if (event.message && event.message.includes('Cannot redefine property: ethereum')) {
                        event.preventDefault();
                        console.warn('Wallet extension error suppressed:', event.message);
                        return false;
                      }
                    });
                  }
                })();
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;