/**
 * Alert Service - Real-time monitoring for Dr. Paul trading system
 * Monitors Dr. Paul Score, Volume Levels, and Technical Signals
 */

class AlertService {
  constructor() {
    this.subscribers = new Set();
    this.alertHistory = [];
    this.activeAlerts = [];
    this.settings = this.loadSettings();
    this.isRunning = false;
    this.checkInterval = null;
    this.lastCheckedData = null;
  }

  // Load alert settings from localStorage
  loadSettings() {
    const defaultSettings = {
      drPaulScore: {
        enabled: true,
        thresholds: {
          excellent: 85,
          good: 70,
          poor: 50
        },
        cooldown: 300000 // 5 minutes between similar alerts
      },
      volumeLevels: {
        enabled: true,
        pocDistance: 0.5, // Alert when within 0.5% of POC
        supportResistanceDistance: 0.3, // Alert when within 0.3% of S/R
        cooldown: 600000 // 10 minutes between level alerts
      },
      scalping: {
        enabled: true,
        emaCross: true,
        strongSignalsOnly: false,
        timeframes: ['15m', '30m', '1h'],
        cooldown: 180000 // 3 minutes between scalping alerts
      },
      priceAction: {
        enabled: true,
        breakouts: true,
        reversal: true,
        volatility: true,
        volatilityThreshold: 2.0 // % change that triggers volatility alert
      },
      notifications: {
        browser: true,
        audio: true,
        visual: true,
        maxActiveAlerts: 10
      }
    };

    try {
      const stored = localStorage.getItem('alertSettings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch (error) {
      console.error('Error loading alert settings:', error);
      return defaultSettings;
    }
  }

  // Save alert settings to localStorage
  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('alertSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving alert settings:', error);
    }
  }

  // Subscribe to alert notifications
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Start monitoring
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚨 Alert Service started - monitoring thresholds...');
    
    // Check every 10 seconds
    this.checkInterval = setInterval(() => {
      this.checkAlertConditions();
    }, 10000);
  }

  // Stop monitoring
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('⏹️ Alert Service stopped');
  }

  // Main alert checking logic
  async checkAlertConditions() {
    try {
      const marketData = await this.getCurrentMarketData();
      
      if (!marketData) {
        console.warn('⚠️ No market data available for alert checking');
        return;
      }

      const newAlerts = [];

      // Check Dr. Paul Score alerts
      if (this.settings.drPaulScore.enabled) {
        newAlerts.push(...this.checkDrPaulScoreAlerts(marketData));
      }

      // Check Volume Level alerts
      if (this.settings.volumeLevels.enabled) {
        newAlerts.push(...this.checkVolumeLevelAlerts(marketData));
      }

      // Check Scalping signals
      if (this.settings.scalping.enabled) {
        newAlerts.push(...this.checkScalpingAlerts(marketData));
      }

      // Check Price Action alerts
      if (this.settings.priceAction.enabled) {
        newAlerts.push(...this.checkPriceActionAlerts(marketData));
      }

      // Process new alerts
      if (newAlerts.length > 0) {
        this.processNewAlerts(newAlerts);
      }

      this.lastCheckedData = marketData;

    } catch (error) {
      console.error('Error checking alert conditions:', error);
    }
  }

  // Get current market data from your data services
  async getCurrentMarketData() {
    try {
      // This would integrate with your existing data services
      // For now, using a placeholder that shows the structure
      
      const response = await fetch('/api/market-data'); // Your API endpoint
      
      if (!response.ok) {
        // Fallback to direct CoinGecko if your API is down
        return await this.getCoinGeckoData();
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error fetching market data:', error);
      return await this.getCoinGeckoData();
    }
  }

  // Fallback CoinGecko data fetcher
  async getCoinGeckoData() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true');
      const data = await response.json();
      
      return {
        ethPrice: data.ethereum.usd,
        priceChange24h: data.ethereum.usd_24h_change,
        volume24h: data.ethereum.usd_24h_vol,
        timestamp: new Date().toISOString(),
        // Mock Dr. Paul Score - replace with real calculation
        drPaulScore: 75 + (Math.random() - 0.5) * 20,
        // Mock volume levels - replace with real VPVR data
        pocLevel: data.ethereum.usd * (0.998 + Math.random() * 0.004),
        supportLevel: data.ethereum.usd * 0.985,
        resistanceLevel: data.ethereum.usd * 1.015,
        // Mock technical indicators - replace with real calculations
        ema9: data.ethereum.usd * (0.999 + Math.random() * 0.002),
        sma21: data.ethereum.usd * (0.998 + Math.random() * 0.004),
        trend: data.ethereum.usd_24h_change > 0 ? 'BULLISH' : 'BEARISH'
      };
    } catch (error) {
      console.error('Error fetching CoinGecko data:', error);
      return null;
    }
  }

  // Check Dr. Paul Score threshold alerts
  checkDrPaulScoreAlerts(data) {
    const alerts = [];
    const score = data.drPaulScore;

    // Check if we recently sent a similar alert
    const recentScoreAlert = this.alertHistory.find(alert => 
      alert.type.includes('SCORE') && 
      Date.now() - new Date(alert.timestamp).getTime() < this.settings.drPaulScore.cooldown
    );

    if (recentScoreAlert) return alerts;

    if (score >= this.settings.drPaulScore.thresholds.excellent) {
      alerts.push(this.createAlert({
        type: 'EXCELLENT_SCORE',
        title: '🎯 EXCELLENT Dr. Paul Setup!',
        message: `Score: ${score.toFixed(1)}% - High conviction opportunity at $${data.ethPrice.toFixed(2)}`,
        priority: 'HIGH',
        data: { score, price: data.ethPrice }
      }));
    } else if (score >= this.settings.drPaulScore.thresholds.good) {
      alerts.push(this.createAlert({
        type: 'GOOD_SCORE',
        title: '✅ Good Dr. Paul Setup',
        message: `Score: ${score.toFixed(1)}% - Consider entry at $${data.ethPrice.toFixed(2)}`,
        priority: 'MEDIUM',
        data: { score, price: data.ethPrice }
      }));
    } else if (score <= this.settings.drPaulScore.thresholds.poor) {
      alerts.push(this.createAlert({
        type: 'POOR_SCORE',
        title: '⚠️ Poor Setup Quality',
        message: `Score: ${score.toFixed(1)}% - Avoid trading at current levels`,
        priority: 'LOW',
        data: { score, price: data.ethPrice }
      }));
    }

    return alerts;
  }

  // Check Volume Level alerts
  checkVolumeLevelAlerts(data) {
    const alerts = [];
    
    // Check POC distance
    if (data.pocLevel) {
      const pocDistance = Math.abs(data.ethPrice - data.pocLevel) / data.pocLevel * 100;
      
      if (pocDistance <= this.settings.volumeLevels.pocDistance) {
        alerts.push(this.createAlert({
          type: 'POC_LEVEL',
          title: '📊 Price at POC Level',
          message: `ETH $${data.ethPrice.toFixed(2)} near POC $${data.pocLevel.toFixed(2)} - Volume magnet activated`,
          priority: 'HIGH',
          data: { price: data.ethPrice, poc: data.pocLevel, distance: pocDistance }
        }));
      }
    }

    // Check Support/Resistance levels
    if (data.supportLevel) {
      const supportDistance = Math.abs(data.ethPrice - data.supportLevel) / data.ethPrice * 100;
      if (supportDistance <= this.settings.volumeLevels.supportResistanceDistance) {
        alerts.push(this.createAlert({
          type: 'SUPPORT_LEVEL',
          title: '🟢 Price at Support',
          message: `ETH $${data.ethPrice.toFixed(2)} at support $${data.supportLevel.toFixed(2)} - Bounce opportunity`,
          priority: 'MEDIUM',
          data: { price: data.ethPrice, level: data.supportLevel, type: 'support' }
        }));
      }
    }

    if (data.resistanceLevel) {
      const resistanceDistance = Math.abs(data.ethPrice - data.resistanceLevel) / data.ethPrice * 100;
      if (resistanceDistance <= this.settings.volumeLevels.supportResistanceDistance) {
        alerts.push(this.createAlert({
          type: 'RESISTANCE_LEVEL',
          title: '🔴 Price at Resistance',
          message: `ETH $${data.ethPrice.toFixed(2)} at resistance $${data.resistanceLevel.toFixed(2)} - Watch for reversal`,
          priority: 'MEDIUM',
          data: { price: data.ethPrice, level: data.resistanceLevel, type: 'resistance' }
        }));
      }
    }

    return alerts;
  }

  // Check Scalping signal alerts
  checkScalpingAlerts(data) {
    const alerts = [];
    
    if (this.settings.scalping.emaCross && data.ema9 && data.sma21) {
      // Bullish EMA cross
      if (data.ema9 > data.sma21 && data.trend === 'BULLISH') {
        alerts.push(this.createAlert({
          type: 'EMA_CROSS_BULL',
          title: '📈 Bullish EMA Cross',
          message: `9 EMA above 21 MA - Long signal at $${data.ethPrice.toFixed(2)}`,
          priority: 'MEDIUM',
          data: { ema9: data.ema9, sma21: data.sma21, price: data.ethPrice }
        }));
      }
      // Bearish EMA cross
      else if (data.ema9 < data.sma21 && data.trend === 'BEARISH') {
        alerts.push(this.createAlert({
          type: 'EMA_CROSS_BEAR',
          title: '📉 Bearish EMA Cross',
          message: `9 EMA below 21 MA - Short signal at $${data.ethPrice.toFixed(2)}`,
          priority: 'MEDIUM',
          data: { ema9: data.ema9, sma21: data.sma21, price: data.ethPrice }
        }));
      }
    }

    return alerts;
  }

  // Check Price Action alerts
  checkPriceActionAlerts(data) {
    const alerts = [];
    
    if (this.lastCheckedData && this.settings.priceAction.volatility) {
      const priceChangePercent = Math.abs(
        (data.ethPrice - this.lastCheckedData.ethPrice) / this.lastCheckedData.ethPrice * 100
      );
      
      if (priceChangePercent >= this.settings.priceAction.volatilityThreshold) {
        alerts.push(this.createAlert({
          type: 'HIGH_VOLATILITY',
          title: '⚡ High Volatility Alert',
          message: `ETH moved ${priceChangePercent.toFixed(2)}% to $${data.ethPrice.toFixed(2)} - Increased volatility detected`,
          priority: 'MEDIUM',
          data: { priceChange: priceChangePercent, price: data.ethPrice }
        }));
      }
    }

    return alerts;
  }

  // Create alert object
  createAlert({ type, title, message, priority = 'MEDIUM', data = {} }) {
    return {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      priority,
      timestamp: new Date(),
      data,
      dismissed: false
    };
  }

  // Process and distribute new alerts
  processNewAlerts(newAlerts) {
    // Add to active alerts (limit to max)
    this.activeAlerts = [...newAlerts, ...this.activeAlerts]
      .slice(0, this.settings.notifications.maxActiveAlerts);

    // Add to history
    this.alertHistory = [...newAlerts, ...this.alertHistory]
      .slice(0, 100); // Keep last 100 alerts

    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback({
          type: 'NEW_ALERTS',
          alerts: newAlerts,
          activeAlerts: this.activeAlerts,
          alertHistory: this.alertHistory
        });
      } catch (error) {
        console.error('Error notifying alert subscriber:', error);
      }
    });

    // Trigger browser/audio notifications
    newAlerts.forEach(alert => this.triggerNotification(alert));

    console.log(`🚨 ${newAlerts.length} new alerts generated:`, newAlerts.map(a => a.title));
  }

  // Trigger browser/audio notifications
  triggerNotification(alert) {
    // Browser notification
    if (this.settings.notifications.browser && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.type,
        requireInteraction: alert.priority === 'HIGH'
      });
    }

    // Audio notification (if audio element exists)
    if (this.settings.notifications.audio) {
      const audio = document.getElementById('alert-audio');
      if (audio) {
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
    }
  }

  // Dismiss alert
  dismissAlert(alertId) {
    this.activeAlerts = this.activeAlerts.filter(alert => alert.id !== alertId);
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback({
          type: 'ALERT_DISMISSED',
          alertId,
          activeAlerts: this.activeAlerts
        });
      } catch (error) {
        console.error('Error notifying alert dismissal:', error);
      }
    });
  }

  // Clear all alerts
  clearAllAlerts() {
    this.activeAlerts = [];
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback({
          type: 'ALERTS_CLEARED',
          activeAlerts: this.activeAlerts
        });
      } catch (error) {
        console.error('Error notifying alerts cleared:', error);
      }
    });
  }

  // Get current state
  getState() {
    return {
      activeAlerts: this.activeAlerts,
      alertHistory: this.alertHistory,
      settings: this.settings,
      isRunning: this.isRunning
    };
  }
}

// Create singleton instance
const alertService = new AlertService();

// Auto-start if in browser environment
if (typeof window !== 'undefined') {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Auto-start monitoring after 2 seconds
  setTimeout(() => {
    alertService.start();
  }, 2000);
}

export default alertService;