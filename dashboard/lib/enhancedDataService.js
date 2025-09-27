// /dashboard/lib/enhancedDataService.js
// Integrated data service combining crypto data, Dr. Paul signals, and volume analysis

import cryptoDataService from './cryptoDataService';

class EnhancedDataService {
  constructor() {
    this.subscribers = new Map();
    this.candleData = new Map();
    this.drPaulSignals = new Map();
    this.marketAnalysis = new Map();
    this.updateIntervals = new Map();
    
    console.log('🧠 Enhanced Data Service initialized with Dr. Paul + Volume Profile integration');
  }

  // Subscribe to enhanced data (crypto + Dr. Paul + volume analysis)
  subscribe(symbol, callback) {
    const key = `enhanced_${symbol}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
      this.startEnhancedDataUpdates(symbol, key);
    }
    
    this.subscribers.get(key).add(callback);
    
    // Return current data if available
    const currentData = this.getEnhancedData(symbol);
    if (currentData) {
      callback(currentData);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.stopEnhancedDataUpdates(symbol, key);
      }
    };
  }

  // Start enhanced data updates
  startEnhancedDataUpdates(symbol, key) {
    console.log(`🔄 Starting enhanced data updates for ${symbol}`);
    
    // Subscribe to crypto data
    const cryptoUnsubscribe = cryptoDataService.subscribe(symbol, '1m', (candleData) => {
      this.processCandleData(symbol, candleData);
    });
    
    // Set up periodic analysis updates
    const interval = setInterval(() => {
      this.updateMarketAnalysis(symbol);
    }, 5000); // Update every 5 seconds
    
    this.updateIntervals.set(key, { interval, cryptoUnsubscribe });
  }

  // Process incoming candle data and add indicators
  processCandleData(symbol, rawCandleData) {
    if (!rawCandleData || rawCandleData.length === 0) return;
    
    // Add technical indicators to candle data
    const enhancedCandles = this.addTechnicalIndicators(rawCandleData);
    
    // Store enhanced candle data
    this.candleData.set(symbol, enhancedCandles);
    
    // Update Dr. Paul signals based on new data
    this.updateDrPaulSignals(symbol, enhancedCandles);
    
    // Notify subscribers with enhanced data
    this.notifySubscribers(symbol);
  }

  // Add technical indicators to candle data
  addTechnicalIndicators(candleData) {
    const enhanced = [...candleData];
    
    // Calculate moving averages
    for (let i = 0; i < enhanced.length; i++) {
      const prices = enhanced.slice(Math.max(0, i - 200), i + 1).map(c => c.close);
      
      // 9 EMA
      if (i >= 8) {
        enhanced[i].ma9 = this.calculateEMA(prices.slice(-9), 9);
      }
      
      // 21 MA
      if (i >= 20) {
        enhanced[i].ma21 = this.calculateSMA(prices.slice(-21));
      }
      
      // 200 MA
      if (i >= 199) {
        enhanced[i].ma200 = this.calculateSMA(prices.slice(-200));
      }
    }
    
    return enhanced;
  }

  // Calculate Simple Moving Average
  calculateSMA(prices) {
    if (!prices || prices.length === 0) return null;
    const sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
  }

  // Calculate Exponential Moving Average
  calculateEMA(prices, period) {
    if (!prices || prices.length === 0) return null;
    if (prices.length === 1) return prices[0];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // Update Dr. Paul's signals
  updateDrPaulSignals(symbol, candleData) {
    if (!candleData || candleData.length < 21) return;
    
    const currentCandle = candleData[candleData.length - 1];
    const currentPrice = currentCandle.close;
    
    // Dr. Paul's methodology analysis
    const signals = {
      trend: this.determineTrend(candleData),
      entrySignal: this.detectEntrySignal(candleData),
      signalQuality: this.calculateSignalQuality(candleData),
      whaleAccumulation: this.analyzeWhaleActivity(candleData),
      pullbackOpportunity: this.detectPullback(candleData),
      overallScore: 0,
      timestamp: Date.now()
    };

    // Calculate overall score
    signals.overallScore = this.calculateOverallScore(signals);
    
    this.drPaulSignals.set(symbol, signals);
  }

  // Determine trend using Dr. Paul's methodology
  determineTrend(candleData) {
    const recent = candleData.slice(-20);
    const currentPrice = recent[recent.length - 1].close;
    const ma21 = recent[recent.length - 1].ma21;
    const ma200 = recent[recent.length - 1].ma200;
    
    if (!ma21 || !ma200) return 'neutral';
    
    // Counter-trend approach: look for opposing signals
    if (currentPrice > ma21 && ma21 > ma200) {
      // Strong uptrend - look for bearish pullback
      return 'bullish';
    } else if (currentPrice < ma21 && ma21 < ma200) {
      // Strong downtrend - look for bullish bounce  
      return 'bearish';
    }
    
    return 'neutral';
  }

  // Detect entry signals based on Dr. Paul's counter-trend methodology
  detectEntrySignal(candleData) {
    const recent = candleData.slice(-10);
    if (recent.length < 10) return false;
    
    const currentPrice = recent[recent.length - 1].close;
    const ma9 = recent[recent.length - 1].ma9;
    const ma21 = recent[recent.length - 1].ma21;
    
    if (!ma9 || !ma21) return false;
    
    // Look for counter-trend entry opportunities
    const priceAboveMA9 = currentPrice > ma9;
    const ma9AboveMA21 = ma9 > ma21;
    
    // Volume analysis for confirmation
    const volumeSpike = this.detectVolumeSpike(recent);
    
    return (priceAboveMA9 && ma9AboveMA21 && volumeSpike) || 
           (!priceAboveMA9 && !ma9AboveMA21 && volumeSpike);
  }

  // Detect volume spikes
  detectVolumeSpike(candleData) {
    if (candleData.length < 5) return false;
    
    const currentVolume = candleData[candleData.length - 1].volume;
    const avgVolume = candleData.slice(-5, -1).reduce((sum, c) => sum + c.volume, 0) / 4;
    
    return currentVolume > avgVolume * 1.5; // 50% above average
  }

  // Calculate signal quality score
  calculateSignalQuality(candleData) {
    let score = 0;
    const recent = candleData.slice(-20);
    
    if (recent.length < 20) return 0;
    
    const currentCandle = recent[recent.length - 1];
    
    // Moving average alignment
    if (currentCandle.ma9 && currentCandle.ma21) {
      if (Math.abs(currentCandle.ma9 - currentCandle.ma21) / currentCandle.close < 0.02) {
        score += 20; // MAs close together
      }
    }
    
    // Volume confirmation
    if (this.detectVolumeSpike(recent.slice(-5))) {
      score += 25;
    }
    
    // Price action quality
    const volatility = this.calculateVolatility(recent);
    if (volatility > 0.01 && volatility < 0.05) { // Sweet spot volatility
      score += 20;
    }
    
    // Trend strength
    const trendStrength = this.calculateTrendStrength(recent);
    score += Math.min(35, trendStrength * 35);
    
    return Math.min(100, score);
  }

  // Analyze whale accumulation patterns
  analyzeWhaleActivity(candleData) {
    const recent = candleData.slice(-10);
    let whaleScore = 0;
    
    for (const candle of recent) {
      // Large volume with small price movement = potential accumulation
      const priceMove = Math.abs(candle.close - candle.open) / candle.open;
      const volumeRatio = candle.volume / (recent.reduce((sum, c) => sum + c.volume, 0) / recent.length);
      
      if (volumeRatio > 1.5 && priceMove < 0.01) {
        whaleScore += 10;
      }
    }
    
    return Math.min(100, whaleScore);
  }

  // Detect pullback opportunities
  detectPullback(candleData) {
    const recent = candleData.slice(-15);
    if (recent.length < 15) return 0;
    
    // Look for retracement patterns
    const highs = recent.map(c => c.high);
    const lows = recent.map(c => c.low);
    
    const recentHigh = Math.max(...highs.slice(-5));
    const recentLow = Math.min(...lows.slice(-5));
    const currentPrice = recent[recent.length - 1].close;
    
    // Calculate pullback percentage
    const pullbackFromHigh = (recentHigh - currentPrice) / recentHigh;
    const bounceFromLow = (currentPrice - recentLow) / recentLow;
    
    return Math.max(pullbackFromHigh, bounceFromLow) * 100;
  }

  // Calculate volatility
  calculateVolatility(candleData) {
    if (candleData.length < 10) return 0;
    
    const returns = [];
    for (let i = 1; i < candleData.length; i++) {
      const ret = (candleData[i].close - candleData[i-1].close) / candleData[i-1].close;
      returns.push(ret);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  // Calculate trend strength
  calculateTrendStrength(candleData) {
    if (candleData.length < 10) return 0;
    
    const closes = candleData.map(c => c.close);
    const startPrice = closes[0];
    const endPrice = closes[closes.length - 1];
    
    const totalMove = Math.abs(endPrice - startPrice) / startPrice;
    const consistency = this.calculateTrendConsistency(closes);
    
    return Math.min(1, totalMove * consistency);
  }

  // Calculate trend consistency
  calculateTrendConsistency(prices) {
    let consistent = 0;
    const isUptrend = prices[prices.length - 1] > prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      const moveInTrendDirection = isUptrend ? 
        prices[i] > prices[i-1] : 
        prices[i] < prices[i-1];
      
      if (moveInTrendDirection) {
        consistent++;
      }
    }
    
    return consistent / (prices.length - 1);
  }

  // Calculate overall Dr. Paul score
  calculateOverallScore(signals) {
    let score = 0;
    
    // Signal quality weight
    score += signals.signalQuality * 0.3;
    
    // Whale accumulation weight
    score += signals.whaleAccumulation * 0.25;
    
    // Pullback opportunity weight
    score += Math.min(50, signals.pullbackOpportunity * 2) * 0.2;
    
    // Entry signal bonus
    if (signals.entrySignal) {
      score += 25;
    }
    
    return Math.min(100, score);
  }

  // Update market analysis
  updateMarketAnalysis(symbol) {
    const candleData = this.candleData.get(symbol);
    const drPaulSignals = this.drPaulSignals.get(symbol);
    
    if (!candleData || !drPaulSignals) return;
    
    const currentPrice = candleData[candleData.length - 1]?.close || 0;
    
    const analysis = {
      currentPrice,
      priceChange24h: this.calculate24hChange(candleData),
      volume24h: this.calculate24hVolume(candleData),
      marketCap: currentPrice * 120000000, // Approximate ETH supply
      timestamp: Date.now()
    };
    
    this.marketAnalysis.set(symbol, analysis);
  }

  // Calculate 24h price change
  calculate24hChange(candleData) {
    if (candleData.length < 1440) return 0; // Need 24h of 1min data
    
    const current = candleData[candleData.length - 1].close;
    const dayAgo = candleData[candleData.length - 1440].close;
    
    return ((current - dayAgo) / dayAgo) * 100;
  }

  // Calculate 24h volume
  calculate24hVolume(candleData) {
    if (candleData.length < 1440) {
      // Use available data
      return candleData.reduce((sum, candle) => sum + candle.volume, 0);
    }
    
    const last24h = candleData.slice(-1440);
    return last24h.reduce((sum, candle) => sum + candle.volume, 0);
  }

  // Get enhanced data for a symbol
  getEnhancedData(symbol) {
    const candleData = this.candleData.get(symbol);
    const drPaulSignals = this.drPaulSignals.get(symbol);
    const marketAnalysis = this.marketAnalysis.get(symbol);
    
    if (!candleData || !drPaulSignals || !marketAnalysis) {
      return null;
    }
    
    return {
      historicalData: candleData,
      drPaulSignals,
      currentPrice: marketAnalysis.currentPrice,
      priceChange24h: marketAnalysis.priceChange24h,
      volume24h: marketAnalysis.volume24h,
      marketCap: marketAnalysis.marketCap,
      timestamp: marketAnalysis.timestamp
    };
  }

  // Notify subscribers
  notifySubscribers(symbol) {
    const key = `enhanced_${symbol}`;
    const enhancedData = this.getEnhancedData(symbol);
    
    if (!enhancedData) return;
    
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(enhancedData);
        } catch (error) {
          console.error('❌ Error in enhanced data subscriber callback:', error);
        }
      });
    }
  }

  // Stop enhanced data updates
  stopEnhancedDataUpdates(symbol, key) {
    console.log(`🛑 Stopping enhanced data updates for ${symbol}`);
    
    const intervals = this.updateIntervals.get(key);
    if (intervals) {
      clearInterval(intervals.interval);
      intervals.cryptoUnsubscribe();
      this.updateIntervals.delete(key);
    }
    
    this.candleData.delete(symbol);
    this.drPaulSignals.delete(symbol);
    this.marketAnalysis.delete(symbol);
  }

  // Cleanup all subscriptions
  disconnectAll() {
    console.log('🚫 Stopping all enhanced data updates');
    
    this.updateIntervals.forEach((intervals) => {
      clearInterval(intervals.interval);
      intervals.cryptoUnsubscribe();
    });
    
    this.updateIntervals.clear();
    this.subscribers.clear();
    this.candleData.clear();
    this.drPaulSignals.clear();
    this.marketAnalysis.clear();
  }
}

// Create singleton instance
const enhancedDataService = new EnhancedDataService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    enhancedDataService.disconnectAll();
  });
}

export default enhancedDataService;