import priceService from "../services/priceService.js";
import sessionController from "./sessionController.js";
import { COIN_CONFIGS } from "../config/constants.js";

class SocketController {
  initialize(io) {
    this.io = io;
    this.setupEventHandlers();
    this.startPriceUpdates();
  }

  setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log('New client connected');
      
      // Send initial data
      const [prices, sessionLines] = await Promise.all([
        this.getAllCoinHistory(),
        sessionController.getSessionLines()
      ]);
      
      socket.emit('initialData', { prices, sessionLines });
      
      socket.on('getHistory', async ({ coin, before }) => {
        const history = await priceService.getHistory(coin, before);
        socket.emit('historyData', { coin, data: history });
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  async getAllCoinHistory() {
    const coins = Object.keys(COIN_CONFIGS);
    const history = {};
    
    await Promise.all(coins.map(async (coin) => {
      history[coin] = await priceService.getHistory(coin);
    }));
    
    return history;
  }
  async getAllCoinHistory() {
    const coins = Object.keys(COIN_CONFIGS);
    const history = {};
    
    await Promise.all(coins.map(async (coin) => {
      history[coin] = await priceService.getHistory(coin);
    }));
    
    return history;
  }

  startPriceUpdates() {
    setInterval(async () => {
      const { timestamp, prices } = await priceService.generateAllPrices();
      this.io.emit('priceUpdate', { timestamp, prices });
      
      // Check for new session lines
      Object.entries(sessionController.getSessionLines()).forEach(([duration, line]) => {
        if (line && Date.now() - line.startTime < 1000) {
          this.io.emit(`set${duration.replace('min', 'minEndPoint')}`, line.prices);
        }
      });
    }, 1000);
  }
}

export default new SocketController();