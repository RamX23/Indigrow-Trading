import chartController from "./chartController";

class SocketController {
  constructor(io) {
    this.io = io;
    this.priceGenerator = new PriceGenerator();
    this.setupPriceUpdates();
    this.setupSocketEvents();
  }

  setupPriceUpdates() {
    setInterval(() => {
      const priceUpdate = this.priceGenerator.updatePrices();
      this.io.emit('priceUpdate', priceUpdate);
    }, 1000);
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Send initial data
      socket.emit('initialData', {
        prices: this.priceGenerator.getLatestPrices(),
        coinConfigs: this.priceGenerator.getCoinConfigs()
      });

      // Handle coin data requests
      socket.on('requestCoinData', (coin) => {
        if (this.priceGenerator.priceHistory[coin]) {
          socket.emit('coinData', {
            coin,
            data: this.priceGenerator.priceHistory[coin].slice(-60)
          });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
}

export default chartSocketController;