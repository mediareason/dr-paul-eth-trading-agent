#!/usr/bin/env python3
"""
Dr. David Paul's ETH Trading Agent
Main entry point for the trading system
"""

import asyncio
import logging
import signal
import sys
from pathlib import Path

def setup_signal_handlers():
    """Setup graceful shutdown signal handlers"""
    def signal_handler(signum, frame):
        logging.info(f"Received signal {signum}, shutting down gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

async def main():
    """Main entry point"""
    print("🚀 Dr. David Paul's ETH Trading Agent")
    print("="*50)
    
    # Setup signal handlers for graceful shutdown
    setup_signal_handlers()
    
    print("🧠 Dr. Paul's Trading Principles Active:")
    print("   • Good trades are hard trades")
    print("   • Counter-trend entries within long-term trends")
    print("   • Process focus over profit focus")
    print("   • Entries where masses place stops")
    print("   • Combining fundamental (on-chain) and technical analysis")
    
    print("\n🔴 STARTING DEVELOPMENT MODE...")
    print("📊 Dashboard available at: http://localhost:3000")
    print("🔗 API server at: http://localhost:8000")
    print("⚠️  Press Ctrl+C to stop")
    
    # For now, just keep the system running
    # In full implementation, this would start the trading agent and API server
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n✅ Shutdown requested by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    # Create necessary directories
    Path("logs").mkdir(exist_ok=True)
    Path("data").mkdir(exist_ok=True)
    
    # Run the main application
    asyncio.run(main())