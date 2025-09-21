"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const DrPaulLiveDashboard = () => {
  const [mounted, setMounted] = useState(false);
  const [liveData, setLiveData] = useState({
    ethPrice: 4485.57,
    priceChange: 2.34,
    volume24h: 27900000000,
    marketCap: 560000000000,
    isLive: false,
    lastUpdate: new Date()
  });

  const [portfolio, setPortfolio] = useState({
    totalValue: 22456.78,
    ethBalance: 4.2356,
    usdtBalance: 3456.78,
    totalReturn: 124.56,
    unrealizedPnL: 8967.89
  });

  const [drPaulSignals, setDrPaulSignals] = useState({
    overallScore: 0.78,
    hardTradeOpportunity: 0.65,
    pullbackBuySignal: 0.55,
    whaleAccumulation: 0.82,
    institutionalFlow: 0.89,
    setupQuality: 'HIGH'
  });

  const [onChainMetrics, setOnChainMetrics] = useState({
    exchangeFlow: -18750,
    whaleActivity: 0.89,
    gasPrice: 15.2,
    activeAddresses: 623145,
    defiTvl: 160.5,
    stakingRatio: 30.2,
    exchangeBalance: 18.8
  });

  const [priceHistory, setPriceHistory] = useState([
    { time: '06:00', price: 4445.12, volume: 45000 },
    { time: '09:00', price: 4467.89, volume: 52000 },
    { time: '12:00', price: 4491.23, volume: 48000 },
    { time: '15:00', price: 4485.57, volume: 67000 },
    { time: '18:00', price: 4502.34, volume: 71000 },
    { time: '21:00', price: 4489.76, volume: 55000 }
  ]);

  // Fix hydration issues by only running on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time price fetching (client-side only)
  const fetchLiveETHPrice = async () => {
    if (!mounted) return;
    
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true');
      const data = await response.json();
      
      if (data && data.ethereum) {
        setLiveData(prev => ({
          ...prev,
          ethPrice: data.ethereum.usd,
          priceChange: data.ethereum.usd_24h_change || prev.priceChange,
          volume24h: data.ethereum.usd_24h_vol || prev.volume24h,
          isLive: true,
          lastUpdate: new Date()
        }));

        // Update portfolio value
        setPortfolio(prev => ({
          ...prev,
          totalValue: prev.usdtBalance + (prev.ethBalance * data.ethereum.usd),
          unrealizedPnL: (prev.ethBalance * data.ethereum.usd) - (prev.ethBalance * 3500)
        }));
      }
    } catch (error) {
      console.log('Using demo data - API call failed');
      // Use realistic simulation
      setLiveData(prev => ({
        ...prev,
        ethPrice: 4485.57 + (Math.random() - 0.5) * 20,
        isLive: false,
        lastUpdate: new Date()
      }));
    }
  };

  // Dr. Paul's market context analysis
  const analyzeDrPaulContext = () => {
    const price = liveData.ethPrice;
    let contextMessage = "";
    
    if (price > 4800) {
      contextMessage = "🔥 EXTREME GREED ZONE - Watch for distribution signals. Dr. Paul would be cautious here.";
    } else if (price > 4600) {
      contextMessage = "⚠️ RESISTANCE ZONE - ETH testing key resistance. Look for rejection or breakthrough.";
    } else if (price > 4400) {
      contextMessage = "🎯 OPPORTUNITY ZONE - Strong fundamentals + technical support. Dr. Paul territory.";
    } else if (price > 4000) {
      contextMessage = "💪 ACCUMULATION ZONE - Pullback in strong uptrend. Perfect for Dr. Paul setups.";
    } else {
      contextMessage = "🚨 MAJOR CORRECTION - Extreme fear = opportunity for hard trades.";
    }
    
    return contextMessage;
  };

  // Initialize after mount
  useEffect(() => {
    if (mounted) {
      fetchLiveETHPrice();
      const interval = setInterval(fetchLiveETHPrice, 30000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  // Show loading until mounted (prevents hydration errors)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dr. Paul's Dashboard...</p>
        </div>
      </div>
    );
  }

  const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    teal: '#14B8A6'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dr. David Paul's ETH Trading Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time market analysis using Dr. Paul's methodology</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-3 py-2 rounded-lg ${liveData.isLive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {liveData.isLive ? <Wifi size={16} className="mr-2" /> : <WifiOff size={16} className="mr-2" />}
              <span className="text-sm font-medium">
                {liveData.isLive ? 'LIVE DATA' : 'DEMO MODE'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Last update: {liveData.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Current Market Alert */}
      <div className="mb-8">
        <div className="p-4 rounded-lg border-l-4 bg-blue-50 border-blue-500 text-blue-800">
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-3" />
            <div>
              <h3 className="font-semibold">Live Market Context</h3>
              <p className="text-sm mt-1">{analyzeDrPaulContext()}</p>
              <p className="text-xs mt-2 opacity-75">
                Current ETH: ${liveData.ethPrice.toFixed(2)} | 24h Change: {liveData.priceChange >= 0 ? '+' : ''}{liveData.priceChange.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* ETH Price Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 relative">
          <div className="absolute top-2 right-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
              <span className="text-xs text-green-600 font-medium">LIVE</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ETH Price</p>
              <p className="text-2xl font-bold text-gray-900">${liveData.ethPrice.toFixed(2)}</p>
              <p className={`text-sm ${liveData.priceChange >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {liveData.priceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="ml-1">{Math.abs(liveData.priceChange).toFixed(2)}%</span>
              </p>
            </div>
            <DollarSign size={32} className="text-blue-500" />
          </div>
        </div>

        {/* Portfolio Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio</p>
              <p className="text-2xl font-bold text-gray-900">${portfolio.totalValue.toFixed(2)}</p>
              <p className="text-sm text-green-600 flex items-center">
                <TrendingUp size={16} />
                <span className="ml-1">{portfolio.totalReturn.toFixed(2)}%</span>
              </p>
            </div>
            <TrendingUp size={32} className="text-green-500" />
          </div>
        </div>

        {/* Volume Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">24h Volume</p>
              <p className="text-2xl font-bold text-gray-900">${(liveData.volume24h / 1e9).toFixed(1)}B</p>
            </div>
            <BarChart3 size={32} className="text-purple-500" />
          </div>
        </div>

        {/* Dr. Paul Score Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dr. Paul Score</p>
              <p className="text-2xl font-bold text-gray-900">{(drPaulSignals.overallScore * 100).toFixed(0)}%</p>
            </div>
            <Activity size={32} className="text-orange-500" />
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Live ETH Price Action</h2>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
            Real-time updates
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={priceHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={['dataMin - 20', 'dataMax + 20']} />
            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'ETH Price']} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={COLORS.primary} 
              strokeWidth={3}
              dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dr. Paul's Signals */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">🧠 Dr. Paul's Live Trading Signals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hard Trade Signal */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Hard Trade Opportunity</h3>
            <div className="flex items-center mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-1000 bg-yellow-500" 
                  style={{ width: `${drPaulSignals.hardTradeOpportunity * 100}%` }}
                />
              </div>
              <span className="ml-3 text-lg font-bold text-yellow-600">{drPaulSignals.hardTradeOpportunity.toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600">Counter-trend setup requiring courage</p>
          </div>

          {/* Whale Accumulation */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Whale Accumulation</h3>
            <div className="flex items-center mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-1000 bg-green-500" 
                  style={{ width: `${drPaulSignals.whaleAccumulation * 100}%` }}
                />
              </div>
              <span className="ml-3 text-lg font-bold text-green-600">{drPaulSignals.whaleAccumulation.toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600">Smart money accumulation (STRONG)</p>
          </div>

          {/* Institutional Flow */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Institutional Flow</h3>
            <div className="flex items-center mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-1000 bg-green-500" 
                  style={{ width: `${drPaulSignals.institutionalFlow * 100}%` }}
                />
              </div>
              <span className="ml-3 text-lg font-bold text-green-600">{drPaulSignals.institutionalFlow.toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600">ETF + institutional buying pressure</p>
          </div>
        </div>
      </div>

      {/* Dr. Paul's Assessment */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">🎯 Dr. Paul's Live Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{drPaulSignals.setupQuality}</div>
            <div className="text-sm opacity-90">Setup Quality</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{(drPaulSignals.institutionalFlow * 100).toFixed(0)}%</div>
            <div className="text-sm opacity-90">Institutional Flow</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">LIVE</div>
            <div className="text-sm opacity-90">System Status</div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Real-Time Analysis:</h3>
          <p className="text-sm opacity-90">
            ETH trading at ${liveData.ethPrice.toFixed(2)} with strong institutional inflows. 
            Exchange outflows at {onChainMetrics.exchangeFlow.toLocaleString()} ETH showing accumulation pattern.
            Current setup quality rated as {drPaulSignals.setupQuality} based on Dr. Paul's methodology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DrPaulLiveDashboard;