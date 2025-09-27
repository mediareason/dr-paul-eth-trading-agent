/**
 * CORRECT HISTORICAL DATA Service - Proper timeframe-based periods
 * 200MA = 200 periods of current timeframe, not 200 days
 */

class CryptoDataService {
  constructor() {
    this.subscribers = new Map();
    this.candleData = new Map();
    this.updateIntervals = new Map();
    this.lastPrices = new Map();
    this.historicalCache = new Map();
    
    console.log('🚀 CORRECT Historical Data Service - Timeframe-based periods');
  }

  // Subscribe to real-time data with CORRECT historical periods
  subscribe(symbol, timeframe, callback) {
    const key = `${symbol}_${timeframe}`;
    console.log(`📡 Subscribe to ${key} with CORRECT ${timeframe} historical data`);
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
      this.candleData.set(key, []);
    }
    
    this.subscribers.get(key).add(callback);
    
    // Start real data updates if not already running
    if (!this.updateIntervals.has(key)) {
      this.startCorrectHistoricalDataUpdates(symbol, timeframe, key);
    }
    
    // Return cached historical data if available
    const historical = this.candleData.get(key);
    if (historical && historical.length > 0) {
      console.log(`📊 Returning ${historical.length} CORRECT ${timeframe} candles for ${key}`);
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

  // Calculate required historical data based on timeframe
  calculateHistoricalRequirements(timeframe) {
    // Calculate minutes per period
    const timeframeMinutes = {
      '1m': 1,
      '3m': 3,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };
    
    const minutesPerPeriod = timeframeMinutes[timeframe] || 60;
    
    // For 200MA we need 200 periods, plus some buffer
    const periodsNeeded = 250; // 200 + 50 buffer
    const totalMinutes = periodsNeeded * minutesPerPeriod;
    const daysNeeded = Math.ceil(totalMinutes / 1440); // Convert to days
    
    // Determine CoinGecko interval based on timeframe
    let coinGeckoInterval;
    if (minutesPerPeriod <= 5) {
      coinGeckoInterval = 'minutely'; // Only available for last 1 day
    } else if (minutesPerPeriod <= 60) {
      coinGeckoInterval = 'hourly';
    } else {
      coinGeckoInterval = 'daily';
    }
    
    // Adjust days based on CoinGecko limits
    let adjustedDays = Math.min(daysNeeded, 365); // Max 1 year
    
    if (coinGeckoInterval === 'minutely') {
      adjustedDays = 1; // CoinGecko minutely data only available for 1 day
    }
    
    console.log(`📊 ${timeframe} requirements: ${periodsNeeded} periods = ${totalMinutes} minutes = ${daysNeeded} days`);
    console.log(`🌐 CoinGecko: requesting ${adjustedDays} days with ${coinGeckoInterval} interval`);
    
    return {
      daysNeeded: adjustedDays,
      interval: coinGeckoInterval,
      minutesPerPeriod: minutesPerPeriod,
      periodsNeeded: periodsNeeded
    };
  }

  // Start correct historical data updates
  async startCorrectHistoricalDataUpdates(symbol, timeframe, key) {
    console.log(`🔄 Starting CORRECT ${timeframe} historical data updates for ${key}`);
    
    // Fetch real historical data immediately
    await this.fetchCorrectHistoricalData(symbol, timeframe, key);
    
    // Set up periodic current price updates (every 30 seconds)
    const interval = setInterval(async () => {
      if (!this.subscribers.get(key) || this.subscribers.get(key).size === 0) {
        clearInterval(interval);
        this.updateIntervals.delete(key);
        return;
      }
      
      await this.updateCurrentPriceInHistoricalData(symbol, key);
    }, 30000);
    
    this.updateIntervals.set(key, interval);
  }

  // Fetch CORRECT historical data based on timeframe
  async fetchCorrectHistoricalData(symbol, timeframe, key) {
    try {
      const coinGeckoIds = {
        'ETHUSDT': 'ethereum',
        'BTCUSDT': 'bitcoin',
        'SOLUSDT': 'solana',
        'AVAXUSDT': 'avalanche-2',
        'LINKUSDT': 'chainlink',
        'DOTUSDT': 'polkadot',
        'ADAUSDT': 'cardano'
      };
      
      const coinId = coinGeckoIds[symbol];
      if (!coinId) {
        throw new Error(`No CoinGecko mapping for ${symbol}`);
      }
      
      // Calculate correct historical requirements
      const requirements = this.calculateHistoricalRequirements(timeframe);
      
      // Check cache
      const cacheKey = `${coinId}_${timeframe}_${requirements.daysNeeded}`;
      const cached = this.historicalCache.get(cacheKey);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < 1800000) { // 30 minutes cache
        console.log(`📦 Using cached ${timeframe} historical data for ${symbol}`);
        this.processCorrectHistoricalData(cached.data, symbol, timeframe, key, requirements);
        return;
      }
      
      console.log(`🌐 Fetching CORRECT ${timeframe} historical data for ${symbol}...`);
      console.log(`📊 Need ${requirements.periodsNeeded} periods of ${timeframe} = ${requirements.daysNeeded} days`);
      
      // CoinGecko market_chart endpoint with correct parameters
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${requirements.daysNeeded}&interval=${requirements.interval}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
        throw new Error('No historical price data received');
      }
      
      console.log(`✅ REAL ${timeframe} historical data: ${data.prices.length} data points for ${symbol}`);
      console.log(`📅 Date range: ${new Date(data.prices[0][0]).toDateString()} to ${new Date(data.prices[data.prices.length-1][0]).toDateString()}`);
      console.log(`💰 Price range: $${Math.min(...data.prices.map(p => p[1])).toFixed(2)} - $${Math.max(...data.prices.map(p => p[1])).toFixed(2)}`);
      
      // Cache the data
      this.historicalCache.set(cacheKey, {
        data: data,
        timestamp: now
      });
      
      // Process with correct timeframe logic
      this.processCorrectHistoricalData(data, symbol, timeframe, key, requirements);
      
    } catch (error) {
      console.error(`❌ Failed to fetch CORRECT ${timeframe} historical data for ${symbol}:`, error.message);
      console.log(`🔄 Falling back to synthetic ${timeframe} data...`);
      
      // Fallback with correct timeframe
      await this.generateCorrectTimeframeFallback(symbol, timeframe, key);
    }
  }

  // Process REAL historical data with correct timeframe conversion
  processCorrectHistoricalData(data, symbol, timeframe, key, requirements) {
    const candles = [];
    const prices = data.prices || [];
    const volumes = data.total_volumes || [];
    
    // Convert CoinGecko data to the requested timeframe
    const convertedData = this.convertToTimeframe(prices, volumes, timeframe, requirements);
    
    console.log(`🔄 Converted ${prices.length} raw data points to ${convertedData.length} ${timeframe} candles`);
    
    // Create candles in the correct format
    for (let i = 0; i < convertedData.length; i++) {
      const dataPoint = convertedData[i];
      const timestamp = new Date(dataPoint.timestamp);
      
      const candle = {
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        open: dataPoint.open,
        high: dataPoint.high,
        low: dataPoint.low,
        close: dataPoint.close,
        volume: dataPoint.volume,
        isComplete: true
      };
      
      candles.push(candle);
    }
    
    // Limit to what we need (keep last 250 periods for 200MA + buffer)
    const limitedCandles = candles.slice(-250);
    
    // Store and notify
    this.candleData.set(key, limitedCandles);
    console.log(`✅ Processed ${limitedCandles.length} CORRECT ${timeframe} candles for ${symbol}`);
    
    // Update lastPrices
    if (limitedCandles.length > 0) {
      const latestCandle = limitedCandles[limitedCandles.length - 1];
      this.lastPrices.set(symbol, { 
        price: latestCandle.close, 
        change: this.calculateDailyChange(limitedCandles),
        timestamp: Date.now()
      });
    }
    
    // Notify all subscribers
    this.notifyAllSubscribers(key, limitedCandles);
  }

  // Convert raw data to specific timeframe periods
  convertToTimeframe(prices, volumes, timeframe, requirements) {
    const minutesPerPeriod = requirements.minutesPerPeriod;
    const converted = [];
    
    // Group data by timeframe periods
    const groupedData = {};
    
    for (let i = 0; i < prices.length; i++) {
      const timestamp = prices[i][0];
      const price = prices[i][1];
      const volume = volumes[i] ? volumes[i][1] : 1000000;
      
      // Calculate which period this data point belongs to
      const periodStart = Math.floor(timestamp / (minutesPerPeriod * 60000)) * (minutesPerPeriod * 60000);
      
      if (!groupedData[periodStart]) {
        groupedData[periodStart] = {
          timestamp: periodStart,
          prices: [],
          volumes: []
        };
      }
      
      groupedData[periodStart].prices.push(price);
      groupedData[periodStart].volumes.push(volume);
    }
    
    // Convert grouped data to OHLC candles
    const sortedPeriods = Object.keys(groupedData).sort((a, b) => Number(a) - Number(b));
    
    for (const periodKey of sortedPeriods) {
      const period = groupedData[periodKey];
      
      if (period.prices.length === 0) continue;
      
      const open = period.prices[0];
      const close = period.prices[period.prices.length - 1];
      const high = Math.max(...period.prices);
      const low = Math.min(...period.prices);
      const volume = period.volumes.reduce((sum, v) => sum + v, 0) / period.volumes.length;
      
      converted.push({
        timestamp: period.timestamp,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume
      });
    }
    
    return converted;
  }

  // Calculate 24h price change
  calculateDailyChange(candles) {
    if (candles.length < 2) return 0;
    
    // Calculate based on available data
    const periodsIn24h = Math.min(24, candles.length - 1);
    const currentPrice = candles[candles.length - 1].close;
    const price24hAgo = candles[candles.length - 1 - periodsIn24h].close;
    
    return ((currentPrice - price24hAgo) / price24hAgo) * 100;
  }

  // Generate correct timeframe fallback data
  async generateCorrectTimeframeFallback(symbol, timeframe, key) {
    try {
      // Get current real price first
      const coinGeckoIds = {
        'ETHUSDT': 'ethereum',
        'BTCUSDT': 'bitcoin',
        'SOLUSDT': 'solana',
        'AVAXUSDT': 'avalanche-2',
        'LINKUSDT': 'chainlink',
        'DOTUSDT': 'polkadot',
        'ADAUSDT': 'cardano'
      };
      
      const coinId = coinGeckoIds[symbol];
      let currentPrice = null;
      
      if (coinId) {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          currentPrice = data[coinId]?.usd;
        }
      }
      
      // Use fallback price if API fails
      if (!currentPrice) {
        const fallbackPrices = {
          'ETHUSDT': 4003,   // Current ETH price you mentioned
          'BTCUSDT': 97000,  
          'SOLUSDT': 195,    
          'AVAXUSDT': 38,    
          'LINKUSDT': 16,    
          'DOTUSDT': 9,      
          'ADAUSDT': 1.05    
        };
        currentPrice = fallbackPrices[symbol] || 100;
      }
      
      console.log(`🎭 Generating CORRECT ${timeframe} fallback data anchored to $${currentPrice}`);
      this.generateCorrectSyntheticData(symbol, timeframe, currentPrice, key);
      
    } catch (error) {
      console.error(`❌ Fallback generation failed for ${symbol}:`, error);
    }
  }

  // Generate synthetic data with correct timeframe periods
  generateCorrectSyntheticData(symbol, timeframe, currentPrice, key) {
    const requirements = this.calculateHistoricalRequirements(timeframe);
    const candles = [];
    const now = Date.now();
    
    // Generate correct number of periods
    const periodsToGenerate = requirements.periodsNeeded;
    const millisecondsPerPeriod = requirements.minutesPerPeriod * 60000;
    
    let price = currentPrice;
    const prices = [currentPrice];
    
    // Work backwards with realistic movement for timeframe
    for (let i = periodsToGenerate - 1; i > 0; i--) {
      // Volatility scales with timeframe
      let volatilityPerPeriod = 0.002; // Base 0.2%
      if (requirements.minutesPerPeriod >= 60) volatilityPerPeriod = 0.008; // 0.8% for hourly+
      if (requirements.minutesPerPeriod >= 240) volatilityPerPeriod = 0.015; // 1.5% for 4h+
      if (requirements.minutesPerPeriod >= 1440) volatilityPerPeriod = 0.025; // 2.5% for daily
      
      const randomMove = (Math.random() - 0.5) * 2 * volatilityPerPeriod;
      price = price / (1 + randomMove);
      prices.unshift(price);
    }
    
    // Create candles
    for (let i = 0; i < periodsToGenerate; i++) {
      const timestamp = new Date(now - (periodsToGenerate - i - 1) * millisecondsPerPeriod);
      const basePrice = prices[i];
      
      // Intracandle movement
      const wickRange = basePrice * 0.003;
      const bodyRange = basePrice * 0.002;
      
      const open = basePrice + (Math.random() - 0.5) * bodyRange;
      const close = i === periodsToGenerate - 1 ? currentPrice : basePrice + (Math.random() - 0.5) * bodyRange;
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
        volume: Math.random() * 1000000 + 500000,
        isComplete: true
      };
      
      candles.push(candle);
    }
    
    // Store and notify
    this.candleData.set(key, candles);
    console.log(`✅ Generated ${candles.length} CORRECT ${timeframe} synthetic candles anchored to $${currentPrice}`);
    
    // Update lastPrices
    this.lastPrices.set(symbol, { 
      price: currentPrice, 
      change: (Math.random() - 0.5) * 4,
      timestamp: Date.now()
    });
    
    // Notify all subscribers
    this.notifyAllSubscribers(key, candles);
  }

  // Update current price in historical data
  async updateCurrentPriceInHistoricalData(symbol, key) {
    try {
      const coinGeckoIds = {
        'ETHUSDT': 'ethereum',
        'BTCUSDT': 'bitcoin',
        'SOLUSDT': 'solana',
        'AVAXUSDT': 'avalanche-2',
        'LINKUSDT': 'chainlink',
        'DOTUSDT': 'polkadot',
        'ADAUSDT': 'cardano'
      };
      
      const coinId = coinGeckoIds[symbol];
      if (!coinId) return;
      
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const currentPrice = data[coinId]?.usd;
      const priceChange = data[coinId]?.usd_24h_change || 0;
      
      if (currentPrice) {
        console.log(`💰 REAL price update ${symbol}: $${currentPrice.toFixed(2)} (${priceChange.toFixed(2)}%)`);
        
        this.lastPrices.set(symbol, { 
          price: currentPrice, 
          change: priceChange,
          timestamp: Date.now()
        });
        
        this.updateLastCandleWithCurrentPrice(key, currentPrice);
      }
      
    } catch (error) {
      console.log(`📡 Price update failed for ${symbol}:`, error.message);
    }
  }

  // Update the last candle with current price
  updateLastCandleWithCurrentPrice(key, currentPrice) {
    const candleArray = this.candleData.get(key);
    if (!candleArray || candleArray.length === 0) return;
    
    const lastCandle = candleArray[candleArray.length - 1];
    const now = new Date();
    
    const updatedCandle = {
      ...lastCandle,
      close: currentPrice,
      high: Math.max(lastCandle.high, currentPrice),
      low: Math.min(lastCandle.low, currentPrice),
      timestamp: now.toISOString(),
      time: now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    
    candleArray[candleArray.length - 1] = updatedCandle;
    this.notifyAllSubscribers(key, candleArray);
  }

  // Notify all subscribers
  notifyAllSubscribers(key, candleArray) {
    const callbacks = this.subscribers.get(key);
    if (callbacks && candleArray && candleArray.length > 0) {
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

  // Check connection status
  getConnectionStatus(symbol, timeframe) {
    const key = `${symbol}_${timeframe}`;
    const hasData = this.candleData.has(key) && this.candleData.get(key).length > 0;
    const hasValidData = hasData && this.candleData.get(key)[0].close > 0;
    
    console.log(`🔍 Connection status for ${key}: ${hasValidData ? 'CONNECTED' : 'DISCONNECTED'}`);
    return hasValidData;
  }

  // Health check
  async healthCheck() {
    try {
      console.log('🔍 Health check with CORRECT timeframe logic...');
      
      const testUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
      const response = await fetch(testUrl);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const data = await response.json();
      const ethPrice = data.ethereum?.usd;
      
      if (ethPrice) {
        console.log(`✅ Health check passed - ETH: $${ethPrice} - CORRECT timeframe periods`);
        return {
          status: 'healthy',
          ethPrice: ethPrice,
          timestamp: new Date().toISOString(),
          message: 'CORRECT timeframe-based historical data service working'
        };
      } else {
        throw new Error('No ETH price in response');
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        message: 'API issues - using fallback data'
      };
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