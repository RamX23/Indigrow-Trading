import seedrandom from 'seedrandom';

class PriceGenerator {
  constructor() {
    this.priceHistory = {
      BTC: [],
      ETH: [],
      BNB: [],
      ADA: []
    };

    this.coinConfigs = {
      BTC: { basePrice: 60000, color: '#f7931a', name: 'Bitcoin' },
      ETH: { basePrice: 3000, color: '#627eea', name: 'Ethereum' },
      BNB: { basePrice: 500, color: '#f3ba2f', name: 'Binance Coin' },
      ADA: { basePrice: 0.5, color: '#0033ad', name: 'Cardano' }
    };

    this.initializeData();
  }

  initializeData() {
    const now = Date.now();
    Object.keys(this.coinConfigs).forEach(coin => {
      const basePrice = this.coinConfigs[coin].basePrice;
      for (let i = 0; i < 60; i++) {
        const timestamp = now - (60 - i) * 1000;
        const price = i === 0 ? basePrice : 
          this.generateNewPrice(this.priceHistory[coin][i-1].price, coin, timestamp);
        this.priceHistory[coin].push({ timestamp, price });
      }
    });
  }

  generateNewPrice(lastPrice, coin, timestamp) {
    const seed = `shared-crypto-seed-${Math.floor(timestamp / 1000)}`;
    const rng = seedrandom(seed);
    
    const volatility = this.coinConfigs[coin].basePrice * 0.0005;
    let randomChange = (rng() * 2 - 1) * volatility;

    if (this.priceHistory[coin].length > 1) {
      const prevTrend = this.priceHistory[coin][this.priceHistory[coin].length - 1].price - 
                       this.priceHistory[coin][this.priceHistory[coin].length - 2].price;
      randomChange += prevTrend * 0.3;
    }

    const newPriceRaw = lastPrice + randomChange;
    const newPrice = Math.max(0.01, newPriceRaw);
    const maxChange = lastPrice * 0.02;
    return Math.max(lastPrice - maxChange, Math.min(lastPrice + maxChange, newPrice));
  }

  cleanupOldData() {
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    Object.keys(this.priceHistory).forEach(coin => {
      this.priceHistory[coin] = this.priceHistory[coin].filter(
        point => point.timestamp >= twelveHoursAgo
      );
    });
  }

  updatePrices() {
    const now = Date.now();
    Object.keys(this.coinConfigs).forEach(coin => {
      const lastPoint = this.priceHistory[coin][this.priceHistory[coin].length - 1];
      const newPrice = this.generateNewPrice(lastPoint.price, coin, now);
      this.priceHistory[coin].push({ timestamp: now, price: newPrice });
    });
    this.cleanupOldData();
    return this.getLatestPrices();
  }

  getLatestPrices() {
    return {
      timestamp: Date.now(),
      prices: {
        BTC: this.priceHistory.BTC.slice(-60),
        ETH: this.priceHistory.ETH.slice(-60),
        BNB: this.priceHistory.BNB.slice(-60),
        ADA: this.priceHistory.ADA.slice(-60)
      }
    };
  }

  getCoinConfigs() {
    return this.coinConfigs;
  }
}

export default PriceGenerator;