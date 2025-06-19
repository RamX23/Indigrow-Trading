import connection from "../config/connectDB.js";

// Helper function to get time ranges
const getTimeRanges = () => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  
  return { now, todayStart, weekStart, monthStart, yearStart };
};

const getUserByToken = async (token) => {
  const [rows] = await connection.query(
    "SELECT * FROM users WHERE `token` = ?",
    [token]
  );
  return rows.length > 0 ? rows[0] : null;
};

const getStatsByGame = async (req, res) => {
  const { now } = getTimeRanges();
  
  try {
    const user = await getUserByToken(req.cookies.auth);
    if (!user) {
      return res.status(200).json({
        message: "User not found",
        status: false,
        timeStamp: now,
      });
    }

    const [totalBets] = await connection.query(
      `SELECT game, COUNT(*) AS total 
       FROM minutes_2 WHERE code = ? GROUP BY game`,
      [user.code]
    );

    const [betsWon] = await connection.query(
      `SELECT game, COUNT(*) AS won 
       FROM minutes_2 WHERE code = ? AND result = bet GROUP BY game`,
      [user.code]
    );

    const [amounts] = await connection.query(
      `SELECT game, SUM(money) AS amount 
       FROM minutes_2 WHERE code = ? GROUP BY game`,
      [user.code]
    );

    const stats = totalBets.map(gameStat => {
      const wonStat = betsWon.find(g => g.game === gameStat.game) || { won: 0 };
      const amountStat = amounts.find(g => g.game === gameStat.game) || { amount: 0 };
      
      return {
        game: gameStat.game,
        totalBets: gameStat.total,
        betsWon: wonStat.won,
        betsLost: gameStat.total - wonStat.won,
        amountSpent: amountStat.amount,
        winRate: (wonStat.won / gameStat.total) * 100 || 0
      };
    });

    return res.status(200).json({
      message: "Success",
      status: true,
      timeStamp: now,
      data: stats,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
      timeStamp: now,
    });
  }
};

const getStatsByTimePeriod = async (req, res) => {
  const { now, todayStart, weekStart, monthStart, yearStart } = getTimeRanges();
  const { period } = req.params;

  try {
    const user = await getUserByToken(req.cookies.auth);
    if (!user) {
      return res.status(200).json({
        message: "User not found",
        status: false,
        timeStamp: now,
      });
    }

    let timeCondition = "";
    switch (period) {
      case "today":
        timeCondition = `AND created_at >= '${todayStart.toISOString()}'`;
        break;
      case "week":
        timeCondition = `AND created_at >= '${weekStart.toISOString()}'`;
        break;
      case "month":
        timeCondition = `AND created_at >= '${monthStart.toISOString()}'`;
        break;
      case "year":
        timeCondition = `AND created_at >= '${yearStart.toISOString()}'`;
        break;
      default:
        timeCondition = "";
    }

    const [total] = await connection.query(
      `SELECT COUNT(*) AS total FROM minutes_2 
       WHERE code = ? ${timeCondition}`,
      [user.code]
    );

    const [won] = await connection.query(
      `SELECT COUNT(*) AS won FROM minutes_2 
       WHERE code = ? AND result = bet ${timeCondition}`,
      [user.code]
    );

    const [amount] = await connection.query(
      `SELECT SUM(money) AS amount FROM minutes_2 
       WHERE code = ? ${timeCondition}`,
      [user.code]
    );

    const stats = {
      totalBets: total[0].total || 0,
      betsWon: won[0].won || 0,
      betsLost: (total[0].total || 0) - (won[0].won || 0),
      amountSpent: amount[0].amount || 0,
      winRate: ((won[0].won || 0) / (total[0].total || 1)) * 100
    };

    return res.status(200).json({
      message: "Success",
      status: true,
      timeStamp: now,
      data: stats,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
      timeStamp: now,
    });
  }
};

const tradeController = {
  getStatsByGame,
  getStatsByTimePeriod
};

export default tradeController;