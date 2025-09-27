import React, { useState } from 'react';
import DrPaulLiveDashboard from '../components/DrPaulDashboard';
import EnhancedDrPaulDashboard from '../components/EnhancedDrPaulDashboard';
import EnhancedDrPaulWithLevels from '../components/EnhancedDrPaulWithLevels';
import InteractiveBacktester from '../components/InteractiveBacktester';
import ScalpingTracker from '../components/ScalpingTracker';
import { BarChart3, TestTube, Activity, Brain, Zap, Volume2, TrendingUp, Layers } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('levels');

  const tabs = [
    {
      id: 'levels',
      name: 'Level Analysis',
      icon: Layers,
      description: 'Next 2 levels up/down with probabilities • Volume profile bars • Fixed live data',
      badge: 'NEW'
    },
    {
      id: 'enhanced',
      name: 'Enhanced Analysis',
      icon: Volume2,
      description: 'Dr. Paul\'s methodology enhanced with Volume Profile, POC, and level-to-level signals',
      badge: null
    },
    {
      id: 'live',
      name: 'Live Trading',
      icon: Activity,
      description: 'Real-time ETH trading with Dr. Paul\'s signals'
    },
    {
      id: 'backtest',
      name: 'Interactive Backtest',
      icon: TestTube,
      description: 'Step-by-step visualization of trading strategy'
    },
    {
      id: 'scalping',
      name: 'Scalping Tracker',
      icon: Zap,
      description: 'Fast scalping signals with 9 EMA, 21 MA & 200 MA crossovers'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Dr. Paul's ETH Trading System
                </h1>
                <p className="text-xs text-gray-500">Enhanced with Level Analysis & Volume Profile Intelligence</p>
              </div>
            </div>
            
            {/* System Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Data Active
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">ETH/USDT</div>
                <div className="text-xs text-gray-500">Real-time Analysis</div>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-t border-gray-100 pt-4 pb-4">
            <nav className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                    {tab.badge && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            
            {/* Tab Description */}
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Tab Content */}
          {activeTab === 'levels' && (
            <div className="space-y-6">
              {/* Quick Stats Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Enhanced Level Analysis</h2>
                    <p className="text-blue-100">
                      Real-time support/resistance calculation with probability analysis and volume profile visualization.
                      Fixed data feed ensures accurate ETH prices without fallback to mock data.
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-blue-200">Analysis Type</div>
                      <div className="font-bold">Level-to-Level + Volume Profile</div>
                    </div>
                    <Layers className="w-12 h-12 text-blue-200" />
                  </div>
                </div>
              </div>
              
              {/* Enhanced Dashboard with Levels */}
              <EnhancedDrPaulWithLevels 
                className="shadow-xl"
                onTradeSignal={(signal) => {
                  console.log('🎯 Level Analysis Signal:', signal);
                  // Handle trade signal execution here
                }}
              />
            </div>
          )}
          
          {activeTab === 'enhanced' && (
            <div className="space-y-6">
              {/* Quick Stats Header */}
              <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Enhanced Volume Profile Analysis</h2>
                    <p className="text-green-100">
                      Institutional-grade trading intelligence combining Dr. Paul's methodology with Volume Profile, 
                      Point of Control (POC), and level-to-level entry/exit signals.
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-green-200">Analysis Type</div>
                      <div className="font-bold">VPVR + Session Profiles</div>
                    </div>
                    <Volume2 className="w-12 h-12 text-green-200" />
                  </div>
                </div>
              </div>
              
              {/* Enhanced Dashboard */}
              <EnhancedDrPaulDashboard 
                className="shadow-xl"
                onTradeSignal={(signal) => {
                  console.log('🎯 Trade Signal Generated:', signal);
                  // Handle trade signal execution here
                }}
              />
            </div>
          )}
          
          {activeTab === 'live' && (
            <div className="space-y-6">
              {/* Original Dashboard Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Dr. Paul's Live Trading Dashboard</h2>
                    <p className="text-orange-100">
                      Real-time ETH analysis using Dr. Paul's counter-trend methodology with whale accumulation tracking.
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-orange-200">Analysis Type</div>
                      <div className="font-bold">Counter-Trend + Whale Tracking</div>
                    </div>
                    <TrendingUp className="w-12 h-12 text-orange-200" />
                  </div>
                </div>
              </div>
              
              <DrPaulLiveDashboard />
            </div>
          )}
          
          {activeTab === 'backtest' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Interactive Strategy Backtester</h2>
                    <p className="text-purple-100">
                      Step-by-step visualization and testing of Dr. Paul's trading methodology with historical data.
                    </p>
                  </div>
                  <TestTube className="w-12 h-12 text-purple-200" />
                </div>
              </div>
              
              <InteractiveBacktester />
            </div>
          )}
          
          {activeTab === 'scalping' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">High-Frequency Scalping Tracker</h2>
                    <p className="text-yellow-100">
                      Fast-paced scalping signals using moving average crossovers and momentum indicators.
                    </p>
                  </div>
                  <Zap className="w-12 h-12 text-yellow-200" />
                </div>
              </div>
              
              <ScalpingTracker />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">
                Dr. Paul's Enhanced Trading System v3.0
              </span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Data: CoinGecko API (Fixed)
              </div>
              <div className="flex items-center">
                <Layers className="w-4 h-4 mr-1" />
                Level Analysis: Active
              </div>
              <div className="flex items-center">
                <Volume2 className="w-4 h-4 mr-1" />
                Volume Profile: Active
              </div>
              <div>
                Updates: Real-time
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}