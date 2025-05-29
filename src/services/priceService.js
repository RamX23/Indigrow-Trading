import connection from '../config/connectDB.js';
import seedrandom from 'seedrandom';
import { COIN_CONFIGS, SEED } from '../config/constants.js';

class PriceService {
  constructor() {
    this.currentPrices = {};
    this.previousPrices = {};
  }

  async initialize() {
    const [rows] = await connection.query(`
      SELECT coin, price FROM price_history 
      WHERE id IN (
        SELECT MAX(id) FROM price_history GROUP BY coin
      )
    `);

    Object.keys(COIN_CONFIGS).forEach(coin => {
      const record = rows.find(r => r.coin === coin);
      this.currentPrices[coin] = record ? record.price : COIN_CONFIGS[coin].basePrice;
    });
  }

  async generateAllPrices() {
    const now = Date.now();
    const alignedTime = Math.floor(now / 1000) * 1000;
    const newPrices = {};

    Object.keys(COIN_CONFIGS).forEach(coin => {
      const seed = `${SEED}-${coin}-${alignedTime / 1000}`;
      const rng = seedrandom(seed);
      newPrices[coin] = this.generatePrice(coin, rng);
    });

    this.previousPrices = { ...this.currentPrices };
    this.currentPrices = { ...newPrices };

    await this.savePrices(alignedTime, newPrices);

    return { timestamp: alignedTime, prices: newPrices };
  }

  generatePrice(coin, rng) {
    const config = COIN_CONFIGS[coin];
    const lastPrice = this.currentPrices[coin];
    const volatility = config.basePrice * config.volatility;

    let change = (rng() * 2 - 1) * volatility;

    if (this.previousPrices[coin] !== undefined) {
      const prevChange = this.currentPrices[coin] - this.previousPrices[coin];
      change += prevChange * 0.3;
    }

    const newPrice = lastPrice + change;
    return Math.max(0.01, newPrice);
  }

  async savePrices(timestamp, prices) {
    const values = Object.entries(prices).map(([coin, price]) => [
      coin,
      price,
      new Date(timestamp)
    ]);

    await connection.query(
      `INSERT INTO price_history (coin, price, timestamp) VALUES ?`,
      [values]
    );
  }

  async getHistory(coin, hours = 6) {
    const [rows] = await connection.query(
      `SELECT price, timestamp FROM price_history 
       WHERE coin = ? AND timestamp >= NOW() - INTERVAL ? HOUR
       ORDER BY timestamp ASC`,
      [coin, hours]
    );

    return rows.map(row => ({
      x: new Date(row.timestamp).getTime(),
      y: row.price
    }));
  }
}

export default new PriceService();
