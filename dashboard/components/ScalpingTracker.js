import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Zap, DollarSign } from 'lucide-react';

const ScalpingTracker = () => {
  const [symbol, setSymbol] = useState('ETHUSDT');
  const [timeframe, setTimeframe] = useState('1m');
  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [signals, setSignals] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);

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

  // Generate sample data (in real app, this would come from WebSocket/API)
  const generateSampleData = () => {
    const data = [];
    let basePrice = symbol === 'ETHUSDT' ? 3400 : symbol === 'BTCUSDT' ? 67000 : 45000;
    const now = new Date();
    
    for (let i = 199; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
      const volatility = Math.random() * 0.015 - 0.0075; // ±0.75% random movement
      basePrice = basePrice * (1 + volatility);
      
      data.push({
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        close: Math.round(basePrice * 100) / 100,
        volume: Math.random() * 1000000,
        high: basePrice * (1 + Math.random() * 0.005),
        low: basePrice * (1 - Math.random() * 0.005),
        open: basePrice
      });
    }
    
    return data;
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
    
    // Bullish signals
    if (currentEMA9 > prevEMA9 && prevEMA9 <= prevSMA21 && currentEMA9 > currentSMA21) {
      signals.push({
        type: 'LONG',
        strength: currentPrice > sma200Current ? 'STRONG' : 'MEDIUM',
        reason: '9 EMA crossed above 21 MA',
        price: currentPrice,
        timestamp: data[latest].timestamp,
        stopLoss: currentPrice * 0.995, // 0.5% stop
        takeProfit: currentPrice * 1.015 // 1.5% target (3:1 RR)
      });
    }
    
    // Bearish signals
    if (currentEMA9 < prevEMA9 && prevEMA9 >= prevSMA21 && currentEMA9 < currentSMA21) {
      signals.push({
        type: 'SHORT',
        strength: currentPrice < sma200Current ? 'STRONG' : 'MEDIUM',
        reason: '9 EMA crossed below 21 MA',
        price: currentPrice,
        timestamp: data[latest].timestamp,
        stopLoss: currentPrice * 1.005, // 0.5% stop
        takeProfit: currentPrice * 0.985 // 1.5% target (3:1 RR)
      });
    }
    
    // Pullback opportunities
    if (currentEMA9 > currentSMA21 && currentSMA21 > sma200Current) {
      const distanceFrom21MA = Math.abs(currentPrice - currentSMA21) / currentSMA21;
      if (distanceFrom21MA < 0.003) { // Within 0.3% of 21 MA
        signals.push({
          type: 'LONG_PULLBACK',
          strength: 'MEDIUM',
          reason: 'Pullback to 21 MA in uptrend',
          price: currentPrice,
          timestamp: data[latest].timestamp,
          stopLoss: currentSMA21 * 0.997,
          takeProfit: currentPrice * 1.01
        });
      }
    }
    
    if (currentEMA9 < currentSMA21 && currentSMA21 < sma200Current) {
      const distanceFrom21MA = Math.abs(currentPrice - currentSMA21) / currentSMA21;
      if (distanceFrom21MA < 0.003) { // Within 0.3% of 21 MA
        signals.push({
          type: 'SHORT_PULLBACK',
          strength: 'MEDIUM',
          reason: 'Pullback to 21 MA in downtrend',
          price: currentPrice,
          timestamp: data[latest].timestamp,
          stopLoss: currentSMA21 * 1.003,
          takeProfit: currentPrice * 0.99
        });
      }
    }
    
    return signals;
  };

  useEffect(() => {
    // Initialize with sample data
    setIsConnected(true);
    const data = generateSampleData();
    const ema9 = calculateEMA(data, 9);
    const sma21 = calculateSMA(data, 21);
    const sma200 = calculateSMA(data, 200);
    
    const enrichedData = data.map((item, index) => ({
      ...item,
      ema9: ema9[index],
      sma21: sma21[index],
      sma200: sma200[index]
    }));
    
    setPriceData(enrichedData);
    setCurrentPrice(data[data.length - 1].close);
    setSignals(detectEntrySignals(data, ema9, sma21, sma200));
    setLastUpdate(new Date());
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      const lastPrice = data[data.length - 1].close;
      const volatility = Math.random() * 0.008 - 0.004; // ±0.4%
      const newPrice = lastPrice * (1 + volatility);
      
      const newCandle = {
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        close: Math.round(newPrice * 100) / 100,
        volume: Math.random() * 1000000,
        high: newPrice * (1 + Math.random() * 0.002),
        low: newPrice * (1 - Math.random() * 0.002),
        open: newPrice
      };
      
      const updatedData = [...data.slice(1), newCandle];
      const newEma9 = calculateEMA(updatedData, 9);
      const newSma21 = calculateSMA(updatedData, 21);
      const newSma200 = calculateSMA(updatedData, 200);
      
      const newEnrichedData = updatedData.map((item, index) => ({
        ...item,
        ema9: newEma9[index],
        sma21: newSma21[index],
        sma200: newSma200[index]
      }));
      
      setPriceData(newEnrichedData);
      setCurrentPrice(newCandle.close);
      setSignals(detectEntrySignals(updatedData, newEma9, newSma21, newSma200));
      setLastUpdate(new Date());
    }, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

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

  const latestData = priceData[priceData.length - 1];
  const trendDirection = latestData && latestData.ema9 > latestData.sma21 ? 'UP' : 'DOWN';
  const priceChange = priceData.length > 1 ? 
    ((priceData[priceData.length - 1].close - priceData[priceData.length - 2].close) / priceData[priceData.length - 2].close) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Scalping Entry Tracker</h1>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
        <p className="text-gray-600">Real-time scalping signals based on 9 EMA, 21 MA & 200 MA crossovers</p>
      </div>

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
            <option value="ADAUSDT">ADA/USDT</option>
            <option value="AVAXUSDT">AVAX/USDT</option>
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
          <div className="text-sm text-gray-600 mb-1">Current Price</div>
          <div className="text-xl font-bold text-gray-900">${currentPrice.toLocaleString()}</div>
          <div className={`text-sm ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Last Update</div>
          <div className="text-sm font-medium">{lastUpdate.toLocaleTimeString()}</div>
          <div className={`text-sm flex items-center gap-1 ${trendDirection === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
            {trendDirection === 'UP' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trendDirection}TREND
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">9 Period EMA</div>
          <div className="text-lg font-semibold text-blue-600">
            ${latestData?.ema9?.toFixed(2) || 'Loading...'}
          </div>
          <div className="text-xs text-gray-500">Fast trend indicator</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">21 Period MA</div>
          <div className="text-lg font-semibold text-orange-600">
            ${latestData?.sma21?.toFixed(2) || 'Loading...'}
          </div>
          <div className="text-xs text-gray-500">Medium trend filter</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">200 Period MA</div>
          <div className="text-lg font-semibold text-purple-600">
            ${latestData?.sma200?.toFixed(2) || 'Loading...'}
          </div>
          <div className="text-xs text-gray-500">Long-term trend</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Price Chart with Moving Averages
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
                domain={['dataMin - 50', 'dataMax + 50']}
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
                strokeWidth={1}
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
          Live Entry Signals
        </h3>
        
        {signals.length > 0 ? (
          <div className="space-y-3">
            {signals.map((signal, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 ${getSignalColor(signal.type)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSignalIcon(signal.type)}
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {signal.type.replace('_', ' ')} 
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
                    <div className="font-semibold">${signal.price.toFixed(2)}</div>
                    <div className="text-xs opacity-60">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </div>
                    {signal.stopLoss && (
                      <div className="text-xs mt-1">
                        <div>SL: ${signal.stopLoss.toFixed(2)}</div>
                        <div>TP: ${signal.takeProfit.toFixed(2)}</div>
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
            <div className="font-medium">No entry signals detected</div>
            <div className="text-sm">Waiting for favorable scalping conditions...</div>
          </div>
        )}
      </div>

      {/* Scalping Rules */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Scalping Strategy Rules
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
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
          <strong className="text-yellow-800">⚠️ Scalping Risk Warning:</strong>
          <span className="text-yellow-700 text-sm ml-2">
            High-frequency trading requires strict discipline, tight risk management, and sufficient capital for transaction costs.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScalpingTracker;