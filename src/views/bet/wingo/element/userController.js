import connection from "../config/connectDB.js";
import md5 from "md5";
import request from "request";
import axios from "axios";
import { REWARD_TYPES_MAP } from "../constants/reward_types.js";
import { getDayTime } from "../helpers/games.js";

let timeNow = Date.now();

const randomNumber = (min, max) => {
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

const verifyCode = async (req, res) => {
  let auth = req.cookies.auth;
  let now = new Date().getTime();
  let timeEnd = +new Date() + 1000 * (60 * 2 + 0) + 500;
  let otp = randomNumber(100000, 999999);

  conswit[rows] = await connection.query(
    "SELECT * FROM users WHERE `token` = ? ",
    [auth],
  );
  if (!rows) {
    return res.status(200).json({
      message: "Account does not exist",
      status: false,
      timeStamp: timeNow,
    });
  }
  let user = rows[0];
  if (user.time_otp - now <= 0) {
    request(
      `http://47.243.168.18:9090/sms/batch/v2?appkey=NFJKdK&appsecret=brwkTw&phone=84${user.phone}&msg=Your verification code is ${otp}&extend=${now}`,
      async (error, response, body) => {
        let data = JSON.parse(body);
        if (data.code == "00000") {
          await connection.execute(
            "UPDATE users SET otp = ?, time_otp = ? WHERE phone = ? ",
            [otp, timeEnd, user.phone],
          );
          return res.status(200).json({
            message: "Submitted successfully",
            status: true,
            timeStamp: timeNow,
            timeEnd: timeEnd,
          });
        }
      },
    );
  } else {
    return res.status(200).json({
      message: "Send SMS regularly.",
      status: false,
      timeStamp: timeNow,
    });
  }
};

const aviator = async (req, res) => {
  let auth = req.cookies.auth;
  res.redirect(
    `https://jetx.asia/theninja/src/api/userapi.php?action=loginandregisterbyauth&token=${auth}`,
  );
};

const userInfo = async (req, res) => {
  let auth = req.cookies.auth;

  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [rows] = await connection.query(
    "SELECT * FROM users WHERE `token` = ? ",
    [auth],
  );

  if (!rows) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [recharge] = await connection.query(
    "SELECT * FROM recharge WHERE `phone` = ? AND status = 1",
    [rows[0].phone],
  );
  let totalRecharge = 0;
  recharge.forEach((data) => {
    totalRecharge += data.money;
  });

  const [withdraw] = await connection.query(
    "SELECT * FROM withdraw WHERE `phone` = ? AND status = 1",
    [rows[0].phone],
  );
  let totalWithdraw = 0;
  withdraw.forEach((data) => {
    totalWithdraw += data.money;
  });

  const { id, password, ip, veri, ip_address, status, time, token, ...others } =
    rows[0];

  return res.status(200).json({
    message: "Success",
    status: true,
    data: {
      code: others.code,
      id_user: others.id_user,
      name_user: others.name_user,
      phone_user: others.phone,
      money_user: others.money,
      bonus_money: others.bonus_money,
      avatar: others.avatar,
      level: others.level,
      total_withdraw: totalWithdraw,
      total_recharge: totalRecharge,
      vip_level: others.vip_level,
    },
    totalRecharge: totalRecharge,
    totalWithdraw: totalWithdraw,
    timeStamp: timeNow,
  });
};

const changeUser = async (req, res) => {
  let auth = req.cookies.auth;
  let name = req.body.name;
  let type = req.body.type;

  const [rows] = await connection.query(
    "SELECT * FROM users WHERE `token` = ? ",
    [auth],
  );
  if (!rows || !type || !name)
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  switch (type) {
    case "editname":
      await connection.query(
        "UPDATE users SET name_user = ? WHERE `token` = ? ",
        [name, auth],
      );
      return res.status(200).json({
        message: "Username modification successful",
        status: true,
        timeStamp: timeNow,
      });
      break;

    default:
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: timeNow,
      });
      break;
  }
};

const changePassword = async (req, res) => {
  let auth = req.cookies.auth;
  let password = req.body.password;
  let newPassWord = req.body.newPassWord;
  // let otp = req.body.otp;

  if (!password || !newPassWord)
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  const [rows] = await connection.query(
    "SELECT * FROM users WHERE `token` = ? AND `password` = ? ",
    [auth, md5(password)],
  );
  if (rows.length == 0)
    return res.status(200).json({
      message: "Incorrect password",
      status: false,
      timeStamp: timeNow,
    });

  // let getTimeEnd = Number(rows[0].time_otp);
  // let tet = new Date(getTimeEnd).getTime();
  // var now = new Date().getTime();
  // var timeRest = tet - now;
  // if (timeRest <= 0) {
  //     return res.status(200).json({
  //         message: 'Mã OTP đã hết hiệu lực',
  //         status: false,
  //         timeStamp: timeNow,
  //     });
  // }

  // const [check_otp] = await connection.query('SELECT * FROM users WHERE `token` = ? AND `password` = ? AND otp = ? ', [auth, md5(password), otp]);
  // if(check_otp.length == 0) return res.status(200).json({
  //     message: 'Mã OTP không chính xác',
  //     status: false,
  //     timeStamp: timeNow,
  // });;

  await connection.query(
    "UPDATE users SET otp = ?, password = ?, plain_password = ? WHERE `token` = ? ",
    [randomNumber(100000, 999999), md5(newPassWord), newPassWord, auth],
  );
  return res.status(200).json({
    message: "Password modification successful",
    status: true,
    timeStamp: timeNow,
  });
};

const checkInHandling = async (req, res) => {
  let auth = req.cookies.auth;
  let data = req.body.data;

  if (!auth)
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  const [rows] = await connection.query(
    "SELECT * FROM users WHERE `token` = ? ",
    [auth],
  );
  if (!rows)
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  if (!data) {
    const [point_list] = await connection.query(
      "SELECT * FROM point_list WHERE `phone` = ? ",
      [rows[0].phone],
    );
    return res.status(200).json({
      message: "No More Data",
      datas: point_list,
      status: true,
      timeStamp: timeNow,
    });
  }
  if (data) {
    if (data == 1) {
      const [point_lists] = await connection.query(
        "SELECT * FROM point_list WHERE `phone` = ? ",
        [rows[0].phone],
      );
      let check = rows[0].money;
      let point_list = point_lists[0];
      let get = 300;
      if (check >= data && point_list.total1 != 0) {
        await connection.query(
          "UPDATE users SET money = money + ? WHERE phone = ? ",
          [point_list.total1, rows[0].phone],
        );
        await connection.query(
          "UPDATE point_list SET total1 = ? WHERE phone = ? ",
          [0, rows[0].phone],
        );
        return res.status(200).json({
          message: `You just received ₹ ${point_list.total1}.00`,
          status: true,
          timeStamp: timeNow,
        });
      } else if (check < get && point_list.total1 != 0) {
        return res.status(200).json({
          message: "Please Recharge ₹ 300 to claim gift.",
          status: false,
          timeStamp: timeNow,
        });
      } else if (point_list.total1 == 0) {
        return res.status(200).json({
          message: "You have already received this gift",
          status: false,
          timeStamp: timeNow,
        });
      }
    }
    if (data == 2) {
      const [point_lists] = await connection.query(
        "SELECT * FROM point_list WHERE `phone` = ? ",
        [rows[0].phone],
      );
      let check = rows[0].money;
      let point_list = point_lists[0];
      let get = 3000;
      if (check >= get && point_list.total2 != 0) {
        await connection.query(
          "UPDATE users SET money = money + ? WHERE phone = ? ",
          [point_list.total2, rows[0].phone],
        );
        await connection.query(
          "UPDATE point_list SET total2 = ? WHERE phone = ? ",
          [0, rows[0].phone],
        );
        return res.status(200).json({
          message: `You just received ₹ ${point_list.total2}.00`,
          status: true,
          timeStamp: timeNow,
        });
      } else if (check < get && point_list.total2 != 0) {
        return res.status(200).json({
          message: "Please Recharge ₹ 3000 to claim gift.",
          status: false,
          timeStamp: timeNow,
        });
      } else if (point_list.total2 == 0) {
        return res.status(200).json({
          message: "You have already received this gift",
          status: false,
          timeStamp: timeNow,
        });
      }
    }
    if (data == 3) {
      const [point_lists] = await connection.query(
        "SELECT * FROM point_list WHERE `phone` = ? ",
        [rows[0].phone],
      );
      let check = rows[0].money;
      let point_list = point_lists[0];
      let get = 6000;
      if (check >= get && point_list.total3 != 0) {
        await connection.query(
          "UPDATE users SET money = money + ? WHERE phone = ? ",
          [point_list.total3, rows[0].phone],
        );
        await connection.query(
          "UPDATE point_list SET total3 = ? WHERE phone = ? ",
          [0, rows[0].phone],
        );
        return res.status(200).json({
          message: `You just received ₹ ${point_list.total3}.00`,
          status: true,
          timeStamp: timeNow,
        });
      } else if (check < get && point_list.total3 != 0) {
        return res.status(200).json({
          message: "Please Recharge ₹ 6000 to claim gift.",
          status: false,
          timeStamp: timeNow,
        });
      } else if (point_list.total3 == 0) {
        return res.status(200).json({
          message: "You have already received this gift",
          status: false,
          timeStamp: timeNow,
        });
      }
    }
    if (data == 4) {
      const [point_lists] = await connection.query(
        "SELECT * FROM point_list WHERE `phone` = ? ",
        [rows[0].phone],
      );
      let check = rows[0].money;
      let point_list = point_lists[0];
      let get = 12000;
      if (check >= get && point_list.total4 != 0) {
        await connection.query(
          "UPDATE users SET money = money + ? WHERE phone = ? ",
          [point_list.total4, rows[0].phone],
        );
        await connection.query(
          "UPDATE point_list SET total4 = ? WHERE phone = ? ",
          [0, rows[0].phone],
        );
        return res.status(200).json({
          message: `You just received ₹ ${point_list.total4}.00`,
          status: true,
          timeStamp: timeNow,
        });
      } else if (check < get && point_list.total4 != 0) {
        return res.status(200).json({
          message: "Please Recharge ₹ 12000 to claim gift.",
          status: false,
          timeStamp: timeNow,
        });
      } else if (point_list.total4 == 0) {
        return res.status(200).json({
          message: "You have already received this gift",
          status: false,
          timeStamp: timeNow,
        });
      }
    }
    if (data == 5) {
      const [point_lists] = await connection.query(
        "SELECT * FROM point_list WHERE `phone` = ? ",
        [rows[0].phone],
      );
      let check = rows[0].money;
      let point_list = point_lists[0];
      let get = 28000;
      if (check >= get && point_list.total5 != 0) {
        await connection.query(
          "UPDATE users SET money = money + ? WHERE phone = ? ",
          [point_list.total5, rows[0].phone],
        );
        await connection.query(
          "UPDATE point_list SET total5 = ? WHERE phone = ? ",
          [0, rows[0].phone],
        );
        return res.status(200).json({
          message: `You just received ₹ ${point_list.total5}.00`,
          status: true,
          timeStamp: timeNow,
        });
      } else if (check < get && point_list.total5 != 0) {
        return res.status(200).json({
          message: "Please Recharge ₹ 28000 to claim gift.",
          status: false,
          timeStamp: timeNow,
        });
      } else if (point_list.total5 == 0) {
        return res.status(200).json({
          message: "You have already received this gift",
          status: false,
          timeStamp: timeNow,
        });
      }
    }
    if (data == 6) {
      const [point_lists] = await connection.query(
        "SELECT * FROM point_list WHERE `phone` = ? ",
        [rows[0].phone],
      );
      let check = rows[0].money;
      let point_list = point_lists[0];
      let get = 100000;
      if (check >= get && point_list.total6 != 0) {
        await connection.query(
          "UPDATE users SET money = money + ? WHERE phone = ? ",
          [point_list.total6, rows[0].phone],
        );
        await connection.query(
          "UPDATE point_list SET total6 = ? WHERE phone = ? ",
          [0, rows[0].phone],
        );
        return res.status(200).json({
          message: `You just received ₹ ${point_list.total6}.00`,
          status: true,
          timeStamp: timeNow,
        });
      } else if (check < get && point_list.total6 != 0) {
        return res.status(200).json({
          message: "Please Recharge ₹ 100000 to claim gift.",
          status: false,
          timeStamp: timeNow,
        });
      } else if (point_list.total6 == 0) {
        return res.status(200).json({
          message: "You have already received this gift",
          status: false,
          timeStamp: timeNow,
        });
      }
    }
    if (data == 7) {
      const [point_lists] = await connection.query(
        "SELECT * FROM point_list WHERE `phone` = ? ",
        [rows[0].phone],
      );
      let check = rows[0].money;
      let point_list = point_lists[0];
      let get = 200000;
      if (check >= get && point_list.total7 != 0) {
        await connection.query(
          "UPDATE users SET money = money + ? WHERE phone = ? ",
          [point_list.total7, rows[0].phone],
        );
        await connection.query(
          "UPDATE point_list SET total7 = ? WHERE phone = ? ",
          [0, rows[0].phone],
        );
        return res.status(200).json({
          message: `You just received ₹ ${point_list.total7}.00`,
          status: true,
          timeStamp: timeNow,
        });
      } else if (check < get && point_list.total7 != 0) {
        return res.status(200).json({
          message: "Please Recharge ₹200000 to claim gift.",
          status: false,
          timeStamp: timeNow,
        });
      } else if (point_list.total7 == 0) {
        return res.status(200).json({
          message: "You have already received this gift",
          status: false,
          timeStamp: timeNow,
        });
      }
    }
  }
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

const promotion = async (req, res) => {
  let auth = req.cookies.auth;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite`, `roses_f`, `roses_f1`, `roses_today` FROM users WHERE `token` = ? ",
    [auth],
  );
  const [level] = await connection.query("SELECT * FROM level");

  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  let userInfo = user[0];

  // Directly referred level-1 users
  const [f1s] = await connection.query(
    "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
    [userInfo.code],
  );

  // Directly referred users today
  let f1_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_time = f1s[i].time;
    let check = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check) {
      f1_today += 1;
    }
  }

  // All direct referrals today
  let f_all_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code;
    const f1_time = f1s[i].time;
    let check_f1 = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check_f1) f_all_today += 1;

    // Total level-2 referrals today
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const f2_time = f2s[i].time;
      let check_f2 = timerJoin(f2_time) == timerJoin() ? true : false;
      if (check_f2) f_all_today += 1;

      // Total level-3 referrals today
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code;
        const f3_time = f3s[i].time;
        let check_f3 = timerJoin(f3_time) == timerJoin() ? true : false;
        if (check_f3) f_all_today += 1;

        // Total level-4 referrals today
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        for (let i = 0; i < f4s.length; i++) {
          const f4_code = f4s[i].code;
          const f4_time = f4s[i].time;
          let check_f4 = timerJoin(f4_time) == timerJoin() ? true : false;
          if (check_f4) f_all_today += 1;
        }
      }
    }
  }

  // Total level-2 referrals
  let f2 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code;
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    f2 += f2s.length;
  }

  // Total level-3 referrals
  let f3 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code;
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      if (f3s.length > 0) f3 += f3s.length;
    }
  }

  // Total level-4 referrals
  let f4 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code;
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        if (f4s.length > 0) f4 += f4s.length;
      }
    }
  }

  let selectedData = [];

  async function fetchInvitesByCode(code, depth = 1) {
    if (depth > 6) {
      return;
    }

    const [inviteData] = await connection.query(
      "SELECT `id_user`,`name_user`,`phone`, `code`, `invite`, `rank`, `user_level`, `total_money` FROM users WHERE `invite` = ?",
      [code],
    );

    if (inviteData.length > 0) {
      for (const invite of inviteData) {
        selectedData.push(invite);
        await fetchInvitesByCode(invite.code, depth + 1);
      }
    }
  }

  if (f1s.length > 0) {
    for (const initialInfoF1 of f1s) {
      selectedData.push(initialInfoF1);
      await fetchInvitesByCode(initialInfoF1.code);
    }
  }

  const rosesF1 = parseFloat(userInfo.roses_f);
  const rosesAll = parseFloat(userInfo.roses_f1);
  let rosesAdd = rosesF1 + rosesAll;

  return res.status(200).json({
    message: "Receive success",
    level: level,
    info: user,
    status: true,
    invite: {
      f1: f1s.length,
      total_f: selectedData.length,
      f1_today: f1_today,
      f_all_today: f_all_today,
      roses_f1: userInfo.roses_f1,
      roses_f: userInfo.roses_f,
      roses_all: rosesAdd,
      roses_today: userInfo.roses_today,
    },
    timeStamp: timeNow,
  });
};

const myTeam = async (req, res) => {
  let auth = req.cookies.auth;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  const [level] = await connection.query("SELECT * FROM level");
  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  return res.status(200).json({
    message: "Receive success",
    level: level,
    info: user,
    status: true,
    timeStamp: timeNow,
  });
};

const listMyTeam = async (req, res) => {
  let auth = req.cookies.auth;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let userInfo = user[0];
  const [f1] = await connection.query(
    "SELECT `id_user`, `phone`, `code`, `invite`,`roses_f`, `rank`, `name_user`,`status`,`total_money`, `time` FROM users WHERE `invite` = ? ORDER BY id DESC",
    [userInfo.code],
  );
  const [mem] = await connection.query(
    "SELECT `id_user`, `phone`, `time` FROM users WHERE `invite` = ? ORDER BY id DESC LIMIT 100",
    [userInfo.code],
  );
  const [total_roses] = await connection.query(
    "SELECT `f1`,`invite`, `code`,`phone`,`time` FROM roses WHERE `invite` = ? ORDER BY id DESC LIMIT 100",
    [userInfo.code],
  );

  const selectedData = [];

  async function fetchUserDataByCode(code, depth = 1) {
    if (depth > 6) {
      return;
    }

    const [userData] = await connection.query(
      "SELECT `id_user`, `name_user`, `phone`, `code`, `invite`, `rank`, `total_money` FROM users WHERE `invite` = ?",
      [code],
    );
    if (userData.length > 0) {
      for (const user of userData) {
        const [turnoverData] = await connection.query(
          "SELECT `phone`, `daily_turn_over`, `total_turn_over` FROM turn_over WHERE `phone` = ?",
          [user.phone],
        );
        const [inviteCountData] = await connection.query(
          "SELECT COUNT(*) as invite_count FROM users WHERE `invite` = ?",
          [user.code],
        );
        const inviteCount = inviteCountData[0].invite_count;

        const userObject = {
          ...user,
          invite_count: inviteCount,
          user_level: depth,
          daily_turn_over: turnoverData[0]?.daily_turn_over || 0,
          total_turn_over: turnoverData[0]?.total_turn_over || 0,
        };

        selectedData.push(userObject);
        await fetchUserDataByCode(user.code, depth + 1);
      }
    }
  }

  await fetchUserDataByCode(userInfo.code);

  let newMem = [];
  mem.map((data) => {
    let objectMem = {
      id_user: data.id_user,
      phone:
        "91" + data.phone.slice(0, 1) + "****" + String(data.phone.slice(-4)),
      time: data.time,
    };

    return newMem.push(objectMem);
  });
  return res.status(200).json({
    message: "Receive success",
    f1: selectedData,
    f1_direct: f1,
    mem: newMem,
    total_roses: total_roses,
    status: true,
    timeStamp: timeNow,
  });
};
const wowpay = async (req, res) => {
  let auth = req.cookies.auth;
  let money = req.body.money;

  // Fetching the user's mobile number from the database using auth token

  // Your existing controller code here
};

const recharge = async (req, res) => {
  let auth = req.cookies.auth;
  let money = req.body.money;
  let type = req.body.type;
  let typeid = req.body.typeid;

  const minimumMoney = process.env.MINIMUM_MONEY_INR;

  if (type != "cancel") {
    if (!auth || !money || money < minimumMoney - 1) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: timeNow,
      });
    }
  }
  const [user] = await connection.query(
    "SELECT `phone`, `code`,`name_user`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  let userInfo = user[0];
  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  if (type == "cancel") {
    await connection.query(
      "UPDATE recharge SET status = 2 WHERE phone = ? AND id_order = ? AND status = ? ",
      [userInfo.phone, typeid, 0],
    );
    return res.status(200).json({
      message: "Cancelled order successfully",
      status: true,
      timeStamp: timeNow,
    });
  }
  const [recharge] = await connection.query(
    "SELECT * FROM recharge WHERE phone = ? AND status = ? ",
    [userInfo.phone, 0],
  );

  if (recharge.length == 0) {
    let time = new Date().getTime();
    const date = new Date();
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
    let checkTime = timerJoin(time);
    let id_time =
      date.getUTCFullYear() +
      "" +
      date.getUTCMonth() +
      1 +
      "" +
      date.getUTCDate();
    let id_order =
      Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1)) +
      10000000000000;
    // let vat = Math.floor(Math.random() * (2000 - 0 + 1) ) + 0;

    money = Number(money);
    let client_transaction_id = id_time + id_order;
    const formData = {
      username: process.env.accountBank,
      secret_key: process.env.secret_key,
      client_transaction: client_transaction_id,
      amount: money,
    };

    if (type == "momo") {
      const sql = `INSERT INTO recharge SET 
            id_order = ?,
            transaction_id = ?,
            phone = ?,
            money = ?,
            type = ?,
            status = ?,
            today = ?,
            url = ?,
            time = ?`;
      await connection.execute(sql, [
        client_transaction_id,
        "NULL",
        userInfo.phone,
        money,
        type,
        0,
        checkTime,
        "NULL",
        time,
      ]);
      const [recharge] = await connection.query(
        "SELECT * FROM recharge WHERE phone = ? AND status = ? ",
        [userInfo.phone, 0],
      );
      return res.status(200).json({
        message: "Received successfully",
        datas: recharge[0],
        status: true,
        timeStamp: timeNow,
      });
    }

    const moneyString = money.toString();

    const apiData = {
      key: "60a9ca13-6929-4e40-b687-ff7293e61dce",
      client_txn_id: client_transaction_id,
      amount: moneyString,
      p_info: "WINGO PAYMENT",
      customer_name: userInfo.name_user,
      customer_email: "manas.xdr@gmail.com",
      customer_mobile: userInfo.phone,
      redirect_url: `https://bharatgames.site/wallet/verify/upi`,
      udf1: "Indnclub",
    };

    try {
      const apiResponse = await axios.post(
        "https://api.ekqr.in/api/create_order",
        apiData,
      );

      if (apiResponse.data.status == true) {
        const sql = `INSERT INTO recharge SET 
                id_order = ?,
                transaction_id = ?,
                phone = ?,
                money = ?,
                type = ?,
                status = ?,
                today = ?,
                url = ?,
                time = ?`;

        await connection.execute(sql, [
          client_transaction_id,
          "0",
          userInfo.phone,
          money,
          type,
          0,
          checkTime,
          "0",
          timeNow,
        ]);

        const [recharge] = await connection.query(
          "SELECT * FROM recharge WHERE phone = ? AND status = ? ",
          [userInfo.phone, 0],
        );

        return res.status(200).json({
          message: "Received successfully",
          datas: recharge[0],
          payment_url: apiResponse.data.data.payment_url,
          status: true,
          timeStamp: timeNow,
        });
      } else {
        return res
          .status(500)
          .json({ message: "Failed to create order", status: false });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: "API request failed", status: false });
    }
  } else {
    return res.status(200).json({
      message: "Received successfully",
      datas: recharge[0],
      status: true,
      timeStamp: timeNow,
    });
  }
};

const cancelRecharge = async (req, res) => {
  try {
    let auth = req.cookies.auth;

    if (!auth) {
      return res.status(200).json({
        message: "Authorization is required to access this API!",
        status: false,
        timeStamp: timeNow,
      });
    }

    const [user] = await connection.query(
      "SELECT `phone`, `code`,`name_user`,`invite` FROM users WHERE `token` = ? ",
      [auth],
    );

    if (!user) {
      return res.status(200).json({
        message: "Authorization is required to access this API!",
        status: false,
        timeStamp: timeNow,
      });
    }

    let userInfo = user[0];

    const result = await connection.query(
      "DELETE FROM recharge WHERE phone = ? AND status = ?",
      [userInfo.phone, 0],
    );

    if (result.affectedRows > 0) {
      return res.status(200).json({
        message: "All the pending recharges has been deleted successfully!",
        status: true,
        timeStamp: timeNow,
      });
    } else {
      return res.status(200).json({
        message:
          "There was no pending recharges for this user or delete operation has been failed!",
        status: true,
        timeStamp: timeNow,
      });
    }
  } catch (error) {
    console.error("API error: ", error);
    return res.status(500).json({
      message: "API Request failed!",
      status: false,
      timeStamp: timeNow,
    });
  }
};

const addBank = async (req, res) => {
  let timeNow = Date.now();
  try {
    let auth = req.cookies.auth;
    // let name_bank = req.body.name_bank
    // let name_user = req.body.name_user
    // let stk = req.body.stk
    // let email = req.body.email
    // let sdt = req.body.sdt
    // let tinh = req.body.tinh

    let bankName = req.body.bankName;
    let recipientName = req.body.recipientName;
    let bankAccountNumber = req.body.bankAccountNumber;
    let phoneNumber = req.body.phoneNumber;
    let IFSC = req.body.IFSC;
    let upiId = req.body.upiId;

    let time = new Date().getTime();

    if (!auth || !name_bank || !name_user || !stk || !email || !stk || !tinh) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: timeNow,
      });
    }

    const [user] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ",
      [auth],
    );
    let userInfo = user[0];
    if (!user) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: timeNow,
      });
    }

    const [user_bank] = await connection.query(
      "SELECT * FROM user_bank WHERE tinh = ? ",
      [tinh],
    );
    const [user_bank2] = await connection.query(
      "SELECT * FROM user_bank WHERE phone = ? ",
      [userInfo.phone],
    );
    if (user_bank.length == 0 && user_bank2.length == 0) {
      const sql = `INSERT INTO user_bank SET 
        phone = ?,
        name_bank = ?,
        name_user = ?,
        stk = ?,
        email = ?,
        sdt = ?,
        tinh = ?,
        time = ?`;
      await connection.execute(sql, [
        userInfo.phone,
        name_bank,
        name_user,
        stk,
        email,
        sdt,
        tinh,
        time,
      ]);
      return res.status(200).json({
        message: "Successfully added bank",
        status: true,
        timeStamp: timeNow,
      });
    } else if (user_bank.length == 0) {
      await connection.query("UPDATE user_bank SET tinh = ? WHERE phone = ? ", [
        tinh,
        userInfo.phone,
      ]);
      return res.status(200).json({
        message: "KYC Already Done",
        status: false,
        timeStamp: timeNow,
      });
    } else if (user_bank2.length > 0) {
      await connection.query(
        "UPDATE user_bank SET name_bank = ?, name_user = ?, stk = ?, email = ?, sdt = ?, tinh = ?, time = ? WHERE phone = ?",
        [name_bank, name_user, stk, email, sdt, tinh, time, userInfo.phone],
      );
      return res.status(200).json({
        message: "your account is updated",
        status: false,
        timeStamp: timeNow,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "",
      status: false,
      timeStamp: timeNow,
    });
  }
};

// const infoUserBank = async (req, res) => {
//    let auth = req.cookies.auth;
//    if (!auth) {
//       return res.status(200).json({
//          message: "Failed",
//          status: false,
//          timeStamp: timeNow,
//       });
//    }
//    const [user] = await connection.query("SELECT `phone`, `code`,`invite`, `money` FROM users WHERE `token` = ? ", [auth]);
//    let userInfo = user[0];
//    if (!user) {
//       return res.status(200).json({
//          message: "Failed",
//          status: false,
//          timeStamp: timeNow,
//       });
//    }
//    function formateT(params) {
//       let result = params < 10 ? "0" + params : params;
//       return result;
//    }

//    function timerJoin(params = "", addHours = 0) {
//       let date = "";
//       if (params) {
//          date = new Date(Number(params));
//       } else {
//          date = new Date();
//       }

//       date.setHours(date.getHours() + addHours);

//       let years = formateT(date.getFullYear());
//       let months = formateT(date.getMonth() + 1);
//       let days = formateT(date.getDate());

//       let hours = date.getHours() % 12;
//       hours = hours === 0 ? 12 : hours;
//       let ampm = date.getHours() < 12 ? "AM" : "PM";

//       let minutes = formateT(date.getMinutes());
//       let seconds = formateT(date.getSeconds());

//       return years + "-" + months + "-" + days + " " + hours + ":" + minutes + ":" + seconds + " " + ampm;
//    }
//    let date = new Date().getTime();
//    let checkTime = timerJoin(date);
//    const [recharge] = await connection.query("SELECT * FROM recharge WHERE phone = ? AND status = 1", [userInfo.phone]);
//    const [minutes_1] = await connection.query("SELECT * FROM minutes_1 WHERE phone = ?", [userInfo.phone]);
//    let total = 0;
//    recharge.forEach(data => {
//       total += parseFloat(data.money);
//    });
//    let total2 = 0;
//    minutes_1.forEach(data => {
//       total2 += parseFloat(data.money);
//    });
//    let fee = 0;
//    minutes_1.forEach(data => {
//       fee += parseFloat(data.fee);
//    });

//    result = Math.max(result, 0);
//    let result = 0;
//    if (total - total2 > 0) result = total - total2 - fee;

//    const [userBank] = await connection.query("SELECT * FROM user_bank WHERE phone = ? ", [userInfo.phone]);
//    return res.status(200).json({
//       message: "Received successfully",
//       datas: userBank,
//       userInfo: user,
//       result: result,
//       status: true,
//       timeStamp: timeNow,
//    });
// };

const infoUserBank = async (req, res) => {
  let auth = req.cookies.auth;
  try {
    if (!auth) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: timeNow,
      });
    }
    const [user] = await connection.query(
      "SELECT * FROM users WHERE `token` = ? ",
      [auth],
    );

    if (!user) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: timeNow,
      });
    }

    let timeNow = Date.now();
    const userInfo = user[0];

    // *****************************************LAST RECHARGE BET TIME*****************************************
    const [lastRecharge] = await connection.query(
      `SELECT * FROM recharge WHERE phone = '${userInfo.phone}' AND status = 1 ORDER BY time_remaining_bet DESC LIMIT 1`,
    );
    let lastRechargeRemainingBet =
      lastRecharge.length === 0
        ? 0
        : Number(lastRecharge[0].remaining_bet) || 0;

    // *****************************************WHEN BET RESET TIME*****************************************
    const [lastBetResetTime] = await connection.query(
      `SELECT time_remaining_bet FROM recharge WHERE phone = '${userInfo.phone}' AND status = 1 AND remaining_bet = 0 ORDER BY time_remaining_bet DESC LIMIT 1`,
    );
    const lastBetResetTimeRemainingBet = lastBetResetTime.length > 0 ? lastBetResetTime[0] : { time_remaining_bet: null };
    const betTimeInterval =
      !lastBetResetTimeRemainingBet.time_remaining_bet
        ? ""
        : `AND time > ${lastBetResetTime[0].time_remaining_bet}`;

    // *****************************************GIFT CARD USED AFTER THE LAST RECHARGE TIME*****************************************
    const [giftCardUsed] = await connection.query(
      `SELECT SUM(money) AS giftCardTotalAmount FROM redenvelopes_used WHERE phone_used = '${userInfo.phone}' ${betTimeInterval}`,
    );
    const giftCardTotalAmount =
      Number(giftCardUsed[0].giftCardTotalAmount) || 0;

    const specificRewardTypes = [
      REWARD_TYPES_MAP.FIRST_RECHARGE_BONUS,
      REWARD_TYPES_MAP.DAILY_RECHARGE_BONUS,
      REWARD_TYPES_MAP.FIRST_RECHARGE_AGENT_BONUS,
      REWARD_TYPES_MAP.DAILY_RECHARGE_AGENT_BONUS,
    ];

    const rewardTypesString = specificRewardTypes
      .map((type) => `'${type}'`)
      .join(", ");

    const [claimRewards] = await connection.query(
      `
         SELECT SUM(amount) AS totalClaimRewards 
         FROM claimed_rewards 
         WHERE phone = ? 
         AND type IN (${rewardTypesString})
         ${betTimeInterval}
         `,
      [userInfo.phone],
    );

    const totalClaimRewards = Number(claimRewards[0].totalClaimRewards) || 0;

    // *****************************************BET LOSS CALCULATIONS*****************************************
    const [wingoLossResult] = await connection.query(
      `SELECT SUM(money) AS totalMoney,SUM(fee) AS totalFees FROM minutes_1 WHERE phone = '${userInfo.phone}' ${betTimeInterval}`,
    );
    const wingoLossMoney =
      parseFloat(wingoLossResult[0].totalMoney) +
      parseFloat(wingoLossResult[0].totalFees) || 0;

    const [k3LossResult] = await connection.query(
      `SELECT SUM(money) AS k3LossMoney FROM result_k3 WHERE phone = '${userInfo.phone}' ${betTimeInterval}`,
    );
    const k3LossMoney = Number(k3LossResult[0].k3LossMoney) || 0;

    const [G5LossResult] = await connection.query(
      `SELECT SUM(money) AS G5dLossMoney FROM result_5d WHERE phone = '${userInfo.phone}' ${betTimeInterval}`,
    );
    const G5dLossMoney = Number(G5LossResult[0].G5dLossMoney) || 0;

    const [trxWingoLossResult] = await connection.query(
      `SELECT SUM(money) AS trxWingoLossMoney FROM trx_wingo_bets WHERE phone = '${userInfo.phone}' ${betTimeInterval}`,
    );
    const trxWingoLossMoney =
      Number(trxWingoLossResult[0].trxWingoLossMoney) || 0;

    const [withdrawResult] = await connection.query(
      `SELECT SUM(money) AS totalWithdraw FROM withdraw WHERE phone = '${userInfo.phone}' AND status = 1`,
    );
    const totalWithdraw = Number(withdrawResult[0].totalWithdraw) || 0;

    const [withdrawPendingResult] = await connection.query(
      `SELECT SUM(money) AS totalWithdrawPending FROM withdraw WHERE phone = '${userInfo.phone}' AND status = 0`,
    );
    const totalWithdrawPending =
      Number(withdrawPendingResult[0].totalWithdrawPending) || 0;

    const totalLoss =
      wingoLossMoney + k3LossMoney + G5dLossMoney + trxWingoLossMoney;

    console.log("totalLoss", totalLoss);
    console.log("totalWithdraw", totalWithdraw);
    console.log("totalWithdrawPending", totalWithdrawPending);

    // *****************************************WITHDRAWAL CALCULATIONS*****************************************
    const calculation =
      lastRechargeRemainingBet +
      totalClaimRewards +
      giftCardTotalAmount -
      totalLoss;
    const totalBetAmountRemaining = calculation < 0 ? 0 : calculation;
    // console.log("lastRechargeId", lastRecharge[0].id)
    const allowedWithdrawAmount = totalBetAmountRemaining === 0;
    console.log(
      lastRechargeRemainingBet,
      totalClaimRewards,
      giftCardTotalAmount,
    );
    console.log(
      totalLoss,
      lastRechargeRemainingBet,
      allowedWithdrawAmount,
      calculation,
    );

    if (calculation < 0 && lastRecharge.length > 0) {
      await connection.query(
        `UPDATE recharge SET remaining_bet = 0, time_remaining_bet = ? WHERE id = ? AND status = 1`,
        [timeNow, lastRecharge[0].id],
      );
    }

    // Total bet amount remaining for withdrawal if not remaining bet allow it to withdraw

    return res.status(200).json({
      message: "Received successfully",
      userInfo: {
        code: user[0].code,
        id_user: user[0].id_user,
        name_user: user[0].name_user,
        phone_user: user[0].phone,
        money_user: user[0].money,
        bonus_money: user[0].bonus_money,
        avatar: user[0].avatar,
      },
      totalBetAmountRemaining,
      allowedWithdrawAmount,
      status: true,
      timeStamp: timeNow,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: false,
      timeStamp: timeNow,
    });
  }
};

const withdrawal3 = async (req, res) => {
  let auth = req.cookies.auth;
  let money = req.body.money;
  let password = req.body.password;
  if (!auth || !money || !password || money < 299) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite`, `money` FROM users WHERE `token` = ? AND password = ?",
    [auth, md5(password)],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "incorrect password",
      status: false,
      timeStamp: timeNow,
    });
  }
  let userInfo = user[0];
  const date = new Date();
  let id_time =
    date.getUTCFullYear() +
    "" +
    date.getUTCMonth() +
    1 +
    "" +
    date.getUTCDate();
  let id_order =
    Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1)) +
    10000000000000;

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
  let dates = new Date().getTime();
  let checkTime = timerJoin(dates);
  const [recharge] = await connection.query(
    "SELECT * FROM recharge WHERE phone = ? AND status = 1",
    [userInfo.phone],
  );
  const [minutes_1] = await connection.query(
    "SELECT * FROM minutes_1 WHERE phone = ?",
    [userInfo.phone],
  );
  let total = 0;
  recharge.forEach((data) => {
    total += parseFloat(data.money);
  });
  let total2 = 0;
  minutes_1.forEach((data) => {
    total2 += parseFloat(data.money);
  });
  let result = 0;
  if (total - total2 > 0) result = total - total2;
  result = Math.max(result, 0);
  const [user_bank] = await connection.query(
    "SELECT * FROM user_bank WHERE `phone` = ?",
    [userInfo.phone],
  );
  const [withdraw] = await connection.query(
    "SELECT * FROM withdraw WHERE `phone` = ? AND today = ?",
    [userInfo.phone, checkTime],
  );
  if (user_bank.length != 0) {
    if (withdraw.length < 3) {
      if (userInfo.money - money >= 0) {
        if (result == 0) {
          if (total - total2 >= 0) {
            if (result == 0) {
              return res.status(200).json({
                message: "The total bet is not enough to fulfill the request",
                status: false,
                timeStamp: timeNow,
              });
            }
          } else {
            let infoBank = user_bank[0];
            const sql = `INSERT INTO withdraw SET 
                    id_order = ?,
                    phone = ?,
                    money = ?,
                    stk = ?,
                    name_bank = ?,
                    ifsc = ?,
                    name_user = ?,
                    status = ?,
                    today = ?,
                    time = ?`;
            await connection.execute(sql, [
              id_time + "" + id_order,
              userInfo.phone,
              money,
              infoBank.stk,
              infoBank.name_bank,
              infoBank.email,
              infoBank.name_user,
              0,
              checkTime,
              dates,
            ]);
            await connection.query(
              "UPDATE users SET money = money - ? WHERE phone = ? ",
              [money, userInfo.phone],
            );
            return res.status(200).json({
              message: "Withdrawal successful",
              status: true,
              money: userInfo.money - money,
              timeStamp: timeNow,
            });
          }
        } else {
          return res.status(200).json({
            message: "The total bet is not enough to fulfill the request",
            status: false,
            timeStamp: timeNow,
          });
        }
      } else {
        return res.status(200).json({
          message: "The balance is not enough to fulfill the request",
          status: false,
          timeStamp: timeNow,
        });
      }
    } else {
      return res.status(200).json({
        message: "You can only make 2 withdrawals per day",
        status: false,
        timeStamp: timeNow,
      });
    }
  } else {
    return res.status(200).json({
      message: "Please link your bank first",
      status: false,
      timeStamp: timeNow,
    });
  }
};
const transfer = async (req, res) => {
  let auth = req.cookies.auth;
  let amount = req.body.amount;
  let receiver_phone = req.body.phone;
  const date = new Date();
  // let id_time = date.getUTCFullYear() + '' + (date.getUTCMonth() + 1) + '' + date.getUTCDate();
  let id_order =
    Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1)) +
    10000000000000;
  let time = new Date().getTime();
  let client_transaction_id = id_order;

  const [user] = await connection.query(
    "SELECT `phone`,`money`, `code`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  let userInfo = user[0];
  let sender_phone = userInfo.phone;
  let sender_money = parseInt(userInfo.money);
  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

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

  let dates = new Date().getTime();
  let checkTime = timerJoin(dates);
  const [recharge] = await connection.query(
    "SELECT * FROM recharge WHERE phone = ? AND status = 1 ",
    [userInfo.phone],
  );
  const [minutes_1] = await connection.query(
    "SELECT * FROM minutes_1 WHERE phone = ? ",
    [userInfo.phone],
  );
  let total = 0;
  recharge.forEach((data) => {
    total += data.money;
  });
  let total2 = 0;
  minutes_1.forEach((data) => {
    total2 += data.money;
  });

  let result = 0;
  if (total - total2 > 0) result = total - total2;

  // console.log('date:', result);
  if (result == 0) {
    if (sender_money >= amount) {
      let [receiver] = await connection.query(
        "SELECT * FROM users WHERE `phone` = ?",
        [receiver_phone],
      );
      if (receiver.length === 1 && sender_phone !== receiver_phone) {
        let money = sender_money - amount;
        let total_money = amount + receiver[0].total_money;
        // await connection.query('UPDATE users SET money = ? WHERE phone = ?', [money, sender_phone]);
        // await connection.query(`UPDATE users SET money = money + ? WHERE phone = ?`, [amount, receiver_phone]);
        const sql =
          "INSERT INTO balance_transfer (sender_phone, receiver_phone, amount) VALUES (?, ?, ?)";
        await connection.execute(sql, [sender_phone, receiver_phone, amount]);
        const sql_recharge =
          "INSERT INTO recharge (id_order, transaction_id, phone, money, type, status, today, url, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        await connection.execute(sql_recharge, [
          client_transaction_id,
          0,
          receiver_phone,
          amount,
          "wallet",
          0,
          checkTime,
          0,
          time,
        ]);

        return res.status(200).json({
          message: `Requested ${amount} sent successfully`,
          status: true,
          timeStamp: timeNow,
        });
      } else {
        return res.status(200).json({
          message: `${receiver_phone} is not a valid user mobile number`,
          status: false,
          timeStamp: timeNow,
        });
      }
    } else {
      return res.status(200).json({
        message: "Your balance is not enough",
        status: false,
        timeStamp: timeNow,
      });
    }
  } else {
    return res.status(200).json({
      message: "The total bet is not enough to fulfill the request",
      status: false,
      timeStamp: timeNow,
    });
  }
};

// get transfer balance data
const transferHistory = async (req, res) => {
  let auth = req.cookies.auth;

  const [user] = await connection.query(
    "SELECT `phone`,`money`, `code`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  let userInfo = user[0];
  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [history] = await connection.query(
    "SELECT * FROM balance_transfer WHERE sender_phone = ?",
    [userInfo.phone],
  );
  const [receive] = await connection.query(
    "SELECT * FROM balance_transfer WHERE receiver_phone = ?",
    [userInfo.phone],
  );
  if (receive.length > 0 || history.length > 0) {
    return res.status(200).json({
      message: "Success",
      receive: receive,
      datas: history,
      status: true,
      timeStamp: timeNow,
    });
  }
};
const recharge2 = async (req, res) => {
  let auth = req.cookies.auth;
  let money = req.body.money;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  let userInfo = user[0];
  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [recharge] = await connection.query(
    "SELECT * FROM recharge WHERE phone = ? AND status = ? ",
    [userInfo.phone, 0],
  );
  const [bank_recharge] = await connection.query("SELECT * FROM bank_recharge");
  if (recharge.length != 0) {
    return res.status(200).json({
      message: "Received successfully",
      datas: recharge[0],
      infoBank: bank_recharge,
      status: true,
      timeStamp: timeNow,
    });
  } else {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
};

const listRecharge = async (req, res) => {
  let auth = req.cookies.auth;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  let userInfo = user[0];
  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [recharge] = await connection.query(
    "SELECT * FROM recharge WHERE phone = ? ORDER BY id DESC ",
    [userInfo.phone],
  );
  return res.status(200).json({
    message: "Receive success",
    datas: recharge,
    status: true,
    timeStamp: timeNow,
  });
};

const search = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.body.phone;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite`, `level` FROM users WHERE `token` = ? ",
    [auth],
  );
  if (user.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let userInfo = user[0];
  if (userInfo.level == 1) {
    const [users] = await connection.query(
      `SELECT * FROM users WHERE phone = ? ORDER BY id DESC `,
      [phone],
    );
    return res.status(200).json({
      message: "Receive success",
      datas: users,
      status: true,
      timeStamp: timeNow,
    });
  } else if (userInfo.level == 2) {
    const [users] = await connection.query(
      `SELECT * FROM users WHERE phone = ? ORDER BY id DESC `,
      [phone],
    );
    if (users.length == 0) {
      return res.status(200).json({
        message: "Receive success",
        datas: [],
        status: true,
        timeStamp: timeNow,
      });
    } else {
      if (users[0].ctv == userInfo.phone) {
        return res.status(200).json({
          message: "Receive success",
          datas: users,
          status: true,
          timeStamp: timeNow,
        });
      } else {
        return res.status(200).json({
          message: "Failed",
          status: false,
          timeStamp: timeNow,
        });
      }
    }
  } else {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
};

const listWithdraw = async (req, res) => {
  let auth = req.cookies.auth;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  let userInfo = user[0];
  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [recharge] = await connection.query(
    "SELECT * FROM withdraw WHERE phone = ? ORDER BY id DESC ",
    [userInfo.phone],
  );
  return res.status(200).json({
    message: "Receive success",
    datas: recharge,
    status: true,
    timeStamp: timeNow,
  });
};

// const listTransaction = async (req, res) => {
//    let auth = req.cookies.auth;
//    if (!auth) {
//       return res.status(200).json({
//          message: "Failed",
//          status: false,
//          timeStamp: new Date().toISOString(),
//       });
//    }

//    const [user] = await connection.query("SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?", [auth]);
//    let userInfo = user[0];
//    if (!userInfo) {
//       return res.status(200).json({
//          message: "Failed",
//          status: false,
//          timeStamp: new Date().toISOString(),
//       });
//    }

//    const page = parseInt(req.query.page) || 1;
//    const limit = parseInt(req.query.limit) || 10;
//    const startDate = req.query.startDate;
//    const filterType = req.query.filterType || "All";
//    console.log(filterType, startDate);
//    const offset = (page - 1) * limit;

//    const transactionsQuery = `
//        SELECT id, amount AS money, 'positive' AS type, CONCAT(type, ' salary') AS name, time
//        FROM salary WHERE phone = ?
//        UNION ALL
//        SELECT id_redenvelops AS id, money, 'positive' AS type, 'Red Envelopes' AS name, time
//        FROM redenvelopes_used WHERE phone_used = ?
//        UNION ALL
//        SELECT time AS id, amount AS money, 'positive' AS type, type AS name, time
//        FROM claimed_rewards WHERE phone = ?
//        UNION ALL
//        SELECT commission_id AS id, money, 'positive' AS type, 'Commission' AS name, time
//        FROM commissions WHERE phone = ?
//        UNION ALL
//        SELECT id_order AS id, money, 'positive' AS type, 'Recharge' AS name, time
//        FROM recharge
//        WHERE phone = ? AND status = 1
//        UNION ALL
//        SELECT id_product AS id, money, 'negative' AS type, 'Bet Charges' AS name, time
//        FROM minutes_1
//        WHERE phone = ?
//        UNION ALL
//        SELECT id_product AS id,`get` AS money, 'positive' AS type, 'Bet Win' AS name, time
//        FROM minutes_1
//        WHERE phone = ? AND status = 1
//        UNION ALL
//        SELECT id_order AS id, money, 'negative' AS type, 'Withdraw' AS name, time
//        FROM withdraw
//        WHERE phone = ? AND status = 1
//        ORDER BY time DESC
//        LIMIT ? OFFSET ?`;

//    const [transactions] = await connection.query(transactionsQuery, [userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone, limit, offset]);

//    const countQuery = `
//        SELECT
//          (SELECT COUNT(*) FROM salary WHERE phone = ?) AS totalSalaryCount,
//          (SELECT COUNT(*) FROM redenvelopes_used WHERE phone = ?) AS totalRedEnvelopesCount,
//          (SELECT COUNT(*) FROM claimed_rewards WHERE phone = ?) AS totalRewardsCount,
//          (SELECT COUNT(*) FROM commissions WHERE phone = ?) AS totalCommissionCount,
//          (SELECT COUNT(*) FROM recharge WHERE phone = ? AND status = 1) AS totalRechargeCount,
//          (SELECT COUNT(*) FROM minutes_1 WHERE phone = ? AND money > 0) AS betChargesCount,
//          (SELECT COUNT(*) FROM minutes_1 WHERE phone = ? AND get > 0) AS betWinCount,
//          (SELECT COUNT(*) FROM withdraw WHERE phone = ? AND status = 1) AS withdrawCount`;

//    const [counts] = await connection.query(countQuery, [userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone, userInfo.phone]);
//    const totalCount = counts[0].totalSalaryCount + counts[0].totalRedEnvelopesCount + counts[0].totalRewardsCount + counts[0].totalCommissionCount + counts[0].totalRechargeCount + counts[0].betChargesCount + counts[0].betWinCount + counts[0].withdrawCount;
//    const totalPages = Math.ceil(totalCount / limit);

//    return res.status(200).json({
//       message: "Success",
//       status: true,
//       data: transactions,
//       totalPages: totalPages,
//       currentPage: page,
//       timeStamp: new Date().toISOString(),
//    });
// };

const constructTransactionsQuery = (
  filterType = "All",
  startDate,
  endDate,
  phone,
  limit,
  offset,
) => {
  const queries = {
    Bets: {
      query: `SELECT id_product AS id, (money + fee) AS money, 'negative' AS type, 'Bet' AS name, time FROM minutes_1 WHERE phone = ? AND time >= ? AND time <= ?`,
      count: `SELECT COUNT(*) AS totalCount FROM minutes_1 WHERE phone = ? AND time >= ? AND time <= ?`,
    },
    "trxBets": {
      query: `SELECT id_product AS id, (money + fee) AS money, 'negative' AS type, 'Bet' AS name, time FROM trx_wingo_bets WHERE phone = ? AND time >= ? AND time <= ?`,
      count: `SELECT COUNT(*) AS totalCount FROM trx_wingo_bets WHERE phone = ? AND time >= ? AND time <= ?`,
    },
    "Bet Win": {
      query: `SELECT id_product AS id, \`get\` AS money, 'positive' AS type, 'Win' AS name, time FROM minutes_1 WHERE phone = ? AND \`get\` > 0 AND time >= ? AND time <=?`,
      count: `SELECT COUNT(*) AS totalCount FROM minutes_1 WHERE phone = ? AND \`get\` > 0 AND time >= ? AND time <=?`,
    },
    "trxBet Win": {
      query: `SELECT id_product AS id, \`get\` AS money, 'positive' AS type, 'Win' AS name, time FROM trx_wingo_bets WHERE phone = ? AND \`get\` > 0 AND time >= ? AND time <=?`,
      count: `SELECT COUNT(*) AS totalCount FROM trx_wingo_bets WHERE phone = ? AND \`get\` > 0 AND time >= ? AND time <=?`,
    },
    
    Recharge: {
      query: `SELECT id_order AS id, money, 'positive' AS type, 'Recharge' AS name, time FROM recharge WHERE phone = ? AND status = 1 AND time >= ? AND time <=?`,
      count: `SELECT COUNT(*) AS totalCount FROM recharge WHERE phone = ? AND status = 1 AND time >= ? AND time <=?`,
    },
    Withdraw: {
      query: `SELECT id_order AS id, money, 'negative' AS type, 'Withdraw' AS name, time FROM withdraw WHERE phone = ? AND status = 1 AND time >= ? AND time <=?`,
      count: `SELECT COUNT(*) AS totalCount FROM withdraw WHERE phone = ? AND status = 1 AND time >= ? AND time <=?`,
    },
    Commissions: {
      query: `SELECT commission_id AS id, SUM(money) AS money, 'positive' AS type, 'Commission' AS name, time FROM commissions WHERE phone = ? AND time >= ? AND time <=? GROUP BY time,commission_id`,
      count: `SELECT COUNT(*) AS totalCount FROM (SELECT time FROM commissions WHERE phone = ? AND time >= ? AND time <=? GROUP BY time) AS grouped`,
    },
    "Gift Vouchers": {
      query: `SELECT id_redenvelops AS id, money, 'positive' AS type, 'Red Envelopes' AS name, time FROM redenvelopes_used WHERE phone_used = ? AND time >= ? AND time <=?`,
      count: `SELECT COUNT(*) AS totalCount FROM redenvelopes_used WHERE phone_used = ? AND time >= ? AND time <=?`,
    },
    Salary: {
      query: `SELECT id, amount AS money, 'positive' AS type, CONCAT(type, ' Salary') AS name, time FROM salary WHERE phone = ? AND time >= ? AND time <=?`,
      count: `SELECT COUNT(*) AS totalCount FROM salary WHERE phone = ? AND time >= ? AND time <=?`,
    },
    "Claimed Rewards": {
      query: `SELECT time AS id, amount AS money, 'positive' AS type, type AS name, time FROM claimed_rewards WHERE phone = ? AND time >= ? AND time <=?`,
      count: `SELECT COUNT(*) AS totalCount FROM claimed_rewards WHERE phone = ? AND time >= ? AND time <=?`,
    },
  };

  if (filterType === "All") {
    // Construct combined queries and total count queries
    const selectedQueries = Object.values(queries)
      .map((query) => `(${query.query})`)
      .join(" UNION ALL ");

    const totalCountQueries = Object.values(queries)
      .map((query) => `(${query.count})`)
      .join(" + ");

    const transactionsQuery = `
       SELECT * FROM (${selectedQueries}) AS combined
       ORDER BY time DESC
       LIMIT ${limit} OFFSET ${offset}
     `;

    const totalCountQuery = `
       SELECT ${totalCountQueries} AS totalCount
     `;

    const params = Object.values(queries).flatMap((query) => [
      phone,
      startDate,
      endDate,
    ]);

    return {
      transactionsQuery,
      totalCountQuery,
      params,
    };
  } if (filterType === 'Bets' || filterType === 'Bet Win') {
    const selectedQuery = `${queries[filterType]?.query || ''} UNION ALL ${queries[`trx${filterType}`]?.query || ''}`;
    const totalCountQueries = `(${queries[filterType]?.count || '0'}) + (${queries[`trx${filterType}`]?.count || '0'})`;

    const totalCountQuery = `
       SELECT ${totalCountQueries} AS totalCount
     `;
    const transactionsQuery = `${selectedQuery}
       ORDER BY time DESC
       LIMIT ${limit} OFFSET ${offset}
     `;
    const params = [phone, startDate, endDate, phone, startDate, endDate];
    return {
      transactionsQuery,
      totalCountQuery,
      params,
    };

  } else {
    // Handle specific filterType
    const selectedQuery = queries[filterType]?.query;
    const totalCountQuery = queries[filterType]?.count;

    if (selectedQuery && totalCountQuery) {
      const transactionsQuery = `
         ${selectedQuery}
         ORDER BY time DESC
         LIMIT ${limit} OFFSET ${offset}
       `;

      const params = [phone, startDate, endDate];

      return {
        transactionsQuery,
        totalCountQuery,
        params,
      };
    } else {
      throw new Error(`Invalid filterType "${filterType}" provided.`);
    }
  }
};

const listTransaction = async (req, res) => {
  let auth = req.cookies.auth;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: new Date().toISOString(),
    });
  }

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?",
    [auth],
  );
  let userInfo = user[0];
  if (!userInfo) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: new Date().toISOString(),
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startDate = Number(req?.query?.startDate) || '';
  const endDate = startDate ? getDayTime(startDate).endOfDayTimestamp : new Date().getTime();

  const filterType = req.query.filterType || "All";
  const offset = (page - 1) * limit;

  const { transactionsQuery, totalCountQuery, params } =
    constructTransactionsQuery(
      filterType,
      startDate,
      endDate,
      userInfo.phone,
      limit,
      offset,
    );

  const [transactions] = await connection.query(transactionsQuery, params);
  const [totalCount] = await connection.query(totalCountQuery, params);
  const totalPages = Math.ceil(totalCount[0].totalCount / limit);
  res.json({
    message: "Success",
    status: true,
    data: transactions,
    totalPages: totalPages,
    currentPage: page,
    timeStamp: new Date().toISOString(),
  });
};

const useRedenvelope = async (req, res) => {
  try {
    let auth = req.cookies.auth;
    let code = req.body.code;
    if (!auth) {
      return res.status(200).json({
        message: "Authentication failed",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (!code) {
      return res.status(200).json({
        message: "Please provide a redemption code",
        status: false,
        timeStamp: timeNow,
      });
    }

    const [user] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ",
      [auth],
    );
    if (user.length === 0) {
      return res.status(200).json({
        message: "Authentication failed, Login again",
        status: false,
        timeStamp: timeNow,
      });
    }
    let userInfo = user?.[0];

    const [redenvelopes] = await connection.query(
      "SELECT * FROM redenvelopes WHERE id_redenvelope = ?",
      [code],
    );
    if (redenvelopes.length === 0) {
      return res.status(200).json({
        message: "Invalid Redemption code",
        status: false,
        timeStamp: timeNow,
      });
    }
    const redenvelope = redenvelopes?.[0];

    if (
      Number(redenvelope.expire_date) !== 0 &&
      Number(redenvelope.expire_date) < new Date().getTime()
    ) {
      return res.status(200).json({
        message: "Gift code expired",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (
      redenvelope.for_new_users &&
      Number(user.time) < Number(redenvelope.time)
    ) {
      return res.status(200).json({
        message: "This gift code is only valid for new users!",
        status: false,
        timeStamp: timeNow,
      });
    }

    const [redenvelopesUsed] = await connection.query(
      "SELECT * FROM redenvelopes_used WHERE id_redenvelops = ? AND phone_used = ?",
      [code, userInfo?.phone],
    );

    if (redenvelopesUsed.length > 0) {
      return res.status(200).json({
        message: "Gift code already used",
        status: false,
        timeStamp: timeNow,
      });
    }

    if (redenvelope.status == 1) {
      return res.status(200).json({
        message: "Gift code fully used",
        status: false,
        timeStamp: timeNow,
      });
    }

    const time = new Date().getTime();

    let sql =
      "INSERT INTO redenvelopes_used SET phone = ?, phone_used = ?, id_redenvelops = ?, money = ?, `time` = ? ";
    await connection.query(sql, [
      redenvelope.phone,
      userInfo.phone,
      redenvelope.id_redenvelope,
      redenvelope.money,
      time,
    ]);
    await connection.query(
      "UPDATE users SET money = money + ? WHERE `phone` = ? ",
      [redenvelope.money, userInfo.phone],
    );

    const [redenvelopesUsedByAll] = await connection.query(
      "SELECT * FROM redenvelopes_used WHERE id_redenvelops = ? ",
      [code],
    );

    if (redenvelopesUsedByAll.length >= redenvelope.used) {
      await connection.query(
        "UPDATE redenvelopes SET status = ? WHERE `id_redenvelope` = ? ",
        [1, redenvelope.id_redenvelope],
      );
    }

    return res.status(200).json({
      message: `Received successfully + ₹${redenvelope.money}`,
      status: true,
      timeStamp: timeNow,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      status: false,
      timeStamp: timeNow,
    });
  }
};

const callback_bank = async (req, res) => {
  let transaction_id = req.body.transaction_id;
  let client_transaction_id = req.body.client_transaction_id;
  let amount = req.body.amount;
  let requested_datetime = req.body.requested_datetime;
  let expired_datetime = req.body.expired_datetime;
  let payment_datetime = req.body.payment_datetime;
  let status = req.body.status;
  if (!transaction_id) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  if (status == 2) {
    await connection.query(
      `UPDATE recharge SET status = 1 WHERE id_order = ?`,
      [client_transaction_id],
    );
    const [info] = await connection.query(
      `SELECT * FROM recharge WHERE id_order = ?`,
      [client_transaction_id],
    );
    await connection.query(
      "UPDATE users SET money = money + ?, total_money = total_money + ? WHERE phone = ? ",
      [info[0].money, info[0].money, info[0].phone],
    );
    return res.status(200).json({
      message: 0,
      status: true,
    });
  } else {
    await connection.query(`UPDATE recharge SET status = 2 WHERE id = ?`, [id]);

    return res.status(200).json({
      message: "Cancellation successful",
      status: true,
      datas: recharge,
    });
  }
};

const confirmRecharge = async (req, res) => {
  let auth = req.cookies.auth;
  //let money = req.body.money;
  //let paymentUrl = req.body.payment_url;
  let client_txn_id = req.body?.client_txn_id;

  if (!client_txn_id) {
    return res.status(200).json({
      message: "client_txn_id is required",
      status: false,
      timeStamp: timeNow,
    });
  }

  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  let userInfo = user[0];

  if (!user) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [recharge] = await connection.query(
    "SELECT * FROM recharge WHERE phone = ? AND status = ? ",
    [userInfo.phone, 0],
  );

  if (recharge.length != 0) {
    const rechargeData = recharge[0];
    const date = new Date(rechargeData.today);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const formattedDate = `${dd}-${mm}-${yyyy}`;
    const apiData = {
      key: "60a9ca13-6929-4e40-b687-ff7293e61dce",
      client_txn_id: client_txn_id,
      txn_date: formattedDate,
    };
    try {
      const apiResponse = await axios.post(
        "https://api.ekqr.in/api/check_order_status",
        apiData,
      );
      // console.log(apiResponse.data)
      const apiRecord = apiResponse.data.data;
      if (apiRecord.status === "scanning") {
        return res.status(200).json({
          message: "Waiting for confirmation",
          status: false,
          timeStamp: timeNow,
        });
      }
      if (
        apiRecord.client_txn_id === rechargeData.id_order &&
        apiRecord.customer_mobile === rechargeData.phone &&
        apiRecord.amount === rechargeData.money
      ) {
        if (apiRecord.status === "success") {
          await connection.query(
            `UPDATE recharge SET status = 1 WHERE id = ? AND id_order = ? AND phone = ? AND money = ?`,
            [
              rechargeData.id,
              apiRecord.client_txn_id,
              apiRecord.customer_mobile,
              apiRecord.amount,
            ],
          );
          // const [code] = await connection.query(`SELECT invite, total_money from users WHERE phone = ?`, [apiRecord.customer_mobile]);
          // const [data] = await connection.query('SELECT recharge_bonus_2, recharge_bonus FROM admin_ac WHERE id = 1');
          // let selfBonus = info[0].money * (data[0].recharge_bonus_2 / 100);
          // let money = info[0].money + selfBonus;
          let money = apiRecord.amount;
          await connection.query(
            "UPDATE users SET money = money + ?, total_money = total_money + ? WHERE phone = ? ",
            [money, money, apiRecord.customer_mobile],
          );
          // let rechargeBonus;
          // if (code[0].total_money <= 0) {
          //     rechargeBonus = apiRecord.customer_mobile * (data[0].recharge_bonus / 100);
          // }
          // else {
          //     rechargeBonus = apiRecord.customer_mobile * (data[0].recharge_bonus_2 / 100);
          // }
          // const percent = rechargeBonus;
          // await connection.query('UPDATE users SET money = money + ?, total_money = total_money + ? WHERE code = ?', [money, money, code[0].invite]);

          return res.status(200).json({
            message: "Successful application confirmation",
            status: true,
            datas: recharge,
          });
        } else if (
          apiRecord.status === "failure" ||
          apiRecord.status === "close"
        ) {
          // console.log(apiRecord.status)
          await connection.query(
            `UPDATE recharge SET status = 2 WHERE id = ? AND id_order = ? AND phone = ? AND money = ?`,
            [
              rechargeData.id,
              apiRecord.client_txn_id,
              apiRecord.customer_mobile,
              apiRecord.amount,
            ],
          );
          return res.status(200).json({
            message: "Payment failure",
            status: true,
            timeStamp: timeNow,
          });
        }
      } else {
        return res.status(200).json({
          message: "Mismtach data",
          status: true,
          timeStamp: timeNow,
        });
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
};

const confirmUSDTRecharge = async (req, res) => {
  // console.log(res?.body)
  // console.log(res?.query)
  // console.log(res?.cookies)
  // let auth = req.cookies.auth;
  // //let money = req.body.money;
  // //let paymentUrl = req.body.payment_url;
  // let client_txn_id = req.body?.client_txn_id;
  // if (!client_txn_id) {
  //     return res.status(200).json({
  //         message: 'client_txn_id is required',
  //         status: false,
  //         timeStamp: timeNow,
  //     })
  // }
  // if (!auth) {
  //     return res.status(200).json({
  //         message: 'Failed',
  //         status: false,
  //         timeStamp: timeNow,
  //     })
  // }
  // const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
  // let userInfo = user[0];
  // if (!user) {
  //     return res.status(200).json({
  //         message: 'Failed',
  //         status: false,
  //         timeStamp: timeNow,
  //     });
  // };
  // const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ? ', [userInfo.phone, 0]);
  // if (recharge.length != 0) {
  //     const rechargeData = recharge[0];
  //     const date = new Date(rechargeData.today);
  //     const dd = String(date.getDate()).padStart(2, '0');
  //     const mm = String(date.getMonth() + 1).padStart(2, '0');
  //     const yyyy = date.getFullYear();
  //     const formattedDate = `${dd}-${mm}-${yyyy}`;
  //     const apiData = {
  //         key: process.env.PAYMENT_KEY,
  //         client_txn_id: client_txn_id,
  //         txn_date: formattedDate,
  //     };
  //     try {
  //         const apiResponse = await axios.post('https://api.ekqr.in/api/check_order_status', apiData);
  //         const apiRecord = apiResponse.data.data;
  //         if (apiRecord.status === "scanning") {
  //             return res.status(200).json({
  //                 message: 'Waiting for confirmation',
  //                 status: false,
  //                 timeStamp: timeNow,
  //             });
  //         }
  //         if (apiRecord.client_txn_id === rechargeData.id_order && apiRecord.customer_mobile === rechargeData.phone && apiRecord.amount === rechargeData.money) {
  //             if (apiRecord.status === 'success') {
  //                 await connection.query(`UPDATE recharge SET status = 1 WHERE id = ? AND id_order = ? AND phone = ? AND money = ?`, [rechargeData.id, apiRecord.client_txn_id, apiRecord.customer_mobile, apiRecord.amount]);
  //                 // const [code] = await connection.query(`SELECT invite, total_money from users WHERE phone = ?`, [apiRecord.customer_mobile]);
  //                 // const [data] = await connection.query('SELECT recharge_bonus_2, recharge_bonus FROM admin_ac WHERE id = 1');
  //                 // let selfBonus = info[0].money * (data[0].recharge_bonus_2 / 100);
  //                 // let money = info[0].money + selfBonus;
  //                 let money = apiRecord.amount;
  //                 await connection.query('UPDATE users SET money = money + ?, total_money = total_money + ? WHERE phone = ? ', [money, money, apiRecord.customer_mobile]);
  //                 // let rechargeBonus;
  //                 // if (code[0].total_money <= 0) {
  //                 //     rechargeBonus = apiRecord.customer_mobile * (data[0].recharge_bonus / 100);
  //                 // }
  //                 // else {
  //                 //     rechargeBonus = apiRecord.customer_mobile * (data[0].recharge_bonus_2 / 100);
  //                 // }
  //                 // const percent = rechargeBonus;
  //                 // await connection.query('UPDATE users SET money = money + ?, total_money = total_money + ? WHERE code = ?', [money, money, code[0].invite]);
  //                 return res.status(200).json({
  //                     message: 'Successful application confirmation',
  //                     status: true,
  //                     datas: recharge,
  //                 });
  //             } else if (apiRecord.status === 'failure' || apiRecord.status === 'close') {
  //                 console.log(apiRecord.status)
  //                 await connection.query(`UPDATE recharge SET status = 2 WHERE id = ? AND id_order = ? AND phone = ? AND money = ?`, [rechargeData.id, apiRecord.client_txn_id, apiRecord.customer_mobile, apiRecord.amount]);
  //                 return res.status(200).json({
  //                     message: 'Payment failure',
  //                     status: true,
  //                     timeStamp: timeNow,
  //                 });
  //             }
  //         } else {
  //             return res.status(200).json({
  //                 message: 'Mismtach data',
  //                 status: true,
  //                 timeStamp: timeNow,
  //             });
  //         }
  //     } catch (error) {
  //         console.error(error);
  //     }
  // } else {
  //     return res.status(200).json({
  //         message: 'Failed',
  //         status: false,
  //         timeStamp: timeNow,
  //     });
  // }
};

const updateRecharge = async (req, res) => {
  let auth = req.cookies.auth;
  let money = req.body.money;
  let order_id = req.body.id_order;
  let data = req.body.inputData;

  // if (type != 'upi') {
  //     if (!auth || !money || money < 300) {
  //         return res.status(200).json({
  //             message: 'upi failed',
  //             status: false,
  //             timeStamp: timeNow,
  //         })
  //     }
  // }
  const [user] = await connection.query(
    "SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ",
    [auth],
  );
  let userInfo = user[0];
  if (!user) {
    return res.status(200).json({
      message: "user not found",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [utr] = await connection.query(
    "SELECT * FROM recharge WHERE `utr` = ? ",
    [data],
  );
  let utrInfo = utr[0];

  if (!utrInfo) {
    await connection.query(
      "UPDATE recharge SET utr = ? WHERE phone = ? AND id_order = ?",
      [data, userInfo.phone, order_id],
    );
    return res.status(200).json({
      message: "UTR updated",
      status: true,
      timeStamp: timeNow,
    });
  } else {
    return res.status(200).json({
      message: "UTR is already in use",
      status: false,
      timeStamp: timeNow,
    });
  }
};

const userController = {
  userInfo,
  changeUser,
  promotion,
  myTeam,
  wowpay,
  recharge,
  recharge2,
  listRecharge,
  listWithdraw,
  listTransaction,
  changePassword,
  checkInHandling,
  infoUserBank,
  addBank,
  withdrawal3,
  transfer,
  transferHistory,
  callback_bank,
  listMyTeam,
  verifyCode,
  aviator,
  useRedenvelope,
  search,
  updateRecharge,
  confirmRecharge,
  cancelRecharge,
  confirmUSDTRecharge,
};

export default userController;
