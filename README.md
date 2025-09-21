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

### 📊 **Web Dashboard**
- Real-time market monitoring
- Interactive charts and visualizations
- Backtesting capabilities
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
│   ├── backtest/               # Backtesting engine
│   └── api/                    # REST API for dashboard
├── dashboard/                  # React web dashboard
│   ├── components/            # React components
│   ├── pages/                 # Next.js pages
│   └── lib/                   # Utilities
├── tests/                     # Unit tests
├── docs/                      # Documentation
└── data/                      # Historical data storage
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

## 📊 Dashboard Features

- **Live Market Data**: Real-time ETH prices from multiple exchanges
- **Dr. Paul's Signals**: Setup detection and signal strength
- **On-Chain Metrics**: Exchange flows, whale activity, network health
- **Portfolio Tracking**: Balance, positions, performance
- **Backtesting**: Historical strategy performance
- **Trade Journal**: Dr. Paul's process-focused tracking

## 🧪 Backtesting

The system includes comprehensive backtesting capabilities:

```python
from src.backtest import BacktestEngine

# Initialize backtester
backtester = BacktestEngine(
    start_date='2023-01-01',
    end_date='2024-01-01',
    initial_balance=10000
)

# Run backtest
results = backtester.run()
print(f"Total Return: {results['total_return']:.2%}")
print(f"Sharpe Ratio: {results['sharpe_ratio']:.2f}")
print(f"Max Drawdown: {results['max_drawdown']:.2%}")
```

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
- 2% risk per trade
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
- Hard Trade Execution Rate
- Setup Quality Score
- Systematic Execution Rate
- Risk-Reward Ratio Consistency

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