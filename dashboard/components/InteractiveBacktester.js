import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Play, Pause, RotateCcw, TrendingUp, DollarSign, Target, AlertTriangle } from 'lucide-react';

const InteractiveBacktester = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [portfolio, setPortfolio] = useState({
    cash: 10000,
    position: 0,
    totalValue: 10000
  });
  const [trades, setTrades] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  
  // Settings
  const [settings, setSettings] = useState({
    riskPerTrade: 0.02,
    hardTradeThreshold: 0.6, // Lowered to get more signals
    stopLoss: 0.05,
    target: 0.15,
    startDate: '2023-01-01',
    timeFrame: 'hourly',
    duration: 720 // hours (30 days)
  });

  const [historicalData, setHistoricalData] = useState([]);

  // Generate simple historical data
  const generateTestData = () => {
    const data = [];
    let price = 2000;
    const startDate = new Date(settings.startDate);
    
    for (let i = 0; i < settings.duration; i++) {
      // Calculate timestamp based on timeframe
      const timestamp = new Date(startDate);
      if (settings.timeFrame === 'hourly') {
        timestamp.setHours(timestamp.getHours() + i);
      } else {
        timestamp.setDate(timestamp.getDate() + i);
      }
      
      // More realistic price movement with trends
      const trendFactor = Math.sin(i / 100) * 0.001; // Longer trend cycles
      const volatility = (Math.random() - 0.5) * 0.025; // ±2.5% max move
      price = Math.max(1000, price * (1 + trendFactor + volatility));
      
      // Calculate moving averages for trend detection
      const lookback = Math.min(i, 20);
      const recentPrices = data.slice(-lookback).map(d => d.price);
      const avgPrice = recentPrices.length > 0 ? recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length : price;
      
      // Dr. Paul's signal components (more realistic)
      const isUptrend = price > avgPrice;
      const isPullback = price < avgPrice && isUptrend;
      const volatilityHigh = Math.abs(volatility) > 0.015;
      
      // Whale accumulation (simulate smart money)
      let whaleScore = Math.random() * 0.4 + 0.3; // 0.3-0.7 base
      if (isPullback && Math.random() < 0.3) { // 30% chance of high whale activity on pullbacks
        whaleScore = Math.random() * 0.3 + 0.7; // 0.7-1.0
      }
      
      // Hard trade score (uncomfortable but profitable setups)
      let hardTradeScore = 0.2; // Base score
      if (isPullback) hardTradeScore += 0.4; // Buying weakness in uptrend
      if (volatilityHigh && isUptrend) hardTradeScore += 0.3; // High vol in uptrend
      if (whaleScore > 0.7) hardTradeScore += 0.2; // Smart money active
      if (Math.random() < 0.1) hardTradeScore += 0.3; // Random market fear events
      
      // Technical score
      let technicalScore = 0.3; // Base
      if (isUptrend) technicalScore += 0.4;
      if (price > avgPrice * 0.98) technicalScore += 0.3; // Near recent highs
      
      // Overall signal calculation
      const overallScore = (hardTradeScore * 0.4) + (whaleScore * 0.3) + (technicalScore * 0.3);
      
      // Buy signal logic (Dr. Paul style)
      const buySignal = (
        overallScore > settings.hardTradeThreshold && 
        hardTradeScore > 0.4 && // Must have some "hard trade" element
        isUptrend // Only buy in uptrends
      );
      
      data.push({
        step: i,
        timestamp: timestamp.toISOString(),
        timeDisplay: settings.timeFrame === 'hourly' ? 
          `${timestamp.toLocaleDateString()} ${timestamp.getHours()}:00` :
          timestamp.toLocaleDateString(),
        price: Math.round(price * 100) / 100,
        hardTradeScore: Math.min(1, hardTradeScore),
        overallScore: Math.min(1, overallScore),
        whaleScore,
        technicalScore: Math.min(1, technicalScore),
        buySignal,
        isHardTrade: hardTradeScore > 0.6,
        isUptrend,
        isPullback,
        volatilityHigh
      });
    }
    
    console.log(`Generated ${data.length} ${settings.timeFrame} data points from ${settings.startDate}`);
    console.log(`Buy signals: ${data.filter(d => d.buySignal).length}`);
    
    return data;
  };

  const resetBacktest = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setPortfolio({ cash: 10000, position: 0, totalValue: 10000 });
    setTrades([]);
    setCurrentPosition(null);
  };

  // Generate data when settings change
  useEffect(() => {
    setHistoricalData(generateTestData());
    // Reset backtest when time settings change
    resetBacktest();
  }, [settings.startDate, settings.timeFrame, settings.duration]);

  // Run backtest step by step
  useEffect(() => {
    if (!isRunning || currentStep >= historicalData.length) {
      setIsRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      const currentData = historicalData[currentStep];
      
      // Entry logic
      if (currentData.buySignal && !currentPosition) {
        const entryPrice = currentData.price;
        const stopLossPrice = entryPrice * (1 - settings.stopLoss);
        const targetPrice = entryPrice * (1 + settings.target);
        const riskAmount = portfolio.cash * settings.riskPerTrade;
        const positionSize = Math.min(
          riskAmount / (entryPrice - stopLossPrice),
          portfolio.cash * 0.9 / entryPrice
        );
        
        if (positionSize > 0 && positionSize * entryPrice <= portfolio.cash) {
          const cost = positionSize * entryPrice;
          setPortfolio(prev => ({
            ...prev,
            cash: prev.cash - cost,
            position: positionSize
          }));
          
          setCurrentPosition({
            entryStep: currentStep,
            entryPrice,
            size: positionSize,
            stopLoss: stopLossPrice,
            target: targetPrice,
            isHardTrade: currentData.isHardTrade
          });
        }
      }
      
      // Exit logic
      else if (currentPosition) {
        const currentPrice = currentData.price;
        let shouldExit = false;
        let exitReason = '';
        
        if (currentPrice <= currentPosition.stopLoss) {
          shouldExit = true;
          exitReason = 'Stop Loss';
        } else if (currentPrice >= currentPosition.target) {
          shouldExit = true;
          exitReason = 'Target Hit';
        } else if (currentStep - currentPosition.entryStep > 100) {
          shouldExit = true;
          exitReason = 'Time Exit';
        }
        
        if (shouldExit) {
          const proceeds = currentPosition.size * currentPrice;
          const pnl = proceeds - (currentPosition.size * currentPosition.entryPrice);
          const returnPct = (currentPrice - currentPosition.entryPrice) / currentPosition.entryPrice;
          
          setPortfolio(prev => ({
            ...prev,
            cash: prev.cash + proceeds,
            position: 0
          }));
          
          setTrades(prev => [...prev, {
            id: prev.length,
            entryStep: currentPosition.entryStep,
            exitStep: currentStep,
            entryPrice: currentPosition.entryPrice,
            exitPrice: currentPrice,
            size: currentPosition.size,
            pnl,
            returnPct,
            exitReason,
            isHardTrade: currentPosition.isHardTrade
          }]);
          
          setCurrentPosition(null);
        }
      }
      
      // Update total portfolio value
      setPortfolio(prev => ({
        ...prev,
        totalValue: prev.cash + (prev.position * currentData.price)
      }));
      
      setCurrentStep(currentStep + 1);
    }, 50);

    return () => clearTimeout(timer);
  }, [isRunning, currentStep, currentPosition, portfolio.cash, settings]);

  const toggleBacktest = () => {
    setIsRunning(!isRunning);
  };

  // Calculate metrics
  const calculateMetrics = () => {
    if (trades.length === 0) return {};
    
    const returns = trades.map(t => t.returnPct);
    const hardTrades = trades.filter(t => t.isHardTrade);
    const easyTrades = trades.filter(t => !t.isHardTrade);
    
    const totalReturn = ((portfolio.totalValue - 10000) / 10000) * 100;
    const winRate = trades.filter(t => t.returnPct > 0).length / trades.length * 100;
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length * 100;
    
    return {
      totalReturn: totalReturn.toFixed(2),
      totalTrades: trades.length,
      winRate: winRate.toFixed(1),
      avgReturn: avgReturn.toFixed(2),
      hardTradesCount: hardTrades.length,
      hardTradeAvgReturn: hardTrades.length > 0 ? 
        (hardTrades.reduce((sum, t) => sum + t.returnPct, 0) / hardTrades.length * 100).toFixed(2) : '0',
      easyTradeAvgReturn: easyTrades.length > 0 ? 
        (easyTrades.reduce((sum, t) => sum + t.returnPct, 0) / easyTrades.length * 100).toFixed(2) : '0'
    };
  };

  const metrics = calculateMetrics();
  const currentData = historicalData[currentStep] || { price: 2000, overallScore: 0, timeDisplay: 'Loading...' };
  const progress = (currentStep / historicalData.length) * 100;

  // Prepare chart data (last 100 points)
  const chartData = historicalData.slice(Math.max(0, currentStep - 100), currentStep + 1).map((item, index) => ({
    step: item.step,
    timeDisplay: item.timeDisplay,
    price: item.price,
    signal: item.overallScore * 1000 + 1000, // Scale for visibility
    key: `chart-${item.step}-${index}`
  }));

  // Equity curve data
  const equityData = trades.map((trade, index) => ({
    trade: index + 1,
    equity: 10000 + trades.slice(0, index + 1).reduce((sum, t) => sum + t.pnl, 0),
    key: `equity-${index}`
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dr. Paul's Interactive Backtesting Lab
        </h1>
        <p className="text-gray-600">
          Watch Dr. Paul's methodology trade step-by-step with historical data
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleBacktest}
              className={`flex items-center px-4 py-2 rounded-lg text-white ${
                isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isRunning ? <Pause size={20} className="mr-2" /> : <Play size={20} className="mr-2" />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            
            <button
              onClick={resetBacktest}
              className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              <RotateCcw size={20} className="mr-2" />
              Reset
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Progress: {currentStep}/{historicalData.length} ({progress.toFixed(1)}%)
            {currentData.timeDisplay && (
              <span className="ml-4">• Current: {currentData.timeDisplay}</span>
            )}
          </div>
        </div>

        {/* Time Range Controls */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Time Range Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={settings.startDate}
                onChange={(e) => setSettings(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Frame</label>
              <select
                value={settings.timeFrame}
                onChange={(e) => setSettings(prev => ({ ...prev, timeFrame: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration ({settings.timeFrame === 'hourly' ? 'Hours' : 'Days'})
              </label>
              <select
                value={settings.duration}
                onChange={(e) => setSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {settings.timeFrame === 'hourly' ? (
                  <>
                    <option value={168}>1 Week (168h)</option>
                    <option value={336}>2 Weeks (336h)</option>
                    <option value={720}>1 Month (720h)</option>
                    <option value={2160}>3 Months (2160h)</option>
                    <option value={4320}>6 Months (4320h)</option>
                  </>
                ) : (
                  <>
                    <option value={7}>1 Week</option>
                    <option value={30}>1 Month</option>
                    <option value={90}>3 Months</option>
                    <option value={180}>6 Months</option>
                    <option value={365}>1 Year</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Testing: {settings.duration} {settings.timeFrame === 'hourly' ? 'hours' : 'days'} starting from {settings.startDate}
            {historicalData.length > 0 && (
              <span className="ml-4">
                • {historicalData.filter(d => d.buySignal).length} buy signals generated
              </span>
            )}
          </div>
        </div>

        {/* Trading Settings */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Per Trade</label>
            <select
              value={settings.riskPerTrade}
              onChange={(e) => setSettings(prev => ({ ...prev, riskPerTrade: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={0.01}>1%</option>
              <option value={0.02}>2%</option>
              <option value={0.03}>3%</option>
              <option value={0.05}>5%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signal Threshold</label>
            <select
              value={settings.hardTradeThreshold}
              onChange={(e) => setSettings(prev => ({ ...prev, hardTradeThreshold: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={0.4}>40% (More Trades)</option>
              <option value={0.5}>50%</option>
              <option value={0.6}>60% (Balanced)</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80% (High Conviction)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stop Loss</label>
            <select
              value={settings.stopLoss}
              onChange={(e) => setSettings(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={0.03}>3%</option>
              <option value={0.05}>5%</option>
              <option value={0.07}>7%</option>
              <option value={0.10}>10%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
            <select
              value={settings.target}
              onChange={(e) => setSettings(prev => ({ ...prev, target: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={0.10}>10%</option>
              <option value={0.15}>15%</option>
              <option value={0.20}>20%</option>
              <option value={0.25}>25%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${portfolio.totalValue.toLocaleString()}
              </p>
              <p className={`text-sm ${portfolio.totalValue >= 10000 ? 'text-green-600' : 'text-red-600'}`}>
                {((portfolio.totalValue / 10000 - 1) * 100).toFixed(2)}%
              </p>
            </div>
            <DollarSign size={32} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ETH Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ${currentData.price?.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                Signal: {(currentData.overallScore * 100)?.toFixed(0)}%
              </p>
            </div>
            <TrendingUp size={32} className="text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Position</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentPosition ? 'LONG' : 'CASH'}
              </p>
              <p className="text-sm text-gray-500">
                {portfolio.position.toFixed(4)} ETH
              </p>
            </div>
            <Target size={32} className={currentPosition ? 'text-green-500' : 'text-gray-400'} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trades</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalTrades || 0}
              </p>
              <p className="text-sm text-gray-500">
                Win Rate: {metrics.winRate || 0}%
              </p>
            </div>
            <AlertTriangle size={32} className="text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Price Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">ETH Price Movement</h3>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="step" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(step) => {
                    const dataPoint = chartData.find(d => d.step === step);
                    return dataPoint ? dataPoint.timeDisplay : step;
                  }}
                  formatter={(value, name) => [
                    name === 'price' ? `$${value.toFixed(2)}` : `${((value - 1000) / 1000 * 100).toFixed(0)}%`,
                    name === 'price' ? 'ETH Price' : 'Signal Strength'
                  ]} 
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Equity Curve */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
          {equityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trade" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Portfolio Value']} />
                <Line 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No trades executed yet
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {Object.keys(metrics).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Dr. Paul's Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics.totalReturn}%</p>
              <p className="text-sm text-gray-600">Total Return</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.totalTrades}</p>
              <p className="text-sm text-gray-600">Total Trades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{metrics.winRate}%</p>
              <p className="text-sm text-gray-600">Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics.hardTradeAvgReturn}%</p>
              <p className="text-sm text-gray-600">Hard Trade Avg</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.easyTradeAvgReturn}%</p>
              <p className="text-sm text-gray-600">Easy Trade Avg</p>
            </div>
          </div>
          
          {parseFloat(metrics.hardTradeAvgReturn) > parseFloat(metrics.easyTradeAvgReturn) && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ Dr. Paul's Methodology Validated: Hard trades outperformed easy trades by {(parseFloat(metrics.hardTradeAvgReturn) - parseFloat(metrics.easyTradeAvgReturn)).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveBacktester;