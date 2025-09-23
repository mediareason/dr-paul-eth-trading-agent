import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Zap, DollarSign, Wifi, WifiOff, BarChart3, Play } from 'lucide-react';
import cryptoDataService from '../lib/cryptoDataService';

const ScalpingTracker = () => {
  const [symbol, setSymbol] = useState('ETHUSDT');
  const [timeframe, setTimeframe] = useState('1m');
  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [signals, setSignals] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [usingMockData, setUsingMockData] = useState(false);
  
  const unsubscribeRef = useRef(null);
  const signalHistoryRef = useRef([]);

  // Calculate moving averages
  const calculateEMA = (data, period) => {
    if (data.length < period) return data.map(() => null);
    
    const multiplier = 2 / (period + 1);
    const ema = [];
    
    // Start with SMA for first value
    const sma = data.slice(0, period).reduce((sum, val) => sum + val.close, 0) / period;
    ema.push(sma);
    
    for (let i = period; i < data.length; i++) {
      const currentEMA = (data[i].close * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
      ema.push(currentEMA);
    }
    
    return data.map((_, index) => index < period - 1 ? null : ema[index - period + 1]);
  };

  const calculateSMA = (data, period) => {
    return data.map((_, index) => {
      if (index < period - 1) return null;
      const slice = data.slice(index - period + 1, index + 1);
      return slice.reduce((sum, val) => sum + val.close, 0) / period;
    });
  };

  // Detect entry signals
  const detectEntrySignals = (data, ema9, sma21, sma200) => {
    const signals = [];
    const latest = data.length - 1;
    
    if (latest < 2) return signals;
    
    const currentPrice = data[latest].close;
    const prevPrice = data[latest - 1].close;
    const currentEMA9 = ema9[latest];
    const prevEMA9 = ema9[latest - 1];
    const currentSMA21 = sma21[latest];
    const prevSMA21 = sma21[latest - 1];
    const sma200Current = sma200[latest];
    
    // Check for new signals (avoid duplicates)
    const currentTime = data[latest].timestamp;
    const recentSignals = signalHistoryRef.current.filter(
      s => new Date(currentTime) - new Date(s.timestamp) < 300000 // 5 minutes
    );
    
    // Bullish signals
    if (currentEMA9 > prevEMA9 && prevEMA9 <= prevSMA21 && currentEMA9 > currentSMA21) {
      const hasRecentLong = recentSignals.some(s => s.type.includes('LONG'));
      if (!hasRecentLong) {
        const signal = {
          type: 'LONG',
          strength: currentPrice > sma200Current ? 'STRONG' : 'MEDIUM',
          reason: '9 EMA crossed above 21 MA',
          price: currentPrice,
          timestamp: currentTime,
          stopLoss: currentPrice * 0.995, // 0.5% stop
          takeProfit: currentPrice * 1.015 // 1.5% target (3:1 RR)
        };
        signals.push(signal);
        signalHistoryRef.current.push(signal);
      }
    }
    
    // Bearish signals
    if (currentEMA9 < prevEMA9 && prevEMA9 >= prevSMA21 && currentEMA9 < currentSMA21) {
      const hasRecentShort = recentSignals.some(s => s.type.includes('SHORT'));
      if (!hasRecentShort) {
        const signal = {
          type: 'SHORT',
          strength: currentPrice < sma200Current ? 'STRONG' : 'MEDIUM',
          reason: '9 EMA crossed below 21 MA',
          price: currentPrice,
          timestamp: currentTime,
          stopLoss: currentPrice * 1.005, // 0.5% stop
          takeProfit: currentPrice * 0.985 // 1.5% target (3:1 RR)
        };
        signals.push(signal);
        signalHistoryRef.current.push(signal);
      }
    }
    
    // Pullback opportunities
    if (currentEMA9 > currentSMA21 && currentSMA21 > sma200Current) {
      const distanceFrom21MA = Math.abs(currentPrice - currentSMA21) / currentSMA21;
      if (distanceFrom21MA < 0.003) { // Within 0.3% of 21 MA
        const hasRecentPullback = recentSignals.some(s => s.type === 'LONG_PULLBACK');
        if (!hasRecentPullback) {
          const signal = {
            type: 'LONG_PULLBACK',
            strength: 'MEDIUM',
            reason: 'Pullback to 21 MA in uptrend',
            price: currentPrice,
            timestamp: currentTime,
            stopLoss: currentSMA21 * 0.997,
            takeProfit: currentPrice * 1.01
          };
          signals.push(signal);
          signalHistoryRef.current.push(signal);
        }
      }
    }
    
    if (currentEMA9 < currentSMA21 && currentSMA21 < sma200Current) {
      const distanceFrom21MA = Math.abs(currentPrice - currentSMA21) / currentSMA21;
      if (distanceFrom21MA < 0.003) { // Within 0.3% of 21 MA
        const hasRecentPullback = recentSignals.some(s => s.type === 'SHORT_PULLBACK');
        if (!hasRecentPullback) {
          const signal = {
            type: 'SHORT_PULLBACK',
            strength: 'MEDIUM',
            reason: 'Pullback to 21 MA in downtrend',
            price: currentPrice,
            timestamp: currentTime,
            stopLoss: currentSMA21 * 1.003,
            takeProfit: currentPrice * 0.99
          };
          signals.push(signal);
          signalHistoryRef.current.push(signal);
        }
      }
    }
    
    // Keep signal history manageable
    if (signalHistoryRef.current.length > 50) {
      signalHistoryRef.current = signalHistoryRef.current.slice(-25);
    }
    
    return signals;
  };

  // Calculate 24h price change
  const calculate24hChange = (data) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1].close;
    const past = data[Math.max(0, data.length - 1440)].close; // Approximate 24h ago for 1m data
    return ((current - past) / past) * 100;
  };

  useEffect(() => {
    setConnectionStatus('Connecting to exchange...');
    setIsConnected(false);
    
    // Subscribe to real-time data
    const unsubscribe = cryptoDataService.subscribe(symbol, timeframe, (candleData) => {
      if (candleData && candleData.length > 0) {
        // Calculate moving averages
        const ema9 = calculateEMA(candleData, 9);
        const sma21 = calculateSMA(candleData, 21);
        const sma200 = calculateSMA(candleData, 200);
        
        // Enrich data with moving averages
        const enrichedData = candleData.map((item, index) => ({
          ...item,
          ema9: ema9[index],
          sma21: sma21[index],
          sma200: sma200[index]
        }));
        
        setPriceData(enrichedData);
        
        // Update current price and stats
        const latestCandle = candleData[candleData.length - 1];
        setCurrentPrice(latestCandle.close);
        setPriceChange24h(calculate24hChange(candleData));
        setLastUpdate(new Date());
        
        // Detect new signals
        const newSignals = detectEntrySignals(candleData, ema9, sma21, sma200);
        if (newSignals.length > 0) {
          setSignals(prevSignals => [...newSignals, ...prevSignals.slice(0, 4)]); // Keep last 5 signals
        }
        
        // Update connection status
        const isConnectedNow = cryptoDataService.getConnectionStatus(symbol, timeframe);
        setIsConnected(isConnectedNow);
        
        // Check if using mock data
        const isMock = cryptoDataService.useMockData || cryptoDataService.mockIntervals.has(`${symbol}_${timeframe}`);
        setUsingMockData(isMock);
        
        if (isMock) {
          setConnectionStatus('Demo Mode - Using Simulated Data');
        } else {
          setConnectionStatus(isConnectedNow ? 'Connected to Binance' : 'Connection lost');
        }
      }
    });
    
    unsubscribeRef.current = unsubscribe;
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [symbol, timeframe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const getSignalColor = (type) => {
    switch (type) {
      case 'LONG':
      case 'LONG_PULLBACK':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'SHORT':
      case 'SHORT_PULLBACK':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSignalIcon = (type) => {
    switch (type) {
      case 'LONG':
      case 'LONG_PULLBACK':
        return <TrendingUp className="w-4 h-4" />;
      case 'SHORT':
      case 'SHORT_PULLBACK':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Get display symbol name
  const getDisplaySymbol = (symbol) => {
    const symbolMap = {
      'ETHUSDT': 'ETH',
      'BTCUSDT': 'BTC', 
      'SOLUSDT': 'SOL',
      'AVAXUSDT': 'AVAX',
      'LINKUSDT': 'LINK',
      'DOTUSDT': 'DOT',
      'ASTERUSDT': 'ASTER',
      'HYPEUSDT': 'HYPE'
    };
    return symbolMap[symbol] || symbol.replace('USDT', '');
  };

  const latestData = priceData[priceData.length - 1];
  const trendDirection = latestData && latestData.ema9 > latestData.sma21 ? 'UP' : 'DOWN';
  const recentChange = priceData.length > 1 ? 
    ((priceData[priceData.length - 1].close - priceData[priceData.length - 2].close) / priceData[priceData.length - 2].close) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Scalping Entry Tracker</h1>
          <div className="flex items-center gap-2">
            {usingMockData ? 
              <Play className="w-5 h-5 text-blue-500" /> : 
              (isConnected ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />)
            }
            <span className={`text-sm ${usingMockData ? 'text-blue-600' : (isConnected ? 'text-green-600' : 'text-red-600')}`}>
              {connectionStatus}
            </span>
          </div>
        </div>
        <p className="text-gray-600">
          {usingMockData ? 
            'Demo mode with realistic simulated data • All features fully functional' :
            'Real-time scalping signals from Binance WebSocket feeds • Curated symbols for active trading'
          }
        </p>
      </div>

      {/* Demo Mode Alert */}
      {usingMockData && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold text-blue-800">Demo Mode Active</div>
              <div className="text-sm text-blue-700">
                Using simulated market data due to network restrictions. All trading signals and features work identically to live data.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
          <select 
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
            <option value="AVAXUSDT">AVAX/USDT</option>
            <option value="LINKUSDT">LINK/USDT</option>
            <option value="DOTUSDT">DOT/USDT</option>
            <option value="ASTERUSDT">ASTER/USDT</option>
            <option value="HYPEUSDT">HYPE/USDT</option>
          </select>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1m">1 Minute</option>
            <option value="3m">3 Minutes</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
          </select>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">{getDisplaySymbol(symbol)} Price</div>
          <div className="text-xl font-bold text-gray-900">${currentPrice.toLocaleString()}</div>
          <div className={`text-sm ${recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {recentChange >= 0 ? '+' : ''}{recentChange.toFixed(3)}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">24h Change</div>
          <div className={`text-lg font-semibold ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500">
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">9 Period EMA</div>
          <div className="text-lg font-semibold text-blue-600">
            ${latestData?.ema9?.toFixed(4) || 'Loading...'}
          </div>
          <div className="text-xs text-gray-500">Fast trend indicator</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">21 Period MA</div>
          <div className="text-lg font-semibold text-orange-600">
            ${latestData?.sma21?.toFixed(4) || 'Loading...'}
          </div>
          <div className="text-xs text-gray-500">Medium trend filter</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">200 Period MA</div>
          <div className="text-lg font-semibold text-purple-600">
            ${latestData?.sma200?.toFixed(4) || 'Loading...'}
          </div>
          <div className="text-xs text-gray-500">Long-term trend</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-500">
          <div className="text-sm text-gray-600 mb-1">Market Trend</div>
          <div className={`text-lg font-semibold flex items-center gap-2 ${trendDirection === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
            {trendDirection === 'UP' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {trendDirection}
          </div>
          <div className="text-xs text-gray-500">EMA vs MA direction</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {usingMockData ? '🎭 Demo' : '📈 Live'} {getDisplaySymbol(symbol)} Chart • {timeframe} Timeframe
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData.slice(-60)}> {/* Show last 60 candles */}
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#666"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
                tickFormatter={(value) => `$${value.toFixed(currentPrice < 1 ? 4 : 2)}`}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#1f2937" 
                strokeWidth={2}
                dot={false}
                name="Price"
              />
              <Line 
                type="monotone" 
                dataKey="ema9" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                name="9 EMA"
              />
              <Line 
                type="monotone" 
                dataKey="sma21" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                name="21 MA"
              />
              <Line 
                type="monotone" 
                dataKey="sma200" 
                stroke="#8b5cf6" 
                strokeWidth={1.5}
                dot={false}
                name="200 MA"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entry Signals */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Recent {getDisplaySymbol(symbol)} Entry Signals ({signals.length} active)
        </h3>
        
        {signals.length > 0 ? (
          <div className="space-y-3">
            {signals.map((signal, index) => (
              <div 
                key={`${signal.timestamp}-${index}`}
                className={`p-4 rounded-lg border-2 ${getSignalColor(signal.type)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSignalIcon(signal.type)}
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {signal.type.replace('_', ' ')} {getDisplaySymbol(symbol)}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          signal.strength === 'STRONG' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {signal.strength}
                        </span>
                      </div>
                      <div className="text-sm opacity-80">{signal.reason}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${signal.price.toFixed(currentPrice < 1 ? 4 : 2)}</div>
                    <div className="text-xs opacity-60">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </div>
                    {signal.stopLoss && (
                      <div className="text-xs mt-1 space-y-0.5">
                        <div className="text-red-600">SL: ${signal.stopLoss.toFixed(currentPrice < 1 ? 4 : 2)}</div>
                        <div className="text-green-600">TP: ${signal.takeProfit.toFixed(currentPrice < 1 ? 4 : 2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div className="font-medium">No recent {getDisplaySymbol(symbol)} entry signals</div>
            <div className="text-sm">Monitoring for favorable scalping conditions...</div>
            {!isConnected && !usingMockData && (
              <div className="text-sm text-red-500 mt-2">
                ⚠️ Check internet connection - WebSocket disconnected
              </div>
            )}
          </div>
        )}
      </div>

      {/* Real-time Stats Footer */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Live Scalping Strategy • {usingMockData ? 'Demo Mode' : 'Binance Data Feed'} • Professional Trading Tools
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <strong className="text-green-700">Long Entry Conditions:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>9 EMA crosses above 21 MA (momentum shift)</li>
              <li>Price above 200 MA = strong trend confirmation</li>
              <li>Pullback to 21 MA in established uptrend</li>
              <li>Risk: 0.5% | Target: 1.5% (3:1 reward/risk)</li>
            </ul>
          </div>
          <div>
            <strong className="text-red-700">Short Entry Conditions:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>9 EMA crosses below 21 MA (momentum shift)</li>
              <li>Price below 200 MA = strong trend confirmation</li>
              <li>Pullback to 21 MA in established downtrend</li>
              <li>Risk: 0.5% | Target: 1.5% (3:1 reward/risk)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <strong className="text-blue-800">
            {usingMockData ? '🎭 Demo Mode:' : '🎯 Active Symbols:'}
          </strong>
          <span className="text-blue-700 text-sm ml-2">
            {usingMockData ? 
              'Realistic simulated data • Perfect for learning and testing strategies • Switch to live data when network allows' :
              'ETH • BTC • SOL • AVAX • LINK • DOT • ASTER • HYPE • Real-time Binance WebSocket feeds'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScalpingTracker;