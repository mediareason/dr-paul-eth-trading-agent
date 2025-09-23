// Debug version with enhanced logging
class CryptoDataService {
  constructor() {
    this.connections = new Map();
    this.subscribers = new Map();
    this.lastPrices = new Map();
    this.candleData = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    console.log('🚀 CryptoDataService initialized');
  }

  // Subscribe to real-time data for a symbol
  subscribe(symbol, timeframe, callback) {
    const key = `${symbol}_${timeframe}`;
    console.log(`📡 Subscribing to ${key}`);
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
      this.candleData.set(key, []);
      console.log(`🆕 New subscription for ${key}`);
    }
    
    this.subscribers.get(key).add(callback);
    console.log(`👥 Subscribers for ${key}: ${this.subscribers.get(key).size}`);
    
    // Start WebSocket connection if not already connected
    if (!this.connections.has(key)) {
      console.log(`🔌 Starting WebSocket connection for ${key}`);
      this.connectToExchange(symbol, timeframe, key);
    } else {
      console.log(`♻️ Using existing connection for ${key}`);
    }
    
    // Return historical data if available
    const historical = this.candleData.get(key);
    if (historical && historical.length > 0) {
      console.log(`📊 Returning ${historical.length} historical candles for ${key}`);
      callback(historical);
    } else {
      console.log(`⏳ No historical data yet for ${key}`);
    }
    
    // Return unsubscribe function
    return () => {
      console.log(`🔌 Unsubscribing from ${key}`);
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        console.log(`🚫 No more subscribers, disconnecting ${key}`);
        this.disconnect(key);
      }
    };
  }

  // Connect to Binance WebSocket (primary)
  connectToExchange(symbol, timeframe, key) {
    try {
      // Convert symbol format for Binance
      const binanceSymbol = symbol.toLowerCase();
      const binanceTimeframe = this.convertTimeframe(timeframe);
      
      // Binance WebSocket URL for klines (candlestick data)
      const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_${binanceTimeframe}`;
      
      console.log(`🌐 Connecting to: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`✅ Connected to Binance for ${symbol} ${timeframe}`);
        this.reconnectAttempts.set(key, 0);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📥 Received data for ${key}:`, data.k ? 'Kline data' : 'Other data');
          this.processBinanceKline(data, key);
        } catch (error) {
          console.error('❌ Error parsing WebSocket data:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed for ${key}. Code: ${event.code}, Reason: ${event.reason}`);
        this.handleReconnect(symbol, timeframe, key);
      };
      
      ws.onerror = (error) => {
        console.error(`❌ WebSocket error for ${key}:`, error);
      };
      
      this.connections.set(key, ws);
      
      // Also fetch historical data
      console.log(`📚 Fetching historical data for ${key}`);
      this.fetchHistoricalData(symbol, timeframe, key);
      
    } catch (error) {
      console.error(`💥 Failed to connect to Binance for ${key}:`, error);
      this.handleReconnect(symbol, timeframe, key);
    }
  }

  // Process Binance kline data
  processBinanceKline(data, key) {
    if (!data.k) {
      console.log(`⚠️ No kline data in message for ${key}`);
      return;
    }
    
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
      isComplete: kline.x // true when kline is closed
    };
    
    console.log(`📈 Processing candle for ${key}: ${candle.close} (complete: ${candle.isComplete})`);
    
    // Update candle data
    let candleArray = this.candleData.get(key) || [];
    
    if (candle.isComplete) {
      // Add completed candle
      candleArray.push(candle);
      // Keep last 200 candles
      if (candleArray.length > 200) {
        candleArray = candleArray.slice(-200);
      }
      this.candleData.set(key, candleArray);
      console.log(`✅ Added completed candle to ${key}. Total candles: ${candleArray.length}`);
    } else {
      // Update current candle (last one in array)
      if (candleArray.length > 0) {
        candleArray[candleArray.length - 1] = candle;
      } else {
        candleArray.push(candle);
        this.candleData.set(key, candleArray);
      }
      console.log(`🔄 Updated current candle for ${key}`);
    }
    
    // Notify subscribers
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      console.log(`📢 Notifying ${callbacks.size} subscribers for ${key}`);
      callbacks.forEach(callback => {
        try {
          callback([...candleArray]);
        } catch (error) {
          console.error('❌ Error in subscriber callback:', error);
        }
      });
    } else {
      console.log(`⚠️ No subscribers to notify for ${key}`);
    }
  }

  // Fetch historical kline data from Binance REST API
  async fetchHistoricalData(symbol, timeframe, key) {
    try {
      const binanceSymbol = symbol.toUpperCase();
      const binanceTimeframe = this.convertTimeframe(timeframe);
      const limit = 200;
      
      const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceTimeframe}&limit=${limit}`;
      console.log(`📚 Fetching historical data from: ${url}`);
      
      const response = await fetch(url);
      
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
        console.log(`✅ Stored ${candles.length} historical candles for ${key}`);
        
        // Notify subscribers with historical data
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
          console.log(`📢 Notifying subscribers with historical data for ${key}`);
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
      console.error(`💥 Failed to fetch historical data for ${key}:`, error);
      // If historical data fails, still try to establish WebSocket connection
    }
  }

  // Convert timeframe to Binance format
  convertTimeframe(timeframe) {
    const timeframeMap = {
      '1m': '1m',
      '3m': '3m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d'
    };
    return timeframeMap[timeframe] || '1m';
  }

  // Handle reconnection
  handleReconnect(symbol, timeframe, key) {
    const attempts = this.reconnectAttempts.get(key) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(key, attempts + 1);
      
      const delay = this.reconnectDelay * Math.pow(2, attempts); // Exponential backoff
      console.log(`🔄 Reconnecting to ${key} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.subscribers.get(key)?.size > 0) {
          this.connectToExchange(symbol, timeframe, key);
        }
      }, delay);
    } else {
      console.error(`💀 Max reconnection attempts reached for ${key}`);
    }
  }

  // Disconnect WebSocket
  disconnect(key) {
    console.log(`🔌 Disconnecting ${key}`);
    const ws = this.connections.get(key);
    if (ws) {
      ws.close();
      this.connections.delete(key);
    }
    this.candleData.delete(key);
    this.reconnectAttempts.delete(key);
  }

  // Disconnect all WebSockets
  disconnectAll() {
    console.log(`🚫 Disconnecting all WebSockets`);
    this.connections.forEach((ws, key) => {
      ws.close();
    });
    this.connections.clear();
    this.subscribers.clear();
    this.candleData.clear();
    this.reconnectAttempts.clear();
  }

  // Get current price for a symbol
  getCurrentPrice(symbol) {
    // Find any timeframe data for this symbol
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
    const ws = this.connections.get(key);
    const status = ws ? ws.readyState === WebSocket.OPEN : false;
    console.log(`🔍 Connection status for ${key}: ${status ? 'CONNECTED' : 'DISCONNECTED'}`);
    return status;
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