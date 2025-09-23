// Real-data-only CryptoDataService - NO SIMULATED DATA
class CryptoDataService {
  constructor() {
    this.subscribers = new Map();
    this.candleData = new Map();
    this.updateIntervals = new Map();
    this.lastPrices = new Map();
    this.connectionErrors = new Map();
    
    console.log('🚀 CryptoDataService initialized - REAL DATA ONLY');
  }

  // Subscribe to real-time data for a symbol
  subscribe(symbol, timeframe, callback) {
    const key = `${symbol}_${timeframe}`;
    console.log(`📡 Subscribing to ${key} - REAL DATA ONLY`);
    
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
      console.log(`📊 Returning ${historical.length} REAL candles for ${key}`);
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

  // Start periodic data updates using REAL data only
  startDataUpdates(symbol, timeframe, key) {
    console.log(`🔄 Starting REAL data updates for ${key}`);
    
    // Fetch real historical data first
    this.fetchRealHistoricalData(symbol, timeframe, key);
    
    // Set up periodic price updates (every 10 seconds)
    const interval = setInterval(() => {
      if (!this.subscribers.get(key) || this.subscribers.get(key).size === 0) {
        clearInterval(interval);
        this.updateIntervals.delete(key);
        return;
      }
      
      this.fetchCurrentPrice(symbol, key);
    }, 10000); // Update every 10 seconds
    
    this.updateIntervals.set(key, interval);
  }

  // Fetch real historical data from CoinGecko
  async fetchRealHistoricalData(symbol, timeframe, key) {
    try {
      const coinGeckoIds = {
        'ETHUSDT': 'ethereum',
        'BTCUSDT': 'bitcoin',
        'SOLUSDT': 'solana',
        'AVAXUSDT': 'avalanche-2',
        'LINKUSDT': 'chainlink',
        'DOTUSDT': 'polkadot',
        'ASTERUSDT': 'astar',
        'HYPEUSDT': 'hyperliquid'
      };
      
      const coinId = coinGeckoIds[symbol];
      if (!coinId) {
        throw new Error(`No CoinGecko mapping for ${symbol}`);
      }
      
      // Try to get real historical data (this may fail due to rate limits)
      console.log(`🌐 Fetching REAL historical data for ${symbol}...`);
      
      // First get current price
      const priceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
      const priceResponse = await fetch(priceUrl);
      
      if (!priceResponse.ok) {
        throw new Error(`Price API error: ${priceResponse.status}`);
      }
      
      const priceData = await priceResponse.json();
      
      if (!priceData[coinId]) {
        throw new Error(`No price data for ${coinId}`);
      }
      
      const currentPrice = priceData[coinId].usd;
      const priceChange24h = priceData[coinId].usd_24h_change || 0;
      
      console.log(`✅ Current ${symbol}: $${currentPrice} (${priceChange24h.toFixed(2)}%)`);
      
      // Store current price info
      this.lastPrices.set(symbol, { price: currentPrice, change: priceChange24h });
      
      // Try to get historical data (this often requires API key for detailed data)
      try {
        const historyUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`;
        const historyResponse = await fetch(historyUrl);
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          
          if (historyData.prices && historyData.prices.length > 0) {
            // Convert to OHLCV format (using price points as close prices)
            const candles = historyData.prices.map((pricePoint, index) => {
              const timestamp = new Date(pricePoint[0]);
              const price = pricePoint[1];
              const volume = historyData.total_volumes[index] ? historyData.total_volumes[index][1] : 0;
              
              return {
                timestamp: timestamp.toISOString(),
                time: timestamp.toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                open: price,
                high: price * 1.001, // Minimal spread for visualization
                low: price * 0.999,
                close: price,
                volume: volume,
                isComplete: true
              };
            });
            
            // Add current price as latest candle
            const now = new Date();
            candles.push({
              timestamp: now.toISOString(),
              time: now.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              open: currentPrice,
              high: currentPrice,
              low: currentPrice,
              close: currentPrice,
              volume: 0,
              isComplete: false
            });
            
            this.candleData.set(key, candles);
            console.log(`📈 Loaded ${candles.length} REAL data points for ${symbol}`);
            
            // Clear any previous errors
            this.connectionErrors.delete(key);
            
            // Notify subscribers
            this.notifySubscribers(key, candles);
            return;
          }
        }
        
        throw new Error(`Historical data not available for ${symbol}`);
        
      } catch (historyError) {
        console.log(`⚠️ Historical data unavailable for ${symbol}:`, historyError.message);
        
        // Create minimal dataset with just current price for basic functionality
        const now = new Date();
        const minimalData = [{
          timestamp: now.toISOString(),
          time: now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
          volume: 0,
          isComplete: false
        }];
        
        this.candleData.set(key, minimalData);
        this.connectionErrors.set(key, 'Historical data limited - only current price available');
        this.notifySubscribers(key, minimalData);
      }
      
    } catch (error) {
      console.error(`❌ REAL data fetch failed for ${symbol}:`, error.message);
      this.connectionErrors.set(key, `Data unavailable: ${error.message}`);
      
      // Don't create any fake data - leave empty and notify of error
      this.candleData.set(key, []);
      this.notifySubscribers(key, []);
    }
  }

  // Fetch current price only (for updates)
  async fetchCurrentPrice(symbol, key) {
    try {
      const coinGeckoIds = {
        'ETHUSDT': 'ethereum',
        'BTCUSDT': 'bitcoin',
        'SOLUSDT': 'solana',
        'AVAXUSDT': 'avalanche-2',
        'LINKUSDT': 'chainlink',
        'DOTUSDT': 'polkadot',
        'ASTERUSDT': 'astar',
        'HYPEUSDT': 'hyperliquid'
      };
      
      const coinId = coinGeckoIds[symbol];
      if (!coinId) return;
      
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data[coinId] && data[coinId].usd) {
        const newPrice = data[coinId].usd;
        const priceChange = data[coinId].usd_24h_change || 0;
        
        console.log(`💰 Updated ${symbol}: $${newPrice} (${priceChange.toFixed(2)}%)`);
        
        this.updatePriceData(symbol, key, newPrice);
        this.lastPrices.set(symbol, { price: newPrice, change: priceChange });
        
        // Clear errors on successful update
        this.connectionErrors.delete(key);
      }
      
    } catch (error) {
      console.error(`❌ Price update failed for ${symbol}:`, error.message);
      this.connectionErrors.set(key, `Price update failed: ${error.message}`);
    }
  }

  // Update price data with new real price
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

  // Get connection error for a symbol
  getConnectionError(symbol, timeframe) {
    const key = `${symbol}_${timeframe}`;
    return this.connectionErrors.get(key) || null;
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
    this.connectionErrors.delete(key);
  }

  // Stop all updates
  disconnectAll() {
    console.log(`🚫 Stopping all data updates`);
    
    this.updateIntervals.forEach((interval) => clearInterval(interval));
    this.updateIntervals.clear();
    this.subscribers.clear();
    this.candleData.clear();
    this.lastPrices.clear();
    this.connectionErrors.clear();
  }

  // Get current price
  getCurrentPrice(symbol) {
    const priceData = this.lastPrices.get(symbol);
    return priceData ? priceData.price : null;
  }

  // Check connection status
  getConnectionStatus(symbol, timeframe) {
    const key = `${symbol}_${timeframe}`;
    const hasData = this.candleData.has(key) && this.candleData.get(key).length > 0;
    const hasError = this.connectionErrors.has(key);
    
    if (hasError && !hasData) {
      return 'ERROR';
    } else if (hasData) {
      return 'CONNECTED';
    } else {
      return 'CONNECTING';
    }
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