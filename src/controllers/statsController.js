import connection from '../config/connectDB.js';

const statsController = {
  renderStatsPage: (req, res) => {
    try {
      res.render('stats', { title: 'Betting Statistics' });
    } catch (error) {
      console.error('Error rendering stats page:', error);
      res.status(500).send('Internal Server Error');
    }
  },

  getPeriodStats: async (req, res) => {
    try {
      const { period } = req.params;
      const userId = req.cookies.userId || req.query.userId;
      
      // Calculate date range based on period
      const dateRange = calculateDateRange(period);
      
      const [stats] = await connection.query(
        `SELECT 
          COUNT(*) as totalBets,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as betsWon,
          SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as betsLost,
          SUM(amount) as amountSpent,
          (SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as winRate
         FROM bets
         WHERE user_id = ? AND created_at >= ?`,
        [userId, dateRange.startDate]
      );

      res.json({
        success: true,
        period,
        data: stats[0] || {}
      });
      
    } catch (error) {
      console.error('Error fetching period stats:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  getStatsBreakdown: async (req, res) => {
    try {
      const userId = req.cookies.userId || req.query.userId;
      const periods = ['today', 'week', 'month', 'all'];
      const breakdown = {};

      for (const period of periods) {
        const dateRange = calculateDateRange(period);
        
        const [stats] = await connection.query(
          `SELECT 
            COUNT(*) as totalBets,
            SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as betsWon,
            SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as betsLost,
            SUM(amount) as amountSpent,
            (SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as winRate
           FROM bets
           WHERE user_id = ? AND created_at >= ?`,
          [userId, dateRange.startDate]
        );

        breakdown[period] = stats[0] || {};
      }

      res.json({
        success: true,
        data: breakdown
      });

    } catch (error) {
      console.error('Error fetching stats breakdown:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

function calculateDateRange(period) {
  const now = new Date();
  let startDate;

  switch(period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default: // all-time
      startDate = new Date(0);
  }

  return { startDate, endDate: new Date() };
}

export default statsController;