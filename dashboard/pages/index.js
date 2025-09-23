import React, { useState } from 'react';
import DrPaulLiveDashboard from '../components/DrPaulDashboard';
import InteractiveBacktester from '../components/InteractiveBacktester';
import ScalpingTracker from '../components/ScalpingTracker';
import { BarChart3, TestTube, Activity, Brain, Zap } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('live');

  const tabs = [
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
              <h1 className="text-xl font-bold text-gray-900">
                Dr. Paul's ETH Trading System
              </h1>
            </div>
            
            {/* Tab Navigation */}
            <nav className="flex space-x-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="pb-4">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'live' && <DrPaulLiveDashboard />}
        {activeTab === 'backtest' && <InteractiveBacktester />}
        {activeTab === 'scalping' && <ScalpingTracker />}
      </div>
    </div>
  );
}