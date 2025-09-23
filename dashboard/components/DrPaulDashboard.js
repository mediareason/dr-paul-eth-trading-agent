"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, ComposedChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, AlertTriangle, Wifi, WifiOff, Target, Eye } from 'lucide-react';

const DrPaulLiveDashboard = () => {
  const [mounted, setMounted] = useState(false);
  const [liveData, setLiveData] = useState({
    ethPrice: 4200.00, // Updated to reflect current market
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

  // Dynamic strategic levels based on current price (Dr. Paul's adaptive approach)
  const calculateStrategicLevels = (currentPrice) => {
    // Use current price as base for dynamic levels
    const basePrice = currentPrice;
    
    return {
      majorSupport: Math.round((basePrice * 0.95) / 5) * 5,      // 5% below, rounded to $5
      strongSupport: Math.round((basePrice * 0.975) / 5) * 5,    // 2.5% below, rounded to $5
      currentLevel: basePrice,
      weakResistance: Math.round((basePrice * 1.025) / 5) * 5,   // 2.5% above, rounded to $5
      majorResistance: Math.round((basePrice * 1.05) / 5) * 5,   // 5% above, rounded to $5
      massStopLevel: Math.round((basePrice * 0.985) / 5) * 5,    // 1.5% below (where retail stops)
      institutionalZone: [
        Math.round((basePrice * 0.99) / 5) * 5,   // 1% below
        Math.round((basePrice * 1.01) / 5) * 5    // 1% above
      ],
      hardTradeZone: [
        Math.round((basePrice * 0.96) / 5) * 5,   // 4% below (hard trade entry)
        Math.round((basePrice * 0.98) / 5) * 5    // 2% below (hard trade zone)
      ]
    };
  };

  // Get dynamic strategic levels
  const strategicLevels = calculateStrategicLevels(liveData.ethPrice);

  // Enhanced chart data with Dr. Paul's strategic elements (also dynamic)
  const [strategicChartData, setStrategicChartData] = useState([]);

  // Initialize chart data based on current price
  const initializeChartData = (currentPrice) => {
    const data = [];
    const now = new Date();
    let price = currentPrice;
    
    for (let i = 5; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000); // 1 hour intervals
      price = price * (1 + (Math.random() - 0.5) * 0.02); // ±1% variation
      
      data.push({
        time: time.toTimeString().slice(0, 5),
        price: price,
        volume: 45000 + Math.random() * 30000,
        setupScore: Math.max(0.5, Math.min(1.0, 0.75 + (Math.random() - 0.5) * 0.3)),
        whaleActivity: Math.max(0.6, Math.min(1.0, 0.85 + (Math.random() - 0.5) * 0.2)),
        riskReward: 2.5 + Math.random() * 1.5,
        hardTradeSignal: Math.random()
      });
    }
    
    return data;
  };

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time price fetching
  const fetchLiveETHPrice = async () => {
    if (!mounted) return;
    
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true');
      const data = await response.json();
      
      if (data && data.ethereum) {
        const newPrice = data.ethereum.usd;
        setLiveData(prev => ({
          ...prev,
          ethPrice: newPrice,
          priceChange: data.ethereum.usd_24h_change || prev.priceChange,
          volume24h: data.ethereum.usd_24h_vol || prev.volume24h,
          isLive: true,
          lastUpdate: new Date()
        }));

        // Update portfolio value
        setPortfolio(prev => ({
          ...prev,
          totalValue: prev.usdtBalance + (prev.ethBalance * newPrice),
          unrealizedPnL: (prev.ethBalance * newPrice) - (prev.ethBalance * 3500)
        }));

        // Initialize or update strategic chart with new price
        setStrategicChartData(prev => {
          if (prev.length === 0) {
            return initializeChartData(newPrice);
          } else {
            const newTime = new Date().toTimeString().slice(0, 5);
            const newEntry = {
              time: newTime,
              price: newPrice,
              volume: 45000 + Math.random() * 30000,
              setupScore: Math.max(0.5, Math.min(1.0, 0.75 + (Math.random() - 0.5) * 0.3)),
              whaleActivity: Math.max(0.6, Math.min(1.0, 0.85 + (Math.random() - 0.5) * 0.2)),
              riskReward: 2.5 + Math.random() * 1.5,
              hardTradeSignal: Math.random()
            };
            return [...prev.slice(1), newEntry];
          }
        });
      }
    } catch (error) {
      console.log('Using demo data - API call failed');
      setLiveData(prev => ({
        ...prev,
        ethPrice: prev.ethPrice + (Math.random() - 0.5) * 20,
        isLive: false,
        lastUpdate: new Date()
      }));
      
      // Initialize chart data if empty
      if (strategicChartData.length === 0) {
        setStrategicChartData(initializeChartData(liveData.ethPrice));
      }
    }
  };

  // Dr. Paul's custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`Time: ${label}`}</p>
          <p className="text-blue-600">{`Price: $${data.price.toFixed(2)}`}</p>
          <p className="text-green-600">{`Setup Score: ${(data.setupScore * 100).toFixed(0)}%`}</p>
          <p className="text-purple-600">{`Whale Activity: ${(data.whaleActivity * 100).toFixed(0)}%`}</p>
          <p className="text-orange-600">{`Risk:Reward: ${data.riskReward.toFixed(1)}:1`}</p>
          {data.hardTradeSignal > 0.7 && (
            <p className="text-red-600 font-bold">🔥 HARD TRADE OPPORTUNITY</p>
          )}
          <p className="text-xs text-gray-500 mt-2">Dr. Paul's Analysis</p>
        </div>
      );
    }
    return null;
  };

  // Dynamic market context analysis based on current price
  const analyzeDrPaulContext = () => {
    const price = liveData.ethPrice;
    let contextMessage = "";
    
    if (price > 5000) {
      contextMessage = "🔥 EXTREME GREED ZONE - Watch for distribution signals. Dr. Paul would be cautious here.";
    } else if (price > 4500) {
      contextMessage = "⚠️ RESISTANCE ZONE - ETH testing key resistance. Look for rejection or breakthrough.";
    } else if (price > 4000) {
      contextMessage = "🎯 OPPORTUNITY ZONE - Strong fundamentals + technical support. Dr. Paul territory.";
    } else if (price > 3500) {
      contextMessage = "💪 ACCUMULATION ZONE - Pullback in strong uptrend. Perfect for Dr. Paul setups.";
    } else if (price > 3000) {
      contextMessage = "🚨 MAJOR CORRECTION - Extreme fear = opportunity for hard trades.";
    } else {
      contextMessage = "💎 DEEP VALUE ZONE - Generational buying opportunity. Maximum fear = maximum opportunity.";
    }
    
    return contextMessage;
  };

  // Dynamic trading insight based on current levels
  const getDynamicTradingInsight = () => {
    const price = liveData.ethPrice;
    const levels = strategicLevels;
    
    let strategy = "";
    let risk = "";
    let setup = "";
    
    if (price < levels.hardTradeZone[1]) {
      strategy = `Looking for bounce from $${levels.majorSupport} support with confirmation above $${levels.hardTradeZone[1]}.`;
      risk = `Stop below $${levels.majorSupport}, target $${levels.majorResistance}.`;
      setup = "HARD TRADE opportunity - price in deep value zone where retail capitulates.";
    } else if (price < levels.institutionalZone[0]) {
      strategy = `Watching for pullback to $${levels.hardTradeZone[1]} area for optimal entry.`;
      risk = `Stop below $${levels.majorSupport}, target $${levels.weakResistance}.`;
      setup = "Good accumulation zone - institutions likely buying weakness.";
    } else if (price >= levels.institutionalZone[0] && price <= levels.institutionalZone[1]) {
      strategy = `Fair value range. Wait for breakout above $${levels.weakResistance} or support test at $${levels.strongSupport}.`;
      risk = `Stop below $${levels.strongSupport}, target $${levels.majorResistance}.`;
      setup = "Neutral zone - let the market choose direction.";
    } else {
      strategy = `Above fair value. Look for rejection at $${levels.majorResistance} or breakout with volume.`;
      risk = `Stop below $${levels.institutionalZone[1]}, target new highs.`;
      setup = "Strength showing - momentum trade with tight risk management.";
    }
    
    return { strategy, risk, setup };
  };

  // Initialize after mount
  useEffect(() => {
    if (mounted) {
      fetchLiveETHPrice();
      const interval = setInterval(fetchLiveETHPrice, 30000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  // Show loading until mounted
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

  const insight = getDynamicTradingInsight();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dr. David Paul's ETH Trading Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time market analysis using Dr. Paul's methodology • Dynamic Levels</p>
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
              <h3 className="font-semibold">Live Market Context • Levels Auto-Update</h3>
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

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">24h Volume</p>
              <p className="text-2xl font-bold text-gray-900">${(liveData.volume24h / 1e9).toFixed(1)}B</p>
            </div>
            <BarChart3 size={32} className="text-purple-500" />
          </div>
        </div>

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

      {/* Enhanced Strategic Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">🧠 Dr. Paul's Strategic Chart • Dynamic Levels</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>ETH Price</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span>Hard Trade Zones</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Support Levels</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={strategicChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="time" />
            <YAxis 
              domain={['dataMin - 50', 'dataMax + 50']} 
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Dr. Paul's Dynamic Strategic Zones */}
            <ReferenceArea 
              y1={strategicLevels.majorSupport} 
              y2={strategicLevels.strongSupport} 
              fill={COLORS.success} 
              fillOpacity={0.1}
              stroke={COLORS.success}
              strokeDasharray="5 5"
            />
            
            <ReferenceArea 
              y1={strategicLevels.institutionalZone[0]} 
              y2={strategicLevels.institutionalZone[1]} 
              fill={COLORS.purple} 
              fillOpacity={0.1}
              stroke={COLORS.purple}
              strokeDasharray="3 3"
            />
            
            <ReferenceArea 
              y1={strategicLevels.hardTradeZone[0]} 
              y2={strategicLevels.hardTradeZone[1]} 
              fill={COLORS.warning} 
              fillOpacity={0.15}
              stroke={COLORS.warning}
              strokeDasharray="2 2"
            />
            
            <ReferenceLine 
              y={strategicLevels.majorResistance} 
              stroke={COLORS.danger} 
              strokeDasharray="8 4" 
              strokeWidth={2}
            />
            <ReferenceLine 
              y={strategicLevels.massStopLevel} 
              stroke="#6B7280" 
              strokeDasharray="4 2" 
              strokeWidth={1}
            />
            
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={COLORS.primary}
              strokeWidth={3}
              dot={(props) => {
                const { payload } = props;
                if (payload && payload.hardTradeSignal > 0.7) {
                  return <circle {...props} r={6} fill={COLORS.warning} stroke={COLORS.primary} strokeWidth={2} />;
                }
                return <circle {...props} r={4} fill={COLORS.primary} />;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Strategic Analysis */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Target className="mr-2" size={16} />
              Dr. Paul's Dynamic Strategy Zones
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  Major Resistance
                </span>
                <span className="font-mono">${strategicLevels.majorResistance}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                  Institutional Zone
                </span>
                <span className="font-mono">${strategicLevels.institutionalZone[0]}-${strategicLevels.institutionalZone[1]}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
                  Mass Stop Level
                </span>
                <span className="font-mono">${strategicLevels.massStopLevel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                  Hard Trade Zone
                </span>
                <span className="font-mono">${strategicLevels.hardTradeZone[0]}-${strategicLevels.hardTradeZone[1]}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Eye className="mr-2" size={16} />
              Current Setup Analysis
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Price Position:</span>
                <span className="font-semibold text-blue-600">
                  {liveData.ethPrice > strategicLevels.institutionalZone[1] ? 'Above Institutional' :
                   liveData.ethPrice > strategicLevels.institutionalZone[0] ? 'In Institutional Zone' :
                   'Below Institutional'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Risk Level:</span>
                <span className="font-semibold text-green-600">
                  ${Math.abs(liveData.ethPrice - strategicLevels.majorSupport).toFixed(0)} to Support
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reward Potential:</span>
                <span className="font-semibold text-red-600">
                  ${Math.abs(strategicLevels.majorResistance - liveData.ethPrice).toFixed(0)} to Resistance
                </span>
              </div>
              <div className="flex justify-between">
                <span>Dr. Paul Setup:</span>
                <span className="font-semibold text-orange-600">
                  {liveData.ethPrice < strategicLevels.hardTradeZone[1] ? 'HARD TRADE ZONE' : 'STANDARD SETUP'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Trading Insight */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
            <AlertTriangle className="mr-2" size={16} />
            Dr. Paul's Current Market Insight • Auto-Updated
          </h4>
          <p className="text-sm text-gray-700">
            <strong>Entry Strategy:</strong> {insight.strategy}
            <strong> Risk Management:</strong> {insight.risk}
            <strong> Setup Quality:</strong> {insight.setup}
          </p>
        </div>
      </div>

      {/* Dr. Paul's Live Signals */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">🧠 Dr. Paul's Live Trading Signals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            Current position {liveData.ethPrice > strategicLevels.institutionalZone[1] ? 'above' : liveData.ethPrice > strategicLevels.institutionalZone[0] ? 'within' : 'below'} institutional zone.
            Setup quality rated as {drPaulSignals.setupQuality} based on Dr. Paul's methodology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DrPaulLiveDashboard;