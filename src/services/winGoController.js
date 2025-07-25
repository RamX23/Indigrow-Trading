import connection from "../config/connectDB.js";
import GameRepresentationIds from "../constants/game_representation_id.js";
import {
  generateCommissionId,
  generatePeriod,
  yesterdayTime,
} from "../helpers/games.js";

// helper functions
function generateProductId() {
  const date = new Date();
  const years = formatTime(date.getFullYear());
  const months = formatTime(date.getMonth() + 1);
  const days = formatTime(date.getDate());
  return years + months + days + Math.floor(Math.random() * 1000000000000000);
}

function determineColor(join) {
  return JOIN_COLOR_MAP[join] || (join % 2 === 0 ? "red" : "green");
}

function generateCheckJoin(join) {
  if ((!isNumber(join) && join === "l") || join === "n") {
    return `
      <div data-v-a9660e98="" class="van-image" style="width: 30px; height: 30px;">
          <img src="/images/${join === "n" ? "small" : "big"}.png" class="van-image__img">
      </div>
      `;
  } else {
    return `
      <span data-v-a9660e98="">${isNumber(join) ? join : ""}</span>
      `;
  }
}
// end helper functions

const winGoPage = async (req, res) => {
  return res.render("bet/wingo/win.ejs");
};

const winGoPage3 = async (req, res) => {
  return res.render("bet/wingo/win3.ejs");
};

const winGoPage5 = async (req, res) => {
  return res.render("bet/wingo/win5.ejs");
};

const winGoPage10 = async (req, res) => {
  return res.render("bet/wingo/win10.ejs");
};

const isNumber = (params) => {
  let pattern = /^[0-9]*\d$/;
  return pattern.test(params);
};

function formateT(params) {
  let result = params < 10 ? "0" + params : params;
  return result;
}

function timerJoin(params = "", addHours = 0) {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }

  date.setHours(date.getHours() + addHours);

  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());

  let hours = date.getHours() % 12;
  hours = hours === 0 ? 12 : hours;
  let ampm = date.getHours() < 12 ? "AM" : "PM";

  let minutes = formateT(date.getMinutes());
  let seconds = formateT(date.getSeconds());

  return (
    years +
    "-" +
    months +
    "-" +
    days +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds +
    " " +
    ampm
  );
}

const rosesPlus = async (phone, money, levels = [], timeNow = "") => {
  try {
    const [userResult] = await connection.query(
      "SELECT `phone`, `code`, `invite`, `money` FROM users WHERE phone = ? AND veri = 1 LIMIT 1",
      [phone],
    );
    const userInfo = userResult[0];

    if (!userInfo) {
      return;
    }

    let userReferrer = userInfo.invite;
    let commissionsToInsert = [];
    let usersToUpdate = [];

    for (let i = 0; i < levels.length; i++) {
      const levelCommission = levels[i] * money;
      const [referrerRows] = await connection.query(
        "SELECT phone, money, code, invite FROM users WHERE code = ?",
        [userReferrer],
      );
      const referrerInfo = referrerRows[0];

      if (referrerInfo) {
        const commissionId = generateCommissionId();

        commissionsToInsert.push([
          commissionId,
          referrerInfo.phone,
          userInfo.phone,
          levelCommission,
          i + 1,
          timeNow,
        ]);
        usersToUpdate.push([levelCommission, referrerInfo.phone]);
        userReferrer = referrerInfo.invite;
      } else {
        console.log(`Level ${i + 1} referrer not found.`);
        break;
      }
    }

    if (commissionsToInsert.length > 0) {
      await connection.query(
        "INSERT INTO commissions (commission_id, phone, from_user_phone, money, level, time) VALUES ?",
        [commissionsToInsert],
      );
    }

    if (usersToUpdate.length > 0) {
      const updatePromises = usersToUpdate.map(([money, phone]) =>
        connection.query("UPDATE users SET money = money + ? WHERE phone = ?", [
          money,
          phone,
        ]),
      );
      await Promise.all(updatePromises);
    }

    return {
      success: true,
      message: "Commissions calculated and inserted successfully.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
};
const distributeCommission = async () => {
  try {
    const { startOfYesterdayTimestamp, endOfYesterdayTimestamp } =
      yesterdayTime();
    const [levelResult] = await connection.query("SELECT f1 FROM level");
    const levels = levelResult.map((row) => row.f1 / 100);

    // const [bets] = await connection.query('SELECT phone, SUM(money + fee) AS total_money FROM minutes_1 WHERE time > ? AND time <= ? GROUP BY phone', [startOfDay, endTime]);

    const [bets] = await connection.query(
      `
      SELECT phone, SUM(total_money) AS total_money
      FROM (
        SELECT phone, SUM(money + fee) AS total_money
        FROM minutes_2
        WHERE time > ? AND time <= ?
        GROUP BY phone
        UNION ALL
        SELECT phone, SUM(money + fee) AS total_money
        FROM trx_wingo_bets
        WHERE time > ? AND time <= ?
        GROUP BY phone
      ) AS combined
      GROUP BY phone
      `,
      [
        startOfYesterdayTimestamp,
        endOfYesterdayTimestamp,
        startOfYesterdayTimestamp,
        endOfYesterdayTimestamp,
      ],
    );

    const promises = bets.map((bet) =>
      rosesPlus(bet.phone, bet.total_money, levels, endOfYesterdayTimestamp),
    );
    const response = await Promise.all(promises);
    return {
      success: true,
      message: "Commissions distributed successfully.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
};

// const distributeCommission = async () => {
//   const timeNow = new Date();
//   const startOfDay = new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate()).getTime();
//   const endTime = timeNow.getTime();
//   const updatePromises = [];

//   const [bets] = await connection.query('SELECT phone,SUM(money) AS total_money FROM minutes_1 GROUP BY phone');

//   const [commissions] = await connection.query(
//     'SELECT phone, SUM(money) AS total_commission FROM commissions WHERE time > ? AND time <= ? GROUP BY phone',
//     [startOfDay, endTime]
//   );
//   if (commissions.length === 0) {
//     console.log("No new commissions to process.");
//     return {
//       success: false,
//       message: "No new commissions to process.",
//     };
//   }
//   for (const commission of commissions) {
//     const { phone, total_commission } = commission;
//     const updatePromise = connection.query(
//       "UPDATE users SET money = money + ? WHERE phone = ?",
//       [total_commission, phone]
//     );
//     updatePromises.push(updatePromise);
//   }
//   await Promise.all(updatePromises);
//   return {
//     success: true,
//     message: "Commissions distributed successfully.",
//   };
// }
// const rosesPlus = async (auth, money) => {
//     const [level] = await connection.query('SELECT * FROM level ');
//     let level0 = level[0];

//     const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);
//     let userInfo = user[0];
//     const [f1] = await connection.query('SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ', [userInfo.invite]);
//     if (money >= 10000) {
//         if (f1.length > 0) {
//             let infoF1 = f1[0];
//             let rosesF1 = (money / 100) * level0.f1;
//             await connection.query('UPDATE users SET money = money + ?, roses_f1 = roses_f1 + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF1, rosesF1, rosesF1, rosesF1, infoF1.phone]);
//             const [f2] = await connection.query('SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ', [infoF1.invite]);
//             if (f2.length > 0) {
//                 let infoF2 = f2[0];
//                 let rosesF2 = (money / 100) * level0.f2;
//                 await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF2, rosesF2, rosesF2, infoF2.phone]);
//                 const [f3] = await connection.query('SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ', [infoF2.invite]);
//                 if (f3.length > 0) {
//                     let infoF3 = f3[0];
//                     let rosesF3 = (money / 100) * level0.f3;
//                     await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF3, rosesF3, rosesF3, infoF3.phone]);
//                     const [f4] = await connection.query('SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ', [infoF3.invite]);
//                     if (f4.length > 0) {
//                         let infoF4 = f4[0];
//                         let rosesF4 = (money / 100) * level0.f4;
//                         await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF4, rosesF4, rosesF4, infoF4.phone]);
//                     }
//                 }
//             }

//         }
//     }
// }

// const rosesPlus = async (auth, money) => {
//     const [level] = await connection.query('SELECT * FROM level ');

//     const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `user_level` FROM users WHERE token = ? AND veri = 1 LIMIT 1 ', [auth]);
//     let userInfo = user[0];
//     const [f1] = await connection.query('SELECT `phone`, `code`, `invite`, `rank`, `user_level` FROM users WHERE code = ? AND veri = 1 LIMIT 1 ', [userInfo.invite]);

//     if (money < 300) {
//         return; // No need to proceed if money is less than 300
//     }

//     if (f1.length === 0) {
//         return; // No referrer found
//     }

//     let infoF1 = f1[0];

//     const f2 = await connection.query('SELECT `phone`, `code`, `invite`, `rank`, `user_level` FROM users WHERE code = ? AND veri = 1 LIMIT 1 ', [infoF1.invite]);
//     if (f2.length > 0) {
//         let infoF2 = f2[0];
//         if (infoF2.user_level >= 2) {
//             let rosesF2 = (money / 100) * level[1].f1;
//             await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF2, rosesF2, rosesF2, infoF2.phone]);
//         }

//         const f3 = await connection.query('SELECT `phone`, `code`, `invite`, `rank`, `user_level` FROM users WHERE code = ? AND veri = 1 LIMIT 1 ', [infoF2.invite]);
//         if (f3.length > 0) {
//             let infoF3 = f3[0];
//             if (infoF3.user_level >= 3) {
//                 let rosesF3 = (money / 100) * level[2].f1;
//                 await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF3, rosesF3, rosesF3, infoF3.phone]);
//             }

//             const f4 = await connection.query('SELECT `phone`, `code`, `invite`, `rank`, `user_level` FROM users WHERE code = ? AND veri = 1 LIMIT 1 ', [infoF3.invite]);
//             if (f4.length > 0) {
//                 let infoF4 = f4[0];
//                 if (infoF4.user_level >= 4) {
//                     let rosesF4 = (money / 100) * level[3].f1;
//                     await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF4, rosesF4, rosesF4, infoF4.phone]);
//                 }
//             }
//         }
//     }
// }

// const rosesPlus = async (auth, money) => {
//     const [level] = await connection.query('SELECT * FROM level ');
//     const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);
//     let userInfo = user[0];
//     const [f1] = await connection.query('SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ', [userInfo.invite]);
//     let infoF1 = f1[0];

//     const [check_invite] = await connection.query('SELECT * FROM users WHERE invite = ?', [userInfo.invite]);
//     if (money >= 300) {
//         let levels = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44];
//         let levelIndex = levels.findIndex(levelThreshold => check_invite.length < levelThreshold);

//         if (levelIndex !== -1) {
//             let rosesF1 = (money / 100) * level[levelIndex].f1;
//             await connection.query('UPDATE users SET money = money + ?, roses_f1 = roses_f1 + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ', [rosesF1, rosesF1, rosesF1, rosesF1, infoF1.phone]);
//         }
//     }
// }

const VALID_TYPE_IDS = [1, 3, 5, 10];
const GAME_JOIN_MAP = {
  1: "wingo",
  3: "wingo3",
  5: "wingo5",
  10: "wingo10",
};
const JOIN_COLOR_MAP = {
  l: "big",
  n: "small",
  t: "violet",
  d: "red",
  x: "green",
  0: "red-violet",
  5: "green-violet",
};

  const betWinGo = async (req, res) => {
    let { typeid, startPrice,coinType, x, money,join } = req.body;
    let auth = req.cookies.auth;
    console.log(req.body);

    if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
      return res.status(200).json({
        message: "Error!",
        status: true,
      });
    }

    let gameJoin = "";
    if (typeid == 1) gameJoin = "wingo";
    if (typeid == 3) gameJoin = "wingo3";
    if (typeid == 5) gameJoin = "wingo5";
    if (typeid == 10) gameJoin = "wingo10";
    const [winGoNow] = await connection.query(
      "SELECT period FROM wingo WHERE status = 0 AND game = ? ORDER BY id DESC LIMIT 1",
      [gameJoin],
    );
    const [user] = await connection.query(
      "SELECT `phone`, `code`, `invite`, `level`, `money`, `bonus_money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
      [auth],
    );

    if (!winGoNow[0] || !user[0] || !isNumber(x) || !isNumber(money)) {
      return res.status(200).json({
        message: "Error!",
        status: true,
      });
    }

    let userInfo = user[0];
    let period = winGoNow[0].period;
    let fee = x * money * 0.02;
    let total = x * money - fee;
    let timeNow = Date.now();
    let check = userInfo.money - total;

    console.log("fee", fee);
    console.log("total", total);
    console.log("check", check);
    console.log("timeNow", timeNow);

    let date = new Date();
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());
    let id_product =
      years + months + days + Math.floor(Math.random() * 1000000000000000);

    let formatTime = timerJoin();

    let color = "";
    if (join == "l") {
      color = "big";
    } else if (join == "n") {
      color = "small";
    } else if (join == "t") {
      color = "violet";
    } else if (join == "d") {
      color = "red";
    } else if (join == "x") {
      color = "green";
    } else if (join == "0") {
      color = "red-violet";
    } else if (join == "5") {
      color = "green-violet";
    } else if (join % 2 == 0) {
      color = "red";
    } else if (join % 2 != 0) {
      color = "green";
    }

    let checkJoin = "";

    if ((!isNumber(join) && join == "l") || join == "n") {
      checkJoin = `
          <div data-v-a9660e98="" class="van-image" style="width: 30px; height: 30px;">
              <img src="/images/${join == "n" ? "Sell" : "Buy"}.png" class="van-image__img">
          </div>
          `;
    } else {
      checkJoin = `
          <span data-v-a9660e98="">${isNumber(join) ? join : ""}</span>
          `;
    }

    let result = `
      <div data-v-a9660e98="" issuenumber="${period}" addtime="${formatTime}" rowid="1" class="hb">
          <div data-v-a9660e98="" class="item c-row">
              <div data-v-a9660e98="" class="result">
                  <div data-v-a9660e98="" class="select select-${color}">
                      ${checkJoin}
                  </div>
              </div>
              <div data-v-a9660e98="" class="c-row c-row-between info">
                  <div data-v-a9660e98="">
                      <div data-v-a9660e98="" class="issueName">
                          ${period}
                      </div>
                      <div data-v-a9660e98="" class="tiem">${formatTime}</div>
                  </div>
              </div>
          </div>
          <!---->
      </div>
      `;

    function timerJoin(params = "", addHours = 0) {
      let date = "";
      if (params) {
        date = new Date(Number(params));
      } else {
        date = new Date();
      }

      date.setHours(date.getHours() + addHours);

      let years = formateT(date.getFullYear());
      let months = formateT(date.getMonth() + 1);
      let days = formateT(date.getDate());

      let hours = date.getHours() % 12;
      hours = hours === 0 ? 12 : hours;
      let ampm = date.getHours() < 12 ? "AM" : "PM";

      let minutes = formateT(date.getMinutes());
      let seconds = formateT(date.getSeconds());

      return (
        years +
        "-" +
        months +
        "-" +
        days +
        " " +
        hours +
        ":" +
        minutes +
        ":" +
        seconds +
        " " +
        ampm
      );
    }

    let checkTime = timerJoin(date.getTime());

    if (check >= 0) {
      const sql = `INSERT INTO minutes_2 SET 
      id_product = ?,
      phone = ?,
      code = ?,
      invite = ?,
      stage = ?,
      level = ?,
      money = ?,
      amount = ?,
      fee = ?,
      \`get\`  = ?,
      game = ?,
      bet = ?,
      status = ?,
      today = ?,
      time = ?,
      startPrice = ?,
      coinType = ?`;
    
    await connection.query(sql, [
      id_product,
      userInfo.phone,
      userInfo.code,
      userInfo.invite,
      period,
      userInfo.level,
      total,
      money,
      fee,
      0,
      gameJoin,
      join,
      0,
      checkTime,
      timeNow,
      startPrice,   
      coinType     
    ]);

      const previous_bonus_money = userInfo.bonus_money;

      const totalBetMoney = money * x;

      const isBonusWalletEnabled = process.env.ENABLE_BONUS_MONEY === "true";

      let mainWalletBetMoney = isBonusWalletEnabled
        ? totalBetMoney * 0.97
        : totalBetMoney;
      let bonusWalletBetMoney = isBonusWalletEnabled ? totalBetMoney * 0.03 : 0;

      if (!(previous_bonus_money >= bonusWalletBetMoney)) {
        mainWalletBetMoney = totalBetMoney;
        bonusWalletBetMoney = 0;
      }

      await connection.query(
        "UPDATE users SET money = money - ?, total_money = total_money - ?, bonus_money = bonus_money - ? WHERE token = ?",
        [mainWalletBetMoney, mainWalletBetMoney, bonusWalletBetMoney, auth],
      );

      const [users] = await connection.query(
        "SELECT `money`, `bonus_money`, `level` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
        [auth],
      );

      // rosesPlus(auth, money * x);

      return res.status(200).json({
        message: "Successful Trade",
        status: true,
        data: result,
        change: users[0].level,
        money: users[0].money,
        bonus_money: users[0].bonus_money,
      });
    } else {
      return res.status(200).json({
        message: "The amount is not enough",
        status: false,
      });
    }
  };


const listOrderOld = async (req, res) => {
  let { typeid, pageno, pageto } = req.body;

  if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10)
    return res.status(200).json({
      message: "Error!",
      status: true,
    });

  if (pageno < 0 || pageto < 0)
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      page: 1,
      status: false,
    });

  let auth = req.cookies.auth;

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
    [auth],
  );
  if (!user[0]) {
    return res.status(200).json({
      message: "Authentication failed!",
      status: true,
    });
  }

  let game = "";
  if (typeid == 1) game = "wingo";
  if (typeid == 3) game = "wingo3";
  if (typeid == 5) game = "wingo5";
  if (typeid == 10) game = "wingo10";

  const [wingo] = await connection.query(
    "SELECT w.id as id,w.period as period,w.amount as amount,w.game as game,w.status as status,w.release_status as release_status,w.time as time,w.isProcessed as isProcessed,m.bet as bet,m.result FROM wingo as w join minutes_2 as m on w.period=m.stage WHERE  w.game = ? ORDER BY id DESC LIMIT ?, ?",
    [game, Number(pageno), Number(pageto)],
  );


  // const [wingoAll] = await connection.query(
  //   "SELECT COUNT(*) as game_length FROM wingo WHERE status != 0 AND game = ?",
  //   [game],
  // );
  const [wingoAll] = await connection.query(
    `SELECT w.id AS id, w.period AS period, w.amount AS result
     FROM wingo w
     WHERE w.status = 1 AND w.release_status = 2 AND w.game = ?
     ORDER BY w.id DESC
     LIMIT ?, ?`,
    [game, Number(pageno), Number(pageto)]
  );
  
  const [wingo1]=await connection.query(
    `select count(*) as game_length
    from wingo 
    where  status!=0 && release_status!=0 && game=?`,
    [game]
  )
  

  // select id,stage,result 
  // from minutes_2
  // group by id,stage,result
  // order by id desc
  const [period] = await connection.query(
    "SELECT period FROM wingo WHERE status = 0 AND game = ? ORDER BY id DESC LIMIT 1",
    [game],
  );


  if (wingo.length == 0 && period.length !== 0)
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      period: period[0].period,
      page: 1,
      status: false,
    });

  if (period.length == 0)
    return res.status(200).json({
      message: "Unable to get previous period",
      status: true,
    });

  let page = Math.ceil(wingo1[0].game_length / 10);
// console.log(page);
  return res.status(200).json({
    code: 0,
    msg: "Receive success",
    data: {
      gameslist: wingo,
      gameHistory:wingoAll,
    },
    period: period[0].period,
    page: page,
    status: true,
  });
};

const GetMyEmerdList = async (req, res) => {
  let { typeid, pageno, pageto } = req.body;

  // if (!pageno || !pageto) {
  //     pageno = 0;
  //     pageto = 10;
  // }

  if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
    return res.status(200).json({
      message: "Error!",
      status: true,
    });
  }

  if (pageno < 0 || pageto < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      page: 1,
      status: false,
    });
  }
  let auth = req.cookies.auth;

  let game = "";
  if (typeid == 1) game = "wingo";
  if (typeid == 3) game = "wingo3";
  if (typeid == 5) game = "wingo5";
  if (typeid == 10) game = "wingo10";

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1 LIMIT 1",
    [auth],
  );
  const [minutes_1] = await connection.query(
    "SELECT * FROM minutes_2 WHERE phone = ? AND game = ? ORDER BY id DESC LIMIT ?, ?",
    [user[0].phone, game, Number(pageno), Number(pageto)],
  );
  const [minutes_1All] = await connection.query(
    "SELECT COUNT(*) as bet_length FROM minutes_2 WHERE phone = ? AND game = ?",
    [user[0].phone, game],
  );

  if (!minutes_1[0]) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      page: 1,
      status: false,
    });
  }
  if (!pageno || !pageto || !user[0] || !minutes_1[0]) {
    return res.status(200).json({
      message: "Error!",
      status: true,
    });
  }
  let page = Math.ceil(minutes_1All[0].bet_length / 10);

  let datas = minutes_1.map((data) => {
    let { id, phone, code, invite, level, game, ...others } = data;
    return others;
  });
  return res.status(200).json({
    code: 0,
    msg: "Receive success",
    data: {
      gameslist: datas,
    },
    page: page,
    status: true,
  });
};




// const addWinGo = async (game) => {
//   try {
//     let join = "";
//     if (game === 1) join = "wingo";
//     else if (game === 3) join = "wingo3";
//     else if (game === 5) join = "wingo5";
//     else if (game === 10) join = "wingo10";
//     else throw new Error("Invalid game type");

//     // Fetch current pending game period (if any)
//     const [winGoNow] = await connection.query(
//       "SELECT period FROM wingo WHERE status = 0 AND game = ? ORDER BY id DESC LIMIT 1",
//       [join]
//     );

//     // Fetch start price from minutes_2
//     const [startPriceRow] = await connection.query(
//       "SELECT startPrice AS start_point FROM minutes_2 WHERE status = 0 AND game = ? ORDER BY id DESC LIMIT 1",
//       [join]
//     );

//     let startPoint = null;
//     let endPoint = null;
//     let bigTotal = 0;
//     let smallTotal = 0;

//     const isPendingGame = winGoNow.length > 0;

//     if (isPendingGame) {
//       startPoint = parseFloat(startPriceRow[0].start_point);
//       const previousPeriod = winGoNow[0].period;

//       // Get admin settings
//       const [setting] = await connection.query("SELECT * FROM `admin_ac`");

//       // Get total money for big/small bets
//       const [betResults] = await connection.query(
//         `SELECT 
//             SUM(CASE WHEN bet = 'l' THEN money ELSE 0 END) AS big_total,
//             SUM(CASE WHEN bet = 'n' THEN money ELSE 0 END) AS small_total
//          FROM minutes_2 
//          WHERE game = ? AND status = 0`,
//         [join]
//       );
      
//       bigTotal = parseFloat(betResults[0].big_total) || 0;
//       smallTotal = parseFloat(betResults[0].small_total) || 0;

//       // Default calculation based on betting distribution
//       if (bigTotal <= smallTotal) {
//         console.log("Big Total is winning so price will be higher than start");
//         endPoint = parseFloat((startPoint + Math.random() * 0.1).toFixed(2));
//       } else {
//         console.log("Small total is winning so price will be lower than start");
//         endPoint = parseFloat((startPoint - Math.random() * 0.1).toFixed(2));
//       }

//       // Apply admin override
//       let adminOverrideValue = "-1";
//       if (game === 1) adminOverrideValue = setting[0].wingo1;
//       if (game === 3) adminOverrideValue = setting[0].wingo3;
//       if (game === 5) adminOverrideValue = setting[0].wingo5;
//       if (game === 10) adminOverrideValue = setting[0].wingo10;

//       if (adminOverrideValue === 'l') {
//         // Force endpoint to be higher than start
//         endPoint = parseFloat((startPoint + Math.random() * 0.1).toFixed(2));
//         console.log("Admin override: Forcing result to be higher (l)");
//       } else if (adminOverrideValue === 'n') {
//         // Force endpoint to be lower than start
//         endPoint = parseFloat((startPoint - Math.random() * 0.1).toFixed(2));
//         console.log("Admin override: Forcing result to be lower (n)");
//       } else if (adminOverrideValue === 'd') {
//         // Force draw - make start and end points equal
//         endPoint = startPoint;
//         console.log("Admin override: Forcing result to be draw (d)");
//       } else {
//         console.log("No valid admin override, using default calculation");
//       }

//       // Update game result
//       await connection.query(
//         "UPDATE wingo SET amount = ?, status = 1, release_status = 1 WHERE period = ? AND game = ?",
//         [endPoint.toFixed(3), previousPeriod, join]
//       );

//       // Clear the admin override after applying it
//       let adminWingoKey = "";
//       if (game === 1) adminWingoKey = "wingo1";
//       if (game === 3) adminWingoKey = "wingo3";
//       if (game === 5) adminWingoKey = "wingo5";
//       if (game === 10) adminWingoKey = "wingo10";

//       await connection.query(
//         `UPDATE admin_ac SET ${adminWingoKey} = ?`,
//         ["-1"] // Reset to default value
//       );
//     }

//     // Insert new game for the next period
//     const timeNow = Date.now();
//     const gameRepresentationId = GameRepresentationIds.WINGO[game];
//     const NewGamePeriod = generatePeriod(gameRepresentationId);

//     console.log("⏳ About to insert new game:", NewGamePeriod, join, timeNow);
//     await connection.query(
//       `INSERT INTO wingo SET period = ?, amount = 0, game = ?, status = 0, time = ?`,
//       [NewGamePeriod, join, timeNow]
//     );
//     // console.log("✅ New wingo game inserted",);
    
//     console.log("Debug Info:", {
//       startPoint,
//       endPoint,
//       bigTotal,
//       smallTotal
//     });

//     return {
//       startPoint,
//       endPoint,
//       bigTotal,
//       smallTotal
//     };
//   } catch (error) {
//     console.error("❌ Error in addWinGo:", error.message);
//     throw error;
//   }
// };


const addWinGo = async (game) => {
  try {
    const COIN_CONFIGS = {
      BTC: { basePrice: 60000, volatility: 0.07 },
      ETH: { basePrice: 3000, volatility: 0.05 },
      BNB: { basePrice: 500, volatility: 0.04 },
      ADA: { basePrice: 0.5, volatility: 0.02 },
    };


 
    let join = "";
    if (game === 1) join = "wingo";
    else if (game === 3) join = "wingo3";
    else if (game === 5) join = "wingo5";
    else if (game === 10) join = "wingo10";
    else throw new Error("Invalid game type");

    // Fetch current pending game period (if any)
    const [winGoNow] = await connection.query(
      "SELECT period FROM wingo WHERE status = 0 AND game = ? ORDER BY id DESC LIMIT 1",
      [join]
    );

    // Fetch start prices for all coins from minutes_2
    const [startPriceRows] = await connection.query(
      `SELECT 
        MAX(CASE WHEN coinType = 'BTC' THEN startPrice ELSE NULL END) as btc_start,
        MAX(CASE WHEN coinType = 'ETH' THEN startPrice ELSE NULL END) as eth_start,
        MAX(CASE WHEN coinType = 'BNB' THEN startPrice ELSE NULL END) as bnb_start,
        MAX(CASE WHEN coinType = 'ADA' THEN startPrice ELSE NULL END) as ada_start
      FROM minutes_2 
      WHERE status = 0 AND game = ?`,
      [join]
    );


    

    // Check if we have valid start prices
    if (!startPriceRows || startPriceRows.length === 0) {
      console.error("Error: Missing start prices for one or more coins");
      return;
    }

    const startPrices = {
      BTC: parseFloat(startPriceRows[0].btc_start),
      ETH: parseFloat(startPriceRows[0].eth_start),
      BNB: parseFloat(startPriceRows[0].bnb_start),
      ADA: parseFloat(startPriceRows[0].ada_start)
    };

    console.log(startPrices);
    const previousPeriod = winGoNow[0].period;

    // Get admin settings
    const [setting] = await connection.query("SELECT * FROM `admin_ac`");
    if (!setting || setting.length === 0) {
      console.error("Error: No admin settings found.");
      return;
    }

    // Get total money for big/small bets (across all coins)
    const [betResults] = await connection.query(
      `SELECT 
          SUM(CASE WHEN bet = 'l' THEN money ELSE 0 END) AS big_total,
          SUM(CASE WHEN bet = 'n' THEN money ELSE 0 END) AS small_total
       FROM minutes_2 
       WHERE game = ? AND status = 0`,
      [join]
    );



    if (!betResults || betResults.length === 0) {
      console.error("Error: No betting data found.");
      return;
    }

    const bigTotal = parseFloat(betResults[0].big_total) || 0;
    const smallTotal = parseFloat(betResults[0].small_total) || 0;

    if (bigTotal === 0 && smallTotal === 0) {
      console.log("No bets placed - ending game without price movement");
      // You might want to handle this case differently
      return;
    }

    // Calculate end prices for each coin based on the same logic
    const endPrices = {};
    const priceChanges = {};

    // Get admin override value
    let adminOverrideValue = "-1";
    if (game === 1) adminOverrideValue = setting[0].wingo1;
    if (game === 3) adminOverrideValue = setting[0].wingo3;
    if (game === 5) adminOverrideValue = setting[0].wingo5;
    if (game === 10) adminOverrideValue = setting[0].wingo10;

    // Calculate price movement direction (same for all coins)
    let shouldGoUp = null;

  console.log("big total is:",bigTotal);
  console.log("Small total is:",smallTotal);
  let result=null;
    if (bigTotal < smallTotal) {
      console.log("Big Total is winning so price will be higher than start");
      shouldGoUp=true;
      result='l';
    } else {
      console.log("Small total is winning so price will be lower than start");
      shouldGoUp=false;
      result='n';
    }


    if (adminOverrideValue === 'l') {
      shouldGoUp = true;
      result='l';
      console.log("Price will go up due to admin override")
    }
    else if (adminOverrideValue === 'n') {
      shouldGoUp = false;
      result='n';
      console.log("Price will go Down due to admin override")
    }
    else if (adminOverrideValue === 'd') {
      result='d';
      shouldGoUp = null;
      console.log("Price will be draw due to admin override")} // draw



    // Calculate end prices for each coin
    const BTC_TARGET_MOVEMENT = 1;

// Calculate end prices with strict movement ranges
for (const coin in startPrices) {
  const startPrice = startPrices[coin];
  
  // Define exact movement ranges for each coin
  const MOVEMENT_RANGES = {
    BTC: { min: 1.00, max: 2.00 },   // $0.10 to $2.00
    ETH: { min: 0.3, max: 2.00 },   // $0.05 to $1.00
    BNB: { min: 0.02, max: 0.20 },   // $0.02 to $0.50
    ADA: { min: 0.0001, max: 0.002 } // $0.0001 to $0.002
  };
  
  // Calculate movement amount within specified range
  let movementAmount = MOVEMENT_RANGES[coin].min + 
    (Math.random() * (MOVEMENT_RANGES[coin].max - MOVEMENT_RANGES[coin].min));
  
  // Apply direction
  let endPrice;
  if (shouldGoUp === true) {
    endPrice = startPrice + movementAmount;
  } else if (shouldGoUp === false) {
    endPrice = startPrice - movementAmount;
  } else {
    endPrice = startPrice; // Draw
  }
  
  // Ensure we don't go below minimum price
  endPrice = Math.max(0.01, endPrice);
  
  endPrices[coin] = parseFloat(endPrice.toFixed(4));
  priceChanges[coin] = parseFloat((endPrice - startPrice).toFixed(4));
  
  console.log(`[${coin}] Change: ${priceChanges[coin].toFixed(4)} ` +
             `(Range: ${MOVEMENT_RANGES[coin].min.toFixed(4)}-${MOVEMENT_RANGES[coin].max.toFixed(4)})`);
}
    

    // Update game result with all coin prices
    await connection.query(
      "UPDATE wingo SET amount=? , status = 1, release_status = 1 WHERE period = ? AND game = ?",
      [result,previousPeriod, join]
    );

    // Clear the admin override after applying it
    let adminWingoKey = "";
    if (game === 1) adminWingoKey = "wingo1";
    if (game === 3) adminWingoKey = "wingo3";
    if (game === 5) adminWingoKey = "wingo5";
    if (game === 10) adminWingoKey = "wingo10";

    await connection.query(
      `UPDATE admin_ac SET ${adminWingoKey} = ?`,
      ["-1"]
    );

    // Insert new game for the next period
    const timeNow = Date.now();
    const gameRepresentationId = GameRepresentationIds.WINGO[game];
    const NewGamePeriod = generatePeriod(gameRepresentationId);

    await connection.query(
      `INSERT INTO wingo SET period = ?, amount = 0, game = ?, status = 0, time = ?`,
      [NewGamePeriod, join, timeNow]
    );

    console.log("Game result calculated:", {
      startPrices,
      endPrices,
      priceChanges,
      bigTotal,
      smallTotal,
      adminOverride: adminOverrideValue,
      result
    });

    return {
      startPrices,
      endPrices,
      priceChanges,
      bigTotal,
      smallTotal,
      result
    };

  } catch (error) {
    console.error("❌ Error in addWinGo:", error.message);
    throw error;
  }
};

async function handlingWinGo1P(typeid,bigtotal, smalltotal,result) {
  try {
    // Map typeid to game name
    console.log("handleWingo1P started getting executed");
    let game;
    switch (typeid) {
      case 1: game = "wingo"; break;
      case 3: game = "wingo3"; break;
      case 5: game = "wingo5"; break;
      case 10: game = "wingo10"; break;
      default: 
        console.error(`Invalid typeid: ${typeid}`);
        return; // Exit if typeid is invalid
    }

    // Fetch the latest active game round
    const [winGoNow] = await connection.query(
      "SELECT * FROM wingo WHERE status = 1 AND release_status = 1 AND game = ? ORDER BY id DESC LIMIT 1",
      [game]
    );

    if (winGoNow.length === 0) {
      console.log(`No active game round found for ${game}`);
      return;
    }

    // Determine the winning result
    let winningSide;
    let winAmount;
    let loseAmount;

    if (result === 'n') {
      result = 'n'; // Down wins
      winningSide = 'Down';
      winAmount = smalltotal;
      loseAmount = bigtotal;
    } else if (result=== 'l') {
      result = 'l'; // Up wins
      winningSide = 'Up';
      winAmount = bigtotal;
      loseAmount = smalltotal;
    } else if(result==='d'){
      result = 'd'; // Draw
      winningSide = 'Draw';
      winAmount = 0; // No winnings in a draw
      loseAmount = 0; // No losses in a draw
    }
    else{
      result = 'invalid'; // Draw
      winningSide = 'Draw';
      winAmount = 0; // No winnings in a draw
      loseAmount = 0; // No losses in a draw
    }

    console.log(`Result: ${winningSide} (${result})`);
    console.log(`Big Total: ${bigtotal}, Small Total: ${smalltotal}`);
    console.log(`Winning Amount: ${winAmount}, Losing Amount: ${loseAmount}`);

    // Update all open bets with the result
    await connection.query(
      "UPDATE minutes_2 SET result = ? WHERE status = 0 AND game = ?",
      [result, game]
    );

    if (result === 'd') {
      // Handle draw: Mark all bets as draw (status = 3, for example) or refund
      await connection.query(
        "UPDATE minutes_2 SET status = 3 WHERE status = 0 AND game = ?",
        [game]
      );
      console.log(`All bets marked as draw (status = 3) for ${game}`);
    } else {
      // Mark losing bets (status = 2) and keep winning bets (status = 0)
      await batchUpdateBetStatus(result, game);

      // Process only winning bets (status still 0)
      const [winningBets] = await connection.query(
        "SELECT * FROM minutes_2 WHERE status = 0 AND game = ? AND bet = ?",
        [game, result]
      );

      for (const bet of winningBets) {
        const payout = calculateWinAmount(bet.bet, bet.result, bet.money);

        const [users] = await connection.query(
          "SELECT money FROM users WHERE phone = ?",
          [bet.phone]
        );

        if (users.length === 0) {
          console.error(`User not found for phone: ${bet.phone}`);
          continue;
        }

        const newBalance = parseFloat(users[0].money) + parseFloat(payout);

        await connection.query(
          "UPDATE minutes_2 SET `get` = ?, status = 1 WHERE id = ?",
          [parseFloat(payout), bet.id]
        );

        await connection.query(
          "UPDATE users SET money = ? WHERE phone = ?",
          [newBalance, bet.phone]
        );
      }
    }

    // Finalize the game round
    await connection.query(
      "UPDATE wingo SET release_status = 2 WHERE period = ? AND game = ?",
      [winGoNow[0].period, game]
    );

    console.log(`Game round finalized for ${game}, period: ${winGoNow[0].period}`);

  } catch (error) {
    console.error("Error in handlingWinGo1P:", error);
    throw error; // Rethrow to allow caller to handle
  }
}


const batchUpdateBetStatus = async (result, game) => {
  // The losing bet is the opposite of the result
  const losingBet = result === 'n' ? 'l' : 'n';
  
  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const [rows] = await connection.execute(
      `UPDATE minutes_2 SET status = 2 
       WHERE status = 0 AND game = ? AND bet = ?
       LIMIT ${batchSize}`,
      [game, losingBet]
    );

    if (rows.affectedRows === 0) break;
    offset += batchSize;
  }
};

// Period Controller

export const getPeriod = async (req, res) => {
  try {
    const { gameType } = req.params;
    const validTypes = ['1', '3', '5', '10'];
    
    if (!validTypes.includes(gameType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game type. Valid types: 1, 3, 5, 10'
      });
    }

    const gameName = gameType === '1' ? 'wingo' : `wingo${gameType}`;
    const [period] = await connection.execute(
      `SELECT period FROM wingo WHERE status=0 AND game=? ORDER BY id DESC LIMIT 1`,
      [gameName]
    );

    res.json({
      success: true,
      period: period[0]?.period,
      gameType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch period',
      // defaultPeriod: '000000'
    });
  }
};

// Other controllers would follow similar patterns...

const calculateWinAmount = (bet, result, total) => {
  // Simple payout calculation - adjust multiplier as needed
  const payoutMultiplier = 1.90; // Standard payout for binary options
  
  // Convert to lowercase for case-insensitive comparison
  bet = bet.toLowerCase();
  result = result.toLowerCase();

  // Only pay if bet matches result
  return bet === result ? total * payoutMultiplier : 0;
};

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

    const [amountWon]=await connection.query(
      `select sum(money) As winAmount
      from minutes_2 where code=?`,
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
        winAmount:amountWon.amount || 0,
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
        timeCondition = `AND today >= '${todayStart.toISOString()}'`;
        break;
      case "week":
        timeCondition = `AND today >= '${weekStart.toISOString()}'`;
        break;
      case "month":
        timeCondition = `AND today >= '${monthStart.toISOString()}'`;
        break;
      case "year":
        timeCondition = `AND today >= '${yearStart.toISOString()}'`;
        break;
      default:
        timeCondition = "";
    }

    const [[total]] = await connection.query(
      `SELECT COUNT(*) AS total 
       FROM minutes_2 
       WHERE code = ? ${timeCondition}`,
      [user.code]
    );

    const [[won]] = await connection.query(
      `SELECT COUNT(*) AS won 
       FROM minutes_2 
       WHERE code = ? AND result = bet ${timeCondition}`,
      [user.code]
    );

    const [[amountWon]] = await connection.query(
      `SELECT SUM(amount) AS win_amount 
       FROM minutes_2 
       WHERE code = ? AND result = bet ${timeCondition}`,
      [user.code]
    );

    const [[amountSpent]] = await connection.query(
      `SELECT SUM(amount) AS amount 
       FROM minutes_2 
       WHERE code = ? ${timeCondition}`,
      [user.code]
    );

    const stats = {
      totalBets: total.total || 0,
      betsWon: won.won || 0,
      betsLost: (total.total || 0) - (won.won || 0),
      amountSpent: amountSpent.amount || 0,
      amountWon: amountWon.win_amount || 0,
      winRate: ((won.won || 0) / (total.total || 1)) * 100
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

const getOverallProfitOrLoss = async (req, res) => {
  try {
    const user = await getUserByToken(req.cookies.auth);
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found" });
    }

    const { period } = req.params;

    let dateCondition = '';
    let dateColumn = 'today'; // assuming this is your date column name
    
    if (period === "today") {
      dateCondition = `AND DATE(${dateColumn}) = CURDATE()`;
    } else if (period === "week") {
      dateCondition = `AND ${dateColumn} >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    } else if (period === "month") {
      dateCondition = `AND ${dateColumn} >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`;
    } else if (period === "year") {
      dateCondition = `AND YEAR(${dateColumn}) = YEAR(CURDATE())`;
    } else if (period === "all") {
      dateCondition = '';
    } else {
      return res.status(400).json({ status: false, message: "Invalid period" });
    }

    const [[{ amount }]] = await connection.query(
      `SELECT SUM(
        CASE 
          WHEN result IS NULL THEN 0  -- Handle pending bets (no result yet)
          WHEN result = bet THEN amount  -- Win case
          ELSE -money  -- Loss case (including when result != bet)
        END
      ) AS amount 
       FROM minutes_2 
       WHERE code = ? ${dateCondition}`,
      [user.code]
    );

    const profitOrLoss = amount || 0;
    const statusText = profitOrLoss > 0 ? 'Profit' : profitOrLoss < 0 ? 'Loss' : 'Neutral';

    res.status(200).json({
      status: true,
      data: {
        profitOrLoss,
        status: statusText
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};


// Get current server time split into 4 digits
const getCurrentTimeDigits = (req, res) => {
  const now = new Date();
  const minutes = now.getMinutes(); // 0-59
  const seconds = now.getSeconds(); // 0-59

  res.json({
    min1: Math.floor(minutes / 10), // First digit of minute (e.g., "3" for 35 mins)
    min2: minutes % 10,             // Second digit (e.g., "5" for 35 mins)
    sec1: Math.floor(seconds / 10), // First digit of second (e.g., "0" for 09 secs)
    sec2: seconds % 10,             // Second digit (e.g., "9" for 09 secs)
    serverTime: now.getTime()       // Current server timestamp (for sync)
  });
};


const winGoController = {
  winGoPage,
  betWinGo,
  listOrderOld,
  GetMyEmerdList,
  handlingWinGo1P,
  addWinGo,
  distributeCommission,
  winGoPage3,
  winGoPage5,
  winGoPage10,
  getPeriod,
  getStatsByGame,
  getStatsByTimePeriod,
  getOverallProfitOrLoss,
  getCurrentTimeDigits
};

export default winGoController;
