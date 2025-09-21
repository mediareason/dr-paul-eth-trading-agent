# Dr. David Paul's ETH Trading Agent

🚀 **Advanced ETH trading system implementing Dr. David Paul's methodology with live data feeds, on-chain analysis, and comprehensive web dashboard.**

![Dr. Paul's Trading Agent](https://img.shields.io/badge/Trading-Dr.%20Paul's%20Method-blue) ![ETH](https://img.shields.io/badge/Crypto-ETH-orange) ![Python](https://img.shields.io/badge/Python-3.8+-green) ![React](https://img.shields.io/badge/React-Dashboard-blue)

## 🧠 Dr. David Paul's Trading Methodology

Dr. David Paul was a renowned trading educator who emphasized:

- **"Good trades are hard trades"** - Taking positions when it feels uncomfortable
- **Counter-trend entries** within long-term trends
- **Process focus** over profit focus
- **Placing entries where masses place stops**
- **Combining fundamental and technical analysis**
- **Wyckoff method** for price-volume analysis

## 🎯 System Features

### 📡 **Live Data Feeds**
- Multi-exchange price aggregation (Binance, Coinbase, Kraken)
- Real-time WebSocket feeds
- Consensus pricing with outlier detection
- Automatic failover and rate limit management

### 🔍 **On-Chain Analysis**
- Exchange flow monitoring (institutional accumulation signals)
- Whale activity tracking
- Network health metrics
- DeFi ecosystem data
- Gas price analysis

### 🤖 **Automated Trading**
- Dr. Paul's setup detection
- Risk management and position sizing
- Process-focused performance tracking
- Paper trading mode

### 📊 **Dual Backtesting System**
- **🔬 Python Engine**: Production-grade backtesting with real data
- **⚡ Interactive React Lab**: Visual step-by-step strategy testing
- **📈 Hard vs Easy Trade Analysis**: Validates Dr. Paul's core concepts
- **⏰ Multiple Time Frames**: Hourly and daily data testing
- **🎯 Parameter Optimization**: Test different risk and signal thresholds

### 🌐 **Web Dashboard**
- Real-time market monitoring with live ETH prices
- Interactive charts and visualizations
- Tabbed interface: Live Trading + Interactive Backtesting
- Trade history and analytics
- Dr. Paul's methodology tracking

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/mediareason/dr-paul-eth-trading-agent.git
cd dr-paul-eth-trading-agent

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd dashboard
npm install
cd ..

# Copy configuration
cp config/config.example.yaml config/config.yaml
# Edit config.yaml with your API keys
```

### Running the System

```bash
# Terminal 1: Start the trading agent
python main.py

# Terminal 2: Start the web dashboard
cd dashboard
npm run dev
```

Open http://localhost:3000 to view the dashboard.

### 🎮 **Quick Demo**

1. **Live Trading Tab**: See real-time ETH analysis with Dr. Paul's signals
2. **Interactive Backtest Tab**: 
   - Set time range (start date + duration)
   - Choose hourly or daily data
   - Adjust signal threshold (40% = more trades, 80% = high conviction)
   - Click "Start" to watch the strategy trade step-by-step
   - Compare hard vs easy trade performance

## 📁 Project Structure

```
dr-paul-eth-trading-agent/
├── README.md
├── requirements.txt
├── main.py                     # Main trading agent
├── config/
│   ├── config.example.yaml     # Configuration template
│   └── config.yaml             # Your configuration (gitignored)
├── src/
│   ├── agents/                 # Trading agent classes
│   ├── data/                   # Data feeds and on-chain analysis
│   ├── strategies/             # Dr. Paul's trading strategies
│   ├── backtest/               # Python backtesting engine
│   └── api/                    # REST API for dashboard
├── dashboard/                  # React web dashboard
│   ├── components/
│   │   ├── DrPaulDashboard.js  # Live trading dashboard
│   │   └── InteractiveBacktester.js  # Interactive backtesting lab
│   ├── pages/
│   │   ├── index.js            # Main page with tabs
│   │   └── backtest.js         # Dedicated backtest page
│   └── lib/                    # Utilities
├── tests/                      # Unit tests
├── docs/                       # Documentation
└── data/                       # Historical data storage
```

## 🔧 Configuration

Edit `config/config.yaml` with your API keys:

```yaml
exchanges:
  binance:
    api_key: "your_binance_api_key"
    secret: "your_binance_secret"
  coinbase:
    api_key: "your_coinbase_api_key"
    secret: "your_coinbase_secret"

onchain:
  etherscan_api_key: "your_etherscan_key"
  coinmetrics_api_key: "your_coinmetrics_key"

trading:
  initial_balance: 10000
  max_position_size: 0.5
  risk_per_trade: 0.02
  paper_trading: true
```

## 🧪 Dual Backtesting System

### ⚡ **Interactive React Backtester** (Quick Visual Testing)

Perfect for **learning and experimenting**:

```bash
# Access via web dashboard
http://localhost:3000 → "Interactive Backtest" tab

# Or direct link
http://localhost:3000/backtest
```

**Features**:
- **🎬 Step-by-step visualization** - Watch every trade decision
- **⏰ Flexible time ranges** - Test any date range and duration
- **⚙️ Real-time parameter testing** - Adjust settings and see immediate results
- **📊 Hard vs Easy trade comparison** - Validates Dr. Paul's methodology
- **🎯 Signal threshold testing** - Find optimal conviction levels

**Best for**:
- Understanding Dr. Paul's methodology
- Quick strategy validation
- Learning backtesting concepts
- Parameter sensitivity analysis

### 🔬 **Python Backtesting Engine** (Production Analysis)

For **serious strategy validation**:

```python
from src.backtest import DrPaulETHBacktester

# Initialize backtester
backtester = DrPaulETHBacktester(
    initial_capital=10000,
    commission=0.001
)

# Load historical data
eth_data = backtester.load_eth_data('2023-01-01', '2024-01-01')

# Generate Dr. Paul's signals
signals = backtester.generate_dr_paul_signals(eth_data)

# Execute backtest
backtester.execute_backtest(eth_data, signals)

# Display results with charts and validation
backtester.plot_results()
```

**Features**:
- **📊 Real historical data** integration
- **🔬 Statistical validation** with walk-forward analysis
- **📈 Professional performance metrics**
- **🎯 Dr. Paul's methodology validation**
- **💾 Export results** to files

**Best for**:
- Production strategy validation
- Academic research
- Regulatory compliance
- Professional trading

### 🎯 **Dr. Paul's Methodology Validation**

Both systems validate core concepts:

```
✅ Hard Trades Outperform Easy Trades
✅ Counter-Trend Entries in Uptrends Work
✅ Process Focus Beats Outcome Focus
✅ Risk/Reward Ratios Matter More Than Win Rate
```

## 📊 Dashboard Features

### 🔴 **Live Trading Tab**
- **Real-time ETH prices** from multiple exchanges
- **Dr. Paul's signal analysis** with current market context
- **On-chain metrics**: Exchange flows, whale activity, network health
- **Portfolio tracking**: Balance, positions, performance
- **Market context alerts**: Optimal entry conditions

### 🧪 **Interactive Backtest Tab**
- **Time range controls**: Set any start date and duration
- **Strategy settings**: Risk per trade, signal thresholds, stop/target levels
- **Live visualization**: Watch trades execute step-by-step
- **Performance metrics**: Total return, win rate, hard vs easy trade analysis
- **Real-time charts**: Price movement and portfolio equity curves

## 🔐 API Keys (Free Tiers)

### Required (Free)
- **Binance**: 1200 requests/minute
- **CoinGecko**: 10-30 calls/minute
- **Etherscan**: 100k calls/day

### Optional (Enhanced Features)
- **Coinbase Pro**: 10k requests/hour
- **CoinMetrics**: 1k calls/month
- **Glassnode**: Limited free data

## 🛡️ Risk Management

The system implements Dr. Paul's risk management principles:

- Maximum 50% ETH allocation
- 2% risk per trade (adjustable)
- Stop losses based on support/resistance
- Position sizing based on setup quality
- Process tracking over profit tracking

## 📈 Performance Metrics

### Traditional Metrics
- Total Return
- Sharpe Ratio
- Maximum Drawdown
- Win Rate

### Dr. Paul's Process Metrics
- **Hard Trade Execution Rate**: % of uncomfortable setups taken
- **Setup Quality Score**: Average signal strength of executed trades
- **Systematic Execution Rate**: Adherence to methodology
- **Risk-Reward Ratio Consistency**: Maintaining 2:1+ ratios

### Interactive Backtester Metrics
- **Hard vs Easy Trade Performance**: Validates core methodology
- **Signal Threshold Analysis**: Optimal conviction levels
- **Time Frame Performance**: Hourly vs daily strategy effectiveness
- **Parameter Sensitivity**: Impact of risk and threshold changes

## 🎓 Learning Path

### 1. **Start with Interactive Backtester**
- Use default settings (2023 data, 1 month, 60% threshold)
- Watch trades execute and understand Dr. Paul's logic
- Experiment with different time periods and thresholds

### 2. **Validate with Python Engine**
- Run comprehensive backtests with real data
- Use walk-forward analysis for robust validation
- Export results for deeper analysis

### 3. **Live Trading (Paper Mode)**
- Start with paper trading to validate real-time execution
- Monitor Dr. Paul's signals in live market conditions
- Build confidence before risking real capital

## 🔄 Development

### Running Tests
```bash
python -m pytest tests/
```

### Code Quality
```bash
# Format code
black src/

# Lint code
flake8 src/

# Type checking
mypy src/
```

## 📚 Documentation

- [Dr. David Paul's Trading Philosophy](docs/paul-methodology.md)
- [Interactive Backtesting Guide](docs/interactive-backtesting.md)
- [Python Backtesting API](docs/python-backtesting.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This software is for educational and research purposes only. Trading cryptocurrencies involves substantial risk of loss. Past performance does not guarantee future results. Use at your own risk.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Dr. David Paul for his trading methodology and educational contributions
- The crypto community for open-source tools and APIs
- VectorVest for preserving Dr. Paul's teachings

---

**Built with ❤️ for systematic, disciplined crypto trading using Dr. David Paul's timeless principles.**

### 🚀 **Ready to Start?**

1. **Clone** the repository
2. **Install** dependencies (Python + Node.js)
3. **Run** `npm run dev` in the dashboard folder
4. **Open** http://localhost:3000
5. **Click** "Interactive Backtest" tab
6. **Watch** Dr. Paul's methodology in action!

**Both novice and experienced traders can learn from Dr. Paul's disciplined, process-focused approach to the markets.** 🎯