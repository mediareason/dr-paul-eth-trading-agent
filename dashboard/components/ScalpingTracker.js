import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Zap, DollarSign, Wifi, WifiOff, BarChart3, XCircle } from 'lucide-react';
import cryptoDataService from '../lib/cryptoDataService';

const ScalpingTracker = () => {
  const [symbol, setSymbol] = useState('ETHUSDT');
  const [timeframe, setTimeframe] = useState('1m');
  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [signals, setSignals] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [connectionError, setConnectionError] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(0);
  
  const unsubscribeRef = useRef(null);
  const signalHistoryRef = useRef([]);

  // Calculate moving averages (only if we have enough real data)
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

  // Detect entry signals (only with sufficient real data)
  const detectEntrySignals = (data, ema9, sma21, sma200) => {
    const signals = [];
    const latest = data.length - 1;
    
    // Need at least 200 periods for proper 200 MA and signal detection
    if (latest < 200) {
      console.log(`⚠️ Insufficient data for signals: ${data.length} candles (need 200+)`);
      return signals;
    }
    
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
    
    // Keep signal history manageable
    if (signalHistoryRef.current.length > 50) {
      signalHistoryRef.current = signalHistoryRef.current.slice(-25);
    }
    
    return signals;
  };

  useEffect(() => {
    setConnectionStatus('CONNECTING');
    setConnectionError(null);
    
    // Subscribe to real-time data
    const unsubscribe = cryptoDataService.subscribe(symbol, timeframe, (candleData) => {
      console.log(`📊 Received ${candleData.length} candles for ${symbol}`);
      
      if (!candleData || candleData.length === 0) {
        setConnectionError(`No data available for ${symbol}`);
        setConnectionStatus('ERROR');
        setPriceData([]);
        return;
      }
      
      // Check for any connection errors
      const error = cryptoDataService.getConnectionError(symbol, timeframe);
      if (error) {
        setConnectionError(error);
        setConnectionStatus('ERROR');
      } else {
        setConnectionError(null);
        setConnectionStatus('CONNECTED');
      }
      
      // Only proceed with analysis if we have sufficient real data
      if (candleData.length < 9) {
        console.log(`⚠️ Insufficient data for analysis: ${candleData.length} candles`);
        setPriceData(candleData);
        setCurrentPrice(candleData[candleData.length - 1]?.close || 0);
        setLastUpdate(new Date());
        return;
      }
      
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
      
      // Get 24h change from the service
      const priceInfo = cryptoDataService.lastPrices.get(symbol);
      if (priceInfo) {
        setPriceChange24h(priceInfo.change);
      }
      
      setLastUpdate(new Date());
      
      // Detect new signals only if we have enough data
      const newSignals = detectEntrySignals(candleData, ema9, sma21, sma200);
      if (newSignals.length > 0) {
        setSignals(prevSignals => [...newSignals, ...prevSignals.slice(0, 4)]); // Keep last 5 signals
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
  const trendDirection = latestData && latestData.ema9 && latestData.sma21 && latestData.ema9 > latestData.sma21 ? 'UP' : 'DOWN';
  const recentChange = priceData.length > 1 ? 
    ((priceData[priceData.length - 1].close - priceData[priceData.length - 2].close) / priceData[priceData.length - 2].close) * 100 : 0;

  // Determine connection status display
  const getConnectionDisplay = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return {
          icon: <Wifi className="w-5 h-5 text-green-500" />,
          text: 'Connected to Live Data',
          className: 'text-green-600'
        };
      case 'ERROR':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          text: connectionError || 'Data Error',
          className: 'text-red-600'
        };
      default:
        return {
          icon: <WifiOff className="w-5 h-5 text-orange-500" />,
          text: 'Connecting...',
          className: 'text-orange-600'
        };
    }
  };

  const connectionDisplay = getConnectionDisplay();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Scalping Entry Tracker</h1>
          <div className="flex items-center gap-2">
            {connectionDisplay.icon}
            <span className={`text-sm ${connectionDisplay.className}`}>
              {connectionDisplay.text}
            </span>
          </div>
        </div>
        <p className="text-gray-600">Real-time scalping signals • LIVE DATA ONLY • Professional moving average analysis</p>
      </div>

      {/* Error Display */}
      {connectionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-red-800">Data Connection Error</span>
          </div>
          <p className="text-red-700 mt-1">{connectionError}</p>
          <p className="text-red-600 text-sm mt-2">
            This application only uses real market data. Please check your internet connection or try a different symbol.
          </p>
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
          <div className="text-xl font-bold text-gray-900">
            {currentPrice > 0 ? `$${currentPrice.toLocaleString()}` : 'Loading...'}
          </div>
          <div className={`text-sm ${recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currentPrice > 0 ? `${recentChange >= 0 ? '+' : ''}${recentChange.toFixed(3)}%` : '--'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">24h Change</div>
          <div className={`text-lg font-semibold ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange24h !== 0 ? `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%` : 'Loading...'}
          </div>
          <div className="text-xs text-gray-500">
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Market Overview */}
      {connectionStatus === 'CONNECTED' && priceData.length >= 9 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">9 Period EMA</div>
            <div className="text-lg font-semibold text-blue-600">
              ${latestData?.ema9?.toFixed(4) || 'Calculating...'}
            </div>
            <div className="text-xs text-gray-500">Fast trend indicator</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
            <div className="text-sm text-gray-600 mb-1">21 Period MA</div>
            <div className="text-lg font-semibold text-orange-600">
              ${latestData?.sma21?.toFixed(4) || 'Need 21+ candles'}
            </div>
            <div className="text-xs text-gray-500">Medium trend filter</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">200 Period MA</div>
            <div className="text-lg font-semibold text-purple-600">
              ${latestData?.sma200?.toFixed(4) || 'Need 200+ candles'}
            </div>
            <div className="text-xs text-gray-500">Long-term trend</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-500">
            <div className="text-sm text-gray-600 mb-1">Market Trend</div>
            <div className={`text-lg font-semibold flex items-center gap-2 ${trendDirection === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
              {trendDirection === 'UP' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {latestData?.ema9 && latestData?.sma21 ? trendDirection : 'ANALYZING'}
            </div>
            <div className="text-xs text-gray-500">EMA vs MA direction</div>
          </div>
        </div>
      )}

      {/* Chart */}
      {connectionStatus === 'CONNECTED' && priceData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Live {getDisplaySymbol(symbol)} Chart • {timeframe} Timeframe • Real Market Data
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
                {priceData.length >= 9 && (
                  <Line 
                    type="monotone" 
                    dataKey="ema9" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    name="9 EMA"
                  />
                )}
                {priceData.length >= 21 && (
                  <Line 
                    type="monotone" 
                    dataKey="sma21" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={false}
                    name="21 MA"
                  />
                )}
                {priceData.length >= 200 && (
                  <Line 
                    type="monotone" 
                    dataKey="sma200" 
                    stroke="#8b5cf6" 
                    strokeWidth={1.5}
                    dot={false}
                    name="200 MA"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Entry Signals */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Recent {getDisplaySymbol(symbol)} Entry Signals ({signals.length} active)
        </h3>
        
        {connectionStatus === 'CONNECTED' && priceData.length >= 200 ? (
          signals.length > 0 ? (
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
              <div className="text-sm">Monitoring real market data for favorable scalping conditions...</div>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div className="font-medium">
              {connectionStatus === 'ERROR' ? 'Data Connection Required' : 'Loading Market Data...'}
            </div>
            <div className="text-sm">
              {connectionStatus === 'ERROR' 
                ? 'Cannot generate signals without real market data.' 
                : `Need 200+ data points for signals (have ${priceData.length})`
              }
            </div>
          </div>
        )}
      </div>

      {/* Real-time Stats Footer */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Live Scalping Strategy • REAL DATA ONLY • CoinGecko API
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <strong className="text-green-700">Long Entry Conditions:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>9 EMA crosses above 21 MA (momentum shift)</li>
              <li>Price above 200 MA = strong trend confirmation</li>
              <li>Risk: 0.5% | Target: 1.5% (3:1 reward/risk)</li>
              <li>Requires 200+ real data points for signal generation</li>
            </ul>
          </div>
          <div>
            <strong className="text-red-700">Short Entry Conditions:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>9 EMA crosses below 21 MA (momentum shift)</li>
              <li>Price below 200 MA = strong trend confirmation</li>
              <li>Risk: 0.5% | Target: 1.5% (3:1 reward/risk)</li>
              <li>Real market volatility analysis included</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <strong className="text-blue-800">🚀 Live Data Only:</strong>
          <span className="text-blue-700 text-sm ml-2">
            This application uses ONLY real market data from CoinGecko. No simulated or demo data is ever used.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScalpingTracker;