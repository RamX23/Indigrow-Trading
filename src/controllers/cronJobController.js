import connection from "../config/connectDB.js";
import winGoController from "./winGoController.js";
import k5Controller from "./k5Controller.js";
import k3Controller from "./k3Controller.js";
import trxWingoController, {
  TRX_WINGO_GAME_TYPE_MAP,
} from "./trxWingoController.js";
import cron from "node-cron";
import vipController from "./vipController.js";
import gameController from "./gameController.js";

const cronJobGame1p = (io) => {
  cron.schedule("*/1 * * * *", async () => {
    // await trxWingoController.addTrxWingo(1);
    // await trxWingoController.handlingTrxWingo1P(1);
    // const [trxWingo] = await connection.execute(
    //   `SELECT * FROM trx_wingo_game WHERE game = '${TRX_WINGO_GAME_TYPE_MAP.MIN_1}' ORDER BY id DESC LIMIT 2`,
    //   [],
    // );
    // io.emit("data-server-trx-wingo", { data: trxWingo });
    
    // await winGoController.addWinGo(1);
    console.log("🔔 Running at 60th second of every minute");
    const Point = await winGoController.addWinGo(1);
    io.emit("setEndPoint", Point.endPoint);
    console.log("Sent endpoint:", Point.endPoint);

    console.log("🔔 Running at 60th second of every minute");
    await winGoController.handlingWinGo1P(1,Point.bigTotal,Point.smallTotal);
    const [winGo1] = await connection.execute(
      'SELECT * FROM `wingo` WHERE `game` = "wingo" ORDER BY `id` DESC LIMIT 2 ',
      [],
    );
    const data = winGo1;
    io.emit("data-server", { data: data });
    console.log("execution completed!");
    // await k5Controller.add5D(1);
    // await k5Controller.handling5D(1);
    // const [k5D] = await connection.execute(
    //   "SELECT * FROM 5d WHERE `game` = 1 ORDER BY `id` DESC LIMIT 2 ",
    //   [],
    // );
    // const data2 = k5D;
    // io.emit("data-server-5d", { data: data2, game: "1" });

    // await k3Controller.addK3(1);
    // await k3Controller.handlingK3(1);
    // const [k3] = await connection.execute(
    //   "SELECT * FROM k3 WHERE `game` = 1 ORDER BY `id` DESC LIMIT 2 ",
    //   [],
    // );
    // const data3 = k3;
    // io.emit("data-server-k3", { data: data3, game: "1" });
  });



// cron.schedule("55 * * * * *", async () => {
//   console.log("🔔 Running at 55th second of every minute");
//   const Point=await winGoController.addWinGo(1);
//   console.log(Point);
//   io.emit("setEndPoint",Point.endPoint);
// });

// cron.schedule("55 * * * * *", async () => {
//   console.log("🔔 Running at 55th second of every minute");

//   // Check if addWinGo has been processed already
//   const [processed] = await connection.query("SELECT isProcessed FROM wingo WHERE game = 'wingo' ORDER BY id DESC LIMIT 1");
//   if (processed[0].isProcessed) {
//     console.log("Job already processed. Skipping.");
//     return;
//   }

//   // Run the addWinGo function
//   const Point = await winGoController.addWinGo(1);
//   io.emit("setEndPoint", Point.endPoint);
//   console.log("Sent endpoint:", Point.endPoint);

//   // Mark the job as processed
//   await connection.query("UPDATE wingo SET isProcessed = true WHERE game = 'wingo' ORDER BY id DESC LIMIT 1");
// });

cron.schedule("1 * * * * *", async () => {
  console.log("🔔 Running at 1st second of every minute");

  // Check if addWinGo was processed before running handlingWinGo1P
  // const [processed] = await connection.query("SELECT isProcessed FROM wingo WHERE game = 'wingo' ORDER BY id DESC LIMIT 1");
  // if (!processed[0].isProcessed) {
  //   console.log("Job not processed yet. Skipping.");
  //   return;
  // }

  // Run the handlingWinGo1P functiony
  // await winGoController.handlingWinGo1P(1);
  io.emit("getStartPoint");
  console.log("placed start point in local storage.");
  
  // Reset the isProcessed flag after handlingWinGo1P is complete
  // await connection.query("UPDATE wingo SET isProcessed = false WHERE game = 'wingo' ORDER BY id DESC LIMIT 1");
});

  cron.schedule("*/3 * * * *", async () => {
    // await trxWingoController.addTrxWingo(3);  
    // await trxWingoController.handlingTrxWingo1P(3);
    // const [trxWingo] = await connection.execute(
    //   `SELECT * FROM trx_wingo_game WHERE game = '${TRX_WINGO_GAME_TYPE_MAP.MIN_3}' ORDER BY id DESC LIMIT 2`,
    //   [],
    // );
    // io.emit("data-server-trx-wingo", { data: trxWingo });
    console.log("🔔 Running at 3rd second of every minute");

    setTimeout(() => {
      console.log('Task runs at 3 min 1 sec interval');
      io.emit("get3minStartPoint");
      console.log("placed start point in local storage.");
    }, 1000)

    const Point=await winGoController.addWinGo(3);
    io.emit("set3minEndPoint", Point.endPoint);
    console.log("Sent 3min endpoint:", Point.endPoint);

    console.log("🔔 Running at 60th second of every minute");
    await winGoController.handlingWinGo1P(3,Point.bigTotal,Point.smallTotal);
    const [winGo1] = await connection.execute(
      'SELECT * FROM `wingo` WHERE `game` = "wingo3" ORDER BY `id` DESC LIMIT 2 ',
      [],
    );
    const data = winGo1;
    io.emit("data-server", { data: data });



    // await k5Controller.add5D(3);
    // await k5Controller.handling5D(3);
    // const [k5D] = await connection.execute(
    //   "SELECT * FROM 5d WHERE `game` = 3 ORDER BY `id` DESC LIMIT 2 ",
    //   [],
    // );
    // const data2 = k5D;
    // io.emit("data-server-5d", { data: data2, game: "3" });

    // await k3Controller.addK3(3);
    // await k3Controller.handlingK3(3);
    // const [k3] = await connection.execute(
    //   "SELECT * FROM k3 WHERE `game` = 3 ORDER BY `id` DESC LIMIT 2 ",
    //   [],
    // );
    // const data3 = k3;
    // io.emit("data-server-k3", { data: data3, game: "3" });
  });

  cron.schedule("*/5 * * * *", async () => {
    // await trxWingoController.addTrxWingo(5);
    // await trxWingoController.handlingTrxWingo1P(5);
    // const [trxWingo] = await connection.execute(
    //   `SELECT * FROM trx_wingo_game WHERE game = '${TRX_WINGO_GAME_TYPE_MAP.MIN_5}' ORDER BY id DESC LIMIT 2`,
    //   [],
    // );
    // io.emit("data-server-trx-wingo", { data: trxWingo });


    console.log("🔔 Running at 5th second of every minute");

    setTimeout(() => {
      console.log('Task runs at 5 min 1 sec interval');
      io.emit("get5minStartPoint");
      console.log("placed start point in local storage.");
    }, 1000)


    const Point=await winGoController.addWinGo(5);
    io.emit("set5minEndPoint", Point.endPoint);
    console.log("Sent 5min endpoint:", Point.endPoint);
    await winGoController.handlingWinGo1P(5,Point.bigTotal,Point.smallTotal);
    const [winGo1] = await connection.execute(
      'SELECT * FROM `wingo` WHERE `game` = "wingo5" ORDER BY `id` DESC LIMIT 2 ',
      [],
    );
    const data = winGo1;
    io.emit("data-server", { data: data });

    await k5Controller.add5D(5);
    await k5Controller.handling5D(5);
    const [k5D] = await connection.execute(
      "SELECT * FROM 5d WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2 ",
      [],
    );
    const data2 = k5D;
    io.emit("data-server-5d", { data: data2, game: "5" });

    await k3Controller.addK3(5);
    await k3Controller.handlingK3(5);
    const [k3] = await connection.execute(
      "SELECT * FROM k3 WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2 ",
      [],
    );
    const data3 = k3;
    io.emit("data-server-k3", { data: data3, game: "5" });
  });

  cron.schedule("*/10 * * * *", async () => {
    // await trxWingoController.addTrxWingo(10);
    // await trxWingoController.handlingTrxWingo1P(10);
    // const [trxWingo] = await connection.execute(
    //   `SELECT * FROM trx_wingo_game WHERE game = '${TRX_WINGO_GAME_TYPE_MAP.MIN_10}' ORDER BY id DESC LIMIT 2`,
    //   [],
    // );
    // io.emit("data-server-trx-wingo", { data: trxWingo });


    console.log("🔔 Running at 10th second of every minute");

    setTimeout(() => {
      console.log('Task runs at 10 min 1 sec interval');
      io.emit("get10minStartPoint");
      console.log("placed start point in local storage.");
    }, 1000)

    const Point=await winGoController.addWinGo(10);
    io.emit("set10minEndPoint", Point.endPoint);
    console.log("Sent 10min endpoint:", Point.endPoint);
    await winGoController.handlingWinGo1P(10,Point.bigTotal,Point.smallTotal);
    const [winGo1] = await connection.execute(
      'SELECT * FROM `wingo` WHERE `game` = "wingo10" ORDER BY `id` DESC LIMIT 2 ',
      [],
    );
    const data = winGo1;
    io.emit("data-server", { data: data });

    await k5Controller.add5D(10);
    await k5Controller.handling5D(10);
    const [k5D] = await connection.execute(
      "SELECT * FROM 5d WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2 ",
      [],
    );
    const data2 = k5D;
    io.emit("data-server-5d", { data: data2, game: "10" });

    await k3Controller.addK3(10);
    await k3Controller.handlingK3(10);
    const [k3] = await connection.execute(
      "SELECT * FROM k3 WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2 ",
      [],
    );
    const data3 = k3;
    io.emit("data-server-k3", { data: data3, game: "10" });
  });

  cron.schedule("0 1 * * *", async () => {
    await connection.execute("UPDATE users SET roses_today = ?", [0]);
    await connection.execute("UPDATE point_list SET money = ?", [0]);
    await connection.execute("UPDATE turn_over SET daily_turn_over = ?", [0]);
  });

  cron.schedule("0 3 * * *", async () => {
    gameController.autoCleanOldGames();
  });

  cron.schedule("0 2 1 * *", async () => {
    vipController.releaseVIPLevel();
  });

  cron.schedule(
    "0 0 * * *",
    async () => await winGoController.distributeCommission(),
  );
  // cron.schedule('* * * * *', async () => await winGoController.distributeCommission());
};

const cronJobController = {
  cronJobGame1p,
};

export default cronJobController;
