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

$("#audio_button").click(function (e) {
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

function countDownTimer({ GAME_TYPE_ID }) {
  const getTimeMSS = (countDownDate) => {
    var now = new Date().getTime();
    var distance = countDownDate - now;
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var minute = Math.ceil(minutes % parseInt(GAME_TYPE_ID));
    var seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
    var seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);

    return { minute, seconds1, seconds2 };
  };

  var countDownDate = new Date("2030-07-16T23:59:59.9999999+03:00").getTime();

  countDownInterval1 = setInterval(function () {
    const { minute, seconds1, seconds2, totalSeconds } = getTimeMSS(countDownDate);

    // Update timer display
    if (GAME_TYPE_ID !== "1") {
      $(".TimeLeft__C-time div:eq(1)").text(minute);
    } else {
      $(".TimeLeft__C-time div:eq(1)").text("0");
    }
    $(".TimeLeft__C-time div:eq(3)").text(seconds1);
    $(".TimeLeft__C-time div:eq(4)").text(seconds2);
  //  console.log(seconds1,":",seconds2)
    // Disable betting buttons when 10 seconds or less remain
    if (minute ==0 &&seconds1==0 && seconds2<=9) {
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



  countDownInterval3 = setInterval(function () {
    const { minute, seconds1, seconds2 } = getTimeMSS(countDownDate);

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

$(document).ready(function () {
  countDownTimer({ GAME_TYPE_ID });
});

async function fetchAndDisplayPeriod() {
  try {
    const gameType = getGameType(); // Get current game type (1, 3, 5, or 10)
    const response = await fetch(`/api/webapi/getPeriod/${gameType}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch period');
    }

    const data = await response.json();  // ✅ Await the parsed JSON data
    console.log("Fetched period:", data);

    const period = data.period;          // ✅ Access period from the JSON object
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
  
  fetchAndDisplayPeriod();
  // Reinitialize game logic
  initGameLogics({
    GAME_TYPE_ID,
    GAME_NAME,
    // My_Bets_Pages,
    Game_History_Pages,
  });
  
  // Start new timer
  countDownTimer({ GAME_TYPE_ID });
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
    $("#balance_amount").text(`₹ ${formatIndianNumber(data.data.money_user)} `);
    $("#bonus_balance_amount").text(
      `₹ ${formatIndianNumber(data.data.bonus_money)} `,
    );
  });

$(".reload_money").click(function (e) {
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
// const GAME_TYPE_ID = "Win"; // Set your game type ID as needed

function showPopupModal() {
  $("#popup_modal").css("display", "flex");

  let timeLeft = 3;
  $("#popup_timer_note").text(`Auto close in ${timeLeft} seconds`);

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      $("#popup_timer_note").text(`Auto close in ${timeLeft} seconds`);
    } else {
      clearInterval(countdownInterval);
    }
  }, 1000);

  if (autoCloseTimer) clearTimeout(autoCloseTimer);
  autoCloseTimer = setTimeout(() => {
    $("#popup_modal").hide();
  }, 3000);
}

function displayResultHandler({ status, amount, period, result }) {
  if (typeof status === 'undefined' || typeof period === 'undefined') {
    console.error("Missing required parameters in displayResultHandler");
    return;
  }

  let colorDisplay = "", bsDisplay = "", resultDisplay = "";

  if (result === "d") {
    colorDisplay = "Blue";
    bsDisplay = "Draw";
    resultDisplay = "Draw";
  } else if (result === 'l') {
    colorDisplay = "Green";
    bsDisplay = "Up";
    resultDisplay = "Up";
  } else if (result === 'n') {
    colorDisplay = "Red";
    bsDisplay = "Down";
    resultDisplay = "Down";
  }

  $("#lottery_results_box")
  .removeClass((index, className) =>
    (className.match(/(^|\s)type\w+/g) || []).join(" ")
  )
  .addClass(`type${resultDisplay}`);

  $("#popup_bs_display").text(bsDisplay);
  $("#popup_game_details").text(`Period: ${GAME_TYPE_ID} minute game ${period}`);

  const normalizedStatus = String(status).toLowerCase();
  $("#popup_background").removeClass("win-bg loss-bg draw-bg");

  if (normalizedStatus.includes('win')) {
    $("#popup_win_rupees_display").text(`₹${parseFloat(amount).toFixed(2)}`);
    $("#popup_greeting_display").text("🎉 Congratulations");
    $("#popup_background").addClass("win-bg");
    $("#popup_win_rupees_display, #popup_win_symbol").show();
    $("#popup_loss_symbol").hide();
  } else if (normalizedStatus.includes('loss')) {
    $("#popup_greeting_display").text("😞 Sorry");
    $("#popup_background").addClass("loss-bg");
    $("#popup_win_rupees_display").text(`- ₹${parseFloat(amount).toFixed(2)}`);
    $("#popup_win_symbol").hide();
    $("#popup_loss_symbol").show();
  } else if (normalizedStatus.includes('draw')) {
    $("#popup_greeting_display").text("⚖️ Draw");
    $("#popup_background").addClass("draw-bg");
    $("#popup_win_rupees_display").text(`₹${parseFloat(amount).toFixed(2)}`);
    $("#popup_win_rupees_display").show();
    $("#popup_win_symbol").hide();
    $("#popup_loss_symbol").hide();
  }

  showPopupModal();
}

// Manual close
$(document).ready(function () {
  $(".closeBtn").click(function () {
    $("#popup_modal").hide();
    clearTimeout(autoCloseTimer);
    clearInterval(countdownInterval);
  });
});



function showGameHistoryData(list_orders) {
  const containerId = "#game_history_data_container";

  displayLast5Result({
    results: list_orders.slice(0, 5).map((game) => game.amount),
  });

  if (list_orders.length == 0) {
    return $(containerId).html(`
      <div data-v-a9660e98="" class="van-empty">
          <div class="van-empty__image">
              <img src="/images/empty-image-default.png" />
          </div>
          <p class="van-empty__description">No data</p>
      </div>
   `);
  }

  let html = list_orders
    .map((list_order) => {
      let colorHtml = "";
      let colorClass = "";
      if (list_order.amount == 0) {
        colorClass = "mixedColor0";
        colorHtml = `
            <div data-v-c52f94a7="" class="GameRecord__C-origin-I red"></div>
            <div data-v-c52f94a7="" class="GameRecord__C-origin-I violet"></div>
            `;
      } else if (list_order.amount == 5) {
        colorClass = "mixedColor5";
        colorHtml = `
            <div data-v-c52f94a7="" class="GameRecord__C-origin-I green"></div>
            <div data-v-c52f94a7="" class="GameRecord__C-origin-I violet"></div>
            `;
      } else if (list_order.amount % 2 == 0) {
        colorClass = "defaultColor";
        colorHtml = `
            <div data-v-c52f94a7="" class="GameRecord__C-origin-I red"></div>
            `;
      } else {
        colorClass = "greenColor";
        colorHtml = `
               <div data-v-c52f94a7="" class="GameRecord__C-origin-I green"></div>
            `;
      }
  console.log(list_order);
      
  
      return `
         <div data-v-c52f94a7="" class="van-row"  style="background-color: #0d063db9;">
            <div data-v-c52f94a7="" class="van-col van-col--12">${list_order.period}</div>
           
             <div data-v-c52f94a7="" class="van-col van-col--12"><span data-v-c52f94a7="">${list_order.bet === 'l' ? "Up" : list_order.bet === 'n' ? "Down" :"Draw"}</span></div>
        
         </div>`;
    })
    .join(" ");

  $(containerId).html(html);
}

function showTrendData(list_orders) {
  const containerId = "#chart_container";

  if (list_orders.length == 0) {
    return $(containerId).html(`
    <div data-v-a9660e98="" class="van-empty">
      <div class="van-empty__image">
        <img src="/images/empty-image-default.png" />
      </div>
      <p class="van-empty__description">No data</p>
    </div>`);
  }

  const html = list_orders
    .map((order, index) => {
      const isBig = parseInt(order.amount) >= 5;
      const NumberList = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

      const isLastOrder = index === list_orders.length - 1;

      return `
            <div data-v-54016b1c="" issuenumber="${order.period}" number="${order.amount}" colour="${isBig ? "red" : "green"}" rowid="${index}">
               <div data-v-54016b1c="" class="van-row">
                  <div data-v-54016b1c="" class="van-col van-col--8">
                     <div data-v-54016b1c="" class="Trend__C-body2-IssueNumber">${order.period}</div>
                  </div>
                  <div data-v-54016b1c="" class="van-col van-col--16">
                     <div data-v-54016b1c="" class="Trend__C-body2-Num">
                        <canvas data-v-54016b1c="" canvas="" id="myCanvas${index}" class="line-canvas"></canvas>
                        ${NumberList.map((number, index) => {
                          return `<div data-v-54016b1c="" class="Trend__C-body2-Num-item ${order.amount == number ? `action${number}` : ""}">${number}</div>`;
                        }).join(" ")}
                        <div data-v-54016b1c="" class="Trend__C-body2-Num-BS ${isBig ? "isB" : ""}">${isBig ? "B" : "S"}</div>
                     </div>
                  </div>
                ${
                  isLastOrder
                    ? ""
                    : `
                  <script>
                     drawChartLineInCanvas(${order.amount},${list_orders[index + 1].amount}, "myCanvas${index}")
                  </script>`
                }
               </div>
            </div>`;
    })
    .join(" ");

  $(containerId).empty();
  $(containerId).html(html);
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
  const containerId = "#my_bets_data_container";
  selectActiveClock(parseInt(GAME_TYPE_ID));
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
        <strong>Period:</strong>
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
            : list_order.status === 3
            ? "Draw"
            : "Failed"
        }
      </span>
    </div>

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
        <strong>Quantity:</strong>
        <span>${parseFloat(list_order.amount).toFixed(2)}</span>
      </div>
    
      <div style="margin-bottom: 10px;">
        <strong>Amount after tax:</strong>
        <span style="color: #d9534f;">₹${parseFloat(list_order.money).toFixed(2)}</span>
      </div>
    
      <div style="margin-bottom: 10px;">
        <strong>Tax:</strong>
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
        if (isNaN(value) || value < 1) {
            $(this).val(1);
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
        console.log(betAmount);
        const totalAmount = betAmount * currentMultiplier;
        
        if (!join || !betAmount || !currentMultiplier) {
            alertMessage("Please enter valid bet details");
            return;
        }
        
        let currentStartPoint = JSON.parse(localStorage.getItem("startPoint"));
        if (GAME_TYPE_ID === '1') {
            currentStartPoint = JSON.parse(localStorage.getItem("startPoint"));
        } else if (GAME_TYPE_ID === '3') {
            currentStartPoint = JSON.parse(localStorage.getItem("3minStartPoint"));
        } else if (GAME_TYPE_ID === '5') {
            currentStartPoint = JSON.parse(localStorage.getItem("5minStartPoint"));
        } else if (GAME_TYPE_ID === '10') {
            currentStartPoint = JSON.parse(localStorage.getItem("10minStartPoint"));
        }
        
        if (!currentStartPoint) {
            alertMessage("Start point not available yet.");
            return;
        }
        
        const startPrice = currentStartPoint.price;
        const coinType = getCoinType();
        
        // Disable buttons during request
        $('.Betting__C-foot-b, .Betting__C-foot-s').addClass('block-click');
        console.log(GAME_TYPE_ID);
        $.ajax({
            type: "POST",
            url: "/api/webapi/action/join",
            data: {
                typeid: GAME_TYPE_ID,
                join: join,
                x: currentMultiplier,
                money: betAmount,
                startPrice,
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

        showGameHistoryData(list_orders);
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

var socket = io();
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
    console.warn('Current price not available');
    return null;
  }

  const result = {
    coin: currentCoin,
    price: parseFloat(currentPrice.toFixed(2)),
    timestamp: Date.now()
  };

  console.log("Current price returned", result.coin, result.price);
  return result;
}


let currentStartPoint = null;

socket.on("getStartPoint", () => {
  const point = getCurrentPricePoint();
  if (point) {
    localStorage.setItem("startPoint", JSON.stringify(point)); 
    console.log("Start point set.", point);
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
   console.log(GAME_NAME);
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
    } else {
      // displayResultHandler({
      //    status: STATUS_MAP.NONE,
      //    period: lastGame?.period,
      //    result: lastGame?.amount,
      // });
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
    // console.log(sessionData);
    if (sessionData.active) {
      sessionLines[session] = {
        startTime: Date.now() - (GAME_SESSIONS[session].duration - sessionData.timeLeft),
        endTime: Date.now() + sessionData.timeLeft,
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

// Handle price updates from server
socket.on('priceUpdate', (update) => {
  // Update coin data
  Object.keys(update.prices).forEach(coin => {
    coinData[coin].push({
      x: update.timestamp,
      y: update.prices[coin]
    });
    // console.log(update);
    // Remove data older than 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    coinData[coin] = coinData[coin].filter(point => point.x >= oneDayAgo);
  });
  
  // Update session lines from server
  Object.keys(update.sessions).forEach(session => {
    const sessionData = update.sessions[session];
    // console.log(sessionData);
    if (sessionData.active) {
      sessionLines[session] = {
        startTime: update.timestamp - (GAME_SESSIONS[session].duration - sessionData.timeLeft),
        endTime: update.timestamp + sessionData.timeLeft,
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
});

// Handle end point setting confirmation
socket.on('endPointSet', ({ session, coin, price, startTime, duration }) => {
  sessionLines[session] = {
    startTime,
    endTime: startTime + duration,
    price,
    duration: session
  };
  
  console.log(`${session} end point set at ${price} for ${coin}`);
  
  // Disable buttons when end point is set (last minute of session)
  const getTimeMSS = (countDownDate) => {
    var now = new Date().getTime();
    var distance = countDownDate - now;
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var minute = Math.ceil(minutes % parseInt(GAME_TYPE_ID));
    var seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
    var seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);
    var totalSeconds = Math.floor(distance / 1000);

    return { minute, seconds1, seconds2, totalSeconds };
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

let hasUserScrolled = false; // Tracks if the user has scrolled the chart
// Initialize chart with session line plugin
function initializeChart() {
  const canvas = document.getElementsByClassName('priceChart')[0];
  const ctx = canvas.getContext('2d');
  
  // Session line plugin


  function getSessionStartPrice(coin, sessionStartTime) {
    try {
        if (!coinData || !coinData[coin] || !Array.isArray(coinData[coin])) {
            console.warn('Invalid coin data structure');
            return null;
        }
        
        const dataPoints = coinData[coin];
        if (dataPoints.length === 0) return null;
        
        // Find the data point closest to the session start time
        let closestPoint = null;
        let minDiff = Infinity;
        
        for (const point of dataPoints) {
            // Skip invalid points
            if (!point || point.x === undefined || point.y === undefined) continue;
            
            const diff = Math.abs(point.x - sessionStartTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestPoint = point;
            }
        }
        
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
      const chartArea = chart.chartArea;
      
      // Get current coin from select element
      const coinSelect = document.getElementById('coinSelect');
      const currentCoin = coinSelect ? coinSelect.value : 'BTC';
      
      // Safety check
      if (!coinData || !coinData[currentCoin]) {
        console.warn('Coin data not available for', currentCoin);
        return;
      }
      
      // Get the current game type duration in milliseconds
      const gameType = getGameType();
      let sessionDuration;
      switch(gameType) {
        case '1': sessionDuration = 60 * 1000; break;
        case '3': sessionDuration = 180 * 1000; break;
        case '5': sessionDuration = 300 * 1000; break;
        case '10': sessionDuration = 600 * 1000; break;
        default: sessionDuration = 60 * 1000;
      }
      
      // Get the current time and calculate session start time
      const now = Date.now();
      const sessionStartTime = now - (now % sessionDuration);
      
      // Only draw if the session start is in the visible range
      if (sessionStartTime < xAxis.min || sessionStartTime > xAxis.max) {
        return;
      }
      
      // Get the start price for this session with safety checks
      const startPrice = getSessionStartPrice(currentCoin, sessionStartTime);
      if (startPrice === null || startPrice === undefined) {
        console.warn('Could not determine session start price');
        return;
      }
      
      // Draw the session start point
      ctx.save();
      
      const x = xAxis.getPixelForValue(sessionStartTime);
      const y = yAxis.getPixelForValue(startPrice);
      
      // Draw a yellow circle at the session start point
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'yellow';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Add label near the point
      ctx.fillStyle = 'yellow';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Session Start', x + 10, y - 5);
      
      ctx.restore();
    } catch (error) {
      console.error('Error in sessionLinePlugin:', error);
    }
  }
};

  function countDownTimer({ GAME_TYPE_ID }) {
    const getTimeMSS = (countDownDate) => {
      var now = new Date().getTime();
      var distance = countDownDate - now;
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var minute = Math.ceil(minutes % parseInt(GAME_TYPE_ID));
      var seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
      var seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);
      var totalSeconds = Math.floor(distance / 1000);
  
      return { minute, seconds1, seconds2, totalSeconds };
    };
  
    var countDownDate = new Date("2030-07-16T23:59:59.9999999+03:00").getTime();
  
    countDownInterval1 = setInterval(function () {
      const { minute, seconds1, seconds2, totalSeconds } = getTimeMSS(countDownDate);
      
      // Update timer display
      if (GAME_TYPE_ID !== "1") {
        $(".TimeLeft__C-time div:eq(1)").text(minute);
      } else {
        $(".TimeLeft__C-time div:eq(1)").text("0");
      }
      $(".TimeLeft__C-time div:eq(3)").text(seconds1);
      $(".TimeLeft__C-time div:eq(4)").text(seconds2);
  
      // Disable betting buttons in last 10 seconds
      if (totalSeconds <= 10) {
        $(".bet_button, #join_bet_btn").css({
          "pointer-events": "none",
          "cursor": "not-allowed",
          "opacity": "0.6"
        });
      } else {
        // Re-enable buttons when not in last 10 seconds
        $(".bet_button, #join_bet_btn").css({
          "pointer-events": "auto",
          "cursor": "pointer",
          "opacity": "1"
        });
      }
    }, 1000); // Update every second for smoother button control
  
    countDownInterval3 = setInterval(function () {
      const { minute, seconds1, seconds2 } = getTimeMSS(countDownDate);
  
      if (minute == 0 && seconds1 == 0 && seconds2 <= 5) {
        $(".van-overlay").fadeOut();
        $(".popup-join").fadeOut();
        $(".Betting__C-mark").css("display", "none");
      } else {
        $(".Betting__C-mark").css("display", "none");
      }
    }, 1000); // Adjusted to 1 second for consistency
  }
  
  const trackingLinePlugin = {
    id: 'trackingLine',
    afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        const yAxis = chart.scales.y;
        
        if (!dataset.data.length) return;

        const lastIndex = dataset.data.length - 1;
        const lastPoint = meta.data[lastIndex];
        if (!lastPoint) return;

        const currentPrice = dataset.data[lastIndex].y;
        const priceText = currentPrice.toFixed(2);
        const x = lastPoint.x;
        const y = lastPoint.y;
        const chartArea = chart.chartArea;

        ctx.save();

        // Draw tracking lines (added back)
        ctx.strokeStyle = coinConfigs[currentCoin].color;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.globalAlpha = 0.3;
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();

        // Draw capsule-shaped indicator (unchanged)
        const textWidth = ctx.measureText(priceText).width;
        const capsuleWidth = textWidth + 16;
        const capsuleHeight = 24;
        const radius = capsuleHeight / 2;
        const capsuleX = chart.chartArea.right + 50;
        const capsuleY = y;
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = coinConfigs[currentCoin].color;
        ctx.beginPath();
        ctx.arc(capsuleX - capsuleWidth/2 + radius, capsuleY, radius, Math.PI/2, Math.PI*3/2);
        ctx.arc(capsuleX + capsuleWidth/2 - radius, capsuleY, radius, Math.PI*3/2, Math.PI/2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(priceText, capsuleX, capsuleY);

        // Connector line (modified to connect to horizontal line)
        ctx.strokeStyle = coinConfigs[currentCoin].color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartArea.right, y);
        ctx.lineTo(capsuleX - capsuleWidth/2, y);
        ctx.stroke();

        ctx.restore();
    }
};


function getDynamicYRange() {
  const visibleData = coinData[currentCoin].filter(point => {
    const xAxis = window.chart?.scales.x;
    if (!xAxis) return false;
    return point.x >= xAxis.min && point.x <= xAxis.max;
  });

  if (visibleData.length === 0) {
    return {
      min: currentPrice - currentPrice * 1.8, // Default 1% range
      max: currentPrice + currentPrice * 1.5
    };
  }

  const prices = visibleData.map(point => point.y);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const padding = range * 0.9 || (maxPrice * 0.05); // adjust y-axis range

  return {
    min: minPrice - padding,
    max: maxPrice + padding
  };
}

  
window.chart = new Chart(ctx, {
  type: 'line',
  data: {
    datasets: [{
      label: `${coinConfigs[currentCoin].name} Price`,
      data: coinData[currentCoin],
      borderColor: coinConfigs[currentCoin].color,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 0.5,
      tension: 0,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 6 // For price capsule
      }
    },
    animation: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute', // Display daily intervals
          displayFormats: {
            day: 'D MMM' // Format as "13 Nov", "14 Nov", etc.
          }
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)', // Match the white with slight opacity
          font: {
            size: 12
          }
        },
        grid: {
          display: true, // Show grid lines
          color: 'rgba(255, 255, 255, 0.1)', // Subtle white grid lines
          drawBorder: false
        },
        min: () => Date.now() -   3 * 60 * 1000,
        max: () => Date.now()
      },
      y: {
        beginAtZero: false,
        position: 'right',
        grid: {
          display: true, // Show grid lines
          color: 'rgba(255, 255, 255, 0.1)', // Subtle white grid lines
          drawBorder: false
        },
        
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)', // Match the white with slight opacity
          callback: function(value) {
            return value.toFixed(2);
          },
          padding: 12,
          maxTicksLimit: 8 // Cleaner look
        },
        min: () => getDynamicYRange().min,
        max: () => getDynamicYRange().max
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: null,
          scaleMode: 'x',
          threshold: 10
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1
          },
          mode: 'x',
          overScaleMode: 'x'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  },
  plugins: [sessionLinePlugin, trackingLinePlugin]
});
}

const canvas = document.getElementsByClassName('priceChart')[0];

// Handle click events for scrolling
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left; // X position relative to canvas
  const canvasWidth = rect.width;

  // Determine if the click is on the left or right half of the chart
  const threshold = canvasWidth / 2;
  if (clickX < threshold) {
    handleChartScroll('left'); // Scroll left if clicked on the left side
  } else {
    handleChartScroll('right'); // Scroll right if clicked on the right side
  }
});

// Handle touch events for swiping
let touchStartX = 0;
let touchEndX = 0;

canvas.addEventListener('touchstart', (event) => {
  touchStartX = event.touches[0].clientX; // Record the starting X position of the touch
});

canvas.addEventListener('touchmove', (event) => {
  touchEndX = event.touches[0].clientX; // Update the ending X position as the user moves their finger
});

canvas.addEventListener('touchend', () => {
  const swipeDistance = touchEndX - touchStartX;
  const swipeThreshold = 50; // Minimum distance (in pixels) to consider it a swipe

  if (Math.abs(swipeDistance) > swipeThreshold) {
    if (swipeDistance > 0) {
      handleChartScroll('left'); // Swipe right (scroll left)
    } else {
      handleChartScroll('right'); // Swipe left (scroll right)
    }
  }
});

function handleChartScroll(direction) {
  if (!window.chart) return;

  const xScale = window.chart.scales.x;
  const currentRange = xScale.max - xScale.min;

  const scrollAmount = currentRange * 0.2; // Scroll 20% of current view
  // Move both min and max by the same amount to maintain centered view
  window.chart.options.scales.x.min = direction === 'left'
      ? xScale.min - scrollAmount
      : xScale.min + scrollAmount;

  window.chart.options.scales.x.max = direction === 'left'
      ? xScale.max - scrollAmount
      : xScale.max + scrollAmount;

  hasUserScrolled = true; // Set flag to true when user scrolls

  // Show the reset scroll and zoom buttons
  // document.getElementById('resetScroll').style.display = 'inline-block';
  // document.getElementById('zoomIn').style.display = 'inline-block';
  // document.getElementById('zoomOut').style.display = 'inline-block';

  window.chart.update('none'); // Use 'none' to disable animations
}

// Add scroll buttons to DOM (add these to your HTML)
// document.getElementById('scrollLeft').addEventListener('click', () => handleChartScroll('left'));
// document.getElementById('scrollRight').addEventListener('click', () => handleChartScroll('right'));

// Update chart function
function updateChart(autoScroll = true) {
  if (!window.chart) return;

  // Store the current x-axis range before updating the dataset
  const xScale = window.chart.scales.x;
  const currentMin = xScale.min;
  const currentMax = xScale.max;

  // Update the dataset with new data
  window.chart.data.datasets[0].data = coinData[currentCoin];
  window.chart.data.datasets[0].borderColor = coinConfigs[currentCoin].color;

  // Only center the view if the user hasn't scrolled
  if (autoScroll && !hasUserScrolled) {
    const lastPoint = coinData[currentCoin][coinData[currentCoin].length - 1];
    if (lastPoint) {
      // Calculate view duration (2 minutes total, matching your current range)
      const viewDuration = 2 * 60 * 1000; // 2 minutes in milliseconds

      // Center the view around the latest data point's timestamp
      const latestTime = lastPoint.x; // Use the timestamp of the latest point
      window.chart.options.scales.x.min = latestTime - (viewDuration / 2); // 1 minute before
      window.chart.options.scales.x.max = latestTime + (viewDuration / 2); // 1 minute after
    }
  } else {
    // Preserve the current x-axis range if the user has scrolled
    window.chart.options.scales.x.min = currentMin;
    window.chart.options.scales.x.max = currentMax;
  }

  // Update the chart without animations to avoid jitter
  window.chart.update('none');
}


// Update price info display
function updatePriceInfo() {
  const priceChange = (currentPrice - previousPrice).toFixed(2);

  const currentPriceEl = document.getElementById('currentPriceDisplay');
  const priceChangeEl = document.getElementById('priceChangeDisplay');
  const currentTimeEl = document.getElementById('currentTimeDisplay');

  if (currentPriceEl) {
    currentPriceEl.textContent = currentPrice.toFixed(2);
  }

  if (priceChangeEl) {
    priceChangeEl.textContent = `${priceChange}`;
    priceChangeEl.style.color = priceChange > 0 ? '#10b981' :
                                priceChange < 0 ? '#ef4444' : '#6b7280';
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
