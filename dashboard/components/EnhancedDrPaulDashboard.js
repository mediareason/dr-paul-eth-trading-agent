// /dashboard/components/EnhancedDrPaulDashboard.js
// Dr. Paul's Trading Dashboard Enhanced with Volume Profile Analysis

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, ComposedChart, Area, AreaChart } from 'recharts';
import { Activity, Target, TrendingUp, TrendingDown, AlertTriangle, Volume2, Eye, Brain, DollarSign, Signal } from 'lucide-react';
import VolumeProfileService from '../lib/volumeProfileService';

const EnhancedDrPaulDashboard = ({ 
  liveData, 
  drPaulSignals, 
  onTradeSignal,
  className = '' 
}) => {
  const [activeView, setActiveView] = useState('OVERVIEW');
  const [volumeProfileSettings, setVolumeProfileSettings] = useState({
    vpvrRange: 50,
    sessionType: '4h',
    showLevels: true,
    autoUpdate: true
  });
  
  const [volumeAnalysis, setVolumeAnalysis] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Calculate volume profile analysis
  useEffect(() => {
    if (liveData && volumeProfileSettings.autoUpdate) {
      const updateVolumeAnalysis = async () => {
        try {
          const analysis = await VolumeProfileService.updateFromLiveData({
            ...liveData,
            drPaulSignals
          });
          
          if (analysis) {
            setVolumeAnalysis(analysis);
            setLastUpdate(Date.now());
          }
        } catch (error) {
          console.error('Volume analysis update failed:', error);
        }
      };

      updateVolumeAnalysis();
      
      // Auto-update every 30 seconds
      const interval = setInterval(updateVolumeAnalysis, 30000);
      return () => clearInterval(interval);
    }
  }, [liveData, drPaulSignals, volumeProfileSettings.autoUpdate]);

  // Prepare enhanced chart data
  const enhancedChartData = useMemo(() => {
    if (!liveData?.historicalData) return [];
    
    const range = volumeProfileSettings.vpvrRange;
    const data = liveData.historicalData.slice(-range);
    
    return data.map((candle, idx) => ({
      time: new Date(candle.timestamp).toLocaleTimeString(),
      timeShort: new Date(candle.timestamp).toLocaleTimeString().slice(0, -3),
      price: candle.close || candle.price,
      open: candle.open || candle.price,
      high: candle.high || candle.price,
      low: candle.low || candle.price,
      volume: candle.volume || 1000000,
      ma9: candle.ma9,
      ma21: candle.ma21,
      ma200: candle.ma200,
      idx
    }));
  }, [liveData, volumeProfileSettings.vpvrRange]);

  // Current market metrics
  const currentPrice = liveData?.currentPrice || 0;
  const priceChange24h = liveData?.priceChange24h || 0;
  const volume24h = liveData?.volume24h || 0;

  // Dr. Paul's enhanced signals with volume context
  const enhancedSignals = useMemo(() => {
    if (!drPaulSignals || !volumeAnalysis) return drPaulSignals;
    
    const enhanced = { ...drPaulSignals };
    
    // Enhance signal quality with volume analysis
    if (volumeAnalysis.signals) {
      enhanced.volumeQuality = volumeAnalysis.signals.levelStrength;
      enhanced.volumeContext = volumeAnalysis.signals.marketContext;
      enhanced.volumeSignals = volumeAnalysis.signals;
      
      // Boost or reduce signal confidence based on volume levels
      if (volumeAnalysis.keyLevels?.poc) {
        const pocDistance = Math.abs(currentPrice - volumeAnalysis.keyLevels.poc.price) / currentPrice * 100;
        if (pocDistance < 1) { // Near POC
          enhanced.signalQuality = Math.min(100, (enhanced.signalQuality || 50) + 20);
        }
      }
    }
    
    return enhanced;
  }, [drPaulSignals, volumeAnalysis, currentPrice]);

  // Combined trade signals (Dr. Paul + Volume Profile)
  const combinedSignals = useMemo(() => {
    const signals = {
      primarySignal: null,
      confidence: 0,
      reasoning: [],
      levels: {
        entry: null,
        target: null,
        stop: null
      }
    };

    // Dr. Paul's primary signal
    if (enhancedSignals?.trend && enhancedSignals?.entrySignal) {
      signals.primarySignal = {
        direction: enhancedSignals.trend,
        type: 'DR_PAUL_SETUP',
        confidence: enhancedSignals.signalQuality || 50
      };
      signals.reasoning.push(`Dr. Paul ${enhancedSignals.trend} setup`);
    }

    // Volume profile enhancement
    if (volumeAnalysis?.signals) {
      const vpSignals = volumeAnalysis.signals;
      
      // High-confidence volume entries
      const highVolumeEntries = vpSignals.entries.filter(e => e.strength === 'HIGH');
      if (highVolumeEntries.length > 0) {
        signals.confidence = Math.min(100, signals.confidence + 25);
        signals.reasoning.push(`${highVolumeEntries.length} high-volume support level(s)`);
        signals.levels.entry = highVolumeEntries[0].level;
        signals.levels.target = highVolumeEntries[0].target;
      }

      // Volume context boost
      if (vpSignals.marketContext?.bias !== 'NEUTRAL') {
        signals.confidence = Math.min(100, signals.confidence + 15);
        signals.reasoning.push(`Volume bias: ${vpSignals.marketContext.bias}`);
      }
    }

    return signals;
  }, [enhancedSignals, volumeAnalysis]);

  const views = [
    { id: 'OVERVIEW', name: 'Overview', icon: Brain },
    { id: 'VOLUME_PROFILE', name: 'Volume Profile', icon: Volume2 },
    { id: 'LEVELS', name: 'Trading Levels', icon: Target },
    { id: 'SIGNALS', name: 'Combined Signals', icon: Signal }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Dr. Paul's Enhanced Trading System
              </h2>
              <p className="text-gray-600">
                Live ETH Analysis with Volume Profile Intelligence
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Current Price Display */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${currentPrice.toFixed(2)}
              </div>
              <div className={`text-sm font-medium ${
                priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </div>
            </div>
            
            {/* Signal Strength Indicator */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Signal Strength</div>
              <div className={`text-xl font-bold ${
                combinedSignals.confidence > 70 ? 'text-green-600' :
                combinedSignals.confidence > 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {combinedSignals.confidence.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mt-4">
          {views.map(view => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === view.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {view.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeView === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">POC</p>
                    <p className="text-xl font-bold text-blue-900">
                      ${volumeAnalysis?.keyLevels?.poc?.price.toFixed(0) || 'N/A'}
                    </p>
                  </div>
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Dr. Paul Score</p>
                    <p className="text-xl font-bold text-green-900">
                      {enhancedSignals?.signalQuality || 0}%
                    </p>
                  </div>
                  <Brain className="w-6 h-6 text-green-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Volume Quality</p>
                    <p className="text-xl font-bold text-purple-900">
                      {volumeAnalysis?.signals?.levelStrength || 0}%
                    </p>
                  </div>
                  <Volume2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">24h Volume</p>
                    <p className="text-xl font-bold text-orange-900">
                      ${(volume24h / 1000000000).toFixed(1)}B
                    </p>
                  </div>
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Enhanced Price Action</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={enhancedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeShort" />
                  <YAxis domain={['dataMin - 50', 'dataMax + 50']} />
                  <Tooltip 
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toFixed(2) : value,
                      name
                    ]}
                  />
                  
                  {/* Volume Profile Key Levels */}
                  {volumeAnalysis?.keyLevels?.poc && (
                    <ReferenceLine 
                      y={volumeAnalysis.keyLevels.poc.price} 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      label={{ value: "POC", position: "right" }}
                    />
                  )}
                  
                  {volumeAnalysis?.keyLevels?.vah && (
                    <ReferenceLine 
                      y={volumeAnalysis.keyLevels.vah.price} 
                      stroke="#10B981" 
                      strokeDasharray="5 5"
                      label={{ value: "VAH", position: "right" }}
                    />
                  )}
                  
                  {volumeAnalysis?.keyLevels?.val && (
                    <ReferenceLine 
                      y={volumeAnalysis.keyLevels.val.price} 
                      stroke="#EF4444" 
                      strokeDasharray="5 5"
                      label={{ value: "VAL", position: "right" }}
                    />
                  )}

                  {/* Moving Averages */}
                  <Line 
                    type="monotone" 
                    dataKey="ma9" 
                    stroke="#F59E0B" 
                    strokeWidth={1}
                    dot={false}
                    name="9 EMA"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ma21" 
                    stroke="#8B5CF6" 
                    strokeWidth={1}
                    dot={false}
                    name="21 MA"
                  />
                  
                  {/* Price Line */}
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#1F2937" 
                    strokeWidth={2}
                    dot={false}
                    name="Price"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Combined Signals Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Combined Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Dr. Paul's Methodology</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trend:</span>
                      <span className={`text-sm font-medium ${
                        enhancedSignals?.trend === 'bullish' ? 'text-green-600' : 
                        enhancedSignals?.trend === 'bearish' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {enhancedSignals?.trend || 'Neutral'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Setup Quality:</span>
                      <span className="text-sm font-medium">
                        {enhancedSignals?.signalQuality || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Entry Signal:</span>
                      <span className={`text-sm font-medium ${
                        enhancedSignals?.entrySignal ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {enhancedSignals?.entrySignal ? 'Active' : 'Waiting'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Volume Profile Context</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Position:</span>
                      <span className="text-sm font-medium">
                        {volumeAnalysis?.signals?.marketContext?.position?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bias:</span>
                      <span className="text-sm font-medium">
                        {volumeAnalysis?.signals?.marketContext?.bias?.replace('_', ' ') || 'Neutral'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Volume Strength:</span>
                      <span className="text-sm font-medium">
                        {volumeAnalysis?.signals?.levelStrength || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'VOLUME_PROFILE' && volumeAnalysis && (
          <div className="space-y-6">
            {/* VPVR Controls */}
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VPVR Range
                </label>
                <select
                  value={volumeProfileSettings.vpvrRange}
                  onChange={(e) => setVolumeProfileSettings(prev => ({
                    ...prev,
                    vpvrRange: Number(e.target.value)
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={25}>25 Candles</option>
                  <option value={50}>50 Candles</option>
                  <option value={100}>100 Candles</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Type
                </label>
                <select
                  value={volumeProfileSettings.sessionType}
                  onChange={(e) => setVolumeProfileSettings(prev => ({
                    ...prev,
                    sessionType: e.target.value
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="4h">4 Hour Sessions</option>
                  <option value="8h">8 Hour Sessions</option>
                  <option value="24h">Daily Sessions</option>
                </select>
              </div>
            </div>

            {/* Volume Profile Visualization */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Volume Profile (VPVR)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={volumeAnalysis.vpvr.levels
                      .sort((a, b) => a.price - b.price)
                      .slice(0, 30)
                      .map(level => ({
                        price: level.price.toFixed(0),
                        volume: level.volume,
                        isPOC: level === volumeAnalysis.vpvr.poc,
                        isVAH: level === volumeAnalysis.vpvr.vah,
                        isVAL: level === volumeAnalysis.vpvr.val
                      }))}
                    layout="verstack"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="volume" type="number" />
                    <YAxis dataKey="price" type="category" />
                    <Tooltip 
                      formatter={(value) => [
                        `${(value / 1000000).toFixed(1)}M`,
                        'Volume'
                      ]}
                    />
                    <Bar dataKey="volume">
                      {volumeAnalysis.vpvr.levels.slice(0, 30).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry === volumeAnalysis.vpvr.poc ? '#3B82F6' :
                            entry === volumeAnalysis.vpvr.vah ? '#10B981' :
                            entry === volumeAnalysis.vpvr.val ? '#EF4444' :
                            '#9CA3AF'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Session Profiles</h3>
                <div className="space-y-3">
                  {volumeAnalysis.sessions.slice(-5).map((session, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          Session {idx + 1}
                        </span>
                        <span className="text-sm text-gray-600">
                          POC: ${session.pocPrice.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Strength: {session.sessionStrength.toFixed(0)}%</span>
                        <span>Volume: {(session.profile.totalVolume / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-600 rounded-full transition-all"
                          style={{ width: `${Math.min(100, session.sessionStrength)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'LEVELS' && volumeAnalysis && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Key Trading Levels</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Support Levels */}
              <div>
                <h4 className="font-medium text-green-700 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Support Levels
                </h4>
                {volumeAnalysis.keyLevels.support.length > 0 ? (
                  <div className="space-y-2">
                    {volumeAnalysis.keyLevels.support.map((level, idx) => (
                      <div key={idx} className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-green-900">
                            ${level.price.toFixed(2)}
                          </span>
                          <div className="text-right">
                            <div className="text-sm text-green-600">
                              Volume: {(level.volume / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-green-500">
                              {((currentPrice - level.price) / currentPrice * 100).toFixed(1)}% below
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No significant support levels detected</p>
                )}
              </div>

              {/* Resistance Levels */}
              <div>
                <h4 className="font-medium text-red-700 mb-3 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Resistance Levels
                </h4>
                {volumeAnalysis.keyLevels.resistance.length > 0 ? (
                  <div className="space-y-2">
                    {volumeAnalysis.keyLevels.resistance.map((level, idx) => (
                      <div key={idx} className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-red-900">
                            ${level.price.toFixed(2)}
                          </span>
                          <div className="text-right">
                            <div className="text-sm text-red-600">
                              Volume: {(level.volume / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-red-500">
                              {((level.price - currentPrice) / currentPrice * 100).toFixed(1)}% above
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No significant resistance levels detected</p>
                )}
              </div>
            </div>

            {/* Volume Gaps (Low Volume Nodes) */}
            <div>
              <h4 className="font-medium text-orange-700 mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Volume Gaps (Breakout Zones)
              </h4>
              {volumeAnalysis.keyLevels.lvns.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {volumeAnalysis.keyLevels.lvns.slice(0, 3).map((level, idx) => (
                    <div key={idx} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="text-center">
                        <div className="font-bold text-orange-900">
                          ${level.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-orange-600">
                          Low Volume Zone
                        </div>
                        <div className="text-xs text-orange-500">
                          Potential breakout area
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No significant volume gaps detected</p>
              )}
            </div>
          </div>
        )}

        {activeView === 'SIGNALS' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Combined Trading Signals</h3>
            
            {/* Primary Signal */}
            {combinedSignals.primarySignal && (
              <div className={`p-4 rounded-lg border-2 ${
                combinedSignals.primarySignal.direction === 'bullish' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold">
                    Primary Signal: {combinedSignals.primarySignal.direction.toUpperCase()}
                  </h4>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    combinedSignals.confidence > 70 ? 'bg-green-200 text-green-800' :
                    combinedSignals.confidence > 40 ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {combinedSignals.confidence.toFixed(0)}% Confidence
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  {combinedSignals.levels.entry && (
                    <div>
                      <div className="text-sm text-gray-600">Entry Level</div>
                      <div className="font-bold">${combinedSignals.levels.entry.toFixed(2)}</div>
                    </div>
                  )}
                  {combinedSignals.levels.target && (
                    <div>
                      <div className="text-sm text-gray-600">Target</div>
                      <div className="font-bold">${combinedSignals.levels.target.toFixed(2)}</div>
                    </div>
                  )}
                  {combinedSignals.levels.stop && (
                    <div>
                      <div className="text-sm text-gray-600">Stop Loss</div>
                      <div className="font-bold">${combinedSignals.levels.stop.toFixed(2)}</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Reasoning:</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {combinedSignals.reasoning.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Volume Profile Signals */}
            {volumeAnalysis?.signals && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Entry Signals */}
                <div>
                  <h4 className="font-medium text-green-700 mb-3">Volume Entry Signals</h4>
                  {volumeAnalysis.signals.entries.length > 0 ? (
                    <div className="space-y-2">
                      {volumeAnalysis.signals.entries.map((signal, idx) => (
                        <div key={idx} className="bg-green-50 p-3 rounded border border-green-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">${signal.level.toFixed(2)}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              signal.strength === 'HIGH' 
                                ? 'bg-green-200 text-green-800'
                                : 'bg-yellow-200 text-yellow-800'
                            }`}>
                              {signal.strength}
                            </span>
                          </div>
                          <p className="text-sm text-green-700">{signal.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No volume entry signals</p>
                  )}
                </div>

                {/* Exit Signals */}
                <div>
                  <h4 className="font-medium text-red-700 mb-3">Volume Exit Signals</h4>
                  {volumeAnalysis.signals.exits.length > 0 ? (
                    <div className="space-y-2">
                      {volumeAnalysis.signals.exits.map((signal, idx) => (
                        <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">${signal.level.toFixed(2)}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              signal.strength === 'HIGH' 
                                ? 'bg-red-200 text-red-800'
                                : 'bg-yellow-200 text-yellow-800'
                            }`}>
                              {signal.strength}
                            </span>
                          </div>
                          <p className="text-sm text-red-700">{signal.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No volume exit signals</p>
                  )}
                </div>
              </div>
            )}

            {/* Trade Button */}
            {combinedSignals.primarySignal && combinedSignals.confidence > 50 && onTradeSignal && (
              <div className="text-center">
                <button
                  onClick={() => onTradeSignal(combinedSignals)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    combinedSignals.primarySignal.direction === 'bullish'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  Execute {combinedSignals.primarySignal.direction.toUpperCase()} Trade
                  ({combinedSignals.confidence.toFixed(0)}% confidence)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            Last Updated: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                volumeProfileSettings.autoUpdate ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              Auto-Update: {volumeProfileSettings.autoUpdate ? 'ON' : 'OFF'}
            </div>
            <div>
              Range: {volumeProfileSettings.vpvrRange} candles
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDrPaulDashboard;