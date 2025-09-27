// /dashboard/lib/volumeProfileService.js
// Volume Profile & POC Analysis Service for Dr. Paul's Trading System

class VolumeProfileService {
  constructor() {
    this.cache = new Map();
    this.updateInterval = 30000; // 30 seconds
  }

  /**
   * Calculate Volume Profile Visible Range (VPVR)
   */
  calculateVPVR(candleData, range = 50) {
    const cacheKey = `vpvr_${range}_${candleData.length}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.updateInterval) {
        return cached.data;
      }
    }

    const visibleData = candleData.slice(-range);
    const profile = this._calculateVolumeProfile(visibleData);
    
    this.cache.set(cacheKey, {
      data: profile,
      timestamp: Date.now()
    });

    return profile;
  }

  /**
   * Calculate Session Volume Profiles
   */
  calculateSessionProfiles(candleData, sessionLength = 4) {
    const sessions = [];
    
    for (let i = 0; i < candleData.length; i += sessionLength) {
      const sessionData = candleData.slice(i, i + sessionLength);
      if (sessionData.length >= sessionLength / 2) { // At least half session
        const profile = this._calculateVolumeProfile(sessionData);
        sessions.push({
          startTime: sessionData[0].timestamp,
          endTime: sessionData[sessionData.length - 1].timestamp,
          profile,
          sessionStrength: this._calculateSessionStrength(profile),
          pocPrice: profile.poc?.price || 0,
          valueAreaRange: profile.vah && profile.val ? 
            profile.vah.price - profile.val.price : 0
        });
      }
    }

    return sessions.slice(-10); // Return last 10 sessions
  }

  /**
   * Generate Level-to-Level Trading Signals
   */
  generateLevelSignals(volumeProfile, currentPrice, drPaulSignals = {}) {
    const signals = {
      entries: [],
      exits: [],
      alerts: [],
      levelStrength: 0,
      marketContext: this._analyzeMarketContext(volumeProfile, currentPrice)
    };

    // POC-based signals
    this._addPOCSignals(signals, volumeProfile, currentPrice);
    
    // Value Area signals
    this._addValueAreaSignals(signals, volumeProfile, currentPrice);
    
    // Support/Resistance signals
    this._addSupportResistanceSignals(signals, volumeProfile, currentPrice);
    
    // Volume Gap signals (LVNs)
    this._addVolumeGapSignals(signals, volumeProfile, currentPrice);

    // Integrate with Dr. Paul's methodology
    this._integrateDrPaulSignals(signals, drPaulSignals, volumeProfile, currentPrice);

    // Calculate overall signal strength
    signals.levelStrength = this._calculateSignalStrength(signals);

    return signals;
  }

  /**
   * Get Key Price Levels for UI
   */
  getKeyLevels(volumeProfile, currentPrice) {
    const levels = {
      poc: volumeProfile.poc,
      vah: volumeProfile.vah,
      val: volumeProfile.val,
      hvns: [], // High Volume Nodes
      lvns: [], // Low Volume Nodes
      support: [],
      resistance: []
    };

    // Sort levels by volume
    const sortedLevels = [...volumeProfile.levels].sort((a, b) => b.volume - a.volume);
    
    // Top 20% volume levels = HVNs
    const hvnThreshold = sortedLevels[Math.floor(sortedLevels.length * 0.2)]?.volume || 0;
    levels.hvns = volumeProfile.levels
      .filter(level => level.volume >= hvnThreshold)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    // Bottom 30% volume levels = LVNs (potential breakout zones)
    const lvnThreshold = sortedLevels[Math.floor(sortedLevels.length * 0.7)]?.volume || 0;
    levels.lvns = volumeProfile.levels
      .filter(level => level.volume <= lvnThreshold && level.volume > 0)
      .sort((a, b) => a.volume - b.volume)
      .slice(0, 3);

    // Support levels (HVNs below current price)
    levels.support = levels.hvns
      .filter(level => level.price < currentPrice)
      .sort((a, b) => b.price - a.price) // Closest first
      .slice(0, 3);

    // Resistance levels (HVNs above current price)
    levels.resistance = levels.hvns
      .filter(level => level.price > currentPrice)
      .sort((a, b) => a.price - b.price) // Closest first
      .slice(0, 3);

    return levels;
  }

  /**
   * Private Methods
   */
  _calculateVolumeProfile(candleData) {
    if (!candleData || candleData.length === 0) {
      return { levels: [], poc: null, vah: null, val: null, totalVolume: 0 };
    }

    const priceRange = {
      min: Math.min(...candleData.map(d => d.low || d.price)),
      max: Math.max(...candleData.map(d => d.high || d.price))
    };

    // Create price levels (adjust granularity based on price range)
    const priceSpread = priceRange.max - priceRange.min;
    const numLevels = Math.min(200, Math.max(50, Math.floor(priceSpread / 2))); // Adaptive levels
    const levelSize = priceSpread / numLevels;
    
    const levels = Array.from({ length: numLevels }, (_, i) => ({
      price: priceRange.min + (i * levelSize),
      priceEnd: priceRange.min + ((i + 1) * levelSize),
      volume: 0,
      trades: 0,
      timeSpent: 0
    }));

    // Distribute volume across price levels
    candleData.forEach((candle, idx) => {
      const candleVolume = candle.volume || 1000000; // Default volume if missing
      const ohlc = {
        open: candle.open || candle.price,
        high: candle.high || candle.price,
        low: candle.low || candle.price,
        close: candle.close || candle.price
      };

      // Volume distribution based on OHLC
      const volumeDistribution = this._distributeVolumeOHLC(ohlc, candleVolume, levels, levelSize, priceRange.min);
      
      volumeDistribution.forEach((vol, levelIdx) => {
        if (levelIdx < levels.length) {
          levels[levelIdx].volume += vol;
          levels[levelIdx].trades += vol > 0 ? 1 : 0;
          levels[levelIdx].timeSpent += 1;
        }
      });
    });

    // Filter significant levels
    const totalVolume = levels.reduce((sum, level) => sum + level.volume, 0);
    const significantLevels = levels.filter(level => level.volume > totalVolume * 0.001); // 0.1% threshold

    // Find POC (Point of Control)
    const poc = significantLevels.reduce((max, level) => 
      level.volume > max.volume ? level : max, significantLevels[0] || null
    );

    // Calculate Value Area (70% of volume)
    const valueArea = this._calculateValueArea(significantLevels, totalVolume * 0.7, poc);

    return {
      levels: significantLevels,
      poc,
      vah: valueArea.high,
      val: valueArea.low,
      totalVolume,
      valueAreaVolume: totalVolume * 0.7
    };
  }

  _distributeVolumeOHLC(ohlc, volume, levels, levelSize, minPrice) {
    const distribution = new Array(levels.length).fill(0);
    
    // Simple uniform distribution across OHLC range
    const low = ohlc.low;
    const high = ohlc.high;
    const startLevel = Math.floor((low - minPrice) / levelSize);
    const endLevel = Math.floor((high - minPrice) / levelSize);
    
    const levelsInRange = Math.max(1, endLevel - startLevel + 1);
    const volumePerLevel = volume / levelsInRange;
    
    for (let i = Math.max(0, startLevel); i <= Math.min(levels.length - 1, endLevel); i++) {
      distribution[i] = volumePerLevel;
    }
    
    return distribution;
  }

  _calculateValueArea(levels, targetVolume, poc) {
    if (!poc || levels.length === 0) return { high: null, low: null };

    const sortedByPrice = [...levels].sort((a, b) => a.price - b.price);
    let accumulatedVolume = poc.volume;
    let lowIdx = sortedByPrice.findIndex(level => level === poc);
    let highIdx = lowIdx;

    // Expand around POC until we reach 70% of volume
    while (accumulatedVolume < targetVolume && (lowIdx > 0 || highIdx < sortedByPrice.length - 1)) {
      const canExpandLow = lowIdx > 0;
      const canExpandHigh = highIdx < sortedByPrice.length - 1;
      
      let expandLow = false;
      
      if (canExpandLow && canExpandHigh) {
        // Expand towards higher volume
        expandLow = sortedByPrice[lowIdx - 1].volume >= sortedByPrice[highIdx + 1].volume;
      } else {
        expandLow = canExpandLow;
      }
      
      if (expandLow) {
        lowIdx--;
        accumulatedVolume += sortedByPrice[lowIdx].volume;
      } else if (canExpandHigh) {
        highIdx++;
        accumulatedVolume += sortedByPrice[highIdx].volume;
      }
    }

    return {
      high: sortedByPrice[highIdx],
      low: sortedByPrice[lowIdx]
    };
  }

  _calculateSessionStrength(profile) {
    if (!profile.poc) return 0;
    
    const volumeConcentration = profile.poc.volume / profile.totalVolume;
    const valueAreaRatio = profile.vah && profile.val ? 
      (profile.vah.price - profile.val.price) / profile.poc.price : 0.1;
    
    return Math.min(100, (volumeConcentration * 100) + ((1 - valueAreaRatio) * 50));
  }

  _analyzeMarketContext(volumeProfile, currentPrice) {
    const context = {
      position: 'UNKNOWN',
      bias: 'NEUTRAL',
      volatility: 'NORMAL'
    };

    if (volumeProfile.vah && volumeProfile.val && volumeProfile.poc) {
      // Determine price position relative to value area
      if (currentPrice > volumeProfile.vah.price) {
        context.position = 'ABOVE_VALUE_AREA';
        context.bias = 'BEARISH_PULLBACK_EXPECTED';
      } else if (currentPrice < volumeProfile.val.price) {
        context.position = 'BELOW_VALUE_AREA';
        context.bias = 'BULLISH_BOUNCE_EXPECTED';
      } else {
        context.position = 'WITHIN_VALUE_AREA';
        context.bias = 'RANGE_BOUND';
      }

      // Volatility assessment
      const valueAreaWidth = (volumeProfile.vah.price - volumeProfile.val.price) / volumeProfile.poc.price;
      if (valueAreaWidth > 0.05) {
        context.volatility = 'HIGH';
      } else if (valueAreaWidth < 0.02) {
        context.volatility = 'LOW';
      }
    }

    return context;
  }

  _addPOCSignals(signals, volumeProfile, currentPrice) {
    if (!volumeProfile.poc) return;

    const pocDistance = Math.abs(currentPrice - volumeProfile.poc.price);
    const pocDistancePercent = (pocDistance / currentPrice) * 100;

    if (pocDistancePercent < 1) { // Within 1% of POC
      signals.alerts.push({
        type: 'POC_PROXIMITY',
        level: volumeProfile.poc.price,
        message: `Price near POC at $${volumeProfile.poc.price.toFixed(2)}`,
        strength: 'HIGH',
        action: 'WATCH_FOR_REACTION'
      });
    }

    // POC break signals
    if (currentPrice > volumeProfile.poc.price) {
      signals.entries.push({
        type: 'POC_BREAK_BULLISH',
        level: volumeProfile.poc.price,
        target: volumeProfile.vah?.price,
        stop: volumeProfile.poc.price * 0.99,
        strength: 'MEDIUM',
        message: 'Bullish break above POC'
      });
    } else {
      signals.entries.push({
        type: 'POC_BREAK_BEARISH',
        level: volumeProfile.poc.price,
        target: volumeProfile.val?.price,
        stop: volumeProfile.poc.price * 1.01,
        strength: 'MEDIUM',
        message: 'Bearish break below POC'
      });
    }
  }

  _addValueAreaSignals(signals, volumeProfile, currentPrice) {
    if (!volumeProfile.vah || !volumeProfile.val) return;

    // Value Area High signals
    const vahDistance = (volumeProfile.vah.price - currentPrice) / currentPrice * 100;
    if (vahDistance > 0 && vahDistance < 2) {
      signals.exits.push({
        type: 'VAH_RESISTANCE',
        level: volumeProfile.vah.price,
        strength: 'HIGH',
        message: `Strong resistance at VAH $${volumeProfile.vah.price.toFixed(2)}`
      });
    }

    // Value Area Low signals
    const valDistance = (currentPrice - volumeProfile.val.price) / currentPrice * 100;
    if (valDistance > 0 && valDistance < 2) {
      signals.entries.push({
        type: 'VAL_SUPPORT',
        level: volumeProfile.val.price,
        target: volumeProfile.poc.price,
        strength: 'HIGH',
        message: `Strong support at VAL $${volumeProfile.val.price.toFixed(2)}`
      });
    }
  }

  _addSupportResistanceSignals(signals, volumeProfile, currentPrice) {
    const levels = this.getKeyLevels(volumeProfile, currentPrice);

    // Support levels
    levels.support.forEach((support, idx) => {
      const distance = (currentPrice - support.price) / currentPrice * 100;
      if (distance > 0 && distance < 3) {
        signals.entries.push({
          type: 'VOLUME_SUPPORT',
          level: support.price,
          strength: idx === 0 ? 'HIGH' : 'MEDIUM',
          target: volumeProfile.poc?.price,
          message: `${idx === 0 ? 'Primary' : 'Secondary'} volume support at $${support.price.toFixed(2)}`
        });
      }
    });

    // Resistance levels
    levels.resistance.forEach((resistance, idx) => {
      const distance = (resistance.price - currentPrice) / currentPrice * 100;
      if (distance > 0 && distance < 3) {
        signals.exits.push({
          type: 'VOLUME_RESISTANCE',
          level: resistance.price,
          strength: idx === 0 ? 'HIGH' : 'MEDIUM',
          message: `${idx === 0 ? 'Primary' : 'Secondary'} volume resistance at $${resistance.price.toFixed(2)}`
        });
      }
    });
  }

  _addVolumeGapSignals(signals, volumeProfile, currentPrice) {
    const levels = this.getKeyLevels(volumeProfile, currentPrice);

    levels.lvns.forEach(lvn => {
      const distance = Math.abs(currentPrice - lvn.price) / currentPrice * 100;
      if (distance < 2) {
        signals.alerts.push({
          type: 'VOLUME_GAP',
          level: lvn.price,
          strength: 'MEDIUM',
          message: `Low volume area at $${lvn.price.toFixed(2)} - potential breakout zone`
        });
      }
    });
  }

  _integrateDrPaulSignals(signals, drPaulSignals, volumeProfile, currentPrice) {
    // Enhance Dr. Paul signals with volume profile context
    if (drPaulSignals.trend === 'bullish' && volumeProfile.poc) {
      if (currentPrice > volumeProfile.poc.price) {
        signals.alerts.push({
          type: 'BULLISH_VOLUME_CONFIRMATION',
          strength: 'HIGH',
          message: 'Dr. Paul bullish trend confirmed by price above POC'
        });
      }
    }

    if (drPaulSignals.trend === 'bearish' && volumeProfile.poc) {
      if (currentPrice < volumeProfile.poc.price) {
        signals.alerts.push({
          type: 'BEARISH_VOLUME_CONFIRMATION',
          strength: 'HIGH',
          message: 'Dr. Paul bearish trend confirmed by price below POC'
        });
      }
    }

    // Volume-based entry quality enhancement
    if (drPaulSignals.entrySignal && volumeProfile.vah && volumeProfile.val) {
      const isInValueArea = currentPrice >= volumeProfile.val.price && currentPrice <= volumeProfile.vah.price;
      if (isInValueArea) {
        signals.alerts.push({
          type: 'ENTRY_QUALITY_ENHANCED',
          strength: 'HIGH',
          message: 'Dr. Paul entry signal has high-quality volume support'
        });
      }
    }
  }

  _calculateSignalStrength(signals) {
    let strength = 0;
    
    // Weight different signal types
    strength += signals.entries.filter(s => s.strength === 'HIGH').length * 25;
    strength += signals.entries.filter(s => s.strength === 'MEDIUM').length * 15;
    strength += signals.exits.filter(s => s.strength === 'HIGH').length * 20;
    strength += signals.exits.filter(s => s.strength === 'MEDIUM').length * 10;
    strength += signals.alerts.filter(s => s.strength === 'HIGH').length * 15;
    strength += signals.alerts.filter(s => s.strength === 'MEDIUM').length * 10;

    return Math.min(100, strength);
  }

  /**
   * Real-time data integration method
   */
  async updateFromLiveData(liveData) {
    // This will integrate with your existing live data service
    // Returns updated volume profile and signals
    try {
      const candleData = liveData.historicalData || [];
      const currentPrice = liveData.currentPrice;
      
      const vpvr = this.calculateVPVR(candleData);
      const sessions = this.calculateSessionProfiles(candleData);
      const signals = this.generateLevelSignals(vpvr, currentPrice, liveData.drPaulSignals);
      const keyLevels = this.getKeyLevels(vpvr, currentPrice);

      return {
        vpvr,
        sessions,
        signals,
        keyLevels,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Volume Profile update error:', error);
      return null;
    }
  }
}

export default new VolumeProfileService();