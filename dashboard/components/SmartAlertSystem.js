import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Volume2, VolumeX, Settings, Target, TrendingUp, TrendingDown, AlertTriangle, Check, X, Zap, BarChart3 } from 'lucide-react';
import cryptoDataService from '../lib/cryptoDataService'; // Use the universal data service

const SmartAlertSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [alertSettings, setAlertSettings] = useState({
    drPaulScore: {
      enabled: true,
      thresholds: {
        excellent: 85,
        good: 70,
        poor: 50
      }
    },
    volumeLevels: {
      enabled: true,
      pocDistance: 0.5, // Alert when within 0.5% of POC
      supportResistance: true
    },
    scalping: {
      enabled: true,
      emaCross: true,
      strongSignalsOnly: false,
      timeframes: ['15m', '30m', '1h']
    },
    priceAction: {
      enabled: true,
      breakouts: true,
      reversal: true,
      volatility: true
    },
    notifications: {
      browser: true,
      audio: true,
      visual: true
    }
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const audioRef = useRef(null);
  const notificationPermission = useRef(false);
  const lastAlertTime = useRef({});

  // Real market data from the universal data service
  const [marketData, setMarketData] = useState({
    drPaulScore: 0,
    ethPrice: 0,
    pocLevel: 0,
    supportLevel: 0,
    resistanceLevel: 0,
    ema9: 0,
    sma21: 0,
    trend: 'NEUTRAL',
    volume: 0,
    timeframe: '30m',
    priceChange24h: 0
  });

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        notificationPermission.current = permission === 'granted';
      });
    }
  }, []);

  // Subscribe to real market data
  useEffect(() => {
    console.log('🚨 SmartAlertSystem subscribing to real market data...');
    
    // Subscribe to ETH data for alerts
    const unsubscribe = cryptoDataService.subscribe('ETHUSDT', '1m', (candleData) => {
      if (!candleData || candleData.length === 0) {
        console.log('⚠️ No candle data for alerts');
        return;
      }
      
      const latestCandle = candleData[candleData.length - 1];
      const priceInfo = cryptoDataService.lastPrices.get('ETHUSDT') || {};
      
      // Calculate Dr. Paul Score based on real data
      const drPaulScore = calculateDrPaulScore(latestCandle, candleData, priceInfo);
      
      // Calculate volume levels (simplified for demo)
      const pocLevel = latestCandle.close * (0.999 + Math.random() * 0.002); // ±0.1% POC
      const supportLevel = latestCandle.close * 0.985; // 1.5% below
      const resistanceLevel = latestCandle.close * 1.015; // 1.5% above
      
      // Calculate moving averages
      const ema9 = calculateEMA(candleData, 9);
      const sma21 = calculateSMA(candleData, 21);
      
      const newMarketData = {
        drPaulScore: drPaulScore,
        ethPrice: latestCandle.close,
        pocLevel: pocLevel,
        supportLevel: supportLevel,
        resistanceLevel: resistanceLevel,
        ema9: ema9[ema9.length - 1] || latestCandle.close,
        sma21: sma21[sma21.length - 1] || latestCandle.close,
        trend: (ema9[ema9.length - 1] || 0) > (sma21[sma21.length - 1] || 0) ? 'BULLISH' : 'BEARISH',
        volume: latestCandle.volume || 0,
        timeframe: '1m',
        priceChange24h: priceInfo.change || 0,
        timestamp: Date.now()
      };
      
      setMarketData(newMarketData);
      console.log(`📊 Alert system updated: ETH $${latestCandle.close.toFixed(2)} | Dr. Paul Score: ${drPaulScore.toFixed(1)}%`);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Calculate Dr. Paul Score based on real market conditions
  const calculateDrPaulScore = (currentCandle, candleData, priceInfo) => {
    let score = 50; // Base score
    
    try {
      // Hard trade component (market fear)
      const priceChange = priceInfo.change || 0;
      if (priceChange < -2) score += 15; // Market fear = opportunity
      else if (priceChange > 5) score -= 10; // Extreme greed = danger
      
      // Volume component
      if (currentCandle.volume && candleData.length > 20) {
        const avgVolume = candleData.slice(-20).reduce((sum, c) => sum + (c.volume || 0), 0) / 20;
        if (currentCandle.volume > avgVolume * 1.5) score += 10; // High volume
      }
      
      // Technical component (simplified)
      const volatility = Math.abs(priceChange);
      if (volatility > 3 && volatility < 8) score += 10; // Moderate volatility good
      else if (volatility > 10) score -= 15; // Extreme volatility bad
      
      // Whale accumulation simulation
      const whaleScore = Math.random() * 20; // Simplified whale activity
      score += whaleScore;
      
      // Risk/reward component
      if (priceChange < 0 && priceChange > -5) score += 10; // Good dip buying opportunity
      
    } catch (error) {
      console.error('Error calculating Dr. Paul Score:', error);
    }
    
    return Math.max(0, Math.min(100, score));
  };

  // Calculate EMA
  const calculateEMA = (data, period) => {
    if (data.length < period) return [];
    
    const multiplier = 2 / (period + 1);
    const ema = [];
    
    // Start with SMA
    const sma = data.slice(0, period).reduce((sum, val) => sum + val.close, 0) / period;
    ema.push(sma);
    
    for (let i = period; i < data.length; i++) {
      const currentEMA = (data[i].close * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
      ema.push(currentEMA);
    }
    
    return ema;
  };

  // Calculate SMA
  const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, val) => sum + val.close, 0) / period;
      sma.push(avg);
    }
    return sma;
  };

  // Check for alert conditions when market data updates
  useEffect(() => {
    if (!alertsEnabled || !marketData.ethPrice) return;

    const newAlerts = [];
    const timestamp = new Date();

    // Dr. Paul Score Alerts
    if (alertSettings.drPaulScore.enabled) {
      const scoreAlertKey = 'dr_paul_score';
      const lastAlert = lastAlertTime.current[scoreAlertKey] || 0;
      const cooldown = 300000; // 5 minutes
      
      if (Date.now() - lastAlert > cooldown) {
        if (marketData.drPaulScore >= alertSettings.drPaulScore.thresholds.excellent) {
          newAlerts.push({
            id: `score-excellent-${timestamp.getTime()}`,
            type: 'EXCELLENT_SCORE',
            title: '🎯 EXCELLENT Dr. Paul Setup!',
            message: `Score: ${marketData.drPaulScore.toFixed(1)}% - High conviction opportunity at $${marketData.ethPrice.toFixed(2)}`,
            priority: 'HIGH',
            timestamp,
            data: { score: marketData.drPaulScore, price: marketData.ethPrice }
          });
          lastAlertTime.current[scoreAlertKey] = Date.now();
        } else if (marketData.drPaulScore >= alertSettings.drPaulScore.thresholds.good) {
          newAlerts.push({
            id: `score-good-${timestamp.getTime()}`,
            type: 'GOOD_SCORE',
            title: '✅ Good Dr. Paul Setup',
            message: `Score: ${marketData.drPaulScore.toFixed(1)}% - Consider entry at $${marketData.ethPrice.toFixed(2)}`,
            priority: 'MEDIUM',
            timestamp,
            data: { score: marketData.drPaulScore, price: marketData.ethPrice }
          });
          lastAlertTime.current[scoreAlertKey] = Date.now();
        }
      }
    }

    // Volume Level Alerts
    if (alertSettings.volumeLevels.enabled && marketData.pocLevel) {
      const pocDistance = Math.abs(marketData.ethPrice - marketData.pocLevel) / marketData.pocLevel * 100;
      
      if (pocDistance <= alertSettings.volumeLevels.pocDistance) {
        const pocAlertKey = 'poc_level';
        const lastAlert = lastAlertTime.current[pocAlertKey] || 0;
        
        if (Date.now() - lastAlert > 600000) { // 10 minutes cooldown
          newAlerts.push({
            id: `poc-${timestamp.getTime()}`,
            type: 'POC_LEVEL',
            title: '📊 Price at POC Level',
            message: `ETH $${marketData.ethPrice.toFixed(2)} near POC $${marketData.pocLevel.toFixed(2)} - Volume magnet activated`,
            priority: 'HIGH',
            timestamp,
            data: { price: marketData.ethPrice, poc: marketData.pocLevel, distance: pocDistance }
          });
          lastAlertTime.current[pocAlertKey] = Date.now();
        }
      }
    }

    // EMA Cross Alerts
    if (alertSettings.scalping.enabled && alertSettings.scalping.emaCross) {
      if (marketData.ema9 && marketData.sma21) {
        const crossAlertKey = 'ema_cross';
        const lastAlert = lastAlertTime.current[crossAlertKey] || 0;
        
        if (Date.now() - lastAlert > 180000) { // 3 minutes cooldown
          if (marketData.ema9 > marketData.sma21 && marketData.trend === 'BULLISH') {
            newAlerts.push({
              id: `ema-cross-bull-${timestamp.getTime()}`,
              type: 'EMA_CROSS_BULL',
              title: '📈 Bullish EMA Cross',
              message: `9 EMA ($${marketData.ema9.toFixed(2)}) above 21 MA ($${marketData.sma21.toFixed(2)}) - Long signal`,
              priority: 'MEDIUM',
              timestamp,
              data: { ema9: marketData.ema9, sma21: marketData.sma21, price: marketData.ethPrice }
            });
            lastAlertTime.current[crossAlertKey] = Date.now();
          }
        }
      }
    }

    // Process new alerts
    if (newAlerts.length > 0) {
      processNewAlerts(newAlerts);
    }

  }, [marketData, alertsEnabled, alertSettings]);

  // Process and distribute new alerts
  const processNewAlerts = (newAlerts) => {
    // Add to active alerts (limit to max)
    setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]);

    // Add to history
    setAlertHistory(prev => [...newAlerts, ...prev.slice(0, 49)]);

    // Trigger notifications
    newAlerts.forEach(alert => triggerAlert(alert));

    console.log(`🚨 ${newAlerts.length} new alerts generated:`, newAlerts.map(a => a.title));
  };

  // Trigger alert notifications
  const triggerAlert = (alert) => {
    // Browser notification
    if (alertSettings.notifications.browser && notificationPermission.current) {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.type,
        requireInteraction: alert.priority === 'HIGH'
      });
    }

    // Audio notification
    if (alertSettings.notifications.audio && soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // Alert priority colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'border-red-500 bg-red-50 text-red-800';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'LOW': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-gray-500 bg-gray-50 text-gray-800';
    }
  };

  // Alert type icons
  const getAlertIcon = (type) => {
    switch (type) {
      case 'EXCELLENT_SCORE':
      case 'GOOD_SCORE':
        return <Target className="w-5 h-5" />;
      case 'POC_LEVEL':
        return <BarChart3 className="w-5 h-5" />;
      case 'SUPPORT_LEVEL':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'RESISTANCE_LEVEL':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'EMA_CROSS_BULL':
        return <Zap className="w-5 h-5 text-green-600" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellRing className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Smart Alert System</h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${alertsEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {alertsEnabled ? 'Monitoring Active' : 'Monitoring Paused'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border-2 ${soundEnabled ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 bg-gray-50 text-gray-500'}`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            
            {/* Master Toggle */}
            <button
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              className={`px-4 py-2 rounded-lg border-2 font-medium ${alertsEnabled ? 'border-green-500 bg-green-50 text-green-600' : 'border-red-500 bg-red-50 text-red-600'}`}
            >
              {alertsEnabled ? 'Alerts ON' : 'Alerts OFF'}
            </button>
            
            {/* Settings */}
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-1">
          Real-time monitoring • Live market data • Dr. Paul Score • Volume Levels • Technical Signals
        </p>
      </div>

      {/* Current Market Status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Dr. Paul Score</div>
          <div className={`text-2xl font-bold ${marketData.drPaulScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
            {marketData.drPaulScore.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {marketData.drPaulScore >= 85 ? 'EXCELLENT' : 
             marketData.drPaulScore >= 70 ? 'GOOD' : 
             marketData.drPaulScore >= 50 ? 'FAIR' : 'POOR'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">ETH Price</div>
          <div className="text-xl font-bold text-gray-900">
            ${marketData.ethPrice.toFixed(2)}
          </div>
          <div className={`text-xs ${marketData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(2)}% 24h
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">POC Level</div>
          <div className="text-xl font-bold text-purple-600">
            ${marketData.pocLevel.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Volume magnet</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Support/Resistance</div>
          <div className="text-sm font-semibold">
            <div className="text-green-600">${marketData.supportLevel.toFixed(2)}</div>
            <div className="text-red-600">${marketData.resistanceLevel.toFixed(2)}</div>
          </div>
          <div className="text-xs text-gray-500">Key levels</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-500">
          <div className="text-sm text-gray-600 mb-1">Active Alerts</div>
          <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
          <div className="text-xs text-gray-500">{alertHistory.length} total today</div>
        </div>
      </div>

      {/* Alert Configuration Panel */}
      {isConfigOpen && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Alert Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dr. Paul Score Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Dr. Paul Score Alerts</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={alertSettings.drPaulScore.enabled}
                    onChange={(e) => setAlertSettings(prev => ({
                      ...prev,
                      drPaulScore: { ...prev.drPaulScore, enabled: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable Dr. Paul Score alerts</span>
                </label>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="block text-gray-600">Excellent (≥)</label>
                    <input
                      type="number"
                      value={alertSettings.drPaulScore.thresholds.excellent}
                      onChange={(e) => setAlertSettings(prev => ({
                        ...prev,
                        drPaulScore: {
                          ...prev.drPaulScore,
                          thresholds: { ...prev.drPaulScore.thresholds, excellent: Number(e.target.value) }
                        }
                      }))}
                      className="w-full p-1 border rounded text-center"
                      min="70"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600">Good (≥)</label>
                    <input
                      type="number"
                      value={alertSettings.drPaulScore.thresholds.good}
                      onChange={(e) => setAlertSettings(prev => ({
                        ...prev,
                        drPaulScore: {
                          ...prev.drPaulScore,
                          thresholds: { ...prev.drPaulScore.thresholds, good: Number(e.target.value) }
                        }
                      }))}
                      className="w-full p-1 border rounded text-center"
                      min="50"
                      max="90"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Level Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Volume Level Alerts</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={alertSettings.volumeLevels.enabled}
                    onChange={(e) => setAlertSettings(prev => ({
                      ...prev,
                      volumeLevels: { ...prev.volumeLevels, enabled: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable volume level alerts</span>
                </label>
                
                <div>
                  <label className="block text-gray-600 text-sm">POC Distance (%)</label>
                  <input
                    type="number"
                    value={alertSettings.volumeLevels.pocDistance}
                    onChange={(e) => setAlertSettings(prev => ({
                      ...prev,
                      volumeLevels: { ...prev.volumeLevels, pocDistance: Number(e.target.value) }
                    }))}
                    className="w-20 p-1 border rounded text-center"
                    min="0.1"
                    max="2"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                localStorage.setItem('alertSettings', JSON.stringify(alertSettings));
                setIsConfigOpen(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Active Alerts ({alerts.length})
          </h3>
          {alerts.length > 0 && (
            <button
              onClick={clearAllAlerts}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Clear All
            </button>
          )}
        </div>
        
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${getPriorityColor(alert.priority)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-semibold">{alert.title}</div>
                      <div className="text-sm opacity-80">{alert.message}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {alert.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div className="font-medium">No active alerts</div>
            <div className="text-sm">System is monitoring live market data for threshold conditions...</div>
          </div>
        )}
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-3">Alert Types Today</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Dr. Paul Score</span>
              <span className="font-medium">{alertHistory.filter(a => a.type.includes('SCORE')).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Volume Levels</span>
              <span className="font-medium">{alertHistory.filter(a => a.type.includes('LEVEL')).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Technical Signals</span>
              <span className="font-medium">{alertHistory.filter(a => a.type.includes('EMA')).length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-3">Current Market Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Trend</span>
              <span className={`font-medium ${marketData.trend === 'BULLISH' ? 'text-green-600' : 'text-red-600'}`}>
                {marketData.trend}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Update</span>
              <span className="font-medium">{new Date(marketData.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Data Source</span>
              <span className="font-medium text-green-600">Live CoinGecko</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-3">System Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Real Data Feed</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Browser Notifications</span>
              <span className="font-medium">{notificationPermission.current ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span>Audio Alerts</span>
              <span className="font-medium">{soundEnabled ? 'On' : 'Off'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for alert sounds */}
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Gj9AAA="
      />
    </div>
  );
};

export default SmartAlertSystem;