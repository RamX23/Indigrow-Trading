import connection from "../config/connectDB.js";
import winGoController from "./winGoController.js";
import k5Controller from "./k5Controller.js";
import k3Controller from "./k3Controller.js";
import cron from "node-cron";
import vipController from "./vipController.js";
import gameController from "./gameController.js";

const coins = ["BTC", "ADA", "BNB", "ETH"];

let Point=null;
let Point3=null;
let Point5=null;
let Point10=null;
const cronJobGame1p = (io, ENDPOINT_DATA) => {
  // cron.schedule("59 * * * *",async()=>{
  //   console.log("🔔 Running at 59th second of every minute");
  //   Point = await winGoController.addWinGo(1);
  //   ENDPOINT_DATA["1min"] = {
  //     endPrices: Point.endPrices,
  //     startPrices: Point.startPrices,
  //     timestamp: Date.now(),
  //   };
  // })
  cron.schedule("50 * * * * *",async()=>{
    console.log("running at 51st sec of minute");
    Point = await winGoController.addWinGo(1);

    // Store data in ENDPOINT_DATA instead of emitting
    ENDPOINT_DATA["1min"] = {
      endPrices: Point.endPrices,
      startPrices: Point.startPrices,
      timestamp: Date.now(),
    };
    console.log("Stored endpoint data for 1min interval:", ENDPOINT_DATA["1min"]);
  })



  cron.schedule("0 * * * * *", async () => {
    console.log("🔔 Running at 60th second of every minute");


    for (const coin of coins) {
      const startPoint = Point.startPrices[coin];
      const endPoint = Point.endPrices[coin];
      const bigtotal = Point.bigTotal;
      const smalltotal = Point.smallTotal;
      const result = Point.result;
      let typeid;
      switch (coin) {
        case "BTC":
          typeid = 1;
          break;
        case "ADA":
          typeid = 1;
          break;
        case "BNB":
          typeid = 1;
          break;
        case "ETH":
          typeid = 1;
          break;
        default:
          console.error(`Invalid coin type: ${coin}`);
          return;
      }

      await winGoController.handlingWinGo1P(typeid, bigtotal, smalltotal, result);
    }

    const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo" ORDER BY `id` DESC LIMIT 2', []);
    io.emit("data-server", { data: winGo1 });
    console.log("1min execution completed!");
  });



  // For 3-minute interval (runs at 2:59, 5:59, 8:59, etc.)

  cron.schedule("50 2,5,8,11,14,17,20,23,26,29,32,35,38,41,44,47,50,53,56,59 * * * *", async () => {
    console.log("Running at 50th second of every 3rd minute (e.g., 02:50, 05:50, 08:50)");
    
    Point3 = await winGoController.addWinGo(3);

    // Store data in ENDPOINT_DATA
    ENDPOINT_DATA["3min"] = {
        endPrices: Point3.endPrices,
        startPrices: Point3.startPrices,
        timestamp: Date.now(),
    };
    
    console.log("Stored endpoint data for 3min interval:", ENDPOINT_DATA["3min"]);
});



cron.schedule("0 */3 * * * *", async () => {
  console.log("🔔 Running at 2min 59sec of every 3min interval");
    // const Point = await winGoController.addWinGo(3);

    // ENDPOINT_DATA["3min"] = {
    //   endPrices: Point.endPrices,
    //   startPrices: Point.startPrices,
    //   timestamp: Date.now(),
    // };
    // console.log("Stored endpoint data for 3min interval:", ENDPOINT_DATA["3min"]);

    for (const coin of coins) {
      const startPoint = Point3.startPrices[coin];
      const endPoint = Point3.endPrices[coin];
      const bigtotal = Point3.bigTotal;
      const smalltotal = Point3.smallTotal;
      const result = Point3.result;
      let typeid;
      switch (coin) {
        case "BTC":
          typeid = 3;
          break;
        case "ADA":
          typeid = 3;
          break;
        case "BNB":
          typeid = 3;
          break;
        case "ETH":
          typeid = 3;
          break;
        default:
          console.error(`Invalid coin type: ${coin}`);
          return;
      }

      await winGoController.handlingWinGo1P(typeid, bigtotal, smalltotal, result);
    }

    const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo3" ORDER BY `id` DESC LIMIT 2', []);
    io.emit("data-server", { data: winGo1 });
    console.log("3min execution completed!");
  });


  
  cron.schedule("50 4,9,14,19,24,29,34,39,44,49,54,59 * * * *",async()=>{
    console.log("running at 51st sec of 5 minute");
    Point5 = await winGoController.addWinGo(5);

    // Store data in ENDPOINT_DATA instead of emitting
    ENDPOINT_DATA["5min"] = {
      endPrices: Point5.endPrices,
      startPrices: Point5.startPrices,
      timestamp: Date.now(),
    };
    console.log("Stored endpoint data for 5min interval:", ENDPOINT_DATA["5min"]);
  })
  
  cron.schedule("0 */5 * * * *", async () => {
    // console.log("🔔 Running at 4min 59sec of every 5min interval");
    // const Point = await winGoController.addWinGo(5);

    // ENDPOINT_DATA["5min"] = {
    //   endPrices: Point.endPrices,
    //   startPrices: Point.startPrices,
    //   timestamp: Date.now(),
    // };
    // console.log("Stored endpoint data for 5min interval:", ENDPOINT_DATA["5min"]);

    for (const coin of coins) {
      const startPoint = Point5.startPrices[coin];
      const endPoint = Point5.endPrices[coin];
      const bigtotal = Point5.bigTotal;
      const smalltotal = Point5.smallTotal;
      const result = Point5.result;
      let typeid;
      switch (coin) {
        case "BTC":
          typeid = 5;
          break;
        case "ADA":
          typeid = 5;
          break;
        case "BNB":
          typeid = 5;
          break;
        case "ETH":
          typeid = 5;
          break;
        default:
          console.error(`Invalid coin type: ${coin}`);
          return;
      }

      await winGoController.handlingWinGo1P(typeid, bigtotal, smalltotal, result);
    }

    const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo5" ORDER BY `id` DESC LIMIT 2', []);
    io.emit("data-server", { data: winGo1 });

    await k5Controller.add5D(5);
    await k5Controller.handling5D(5);
    const [k5D] = await connection.execute("SELECT * FROM 5d WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2", []);
    io.emit("data-server-5d", { data: k5D, game: "5" });

    await k3Controller.addK3(5);
    await k3Controller.handlingK3(5);
    const [k3] = await connection.execute("SELECT * FROM k3 WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2", []);
    io.emit("data-server-k3", { data: k3, game: "5" });

    console.log("5min execution completed!");
  });

  
  cron.schedule("50 9,19,29,39,49,59 * * * *",async()=>{
    console.log("running at 51st sec of 10 minute");
    Point10 = await winGoController.addWinGo(10);

    // Store data in ENDPOINT_DATA instead of emitting
    ENDPOINT_DATA["10min"] = {
      endPrices: Point10.endPrices,
      startPrices: Point10.startPrices,
      timestamp: Date.now(),
    };
    console.log("Stored endpoint data for 10min interval:", ENDPOINT_DATA["10min"]);
  })

 // For 10-minute interval (runs at 9:59, 19:59, 29:59, etc.)
cron.schedule("0 */10 * * * *", async () => {
  console.log("🔔 Running at 10min 1sec of every 10min interval");
    // const Point = await winGoController.addWinGo(10);

    // ENDPOINT_DATA["10min"] = {
    //   endPrices: Point.endPrices,
    //   startPrices: Point.startPrices,
    //   timestamp: Date.now(),
    // };
    // console.log("Stored endpoint data for 10min interval:", ENDPOINT_DATA["10min"]);

    for (const coin of coins) {
      const startPoint = Point10.startPrices[coin];
      const endPoint = Point10.endPrices[coin];
      const bigtotal = Point10.bigTotal;
      const smalltotal = Point10.smallTotal;
      const result = Point10.result;
      let typeid;
      switch (coin) {
        case "BTC":
          typeid = 10;
          break;
        case "ADA":
          typeid = 10;
          break;
        case "BNB":
          typeid = 10;
          break;
        case "ETH":
          typeid = 10;
          break;
        default:
          console.error(`Invalid coin type: ${coin}`);
          return;
      }

      await winGoController.handlingWinGo1P(typeid, bigtotal, smalltotal, result);
    }

    const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo10" ORDER BY `id` DESC LIMIT 2', []);
    io.emit("data-server", { data: winGo1 });

    await k5Controller.add5D(10);
    await k5Controller.handling5D(10);
    const [k5D] = await connection.execute("SELECT * FROM 5d WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2", []);
    io.emit("data-server-5d", { data: k5D, game: "10" });

    await k3Controller.addK3(10);
    await k3Controller.handlingK3(10);
    const [k3] = await connection.execute("SELECT * FROM k3 WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2", []);
    io.emit("data-server-k3", { data: k3, game: "10" });

    console.log("10min execution completed!");
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

  cron.schedule("0 0 * * *", async () => await winGoController.distributeCommission());
};

const cronJobController = {
  cronJobGame1p,
};

export default cronJobController;