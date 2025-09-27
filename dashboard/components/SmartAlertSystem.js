import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Volume2, VolumeX, Settings, Target, TrendingUp, TrendingDown, AlertTriangle, Check, X, Zap, BarChart3 } from 'lucide-react';

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

  // Sample market data - In real implementation, this would come from your data service
  const [marketData, setMarketData] = useState({
    drPaulScore: 78,
    ethPrice: 4485.67,
    pocLevel: 4472.33,
    supportLevel: 4441.25,
    resistanceLevel: 4523.89,
    ema9: 4478.12,
    sma21: 4465.78,
    trend: 'BULLISH',
    volume: 'HIGH',
    timeframe: '30m'
  });

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        notificationPermission.current = permission === 'granted';
      });
    }
  }, []);

  // Alert logic - checks market conditions against thresholds
  const checkAlertConditions = (data) => {
    const newAlerts = [];
    const timestamp = new Date();

    // Dr. Paul Score Alerts
    if (alertSettings.drPaulScore.enabled) {
      if (data.drPaulScore >= alertSettings.drPaulScore.thresholds.excellent) {
        newAlerts.push({
          id: `score-excellent-${timestamp.getTime()}`,
          type: 'EXCELLENT_SCORE',
          title: '🎯 EXCELLENT Dr. Paul Setup!',
          message: `Score: ${data.drPaulScore}% - High conviction opportunity`,
          priority: 'HIGH',
          timestamp,
          data: { score: data.drPaulScore, price: data.ethPrice }
        });
      } else if (data.drPaulScore >= alertSettings.drPaulScore.thresholds.good) {
        newAlerts.push({
          id: `score-good-${timestamp.getTime()}`,
          type: 'GOOD_SCORE',
          title: '✅ Good Dr. Paul Setup',
          message: `Score: ${data.drPaulScore}% - Consider entry`,
          priority: 'MEDIUM',
          timestamp,
          data: { score: data.drPaulScore, price: data.ethPrice }
        });
      } else if (data.drPaulScore <= alertSettings.drPaulScore.thresholds.poor) {
        newAlerts.push({
          id: `score-poor-${timestamp.getTime()}`,
          type: 'POOR_SCORE',
          title: '⚠️ Poor Setup Quality',
          message: `Score: ${data.drPaulScore}% - Avoid trading`,
          priority: 'LOW',
          timestamp,
          data: { score: data.drPaulScore, price: data.ethPrice }
        });
      }
    }

    // Volume Level Alerts
    if (alertSettings.volumeLevels.enabled) {
      const pocDistance = Math.abs(data.ethPrice - data.pocLevel) / data.pocLevel * 100;
      
      if (pocDistance <= alertSettings.volumeLevels.pocDistance) {
        newAlerts.push({
          id: `poc-${timestamp.getTime()}`,
          type: 'POC_LEVEL',
          title: '📊 Price at POC Level',
          message: `ETH ${data.ethPrice} near POC ${data.pocLevel} - Volume magnet`,
          priority: 'HIGH',
          timestamp,
          data: { price: data.ethPrice, poc: data.pocLevel, distance: pocDistance }
        });
      }

      // Support/Resistance alerts
      if (Math.abs(data.ethPrice - data.supportLevel) / data.ethPrice * 100 <= 0.5) {
        newAlerts.push({
          id: `support-${timestamp.getTime()}`,
          type: 'SUPPORT_LEVEL',
          title: '🟢 Price at Support',
          message: `ETH ${data.ethPrice} at support ${data.supportLevel} - Bounce opportunity`,
          priority: 'MEDIUM',
          timestamp,
          data: { price: data.ethPrice, level: data.supportLevel, type: 'support' }
        });
      }

      if (Math.abs(data.ethPrice - data.resistanceLevel) / data.ethPrice * 100 <= 0.5) {
        newAlerts.push({
          id: `resistance-${timestamp.getTime()}`,
          type: 'RESISTANCE_LEVEL',
          title: '🔴 Price at Resistance',
          message: `ETH ${data.ethPrice} at resistance ${data.resistanceLevel} - Watch for reversal`,
          priority: 'MEDIUM',
          timestamp,
          data: { price: data.ethPrice, level: data.resistanceLevel, type: 'resistance' }
        });
      }
    }

    // Scalping Signals
    if (alertSettings.scalping.enabled && alertSettings.scalping.emaCross) {
      if (data.ema9 > data.sma21 && data.trend === 'BULLISH') {
        newAlerts.push({
          id: `ema-cross-bull-${timestamp.getTime()}`,
          type: 'EMA_CROSS_BULL',
          title: '📈 Bullish EMA Cross',
          message: `9 EMA above 21 MA on ${data.timeframe} - Long signal`,
          priority: 'MEDIUM',
          timestamp,
          data: { ema9: data.ema9, sma21: data.sma21, timeframe: data.timeframe }
        });
      }
    }

    return newAlerts;
  };

  // Simulate market data updates (in real app, this would be your data service)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate price movement and score changes
      const priceChange = (Math.random() - 0.5) * 10; // ±$5 movement
      const scoreChange = (Math.random() - 0.5) * 4; // ±2% score change
      
      setMarketData(prev => ({
        ...prev,
        ethPrice: Math.max(4400, Math.min(4600, prev.ethPrice + priceChange)),
        drPaulScore: Math.max(0, Math.min(100, prev.drPaulScore + scoreChange)),
        ema9: prev.ethPrice + (Math.random() - 0.5) * 5,
        sma21: prev.ethPrice + (Math.random() - 0.5) * 8
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Check for new alerts when market data updates
  useEffect(() => {
    if (!alertsEnabled) return;

    const newAlerts = checkAlertConditions(marketData);
    
    if (newAlerts.length > 0) {
      // Add to active alerts
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Keep last 10 alerts
      
      // Add to history
      setAlertHistory(prev => [...newAlerts, ...prev.slice(0, 49)]); // Keep last 50 in history
      
      // Trigger notifications
      newAlerts.forEach(alert => {
        triggerAlert(alert);
      });
    }
  }, [marketData, alertsEnabled, alertSettings]);

  // Trigger alert notifications
  const triggerAlert = (alert) => {
    // Browser notification
    if (alertSettings.notifications.browser && notificationPermission.current) {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/icon-192x192.png',
        tag: alert.type
      });
    }

    // Audio notification
    if (alertSettings.notifications.audio && soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    // Console log for debugging
    console.log(`🚨 ALERT: ${alert.title} - ${alert.message}`);
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
          Real-time monitoring • Dr. Paul Score • Volume Levels • Technical Signals
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
          <div className="text-xs text-gray-500">Live market price</div>
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
                
                <div className="grid grid-cols-3 gap-2 text-sm">
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
                  <div>
                    <label className="block text-gray-600">Poor (≤)</label>
                    <input
                      type="number"
                      value={alertSettings.drPaulScore.thresholds.poor}
                      onChange={(e) => setAlertSettings(prev => ({
                        ...prev,
                        drPaulScore: {
                          ...prev.drPaulScore,
                          thresholds: { ...prev.drPaulScore.thresholds, poor: Number(e.target.value) }
                        }
                      }))}
                      className="w-full p-1 border rounded text-center"
                      min="0"
                      max="70"
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
                  <label className="block text-gray-600 text-sm">POC Distance (%) :</label>
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
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={alertSettings.volumeLevels.supportResistance}
                    onChange={(e) => setAlertSettings(prev => ({
                      ...prev,
                      volumeLevels: { ...prev.volumeLevels, supportResistance: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Support/Resistance alerts</span>
                </label>
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
                // Save settings to localStorage
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
            <div className="text-sm">System is monitoring for threshold conditions...</div>
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
          <h4 className="font-medium text-gray-900 mb-3">Alert Priority</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-600">High Priority</span>
              <span className="font-medium">{alertHistory.filter(a => a.priority === 'HIGH').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">Medium Priority</span>
              <span className="font-medium">{alertHistory.filter(a => a.priority === 'MEDIUM').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Low Priority</span>
              <span className="font-medium">{alertHistory.filter(a => a.priority === 'LOW').length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-3">Alert Actions</h4>
          <div className="space-y-2 text-sm">
            <button className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              Export Alert History
            </button>
            <button className="w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              Test All Alerts
            </button>
            <button className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
              Reset Alert History
            </button>
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