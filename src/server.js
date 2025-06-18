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
import seedrandom from "seedrandom";
import cron from "node-cron";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 5001;

// Shared data structure to store endpoint data
const ENDPOINT_DATA = {
  "1min": { endPrices: {}, startPrices: {}, timestamp: null },
  "3min": { endPrices: {}, startPrices: {}, timestamp: null },
  "5min": { endPrices: {}, startPrices: {}, timestamp: null },
  "10min": { endPrices: {}, startPrices: {}, timestamp: null },
};

async function initialize() {
  try {
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    configViewEngine(app);
    routes.initWebRouter(app);

    // Pass ENDPOINT_DATA to cronJobController
    cronJobController.cronJobGame1p(io, ENDPOINT_DATA);

    socketIoController.sendMessageAdmin(io);

    // Game session configurations
    const GAME_SESSIONS = {
      "1min": { duration: 60000, currentEndPoint: null },
      "3min": { duration: 180000, currentEndPoint: null },
      "5min": { duration: 300000, currentEndPoint: null },
      "10min": { duration: 600000, currentEndPoint: null },
    };

    const COIN_CONFIGS = {
      BTC: { basePrice: 60000, volatility: 0.00005 },
      ETH: { basePrice: 3000, volatility: 0.0008 },
      BNB: { basePrice: 500, volatility: 0.001 },
      ADA: { basePrice: 0.5, volatility: 0.002 },
    };

    const coinData = {};
    Object.keys(COIN_CONFIGS).forEach((coin) => {
      coinData[coin] = generateInitialData(coin);
    });

    function generateInitialData(coin) {
      const data = [];
      const now = Date.now();
      const config = COIN_CONFIGS[coin];

      for (let i = 0; i < 60; i++) {
        const timestamp = now - (60 - i) * 1000;
        const price = i === 0 ? config.basePrice : generateNewPrice(data[i - 1].price, coin, timestamp);
        data.push({ timestamp, price });
      }

      return data;
    }

    
    function generateNewPrice(lastPrice, coin, timestamp) {
      const config = COIN_CONFIGS[coin];
      const history = coinData[coin] || [];
      
      // Get recent price movements (last 3 data points)
      const recentMovements = history.length >= 3 ? [
        history[history.length - 1].price - history[history.length - 2].price,
        history[history.length - 2].price - history[history.length - 3].price
      ] : [0, 0];
    
      // Determine current trend strength and direction
      const trendDirection = Math.sign(recentMovements[0]);
      const trendStrength = Math.abs(recentMovements[0]) / (config.basePrice * config.volatility);
      
      // Initialize RNG with seed for reproducibility
      const rng = seedrandom(`${timestamp}-${coin}`);
      
      // 15% chance of plateau (no movement or very small movement)
      const isPlateau = rng() < 0.15 && history.length > 5;
      
      let change;
      if (isPlateau) {
        // Plateau period - minimal movement
        change = (rng() * 2 - 1) * config.volatility * lastPrice * 0.1; // 10% of normal volatility
        // console.log(`[${coin}] Plateau period - minimal movement`);
      } else {
        // Normal movement with trend enforcement
        change = (rng() * 2 - 1) * config.volatility * lastPrice;
        
        // Enforce trend reversal if same direction for 2+ periods
        if (trendDirection !== 0 && 
            Math.sign(recentMovements[0]) === Math.sign(recentMovements[1])) {
          const reversalStrength = 0.5 + (rng() * 0.5); // 50-100% reversal
          change = -trendDirection * Math.abs(change) * reversalStrength;
          // console.log(`[${coin}] Trend reversal enforced after 2 moves in same direction`);
        }
        
        // Apply momentum damping for strong trends
        if (trendStrength > 0.7) {
          change *= 0.7; // Reduce movement by 30% if trend is too strong
          // console.log(`[${coin}] Damping strong trend`);
        }
      }
    
      // Calculate new price with bounds checking
      let newPrice = lastPrice + change;
      newPrice = Math.max(0.01, newPrice); // Absolute minimum price
      
      // Apply additional bounds based on volatility
      const maxChange = lastPrice * config.volatility;
      newPrice = Math.max(
        lastPrice - maxChange * 1.5, // Allow slightly larger downward moves
        Math.min(
          lastPrice + maxChange, 
          newPrice
        )
      );
    
      // Ensure we don't have more than 2 consecutive moves in same direction
      const newDirection = Math.sign(newPrice - lastPrice);
      if (history.length >= 1) {
        const prevDirection1 = Math.sign(history[history.length - 1].price - history[history.length - 2].price);
        const prevDirection2 = history.length >= 2 ? 
          Math.sign(history[history.length - 2].price - history[history.length - 3].price) : 0;
        
        if (newDirection !== 0 && newDirection === prevDirection1 && newDirection === prevDirection2) {
          // Force reversal if 3rd consecutive move in same direction
          newPrice = lastPrice - (newPrice - lastPrice) * (0.3 + rng() * 0.7); // 30-100% reversal
          // console.log(`[${coin}] Forced reversal after 3 consecutive moves`);
        }
      }
    
      return parseFloat(newPrice.toFixed(4));
    }

    // Example function to process ENDPOINT_DATA
    function processEndpointData(session) {
      const data = ENDPOINT_DATA[session];
      if (data && data.endPrices && Object.keys(data.endPrices).length > 0) {
        // console.log(`[${session}] Endpoint Data:`, data);
        Object.keys(data.endPrices).forEach((coin) => {
          // console.log(`[${session}] ${coin} endPrice: ${data.endPrices[coin]}, startPrice: ${data.startPrices[coin]}`);
          GAME_SESSIONS[session].currentEndPoint = {
            coin,
            price: parseFloat(data.endPrices[coin]),
            startTime: data.timestamp,
          };
        });
      }
    }

    // Periodically check or use ENDPOINT_DATA
    setInterval(() => {
      Object.keys(ENDPOINT_DATA).forEach((session) => {
        if (ENDPOINT_DATA[session].timestamp) {
          processEndpointData(session);
        }
      });
    }, 1000); // Check every second// Add this with your other constants
    const COUNTDOWN_INTERVAL = 1000; // 1 second
    
    // Add this function to handle countdown logic
    function getCountdownTime(gameType) {
      const now = new Date();
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      
      // Calculate time remaining in the current period
      let remainingSeconds = 0;
      let remainingMinutes = 0;
      
      switch(gameType) {
        case '1min':
          remainingSeconds = 59 - seconds;
          remainingMinutes = 0;
          break;
        case '3min':
          remainingSeconds = 59 - seconds;
          remainingMinutes = (2 - (minutes % 3));
          break;
        case '5min':
          remainingSeconds = 59 - seconds;
          remainingMinutes = (4 - (minutes % 5));
          break;
        case '10min':
          remainingSeconds = 59 - seconds;
          remainingMinutes = (9 - (minutes % 10));
          break;
        default:
          remainingSeconds = 59 - seconds;
          remainingMinutes = 0;
      }

      if (remainingSeconds === 60) {
        remainingSeconds = 0;
        remainingMinutes = Math.max(0, remainingMinutes - 1);
      }

      // Split minutes into two digits
      const minute1 = Math.floor(remainingMinutes / 10);
      const minute2 = remainingMinutes % 10;
      
      return {
        minute1,
        minute2,
        second1: Math.floor(remainingSeconds / 10),
        second2: remainingSeconds % 10,
        active: true // Assume active unless otherwise specified
      };
    }
    
    // Add this to your priceUpdateInterval or create a separate interval
    setInterval(() => {
      const now = Date.now();
      const sessions = {
        '1min': getCountdownTime('1min'),
        '3min': getCountdownTime('3min'),
        '5min': getCountdownTime('5min'),
        '10min': getCountdownTime('10min')
      };
      
      const defaultGameType = '1min';
      const currentSession = sessions[defaultGameType];

      io.emit('timeUpdate', {
        minute1: currentSession.minute1,
        minute2: currentSession.minute2,
        second1: currentSession.second1,
        second2: currentSession.second2,
        timestamp: now,
        sessions
      });
    }, COUNTDOWN_INTERVAL);

    
    function easeOutQuad(t) {
      return t * (2 - t);
    }

    
    const priceUpdateInterval = setInterval(() => {
      try {
        const now = Date.now();
        Object.keys(COIN_CONFIGS).forEach((coin) => {
          if (!Array.isArray(coinData[coin])) {
            console.error(`coinData[${coin}] is not an array`);
            coinData[coin] = [];
          }
    
          const lastDataPoint = coinData[coin][coinData[coin].length - 1];
          if (!lastDataPoint || typeof lastDataPoint.price !== "number") {
            console.warn(`Invalid lastDataPoint for ${coin}:`, lastDataPoint);
            return;
          }
    
          let newPrice = null;
          let targetPrice = null;
          let timeLeftToTarget = 0;
    
          // Check ENDPOINT_DATA for each session
          for (const session of Object.keys(GAME_SESSIONS)) {
            const endpointData = ENDPOINT_DATA[session];
            if (endpointData?.endPrices?.[coin] && endpointData.timestamp) {
              const timeSinceTargetSet = now - endpointData.timestamp;
              
              if (timeSinceTargetSet <= 10000) {
                targetPrice = parseFloat(endpointData.endPrices[coin]);
                timeLeftToTarget = 10000 - timeSinceTargetSet;
                
                if (timeSinceTargetSet >= 9000) {
                  newPrice = targetPrice;
                } else {
                  const direction = targetPrice > lastDataPoint.price ? 1 : -1;
                  const priceDifference = Math.abs(targetPrice - lastDataPoint.price);
                  const progress = timeSinceTargetSet / 9000;
    
                  // Enhanced volatility parameters
                  const baseVolatility = priceDifference * 0.1; // Increased base volatility
                  const timeBasedVolatility = (1 - progress) * baseVolatility * 3;
                  
                  // Multi-frequency oscillations with more pronounced movements
                  const highFreq = Math.sin(now * 0.03) * (timeBasedVolatility * 0.4);
                  const midFreq = Math.sin(now * 0.008) * (timeBasedVolatility * 0.7);
                  const lowFreq = Math.sin(now * 0.0015) * (timeBasedVolatility * 0.5);
                  
                  // More aggressive random jitter
                  const jitter = (Math.random() - 0.5) * timeBasedVolatility * 0.8;
                  
                  // Combine all oscillation components
                  const combinedOscillation = highFreq + midFreq + lowFreq + jitter;
    
                  // Dynamic trend progression with stronger oscillations
                  const trendStrength = 0.15 + (Math.abs(combinedOscillation)/priceDifference * 0.2);
                  const baseMovement = lastDataPoint.price + (direction * priceDifference * trendStrength);
    
                  // Apply the oscillations with momentum effect
                  newPrice = baseMovement + combinedOscillation * (1.2 - progress * 0.5);
    
                  // Special 7th second handling - ensure we cross start price
                  if (timeSinceTargetSet >= 7000 && timeSinceTargetSet < 8000) {
                    const seventhSecondTarget = lastDataPoint.price + 
                      (priceDifference * direction * (1.2 + (Math.random() * 0.3 - 0.15)));
                    
                    if (timeSinceTargetSet < 7000) {
                      // Build up to the 7th second crossing
                      const progressTo7thSec = timeSinceTargetSet / 7000;
                      const overshootFactor = 1.3; // Ensures we'll cross the start price
                      newPrice = lastDataPoint.price + 
                        ((seventhSecondTarget * overshootFactor) - lastDataPoint.price) * 
                        Math.pow(progressTo7thSec, 0.7);
                    } else {
                      // After 7th second, pull back toward target
                      const progressAfter7thSec = (timeSinceTargetSet - 7000) / 2000;
                      newPrice = seventhSecondTarget + 
                        (targetPrice - seventhSecondTarget) * easeOutQuad(progressAfter7thSec);
                    }
                  }
    
                  // Smart bounding that allows for larger swings
                  const maxDeviation = priceDifference * (0.7 + progress * 0.3);
                  if ((direction > 0 && (newPrice > targetPrice + maxDeviation || newPrice < lastDataPoint.price - maxDeviation * 0.8)) || 
                      (direction < 0 && (newPrice < targetPrice - maxDeviation || newPrice > lastDataPoint.price + maxDeviation * 0.8))) {
                    // When out of bounds, pull back but preserve some oscillation
                    newPrice = lastDataPoint.price + 
                      (targetPrice - lastDataPoint.price) * (0.1 + Math.abs(combinedOscillation)/priceDifference * 0.1) +
                      combinedOscillation * 0.3;
                  }
                }
                break;
              }
            }
          }
    
          // Fall back to random price if no active convergence
          if (newPrice === null) {
            newPrice = generateNewPrice(lastDataPoint.price, coin, now);
          }
    
          // Validate and store
          if (typeof newPrice !== "number" || isNaN(newPrice)) {
            console.error(`Invalid price for ${coin}:`, newPrice);
            return;
          }
          coinData[coin].push({ timestamp: now, price: newPrice });
    
          // Prune old data
          if (coinData[coin].length > 86400) {
            coinData[coin].shift();
          }
        });
    
        // Emit updates (unchanged)
        const sessions = Object.fromEntries(
          Object.entries(GAME_SESSIONS).map(([session, data]) => [
            session,
            {
              active: data.currentEndPoint !== null,
              price: data.currentEndPoint?.price || null,
              timeLeft: data.currentEndPoint ? 
                Math.max(0, data.currentEndPoint.startTime + data.duration - now) : null,
            },
          ])
        );
    
        io.emit("priceUpdate", {
          timestamp: now,
          prices: Object.fromEntries(
            Object.keys(COIN_CONFIGS).map((coin) => [
              coin, 
              coinData[coin][coinData[coin].length - 1]?.price || null
            ])
          ),
          sessions,
        });
      } catch (err) {
        console.error("Error in price update:", err);
      }
    }, 1000);
    
    
    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.emit("initialData", {
        coins: coinData,
        sessions: Object.fromEntries(
          Object.entries(GAME_SESSIONS).map(([session, data]) => [
            session,
            {
              active: data.currentEndPoint !== null,
              price: data.currentEndPoint?.price || null,
              timeLeft: data.currentEndPoint ? Math.max(0, data.currentEndPoint.startTime + data.duration - Date.now()) : null,
            },
          ])
        ),
      });

      socket.on("getStartPoint", (data) => {
        const session = data?.session || "1min";
        handleGetStartPoint(session, socket);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });

    // Start point handling
    const startPoints = {
      "1min": {},
      "3min": {},
      "5min": {},
      "10min": {},
    };

    function handleGetStartPoint(session, socket) {
      try {
        const sessionConfig = GAME_SESSIONS[session];
        if (!sessionConfig) {
          throw new Error(`Session ${session} not configured`);
        }

        const points = {};
        const now = Date.now();

        Object.keys(COIN_CONFIGS).forEach((coin) => {
          const coinHistory = coinData[coin];
          if (!coinHistory || coinHistory.length === 0) {
            console.warn(`No data available for ${coin}`);
            return;
          }

          const latest = coinHistory[coinHistory.length - 1];
          if (!latest || !latest.price) {
            console.warn(`Invalid price data for ${coin}`);
            return;
          }

          startPoints[session][coin] = {
            price: latest.price,
            timestamp: now,
          };

          points[coin] = {
            price: latest.price,
            timestamp: now,
            sessionDuration: sessionConfig.duration,
          };
        });

        if (socket) {
          socket.emit("startPointsData", {
            session,
            points,
            serverTime: now,
          });
        }

        io.emit("sessionUpdate", {
          type: "START_POINTS",
          session,
          data: points,
        });

        return points;
      } catch (error) {
        console.error(`[${session}] Start point error:`, error);
        if (socket) {
          socket.emit("startPointError", {
            session,
            error: error.message,
          });
        }
        return null;
      }
    }

    // Start point cron jobs
    cron.schedule("1 * * * * *", () => {
      const session = "1min";
      const points = handleGetStartPoint(session);
      GAME_SESSIONS[session].currentStartPoints = points;
      // console.log(`[CRON] ${session} start points ready`, points);
    });

    cron.schedule("1 */3 * * * *", () => {
      const session = "3min";
      const points = handleGetStartPoint(session);
      GAME_SESSIONS[session].currentStartPoints = points;
      // console.log(`[CRON] ${session} start points ready`, points);
    });

    cron.schedule("1 */5 * * * *", () => {
      const session = "5min";
      const points = handleGetStartPoint(session);
      GAME_SESSIONS[session].currentStartPoints = points;
      // console.log(`[CRON] ${session} start points ready`, points);
    });

    cron.schedule("1 */10 * * * *", () => {
      const session = "10min";
      const points = handleGetStartPoint(session);
      GAME_SESSIONS[session].currentStartPoints = points;
      // console.log(`[CRON] ${session} start points ready`, points);
    });

    process.on("SIGTERM", () => {
      clearInterval(priceUpdateInterval);
      server.close();
    });

    process.on("SIGINT", () => {
      clearInterval(priceUpdateInterval);
      server.close();
    });

    server.listen(port, () => {
      console.log(`Connected successfully at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Error during initialization:", err);
    process.exit(1);
  }
}

initialize();