const getGameType = () => {
  const urlParams = new URLSearchParams(window.location.search);

  $("#game_type_status").text(`${urlParams.get("game_type") || 1} MIN`);

  return urlParams.get("game_type") || "1";
};

let GAME_TYPE_ID = getGameType();
let GAME_NAME = GAME_TYPE_ID === "1" ? "wingo" : `wingo${GAME_TYPE_ID}`;

let My_Bets_Pages = 1;
let Game_History_Pages = 1;

let countDownInterval1 = null;
let countDownInterval2 = null;
let countDownInterval3 = null;

var audio1 = new Audio("/audio/di1.da40b233.mp3");
var audio2 = new Audio("/audio/di2.317de251.mp3");

var clicked = false;

function openAudio() {
  audio1.muted = true;
  audio1.play();
  audio2.muted = true;
  audio2.play();
}

// $("body").off("click.audio");
// $("body").on("click.audio", function (e) {
//   e.preventDefault();
//   if (clicked) return;
//   openAudio();
//   clicked = true;
// });

// function playAudio1() {
//   audio1.muted = false;
//   audio1.play();
// }

// function playAudio2() {
//   audio2.muted = false;
//   audio2.play();
// }

const initAudio = () => {
  const check_volume = localStorage.getItem("volume");
  if (check_volume == "on") {
      $("#audio_button").removeClass("disableVoice");
  } else if (check_volume == "off") {
      $("#audio_button").addClass("disableVoice");
  } else {
      localStorage.setItem("volume", "on");
      $("#audio_button").removeClass("disableVoice");
  }
};

initAudio();

$("#audio_button").click(function(e) {
  e.preventDefault();
  const check_volume = localStorage.getItem("volume");
  if (check_volume == "on") {
      localStorage.setItem("volume", "off");
  } else {
      localStorage.setItem("volume", "on");
  }
  initAudio();
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const socket=io();


// Initialize TimeManager with default values
const TimeManager = {
currentGameType: getGameType(),
gameTimers: {},
currentTime: {  // Add default values
  minute1: 0,
  minute2: 0,
  second1: 0,
  second2: 0,
  raw: new Date() // Current time as fallback
},

setGameType: function(type) {
    this.currentGameType = getGameType();
},

getCurrentGameTimer: function() {
    return this.gameTimers[this.currentGameType] || {
        minute1: 0,
        minute2: 0,
        second1: 0,
        second2: 0,
        active: true
    };
}
};

let countdownStarted = false;

socket.on('timeUpdate', (data) => {
// Update TimeManager
TimeManager.currentTime = {
  minute1: data.minute1 || 0,
  minute2: data.minute2 || 0,
  second1: data.second1 || 0,
  second2: data.second2 || 0,
  raw: new Date(data.timestamp || Date.now())
};

TimeManager.gameTimers = data.sessions;
let gameType=getGameType();
  // Start countdown on first update if not already started
  if (!countdownStarted) {
    countdownStarted = true;
    countDownTimer(gameType);
  }


// Log each second change
if (!TimeManager.lastUpdate || 
    TimeManager.lastUpdate.second2 !== data.second2) {
  // console.log(
  //   `[TimeUpdate] New time received: ${data.minute1}${data.minute2}:${data.second1}${data.second2}`
  // );
}

// Get current timer
const timer = TimeManager.getCurrentGameTimer();

// Update UI
document.querySelectorAll('.bet-btn').forEach(btn => {
  btn.disabled = !timer.active;
});
});



function countDownTimer({ GAME_TYPE_ID }) {
const getTimeMSS = (countDownDate) => {
  return {
    minute: TimeManager.currentTime.minute2,
    seconds1: TimeManager.currentTime.second1,
    seconds2: TimeManager.currentTime.second2
  };
};

var countDownDate = new Date("2030-07-16T23:59:59.9999999+03:00").getTime();

countDownInterval1 = setInterval(function() {
  // console.log("Current time is",TimeManager.currentTime);
    const { minute, seconds1, seconds2 } = getTimeMSS(countDownDate);

    // Update timer display
    if (GAME_TYPE_ID !== "1") {
        $(".TimeLeft__C-time div:eq(1)").text(minute);
    } else {
        $(".TimeLeft__C-time div:eq(1)").text("0");
    }
    $(".TimeLeft__C-time div:eq(3)").text(seconds1);
    $(".TimeLeft__C-time div:eq(4)").text(seconds2);
    //  console.log(seconds1,":",seconds2)
    // updateGameTypeText();
    // Disable betting buttons when 10 seconds or less remain
    if ((minute == 0 && seconds1 == 1 && seconds2 == 0) || (minute==0 && seconds1 ==0 && seconds2 <=9)) {
        // alert("Button disabled");
        $(".Betting__C-foot-b, .Betting__C-foot-s, #join_bet_btn").css({
            "pointer-events": "none",
            cursor: "not-allowed",
            opacity: "0.6",
        });
    } else {
        // Re-enable buttons when more than 5 seconds remain
        // alert("button enabled")
        $(".Betting__C-foot-b, .Betting__C-foot-s, #join_bet_btn").css({
            "pointer-events": "auto",
            cursor: "pointer",
            opacity: "1",
        });
    }
}, 1000);



countDownInterval3 = setInterval(function() {
    const { minute, seconds1, seconds2 } = getTimeMSS(countDownDate);
    // updateGameTypeText();
    if (minute == 0 && seconds1 == 0 && seconds2 <= 5) {
        $(".van-overlay").fadeOut();
        $(".popup-join").fadeOut();

        $(".Betting__C-mark").css("display", "none");
        // $(".Betting__C-mark div:eq(0)").text(seconds1);
        // $(".Betting__C-mark div:eq(1)").text(seconds2);
    } else {
        $(".Betting__C-mark").css("display", "none");
    }
}, 0);
}




$(document).ready(function() {
  countDownTimer({ GAME_TYPE_ID });
});

async function fetchAndDisplayPeriod() {
  try {
      const gameType = getGameType(); // Get current game type (1, 3, 5, or 10)
      const response = await fetch(`/api/webapi/getPeriod/${gameType}`);

      if (!response.ok) {
          throw new Error('Failed to fetch period');
      }

      const data = await response.json(); // ✅ Await the parsed JSON data
      // console.log("Fetched period:", data);

      const period = data.period; // ✅ Access period from the JSON object
      updatePeriodDisplay(period);
  } catch (error) {
      console.error('Error fetching period:', error);
      updatePeriodDisplay("000000"); // Show default on error
  }
}


function updatePeriodDisplay(period) {
  // Update the period display in multiple places if needed
  $(".period").text(period);
  $("#current_period").text(period); // Add this element if needed

  // Also store it in localStorage for socket updates
  localStorage.setItem("currentPeriod", period);
}

// Update game type text in the buttons
// Update game type text in the buttons
function updateGameTypeText() {
  const gameTypeText = `${GAME_TYPE_ID} MIN`;

  // Update the status display
  $("#game_type_status").text(gameTypeText);

  // Update the big/small button labels
  $('.gameTypeBig').text(`(if the rate rises after ${GAME_TYPE_ID} min)`);
  $('.gameTypeSmall').text(`(if the rate falls after ${GAME_TYPE_ID} min)`);

  // Update any other elements that show game type
  $('.current-game-type').text(gameTypeText);
}

// Call this function when initializing the game and when game type changes
updateGameTypeText();

const selectActiveClockByGameType = (GAME_TYPE_ID) => {
  // Clear all existing intervals
  clearInterval(countDownInterval1);
  clearInterval(countDownInterval2);
  clearInterval(countDownInterval3);

  // Remove all bet button event listeners
  $('.Betting__C-foot-b, .Betting__C-foot-s').off('click');

  // Update game type
  GAME_TYPE_ID = `${GAME_TYPE_ID}`;
  GAME_NAME = GAME_TYPE_ID === "1" ? "wingo" : `wingo${GAME_TYPE_ID}`;

  // Update URL
  window.history.pushState({}, "", `/wingo/?game_type=${GAME_TYPE_ID}`);

  selectActiveClock(GAME_TYPE_ID);
  // Update the game type text immediately
  updateGameTypeText();

  fetchAndDisplayPeriod();
  // Reinitialize game logic
  initGameLogics({
      GAME_TYPE_ID,
      GAME_NAME,
      Game_History_Pages,
  });

  // Start new timer

  countDownTimer({ GAME_TYPE_ID });
  // Force update of all UI elements
  $(".gameTypeBig").text(`(if the rate rises after ${GAME_TYPE_ID} min)`);
  $(".gameTypeSmall").text(`(if the rate falls after ${GAME_TYPE_ID} min)`);
  $(".current-game-type").text(`${GAME_TYPE_ID} MIN`);

  // Update the game type status display
  $("#game_type_status").text(`${GAME_TYPE_ID} MIN`);
};

initGameLogics({ GAME_TYPE_ID, GAME_NAME, My_Bets_Pages, Game_History_Pages });

fetch("/api/webapi/GetUserInfo")
  .then((response) => response.json())
  .then((data) => {
      $(".Loading").fadeOut(0);
      if (data.status === false) {
          unsetCookie();
          return false;
      }

      const balance = data.data.money_user;
      const bonus = data.data.bonus_money;

      // Update text
      $("#balance_amount").text(`₹ ${formatIndianNumber(balance)} `);
      $("#bonus_balance_amount").text(`₹ ${formatIndianNumber(bonus)} `);
      $("#balance_amount").css("color", "white");

  });


$(".reload_money").click(function(e) {
  e.preventDefault();
  $(this).addClass("action block-click");
  setTimeout(() => {
      $(this).removeClass("action block-click");
  }, 3000);
  fetch("/api/webapi/GetUserInfo")
      .then((response) => response.json())
      .then((data) => {
          if (data.status === false) {
              unsetCookie();
              return false;
          }
          $("#balance_amount").text(
              `₹ ${formatIndianNumber(data.data.money_user)} `,
          );
          $("#bonus_balance_amount").text(
              `₹ ${formatIndianNumber(data.data.bonus_money)} `,
          );
      });
});

function drawChartLineInCanvas(topBoxNumber, bottomBoxNumber, canvasId) {
  const myCanvas = document.getElementById(canvasId);
  let boxXList = [10, 40, 70, 100, 128, 157, 186, 215, 244, 273];
  const ctx0 = myCanvas.getContext("2d");
  ctx0.strokeStyle = "#2b3270";
  ctx0.beginPath();
  ctx0.moveTo(boxXList[topBoxNumber], 21);
  ctx0.lineTo(boxXList[bottomBoxNumber], 128);
  ctx0.stroke();
}

function selectActiveClock(currentTime) {
  document.querySelector(".min_t_1").classList.remove("active");
  document.querySelector(".min_t_3").classList.remove("active");
  document.querySelector(".min_t_5").classList.remove("active");
  document.querySelector(".min_t_10").classList.remove("active");

  switch (parseInt(currentTime)) {
      case 1:
          document.querySelector(".min_t_1").classList.add("active");
          break;
      case 3:
          document.querySelector(".min_t_3").classList.add("active");
          break;
      case 5:
          document.querySelector(".min_t_5").classList.add("active");
          break;
      case 10:
          document.querySelector(".min_t_10").classList.add("active");
          break;
      default:
          throw new Error("Invalid time");
  }
}

let autoCloseTimer = null;
let countdownInterval = null;

function showPopupModal() {
$("#popup_modal").css("display", "flex");

// Reset and show circular timer
const circle = document.querySelector(".timer-circle .progress");
if (circle) {
    circle.style.transition = "none";
    circle.style.strokeDashoffset = "0";

    // Trigger animation
    setTimeout(() => {
        circle.style.transition = "stroke-dashoffset 3s linear";
        circle.style.strokeDashoffset = "113.1"; // full circle dash offset
    }, 50);
}

// Clear previous timers
clearInterval(countdownInterval);
clearTimeout(autoCloseTimer);

// autoCloseTimer = setTimeout(() => {
//     hidePopupModal();
// }, 10000);
}


function hidePopupModal() {
$("#popup_modal").fadeOut(300);
clearInterval(countdownInterval);
clearTimeout(autoCloseTimer);

// Reset circular timer
const circle = document.querySelector(".timer-circle .progress");
if (circle) {
    circle.style.transition = "none";
    circle.style.strokeDashoffset = "0";
}
}


// Close modal on close button click
$(document).on('click', '.closeBtn', function () {
  hidePopupModal();
});

function displayResultHandler({ status, amount, period, result }) {
  if (typeof status === 'undefined' || typeof period === 'undefined') {
      console.error("Missing required parameters in displayResultHandler");
      return;
  }

  let bsDisplay = "", resultDisplay = "";

  if (result === "d") {
      bsDisplay = "Draw";
      resultDisplay = "Draw";
  } else if (result === 'l') {
      bsDisplay = "Up";
      resultDisplay = "Up";
  } else if (result === 'n') {
      bsDisplay = "Down";
      resultDisplay = "Down";
  }

  $("#lottery_results_box")
      .removeClass((index, className) =>
          (className.match(/(^|\s)type\w+/g) || []).join(" ")
      )
      .addClass(`type${resultDisplay}`);

  $("#popup_bs_display").text(bsDisplay);
  $("#popup_game_details").text(`Trade: ${GAME_TYPE_ID} minute trade ${period}`);

  const normalizedStatus = String(status).toLowerCase();
  $("#popup_background").removeClass("win-bg loss-bg draw-bg");
  $("#result_symbol").removeClass("bounce spin pulse");

  if (normalizedStatus.includes('win')) {
      $("#popup_win_rupees_display").text(`₹${parseFloat(amount).toFixed(2)}`);
      $("#popup_greeting_display").text("Congratulations");
      $("#result_symbol").html("🏆").addClass("bounce");
      $("#popup_background").addClass("win-bg");
      $("#popup_win_rupees_display, #popup_win_symbol").show();
      $("#popup_loss_symbol").hide();
  } else if (normalizedStatus.includes('loss')) {
      $("#popup_greeting_display").text("Sorry");
      $("#result_symbol").html("👎").addClass("pulse");
      $("#popup_background").addClass("loss-bg");
      $("#popup_win_rupees_display").text(`- ₹${parseFloat(amount).toFixed(2)}`);
      $("#popup_win_symbol").hide();
      $("#popup_loss_symbol").show();
  } else if (normalizedStatus.includes('draw')) {
      $("#popup_greeting_display").text("Draw");
      $("#result_symbol").html("⚖️").addClass("spin");
      $("#popup_background").addClass("draw-bg");
      $("#popup_win_rupees_display").text(`₹${parseFloat(amount).toFixed(2)}`);
      $("#popup_win_rupees_display").show();
      $("#popup_win_symbol").hide();
      $("#popup_loss_symbol").hide();
  }

  showPopupModal();
}

$(document).ready(function() {
  $(".closeBtn").click(function() {
      $("#popup_modal").hide();
      // clearTimeout(3000);
      // clearInterval(countdownInterval);
  });
});



function showGameHistoryData(gameHistory) {

  const containerId = "#game_history_data_container";
  // console.log(gameHistory);

  displayLast5Result({
      results: gameHistory.slice(0, 5).map((game) => game.amount),
  });

  if (gameHistory.length == 0) {
      return $(containerId).html(`
    <div data-v-a9660e98="" class="van-empty">
        <div class="van-empty__image">
            <img src="/images/empty-image-default.png" />
        </div>
        <p class="van-empty__description">No data</p>
    </div>
 `);
  }

  let html = gameHistory
      .map((list_order) => {
          let colorHtml = "";
          let colorClass = "";
          // if (list_order.amount == 0) {
          //   colorClass = "mixedColor0";
          //   colorHtml = `
          //       <div data-v-c52f94a7="" class="GameRecord__C-origin-I red"></div>
          //       <div data-v-c52f94a7="" class="GameRecord__C-origin-I violet"></div>
          //       `;
          // } else if (list_order.amount == 5) {
          //   colorClass = "mixedColor5";
          //   colorHtml = `
          //       <div data-v-c52f94a7="" class="GameRecord__C-origin-I green"></div>
          //       <div data-v-c52f94a7="" class="GameRecord__C-origin-I violet"></div>
          //       `;
          // } else if (list_order.amount % 2 == 0) {
          //   colorClass = "defaultColor";
          //   colorHtml = `
          //       <div data-v-c52f94a7="" class="GameRecord__C-origin-I red"></div>
          //       `;
          // } else {
          //   colorClass = "greenColor";
          //   colorHtml = `
          //          <div data-v-c52f94a7="" class="GameRecord__C-origin-I green"></div>
          //       `;
          // }
          // console.log(list_order);


          return `
       <div data-v-c52f94a7="" class="van-row"  style="background-color: #0d063db9;">
          <div data-v-c52f94a7="" class="van-col van-col--12">${list_order.period}</div>
         
           <div data-v-c52f94a7="" class="van-col van-col--12"><span data-v-c52f94a7="">${list_order.result === 'l' ? "Up" : list_order.result === 'n' ? "Down" :"Draw"}</span></div>
      
       </div>`;
      })
      .join(" ");

  $(containerId).html(html);
}

function showTrendData(list_orders) {
const containerId = "#chart_container";

// ✅ Define this BEFORE any usage
const coinDisplayNames = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  BNB: "Binance Coin",
  ADA: "Cardano",
  DOGE: "Dogecoin"
};

if (list_orders.length == 0) {
  return $(containerId).html(`
    <div data-v-a9660e98="" class="van-empty">
      <div class="van-empty__image">
        <img src="/images/empty-image-default.png" />
      </div>
      <p class="van-empty__description">No data</p>
    </div>`);
}

const NumberList = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const html = list_orders
  .map((order, index) => {
    // const isBig = parseInt(order.amount) >= 5;
    const isLastOrder = index === list_orders.length - 1;

    // Validate and normalize order.amount
    let amount = order.amount;
    let isBig = false;
    let displayAmount = amount;

    // Map non-numeric amounts to appropriate values
    if (amount === 'n') {
      displayAmount = 'Down';
      isBig = false;
    } else if (amount === 'l') {
      displayAmount = 'Up';
      isBig = true;
    } else if (amount === 'd') {
      displayAmount = 'Draw';
      isBig = false;
    } else {
      // Assume numeric amount
      amount = parseInt(amount);
      isBig = amount >= 5;
    }

    return `
      <div data-v-54016b1c="" issuenumber="${order.period}" number="${order.amount}" colour="${isBig ? "red" : "green"}" rowid="${index}">
        <div data-v-54016b1c="" class="van-row">
          <div data-v-54016b1c="" class="van-col van-col--8">
            <div data-v-54016b1c="" class="Trend__C-body2-IssueNumber">${order.period}</div>
            <div style="font-size: 0.9em; color: #bbb;">
              ${coinDisplayNames[order.coinType] || order.coinType}
            </div>
          </div>
          <div data-v-54016b1c="" class="van-col van-col--16">
            <div data-v-54016b1c="" class="Trend__C-body2-Num">
              <canvas data-v-54016b1c="" canvas="" id="myCanvas${index}" class="line-canvas"></canvas>
              ${NumberList.map((number) => {
                return `<div data-v-54016b1c="" class="Trend__C-body2-Num-item ${order.amount == number ? `action${number}` : ""}">${number}</div>`;
              }).join(" ")}
              <div data-v-54016b1c="" class="Trend__C-body2-Num-BS ${isBig ? "isB" : ""}">${isBig ? "B" : "S"}</div>
            </div>
          </div>
          ${
            isLastOrder
              ? ""
              : `<script>drawChartLineInCanvas(${order.amount}, ${list_orders[index + 1].amount}, "myCanvas${index}")</script>`
          }
        </div>
      </div>`;
  })
  .join(" ");

$(containerId).empty().html(html);
}


let currentDisplay = "";
function openGameBetDetails(index) {
$(`.MyGameRecordList__C-detail`).css("display", "none");

if (currentDisplay === `details_box_${index}`) {
  $(`.details_box_${index}`).css("display", "none");
  currentDisplay = ``;
} else {
  $(`.details_box_${index}`).css("display", "block");
  currentDisplay = `details_box_${index}`;
}
}

function showMyBetsData(list_orders) {
const coinDisplayNames = {
  BTC: "Binanca coin",
  ETH: "Bitcoin SV",
  BNB: "Uniswap",
  ADA: "NEM(XEM)",
};
const containerId = "#my_bets_data_container";
// selectActiveClock(parseInt(GAME_TYPE_ID));
if (list_orders.length === 0) {
  return $(containerId).html(`
    <div data-v-a9660e98="" class="van-empty" style=""background: rgba(255, 255, 255, 0.1);">
      <div class="van-empty__image">
        <img src="/images/empty-image-default.png" />
      </div>
      <p class="van-empty__description">No Data</p>
    </div>
  `);
}


const html = list_orders
  .map((list_order, index) => {
    let join = list_order.bet;
    let selected = "";
    let color = "";
    
    // Handle bet types and their display
    if (join === "l") {
      color = "l-big";
      selected = "Up";
    } else if (join === "n") {
      color = "l-small";
      selected = "Down";
    } else if (join === "t") {
      color = "l-violet";
      selected = "Violet";
    } else if (join === "d") {
      color = "l-draw"; // New class for draw
      selected = "Draw";
    } else if (join === "x") {
      color = "l-green";
      selected = "Green";
    } else if (join === "0") {
      color = "l-0";
      selected = "0";
    } else if (join === "5") {
      color = "l-5";
      selected = "5";
    } else if (Number(join) % 2 === 0) {
      color = "l-red";
      selected = Number(join);
    } else if (Number(join) % 2 !== 0) {
      color = "l-green";
      selected = Number(join);
    }

    // Handle display of selected bet
    const checkJoin = !isNumber(join) || ["l", "n", "t", "d", "x"].includes(join)
      ? selected
      : `<span data-v-a9660e98="">${join}</span>`;

    return `
    <div style="margin: 20px auto; padding: 20px; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); background-color: rgba(57, 59, 71, 0.6); color:white; font-family: Arial, sans-serif; ">
  
    ${selected
      ? `
      <div style="margin-bottom: 10px; display: flex; justify-content: start; align-items: center; gap: 1em; ">
        <strong style="font-size: 1.2em;">Selected:</strong>
        <span style="
          font-size: 1.5em;
          padding: 0.5em 1.2em;
          background-color: ${
            selected === "Up"
              ? '#28a745'
              : selected === "Down"
              ? '#dc3545'
              : '#6c757d'
          };
          border: 2px solid ${
            selected === "Up"
              ? '#28a745'
              : selected === "Down"
              ? '#dc3545'
              : '#6c757d'
          };
          border-radius: 12px;
          color: white;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        ">
          ${selected}
        </span>
      </div>
      `
      : ""
    }
    
    
  
    <div style="margin-bottom: 10px; ">
      <strong>Order number:</strong>
      <span style="font-weight:700">${list_order.id_product}</span>
    </div>

    <div class="main-fields" style="display:flex; gap:2em; font-size:1.3em; font-weight:600;">
  
    <div style="margin-bottom: 10px;">
      <strong>Trade:</strong>
      <span style="color:rgba(217, 211, 24, 1)">${list_order.stage}</span>
    </div>

    <div style="margin-bottom: 10px;">
    <strong>Status:</strong>
    <span style="color: ${
      list_order.status === 1
        ? "#28a745" 
        : list_order.status === 3
        ? "#ffc107"
        : "#dc3545"
    };">
    ${
      list_order.status === 1
        ? "Success"
        : list_order.status === 0
        ? ""
        : list_order.status === 3
        ? "Draw"
        : list_order.status === 2
        ? "Failed"
        : ""
    }
    
    </span>
  </div>

  </div>
  
  <div style="margin-bottom: 10px;">
  <strong>Coin Type:</strong>
  <span>${
    coinDisplayNames[list_order.coinType] || list_order.coinType
  }</span>
</div>
    <div style="margin-bottom: 10px;">
      <strong>Purchase amount:</strong>
      <span>₹${parseFloat(list_order.fee + list_order.money).toFixed(2)}</span>
    </div>

    ${
      list_order.status === 0
        ? ""
        : `
 

    <div style="margin-bottom: 10px;">
      <strong>Win/Lose:</strong>
      <span style="color: ${
        list_order.status === 1
          ? "#28a745"
          : list_order.status === 3
          ? "#ffc107"
          : "#dc3545"
      };">
        ${
          list_order.status === 1
            ? `+ ₹${parseFloat(list_order.get).toFixed(2)}`
            : list_order.status === 3
            ? `₹${parseFloat(list_order.money).toFixed(2)}`
            : `- ₹${parseFloat(list_order.fee + list_order.money).toFixed(2)}`
        }
      </span>
    </div>
        `
    }
  

    <div style="margin-bottom: 10px;">
      <strong>Amount after Broker Charges:</strong>
      <span style="color: #d9534f;">₹${parseFloat(list_order.money).toFixed(2)}</span>
    </div>
  
    <div style="margin-bottom: 10px;">
      <strong>Broker Charges:</strong>
      <span>₹${parseFloat(list_order.fee).toFixed(2)}</span>
    </div>
  
  
  
    <div style="margin-bottom: 0;">
      <strong>Order time:</strong>
      <span>${timerJoin(list_order.time)}</span>
    </div>
  </div>
  
    `;
  })
  .join("");

$(containerId).html(html);
}

function initGameLogics({
GAME_TYPE_ID,
GAME_NAME,
My_Bets_Pages,
Game_History_Pages,
}) {
selectActiveClock(parseInt(GAME_TYPE_ID));

fetchAndDisplayPeriod();

//--------------------- Wingo game logic ---------------------

var pageno = 0;
var limit = 10;
var page = 1;

// --------------------- wingo game logic ---------------------

//   function totalMoney() {
//     let value = parseInt($("#van-field-1-input").val()?.trim() || 0);
//     let money = parseInt(
//       $(".Betting__Popup-body-money-main").attr("data-current-money") || 0
//     );
  
//     let total = value * money;
//     $("#popup_total_bet_money").text(total + ".00");
// }

//   const selectPopupXData = () => {};
//   $(".van-overlay").fadeOut();
//   $(".popup-join").fadeOut();

//   function alertBox(join, cssValueNumber, addText) {
//     $(".van-overlay").fadeIn();
//     $(".popup-join").fadeIn();
//     $(".popup-join > div").removeClass();
//     $(".popup-join > div").addClass(`Betting__Popup-${cssValueNumber}`);

//     let activeXData = $(".Betting__C-multiple-r.active").attr("data-x");
//     console.log(activeXData);
//     $("#van-field-1-input").val(activeXData);
//     $("div.Betting__Popup-body-x-btn").removeClass("bgcolor");
//     $(`div.Betting__Popup-body-x-btn[data-x="${activeXData}"]`).addClass(
//       "bgcolor",
//     );
//     $("#join_bet_btn").attr("data-join", join);
//     $("#betting_value").html(addText);
//     totalMoney();
//   }

//   $(".Betting__Popup-body-money-btn").off("click.money_btn");
//   $(".Betting__Popup-body-money-btn").on("click.money_btn", function (e) {
//     e.preventDefault();

//     const thisValue = $(this).attr("data-money");
//     $(".Betting__Popup-body-money-btn").removeClass("bgcolor");
//     $(this).addClass("bgcolor");
//     $(".Betting__Popup-body-money-main").attr("data-current-money", thisValue);

//     totalMoney();
//   });

//   $(".Betting__Popup-body-x-btn").off("click.x_btn");
//   $(`.Betting__Popup-body-x-btn`).on("click.x_btn", function (e) {
//     e.preventDefault();

//     const thisValue = $(this).attr("data-x");
//     $(".Betting__Popup-body-x-btn").removeClass("bgcolor");
//     $(this).addClass("bgcolor");

//     $("#van-field-1-input").val(thisValue);
//     totalMoney();
//   });

//   $(".Betting__Popup-minus-btn").off("click.minus_btn");
//   $(`.Betting__Popup-minus-btn`).on("click.minus_btn", function (e) {
//     e.preventDefault();
//     const currentX = parseInt($("#van-field-1-input").val());
//     const nextX = currentX === 1 ? 1 : currentX - 1;
//     $(".Betting__Popup-body-x-btn").removeClass("bgcolor");
//     $(`.Betting__Popup-body-x-btn[data-x="${nextX}"]`).addClass("bgcolor");

//     $("#van-field-1-input").val(nextX);
//     totalMoney();
//   });

//   $(".Betting__Popup-plus-btn").off("click.plus_btn");
//   $(`.Betting__Popup-plus-btn`).on("click.plus_btn", function (e) {
//     e.preventDefault();
//     const currentX = parseInt($("#van-field-1-input").val());
//     const nextX = currentX + 1;

//     $(".Betting__Popup-body-x-btn").removeClass("bgcolor");
//     $(`.Betting__Popup-body-x-btn[data-x="${nextX}"]`).addClass("bgcolor");

//     $("#van-field-1-input").val(nextX);
//     totalMoney();
//   });

//   $(`#van-field-1-input`).off("change.input");
//   $(`#van-field-1-input`).on("change.input", function (e) {
//     e.preventDefault();
//     const currentX = parseInt($("#van-field-1-input").val());

//     $(".Betting__Popup-body-x-btn").removeClass("bgcolor");
//     $(`.Betting__Popup-body-x-btn[data-x="${currentX}"]`).addClass("bgcolor");

//     totalMoney();
//   });



//   $("#join_bet_btn").off("click.join_btn");
//   $("#join_bet_btn").on("click.join_btn", function (event) {
//     event.preventDefault();
//     let join = $(this).attr("data-join");
//     const currentX = parseInt($("#van-field-1-input").val().trim());
//     let money = $(".Betting__Popup-body-money-main").attr("data-current-money");

//     if (!join || !currentX || !money) {
//       return;
//     }
//     // let currentStartPoint = null;
//     let currentStartPoint = JSON.parse(localStorage.getItem("startPoint"));
//     console.log(GAME_TYPE_ID);
//     if (GAME_TYPE_ID === '1') {
//       currentStartPoint = JSON.parse(localStorage.getItem("startPoint"));
//     } else if (GAME_TYPE_ID === '3') {
//       currentStartPoint = JSON.parse(localStorage.getItem("3minStartPoint"));
//     } else if (GAME_TYPE_ID === '5') {
//       currentStartPoint = JSON.parse(localStorage.getItem("5minStartPoint")); // ✅ fixed
//     } else if (GAME_TYPE_ID === '10') {
//       currentStartPoint = JSON.parse(localStorage.getItem("10minStartPoint")); // ✅ fixed
//     }
  
//     if (!currentStartPoint) {
//       alertMessage("Start point not available yet.");
//       return;
//     } else {
//       console.log("Start point:", currentStartPoint); 
//     }
//     console.log(GAME_TYPE_ID)
//     const startPrice = currentStartPoint.price;
//     const coinType = getCoinType();
  
//     console.log("Start Price:", startPrice);
//     console.log("Coin Type:", coinType);
//     $(this).addClass("block-click");
//     $.ajax({
//       type: "POST",
//       url: "/api/webapi/action/join",
//       data: {
//         typeid: GAME_TYPE_ID,
//         join: join,
//         x: currentX,
//         money: money,
//         startPrice,
//         coinType
//       },
//       dataType: "json",
//       success: function (response) {
//         alertMessage(response.message);
//         if (response.status === false) return;
//         $("#balance_amount").text(`₹ ${formatIndianNumber(response.money)} `);
//         $("#bonus_balance_amount").text(
//           `₹ ${formatIndianNumber(response.bonus_money)} `,
//         );

//         initMyBets();

//         socket.emit("data-server_2", {
//           money: currentX * money,
//           join,
//           time: Date.now(),
//           change: response.change,
//         });
//       },
//     });

//     setTimeout(() => {
//       $(".van-overlay").fadeOut();
//       $(".popup-join").fadeOut();
//       $("#join_bet_btn").removeClass("block-click");
//     }, 500);
//   });

//   $("#cancel_bet_btn").off("click.cancel_btn");
//   $("#cancel_bet_btn").on("click.cancel_btn", function (event) {
//     event.preventDefault();

//     $(".van-overlay").fadeOut();
//     $(".popup-join").fadeOut();
//     $("#join_bet_btn").removeClass("block-click");
//   });

//main button events

// $(".con-box .bet_button").off("click.con_box");
// $(".con-box .bet_button").on("click.con_box", function (e) {
//   e.preventDefault();
//   let addTop = $(this).attr("data-join");
//   let cssValueNumber = $(this).attr("data-css-value");
//   let addText = $(this).text();
//   alertBox(addTop, cssValueNumber, addText);
// });

// $(".number-box .bet_button").off("click.number_box");
// $(".number-box .bet_button").on("click.number_box", function (e) {
//   e.preventDefault();
//   let addTop = $(this).attr("data-join");
//   let cssValueNumber = $(this).attr("data-css-value");
//   let addText = $(this).attr("data-join");
//   alertBox(addTop, cssValueNumber, addText);
// });

// $(".btn-box .bet_button").off("click.btn_box");
// $(".btn-box .bet_button").on("click.btn_box", function (e) {
//   e.preventDefault();
//   let addTop = $(this).attr("data-join");
//   let cssValueNumber = $(this).attr("data-css-value");
//   let addText = $(this).text();
//   alertBox(addTop, cssValueNumber, addText);
// });

// $(".Betting__C-multiple-r").off("click.multiple_r");
// $(".Betting__C-multiple-r").on("click.multiple_r", function (e) {
//   e.preventDefault();
//   $(".Betting__C-multiple-r").css({
//     "background-color": "rgb(240, 240, 240)",
//     color: "rgb(0, 0, 0)",
//   });

//   $(this).css({
//     "background-color": "rgb(63 147 104)",
//     color: "rgb(255, 255, 255)",
//   });
//   $(".Betting__C-multiple-r").removeClass("active");
//   $(this).addClass("active");
// });

// $(".randomBtn").off("click.multiple_r");
// $(".randomBtn").on("click.multiple_r", async function (e) {
//   e.preventDefault();
//   let random = 0;
//   for (let i = 0; i < 55; i++) {
//     random = Math.floor(Math.random() * 10);
//     $(".number-box .bet_button").removeClass("active");
//     $(`.number-box .bet_button:eq(${random})`).addClass("active");
//     await sleep(50);
//   }

//   alertBox(random, random, random);
// });

// const alertMessage = (text) => {
//   const msg = document.createElement("div");
//   msg.setAttribute("data-v-1dcba851", "");
//   msg.className = "message_alert_root";

//   const msgContent = document.createElement("div");
//   msgContent.setAttribute("data-v-1dcba851", "");
//   msgContent.className = "message_alert_text";
//   msgContent.style = "";
//   msgContent.textContent = text;

//   msg.appendChild(msgContent);
//   document.body.appendChild(msg);

//   setTimeout(() => {
//     msgContent.classList.remove("v-enter-active", "v-enter-to");
//     msgContent.classList.add("v-leave-active", "v-leave-to");

//     setTimeout(() => {
//       document.body.removeChild(msg);
//     }, 100);
//   }, 1000);
// };


$(document).ready(function() {
  // Initialize variables
  let currentMultiplier = 1;
  let currentBetAmount = 1;
  
  // Amount input handlers
  $('.minus-btn').on('click', function() {
      let currentValue = parseInt($('#betAmountInput').val());
      if (currentValue > 1) {
          $('#betAmountInput').val(currentValue - 1);
      }
  });
  
  $('.plus-btn').on('click', function() {
      let currentValue = parseInt($('#betAmountInput').val());
      $('#betAmountInput').val(currentValue + 1);
  });
  
  $('#betAmountInput').on('change', function() {
      let value = parseInt($(this).val());
      if (isNaN(value) || value < 20) {
        alertMessage("Please enter amount greater then 20");
          $(this).val(20);
      }
  });
  
  // Quick amount buttons
  $('.quick-amount-btn').on('click', function() {
      let amount = $(this).data('amount');
      $('#betAmountInput').val(amount);
  });
  
  // Multiplier buttons
  $('.multiplier-btn').on('click', function() {
      $('.multiplier-btn').removeClass('active');
      $(this).addClass('active');
      currentMultiplier = parseInt($(this).data('multiplier'));
  });
  
  // Bet placement handlers
  $('.Betting__C-foot-b').on('click', function() {
      placeBet('l'); // 'l' for up
  });
  
  $('.Betting__C-foot-s').on('click', function() {
      placeBet('n'); // 'n' for down
  });
  
  // Function to place bet
  function placeBet(join) {
    const betAmount = parseInt($('#betAmountInput').val());
    // console.log(betAmount);
    const totalAmount = betAmount * currentMultiplier;

    if (!join || !betAmount || !currentMultiplier) {
        alertMessage("Please enter valid bet details");
        return;
    }

    // let currentStartPoint = JSON.parse(localStorage.getItem("startPoint"));
    // if (GAME_TYPE_ID === '1') {
    //     currentStartPoint = JSON.parse(localStorage.getItem("startPoint"));
    // } else if (GAME_TYPE_ID === '3') {
    //     currentStartPoint = JSON.parse(localStorage.getItem("3minStartPoint"));
    // } else if (GAME_TYPE_ID === '5') {
    //     currentStartPoint = JSON.parse(localStorage.getItem("5minStartPoint"));
    // } else if (GAME_TYPE_ID === '10') {
    //     currentStartPoint = JSON.parse(localStorage.getItem("10minStartPoint"));
    // }

    // if (!currentStartPoint) {
    //     alertMessage("Start point not available yet.");
    //     return;
    // }

    // Dynamically retrieve start point based on coinType and interval
    const coinType = getCoinType(); // e.g., 'BTC', 'ETH', 'BNB', 'ADA'
    const key = `startPoints_${GAME_TYPE_ID}min`;  // Dynamically created key (e.g., "startPoints_3min")

    // Retrieve the data from localStorage
    const data = localStorage.getItem(key);

    // Check if data exists in localStorage
    if (data) {
        // Parse the JSON string into a JavaScript object
        const parsedData = JSON.parse(data);

        // Access the price of the selected coin type dynamically
        const coinPrice = parsedData[coinType]?.price;  // Access the price of the specific coin (e.g., BTC, ETH)

        if (!coinPrice) {
            alertMessage(`${coinType} price not available.`);
            return;
        }

        // Log the coin price that will be used as the startPrice
        // console.log(`${coinType} Price for ${GAME_TYPE_ID} interval:`, coinPrice);

        // Send the correct start point and coin price to the server
        $.ajax({
            type: "POST",
            url: "/api/webapi/action/join",
            data: {
                typeid: GAME_TYPE_ID,
                join: join,
                x: currentMultiplier,
                money: betAmount,
                startPrice: coinPrice,  // Send the selected coin's price as the start price
                coinType
            },
            dataType: "json",
            success: function(response) {
                alertMessage(response.message);
                if (response.status === false) return;

                $("#balance_amount").text(`₹ ${formatIndianNumber(response.money)} `);
                $("#bonus_balance_amount").text(`₹ ${formatIndianNumber(response.bonus_money)} `);

                initMyBets();

                socket.emit("data-server_2", {
                    money: totalAmount,
                    join,
                    time: Date.now(),
                    change: response.change,
                });
            },
            complete: function() {
                $('.Betting__C-foot-b, .Betting__C-foot-s').removeClass('block-click');
            }
        });
    } else {
        alertMessage("Data not available for the specified interval.");
    }
}

  
  // Helper function to show alert messages
  function alertMessage(text) {
      const msg = document.createElement("div");
      msg.setAttribute("data-v-1dcba851", "");
      msg.className = "message_alert_root";

      const msgContent = document.createElement("div");
      msgContent.setAttribute("data-v-1dcba851", "");
      msgContent.className = "message_alert_text";
      msgContent.style = "";
      msgContent.textContent = text;

      msg.appendChild(msgContent);
      document.body.appendChild(msg);

      setTimeout(() => {
          msgContent.classList.remove("v-enter-active", "v-enter-to");
          msgContent.classList.add("v-leave-active", "v-leave-to");

          setTimeout(() => {
              document.body.removeChild(msg);
          }, 100);
      }, 1000);
  }
  
  // Format Indian number (keep your existing implementation)
  // function formatIndianNumber(num) {
  //     // Your existing implementation
  //     return num;
  // }
  
  // Get coin type (keep your existing implementation)
  // function getCoinType() {
  //     // Your existing implementation
  //     return $('#coinSelect').val();
  // }
  
  // Initialize my bets (keep your existing implementation)
  // function initMyBets() {
  //     // Your existing implementation
  // }
});
// ------------------------- wingo game logic --------------------end

// -------------------------- game pagination -----------------------

const initGameHistoryTab = (page = 1) => {
  let size = 10;
  let offset = page === 1 ? 0 : (page - 1) * size;
  let limit = page * size;

  $.ajax({
    type: "POST",
    url: "/api/webapi/GetNoaverageEmerdList",
    data: {
      typeid: GAME_TYPE_ID,
      pageno: offset,
      pageto: 10,
      language: "vi",
    },
    dataType: "json",
    success: function (response) {
      Game_History_Pages = response.page;
      let list_orders = response.data.gameslist;
      let gameHistory=response.data.gameHistory;
      
      // $("#period").text(response.period);

      $("#number_result__gameHistory").text(`${page}/${response.page}`);

      if (page == 1)
        $("#game_history__bottom_nav .previous_page").addClass("disabled");
      else
        $("#game_history__bottom_nav .previous_page").removeClass("disabled");

      if (page == response.data.page)
        $("#game_history__bottom_nav .next_page").addClass("disabled");
      else $("#game_history__bottom_nav .next_page").removeClass("disabled");

      $(".Loading").fadeOut(0);

      showGameHistoryData(gameHistory);
    },
  });
};
initGameHistoryTab();

const initChartTab = (page = 1) => {
  let size = 10;
  let offset = page === 1 ? 0 : (page - 1) * size;
  let limit = page * size;

  $.ajax({
    type: "POST",
    url: "/api/webapi/GetNoaverageEmerdList",
    data: {
      typeid: GAME_TYPE_ID,
      pageno: offset,
      pageto: 10,
      language: "vi",
    },
    dataType: "json",
    success: function (response) {
      Game_History_Pages = response.page;
      let list_orders = response.data.gameslist;

      // $("#period").text(response.period);

      $("#number_result__chart").text(`${page}/${response.page}`);

      if (page == 1)
        $("#chart__bottom_nav .previous_page").addClass("disabled");
      else $("#chart__bottom_nav .previous_page").removeClass("disabled");

      if (page == response.page)
        $("#chart__bottom_nav .next_page").addClass("disabled");
      else $("#chart__bottom_nav .next_page").removeClass("disabled");

      $(".Loading").fadeOut(0);

      showTrendData(list_orders);
    },
  });
};
initChartTab();

function initMyBets(page = 1) {
  let size = 10;
  let offset = page === 1 ? 0 : (page - 1) * size;
  let limit = page * size;
  $.ajax({
    type: "POST",
    url: "/api/webapi/GetMyEmerdList",
    data: {
      typeid: GAME_TYPE_ID,
      pageno: offset,
      pageto: 10,
      language: "vi",
    },
    dataType: "json",
    success: function (response) {
      My_Bets_Pages = response.page;
      let data = response.data.gameslist;

      $("#number_result__myBet").text(`${page}/${response.page}`);

      if (page == 1)
        $("#my_bets__bottom_nav .previous_page").addClass("disabled");
      else $("#my_bets__bottom_nav .previous_page").removeClass("disabled");

      if (page == response.page)
        $("#my_bets__bottom_nav .next_page").addClass("disabled");
      else $("#my_bets__bottom_nav .next_page").removeClass("disabled");

      $(".Loading").fadeOut(0);
      showMyBetsData(data);
    },
  });
}
initMyBets();

$("#my_bets__bottom_nav .previous_page").off("click.mb_previous_page");
$("#my_bets__bottom_nav .previous_page").on(
  "click.mb_previous_page",
  function (e) {
    e.preventDefault();
    $("#my_bets__bottom_nav .previous_page").addClass("block-click");

    $(".Loading").fadeIn(0);

    const currentPage = parseInt(
      $("#number_result__myBet").text().split("/")[0],
    );
    const previousPage = 1 <= currentPage - 1 ? currentPage - 1 : currentPage;
    initMyBets(previousPage);

    $(".Loading").fadeOut(0);

    $("#my_bets__bottom_nav .previous_page").removeClass("block-click");
  },
);

$("#my_bets__bottom_nav .next_page").off("click.mb_next_page");
$("#my_bets__bottom_nav .next_page").on("click.mb_next_page", function (e) {
  e.preventDefault();
  $("#my_bets__bottom_nav .previous_page").addClass("block-click");

  $(".Loading").fadeIn(0);

  const currentPage = parseInt(
    $("#number_result__myBet").text().split("/")[0],
  );
  const nextPage =
    My_Bets_Pages >= currentPage + 1 ? currentPage + 1 : currentPage;
  initMyBets(nextPage);

  $(".Loading").fadeOut(0);

  $("#my_bets__bottom_nav .previous_page").removeClass("block-click");
});

$("#game_history__bottom_nav .previous_page").off("click.gh_previous_page");
$("#game_history__bottom_nav .previous_page").on(
  "click.gh_previous_page",
  function (e) {
    e.preventDefault();
    $("#game_history__bottom_nav .previous_page").addClass("block-click");

    $(".Loading").fadeIn(0);

    const currentPage = parseInt(
      $("#number_result__gameHistory").text().split("/")[0],
    );
    const previousPage = 1 <= currentPage - 1 ? currentPage - 1 : currentPage;
    initGameHistoryTab(previousPage);

    $(".Loading").fadeOut(0);

    $("#game_history__bottom_nav .previous_page").removeClass("block-click");
  },
);

$("#game_history__bottom_nav .next_page").off("click.gh_next_page");
$("#game_history__bottom_nav .next_page").on(
  "click.gh_next_page",
  function (e) {
    e.preventDefault();
    $("#game_history__bottom_nav .next_page").addClass("block-click");

    $(".Loading").fadeIn(0);

    const currentPage = parseInt(
      $("#number_result__gameHistory").text().split("/")[0],
    );
    const nextPage =
      Game_History_Pages >= currentPage + 1 ? currentPage + 1 : currentPage;
    initGameHistoryTab(nextPage);

    $(".Loading").fadeOut(0);

    $("#game_history__bottom_nav .next_page").removeClass("block-click");
  },
);

$("#chart__bottom_nav .previous_page").off("click.ch_previous_page");
$("#chart__bottom_nav .previous_page").on(
  "click.ch_previous_page",
  function (e) {
    e.preventDefault();
    $("#chart__bottom_nav .previous_page").addClass("block-click");

    $(".Loading").fadeIn(0);

    const currentPage = parseInt(
      $("#number_result__chart").text().split("/")[0],
    );
    const previousPage = 1 <= currentPage - 1 ? currentPage - 1 : currentPage;
    initChartTab(previousPage);

    $(".Loading").fadeOut(0);

    $("#chart__bottom_nav .previous_page").removeClass("block-click");
  },
);

$("#chart__bottom_nav .next_page").off("click.ch_next_page");
$("#chart__bottom_nav .next_page").on("click.ch_next_page", function (e) {
  e.preventDefault();
  $("#chart__bottom_nav .next_page").addClass("block-click");

  $(".Loading").fadeIn(0);

  const currentPage = parseInt(
    $("#number_result__chart").text().split("/")[0],
  );
  const nextPage =
    Game_History_Pages >= currentPage + 1 ? currentPage + 1 : currentPage;
  initChartTab(nextPage);

  $(".Loading").fadeOut(0);

  $("#chart__bottom_nav .next_page").removeClass("block-click");
});

// -------------------------------- pagination -----------------------------end

$(".van-notice-bar__wrap .van-notice-bar__content").css({
  "transition-duration": "48.9715s",
  transform: "translateX(-2448.57px)",
});

setInterval(() => {
  $(".van-notice-bar__wrap .van-notice-bar__content").css({
    "transition-duration": "0s",
    transform: "translateX(0)",
  });
  setTimeout(() => {
    $(".van-notice-bar__wrap .van-notice-bar__content").css({
      "transition-duration": "48.9715s",
      transform: "translateX(-2448.57px)",
    });
  }, 100);
}, 48000);

$(".van-button--default").off("click.van_button");
$(".van-button--default").on("click.van_button", function (e) {
  e.preventDefault();
  $(".van-popup-vf, .van-overlay").fadeOut(100);
});

$(".circular").off("click.circular");
$(".circular").on("click.circular", function (e) {
  e.preventDefault();
  $(".van-popup-vf, .van-overlay").fadeIn(100);
});

// on window load

// ------------------ Tab handling Logic -------------------

const TAB_NAME_MAP = {
  GAME_HISTORY: "GAME_HISTORY",
  TREND: "TREND",
  MY_BETS: "MY_BETS",
};

const setActiveTab = (selectedTabName) => {
  $("#game_history_tab").removeClass("active");
  $("#trend_tab").removeClass("active");
  $("#my_bets_tab").removeClass("active");

  $("#game_history_tab_button .tab_nav_button_inner").removeClass("action");
  $("#trend_tab_button .tab_nav_button_inner").removeClass("action");
  $("#my_bets_tab_button .tab_nav_button_inner").removeClass("action");
  if (TAB_NAME_MAP.GAME_HISTORY === selectedTabName) {
    $("#game_history_tab").addClass("active");
    $("#game_history_tab_button .tab_nav_button_inner").addClass("action");
  }
  if (TAB_NAME_MAP.TREND === selectedTabName) {
    $("#trend_tab").addClass("active");
    $("#trend_tab_button .tab_nav_button_inner").addClass("action");
  }
  if (TAB_NAME_MAP.MY_BETS === selectedTabName) {
    $("#my_bets_tab").addClass("active");
    $("#my_bets_tab_button .tab_nav_button_inner").addClass("action");
  }
};

$("#game_history_tab_button").off("click.game_history_tab_button");
$("#game_history_tab_button").on(
  "click.game_history_tab_button",
  function (e) {
    e.preventDefault();

    setActiveTab(TAB_NAME_MAP.GAME_HISTORY);

    initGameHistoryTab();
  },
);

$("#trend_tab_button").off("click.trend_tab_button");
$("#trend_tab_button").on("click.trend_tab_button", function (e) {
  e.preventDefault();

  setActiveTab(TAB_NAME_MAP.TREND);

  initChartTab();
});

$("#my_bets_tab_button").off("click.my_bets_tab_button");
$("#my_bets_tab_button").on("click.my_bets_tab_button", function (e) {
  e.preventDefault();

  setActiveTab(TAB_NAME_MAP.MY_BETS);

  initMyBets();
});

// ------------------ Tab handling Logic -------------------end

//--------------------- Wingo game logic ---------------------
}
//------------------helpers-------------------
const isNumber = (params) => {
let pattern = /^[0-9]*\d$/;
return pattern.test(params);
};

function formateT(params) {
let result = params < 10 ? "0" + params : params;
return result;
}

function getCoinType() {
const selectElement = document.getElementById("coinSelect");
const selectedCoin = selectElement.value;
return selectedCoin;
}

function timerJoin(params = "", addHours = 0) {
let date = "";
if (params) {
  date = new Date(Number(params));
} else {
  date = new Date(TimeManager.currentTime.raw);
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
  ":" +
  ampm
);
}

function formateTimeHHmmss(params = "") {
let date = new Date(Number(params));
let hours = date.getHours();
let minutes = formateT(date.getMinutes());
let seconds = formateT(date.getSeconds());
return hours + ":" + minutes + ":" + seconds;
}

function formatIndianNumber(num) {
let formattedNum = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
}).format(num);
return formattedNum;
}

// var socket = io();
var pageno = 0;
var limit = 10;
var page = 1;

const STATUS_MAP = {
WIN: "win",
LOSS: "loss",
NONE: "none",
};

const displayLast5Result = ({ results }) => {
$(".TimeLeft__C-num").html(
  results
    .map((result) => `<div data-v-3e4c6499 class="n${result}"></div>`)
    .join(" "),
);
};

function getCurrentPricePoint() {
const coinSelect = document.getElementById('coinSelect');
const currentCoin = coinSelect ? coinSelect.value : 'BTC';
const currentPrice = window.getCurrentPrice ? window.getCurrentPrice() : null;

if (!currentPrice) {
  // console.warn('Current price not available');
  return null;
}

const now = new Date(TimeManager.currentTime.raw);
now.setSeconds(1, 0); // Align to 1st second
const timestamp = now.getTime();

const result = {
  coin: currentCoin,
  price: parseFloat(currentPrice.toFixed(3)),
  timestamp: timestamp
};

console.log("Current price returned", result.coin, result.price, new Date(result.timestamp));
return result;
}


let currentStartPoint = null;



socket.on('startPointsData', (data) => {
console.log("Start Point received from server", data);
// Adjust timestamp to align with 1st second
const adjustedPoints = {};
Object.keys(data.points).forEach(coin => {
  adjustedPoints[coin] = {
    ...data.points[coin],
    timestamp: Math.floor(data.points[coin].timestamp / 1000) * 1000 + 1000 // Align to 1st second
  };
});
localStorage.setItem(`startPoints_${data.session}`, JSON.stringify(adjustedPoints));
});

// Define updateLiveGames function to handle session updates
function updateLiveGames(session, data) {
try {
  // Adjust timestamp to align with 1st second
  const now = new Date(data.timestamp);
  now.setSeconds(1, 0);
  const adjustedTimestamp = now.getTime();

  localStorage.setItem(`startPoints_${session}`, JSON.stringify(data));
  
  if (data.active) {
    sessionLines[session] = {
      startTime: adjustedTimestamp,
      endTime: adjustedTimestamp + GAME_SESSIONS[session].duration,
      price: data.price,
      duration: session
    };
  } else {
    sessionLines[session] = null;
  }

  const currentSession = getCurrentGameSession();
  if (session === currentSession && window.chart) {
    updateChart();
  }

  if (data.period) {
    updatePeriodDisplay(data.period);
  }

  console.log(`Session ${session} updated with data:`, sessionLines[session]);
} catch (error) {
  console.error('Error in updateLiveGames:', error);
}
}


socket.on('sessionUpdate', (update) => {
console.log("Session Update received from server", update);
if (update.type === 'START_POINTS') {
  // Adjust timestamp to align with 1st second
  const adjustedData = {
    ...update.data,
    timestamp: Math.floor(update.data.timestamp / 1000) * 1000 + 1000 // Align to 1st second
  };
  updateLiveGames(update.session, adjustedData);
}
});
// $(document).ready(() => {
//   const storedPeriod = JSON.parse(localStorage.getItem("period"));
//   if (storedPeriod) {
//     $(".period").html(`<span style="color:white; font-weight:800">${storedPeriod}</span>`);
//   }
// });


socket.on("get3minStartPoint",()=>{
  const point=getCurrentPricePoint();
  if(point){
    localStorage.setItem("3minStartPoint",JSON.stringify(point));
    console.log("3 min Start Point set.",point); 
  }
})

socket.on("get5minStartPoint",()=>{
const point=getCurrentPricePoint();
if(point){
  localStorage.setItem("5minStartPoint",JSON.stringify(point));
  console.log("5 min start point set",point);
}
})


socket.on("get10minStartPoint",()=>{
const point=getCurrentPricePoint();
if(point){
  localStorage.setItem("10minStartPoint",JSON.stringify(point));
  console.log("10 min start point set",point);
}
})




// socket.on("setEndPoint",()=>{
//   const point=getCurrentPricePoint();
//   if(point){
//     localStorage.setItem("endPoint",JSON.stringify(point));
//     console.log("End Point received",point);
//   }
// })




socket.on("data-server", async function (msg) {
try {
  // const point=getCurrentPricePoint();
  // if(point){
  //   localStorage.setItem("endPoint",JSON.stringify(point));
  //   console.log("End Point received",point);
  // }
  GAME_TYPE_ID = getGameType();
//  console.log(GAME_NAME);
  if (msg.data[0].game != GAME_NAME) {
    return;
  }
  $(".period").html(`<span style="color:white;">${msg.data[0].period}</span>`);

  $(".Loading").fadeIn(0);

  const params = new URLSearchParams();
  params.append("typeid", GAME_TYPE_ID);
  params.append("pageno", "0");
  params.append("pageto", "10");
  params.append("language", "vi");

  const betList = axios({
    method: "POST",
    url: "/api/webapi/GetMyEmerdList",
    data: params,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });

  const gameList = axios({
    method: "POST",
    url: "/api/webapi/GetNoaverageEmerdList",
    data: params,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });

  const [betDataResponse, gameDataResponse] = await Promise.all([
    betList,
    gameList,
  ]);

  const betListData = betDataResponse.data?.data?.gameslist;
  const betType=gameDataResponse.data?.data?.data?.bet;
  const gameListData = gameDataResponse.data?.data?.gameslist;

  const lastGame = gameListData?.[0];

  const lastGameBets = betListData?.filter(
    (game) => game.stage === lastGame?.period,
  );

  const lostGames = lastGameBets?.filter((game) => game.get === 0);
  const lostGamesMoney = lostGames?.reduce(
    (acc, game) => acc + game.money,
    0,
  );
  const winGames = lastGameBets?.filter((game) => game.get > 0);
  const winGamesMoney = winGames?.reduce((acc, game) => acc + game.get, 0);

  if (lastGameBets.length > 0) {
    if (winGamesMoney > 0) {
      displayResultHandler({
        status: STATUS_MAP.WIN,
        amount: winGamesMoney,
        period: lastGame?.period,
        result: lastGame?.result,
      });
    } else {
      displayResultHandler({
        status: STATUS_MAP.LOSS,
        amount: lostGamesMoney,
        period: lastGame?.period,
        result: lastGame?.result,
      });
    }
  } 

  $("#period").text(gameDataResponse.data.period);
  $("#number_result__gameHistory").text(`1/${gameDataResponse.data.page}`);
  $("#number_result__myBet").text(`1/${betDataResponse.data.page}`);
  showGameHistoryData(gameListData);
  showTrendData(gameListData);
  showMyBetsData(betListData);

  fetch("/api/webapi/GetUserInfo")
    .then((response) => response.json())
    .then((data) => {
      if (data.status === false) {
        unsetCookie();
        return false;
      }
      $("#balance_amount").text(
        `₹ ${formatIndianNumber(data.data.money_user)} `,
      );
      $("#bonus_balance_amount").text(
        `₹ ${formatIndianNumber(data.data.bonus_money)} `,
      );
    });

  $(".Loading").fadeOut(0);
} catch (error) {
  console.log(error); 
}
});




// betting-chart.js
// Add these at the beginning of your script

// const seed = "shared-crypto-seed-2023"; // Any string you want

// client.js
// const socket = io();

// Coin configurations for UI
const coinConfigs = {
BTC: { basePrice: 60000, color: '#f7931a', name: 'Bitcoin' },
ETH: { basePrice: 3000, color: '#627eea', name: 'Ethereum' },
BNB: { basePrice: 500, color: '#f3ba2f', name: 'Binance Coin' },
ADA: { basePrice: 0.5, color: '#0033ad', name: 'Cardano' }
};

let coinData = {
BTC: [],
ETH: [],
BNB: [],
ADA: []
// Add other coins if needed
};



// Define GAME_SESSIONS at the top of your script, before socket event handlers
const GAME_SESSIONS = {
'1min': { duration: 1 * 60 * 1000 }, // 1 minute in milliseconds
'3min': { duration: 3 * 60 * 1000 }, // 3 minutes in milliseconds
'5min': { duration: 5 * 60 * 1000 }, // 5 minutes in milliseconds
'10min': { duration: 10 * 60 * 1000 } // 10 minutes in milliseconds
};

let currentCoin = 'BTC';
let currentPrice = coinConfigs[currentCoin].basePrice;
let previousPrice = currentPrice;
// let coinData = {};
let sessionLines = {
'1min': null,
'3min': null,
'5min': null,
'10min': null
};

// Initialize empty data structures for each coin
Object.keys(coinConfigs).forEach(coin => {
coinData[coin] = [];
});

// Handle initial data from server
socket.on('initialData', (data) => {
// Update coin data
Object.keys(data.coins).forEach(coin => {
  coinData[coin] = data.coins[coin].map(point => ({
    x: point.timestamp,
    y: point.price
  }));
});

// Update session lines
Object.keys(data.sessions).forEach(session => {
  const sessionData = data.sessions[session];
  console.log(sessionData);
  if (sessionData.active) {
    // Calculate the end time based on current client time and timeLeft
    const endTime = Date.now() + sessionData.timeLeft;
  
    // Calculate the start time and align it to :01 seconds
    const duration = GAME_SESSIONS[session].duration;
    const startTime = new Date(endTime - duration);
    startTime.setSeconds(1, 0); // Force seconds to 01.000
  
    sessionLines[session] = {
      startTime: startTime.getTime(),
      endTime: endTime,
      price: sessionData.price,
      duration: session
    };
  }
});

// Set current price
if (coinData[currentCoin].length > 0) {
  currentPrice = coinData[currentCoin][coinData[currentCoin].length - 1].y;
  previousPrice = coinData[currentCoin].length > 1 
    ? coinData[currentCoin][coinData[currentCoin].length - 2].y 
    : currentPrice;
  updatePriceInfo();
}

// Initialize chart if not already done
if (!window.chart) {
  initializeChart();
} else {
  updateChart();
}
});

// socket.on("setStartPoint",(Point)=>{
//     console.log("startPoint received",Point);
// })

// Handle price updates from server
socket.on('priceUpdate', (update) => {
// Update coin data
Object.keys(update.prices).forEach(coin => {
  coinData[coin].push({
    x: update.timestamp,
    y: update.prices[coin]
  });
  // Remove data older than 24 hours
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  coinData[coin] = coinData[coin].filter(point => point.x >= oneDayAgo);
});

// Update session lines from server
Object.keys(update.sessions).forEach(session => {
  const sessionData = update.sessions[session];
  if (sessionData.active) {
    // Modified to start at 1st second of the minute
    const now = new Date(update.timestamp);
    const startAtFirstSecond = new Date(now).setSeconds(0, 0);
    
    sessionLines[session] = {
      startTime: startAtFirstSecond,
      endTime: startAtFirstSecond + GAME_SESSIONS[session].duration,
      price: sessionData.price,
      duration: session
    };
  } else {
    sessionLines[session] = null;
  }
});

// Update current price if it's for the active coin
if (update.prices[currentCoin] !== undefined) {
  previousPrice = currentPrice;
  currentPrice = update.prices[currentCoin];
  updatePriceInfo();
}

// Update chart
if (window.chart) {
  updateChart();
}

if (window.chart) {
  window.chart.update('none');
}
});
// Handle end point setting confirmation
socket.on('endPointSet', ({ session, coin, price, startTime, duration }) => {
sessionLines[session] = {
  startTime,
  endTime: startTime + duration,
  price,
  duration: session
};

// console.log(`${session} end point set at ${price} for ${coin}`);

// Disable buttons when end point is set (last minute of session)
const getTimeMSS = (countDownDate) => {
  var now = new Date().getTime();
  var distance = countDownDate - now;
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var minute = Math.ceil(minutes % parseInt(GAME_TYPE_ID));
  var seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
  var seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);

  return { minute, seconds1, seconds2 };
};


if (session === getCurrentGameSession()) {
  const betButtons = document.querySelectorAll(".bet_button");
  if (betButtons) {
    betButtons.forEach(button => {
      button.style.pointerEvents = "none";
      button.style.cursor = "not-allowed";
      button.style.opacity = "0.6";
    });
  }
}
});





// Function to set end point from client
// function setEndPoint(session, price) {
//   const coin = document.getElementById('coinSelect').value;
//   socket.emit('setEndPoint', { session, coin, price });
// }



// let currentCoin = 'BTC';
// let currentPrice = coinConfigs[currentCoin].basePrice;
// let previousPrice = currentPrice;
let animationState = {};
const POINT_ANIMATION_DURATION = 700;
let hasUserScrolled = false;
let lastUpdateTime = 0;
const TARGET_FRAME_RATE = 30;
const FRAME_INTERVAL = 1000 / TARGET_FRAME_RATE;

// const canvas = document.getElementsByClassName('priceChart')[0];
let chartInstance = null;

// Initialize the chart
function initializeChart() {
  const canvas = document.getElementsByClassName('priceChart')[0];
  if (chartInstance) return;  
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  chartInstance = window.chart;
  // Add these variables at the top of your script
let scrollOffset = 0;
const scrollSpeed = 0.3; // Adjust this for faster/slower scrolling
let lastUpdateTimestamp = Date.now();

const continuousScrollPlugin = {
  id: 'continuousScroll',
  beforeDatasetUpdate(chart) {
    const now = Date.now();
    const deltaTime = now - lastUpdateTimestamp;
    lastUpdateTimestamp = now;
    
    // Calculate scroll offset based on time elapsed
    scrollOffset += deltaTime * scrollSpeed;
    
    // Apply the scroll offset to transform the x-axis
    chart.options.scales.x.min = Date.now() - 30000 - scrollOffset;
    chart.options.scales.x.max = Date.now() + 5000 - scrollOffset;
  },
  afterDatasetsDraw(chart) {
    // Handle the moving dot animation separately
    const now = Date.now();
    const points = coinData[currentCoin];
    
    if (!points || points.length < 2) return;
    
    const lastPoint = points[points.length - 1];
    const prevPoint = points[points.length - 2];
    
    if (!animationState.startTime) {
      animationState = {
        startTime: now,
        startPoint: {...prevPoint},
        targetPoint: {...lastPoint}
      };
    }
    
    const elapsed = now - animationState.startTime;
    const progress = Math.min(elapsed / POINT_ANIMATION_DURATION, 1);
    
    const animatedPoint = getInterpolatedPoint(
      animationState.startPoint,
      animationState.targetPoint,
      progress
    );
    
    // Draw the moving dot manually to keep it in sync
    const ctx = chart.ctx;
    const xAxis = chart.scales.x;
    const yAxis = chart.scales.y;
    
    const xPos = xAxis.getPixelForValue(animatedPoint.x - scrollOffset);
    const yPos = yAxis.getPixelForValue(animatedPoint.y);
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(xPos, yPos, 4, 0, Math.PI * 2);
    ctx.fillStyle = coinConfigs[currentCoin].color;
    ctx.fill();
    ctx.restore();
    
    if (progress < 1) {
      requestAnimationFrame(() => {
        chart.update('none');
      });
    } else {
      animationState = {};
    }
  }
};

  // Smooth Animation Plugin
  const smoothAnimationPlugin = {
    id: 'smoothAnimation',
    afterDatasetsUpdate: function(chart) {
      const now = Date.now();
      const points = coinData[currentCoin];
      
      if (!points || points.length < 2) return;
      
      // Store the previous dataset for interpolation
      if (!this.lastDataset) {
        this.lastDataset = points.slice();
      }
      
      // Calculate how much to shift the x-values
      const timeShift = (now - points[points.length - 1].x) / 1000; // in seconds
      
      // Create interpolated dataset that flows smoothly
      const flowingData = points.map((point, i) => {
        if (!this.lastDataset[i]) return point;
        
        return {
          x: point.x + timeShift * 0.3, // Adjust multiplier for speed
          y: point.y
        };
      });
      
      // Update the chart with flowing data
      chart.data.datasets[0].data = flowingData;
      this.lastDataset = points.slice();
      
      // Rest of your moving dot animation...
      const lastPoint = flowingData[flowingData.length - 1];
      const prevPoint = flowingData[flowingData.length - 2];
      
      if (!animationState.startTime) {
        animationState = {
          startTime: now,
          startPoint: {...prevPoint},
          targetPoint: {...lastPoint}
        };
      }
      
      const elapsed = now - animationState.startTime;
      const progress = Math.min(elapsed / POINT_ANIMATION_DURATION, 1);
      
      const animatedPoint = getInterpolatedPoint(
        animationState.startPoint,
        animationState.targetPoint,
        progress
      );
      
      chart.data.datasets[1].data = [animatedPoint];
      
      if (progress < 1) {
        requestAnimationFrame(() => {
          chart.update('none');
        });
      } else {
        animationState = {};
      }
    }
  };

  // Tracking Line Plugin
  const trackingLinePlugin = {
    id: 'alwaysVisibleTrackingLine',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const yAxis = chart.scales.y;
      const xAxis = chart.scales.x;
      const chartArea = chart.chartArea;
      
      // Get the last data point
      const data = chart.data.datasets[0].data;
      if (!data || data.length === 0) return;
      
      const lastPoint = data[data.length - 1];
      
      // Calculate positions
      const xPos = xAxis.getPixelForValue(lastPoint.x);
      const yPos = yAxis.getPixelForValue(lastPoint.y);
      
      // Only draw if within visible x-range
      if (xPos < chartArea.left || xPos > chartArea.right) return;
      
      ctx.save();
      
      // Vertical line (full height)
      ctx.beginPath();
      ctx.moveTo(xPos, chartArea.top);
      ctx.lineTo(xPos, chartArea.bottom);
      ctx.strokeStyle = coinConfigs[currentCoin].color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      
      // Horizontal line (full width)
      ctx.beginPath();
      ctx.moveTo(chartArea.left, yPos);
      ctx.lineTo(chartArea.right, yPos);
      ctx.stroke();
      
      // Price indicator box (always right-aligned)
      const priceText = lastPoint.y.toFixed(4);
      const boxWidth = ctx.measureText(priceText).width + 16;
      const boxHeight = 24;
      const radius = boxHeight / 2;
      const boxX = chartArea.right + 10;
      
      // Draw box
      ctx.fillStyle = coinConfigs[currentCoin].color;
      ctx.beginPath();
      ctx.moveTo(boxX, yPos - radius);
      ctx.lineTo(boxX + boxWidth - radius, yPos - radius);
      ctx.arc(boxX + boxWidth - radius, yPos, radius, -Math.PI/2, Math.PI/2);
      ctx.lineTo(boxX, yPos + radius);
      ctx.arc(boxX + radius, yPos, radius, Math.PI/2, 3*Math.PI/2);
      ctx.closePath();
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(priceText, boxX + (boxWidth / 2), yPos);
      
      // Connecting line
      ctx.beginPath();
      ctx.moveTo(chartArea.right, yPos);
      ctx.lineTo(boxX, yPos);
      ctx.strokeStyle = coinConfigs[currentCoin].color;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    }
  };

  // Create the chart
  window.chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: `${coinConfigs[currentCoin].name} Price`,
        data: coinData[currentCoin],
        borderColor: coinConfigs[currentCoin].color,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        tension: 0.1,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 2
      }, 
      {
        data: [coinData[currentCoin][coinData[currentCoin].length - 1]],
        borderColor: coinConfigs[currentCoin].color,
        backgroundColor: coinConfigs[currentCoin].color,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4,
        showLine: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0 // Disable built-in animations
      },
      layout: {
        padding: {
          left: 0,
          right: 60
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            stepSize: 1,
            displayFormats: {
              minute: 'HH:mm:ss',
              second: 'HH:mm:ss'
            }
          },
          bounds: 'ticks',
          ticks: {
            source: 'auto',
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          min: function() {
            const data = this.chart.data.datasets[0].data;
            if (data.length === 0) return Date.now() - 30000;
            return data[0].x;
          },
          max: function() {
            const data = this.chart.data.datasets[0].data;
            if (data.length === 0) return Date.now();
            return data[data.length - 1].x + 5000;
          }
        },
        y: {
          position: 'right',
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            callback: function(value) {
              return value.toFixed(2);
            },
            padding: 12,
            maxTicksLimit: 8
          },
          min: function() {
            const range = getDynamicYRange();
            return range.min;
          },
          max: function() {
            const range = getDynamicYRange();
            return range.max;
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        },
        decimation: {
          enabled: true,
          algorithm: 'lttb',
          samples: 100
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
            threshold: 10
          },
          zoom: {
            wheel: {
              enabled: true,
              speed: 0.1
            },
            pinch: {
              enabled: true
            },
            mode: 'x'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    },
    plugins: [continuousScrollPlugin,  trackingLinePlugin]
  });

  // Start continuous updates
  requestAnimationFrame(continuousUpdate);
}

// Helper Functions
function getInterpolatedPoint(startPoint, endPoint, progress) {
  return {
    x: startPoint.x + (endPoint.x - startPoint.x) * progress,
    y: startPoint.y + (endPoint.y - startPoint.y) * progress
  };
}

function getDynamicYRange() {
  const visibleData = coinData[currentCoin].filter(point => {
    const xAxis = window.chart?.scales.x;
    if (!xAxis) return false;
    return point.x >= xAxis.min && point.x <= xAxis.max;
  });

  if (visibleData.length === 0) {
    return {
      min: currentPrice - currentPrice * 0.4,
      max: currentPrice + currentPrice * 0.5
    };
  }

  const prices = visibleData.map(point => point.y);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const padding = range * 0.4 || (maxPrice * 0.05);

  return {
    min: minPrice - padding,
    max: maxPrice + padding
  };
}

let lastUpdate = 0;
  const updateInterval = 100; // Update every 100ms
  function continuousUpdate(timestamp) {
    if (!window.chart) return;
    if (timestamp - lastUpdate >= updateInterval) {
      updateChart(!hasUserScrolled);
      lastUpdate = timestamp;
    }
    requestAnimationFrame(continuousUpdate);
  }

  requestAnimationFrame(continuousUpdate);

function updatePriceInfo() {
  const priceChange = (currentPrice - previousPrice).toFixed(2);
  const currentPriceEl = document.getElementById('currentPriceDisplay');
  const priceChangeEl = document.getElementById('priceChangeDisplay');
  
  if (currentPriceEl) {
    currentPriceEl.textContent = currentPrice.toFixed(4);
  }
  
  if (priceChangeEl) {
    priceChangeEl.textContent = `${priceChange}`;
    priceChangeEl.style.color = priceChange > 0 ? '#10b981' : 
                               priceChange < 0 ? '#ef4444' : '#6b7280';
  }
}

// Socket Event Handlers
socket.on('priceUpdate', (update) => {
  // Update coin data with interpolation
  Object.keys(update.prices).forEach(coin => {
    // Add interpolated points between updates for smoothness
    if (coinData[coin].length > 0) {
      const lastPoint = coinData[coin][coinData[coin].length - 1];
      const timeDiff = update.timestamp - lastPoint.x;
      
      // Add interpolated points if gap is too large
      if (timeDiff > 1000) {
        const steps = Math.min(5, Math.floor(timeDiff / 200));
        for (let i = 1; i <= steps; i++) {
          const fraction = i / (steps + 1);
          const interpolatedPrice = lastPoint.y + 
            (update.prices[coin] - lastPoint.y) * fraction;
          coinData[coin].push({
            x: lastPoint.x + (timeDiff * fraction),
            y: interpolatedPrice
          });
        }
      }
    }
    
    // Add the actual update point
    coinData[coin].push({
      x: update.timestamp,
      y: update.prices[coin]
    });
    
    // Trim old data
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    coinData[coin] = coinData[coin].filter(point => point.x >= oneDayAgo);
  });

  // Update current price if it's for the active coin
  if (update.prices[currentCoin] !== undefined) {
    previousPrice = currentPrice;
    currentPrice = update.prices[currentCoin];
    updatePriceInfo();
  }
});

// Coin Selection Handler
document.getElementById('coinSelect')?.addEventListener('change', function() {
  currentCoin = this.value;
  if (window.chart) {
    window.chart.data.datasets[0].label = `${coinConfigs[currentCoin].name} Price`;
    window.chart.data.datasets[0].borderColor = coinConfigs[currentCoin].color;
    window.chart.data.datasets[1].borderColor = coinConfigs[currentCoin].color;
    window.chart.data.datasets[1].backgroundColor = coinConfigs[currentCoin].color;
    updateChart();
  }
});

// Reset Scroll Function
function resetChartScroll() {
  if (!window.chart) return;

  const xScale = window.chart.scales.x;
  const startMin = xScale.min;
  const startMax = xScale.max;
  const lastPoint = coinData[currentCoin][coinData[currentCoin].length - 1];

  if (!lastPoint) return;

  const viewDuration = 20 * 1000; // 20 seconds of historical data
  const lookAhead = 0.1 * 60 * 1000; // 6 seconds of look ahead
  const targetMin = lastPoint.x - (viewDuration - lookAhead);
  const targetMax = lastPoint.x + lookAhead;

  const startTime = performance.now();
  const duration = 300;

  const animateReset = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeOutQuad(progress);
    
    window.chart.options.scales.x.min = startMin + (targetMin - startMin) * easeProgress;
    window.chart.options.scales.x.max = startMax + (targetMax - startMax) * easeProgress;
    window.chart.update('none');
    
    if (progress < 1) {
      requestAnimationFrame(animateReset);
    } else {
      hasUserScrolled = false;
      document.getElementById('resetScroll').style.display = 'none';
    }
  };

  requestAnimationFrame(animateReset);
}

function easeOutQuad(t) {
  return t * (2 - t);
}

function updatePriceDisplay() {
  const change = (currentPrice - previousPrice).toFixed(2);
  const priceEl = document.getElementById('currentPriceDisplay');
  const changeEl = document.getElementById('priceChangeDisplay');
  
  if (priceEl) priceEl.textContent = currentPrice.toFixed(2);
  if (changeEl) {
    changeEl.textContent = change;
    changeEl.style.color = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280';
  }
}



// Initialize the chart when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Use passive event listeners for better scrolling performance
  const canvas = document.querySelector('.priceChart');
  // if (canvas) {
  //   canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
  //   canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  //   canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
  // }

  initializeChart();
  updatePriceDisplay();
});
let chartUpdateTimeout;
function debouncedUpdateChart() {
  clearTimeout(chartUpdateTimeout);
  chartUpdateTimeout = setTimeout(() => {
    updateChart();
  }, 100); // Update at most every 100ms
}

// Use debouncedUpdateChart() instead of updateChart() in your price update handlers

function initializeChart() {
const canvas = document.getElementsByClassName('priceChart')[0];
// console.log(canvas);
const ctx = canvas.getContext('2d');

// Variables for drag scrolling
let isDraggingChart = false;
let lastDragPosition = null;
let dragStartX = null;

// Session line plugin
function getSessionStartPrice(coin, sessionStartTime) {
  try {
    if (!coinData[coin] || !Array.isArray(coinData[coin]) || coinData[coin].length === 0) {
      return null;
    }

    const sessionStartDate = new Date(sessionStartTime);
    if (isNaN(sessionStartDate.getTime())) return null;

    if (sessionStartDate.getSeconds() !== 1) {
      sessionStartDate.setSeconds(1, 0);
    }

    const targetTime = sessionStartDate.getTime();
    const closestPoint = coinData[coin].reduce((closest, point) => {
      if (!point || point.x === undefined || point.y === undefined) return closest;
      const timeDiff = point.x - targetTime;
      if (timeDiff >= 0 && timeDiff < (closest.timeDiff || Infinity)) {
        return { point, timeDiff };
      }
      return closest;
    }, { point: null, timeDiff: Infinity }).point;

    return closestPoint ? closestPoint.y : null;
  } catch (error) {
    console.error('Error in getSessionStartPrice:', error);
    return null;
  }
}

const sessionLinePlugin = {
  id: 'sessionLine',
  afterDatasetsDraw(chart) {
    try {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;

      const coinSelect = document.getElementById('coinSelect');
      const currentCoin = coinSelect ? coinSelect.value : 'BTC';

      const gameType = getGameType();
      const sessionDuration = {
        '1': 60 * 1000,
        '3': 180 * 1000,
        '5': 300 * 1000,
        '10': 600 * 1000
      }[gameType] || 60 * 1000;

      const serverNow = TimeManager.currentTime.raw;
      if (!serverNow || isNaN(serverNow)) return;

      const alignedNow = new Date(serverNow);
      const sessionStartTime = new Date(
        Math.floor(alignedNow.getTime() / sessionDuration) * sessionDuration
      );
      sessionStartTime.setSeconds(1, 0);

      const sessionEndTime = new Date(sessionStartTime.getTime() + sessionDuration);
      if (sessionEndTime.getTime() < xAxis.min || sessionStartTime.getTime() > xAxis.max) return;

      const startPrice = getSessionStartPrice(currentCoin, sessionStartTime.getTime());
      if (startPrice === null || startPrice === undefined) return;

      ctx.save();
      const visibleStartX = Math.max(xAxis.getPixelForValue(sessionStartTime.getTime()), xAxis.left);
      const visibleEndX = Math.min(xAxis.getPixelForValue(sessionEndTime.getTime()), xAxis.right);
      const y = yAxis.getPixelForValue(startPrice);

      // Draw horizontal line
      ctx.beginPath();
      ctx.moveTo(visibleStartX, y);
      ctx.lineTo(visibleEndX, y);
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw start point circle
      ctx.beginPath();
      ctx.arc(visibleStartX, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'yellow';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Session Price', visibleStartX + 10, y - 5);

      ctx.restore();
    } catch (error) {
      console.error('Error in sessionLinePlugin:', error);
    }
  }
};

const trackingLinePlugin = {
  id: 'trackingLine',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    const yAxis = chart.scales.y;
    const chartArea = chart.chartArea;

    if (!dataset.data.length) return;

    const lastIndex = dataset.data.length - 1;
    const lastPoint = meta.data[lastIndex];
    if (!lastPoint) return;

    const currentPrice = dataset.data[lastIndex].y;
    const priceText = currentPrice.toFixed(2);
    const x = lastPoint.x;
    const y = lastPoint.y;

    ctx.save();

    // Draw tracking lines
    ctx.strokeStyle = coinConfigs[currentCoin].color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.stroke();

    // Draw capsule-shaped indicator
    const textWidth = ctx.measureText(priceText).width;
    const capsuleWidth = textWidth + 16;
    const capsuleHeight = 24;
    const radius = capsuleHeight / 2;
    const capsuleX = chartArea.right + 10;
    const capsuleY = y;

    ctx.globalAlpha = 1;
    ctx.fillStyle = coinConfigs[currentCoin].color;
    ctx.beginPath();
    ctx.arc(capsuleX + radius, capsuleY, radius, Math.PI/2, Math.PI*3/2);
    ctx.arc(capsuleX + capsuleWidth - radius, capsuleY, radius, Math.PI*3/2, Math.PI/2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(priceText, capsuleX + capsuleWidth/2, capsuleY);

    ctx.strokeStyle = coinConfigs[currentCoin].color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartArea.right, y);
    ctx.lineTo(capsuleX, y);
    ctx.stroke();

    ctx.restore();
  }
};

function getDynamicYRange() {
  const chart = window.chart;
  if (!chart) return {
    min: currentPrice - currentPrice * 0.4,
    max: currentPrice + currentPrice * 0.5
  };

  const xAxis = chart.scales.x;
  const visibleData = coinData[currentCoin].filter(point => {
    return point.x >= xAxis.min && point.x <= xAxis.max;
  });

  if (visibleData.length === 0) {
    return {
      min: currentPrice - currentPrice * 0.4,
      max: currentPrice + currentPrice * 0.5
    };
  }

  const prices = visibleData.map(point => point.y);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const padding = range * 0.4 || (maxPrice * 0.05);

  return {
    min: minPrice - padding,
    max: maxPrice + padding
  };
}

let animationState = {
  currentPoint: null,
  startTime: null,
  isAnimating: false,
  previousLastPoint: null
};
const POINT_ANIMATION_DURATION = 700; 

function getInterpolatedPoint(startPoint, endPoint, progress) {
  return {
    x: startPoint.x + (endPoint.x - startPoint.x) * progress,
    y: startPoint.y + (endPoint.y - startPoint.y) * progress
  };
}

// Drag handlers
function handleDragStart(e) {
  if (e.touches && e.touches.length > 1) return; // Ignore if multi-touch
  
  isDraggingChart = true;
  dragStartX = e.clientX || e.touches[0].clientX;
  lastDragPosition = dragStartX;
  
  // Change cursor to grabbing
  canvas.style.cursor = 'grabbing';
}

function handleDragMove(e) {
  if (!isDraggingChart || !window.chart) return;
  
  const currentX = e.clientX || e.touches[0].clientX;
  const deltaX = currentX - lastDragPosition;
  lastDragPosition = currentX;
  
  const xScale = window.chart.scales.x;
  const pixelRange = xScale.max - xScale.min;
  const pixelToTimeRatio = pixelRange / window.chart.width;
  
  // Calculate new min/max based on drag distance
  const timeDelta = deltaX * pixelToTimeRatio;
  const newMin = xScale.min - timeDelta;
  const newMax = xScale.max - timeDelta;
  
  // Check boundaries (don't scroll past data)
  const data = window.chart.data.datasets[0].data;
  if (data.length > 0) {
    const firstPoint = data[0].x;
    const lastPoint = data[data.length - 1].x;
    
    // Don't allow scrolling past the data
    if (newMin < firstPoint) {
      const adjustment = firstPoint - newMin;
      window.chart.options.scales.x.min = firstPoint;
      window.chart.options.scales.x.max = newMax - adjustment;
    } else if (newMax > lastPoint) {
      const adjustment = newMax - lastPoint;
      window.chart.options.scales.x.min = newMin - adjustment;
      window.chart.options.scales.x.max = lastPoint;
    } else {
      window.chart.options.scales.x.min = newMin;
      window.chart.options.scales.x.max = newMax;
    }
  } else {
    window.chart.options.scales.x.min = newMin;
    window.chart.options.scales.x.max = newMax;
  }
  
  window.chart.update('none');
  hasUserScrolled = true;
  document.getElementById('resetScroll').style.display = 'inline-block';
}

function handleDragEnd() {
  isDraggingChart = false;
  dragStartX = null;
  lastDragPosition = null;
  
  // Reset cursor
  canvas.style.cursor = 'crosshair';
}

// Add event listeners for drag scrolling
canvas.addEventListener('mousedown', handleDragStart);
canvas.addEventListener('touchstart', handleDragStart);

document.addEventListener('mousemove', handleDragMove);
document.addEventListener('touchmove', handleDragMove);

document.addEventListener('mouseup', handleDragEnd);
document.addEventListener('touchend', handleDragEnd);

// Prevent page scrolling when touching chart
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    e.preventDefault();
  }
}, { passive: false });

window.chart = new Chart(ctx, {
  type: 'line',
  data: {
    datasets: [{
      label: ` Price`,
      data: coinData[currentCoin],
      borderColor: coinConfigs[currentCoin].color,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 0.5,
      tension: 0.1,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 2
    }, 
    {
      data: [coinData[currentCoin][coinData[currentCoin].length - 1]],
      borderColor: coinConfigs[currentCoin].color,
      backgroundColor: coinConfigs[currentCoin].color,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 4,
      showLine: true,
      animation: {
        duration: 1000,
        easing: 'easeOutQuad',
        properties: ['x', 'y']
      }
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 6
      }
    },
    animation: false,
    transitions: {
      active: {
        animation: {
          duration: 1000
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          stepSize: 3,
          minUnit: 'second',
          displayFormats: {
            day: 'D MMM',
            minute: 'HH:mm'
          }
        },
        bounds: 'data',
    ticks: {
      source: 'data',
      autoSkip: true,
      maxRotation: 0,
      color: 'rgba(255, 255, 255, 0.7)'
    },


        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 12
          }
        },
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        min: () => Date.now() - 30 * 1000,
        max: () => Date.now()
      },
      y: {
        beginAtZero: false,
        position: 'right',
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          callback: function(value) {
            return value.toFixed(2);
          },
          padding: 12,
          maxTicksLimit: 8
        },
        min: () => getDynamicYRange().min,
        max: () => getDynamicYRange().max
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        mode: 'index',
        intersect: false
      },
      crosshair: false,
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: null,
          threshold: 10,
          onPan: ({chart}) => {
            hasUserScrolled = true;
            document.getElementById('resetScroll').style.display = 'inline-block';
          }
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
            modifierKey: 'ctrl',
            onZoom: ({chart}) => {
              hasUserScrolled = true;
              document.getElementById('resetScroll').style.display = 'inline-block';
            }
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
          onZoom: ({chart}) => {
            hasUserScrolled = true;
            document.getElementById('resetScroll').style.display = 'inline-block';
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  },
  plugins: [{
    id: 'sequentialAnimation',
    afterDatasetsUpdate: function(chart) {
      const now = Date.now();
      const points = coinData[currentCoin];
      
      if (!points || points.length === 0) return;
      
      const currentLastPoint = points[points.length - 1];
      
      // Initialize animation if not running
      if (!animationState.isAnimating) {
        if (!animationState.previousLastPoint) {
          // First render - show all data
          chart.data.datasets[0].data = points;
          chart.data.datasets[1].data = [currentLastPoint];
          animationState.previousLastPoint = currentLastPoint;
          return;
        }
        
        // Start new animation if point changed
        if (currentLastPoint.x !== animationState.previousLastPoint.x || 
            currentLastPoint.y !== animationState.previousLastPoint.y) {
          animationState = {
            currentPoint: {...animationState.previousLastPoint},
            startTime: now,
            isAnimating: true,
            previousLastPoint: animationState.previousLastPoint,
            targetPoint: currentLastPoint,
            originalData: [...points.slice(0, -1)]
          };
        }
      }
      
      // Handle ongoing animation
      if (animationState.isAnimating) {
        const elapsed = now - animationState.startTime;
        const progress = Math.min(elapsed / POINT_ANIMATION_DURATION, 1);
        
        // Animate point movement
        animationState.currentPoint = getInterpolatedPoint(
          animationState.previousLastPoint,
          animationState.targetPoint,
          progress
        );
        
        // Update point dataset (datasets[1]) to show animated position
        chart.data.datasets[1].data = [animationState.currentPoint];
        
        // Update line dataset (datasets[0]) to grow gradually
        const lineData = [...animationState.originalData, animationState.currentPoint];
        chart.data.datasets[0].data = lineData;
        
        // When animation completes, finalize both datasets
        if (progress >= 1) {
          chart.data.datasets[0].data = points;
          chart.data.datasets[1].data = [currentLastPoint];
          animationState.previousLastPoint = currentLastPoint;
          animationState.isAnimating = false;
        }
        
        // Continue animation on next frame
        if (progress < 1) {
          requestAnimationFrame(() => {
            chart.update('none');
          });
        }
      }
    }
  }, sessionLinePlugin, trackingLinePlugin]
});
}

const canvas = document.getElementsByClassName('priceChart')[0];

// Handle click events for scrolling
// canvas.addEventListener('click', (event) => {
//   const rect = canvas.getBoundingClientRect();
//   const clickX = event.clientX - rect.left; // X position relative to canvas
//   const canvasWidth = rect.width;

//   // Determine if the click is on the left or right half of the chart
//   const threshold = canvasWidth / 5;
//   if (clickX < threshold) {
//     handleChartScroll('left'); // Scroll left if clicked on the left side
//   } else {
//     handleChartScroll('right'); // Scroll right if clicked on the right side
//   }
// });

// Handle touch events for swiping
// let touchStartX = 0;
// let touchEndX = 0;

// canvas.addEventListener('touchstart', (event) => {
//   touchStartX = event.touches[0].clientX; // Record the starting X position of the touch
// });

// canvas.addEventListener('touchmove', (event) => {
//   touchEndX = event.touches[0].clientX; // Update the ending X position as the user moves their finger
// });

// canvas.addEventListener('touchend', () => {
//   const swipeDistance = touchEndX - touchStartX;
//   const swipeThreshold = 5; // Minimum distance (in pixels) to consider it a swipe

//   if (Math.abs(swipeDistance) > swipeThreshold) {
//     if (swipeDistance > 0) {
//       handleChartScroll('left'); // Swipe right (scroll left)
//     } else {
//       handleChartScroll('right'); // Swipe left (scroll right)
//     }
//   }
// });



// Improved Zoom Configuration
const ZOOM_LEVELS = [0.3, 0.5, 0.7, 1, 1.5, 2, 3, 4]; // More granular zoom levels
let currentZoomLevel = 3; // Default level (index in ZOOM_LEVELS)
let isPinching = false;
let lastPinchDistance = 0;
let lastPinchCenter = { x: 0, y: 0 };
let zoomTimeout = null;

// Enhanced Zoom Functions
function zoomChart(direction, centerX = null) {
  if (!window.chart) return;

  const xScale = window.chart.scales.x;
  const currentRange = xScale.max - xScale.min;
  
  // Use provided center or default to chart center
  const center = centerX !== null ? 
    xScale.getValueForPixel(centerX) : 
    xScale.min + currentRange / 2;

  // Determine new zoom level with boundaries
  if (direction === 'in') {
    if (currentZoomLevel > 0) currentZoomLevel--;
  } else {
    if (currentZoomLevel < ZOOM_LEVELS.length - 1) currentZoomLevel++;
  }

   // Special case for initial zoom out
  if (currentZoomLevel === 3 && direction === 'out') {
    // When at default level, first zoom out should work
    newZoomLevel = 4; // Next level out
  }

  const zoomFactor = ZOOM_LEVELS[currentZoomLevel];
  const newRange = (30 * 1000) / zoomFactor; // Base range is 30 seconds

  // Calculate new min/max centered around the pinch center
  const newMin = center - newRange / 2;
  const newMax = center + newRange / 2;

  // Smooth zoom animation
  animateZoom(newMin, newMax);

  hasUserScrolled = true;
  updateZoomButtons();
  document.getElementById('resetScroll').style.display = 'inline-block';
}

// Smoother zoom animation
function animateZoom(targetMin, targetMax) {
  if (!window.chart) return;

  const xScale = window.chart.scales.x;
  const startMin = xScale.min;
  const startMax = xScale.max;
  
  const startTime = performance.now();
  const duration = 300; // Faster animation for mobile

  // Cancel any ongoing animation
  cancelAnimationFrame(zoomTimeout);

  const animate = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeOutQuad(progress);
    
    window.chart.options.scales.x.min = startMin + (targetMin - startMin) * easeProgress;
    window.chart.options.scales.x.max = startMax + (targetMax - startMax) * easeProgress;
    window.chart.update('none');
    
    if (progress < 1) {
      zoomTimeout = requestAnimationFrame(animate);
    }
  };

  zoomTimeout = requestAnimationFrame(animate);
}

function handlePriceUpdate(coin, price, timestamp) {
  // Limit data points
  if (coinData[coin].length > MAX_DATA_POINTS) {
    coinData[coin] = coinData[coin].slice(coinData[coin].length - MAX_DATA_POINTS);
  }

  // Add new point
  coinData[coin].push({ x: timestamp, y: price });

  // Update current price display
  if (coin === currentCoin) {
    previousPrice = currentPrice;
    currentPrice = price;
    updatePriceDisplay();
  }
}



// Update zoom buttons state
function updateZoomButtons() {
  if (!window.chart) return;

  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const resetZoomBtn = document.getElementById('resetZoom');

  if (zoomInBtn) zoomInBtn.disabled = currentZoomLevel === 0;
  if (zoomOutBtn) zoomOutBtn.disabled = currentZoomLevel === ZOOM_LEVELS.length - 1;
  if (resetZoomBtn) resetZoomBtn.disabled = currentZoomLevel === 3; // Default level
}

// Enhanced Mobile Pinch Zoom Handlers
function handlePinchStart(e) {
  if (e.touches.length === 2) {
    isPinching = true;
    lastPinchDistance = getPinchDistance(e);
    lastPinchCenter = getPinchCenter(e);
    e.preventDefault(); // Prevent page scroll
  }
}

function handlePinchMove(e) {
  if (!isPinching || e.touches.length !== 2) return;
  
  const currentDistance = getPinchDistance(e);
  const currentCenter = getPinchCenter(e);
  
  // Only process if fingers moved significantly
  if (Math.abs(currentDistance - lastPinchDistance) > 5) {
    const direction = currentDistance > lastPinchDistance ? 'out' : 'in';
    zoomChart(direction, currentCenter.x);
    
    lastPinchDistance = currentDistance;
    lastPinchCenter = currentCenter;
  }
  
  e.preventDefault(); // Prevent page scroll
}

function handlePinchEnd() {
  isPinching = false;
  lastPinchDistance = 0;
}

// Helper functions for pinch zoom
function getPinchDistance(e) {
  const touch1 = e.touches[0];
  const touch2 = e.touches[1];
  return Math.hypot(
    touch2.clientX - touch1.clientX,
    touch2.clientY - touch1.clientY
  );
}

function getPinchCenter(e) {
  const touch1 = e.touches[0];
  const touch2 = e.touches[1];
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
}

// Double-tap zoom handler
let lastTapTime = 0;
// function handleDoubleTap(e) {
//   const currentTime = new Date().getTime();
//   const tapLength = currentTime - lastTapTime;
  
//   if (tapLength < 300 && tapLength > 0) {
//     // Double tap detected - zoom in centered at tap position
//     const rect = canvas.getBoundingClientRect();
//     const tapX = e.clientX - rect.left;
//     zoomChart('in', tapX);
//     e.preventDefault();
//   }
  
//   lastTapTime = currentTime;
// }

// Add event listeners for mobile zoom
// 

canvas.addEventListener('touchmove', handlePinchMove, { passive: false });
canvas.addEventListener('touchend', handlePinchEnd, { passive: true });

// Add buttons for zoom control (add these to your HTML)
// document.getElementById('zoomIn')?.addEventListener('click', () => zoomChart('in'));
// document.getElementById('zoomOut')?.addEventListener('click', () => zoomChart('out'));
document.getElementById('resetZoom')?.addEventListener('click', resetZoom);

// Optimized resetZoom function
function resetZoom() {
  currentZoomLevel = DEFAULT_ZOOM_LEVEL;
  const lastPoint = coinData[currentCoin][coinData[currentCoin].length - 1];
  if (!lastPoint) return;

  const viewDuration = 20 * 1000;
  animateZoom(lastPoint.x - viewDuration, lastPoint.x + 5000);
  hasUserScrolled = false;
}

// Improved Easing function for smooth animation
function easeOutQuad(t) {
  return t * (2 - t);
}

// function animateZoom(targetMin, targetMax) {
// const startTime = performance.now();
// const duration = 100;
// const xScale = window.chart.scales.x;
// const startMin = xScale.min;
// const startMax = xScale.max;

// const animate = (timestamp) => {
//   const elapsed = timestamp - startTime;
//   const progress = Math.min(elapsed / duration, 1);
//   const easeProgress = easeOutQuad(progress);
  
//   window.chart.options.scales.x.min = startMin + (targetMin - startMin) * easeProgress;
//   window.chart.options.scales.x.max = startMax + (targetMax - startMax) * easeProgress;
//   window.chart.update('none');
  
//   if (progress < 1) {
//     requestAnimationFrame(animate);
//   }
// };

// requestAnimationFrame(animate);
// }

// function updateZoomButtons(chart) {
//   const xScale = chart.scales.x;
//   const currentRange = xScale.max - xScale.min;

//   document.getElementById('zoomIn').disabled = currentRange <= 5 * 1000; // 5 seconds
//   document.getElementById('zoomOut').disabled = currentRange >= 120 * 1000; // 2 minutes
//   document.getElementById('resetZoom').disabled = currentZoomLevel === 2; // Default level
// }

// Add event listeners
// document.getElementById('zoomIn').addEventListener('click', () => zoomChart('in'));
// document.getElementById('zoomOut').addEventListener('click', () => zoomChart('out'));
// document.getElementById('resetZoom').addEventListener('click', resetZoom);

// Mobile pinch zoom handler
let initialDistance = null;

canvas.addEventListener('touchstart', (e) => {
if (e.touches.length === 2) {
  initialDistance = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
  );
}
});

canvas.addEventListener('touchmove', (e) => {
if (e.touches.length === 2 && initialDistance !== null) {
  e.preventDefault();
  const currentDistance = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
  );
  
  if (Math.abs(currentDistance - initialDistance) > 10) {
    const direction = currentDistance > initialDistance ? 'out' : 'in';
    zoomChart(direction);
    initialDistance = currentDistance;
  }
}
});

canvas.addEventListener('touchend', () => {
initialDistance = null;
});

document.addEventListener('click', function(event) {
if (event.target.id === 'resetScroll') {
  resetChartScroll();
}
});

function resetChartScroll() {
  if (!window.chart) return;

  const xScale = window.chart.scales.x;
  const startMin = xScale.min;
  const startMax = xScale.max;
  
  // Get the last data point to determine where to scroll to
  const lastPoint = coinData[currentCoin][coinData[currentCoin].length - 1];
  if (!lastPoint) return;

  // Define the target viewport (e.g., show last 20 seconds with 6s lookahead)
  const viewDuration = 20 * 1000; // 20 seconds of history
  const lookAhead = 6 * 1000;    // 6 seconds of future
  const targetMin = lastPoint.x - (viewDuration - lookAhead);
  const targetMax = lastPoint.x + lookAhead;

  // Animation settings
  const duration = 1000; // 1 second animation
  const startTime = performance.now();

  // Easing function (easeOutQuad for smooth deceleration)
  const easeOutQuad = t => t * (2 - t);

  const animateScroll = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuad(progress);

    // Interpolate between start and target positions
    window.chart.options.scales.x.min = startMin + (targetMin - startMin) * easedProgress;
    window.chart.options.scales.x.max = startMax + (targetMax - startMax) * easedProgress;
    
    window.chart.update('none');

    // Continue animation until complete
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    } else {
      hasUserScrolled = false;
      document.getElementById('resetScroll').style.display = 'none';
    }
  };

  requestAnimationFrame(animateScroll);
}

// function handleChartScroll(direction) {
//   if (!window.chart) return;

//   const xScale = window.chart.scales.x;
//   const currentRange = xScale.max - xScale.min;

//   // Reduce scroll amount for smoother movement
//   const scrollAmount = currentRange * 0.05; // Changed from 0.6 to 0.3 for smoother scroll

//   // Use requestAnimationFrame for smooth animation
//   const startTime = performance.now();
//   const duration = 300; // Animation duration in ms

//   const animateScroll = (timestamp) => {
//     const elapsed = timestamp - startTime;
//     const progress = Math.min(elapsed / duration, 1);
//     const easeProgress = easeOutQuad(progress); // Apply easing function
  
//     const currentMin = xScale.min;
//     const currentMax = xScale.max;
  
//     const newMin = direction === 'left'
//       ? currentMin - (scrollAmount * easeProgress)
//       : currentMin + (scrollAmount * easeProgress);
  
//     const newMax = direction === 'left'
//       ? currentMax - (scrollAmount * easeProgress)
//       : currentMax + (scrollAmount * easeProgress);
  
//     window.chart.options.scales.x.min = newMin;
//     window.chart.options.scales.x.max = newMax;
//     window.chart.update('none');
  
//     if (progress < 1) {
//       requestAnimationFrame(animateScroll);
//     }
//   };

//   requestAnimationFrame(animateScroll);

//   hasUserScrolled = true;
//   document.getElementById('resetScroll').style.display = 'inline-block';
// }

// Easing function for smooth animation
function easeOutQuad(t) {
return t * (2 - t);
}

// Add scroll buttons to DOM (add these to your HTML)
// document.getElementById('scrollLeft').addEventListener('click', () => handleChartScroll('left'));
// document.getElementById('scrollRight').addEventListener('click', () => handleChartScroll('right'));


// Add these constants at the top of your script
const Y_AXIS_BUFFER_PERCENT = 0.15; // 15% buffer above/below price
const MIN_Y_AXIS_RANGE_PERCENT = 0.3; // Minimum 30% of current price
const PRICE_MOVEMENT_THRESHOLD = 0.05; // 5% movement before adjusting range

// Track current y-axis range
let currentYRange = {
  min: 0,
  max: 0,
  lastPrice: 0
};


function animateYRange(newMin, newMax) {
  if (!window.chart) return;
  
  const yScale = window.chart.scales.y;
  const startMin = yScale.min;
  const startMax = yScale.max;
  
  const startTime = performance.now();
  const duration = 500; // Animation duration in ms

  const animate = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeOutQuad(progress);
    
    window.chart.options.scales.y.min = startMin + (newMin - startMin) * easeProgress;
    window.chart.options.scales.y.max = startMax + (newMax - startMax) * easeProgress;
    window.chart.update('none');
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

function getStableYRange() {
  // If we don't have price data yet, return default range
  if (!currentPrice || currentPrice === 0) {
    return {
      min: coinConfigs[currentCoin].basePrice * 0.7,
      max: coinConfigs[currentCoin].basePrice * 1.3
    };
  }

  // Calculate percentage change from last adjustment
  const priceChangePercent = Math.abs((currentPrice - currentYRange.lastPrice) / currentYRange.lastPrice);
  
  // If price is within current range and hasn't moved significantly, keep current range
  if (currentPrice > currentYRange.min && 
      currentPrice < currentYRange.max && 
      priceChangePercent < PRICE_MOVEMENT_THRESHOLD) {
    
        return currentYRange;
  }

  if (currentPrice < currentYRange.min * 0.5 || currentPrice > currentYRange.max * 1.5) {
    const bigRangeSize = currentPrice * 0.5; // 50% range for big moves
    newMin = currentPrice - bigRangeSize;
    newMax = currentPrice + bigRangeSize;
  }


  // Calculate new range centered around current price
  const rangeSize = currentPrice * MIN_Y_AXIS_RANGE_PERCENT;
  const buffer = rangeSize * Y_AXIS_BUFFER_PERCENT;
  
  const newMin = currentPrice - (rangeSize / 2) - buffer;
  const newMax = currentPrice + (rangeSize / 2) + buffer;

  // Update tracked range
  currentYRange = {
    min: newMin,
    max: newMax,
    lastPrice: currentPrice
  };

  animateYRange(newMin, newMax);

  return currentYRange;
}


// Update chart function
function updateChart(autoScroll = true) {
  if (!window.chart) return;

  const xScale = window.chart.scales.x;
  const currentMin = xScale.min;
  const currentMax = xScale.max;

  // Update dataset properties
  window.chart.data.datasets[0].data = coinData[currentCoin];
  window.chart.data.datasets[0].borderColor = coinConfigs[currentCoin].color;
  
  if (coinData[currentCoin].length > 0) {
    const lastPoint = coinData[currentCoin][coinData[currentCoin].length - 1];
    window.chart.data.datasets[1].data = [lastPoint];
    window.chart.data.datasets[1].borderColor = coinConfigs[currentCoin].color;
    window.chart.data.datasets[1].backgroundColor = coinConfigs[currentCoin].color;

    // Auto-reset if user scrolls close to the current point
    const distanceToEnd = lastPoint.x - currentMax;
    if (distanceToEnd < 5000 && distanceToEnd > -1000) { // Within 5 seconds of current point
      hasUserScrolled = false;
      document.getElementById('resetScroll').style.display = 'none';
    }
  }

  if (autoScroll && !hasUserScrolled) {
    const lastPoint = coinData[currentCoin][coinData[currentCoin].length - 1];
    if (lastPoint) {
      const viewDuration = 20 * 1000; // 20 seconds of historical data
      const lookAhead = 0.1 * 60 * 1000; // 6 seconds of look ahead
      window.chart.options.scales.x.min = lastPoint.x - (viewDuration - lookAhead);
      window.chart.options.scales.x.max = lastPoint.x + lookAhead;
    }
  } else {
    window.chart.options.scales.x.min = currentMin;
    window.chart.options.scales.x.max = currentMax;
  }

  window.chart.update('none');
}
// Update price info display
function updatePriceInfo() {
const priceChange = (currentPrice - previousPrice).toFixed(2);

const currentPriceEl = document.getElementById('currentPriceDisplay');
const priceChangeEl = document.getElementById('priceChangeDisplay');
const currentTimeEl = document.getElementById('currentTimeDisplay');

if (currentPriceEl) {
  currentPriceEl.textContent = currentPrice.toFixed(4);
}

if (priceChangeEl) {
  priceChangeEl.textContent = `${priceChange}`;
  priceChangeEl.style.color = priceChange > 0 ? '#10b981' :
  priceChangeEl.style.color = priceChange < 0 ? '#ef4444' : '#6b7280';
}

if (currentTimeEl) {
  currentTimeEl.textContent = new Date().toLocaleTimeString();
}
}


// Handle coin selection change
document.getElementById('coinSelect')?.addEventListener('change', function() {
currentCoin = this.value;
if (window.chart) {
  updateChart();
}
});

// Function to get current game session based on game type
function getCurrentGameSession() {
const gameType = getGameType(); // Your existing function
switch(gameType) {
  case '1': return '1min';
  case '3': return '3min';
  case '5': return '5min';
  case '10': return '10min';
  default: return '1min';
}
}

// Expose functions to window
window.getCurrentPrice = () => currentPrice;
// window.setEndPoint = setEndPoint; 

// Betting Popup Handling
$(document).ready(function() {
// Handle bet button clicks
$(document).on('click', '.bet_button', function() {
    const betType = $(this).hasClass('Betting__C-foot-b') ? 'Buy' : 'Sell';
    $('#betting_value').text(betType);
    // Reset popup values
    $('#van-field-1-input').val('1');
    $('.Betting__Popup-body-money-btn').css({
        'background-color': '',
        'color': ''
    }).filter('[data-money="1"]').css({
        'background-color': '#3f9368',
        'color': 'white'
    });
    
    $('.Betting__Popup-body-money-main').attr('data-current-money', 1);
    
    $('.Betting__Popup-body-x-btn').css({
        'background-color': '',
        'color': ''
    }).filter('[data-x="1"]').css({
        'background-color': '#3f9368',
        'color': 'white'
    });
    
    $('.Betting__Popup-body-line-list').attr('data-current-multiplier', 1);
    
    // Show overlay and popup
    $('.van-overlay').fadeIn(200);
    $('.popup-join').fadeIn(200).css('transform', 'translateY(0)');
    
    // Initialize popup values
    totalMoney();
});

// Handle popup close
$('#cancel_bet_btn, .van-overlay').click(function() {
    $('.van-overlay').fadeOut(400);
    $('.popup-join').fadeOut(200).css('transform', 'translateY(100%)');
});

// Prevent popup close when clicking inside
$('.popup-join').click(function(e) {
    e.stopPropagation();
});

// Handle money selection
$('.Betting__Popup-body-money-btn').click(function() {
    $('.Betting__Popup-body-money-btn').css({
        'background-color': '',
        'color': ''
    });
    $(this).css({
        'background-color': '#3f9368',
        'color': 'white'
    });
    $('.Betting__Popup-body-money-main').attr('data-current-money', $(this).data('money'));
    totalMoney();
});

// Handle quantity changes
$('.Betting__Popup-minus-btn').click(function() {
    const input = $('#van-field-1-input');
    let value = parseInt(input.val()) || 0;
    if (value > 1) input.val(value - 1);
    totalMoney();
});

$('.Betting__Popup-plus-btn').click(function() {
    const input = $('#van-field-1-input');
    let value = parseInt(input.val()) || 0;
    input.val(value + 1);
    totalMoney();
});

// Handle quantity input validation
$('#van-field-1-input').on('input', function() {
    let value = $(this).val();
    if (!/^\d*$/.test(value)) {
        $(this).val(value.replace(/[^\d]/g, ''));
    }
    if ($(this).val() === '') {
        $(this).val('1');
    }
    totalMoney();
});

// Handle multiplier selection
$('.Betting__Popup-body-x-btn').click(function() {
    $('.Betting__Popup-body-x-btn').css({
        'background-color': '',
        'color': ''
    });
    $(this).css({
        'background-color': '#3f9368',
        'color': 'white'
    });
    $('.Betting__Popup-body-line-list').attr('data-current-multiplier', $(this).data('x'));
    totalMoney();
});

// Calculate total money
function totalMoney() {
    let inputVal = $('#van-field-1-input').val();
    let value = inputVal ? parseInt(inputVal) : 1;
    
    let money = parseInt($('.Betting__Popup-body-money-main').attr('data-current-money') || 1);
    let multiplier = parseInt($('.Betting__Popup-body-line-list').attr('data-current-multiplier') || 1);
    
    let total = value * money * multiplier;
    $('#popup_total_bet_money').text(total.toFixed(2));
}

// Initialize default values
$('#van-field-1-input').val('1');
$('.Betting__Popup-body-line-list').attr('data-current-multiplier', 1);
$('.Betting__Popup-body-money-main').attr('data-current-money', 1);
totalMoney();
}); 