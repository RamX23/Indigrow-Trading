import moment from "moment";
import connection from "../config/connectDB.js";
import {
  REWARD_STATUS_TYPES_MAP,
  REWARD_TYPES_MAP,
} from "../constants/reward_types.js";
import { PaymentStatusMap } from "./paymentController.js";
import {
  getStartOfWeekTimestamp,
  getTimeBasedOnDate,
  getTodayStartTime,
  monthTime,
  yesterdayTime,
} from "../helpers/games.js";

function getOrdinal(n) {
  let s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const debugLog = (message, data = null) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

const getSubordinateDataByPhone = async (phone, dbConnection) => {
  try {
    debugLog(`Fetching subordinate data for phone: ${phone}`);
    
    const [[row_1]] = await dbConnection.execute(
      "SELECT COUNT(*) AS `count` FROM `recharge` WHERE `phone` = ? AND `status` = ?",
      [phone, PaymentStatusMap.SUCCESS]
    ).catch(error => handleDbError(error, 'getSubordinateDataByPhone - recharge count'));
    
    const rechargeQuantity = row_1.count || 0;
    debugLog(`Recharge quantity for ${phone}:`, rechargeQuantity);

    const [[row_2]] = await dbConnection.execute(
      "SELECT SUM(money) AS `sum` FROM `recharge` WHERE `phone` = ? AND `status` = ?",
      [phone, PaymentStatusMap.SUCCESS]
    ).catch(error => handleDbError(error, 'getSubordinateDataByPhone - recharge sum'));
    
    const rechargeAmount = row_2.sum || 0;
    debugLog(`Recharge amount for ${phone}:`, rechargeAmount);

    const [[row_3]] = await dbConnection.execute(
      "SELECT SUM(money) AS `sum` FROM `recharge` WHERE `phone` = ? AND `status` = ? ORDER BY id LIMIT 1",
      [phone, PaymentStatusMap.SUCCESS]
    ).catch(error => handleDbError(error, 'getSubordinateDataByPhone - first recharge'));
    
    const firstRechargeAmount = row_3.sum || 0;
    debugLog(`First recharge amount for ${phone}:`, firstRechargeAmount);

    const [gameWingo] = await dbConnection.query(
      "SELECT SUM(money) as totalBettingAmount FROM minutes_1 WHERE phone = ?",
      [phone]
    ).catch(error => handleDbError(error, 'getSubordinateDataByPhone - gameWingo'));
    
    const gameWingoBettingAmount = gameWingo[0].totalBettingAmount || 0;

    const [gameK3] = await dbConnection.query(
      "SELECT SUM(money) as totalBettingAmount FROM result_k3 WHERE phone = ?",
      [phone]
    ).catch(error => handleDbError(error, 'getSubordinateDataByPhone - gameK3'));
    
    const gameK3BettingAmount = gameK3[0].totalBettingAmount || 0;

    const [game5D] = await dbConnection.query(
      "SELECT SUM(money) as totalBettingAmount FROM result_5d WHERE phone = ?",
      [phone]
    ).catch(error => handleDbError(error, 'getSubordinateDataByPhone - game5D'));
    
    const game5DBettingAmount = game5D[0].totalBettingAmount || 0;

    const result = {
      rechargeQuantity,
      rechargeAmount,
      firstRechargeAmount,
      bettingAmount:
        parseInt(gameWingoBettingAmount) +
        parseInt(gameK3BettingAmount) +
        parseInt(game5DBettingAmount),
    };
    
    debugLog(`Final subordinate data for ${phone}:`, result);
    return result;
  } catch (error) {
    console.error(`Error in getSubordinateDataByPhone for ${phone}:`, error);
    return {
      rechargeQuantity: 0,
      rechargeAmount: 0,
      firstRechargeAmount: 0,
      bettingAmount: 0,
    };
  }
};

const getSubordinatesListDataByCode = async (code, startDate, dbConnection) => {
  try {
    debugLog(`Fetching subordinates for code: ${code}`, { startDate });
    
    let [subordinatesList] = startDate
      ? await dbConnection.execute(
          "SELECT `code`, `phone`, `id_user`, `level`, `time` FROM `users` WHERE `invite` = ? AND time <= ?",
          [code, startDate]
        ).catch(error => handleDbError(error, 'getSubordinatesListDataByCode - with date'))
      : await dbConnection.execute(
          "SELECT `code`, `phone`, `id_user`, `level`, `time` FROM `users` WHERE `invite` = ?",
          [code]
        ).catch(error => handleDbError(error, 'getSubordinatesListDataByCode - without date'));

    debugLog(`Found ${subordinatesList.length} subordinates for code ${code}`);

    let subordinatesCount = subordinatesList.length;
    let subordinatesRechargeQuantity = 0;
    let subordinatesRechargeAmount = 0;
    let subordinatesWithDepositCount = 0;
    let subordinatesFirstDepositAmount = 0;
    let subordinatesWithBettingCount = 0;
    let subordinatesBettingAmount = 0;

    for (let index = 0; index < subordinatesList.length; index++) {
      const subordinate = subordinatesList[index];
      debugLog(`Processing subordinate ${index + 1}/${subordinatesList.length}`, subordinate);
      
      const {
        rechargeQuantity,
        rechargeAmount,
        bettingAmount,
        firstRechargeAmount,
      } = await getSubordinateDataByPhone(subordinate.phone, dbConnection);

      subordinatesRechargeQuantity += parseInt(rechargeQuantity) || 0;
      subordinatesRechargeAmount += parseInt(rechargeAmount) || 0;
      subordinatesList[index]["rechargeQuantity"] = parseInt(rechargeQuantity) || 0;
      subordinatesList[index]["rechargeAmount"] = parseInt(rechargeAmount) || 0;
      subordinatesList[index]["bettingAmount"] = parseInt(bettingAmount) || 0;
      subordinatesList[index]["firstRechargeAmount"] = parseInt(firstRechargeAmount) || 0;
      subordinatesList[index]["level"] = subordinatesList[index]["level"] || 0;
      subordinatesList[index]["commission"] = subordinatesList[index]["commission"] || 0;
      subordinatesWithBettingCount += parseInt(bettingAmount) > 0 ? 1 : 0;
      subordinatesBettingAmount += parseInt(bettingAmount);
      subordinatesFirstDepositAmount += parseInt(firstRechargeAmount) || 0;

      if (rechargeAmount > 0) {
        subordinatesWithDepositCount++;
      }
    }

    const result = {
      subordinatesList,
      subordinatesCount,
      subordinatesRechargeQuantity,
      subordinatesRechargeAmount,
      subordinatesWithDepositCount,
      subordinatesWithBettingCount,
      subordinatesBettingAmount,
      subordinatesFirstDepositAmount,
    };
    
    debugLog(`Final subordinates data for code ${code}:`, result);
    return result;
  } catch (error) {
    console.error(`Error in getSubordinatesListDataByCode for code ${code}:`, error);
    return {
      subordinatesList: [],
      subordinatesCount: 0,
      subordinatesRechargeQuantity: 0,
      subordinatesRechargeAmount: 0,
      subordinatesWithDepositCount: 0,
      subordinatesWithBettingCount: 0,
      subordinatesBettingAmount: 0,
      subordinatesFirstDepositAmount: 0,
    };
  }
};

const getOneLevelTeamSubordinatesData = async (directSubordinatesList, dbConnection) => {
  try {
    debugLog('Processing one level team subordinates', { count: directSubordinatesList.length });
    
    let oneLevelTeamSubordinatesCount = 0;
    let oneLevelTeamSubordinatesRechargeQuantity = 0;
    let oneLevelTeamSubordinatesRechargeAmount = 0;
    let oneLevelTeamSubordinatesWithDepositCount = 0;
    let oneLevelTeamSubordinatesList = [];

    for (const directSubordinate of directSubordinatesList) {
      debugLog(`Processing subordinate: ${directSubordinate.phone}`);
      const indirectSubordinatesData = await getSubordinatesListDataByCode(
        directSubordinate.code,
        null,
        dbConnection
      );
      
      oneLevelTeamSubordinatesList = [
        ...oneLevelTeamSubordinatesList,
        ...indirectSubordinatesData.subordinatesList,
      ];
      oneLevelTeamSubordinatesCount += indirectSubordinatesData.subordinatesCount;
      oneLevelTeamSubordinatesRechargeQuantity += indirectSubordinatesData.subordinatesRechargeQuantity;
      oneLevelTeamSubordinatesRechargeAmount += indirectSubordinatesData.subordinatesRechargeAmount;
      oneLevelTeamSubordinatesWithDepositCount += indirectSubordinatesData.subordinatesWithDepositCount;
    }

    const result = {
      oneLevelTeamSubordinatesCount,
      oneLevelTeamSubordinatesRechargeQuantity,
      oneLevelTeamSubordinatesRechargeAmount,
      oneLevelTeamSubordinatesWithDepositCount,
      oneLevelTeamSubordinatesList,
    };
    
    debugLog('Final one level team subordinates data:', result);
    return result;
  } catch (error) {
    console.error('Error in getOneLevelTeamSubordinatesData:', error);
    return {
      oneLevelTeamSubordinatesCount: 0,
      oneLevelTeamSubordinatesRechargeQuantity: 0,
      oneLevelTeamSubordinatesRechargeAmount: 0,
      oneLevelTeamSubordinatesWithDepositCount: 0,
      oneLevelTeamSubordinatesList: [],
    };
  }
};


// const subordinatesDataAPI = async (req, res) => {
//   try {
//       const authToken = req.cookies.auth;
//       const [userRow] = await connection.execute("SELECT `code`, `invite` FROM `users` WHERE `token` = ? AND `veri` = 1", [authToken]);
//       const user = userRow?.[0];

//       if (!user) {
//          return res.status(401).json({ message: "Unauthorized" });
//       }

//       const directSubordinatesData = await getSubordinatesListDataByCode(user.code);

//       let directSubordinatesCount = directSubordinatesData.subordinatesCount;
//       let directSubordinatesRechargeQuantity = directSubordinatesData.subordinatesRechargeQuantity;
//       let directSubordinatesRechargeAmount = directSubordinatesData.subordinatesRechargeAmount;
//       let directSubordinatesWithDepositCount = directSubordinatesData.subordinatesWithDepositCount;

//       const directSubordinatesList = directSubordinatesData.subordinatesList;

//       let teamSubordinatesCount = directSubordinatesCount;
//       let teamSubordinatesRechargeQuantity = directSubordinatesRechargeQuantity;
//       let teamSubordinatesRechargeAmount = directSubordinatesRechargeAmount;
//       let teamSubordinatesWithDepositCount = directSubordinatesWithDepositCount;

//       let tempSubordinatesList = directSubordinatesList;

//       for (let index = 0; index < 10; index++) {
//          const element = await getOneLevelTeamSubordinatesData(tempSubordinatesList);

//          tempSubordinatesList = element.oneLevelTeamSubordinatesList;
//          teamSubordinatesCount += element.oneLevelTeamSubordinatesCount;
//          teamSubordinatesRechargeQuantity += element.oneLevelTeamSubordinatesRechargeQuantity;
//          teamSubordinatesRechargeAmount += element.oneLevelTeamSubordinatesRechargeAmount;
//          teamSubordinatesWithDepositCount += element.oneLevelTeamSubordinatesWithDepositCount;
//       }

//       return res.status(200).json({
//          data: {
//             directSubordinatesCount,
//             directSubordinatesRechargeQuantity,
//             directSubordinatesRechargeAmount,
//             directSubordinatesWithDepositCount,
//             teamSubordinatesCount,
//             teamSubordinatesRechargeQuantity,
//             teamSubordinatesRechargeAmount,
//             teamSubordinatesWithDepositCount,
//          },
//       });
//   } catch (error) {
//       console.log(error);
//       return res.status(500).json({ message: error.message });
//   }
// };
const createInviteMap = (rows) => {
  const inviteMap = {};
  rows.forEach((user) => {
    if (!inviteMap[user.invite]) {
      inviteMap[user.invite] = [];
    }
    inviteMap[user.invite].push(user);
  });
  return inviteMap;
};

const getLevelUsers = (inviteMap, userCode, currentLevel, maxLevel) => {
  if (currentLevel > maxLevel) return [];

  const levelUsers = inviteMap[userCode] || [];
  if (levelUsers.length === 0) return [];
  return levelUsers.flatMap((user) => [
    { ...user, user_level: currentLevel },
    ...getLevelUsers(inviteMap, user.code, currentLevel + 1, maxLevel),
  ]);
};

const getUserLevels = (rows, userCode, maxLevel = 10) => {
  const inviteMap = createInviteMap(rows);
  const usersByLevels = getLevelUsers(inviteMap, userCode, 1, maxLevel);
  return { usersByLevels, level1Referrals: inviteMap[userCode] || [] };
};

const userStats = async (startTime, endTime, phone = "", dbConnection) => {
  try {
    debugLog('Fetching user stats', { startTime, endTime, phone });
    
    if (!dbConnection) {
      throw new Error('Database connection not provided');
    }

    const [rows] = await dbConnection.query(
      `
      SELECT
          u.phone,
          u.invite,
          u.code,
          u.time,
          u.id_user,
          COALESCE(r.total_deposit_amount, 0) AS total_deposit_amount,
          COALESCE(r.total_deposit_number, 0) AS total_deposit_number,
          COALESCE(m.total_bets, 0) AS total_bets,
          COALESCE(m.total_bet_amount, 0) AS total_bet_amount,
          COALESCE(c.total_commission, 0) AS total_commission
      FROM
          users u
      LEFT JOIN (
          SELECT
              phone,
              SUM(CASE WHEN status = 1 THEN COALESCE(money, 0) ELSE 0 END) AS total_deposit_amount,
              COUNT(CASE WHEN status = 1 THEN phone ELSE NULL END) AS total_deposit_number
          FROM recharge
          WHERE time > ? AND time < ?
          GROUP BY phone
      ) r ON u.phone = r.phone
      LEFT JOIN (
          SELECT 
              phone,
              SUM(total_bet_amount) AS total_bet_amount,
              SUM(total_bets) AS total_bets
          FROM (
              SELECT 
                  phone,
                  SUM(money + fee) AS total_bet_amount,
                  COUNT(*) AS total_bets
              FROM minutes_1
              WHERE time >= ? AND time <= ?
              GROUP BY phone
              UNION ALL
              SELECT 
                  phone,
                  SUM(money + fee) AS total_bet_amount,
                  COUNT(*) AS total_bets
              FROM trx_wingo_bets
              WHERE time >= ? AND time <= ?
              GROUP BY phone
          ) AS combined
          GROUP BY phone
      ) m ON u.phone = m.phone
      LEFT JOIN (
          SELECT
              from_user_phone AS phone,
              SUM(money) AS total_commission
          FROM commissions
          WHERE time > ? AND time <= ? AND phone = ?
          GROUP BY from_user_phone
      ) c ON u.phone = c.phone
      GROUP BY
          u.phone, u.invite, u.code, u.time, u.id_user
      ORDER BY
          u.time DESC;
      `,
      [
        startTime,
        endTime,
        startTime,
        endTime,
        startTime,
        endTime,
        startTime,
        endTime,
        phone,
      ]
    ).catch(error => {
      throw new Error(`Database query failed: ${error.message}`);
    });

    debugLog('User stats query results:', { count: rows.length });
    return rows;
  } catch (error) {
    console.error('Error in userStats:', error);
    throw error; // Re-throw to be handled by caller
  }
};



const getCommissionStatsByTime = async (time, phone, dbConnection) => {
  try {
    debugLog('Fetching commission stats by time', { time, phone });
    
    const { startOfYesterdayTimestamp, endOfYesterdayTimestamp } = yesterdayTime();
    
    const [commissionRow] = await dbConnection.execute(
      `
      SELECT
          SUM(COALESCE(c.money, 0)) AS total_commission,
          SUM(CASE 
              WHEN c.time >= ? 
              THEN COALESCE(c.money, 0)
              ELSE 0 
          END) AS last_week_commission,
          SUM(CASE 
              WHEN c.time > ? AND c.time <= ?
              THEN COALESCE(c.money, 0)
              ELSE 0 
          END) AS yesterday_commission
      FROM
          commissions c
      WHERE
          c.phone = ?
      `,
      [time, startOfYesterdayTimestamp, endOfYesterdayTimestamp, phone]
    ).catch(error => handleDbError(error, 'getCommissionStatsByTime'));

    const result = commissionRow?.[0] || {};
    debugLog('Commission stats results:', result);
    return result;
  } catch (error) {
    console.error('Error in getCommissionStatsByTime:', error);
    return {};
  }
};




const subordinatesDataAPI = async (req, res) => {
  let dbConnection;
  try {
    const authToken = req.cookies.auth;
    debugLog('Starting subordinatesDataAPI', { authToken: authToken ? 'exists' : 'missing' });

    // Get connection from pool
    dbConnection = await connection.getConnection();
    debugLog('Database connection established');

    // Fetch user by auth token
    const [userRow] = await dbConnection.execute(
      "SELECT * FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken]
    ).catch(error => handleDbError(error, 'subordinatesDataAPI - user fetch'));
    
    const user = userRow?.[0];
    if (!user) {
      debugLog('Unauthorized access attempt');
      return res.status(401).json({ message: "Unauthorized" });
    }

    debugLog('User found', { phone: user.phone, code: user.code });

    // Check for unprocessed override for this user
    const [overrideRow] = await dbConnection.execute(
      "SELECT * FROM subordinate_overrides WHERE user_phone = ? AND processed = 0 ORDER BY id DESC LIMIT 1",
      [user.phone]
    ).catch(error => handleDbError(error, 'subordinatesDataAPI - override check'));
    
    const override = overrideRow?.[0];
    debugLog('Override check result', { hasOverride: !!override });

    // If override exists, apply it to the original data and mark as processed
    if (override) {
      try {
        let overrideData;
        try {
          overrideData = typeof override.data === 'string' ? JSON.parse(override.data) : override.data;
          debugLog('Override data parsed', overrideData);
        } catch (parseError) {
          console.error('Error parsing override data:', parseError);
          throw new Error('Invalid override data format');
        }

        // Start transaction
        await dbConnection.query("START TRANSACTION");
        debugLog('Transaction started for override processing');

        try {
          // First check if record exists in subordinate_data
          const [existingData] = await dbConnection.execute(
            "SELECT id FROM subordinate_data WHERE user_phone = ?",
            [user.phone]
          ).catch(error => handleDbError(error, 'subordinatesDataAPI - existing data check'));

          if (existingData.length > 0) {
            debugLog('Updating existing subordinate_data record');
            await dbConnection.execute(
              `UPDATE subordinate_data SET
                direct_subordinates_count = ?,
                no_of_registered_subordinates = ?,
                direct_subordinates_recharge_quantity = ?,
                direct_subordinates_recharge_amount = ?,
                direct_subordinates_with_deposit_count = ?,
                team_subordinates_count = ?,
                no_of_register_all_subordinates = ?,
                team_subordinates_recharge_quantity = ?,
                team_subordinates_recharge_amount = ?,
                team_subordinates_with_deposit_count = ?,
                total_commissions = ?,
                total_commissions_this_week = ?,
                total_commissions_yesterday = ?,
                last_updated = NOW()
              WHERE user_phone = ?`,
              [
                overrideData.directSubordinatesCount,
                overrideData.noOfRegisteredSubordinates,
                overrideData.directSubordinatesRechargeQuantity,
                overrideData.directSubordinatesRechargeAmount,
                overrideData.directSubordinatesWithDepositCount,
                overrideData.teamSubordinatesCount,
                overrideData.noOfRegisterAllSubordinates,
                overrideData.teamSubordinatesRechargeQuantity,
                overrideData.teamSubordinatesRechargeAmount,
                overrideData.teamSubordinatesWithDepositCount,
                overrideData.totalCommissions,
                overrideData.totalCommissionsThisWeek,
                overrideData.totalCommissionsYesterday,
                user.phone
              ]
            ).catch(error => handleDbError(error, 'subordinatesDataAPI - update existing data'));
          } else {
            debugLog('Inserting new subordinate_data record');
            await dbConnection.execute(
              `INSERT INTO subordinate_data (
                user_phone, direct_subordinates_count, no_of_registered_subordinates,
                direct_subordinates_recharge_quantity, direct_subordinates_recharge_amount,
                direct_subordinates_with_deposit_count, team_subordinates_count,
                no_of_register_all_subordinates, team_subordinates_recharge_quantity,
                team_subordinates_recharge_amount, team_subordinates_with_deposit_count,
                total_commissions, total_commissions_this_week, total_commissions_yesterday,
                last_updated
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
              [
                user.phone,
                overrideData.directSubordinatesCount,
                overrideData.noOfRegisteredSubordinates,
                overrideData.directSubordinatesRechargeQuantity,
                overrideData.directSubordinatesRechargeAmount,
                overrideData.directSubordinatesWithDepositCount,
                overrideData.teamSubordinatesCount,
                overrideData.noOfRegisterAllSubordinates,
                overrideData.teamSubordinatesRechargeQuantity,
                overrideData.teamSubordinatesRechargeAmount,
                overrideData.teamSubordinatesWithDepositCount,
                overrideData.totalCommissions,
                overrideData.totalCommissionsThisWeek,
                overrideData.totalCommissionsYesterday
              ]
            ).catch(error => handleDbError(error, 'subordinatesDataAPI - insert new data'));
          }

          // Mark the override as processed
          await dbConnection.execute(
            "UPDATE subordinate_overrides SET processed = 1 WHERE id = ?",
            [override.id]
          ).catch(error => handleDbError(error, 'subordinatesDataAPI - mark override processed'));

          // Commit transaction
          await dbConnection.query("COMMIT");
          debugLog('Override data applied and marked as processed');

          return res.status(200).json({ 
            data: overrideData, 
            source: "override (permanent)" 
          });
        } catch (error) {
          // Rollback transaction if any error occurs
          await dbConnection.query("ROLLBACK");
          debugLog('Transaction rolled back due to error', { error: error.message });
          throw error;
        }
      } catch (e) {
        console.error("Error applying override:", e);
        debugLog('Continuing with original values after override failure');
        // Continue to compute original values if override fails
      }
    }

    // --- Fetch original values from database ---
    const [originalDataRow] = await dbConnection.execute(
      "SELECT * FROM subordinate_data WHERE user_phone = ?",
      [user.phone]
    ).catch(error => handleDbError(error, 'subordinatesDataAPI - fetch original data'));
    
    const originalData = originalDataRow?.[0];
    debugLog('Existing subordinate_data record', originalData);

    if (originalData) {
      // Return existing data from database
      debugLog('Returning existing data from database');
      return res.status(200).json({
        data: {
          directSubordinatesCount: originalData.direct_subordinates_count,
          noOfRegisteredSubordinates: originalData.no_of_registered_subordinates,
          directSubordinatesRechargeQuantity: originalData.direct_subordinates_recharge_quantity,
          directSubordinatesRechargeAmount: originalData.direct_subordinates_recharge_amount,
          directSubordinatesWithDepositCount: originalData.direct_subordinates_with_deposit_count,
          teamSubordinatesCount: originalData.team_subordinates_count,
          noOfRegisterAllSubordinates: originalData.no_of_register_all_subordinates,
          teamSubordinatesRechargeQuantity: originalData.team_subordinates_recharge_quantity,
          teamSubordinatesRechargeAmount: originalData.team_subordinates_recharge_amount,
          teamSubordinatesWithDepositCount: originalData.team_subordinates_with_deposit_count,
          totalCommissions: originalData.total_commissions,
          totalCommissionsThisWeek: originalData.total_commissions_this_week,
          totalCommissionsYesterday: originalData.total_commissions_yesterday,
        },
        source: "database",
      });
    }

    // --- Compute original values if no data exists in database ---
    debugLog('No existing data found, computing fresh values');
    const startOfWeek = getStartOfWeekTimestamp();
    const { startOfYesterdayTimestamp, endOfYesterdayTimestamp } = yesterdayTime();

    debugLog('Fetching commission stats');
    const commissions = await getCommissionStatsByTime(startOfWeek, user.phone, dbConnection);

    debugLog('Fetching user stats');
    const userStatsData = await userStats(startOfYesterdayTimestamp, endOfYesterdayTimestamp, user.phone, dbConnection);
    
    debugLog('Calculating user levels');
    const { usersByLevels = [], level1Referrals = [] } = getUserLevels(userStatsData, user.code);

    debugLog('Calculating direct subordinates metrics');
    const directSubordinatesCount = level1Referrals.length;
    const noOfRegisteredSubordinates = level1Referrals.filter(
      (user) => user.time >= startOfYesterdayTimestamp
    ).length;
    const directSubordinatesRechargeQuantity = level1Referrals.reduce(
      (acc, curr) => acc + curr.total_deposit_number,
      0
    );
    const directSubordinatesRechargeAmount = level1Referrals.reduce(
      (acc, curr) => acc + +curr.total_deposit_amount,
      0
    );
    const directSubordinatesWithDepositCount = level1Referrals.filter(
      (user) => user.total_deposit_number > 0
    ).length;

    debugLog('Calculating team subordinates metrics');
    const teamSubordinatesCount = usersByLevels.length;
    const noOfRegisterAllSubordinates = usersByLevels.filter(
      (user) => user.time >= startOfYesterdayTimestamp
    ).length;
    const teamSubordinatesRechargeQuantity = usersByLevels.reduce(
      (acc, curr) => acc + curr.total_deposit_number,
      0
    );
    const teamSubordinatesRechargeAmount = usersByLevels.reduce(
      (acc, curr) => acc + +curr.total_deposit_amount,
      0
    );
    const teamSubordinatesWithDepositCount = usersByLevels.filter(
      (user) => user.total_deposit_number > 0
    ).length;

    const totalCommissions = commissions?.total_commission || 0;
    const totalCommissionsThisWeek = commissions?.last_week_commission || 0;
    const totalCommissionsYesterday = commissions?.yesterday_commission || 0;

    // Save computed data to database for future use
    const computedData = {
      directSubordinatesCount,
      noOfRegisteredSubordinates,
      directSubordinatesRechargeQuantity,
      directSubordinatesRechargeAmount,
      directSubordinatesWithDepositCount,
      teamSubordinatesCount,
      noOfRegisterAllSubordinates,
      teamSubordinatesRechargeQuantity,
      teamSubordinatesRechargeAmount,
      teamSubordinatesWithDepositCount,
      totalCommissions,
      totalCommissionsThisWeek,
      totalCommissionsYesterday,
    };

    debugLog('Computed data ready for saving', computedData);

    try {
      await dbConnection.execute(
        `INSERT INTO subordinate_data (
          user_phone, direct_subordinates_count, no_of_registered_subordinates,
          direct_subordinates_recharge_quantity, direct_subordinates_recharge_amount,
          direct_subordinates_with_deposit_count, team_subordinates_count,
          no_of_register_all_subordinates, team_subordinates_recharge_quantity,
          team_subordinates_recharge_amount, team_subordinates_with_deposit_count,
          total_commissions, total_commissions_this_week, total_commissions_yesterday,
          last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          direct_subordinates_count = VALUES(direct_subordinates_count),
          no_of_registered_subordinates = VALUES(no_of_registered_subordinates),
          direct_subordinates_recharge_quantity = VALUES(direct_subordinates_recharge_quantity),
          direct_subordinates_recharge_amount = VALUES(direct_subordinates_recharge_amount),
          direct_subordinates_with_deposit_count = VALUES(direct_subordinates_with_deposit_count),
          team_subordinates_count = VALUES(team_subordinates_count),
          no_of_register_all_subordinates = VALUES(no_of_register_all_subordinates),
          team_subordinates_recharge_quantity = VALUES(team_subordinates_recharge_quantity),
          team_subordinates_recharge_amount = VALUES(team_subordinates_recharge_amount),
          team_subordinates_with_deposit_count = VALUES(team_subordinates_with_deposit_count),
          total_commissions = VALUES(total_commissions),
          total_commissions_this_week = VALUES(total_commissions_this_week),
          total_commissions_yesterday = VALUES(total_commissions_yesterday),
          last_updated = NOW()`,
        [
          user.phone,
          computedData.directSubordinatesCount,
          computedData.noOfRegisteredSubordinates,
          computedData.directSubordinatesRechargeQuantity,
          computedData.directSubordinatesRechargeAmount,
          computedData.directSubordinatesWithDepositCount,
          computedData.teamSubordinatesCount,
          computedData.noOfRegisterAllSubordinates,
          computedData.teamSubordinatesRechargeQuantity,
          computedData.teamSubordinatesRechargeAmount,
          computedData.teamSubordinatesWithDepositCount,
          computedData.totalCommissions,
          computedData.totalCommissionsThisWeek,
          computedData.totalCommissionsYesterday,
        ]
      ).catch(error => handleDbError(error, 'subordinatesDataAPI - save computed data'));

      debugLog('Computed data saved to database');
    } catch (saveError) {
      console.error('Error saving computed data:', saveError);
      // Continue to return the data even if save fails
    }

    return res.status(200).json({
      data: computedData,
      source: "computed",
    });
  } catch (error) {
    console.error('Error in subordinatesDataAPI:', error);
    return res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Make sure to release the connection back to the pool
    if (dbConnection) {
      try {
        await dbConnection.release();
        debugLog('Database connection released');
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
};



const adminOverrideSubordinates = async (req, res) => {
  try {
    const { userPhone, overrideData } = req.body;

    if (!userPhone || !overrideData) {
      return res.status(400).json({ message: "userPhone and overrideData required" });
    }

    // Check admin auth here (e.g. req.user.role === 'admin')
    // Skipping auth code for brevity

    const now = new Date();

    // Upsert override data for this user (insert or update)
    await connection.execute(
      `INSERT INTO subordinate_overrides (user_phone, data, overridden_at) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE data = VALUES(data), overridden_at = VALUES(overridden_at)`,
      [userPhone, JSON.stringify(overrideData), now]
    );

    subordinatesDataAPI();
    return res.status(200).json({ message: "Override saved successfully" });
  } catch (error) {
    console.error("Error in adminOverrideSubordinates:", error);
    return res.status(500).json({ message: error.message });
  }
};



const subordinatesDataByTimeAPI = async (req, res) => {
  let dbConnection;
  try {
    const authToken = req.cookies.auth;
    
    // Get database connection
    dbConnection = await connection.getConnection();
    
    const [userRow] = await dbConnection.execute(
      "SELECT `code`,phone, `invite` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken]
    );
    
    const user = userRow?.[0];
    const startDate = +req.query.startDate;
    const endDate = getTimeBasedOnDate(startDate);

    const searchFromUid = req.query.id || "";
    const levelFilter = req.query.level;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Pass dbConnection to userStats
    const userStatsData = await userStats(startDate, endDate, user.phone, dbConnection);
    
    const { usersByLevels = [] } = getUserLevels(userStatsData, user.code);
    
    const filteredUsers = usersByLevels.filter(
      (user) =>
        user.id_user.includes(searchFromUid) &&
        (levelFilter !== "All" ? user.user_level === +levelFilter : true)
    );

    const sortedUsersByBet = filteredUsers.sort((a, b) => b.total_bet_amount - a.total_bet_amount);

    // Rest of your processing...
    const subordinatesRechargeQuantity = filteredUsers.reduce(
      (acc, curr) => acc + curr.total_deposit_number,
      0
    );
    
    const subordinatesRechargeAmount = filteredUsers.reduce(
      (acc, curr) => acc + +curr.total_deposit_amount,
      0
    );

    const subordinatesWithBetting = filteredUsers.filter(
      (user) => user.total_bets > 0
    );
    
    const subordinatesWithBettingCount = subordinatesWithBetting.length;
    const subordinatesBettingAmount = subordinatesWithBetting
      .reduce((acc, curr) => acc + +curr.total_bet_amount, 0)
      .toFixed();

    const subordinatesWithFirstDeposit = filteredUsers.filter(
      (user) => user.total_deposit_number === 1
    );
    
    const subordinatesWithFirstDepositCount = subordinatesWithFirstDeposit.length;
    const subordinatesWithFirstDepositAmount = subordinatesWithFirstDeposit.reduce(
      (acc, curr) => acc + +curr.total_deposit_amount,
      0
    );

    // Pagination
    const paginatedUsers = sortedUsersByBet.slice(offset, offset + limit);
    const totalUsers = sortedUsersByBet.length;
    const totalPages = Math.ceil(totalUsers / limit);

    return res.json({
      status: true,
      meta: {
        totalPages,
        currentPage: page,
      },
      data: {
        usersByLevels: paginatedUsers,
        subordinatesRechargeQuantity,
        subordinatesRechargeAmount,
        subordinatesWithBettingCount,
        subordinatesBettingAmount,
        subordinatesWithFirstDepositCount,
        subordinatesWithFirstDepositAmount,
      },
      message: "Successfully fetched subordinates data",
    });
  } catch (error) {
    console.error('Error in subordinatesDataByTimeAPI:', error);
    return res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (dbConnection) {
      try {
        await dbConnection.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
};

const subordinatesAPI = async (req, res) => {
  let dbConnection;
  try {
    const authToken = req.cookies.auth;
    
    // Get database connection
    dbConnection = await connection.getConnection();
    
    const [userRow] = await dbConnection.execute(
      "SELECT `code`,phone, `invite` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken]
    );
    
    const type = req.query.type || "today";
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get time ranges
    const { startOfYesterdayTimestamp, endOfYesterdayTimestamp } = yesterdayTime();
    const { startOfMonthTimestamp, endOfMonthTimestamp } = monthTime();

    // Determine date range
    let startDate, endDate;
    switch (type) {
      case "today":
        startDate = getTodayStartTime();
        endDate = Date.now();
        break;
      case "yesterday":
        startDate = startOfYesterdayTimestamp;
        endDate = endOfYesterdayTimestamp;
        break;
      case "this month":
        startDate = startOfMonthTimestamp;
        endDate = endOfMonthTimestamp;
        break;
      default:
        return res.status(400).json({ message: "Invalid type parameter" });
    }

    // Pass dbConnection to userStats
    const userStatsData = await userStats(startDate, endDate, user.phone, dbConnection);
    const { level1Referrals } = getUserLevels(userStatsData, user.code);

    const users = level1Referrals
      .map((user) => {
        const { phone, id_user: uid, time } = user;
        const phoneFormat = phone.slice(0, 3) + "****" + phone.slice(7);
        const timeUtc = new Date(parseInt(time))
          .toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC",
          })
          .replace(",", "");
        
        return user.time >= startDate 
          ? { phone: phoneFormat, uid, time: timeUtc }
          : null;
      })
      .filter(Boolean);

    return res.status(200).json({
      status: true,
      type,
      users,
      message: "Successfully fetched subordinates data",
    });

  } catch (error) {
    console.error('Error in subordinatesAPI:', error);
    return res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (dbConnection) {
      try {
        await dbConnection.release();
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
};

const InvitationBonusList = [
  {
    id: 1,
    numberOfInvitedMembers: 3,
    numberOfDeposits: 3,
    amountOfRechargePerPerson: 555,
    bonusAmount: 199,
  },

  {
    id: 2,
    numberOfInvitedMembers: 5,
    numberOfDeposits: 5,
    amountOfRechargePerPerson: 555,
    bonusAmount: 299,
  },
  {
    id: 3,
    numberOfInvitedMembers: 10,
    numberOfDeposits: 10,
    amountOfRechargePerPerson: 1111,
    bonusAmount: 599,
  },
  {
    id: 4,
    numberOfInvitedMembers: 30,
    numberOfDeposits: 30,
    amountOfRechargePerPerson: 1111,
    bonusAmount: 1799,
  },
  {
    id: 5,
    numberOfInvitedMembers: 50,
    numberOfDeposits: 50,
    amountOfRechargePerPerson: 1111,
    bonusAmount: 2799,
  },
  {
    id: 6,
    numberOfInvitedMembers: 75,
    numberOfDeposits: 75,
    amountOfRechargePerPerson: 1555,
    bonusAmount: 4799,
  },
  {
    id: 7,
    numberOfInvitedMembers: 100,
    numberOfDeposits: 100,
    amountOfRechargePerPerson: 1555,
    bonusAmount: 6799,
  },
  {
    id: 8,
    numberOfInvitedMembers: 200,
    numberOfDeposits: 200,
    amountOfRechargePerPerson: 1555,
    bonusAmount: 12229,
  },
  {
    id: 9,
    numberOfInvitedMembers: 500,
    numberOfDeposits: 500,
    amountOfRechargePerPerson: 1777,
    bonusAmount: 33339,
  },
  {
    id: 10,
    numberOfInvitedMembers: 1000,
    numberOfDeposits: 1000,
    amountOfRechargePerPerson: 1777,
    bonusAmount: 64449,
  },
  {
    id: 11,
    numberOfInvitedMembers: 2000,
    numberOfDeposits: 2000,
    amountOfRechargePerPerson: 1777,
    bonusAmount: 122229,
  },
  {
    id: 12,
    numberOfInvitedMembers: 5000,
    numberOfDeposits: 5000,
    amountOfRechargePerPerson: 2111,
    bonusAmount: 299999,
  },
  {
    id: 13,
    numberOfInvitedMembers: 10000,
    numberOfDeposits: 10000,
    amountOfRechargePerPerson: 2555,
    bonusAmount: 999999,
  },
];

const getInvitationBonus = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `code`, `invite`, `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    console.log(user);
    if (!user) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const directSubordinatesData = await getSubordinatesListDataByCode(
      user.code,
    );

    let directSubordinatesCount = directSubordinatesData.subordinatesCount;
    let directSubordinatesRechargeAmount =
      directSubordinatesData.subordinatesRechargeAmount;

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ?",
      [REWARD_TYPES_MAP.INVITATION_BONUS, user.phone],
    );

    const invitationBonusData = InvitationBonusList.map((item) => {
      const currentNumberOfDeposits =
        directSubordinatesData.subordinatesList.filter(
          (subordinate) =>
            subordinate.rechargeAmount >= item.amountOfRechargePerPerson,
        ).length;
      return {
        id: item.id,
        isFinished:
          directSubordinatesCount >= item.numberOfInvitedMembers &&
          currentNumberOfDeposits >= item.numberOfDeposits,
        isClaimed: claimedRewardsRow.some(
          (claimedReward) => claimedReward.reward_id === item.id,
        ),
        required: {
          numberOfInvitedMembers: item.numberOfInvitedMembers,
          numberOfDeposits: item.numberOfDeposits,
          amountOfRechargePerPerson: item.amountOfRechargePerPerson,
        },
        current: {
          numberOfInvitedMembers: Math.min(
            directSubordinatesCount,
            item.numberOfInvitedMembers,
          ),
          numberOfDeposits: Math.min(
            currentNumberOfDeposits,
            item.numberOfDeposits,
          ),
          amountOfRechargePerPerson: Math.min(
            directSubordinatesRechargeAmount,
            item.amountOfRechargePerPerson,
          ),
        },
        bonusAmount: item.bonusAmount,
      };
    });

    return res.status(200).json({
      data: invitationBonusData,
      status: true,
      message: "Successfully fetched invitation bonus data",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const claimInvitationBonus = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const invitationBonusId = req.body.id;

    const [userRow] = await connection.execute(
      "SELECT `code`, `invite`, `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const directSubordinatesData = await getSubordinatesListDataByCode(
      user.code,
    );

    let directSubordinatesCount = directSubordinatesData.subordinatesCount;
    let directSubordinatesRechargeAmount =
      directSubordinatesData.subordinatesRechargeAmount;

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ?",
      [REWARD_TYPES_MAP.INVITATION_BONUS, user.phone],
    );

    const invitationBonusData = InvitationBonusList.map((item) => {
      const currentNumberOfDeposits =
        directSubordinatesData.subordinatesList.filter(
          (subordinate) =>
            subordinate.rechargeAmount >= item.amountOfRechargePerPerson,
        ).length;
      return {
        id: item.id,
        isFinished:
          directSubordinatesCount >= item.numberOfInvitedMembers &&
          currentNumberOfDeposits >= item.numberOfDeposits,
        isClaimed: claimedRewardsRow.some(
          (claimedReward) => claimedReward.reward_id === item.id,
        ),
        required: {
          numberOfInvitedMembers: item.numberOfInvitedMembers,
          numberOfDeposits: item.numberOfDeposits,
          amountOfRechargePerPerson: item.amountOfRechargePerPerson,
        },
        current: {
          numberOfInvitedMembers: Math.min(
            directSubordinatesCount,
            item.numberOfInvitedMembers,
          ),
          numberOfDeposits: Math.min(
            currentNumberOfDeposits,
            item.numberOfDeposits,
          ),
          amountOfRechargePerPerson: Math.min(
            directSubordinatesRechargeAmount,
            item.amountOfRechargePerPerson,
          ),
        },
        bonusAmount: item.bonusAmount,
      };
    });

    const claimableBonusData = invitationBonusData.filter(
      (item) => item.isFinished && item.id === invitationBonusId,
    );

    if (claimableBonusData.length === 0) {
      return res.status(400).json({
        status: false,
        message: "You does not meet the requirements to claim this reword!",
      });
    }

    const claimedRewardsData = invitationBonusData.find(
      (item) => item.isClaimed && item.id === invitationBonusId,
    );

    if (claimedRewardsData?.id === invitationBonusId) {
      return res.status(400).json({
        status: false,
        message: "Bonus already claimed",
      });
    }

    const claimedBonusData = claimableBonusData?.find(
      (item) => item.id === invitationBonusId,
    );

    const time = moment().valueOf();

    await connection.execute(
      "UPDATE `users` SET `money` = `money` + ?, `total_money` = `total_money` + ? WHERE `phone` = ?",
      [claimedBonusData.bonusAmount, claimedBonusData.bonusAmount, user.phone],
    );

    await connection.execute(
      "INSERT INTO `claimed_rewards` (`reward_id`, `type`, `phone`, `amount`, `status`, `time`) VALUES (?, ?, ?, ?, ?, ?)",
      [
        invitationBonusId,
        REWARD_TYPES_MAP.INVITATION_BONUS,
        user.phone,
        claimedBonusData.bonusAmount,
        REWARD_STATUS_TYPES_MAP.SUCCESS,
        time,
      ],
    );

    return res.status(200).json({
      status: true,
      message: "Successfully claimed invitation bonus",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const getInvitedMembers = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `code`, `invite`, `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let [invitedMembers] = await connection.execute(
      "SELECT `phone`, `time`, `id_user`, `id_user`, `name_user` FROM `users` WHERE `invite` = ?",
      [user.code],
    );

    for (let index = 0; index < invitedMembers.length; index++) {
      const invitedMember = invitedMembers[index];

      const [[row_2]] = await connection.execute(
        "SELECT SUM(money) AS `sum` FROM `recharge` WHERE `phone` = ? AND `status` = ?",
        [invitedMember.phone, PaymentStatusMap.SUCCESS],
      );
      const rechargeAmount = row_2.sum;

      invitedMembers[index]["rechargeAmount"] = rechargeAmount;
    }

    return res.status(200).json({
      data: invitedMembers.map((invitedMember) => ({
        uid: invitedMember.id_user,
        phone: invitedMember.phone,
        create_time: moment(invitedMember.time, "x").format(
          "YYYY-MM-DD HH:mm:ss",
        ),
        amount: invitedMember.rechargeAmount,
        username: invitedMember.name_user,
      })),
      status: true,
      message: "Successfully fetched invited members",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const DailyRechargeBonusList = [
  {
    id: 1,
    rechargeAmount: 1000,
    bonusAmount: 38,
  },
  {
    id: 2,
    rechargeAmount: 5000,
    bonusAmount: 128,
  },
  {
    id: 3,
    rechargeAmount: 10000,
    bonusAmount: 208,
  },
  {
    id: 4,
    rechargeAmount: 50000,
    bonusAmount: 508,
  },
  {
    id: 5,
    rechargeAmount: 100000,
    bonusAmount: 888,
  },
];

const getDailyRechargeReword = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const today = moment().startOf("day").valueOf();
    const [todayRechargeRow] = await connection.execute(
      "SELECT SUM(money) AS `sum` FROM `recharge` WHERE `phone` = ? AND `status` = ? AND `time` >= ?",
      [user.phone, PaymentStatusMap.SUCCESS, today],
    );
    const todayRechargeAmount = todayRechargeRow[0].sum || 0;

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ? AND `time` >= ?",
      [REWARD_TYPES_MAP.DAILY_RECHARGE_BONUS, user.phone, today],
    );

    console.log("claimedRewardsRow", [
      REWARD_TYPES_MAP.DAILY_RECHARGE_BONUS,
      user.phone,
      today,
    ]);
    console.log("claimedRewardsRow", claimedRewardsRow);

    const dailyRechargeRewordList = DailyRechargeBonusList.map((item) => {
      console.log("item", todayRechargeAmount);
      console.log("item", item.rechargeAmount);
      console.log(
        "item",
        claimedRewardsRow.some(
          (claimedReward) => claimedReward.reward_id === item.id,
        ),
      );
      return {
        id: item.id,
        rechargeAmount: Math.min(todayRechargeAmount, item.rechargeAmount),
        requiredRechargeAmount: item.rechargeAmount,
        bonusAmount: item.bonusAmount,
        isFinished: todayRechargeAmount >= item.rechargeAmount,
        isClaimed: claimedRewardsRow.some(
          (claimedReward) => claimedReward.reward_id === item.id,
        ),
      };
    });

    return res.status(200).json({
      data: dailyRechargeRewordList,
      status: true,
      message: "Successfully fetched daily recharge bonus data",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const claimDailyRechargeReword = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const dailyRechargeRewordId = req.body.id;
    const [userRow] = await connection.execute(
      "SELECT `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const today = moment().startOf("day").valueOf();
    const [todayRechargeRow] = await connection.execute(
      "SELECT SUM(money) AS `sum` FROM `recharge` WHERE `phone` = ? AND `status` = ? AND `time` >= ?",
      [user.phone, PaymentStatusMap.SUCCESS, today],
    );
    const todayRechargeAmount = todayRechargeRow[0].sum || 0;

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ? AND `time` >= ?",
      [REWARD_TYPES_MAP.DAILY_RECHARGE_BONUS, user.phone, today],
    );

    const dailyRechargeRewordList = DailyRechargeBonusList.map((item) => {
      return {
        id: item.id,
        rechargeAmount: todayRechargeAmount,
        requiredRechargeAmount: item.rechargeAmount,
        bonusAmount: item.bonusAmount,
        isFinished: todayRechargeAmount >= item.rechargeAmount,
        isClaimed: claimedRewardsRow.some(
          (claimedReward) => claimedReward.reward_id === item.rechargeAmount,
        ),
      };
    });

    const claimableBonusData = dailyRechargeRewordList.filter(
      (item) =>
        item.isFinished && item.rechargeAmount >= item.requiredRechargeAmount,
    );

    if (claimableBonusData.length === 0) {
      return res.status(400).json({
        status: false,
        message: "You does not meet the requirements to claim this reword!",
      });
    }

    const claimedBonusData = claimableBonusData?.find(
      (item) => item.id === dailyRechargeRewordId,
    );

    const [bonusList] = await connection.query(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ? AND `time` >= ? AND `reward_id` = ?",
      [
        REWARD_TYPES_MAP.DAILY_RECHARGE_BONUS,
        user.phone,
        today,
        claimedBonusData.id,
      ],
    );

    if (bonusList.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Bonus already claimed",
      });
    }

    const time = moment().valueOf();

    await connection.execute(
      "UPDATE `users` SET `money` = `money` + ?, `total_money` = `total_money` + ? WHERE `phone` = ?",
      [claimedBonusData.bonusAmount, claimedBonusData.bonusAmount, user.phone],
    );

    await connection.execute(
      "INSERT INTO `claimed_rewards` (`reward_id`, `type`, `phone`, `amount`, `status`, `time`) VALUES (?, ?, ?, ?, ?, ?)",
      [
        claimedBonusData.id,
        REWARD_TYPES_MAP.DAILY_RECHARGE_BONUS,
        user.phone,
        claimedBonusData.bonusAmount,
        REWARD_STATUS_TYPES_MAP.SUCCESS,
        time,
      ],
    );

    return res.status(200).json({
      status: true,
      message: "Successfully claimed daily recharge bonus",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const dailyRechargeRewordRecord = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ?",
      [REWARD_TYPES_MAP.DAILY_RECHARGE_BONUS, user.phone],
    );

    const claimedRewardsData = claimedRewardsRow.map((claimedReward) => {
      const currentDailyRechargeReword = DailyRechargeBonusList.find(
        (item) => item?.id === claimedReward?.reward_id,
      );
      return {
        id: claimedReward.reward_id,
        requireRechargeAmount: currentDailyRechargeReword?.rechargeAmount || 0,
        amount: claimedReward.amount,
        status: claimedReward.status,
        time: moment.unix(claimedReward.time).format("YYYY-MM-DD HH:mm:ss"),
      };
    });
    console.log(user);
    return res.status(200).json({
      data: claimedRewardsData,
      status: true,
      message: "Successfully fetched daily recharge bonus record",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const firstRechargeBonusList = [
  {
    id: 1,
    rechargeAmount: 100000,
    bonusAmount: 5888,
    agentBonus: 9999,
  },
  {
    id: 2,
    rechargeAmount: 50000,
    bonusAmount: 2888,
    agentBonus: 6888,
  },
  {
    id: 3,
    rechargeAmount: 10000,
    bonusAmount: 488,
    agentBonus: 1288,
  },
  {
    id: 4,
    rechargeAmount: 5000,
    bonusAmount: 288,
    agentBonus: 768,
  },
  {
    id: 5,
    rechargeAmount: 1000,
    bonusAmount: 188,
    agentBonus: 208,
  },
  {
    id: 6,
    rechargeAmount: 500,
    bonusAmount: 108,
    agentBonus: 128,
  },
  {
    id: 7,
    rechargeAmount: 200,
    bonusAmount: 48,
    agentBonus: 58,
  },
  {
    id: 8,
    rechargeAmount: 100,
    bonusAmount: 28,
    agentBonus: 28,
  },
];

const getFirstRechargeRewords = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ?",
      [REWARD_TYPES_MAP.FIRST_RECHARGE_BONUS, user.phone],
    );
    const [rechargeRow] = await connection.execute(
      "SELECT * FROM `recharge` WHERE `phone` = ? AND `status` = ? ORDER BY id DESC LIMIT 1 ",
      [user.phone, PaymentStatusMap.SUCCESS],
    );
    const firstRecharge = rechargeRow?.[0];

    const firstRechargeRewordList = firstRechargeBonusList.map(
      (item, index) => {
        const currentRechargeAmount = firstRecharge?.money || 0;
        return {
          id: item.id,
          currentRechargeAmount: Math.min(
            item.rechargeAmount,
            currentRechargeAmount,
          ),
          requiredRechargeAmount: item.rechargeAmount,
          bonusAmount: item.bonusAmount,
          agentBonus: item.agentBonus,
          isFinished:
            index === 0
              ? currentRechargeAmount >= item.rechargeAmount
              : currentRechargeAmount >= item.rechargeAmount &&
                firstRechargeBonusList[index - 1]?.rechargeAmount >
                  currentRechargeAmount,
          isClaimed: claimedRewardsRow.some(
            (claimedReward) => claimedReward.reward_id === item.id,
          ),
        };
      },
    );

    return res.status(200).json({
      data: firstRechargeRewordList,
      isExpired: firstRechargeRewordList.some(
        (item) => item.isFinished && item.isClaimed,
      ),
      status: true,
      message: "Successfully fetched first recharge bonus data",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const claimFirstRechargeReword = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const firstRechargeRewordId = req.body.id;
    const [userRow] = await connection.execute(
      "SELECT * FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ?",
      [REWARD_TYPES_MAP.FIRST_RECHARGE_BONUS, user.phone],
    );
    const [rechargeRow] = await connection.execute(
      "SELECT * FROM `recharge` WHERE `phone` = ? AND `status` = ? ORDER BY id DESC LIMIT 1 ",
      [user.phone, PaymentStatusMap.SUCCESS],
    );
    const firstRecharge = rechargeRow?.[0];

    const firstRechargeRewordList = firstRechargeBonusList.map(
      (item, index) => {
        const currentRechargeAmount = firstRecharge?.money || 0;
        return {
          id: item.id,
          currentRechargeAmount: Math.min(
            item.rechargeAmount,
            currentRechargeAmount,
          ),
          requiredRechargeAmount: item.rechargeAmount,
          bonusAmount: item.bonusAmount,
          agentBonus: item.agentBonus,
          isFinished:
            index === 0
              ? currentRechargeAmount >= item.rechargeAmount
              : currentRechargeAmount >= item.rechargeAmount &&
                firstRechargeBonusList[index - 1]?.rechargeAmount >
                  currentRechargeAmount,
          isClaimed: claimedRewardsRow.some(
            (claimedReward) => claimedReward.reward_id === item.id,
          ),
        };
      },
    );

    const claimableBonusData = firstRechargeRewordList.filter(
      (item) => item.isFinished,
    );

    if (claimableBonusData.length === 0) {
      return res.status(400).json({
        status: false,
        message: "You does not meet the requirements to claim this reword!",
      });
    }

    const isExpired = firstRechargeRewordList.some(
      (item) => item.isFinished && item.isClaimed,
    );

    if (isExpired) {
      return res.status(400).json({
        status: false,
        message: "Bonus already claimed",
      });
    }

    const claimedBonusData = claimableBonusData?.find(
      (item) => item.id === firstRechargeRewordId,
    );

    const time = moment().valueOf();

    await connection.execute(
      "UPDATE `users` SET `money` = `money` + ?, `total_money` = `total_money` + ? WHERE `phone` = ?",
      [claimedBonusData.bonusAmount, claimedBonusData.bonusAmount, user.phone],
    );

    await connection.execute(
      "INSERT INTO `claimed_rewards` (`reward_id`, `type`, `phone`, `amount`, `status`, `time`) VALUES (?, ?, ?, ?, ?, ?)",
      [
        claimedBonusData.id,
        REWARD_TYPES_MAP.FIRST_RECHARGE_BONUS,
        user.phone,
        claimedBonusData.bonusAmount,
        REWARD_STATUS_TYPES_MAP.SUCCESS,
        time,
      ],
    );
    return res.status(200).json({
      status: true,
      message: "Successfully claimed first recharge bonus",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const AttendanceBonusList = [
  {
    id: 1,
    days: 1,
    bonusAmount: 5,
    requiredAmount: 200,
  },
  {
    id: 2,
    days: 2,
    bonusAmount: 18,
    requiredAmount: 1000,
  },
  {
    id: 3,
    days: 3,
    bonusAmount: 100,
    requiredAmount: 3000,
  },
  {
    id: 4,
    days: 4,
    bonusAmount: 200,
    requiredAmount: 10000,
  },
  {
    id: 5,
    days: 5,
    bonusAmount: 400,
    requiredAmount: 20000,
  },
  {
    id: 6,
    days: 6,
    bonusAmount: 3000,
    requiredAmount: 100000,
  },
  {
    id: 7,
    days: 7,
    bonusAmount: 7000,
    requiredAmount: 200000,
  },
];

const getAttendanceBonus = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ?",
      [REWARD_TYPES_MAP.ATTENDANCE_BONUS, user.phone],
    );

    let attendanceBonusId = 0;

    if (claimedRewardsRow.length === 0) {
      attendanceBonusId = 0;
    } else {
      const lastClaimedReword =
        claimedRewardsRow?.[claimedRewardsRow.length - 1];
      const lastClaimedRewordTime = lastClaimedReword?.time || 0;

      const lastClaimedRewordDate = moment
        .unix(lastClaimedRewordTime)
        .startOf("day");
      const today = moment().startOf("day");

      if (today.diff(lastClaimedRewordDate, "days") < 1) {
        attendanceBonusId = lastClaimedReword.reward_id;
      } else if (today.diff(lastClaimedRewordDate, "days") >= 2) {
        attendanceBonusId = 0;
      } else {
        attendanceBonusId = lastClaimedReword.reward_id;
      }
    }

    const claimedBonusData = AttendanceBonusList.find(
      (item) => item.id === attendanceBonusId,
    );

    return res.status(200).json({
      status: true,
      data: {
        id: claimedBonusData?.id || 0,
        days: claimedBonusData?.days || 0,
        bonusAmount: claimedBonusData?.bonusAmount || 0,
      },
      message: "Successfully fetched attendance bonus data",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: true,
      message: error.message,
    });
  }
};

const claimAttendanceBonus = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ?",
      [REWARD_TYPES_MAP.ATTENDANCE_BONUS, user.phone],
    );

    if (claimedRewardsRow.map((item) => item.reward_id).includes(7)) {
      return res.status(400).json({
        status: false,
        message: "You have already claimed the attendance bonus for 7 days",
      });
    }

    let attendanceBonusId = 0;

    if (claimedRewardsRow.length === 0) {
      attendanceBonusId = 1;
    } else {
      const lastClaimedReword =
        claimedRewardsRow?.[claimedRewardsRow.length - 1];
      const lastClaimedRewordTime = lastClaimedReword?.time || 0;

      const lastClaimedRewordDate = moment
        .unix(lastClaimedRewordTime)
        .startOf("day");
      const today = moment().startOf("day");

      if (today.diff(lastClaimedRewordDate, "days") < 1) {
        return res.status(400).json({
          status: false,
          message: "You have already claimed the attendance bonus today",
        });
      } else if (today.diff(lastClaimedRewordDate, "days") >= 2) {
        attendanceBonusId = 1;
      } else {
        attendanceBonusId = lastClaimedReword.reward_id + 1;
      }
    }

    const claimedBonusData = AttendanceBonusList.find(
      (item) => item.id === attendanceBonusId,
    );

    const [rechargeTotal] = await connection.query(
      "SELECT SUM(money) AS total_recharge FROM recharge WHERE status = 1 AND phone = ?",
      [user.phone],
    );
    const totalRecharge = +rechargeTotal[0].total_recharge || 0;

    const check = totalRecharge >= claimedBonusData.requiredAmount;

    if (!check)
      return res.status(400).json({
        status: false,
        message: "Total Recharge amount doesn't met the Required Amount !",
      });

    const time = moment().valueOf();

    await connection.execute(
      "UPDATE `users` SET `money` = `money` + ?, `total_money` = `total_money` + ? WHERE `phone` = ?",
      [claimedBonusData.bonusAmount, claimedBonusData.bonusAmount, user.phone],
    );

    await connection.execute(
      "INSERT INTO `claimed_rewards` (`reward_id`, `type`, `phone`, `amount`, `status`, `time`) VALUES (?, ?, ?, ?, ?, ?)",
      [
        claimedBonusData.id,
        REWARD_TYPES_MAP.ATTENDANCE_BONUS,
        user.phone,
        claimedBonusData.bonusAmount,
        REWARD_STATUS_TYPES_MAP.SUCCESS,
        time,
      ],
    );

    return res.status(200).json({
      status: true,
      message: `Successfully claimed attendance bonus for ${getOrdinal(claimedBonusData.days)} day`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: true,
      message: error.message,
    });
  }
};

const getAttendanceBonusRecord = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `phone` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [claimedRewardsRow] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `type` = ? AND `phone` = ?",
      [REWARD_TYPES_MAP.ATTENDANCE_BONUS, user.phone],
    );

    const claimedRewardsData = claimedRewardsRow.map((claimedReward) => {
      const currentAttendanceBonus = AttendanceBonusList.find(
        (item) => item?.id === claimedReward?.reward_id,
      );
      return {
        id: claimedReward.reward_id,
        days: currentAttendanceBonus?.days || 0,
        amount: claimedReward.amount,
        status: claimedReward.status,
        time: moment.unix(claimedReward.time).format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    return res.status(200).json({
      data: claimedRewardsData,
      status: true,
      message: "Successfully fetched attendance bonus record",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: true,
      message: error.message,
    });
  }
};

const promotionController = {
  subordinatesDataAPI,
  subordinatesAPI,
  getInvitationBonus,
  claimInvitationBonus,
  getInvitedMembers,
  getDailyRechargeReword,
  claimDailyRechargeReword,
  dailyRechargeRewordRecord,
  getFirstRechargeRewords,
  claimFirstRechargeReword,
  claimAttendanceBonus,
  getAttendanceBonusRecord,
  getAttendanceBonus,
  subordinatesDataByTimeAPI,
  adminOverrideSubordinates
};

export default promotionController;
