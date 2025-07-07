import { INTERVALS } from '../config/constants.js';
import priceService from '../services/priceService.js';
import connection from '../config/connectDB.js';

class SessionController {
  constructor() {
    this.sessionLines = {};
    Object.keys(INTERVALS).forEach(duration => {
      this.sessionLines[duration] = null;
    });
    this.setupIntervals();
  }

  async setupIntervals() {
    Object.entries(INTERVALS).forEach(([duration, interval]) => {
      setInterval(async () => {
        const prices = await priceService.generateAllPrices();
        const now = Date.now();
        
        // Store in database
        await connection.query(
          `INSERT INTO session_lines (duration, start_time, end_time, prices)
           VALUES (?, ?, ?, ?)`,
          [duration, new Date(now), new Date(now + interval), JSON.stringify(prices)]
        );
        
        this.sessionLines[duration] = {
          startTime: now,
          endTime: now + interval,
          prices: prices.prices,
          duration
        };
      }, interval);
    });
  }

  async getSessionLines() {
    // Refresh from database
    const [rows] = await connection.query(
      `SELECT * FROM session_lines 
       WHERE end_time > NOW()`
    );
    
    rows.forEach(row => {
        let prices;

        if (typeof row.prices === 'string') {
          try {
            prices = JSON.parse(row.prices);
          } catch (err) {
            console.error("Failed to parse prices JSON:", err);
            prices = {}; // fallback value
          }
        } else {
          prices = row.prices; // already an object
        }
      
        this.sessionLines[row.duration] = {
          startTime: row.start_time.getTime(),
          endTime: row.end_time.getTime(),
          prices,
          duration: row.duration
      };
    });
    
    return this.sessionLines;
  }
}

export default new SessionController();