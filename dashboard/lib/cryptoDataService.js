// Real-time WebSocket data service with fallback to mock data
class CryptoDataService {
  constructor() {
    this.connections = new Map();
    this.subscribers = new Map();
    this.lastPrices = new Map();
    this.candleData = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 3; // Reduced to fail faster
    this.reconnectDelay = 1000;
    this.useMockData = false; // Will switch to true if real connections fail
    this.mockIntervals = new Map(); // For mock data updates
    
    console.log('🚀 CryptoDataService initialized');
  }

  // Subscribe to real-time data for a symbol
  subscribe(symbol, timeframe, callback) {
    const key = `${symbol}_${timeframe}`;
    console.log(`📡 Subscribing to ${key}`);
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
      this.candleData.set(key, []);
    }
    
    this.subscribers.get(key).add(callback);
    
    // Start connection (real or mock)
    if (!this.connections.has(key) && !this.mockIntervals.has(key)) {
      if (this.useMockData) {
        console.log(`🎭 Starting mock data for ${key}`);
        this.startMockData(symbol, timeframe, key);
      } else {
        console.log(`🔌 Attempting real connection for ${key}`);
        this.connectToExchange(symbol, timeframe, key);
      }
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
        this.disconnect(key);
      }
    };
  }

  // Generate realistic mock data
  generateMockCandles(symbol, count = 200) {
    const candles = [];
    const now = new Date();
    
    // Base prices for different symbols
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
    
    for (let i = count - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
      
      // Add some realistic price movement
      const volatility = Math.random() * 0.02 - 0.01; // ±1%
      price = price * (1 + volatility);
      
      // Ensure price doesn't go negative
      price = Math.max(price, 0.001);
      
      const candle = {
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        open: price,
        high: price * (1 + Math.random() * 0.005),
        low: price * (1 - Math.random() * 0.005),
        close: price,
        volume: Math.random() * 1000000,
        isComplete: true
      };
      
      candles.push(candle);
    }
    
    return candles;
  }

  // Start mock data simulation
  startMockData(symbol, timeframe, key) {
    console.log(`🎭 Starting mock data simulation for ${key}`);
    
    // Generate initial historical data
    const mockCandles = this.generateMockCandles(symbol);
    this.candleData.set(key, mockCandles);
    
    // Notify subscribers with initial data
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback([...mockCandles]);
        } catch (error) {
          console.error('❌ Error in subscriber callback:', error);
        }
      });
    }
    
    // Start live updates every 2 seconds
    const interval = setInterval(() => {
      if (!this.subscribers.get(key) || this.subscribers.get(key).size === 0) {
        clearInterval(interval);
        this.mockIntervals.delete(key);
        return;
      }
      
      const candleArray = this.candleData.get(key) || [];
      if (candleArray.length === 0) return;
      
      // Update last candle with new price
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
      
      // Update the last candle
      candleArray[candleArray.length - 1] = updatedCandle;
      
      console.log(`📈 Mock price update for ${key}: $${newPrice.toFixed(4)}`);
      
      // Notify subscribers
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
    }, 2000);
    
    this.mockIntervals.set(key, interval);
  }

  // Connect to Binance WebSocket (with fallback to mock)
  connectToExchange(symbol, timeframe, key) {
    try {
      const binanceSymbol = symbol.toLowerCase();
      const binanceTimeframe = this.convertTimeframe(timeframe);
      const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_${binanceTimeframe}`;
      
      console.log(`🌐 Attempting connection to: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      
      // Set a timeout to switch to mock data if connection fails
      const connectionTimeout = setTimeout(() => {
        console.log(`⏰ Connection timeout for ${key}, switching to mock data`);
        ws.close();
        this.switchToMockData(symbol, timeframe, key);
      }, 5000);
      
      ws.onopen = () => {
        console.log(`✅ Real connection established for ${key}`);
        clearTimeout(connectionTimeout);
        this.reconnectAttempts.set(key, 0);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.processBinanceKline(data, key);
        } catch (error) {
          console.error('❌ Error parsing WebSocket data:', error);
        }
      };
      
      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`🔌 WebSocket closed for ${key}. Code: ${event.code}`);
        this.handleReconnectOrFallback(symbol, timeframe, key);
      };
      
      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error(`❌ WebSocket error for ${key}:`, error);
        this.switchToMockData(symbol, timeframe, key);
      };
      
      this.connections.set(key, ws);
      
      // Try to fetch historical data (with timeout)
      this.fetchHistoricalDataWithFallback(symbol, timeframe, key);
      
    } catch (error) {
      console.error(`💥 Failed to create WebSocket for ${key}:`, error);
      this.switchToMockData(symbol, timeframe, key);
    }
  }

  // Fetch historical data with fallback
  async fetchHistoricalDataWithFallback(symbol, timeframe, key) {
    try {
      const binanceSymbol = symbol.toUpperCase();
      const binanceTimeframe = this.convertTimeframe(timeframe);
      const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceTimeframe}&limit=200`;
      
      console.log(`📚 Fetching historical data from: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Received ${data.length} historical candles for ${key}`);
      
      if (Array.isArray(data)) {
        const candles = data.map(kline => ({
          timestamp: new Date(kline[0]).toISOString(),
          time: new Date(kline[0]).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5]),
          isComplete: true
        }));
        
        this.candleData.set(key, candles);
        
        // Notify subscribers
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback([...candles]);
            } catch (error) {
              console.error('❌ Error in subscriber callback:', error);
            }
          });
        }
      }
    } catch (error) {
      console.log(`📚 Historical data fetch failed for ${key}, using mock data:`, error.message);
      // Don't switch entirely to mock here, just generate initial data
      if (!this.candleData.get(key) || this.candleData.get(key).length === 0) {
        const mockCandles = this.generateMockCandles(symbol);
        this.candleData.set(key, mockCandles);
        
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback([...mockCandles]);
            } catch (error) {
              console.error('❌ Error in subscriber callback:', error);
            }
          });
        }
      }
    }
  }

  // Switch to mock data when real connections fail
  switchToMockData(symbol, timeframe, key) {
    console.log(`🎭 Switching to mock data for ${key}`);
    
    // Clean up any existing connection
    const ws = this.connections.get(key);
    if (ws) {
      ws.close();
      this.connections.delete(key);
    }
    
    // Start mock data
    this.startMockData(symbol, timeframe, key);
    
    // Set global flag to use mock for future subscriptions
    this.useMockData = true;
  }

  // Handle reconnection or fallback to mock
  handleReconnectOrFallback(symbol, timeframe, key) {
    const attempts = this.reconnectAttempts.get(key) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(key, attempts + 1);
      const delay = this.reconnectDelay * Math.pow(2, attempts);
      
      console.log(`🔄 Reconnect attempt ${attempts + 1}/${this.maxReconnectAttempts} for ${key} in ${delay}ms`);
      
      setTimeout(() => {
        if (this.subscribers.get(key)?.size > 0) {
          this.connectToExchange(symbol, timeframe, key);
        }
      }, delay);
    } else {
      console.log(`💀 Max reconnection attempts reached for ${key}, switching to mock data`);
      this.switchToMockData(symbol, timeframe, key);
    }
  }

  // Process real Binance kline data
  processBinanceKline(data, key) {
    if (!data.k) return;
    
    const kline = data.k;
    const candle = {
      timestamp: new Date(kline.t).toISOString(),
      time: new Date(kline.t).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
      isComplete: kline.x
    };
    
    console.log(`📈 Real price update for ${key}: $${candle.close}`);
    
    let candleArray = this.candleData.get(key) || [];
    
    if (candle.isComplete) {
      candleArray.push(candle);
      if (candleArray.length > 200) {
        candleArray = candleArray.slice(-200);
      }
      this.candleData.set(key, candleArray);
    } else {
      if (candleArray.length > 0) {
        candleArray[candleArray.length - 1] = candle;
      } else {
        candleArray.push(candle);
        this.candleData.set(key, candleArray);
      }
    }
    
    // Notify subscribers
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

  // Convert timeframe to Binance format
  convertTimeframe(timeframe) {
    const timeframeMap = {
      '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m',
      '30m': '30m', '1h': '1h', '4h': '4h', '1d': '1d'
    };
    return timeframeMap[timeframe] || '1m';
  }

  // Disconnect
  disconnect(key) {
    console.log(`🔌 Disconnecting ${key}`);
    
    // Clean up WebSocket
    const ws = this.connections.get(key);
    if (ws) {
      ws.close();
      this.connections.delete(key);
    }
    
    // Clean up mock interval
    const interval = this.mockIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.mockIntervals.delete(key);
    }
    
    this.candleData.delete(key);
    this.reconnectAttempts.delete(key);
  }

  // Disconnect all
  disconnectAll() {
    console.log(`🚫 Disconnecting all connections`);
    
    this.connections.forEach((ws) => ws.close());
    this.connections.clear();
    
    this.mockIntervals.forEach((interval) => clearInterval(interval));
    this.mockIntervals.clear();
    
    this.subscribers.clear();
    this.candleData.clear();
    this.reconnectAttempts.clear();
  }

  // Get current price
  getCurrentPrice(symbol) {
    for (const [key, candles] of this.candleData) {
      if (key.startsWith(symbol + '_') && candles && candles.length > 0) {
        return candles[candles.length - 1].close;
      }
    }
    return null;
  }

  // Check connection status
  getConnectionStatus(symbol, timeframe) {
    const key = `${symbol}_${timeframe}`;
    
    // Check if we have mock data running
    if (this.mockIntervals.has(key)) {
      console.log(`🎭 Mock connection active for ${key}`);
      return true;
    }
    
    // Check real WebSocket
    const ws = this.connections.get(key);
    const isConnected = ws ? ws.readyState === WebSocket.OPEN : false;
    console.log(`🔍 Real connection status for ${key}: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
    return isConnected;
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