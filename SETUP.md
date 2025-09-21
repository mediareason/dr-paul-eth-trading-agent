# Quick Setup Guide - Dr. Paul's ETH Trading Agent

🚀 **Get up and running with Dr. Paul's trading system in 5 minutes!**

## 📋 Prerequisites Checklist

- [ ] **Node.js 16+** installed ([Download here](https://nodejs.org/))
- [ ] **Python 3.8+** installed ([Download here](https://python.org/))
- [ ] **Git** installed ([Download here](https://git-scm.com/))

## ⚡ 5-Minute Setup

### 1. **Clone & Install**
```bash
# Clone the repository
git clone https://github.com/mediareason/dr-paul-eth-trading-agent.git
cd dr-paul-eth-trading-agent

# Install Python dependencies (for full system)
pip install -r requirements.txt

# Install React dashboard dependencies
cd dashboard
npm install
```

### 2. **Start the Dashboard**
```bash
# From the dashboard directory
npm run dev
```

### 3. **Open & Explore**
```
🌐 Open: http://localhost:3000
📊 Try: "Interactive Backtest" tab
🎯 Click: "Start" button to watch Dr. Paul's strategy!
```

## 🎮 Quick Demo (No Configuration Needed!)

The **Interactive Backtester** works immediately with simulated data:

### **Step 1: Navigate**
- Open http://localhost:3000
- Click **"Interactive Backtest"** tab

### **Step 2: Configure**
- **Start Date**: 2023-01-01 (default)
- **Time Frame**: Hourly (default)
- **Duration**: 1 Month (default)
- **Signal Threshold**: 60% (balanced)

### **Step 3: Run**
- Click **"Start"** button
- Watch trades execute step-by-step
- See hard vs easy trade performance
- Observe Dr. Paul's methodology in action!

### **Step 4: Experiment**
- Try different signal thresholds (40% = more trades, 80% = high conviction)
- Test different time periods (1 week to 6 months)
- Switch between hourly and daily data
- Reset and run multiple scenarios

## 🔧 Optional: Full System Setup (Live Data)

For **real data feeds and trading**, add API keys:

### **1. Copy Configuration**
```bash
# From project root
cp config/config.example.yaml config/config.yaml
```

### **2. Add Free API Keys**
Edit `config/config.yaml`:

```yaml
# Free API keys (no cost)
exchanges:
  binance:
    api_key: "your_binance_api_key"    # Free: 1200 req/min
    secret: "your_binance_secret"

onchain:
  etherscan_api_key: "your_etherscan_key"  # Free: 100k calls/day
  
# CoinGecko is used automatically (no key needed for basic features)
```

### **3. Start Full System**
```bash
# Terminal 1: Trading agent (Python)
python main.py

# Terminal 2: Dashboard (React)
cd dashboard
npm run dev
```

## 🎯 What Each System Does

### 📊 **Live Trading Dashboard**
- **Real ETH prices** from multiple exchanges
- **Dr. Paul's signals** for current market
- **On-chain analysis** (whale activity, exchange flows)
- **Portfolio tracking** and performance

### 🧪 **Interactive Backtester** 
- **Visual learning tool** for Dr. Paul's methodology
- **Step-by-step trade execution** with explanations
- **Parameter testing** to optimize strategy
- **Hard vs easy trade validation**

### 🔬 **Python Backtesting Engine**
- **Production-grade analysis** with real historical data
- **Statistical validation** and performance metrics
- **Research and compliance** for serious trading

## 🚨 Troubleshooting

### **Common Issues**

**❌ "npm install" fails**
```bash
# Try with legacy peer deps
npm install --legacy-peer-deps
```

**❌ "python main.py" fails**
```bash
# Install requirements specifically
pip install pandas numpy requests pyyaml
```

**❌ Dashboard won't load**
```bash
# Check if port 3000 is available
# Try: http://localhost:3001 or kill other processes
```

**❌ No trades in backtester**
```bash
# Lower signal threshold to 40%
# Check console for "X buy signals generated"
# Try different time periods
```

## 🎓 Learning Path

### **Beginner (5 minutes)**
1. Run interactive backtester with defaults
2. Watch a few trades execute
3. Try different signal thresholds
4. Understand "hard vs easy" trades

### **Intermediate (30 minutes)**
1. Test different time periods and durations
2. Compare hourly vs daily performance  
3. Optimize risk per trade settings
4. Understand Dr. Paul's signal components

### **Advanced (Setup live data)**
1. Add API keys for real data feeds
2. Run Python backtesting engine
3. Compare simulated vs real data results
4. Start paper trading with live signals

## 📞 Get Help

- **📖 Full Documentation**: [README.md](README.md)
- **🐛 Issues**: [GitHub Issues](https://github.com/mediareason/dr-paul-eth-trading-agent/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/mediareason/dr-paul-eth-trading-agent/discussions)

## 🎯 Quick Success Check

After 5 minutes, you should see:

✅ **Dashboard loads** at http://localhost:3000  
✅ **Two tabs**: "Live Trading" and "Interactive Backtest"  
✅ **Backtester runs** and shows trade execution  
✅ **Charts update** with price and portfolio data  
✅ **Metrics display** total return and trade count  

**If you see all of these ✅ - You're ready to explore Dr. Paul's methodology!**

---

**🚀 Ready to master systematic trading with Dr. Paul's proven approach? Start with the interactive backtester and watch the magic happen!**