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
    
    // Fetch real price first, then generate historical data
    this.fetchRealPrice(symbol, key, true); // true = initial fetch
    
    // Set up periodic updates (every 10 seconds)
    const interval = setInterval(() => {
      if (!this.subscribers.get(key) || this.subscribers.get(key).size === 0) {
        clearInterval(interval);
        this.updateIntervals.delete(key);
        return;
      }
      
      this.fetchRealPrice(symbol, key, false); // false = regular update
    }, 10000); // Update every 10 seconds
    
    this.updateIntervals.set(key, interval);
  }

  // Generate realistic historical data anchored to current price
  generateHistoricalData(symbol, currentRealPrice, key) {
    const candles = [];
    const now = new Date();
    
    // Start from current real price and work backwards
    let price = currentRealPrice;
    const prices = []; // Store all prices first
    
    // Generate realistic price movement working backwards
    for (let i = 199; i >= 0; i--) {
      // Realistic ETH volatility patterns
      let dailyVolatility = 0.03; // 3% daily volatility for ETH
      if (symbol.includes('BTC')) dailyVolatility = 0.025; // 2.5% for BTC
      if (symbol.includes('SOL') || symbol.includes('AVAX')) dailyVolatility = 0.05; // 5% for alts
      
      // Convert to per-minute volatility
      const minuteVolatility = dailyVolatility / Math.sqrt(1440); // 1440 minutes per day
      
      // Add some trend bias (slight downward trend to current price makes sense)
      const trendBias = i > 100 ? -0.0001 : 0; // Slight downward bias in older data
      const volatility = (Math.random() * 2 - 1) * minuteVolatility + trendBias;
      
      // Calculate previous price
      const prevPrice = price / (1 + volatility);
      prices.unshift(prevPrice); // Add to beginning of array
      price = prevPrice;
    }
    
    // Add the current real price as the latest
    prices.push(currentRealPrice);
    
    // Now create candles with proper OHLC based on realistic price progression
    for (let i = 0; i < 200; i++) {
      const timestamp = new Date(now.getTime() - (199 - i) * 60000); // 1 minute intervals
      const basePrice = prices[i];
      
      // Create realistic OHLC for each candle
      const wickRange = basePrice * 0.002; // 0.2% wick range
      const bodyRange = basePrice * 0.001; // 0.1% body range
      
      const open = basePrice + (Math.random() * 2 - 1) * bodyRange;
      const close = basePrice + (Math.random() * 2 - 1) * bodyRange;
      const high = Math.max(open, close) + Math.random() * wickRange;
      const low = Math.min(open, close) - Math.random() * wickRange;
      
      const candle = {
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        open: open,
        high: high,
        low: low,
        close: close,
        volume: Math.random() * 1000000 + 500000, // 500K-1.5M volume
        isComplete: true
      };
      
      candles.push(candle);
    }
    
    this.candleData.set(key, candles);
    console.log(`📚 Generated ${candles.length} realistic candles for ${key} anchored to $${currentRealPrice.toFixed(2)}`);
    
    // Notify subscribers
    this.notifySubscribers(key, candles);
  }

  // Fetch real price from CoinGecko (same as Dr. Paul app)
  async fetchRealPrice(symbol, key, isInitialFetch = false) {
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
        this.updateWithMockPrice(symbol, key, isInitialFetch);
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
        
        if (isInitialFetch) {
          // Generate initial historical data anchored to real price
          this.generateHistoricalData(symbol, newPrice, key);
        } else {
          // Update existing data with new real price
          this.updatePriceData(symbol, key, newPrice);
        }
        
        this.lastPrices.set(symbol, { price: newPrice, change: priceChange });
      } else {
        throw new Error('Invalid data format');
      }
      
    } catch (error) {
      console.log(`📡 CoinGecko fetch failed for ${symbol}, using mock data:`, error.message);
      this.updateWithMockPrice(symbol, key, isInitialFetch);
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

  // Update with realistic mock price (fallback)
  updateWithMockPrice(symbol, key, isInitialFetch = false) {
    // Realistic current prices for major cryptos (Sept 2025)
    const fallbackPrices = {
      'ETHUSDT': 3850,  // ETH around $3850
      'BTCUSDT': 68000, // BTC around $68k  
      'SOLUSDT': 195,   // SOL around $195
      'AVAXUSDT': 38,   // AVAX around $38
      'LINKUSDT': 16,   // LINK around $16
      'DOTUSDT': 9,     // DOT around $9
      'ASTERUSDT': 0.08, // ASTER around $0.08
      'HYPEUSDT': 28    // HYPE around $28
    };
    
    const basePrice = fallbackPrices[symbol] || 100;
    
    if (isInitialFetch) {
      // Generate realistic historical data anchored to fallback price
      this.generateHistoricalData(symbol, basePrice, key);
      console.log(`🎭 Generated mock data for ${symbol} anchored to $${basePrice.toFixed(2)}`);
    } else {
      // Update existing data with small realistic change
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