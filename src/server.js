import "dotenv/config";
import express from "express";
import configViewEngine from "./config/configEngine.js";
import routes from "./routes/web.js";
import cronJobController from "./controllers/cronJobController.js";
import socketIoController from "./controllers/socketIoController.js";
import connection from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import seedrandom from 'seedrandom';


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 5001;

async function initialize() {
  try {
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // setup viewEngine
    configViewEngine(app);
    // init Web Routes
    routes.initWebRouter(app);

    // Cron job
    cronJobController.cronJobGame1p(io);

    // Socket message
    socketIoController.sendMessageAdmin(io);

    // Game session configurations
    const GAME_SESSIONS = {
      '1min': { duration: 60000, currentEndPoint: null },
      '3min': { duration: 180000, currentEndPoint: null },
      '5min': { duration: 300000, currentEndPoint: null },
      '10min': { duration: 600000, currentEndPoint: null }
    };
    
    // Coin configurations
    const COIN_CONFIGS = {
      BTC: { basePrice: 60000, volatility: 0.00005 },
      ETH: { basePrice: 3000, volatility: 0.0008 },
      BNB: { basePrice: 500, volatility: 0.001 },
      ADA: { basePrice: 0.5, volatility: 0.002 }
    };
    
    // Store price data for each coin
    const coinData = {};
    Object.keys(COIN_CONFIGS).forEach(coin => {
      coinData[coin] = generateInitialData(coin);
    });
    
    // Generate initial data for a coin
    function generateInitialData(coin) {
      const data = [];
      const now = Date.now();
      const config = COIN_CONFIGS[coin];
      
      for (let i = 0; i < 60; i++) {
        const timestamp = now - (60 - i) * 1000;
        const price = i === 0 
          ? config.basePrice 
          : generateNewPrice(data[i-1].price, coin, timestamp);
        data.push({ timestamp, price });
      }
      
      return data;
    }
    
    // Generate new price with consideration of end points
    function generateNewPrice(lastPrice, coin, timestamp) {
      const config = COIN_CONFIGS[coin];
      const history = coinData[coin] || [];
      
      // Trend control logic
      let trend = null;
      if (history.length >= 3) {
        const last3 = history.slice(-3);
    
        const direction1 = Math.sign(last3[1].price - last3[0].price);
        const direction2 = Math.sign(last3[2].price - last3[1].price);
    
        if (direction1 === direction2 && direction1 !== 0) {
          trend = direction1; // 1 for up, -1 for down
        }
      }
    
      const rng = seedrandom(`${timestamp}-${coin}`);
      let change = (rng() * 2 - 1) * config.volatility * lastPrice;
    
      // If there's a 3-point trend in one direction, reverse it
      if (trend === 1 && change > 0) {
        change *= -1;
      } else if (trend === -1 && change < 0) {
        change *= -1;
      }
    
      let newPrice = lastPrice + change;
    
      newPrice = Math.max(0.01, newPrice);
      const maxChange = lastPrice * COIN_CONFIGS[coin].volatility;
      return Math.max(
        lastPrice - maxChange,
        Math.min(lastPrice + maxChange, newPrice)
      );
    }
    
    
    // Helper function to handle endpoint setting
    function handleEndPoint(session, coin, price) {
      if (GAME_SESSIONS[session] && COIN_CONFIGS[coin]) {
        GAME_SESSIONS[session].currentEndPoint = {
          coin,
          price: parseFloat(price),
          startTime: Date.now()
        };
        console.log(`Set ${session} end point for ${coin} at ${price}`);
        
        // Broadcast the new end point to all clients
        io.emit('endPointSet', {
          session,
          coin,
          price: parseFloat(price),
          startTime: Date.now(),
          duration: GAME_SESSIONS[session].duration
        });
      }
    }
    
    // Update prices every second
    const priceUpdateInterval = setInterval(() => {
      try {
        const now = Date.now();
        const start = now;
      
        // Verify global objects
        if (!COIN_CONFIGS || typeof COIN_CONFIGS !== 'object') {
          console.error('COIN_CONFIGS is undefined or invalid');
          return;
        }
        if (!coinData || typeof coinData !== 'object') {
          console.error('coinData is undefined or invalid');
          return;
        }
        if (!GAME_SESSIONS || typeof GAME_SESSIONS !== 'object') {
          console.error('GAME_SESSIONS is undefined or invalid');
          return;
        }
      
        // Update prices
        Object.keys(COIN_CONFIGS).forEach(coin => {
          if (!Array.isArray(coinData[coin])) {
            console.error(`coinData[${coin}] is not an array`);
            coinData[coin] = [];
          }
      
          const lastDataPoint = coinData[coin][coinData[coin].length - 1];
          if (!lastDataPoint || typeof lastDataPoint.price !== 'number') {
            console.warn(`Invalid lastDataPoint for ${coin}:`, lastDataPoint);
            return;
          }
      
          const newPrice = generateNewPrice(lastDataPoint.price, coin, now);
          if (typeof newPrice !== 'number' || isNaN(newPrice)) {
            console.error(`Invalid price for ${coin}:`, newPrice);
            return;
          }
      
          coinData[coin].push({ timestamp: now, price: newPrice });
      
          // Keep only the last 24 hours of data
          if (coinData[coin].length > 86400) {
            console.log(`Pruning ${coinData[coin].length - 86400} old data points for ${coin}`);
            coinData[coin].shift();
          }
        });
      
        // Prepare session data
        const sessions = Object.fromEntries(
          Object.entries(GAME_SESSIONS).map(([session, data]) => {
            if (data.currentEndPoint && (typeof data.currentEndPoint.startTime !== 'number' || typeof data.duration !== 'number')) {
              console.error(`Invalid session data for ${session}:`, data);
            }
            return [
              session,
              {
                active: data.currentEndPoint !== null,
                price: data.currentEndPoint?.price || null,
                timeLeft: data.currentEndPoint
                  ? Math.max(0, data.currentEndPoint.startTime + data.duration - now)
                  : null
              }
            ];
          })
        );
      
        // Broadcast updates
        io.emit('priceUpdate', {
          timestamp: now,
          prices: Object.fromEntries(
            Object.keys(COIN_CONFIGS).map(coin => [
              coin,
              coinData[coin][coinData[coin].length - 1]?.price || null
            ])
          ),
          sessions
        });
      
        // Log sessions and performance
        // console.log('Sessions:', sessions);
        // console.log(`Interval execution time: ${Date.now() - start}ms`);
      } catch(err) {
        console.error("Error occurred while updating client:", err);
      }
    }, 1000);
    
    // Handle socket connections
    io.on('connection', (socket) => {
      console.log('New client connected');
      
      // Send initial data when a client connects
      socket.emit('initialData', {
        coins: coinData,
        sessions: Object.fromEntries(
          Object.entries(GAME_SESSIONS).map(([session, data]) => [
            session,
            { 
              active: data.currentEndPoint !== null,
              price: data.currentEndPoint?.price || null,
              timeLeft: data.currentEndPoint 
                ? Math.max(0, data.currentEndPoint.startTime + data.duration - Date.now())
                : null
            }
          ])
        )
      });
      
      // Handle setting end points from server (cron jobs)
      // socket.on('setEndPoint', ({ coin, price }) => {
      //   handleEndPoint('1min', coin, price);
      // });

      // socket.on('set3minEndPoint', ({ coin, price }) => {
      //   handleEndPoint('3min', coin, price);
      // });

      // socket.on('set5minEndPoint', ({ coin, price }) => {
      //   handleEndPoint('5min', coin, price);
      // });

      // socket.on('set10minEndPoint', ({ coin, price }) => {
      //   handleEndPoint('10min', coin, price);
      // });

      // Handle getting start points
      socket.on('getStartPoint', (data) => {
        console.log('Received start point for 1min game:', coinData[coinData.length-1]);
        // Store this in your game session data if needed
      });

      socket.on('get3minStartPoint', (data) => {
        console.log('Received start point for 3min game:', data);
      });

      socket.on('get5minStartPoint', (data) => {
        console.log('Received start point for 5min game:', data);
      });

      socket.on('get10minStartPoint', (data) => {
        console.log('Received start point for 10min game:', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    // Cleanup on server shutdown
    process.on('SIGTERM', () => {
      clearInterval(priceUpdateInterval);
      server.close();
    });

    process.on('SIGINT', () => {
      clearInterval(priceUpdateInterval);
      server.close();
    });

    // Start server AFTER all init
    server.listen(port, () => {
      console.log(`Connected successfully at http://localhost:${port}`);
    });

  } catch (err) {
    console.error("Error during initialization:", err);
    process.exit(1);
  }
}

initialize();