// CoinGecko-based data service (same approach as Dr. Paul app)
class CryptoDataService {
  constructor() {
    this.subscribers = new Map();
    this.candleData = new Map();
    this.updateIntervals = new Map();
    this.lastPrices = new Map();
    
    console.log('🚀 CryptoDataService initialized with CoinGecko API');
  }

  // Subscribe to real-time data for a symbol
  subscribe(symbol, timeframe, callback) {
    const key = `${symbol}_${timeframe}`;
    console.log(`📡 Subscribing to ${key} using CoinGecko API`);
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
      this.candleData.set(key, []);
    }
    
    this.subscribers.get(key).add(callback);
    
    // Start data updates if not already running
    if (!this.updateIntervals.has(key)) {
      this.startDataUpdates(symbol, timeframe, key);
    }
    
    // Return historical data if available
    const historical = this.candleData.get(key);
    if (historical && historical.length > 0) {
      console.log(`📊 Returning ${historical.length} candles for ${key}`);
      callback(historical);
    }
    
    // Return unsubscribe function
    return () => {
      console.log(`🔌 Unsubscribing from ${key}`);
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.stopDataUpdates(key);
      }
    };
  }

  // Start periodic data updates using CoinGecko API
  startDataUpdates(symbol, timeframe, key) {
    console.log(`🔄 Starting CoinGecko data updates for ${key}`);
    
    // Generate initial historical data
    this.generateInitialData(symbol, key);
    
    // Fetch real price immediately
    this.fetchRealPrice(symbol, key);
    
    // Set up periodic updates (every 10 seconds)
    const interval = setInterval(() => {
      if (!this.subscribers.get(key) || this.subscribers.get(key).size === 0) {
        clearInterval(interval);
        this.updateIntervals.delete(key);
        return;
      }
      
      this.fetchRealPrice(symbol, key);
    }, 10000); // Update every 10 seconds
    
    this.updateIntervals.set(key, interval);
  }

  // Generate initial realistic data
  generateInitialData(symbol, key) {
    const basePrices = {
      'ETHUSDT': 3400,
      'BTCUSDT': 67000,
      'SOLUSDT': 180,
      'AVAXUSDT': 35,
      'LINKUSDT': 15,
      'DOTUSDT': 8,
      'ASTERUSDT': 0.05,
      'HYPEUSDT': 24
    };
    
    let price = basePrices[symbol] || 100;
    const candles = [];
    const now = new Date();
    
    // Generate 200 historical candles
    for (let i = 199; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
      
      // Add realistic price movement
      const volatility = Math.random() * 0.02 - 0.01; // ±1%
      price = price * (1 + volatility);
      price = Math.max(price, 0.001); // Ensure positive price
      
      const candle = {
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        open: price,
        high: price * (1 + Math.random() * 0.01),
        low: price * (1 - Math.random() * 0.01),
        close: price,
        volume: Math.random() * 1000000,
        isComplete: true
      };
      
      candles.push(candle);
    }
    
    this.candleData.set(key, candles);
    console.log(`📚 Generated ${candles.length} initial candles for ${key}`);
    
    // Notify subscribers
    this.notifySubscribers(key, candles);
  }

  // Fetch real price from CoinGecko (same as Dr. Paul app)
  async fetchRealPrice(symbol, key) {
    try {
      // Map trading symbols to CoinGecko IDs
      const coinGeckoIds = {
        'ETHUSDT': 'ethereum',
        'BTCUSDT': 'bitcoin',
        'SOLUSDT': 'solana',
        'AVAXUSDT': 'avalanche-2',
        'LINKUSDT': 'chainlink',
        'DOTUSDT': 'polkadot',
        'ASTERUSDT': 'astar', // Best match for ASTER
        'HYPEUSDT': 'hyperliquid' // Check if this ID exists
      };
      
      const coinId = coinGeckoIds[symbol];
      if (!coinId) {
        console.log(`⚠️ No CoinGecko ID for ${symbol}, using mock data`);
        this.updateWithMockPrice(symbol, key);
        return;
      }
      
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
      console.log(`🌐 Fetching from CoinGecko: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data[coinId] && data[coinId].usd) {
        const newPrice = data[coinId].usd;
        const priceChange = data[coinId].usd_24h_change || 0;
        
        console.log(`✅ Real price for ${symbol}: $${newPrice} (${priceChange.toFixed(2)}%)`);
        
        this.updatePriceData(symbol, key, newPrice);
        this.lastPrices.set(symbol, { price: newPrice, change: priceChange });
      } else {
        throw new Error('Invalid data format');
      }
      
    } catch (error) {
      console.log(`📡 CoinGecko fetch failed for ${symbol}, using mock data:`, error.message);
      this.updateWithMockPrice(symbol, key);
    }
  }

  // Update price data with real price
  updatePriceData(symbol, key, newPrice) {
    const candleArray = this.candleData.get(key) || [];
    if (candleArray.length === 0) return;
    
    // Update the last candle with new real price
    const lastCandle = candleArray[candleArray.length - 1];
    const updatedCandle = {
      ...lastCandle,
      close: newPrice,
      high: Math.max(lastCandle.high, newPrice),
      low: Math.min(lastCandle.low, newPrice),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    
    // Update the array
    candleArray[candleArray.length - 1] = updatedCandle;
    
    // Notify subscribers
    this.notifySubscribers(key, candleArray);
  }

  // Update with realistic mock price
  updateWithMockPrice(symbol, key) {
    const candleArray = this.candleData.get(key) || [];
    if (candleArray.length === 0) return;
    
    const lastCandle = candleArray[candleArray.length - 1];
    const volatility = Math.random() * 0.008 - 0.004; // ±0.4%
    const newPrice = lastCandle.close * (1 + volatility);
    
    const updatedCandle = {
      ...lastCandle,
      close: newPrice,
      high: Math.max(lastCandle.high, newPrice),
      low: Math.min(lastCandle.low, newPrice),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    
    candleArray[candleArray.length - 1] = updatedCandle;
    
    console.log(`🎭 Mock price update for ${symbol}: $${newPrice.toFixed(4)}`);
    
    // Notify subscribers
    this.notifySubscribers(key, candleArray);
  }

  // Notify all subscribers
  notifySubscribers(key, candleArray) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback([...candleArray]);
        } catch (error) {
          console.error('❌ Error in subscriber callback:', error);
        }
      });
    }
  }

  // Stop data updates
  stopDataUpdates(key) {
    console.log(`🛑 Stopping data updates for ${key}`);
    
    const interval = this.updateIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(key);
    }
    
    this.candleData.delete(key);
  }

  // Stop all updates
  disconnectAll() {
    console.log(`🚫 Stopping all data updates`);
    
    this.updateIntervals.forEach((interval) => clearInterval(interval));
    this.updateIntervals.clear();
    this.subscribers.clear();
    this.candleData.clear();
    this.lastPrices.clear();
  }

  // Get current price
  getCurrentPrice(symbol) {
    const priceData = this.lastPrices.get(symbol);
    return priceData ? priceData.price : null;
  }

  // Check connection status (always true for CoinGecko approach)
  getConnectionStatus(symbol, timeframe) {
    const key = `${symbol}_${timeframe}`;
    const hasData = this.candleData.has(key) && this.candleData.get(key).length > 0;
    console.log(`🔍 Connection status for ${key}: ${hasData ? 'CONNECTED' : 'DISCONNECTED'}`);
    return hasData;
  }
}

// Create singleton instance
const cryptoDataService = new CryptoDataService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cryptoDataService.disconnectAll();
  });
}

export default cryptoDataService;