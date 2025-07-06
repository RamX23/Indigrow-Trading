import express from 'express';
import tradeController from '../controllers/tradeController.js';

const router = express.Router();

// UI Route
router.get('/', (req, res) => {
  res.render('stats', { title: 'Betting Statistics' });
});

// API Routes
router.get('/api/game-stats', tradeController.getStatsByGame);
router.get('/api/period-stats/:period', tradeController.getStatsByTimePeriod);

export default router;