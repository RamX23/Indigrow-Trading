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
    const { minute, seconds1, seconds2 } = getTimeMSS(countDownDate);
    if (GAME_TYPE_ID !== "1") {
      $(".TimeLeft__C-time div:eq(1)").text(minute);
    } else {
      $(".TimeLeft__C-time div:eq(1)").text("0");
    }

    $(".TimeLeft__C-time div:eq(3)").text(seconds1);
    $(".TimeLeft__C-time div:eq(4)").text(seconds2);
  }, 0);

  // sound
  // countDownInterval2 = setInterval(() => {
  //   const { minute, seconds1, seconds2 } = getTimeMSS(countDownDate);
  //   const check_volume = localStorage.getItem("volume");

  //   if (minute == 0 && seconds1 == 0 && seconds2 <= 5) {
  //     if (clicked) {
  //       if (check_volume == "on") {
  //         playAudio1();
  //       }
  //     }
  //   }
  //   if (minute == 0 && seconds1 == 5 && seconds2 == 5) {
  //     if (clicked) {
  //       if (check_volume == "on") {
  //         playAudio2();
  //       }
  //     }
  //   }
  // }, 1000);

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

const selectActiveClockByGameType = (GAME_TYPE_ID) => {
  GAME_TYPE_ID = `${GAME_TYPE_ID}`;
  GAME_NAME = GAME_TYPE_ID === "1" ? "wingo" : `wingo${GAME_TYPE_ID}`;
  window.history.pushState({}, "", `/wingo/?game_type=${GAME_TYPE_ID}`);
  initGameLogics({
    GAME_TYPE_ID,
    GAME_NAME,
    My_Bets_Pages,
    Game_History_Pages,
  });
  clearInterval(countDownInterval1);
  clearInterval(countDownInterval2);
  clearInterval(countDownInterval3);
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

const displayResultHandler = ({ status, amount, period, result }) => {
  let colorDisplay = "";
  let bsDisplay = "";

  if (parseInt(result) % 2 === 0) {
    colorDisplay = "Red";
  } else {
    colorDisplay = "Green";
  }

  if (parseInt(result) === 5) {
    colorDisplay = "Purple Green";
  }

  if (parseInt(result) === 0) {
    colorDisplay = "Purple Red";
  }

  if (parseInt(result) >= 5) {
    bsDisplay = "Buy";
  } else {
    bsDisplay = "Sell";
  }

  $("#lottery_results_box").removeClass();
  $("#lottery_results_box").addClass(`WinningTip__C-body-l2 type${result}`);
  $("#popup_color_display").html(colorDisplay);
  $("#popup_num_display").html(result);
  $("#popup_bs_display").html(bsDisplay);
  $("#popup_game_details").html(`Period: Win ${GAME_TYPE_ID} minute ${period}`);

  if (status === STATUS_MAP.WIN) {
    $("#popup_win_rupees_display").html(`₹${amount}.00`);
    $("#popup_greeting_display").html(`Congratulations`);
    $("#popup_background").removeClass("isL");
    $("#popup_greeting_display").removeClass("isL");
    $("#popup_win_rupees_display").css("display", "block");
    $("#popup_win_symbol").css("display", "block");
    $("#popup_loss_symbol").css("display", "none");
  } else if (status === STATUS_MAP.LOSS) {
    $("#popup_greeting_display").html(`Sorry`);
    $("#popup_background").addClass("isL");
    $("#popup_greeting_display").addClass("isL");
    $("#popup_win_rupees_display").css("display", "none");
    $("#popup_win_symbol").css("display", "none");
    $("#popup_loss_symbol").css("display", "block");
  } else {
    // $(".modal-popup__title").text("Result")
    // $(".modal-popup__amount").text(`No Bets !`)
  }

  $("#popup_modal").css("display", "block");

  // setTimeout(() => {
  //   $(".WinningTip__C").hide();
  // }, 5000);
};

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
           
             <div data-v-c52f94a7="" class="van-col van-col--12"><span data-v-c52f94a7="">${list_order.bet === 'l' ? "Buy" : "Sell"}</span></div>
        
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
  let containerId = `#my_bets_data_container`;

  if (list_orders.length == 0) {
    return $(containerId).html(`
   <div data-v-a9660e98="" class="van-empty" style="background-color: #0d063db9;">
       <div class="van-empty__image">
           <img src="/images/empty-image-default.png" />
       </div>
       <p class="van-empty__description">No Data</p>
   </div>
   `);
  }

  let html = list_orders
    .map((list_order, index) => {
      let join = list_order.bet;
      let selected = "";
      let color = "";
      if (join == "l") {
        color = "l-big";
        selected = "Buy";
      } else if (join == "n") {
        color = "l-small";
        selected = "Sell";
      } else if (join == "t") {
        color = "l-violet";
        selected = "Violet";
      } else if (join == "d") {
        color = "l-red";
        selected = "Red";
      } else if (join == "x") {
        color = "l-green";
        selected = "Green";
      } else if (join == "0") {
        color = "l-0";
        selected = "0";
      } else if (join == "5") {
        color = "l-5";
        selected = "5";
      } else if (Number(join) % 2 == 0) {
        color = "l-red";
        selected = Number(join);
      } else if (Number(join) % 2 != 0) {
        color = "l-green";
        selected = Number(join);
      }

      if ((!isNumber(join) && join == "l") || join == "n") {
        checkJoin = `
                ${selected}
                 `;
      } else {
        checkJoin = `
                 <span data-v-a9660e98="">${isNumber(join) ? join : ""}</span>`;
      }
      //MyGameRecordList__C-item-l-green
      //MyGameRecordList__C-item-l-violet

      return `
      <div data-v-2faec5cb="" class="MyGameRecordList__C-item" index="${index}" onclick="openGameBetDetails(${index})">
            <div data-v-2faec5cb="" class="MyGameRecordList__C-item-l MyGameRecordList__C-item-${color}" >${checkJoin}</div>
            <div data-v-2faec5cb="" class="MyGameRecordList__C-item-m">
               <div data-v-2faec5cb="" class="MyGameRecordList__C-item-m-top">${list_order.stage}</div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-item-m-bottom">${timerJoin(list_order.time)}</div>
            </div>

              ${
                list_order.status === 0
                  ? ""
                  : `<div data-v-2faec5cb="" class="MyGameRecordList__C-item-r ${list_order.status == 1 ? "success" : ""}">
                  <div data-v-2faec5cb="" class="${list_order.status === 1 ? "success" : ""}">${list_order.status == 1 ? "Success" : list_order.status == 2 ? "Failed" : ""}</div>
                  <span data-v-2faec5cb="">${
                    // list_order.status == 1 && list_order.bet == 0
                    //    ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 4.5 + " </span>"
                    //    : list_order.status == 1 && list_order.bet == 5
                    //      ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 4.5 + " </span>"
                    //      : list_order.status == 1 && list_order.result == 0 && list_order.bet == "d"
                    //        ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 1.5 + " </span>"
                    //        : list_order.status == 1 && list_order.bet == "d"
                    //          ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 2 + " </span>"
                    //          : list_order.status == 1 && list_order.bet == "t"
                    //            ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 4.5 + " </span>"
                    //            : list_order.status == 1 && list_order.result == 5 && list_order.bet == "x"
                    //              ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 1.5 + " </span>"
                    //              : list_order.status == 1 && list_order.bet == "x"
                    //                ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 2 + " </span>"
                    //                : list_order.status == 1 && list_order.bet == "l"
                    //                  ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 2 + " </span>"
                    //                  : list_order.status == 1 && list_order.bet == "n"
                    //                    ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 2 + " </span>"
                    //                    : list_order.status == 1
                    //                      ? '<span data-v-a9660e98="" class="success"> + ₹' + list_order.money * 9 + " </span>"
                    //                      : list_order.status == 2
                    //                        ? '<span data-v-a9660e98="" class="fail"> - ₹' + list_order.money + ".00</span>"
                    //                        : ""
                    list_order.status === 1
                      ? '<span data-v-a9660e98="" class="success"> + ₹ ' +
                        parseFloat(list_order.get).toFixed(2) +
                        " </span>"
                      : '<span data-v-a9660e98="" class="fail"> - ₹ ' +
                        parseFloat(list_order.money).toFixed(2) +
                        "</span>"
                  }</span>
                  </div>`
              }
            </div>
            <div data-v-2faec5cb="" class="MyGameRecordList__C-detail details_box_${index}" style="display: none;">
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-text">Details</div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line">
                  Order number
                  <div data-v-2faec5cb="">${list_order.id_product} <img data-v-2faec5cb="" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAhFBMVEUAAABRUVFQUFBRUVFRUVFRUVFRUVFRUVFQUFBRUVFQUFBRUVFQUFBQUFBRUVFRUVFSUlJSUlJRUVFQUFBSUlJRUVFRUVFRUVFRUVFRUVFRUVFQUFBRUVFRUVFRUVFRUVFQUFBRUVFRUVFRUVFQUFBQUFBQUFBSUlJYWFhJSUlQUFBRUVGJ3MxyAAAAK3RSTlMAv0B6VerZrqiblYmCaGJIOiQdFg/79vDl39TKxbq0oY9zblxONC4pCQTPqkRvegAAAWZJREFUeNrtz0duw0AQAEGSzjnnnIP+/z8ffJOBgRfgiCts9Qca1UmSNGZDP0FDN37DbIJAQH4DAQGJAwEBiQMBAYlbTsjQLWcgtQVSWyC1BVJbILUFUlsgtdUQZJiyMSGzKRsTclbwBQEpgJwXfEFACiAXBV8QkALIWsEXBKRFyGXBF2QKSD/k1WdCruYhXV4gTUHWQUBAQsg1CEgO5BukMsgNCEgO5BYEJAfSg4CAhJA7EJAcyD0ISA5kAwQEJIRsgoCAhJAHEJAcyBYICEgI2QYBAQkhjyAgOZAdEBCQELILAgISQlZAQEDagDyBgORAnkFAciB7ICAgIWQfBAQkhLyAgORAVkEWC+nnWlbI30Bqh7yCgORADkBAQMIGEBCQNiCHICAgYW8gIDmQdxCQHMgHCEgO5AgEBCTsGKRySGog/+ik4AsC0iLktOALAtIi5LPgCwJS0FfBFwSkpH7COkmSMvoBUQl8xsUGEfcAAAAASUVORK5CYII=" /></div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line">
                  Period
                  <div data-v-2faec5cb="">${list_order.stage}</div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line">
                  Purchase amount
                  <div data-v-2faec5cb="">₹${parseFloat(list_order.fee + list_order.money).toFixed(2)}</div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line">
                  Quantity
                  <div data-v-2faec5cb="">${parseFloat(list_order.amount).toFixed(2)}</div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line">
                  Amount after tax
                  <div data-v-2faec5cb="" class="red">₹${parseFloat(list_order.money).toFixed(2)}</div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line">
                  Tax
                  <div data-v-2faec5cb="">₹${parseFloat(list_order.fee).toFixed(2)}</div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line" style="display: ${list_order.status == 0 ? "none" : ""}">
                  Result
                  <div data-v-2faec5cb="" class="numList">
                     ${list_order.result}
                  </div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line">
                  Select
                  <div data-v-2faec5cb="">
                     ${selected}
                  </div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line" style="display:${list_order.status == 0 ? "none" : ""};">
                  Status
                  <div data-v-2faec5cb="" class="${list_order.status == 1 ? "green" : "red"}">${list_order.status == 1 ? "Success" : "Failed"}</div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line" style="display:${list_order.status == 0 ? "none" : ""};">
                  Win/lose
                  <div data-v-2faec5cb="" class="${list_order.status == 1 ? "green" : "red"}">${list_order.status == 1 ? `₹${list_order.get}` : `- ₹${list_order.fee + list_order.money}`}</div>
               </div>
               <div data-v-2faec5cb="" class="MyGameRecordList__C-detail-line">
                  Order time
                  <div data-v-2faec5cb="">${timerJoin(list_order.time)}</div>
               </div>
            </div>
         `;
    })
    .join(" "); //</div>

  $(containerId).html(html);
}

function initGameLogics({
  GAME_TYPE_ID,
  GAME_NAME,
  My_Bets_Pages,
  Game_History_Pages,
}) {
  selectActiveClock(parseInt(GAME_TYPE_ID));

  //--------------------- Wingo game logic ---------------------

  var pageno = 0;
  var limit = 10;
  var page = 1;

  // --------------------- wingo game logic ---------------------

  function totalMoney() {
    let value = parseInt($("#van-field-1-input").val()?.trim() || 0);
    let money = parseInt(
      $(".Betting__Popup-body-money-main").attr("data-current-money") || 0
    );
    
    let total = value * money;
    $("#popup_total_bet_money").text(total + ".00");
}

  const selectPopupXData = () => {};
  $(".van-overlay").fadeOut();
  $(".popup-join").fadeOut();

  function alertBox(join, cssValueNumber, addText) {
    $(".van-overlay").fadeIn();
    $(".popup-join").fadeIn();
    $(".popup-join > div").removeClass();
    $(".popup-join > div").addClass(`Betting__Popup-${cssValueNumber}`);

    let activeXData = $(".Betting__C-multiple-r.active").attr("data-x");
    console.log(activeXData);
    $("#van-field-1-input").val(activeXData);
    $("div.Betting__Popup-body-x-btn").removeClass("bgcolor");
    $(`div.Betting__Popup-body-x-btn[data-x="${activeXData}"]`).addClass(
      "bgcolor",
    );
    $("#join_bet_btn").attr("data-join", join);
    $("#betting_value").html(addText);
    totalMoney();
  }

  $(".Betting__Popup-body-money-btn").off("click.money_btn");
  $(".Betting__Popup-body-money-btn").on("click.money_btn", function (e) {
    e.preventDefault();

    const thisValue = $(this).attr("data-money");
    $(".Betting__Popup-body-money-btn").removeClass("bgcolor");
    $(this).addClass("bgcolor");
    $(".Betting__Popup-body-money-main").attr("data-current-money", thisValue);

    totalMoney();
  });

  $(".Betting__Popup-body-x-btn").off("click.x_btn");
  $(`.Betting__Popup-body-x-btn`).on("click.x_btn", function (e) {
    e.preventDefault();

    const thisValue = $(this).attr("data-x");
    $(".Betting__Popup-body-x-btn").removeClass("bgcolor");
    $(this).addClass("bgcolor");

    $("#van-field-1-input").val(thisValue);
    totalMoney();
  });

  $(".Betting__Popup-minus-btn").off("click.minus_btn");
  $(`.Betting__Popup-minus-btn`).on("click.minus_btn", function (e) {
    e.preventDefault();
    const currentX = parseInt($("#van-field-1-input").val());
    const nextX = currentX === 1 ? 1 : currentX - 1;
    $(".Betting__Popup-body-x-btn").removeClass("bgcolor");
    $(`.Betting__Popup-body-x-btn[data-x="${nextX}"]`).addClass("bgcolor");

    $("#van-field-1-input").val(nextX);
    totalMoney();
  });

  $(".Betting__Popup-plus-btn").off("click.plus_btn");
  $(`.Betting__Popup-plus-btn`).on("click.plus_btn", function (e) {
    e.preventDefault();
    const currentX = parseInt($("#van-field-1-input").val());
    const nextX = currentX + 1;

    $(".Betting__Popup-body-x-btn").removeClass("bgcolor");
    $(`.Betting__Popup-body-x-btn[data-x="${nextX}"]`).addClass("bgcolor");

    $("#van-field-1-input").val(nextX);
    totalMoney();
  });

  $(`#van-field-1-input`).off("change.input");
  $(`#van-field-1-input`).on("change.input", function (e) {
    e.preventDefault();
    const currentX = parseInt($("#van-field-1-input").val());

    $(".Betting__Popup-body-x-btn").removeClass("bgcolor");
    $(`.Betting__Popup-body-x-btn[data-x="${currentX}"]`).addClass("bgcolor");

    totalMoney();
  });



  $("#join_bet_btn").off("click.join_btn");
  $("#join_bet_btn").on("click.join_btn", function (event) {
    event.preventDefault();
    let join = $(this).attr("data-join");
    const currentX = parseInt($("#van-field-1-input").val().trim());
    let money = $(".Betting__Popup-body-money-main").attr("data-current-money");

    if (!join || !currentX || !money) {
      return;
    }
    // let currentStartPoint = null;
    let currentStartPoint = JSON.parse(localStorage.getItem("startPoint"));
    console.log(GAME_TYPE_ID);
    if (GAME_TYPE_ID === '1') {
      currentStartPoint = JSON.parse(localStorage.getItem("startPoint"));
    } else if (GAME_TYPE_ID === '3') {
      currentStartPoint = JSON.parse(localStorage.getItem("3minStartPoint"));
    } else if (GAME_TYPE_ID === '5') {
      currentStartPoint = JSON.parse(localStorage.getItem("5minStartPoint")); // ✅ fixed
    } else if (GAME_TYPE_ID === '10') {
      currentStartPoint = JSON.parse(localStorage.getItem("10minStartPoint")); // ✅ fixed
    }
    
    if (!currentStartPoint) {
      alertMessage("Start point not available yet.");
      return;
    } else {
      console.log("Start point:", currentStartPoint); 
    }
    console.log(GAME_TYPE_ID)
    const startPrice = currentStartPoint.price;
    const coinType = getCoinType();
    
    console.log("Start Price:", startPrice);
    console.log("Coin Type:", coinType);
    $(this).addClass("block-click");
    $.ajax({
      type: "POST",
      url: "/api/webapi/action/join",
      data: {
        typeid: GAME_TYPE_ID,
        join: join,
        x: currentX,
        money: money,
        startPrice,
        coinType
      },
      dataType: "json",
      success: function (response) {
        alertMessage(response.message);
        if (response.status === false) return;
        $("#balance_amount").text(`₹ ${formatIndianNumber(response.money)} `);
        $("#bonus_balance_amount").text(
          `₹ ${formatIndianNumber(response.bonus_money)} `,
        );

        initMyBets();

        socket.emit("data-server_2", {
          money: currentX * money,
          join,
          time: Date.now(),
          change: response.change,
        });
      },
    });

    setTimeout(() => {
      $(".van-overlay").fadeOut();
      $(".popup-join").fadeOut();
      $("#join_bet_btn").removeClass("block-click");
    }, 500);
  });

  $("#cancel_bet_btn").off("click.cancel_btn");
  $("#cancel_bet_btn").on("click.cancel_btn", function (event) {
    event.preventDefault();

    $(".van-overlay").fadeOut();
    $(".popup-join").fadeOut();
    $("#join_bet_btn").removeClass("block-click");
  });

  //main button events

  $(".con-box .bet_button").off("click.con_box");
  $(".con-box .bet_button").on("click.con_box", function (e) {
    e.preventDefault();
    let addTop = $(this).attr("data-join");
    let cssValueNumber = $(this).attr("data-css-value");
    let addText = $(this).text();
    alertBox(addTop, cssValueNumber, addText);
  });

  $(".number-box .bet_button").off("click.number_box");
  $(".number-box .bet_button").on("click.number_box", function (e) {
    e.preventDefault();
    let addTop = $(this).attr("data-join");
    let cssValueNumber = $(this).attr("data-css-value");
    let addText = $(this).attr("data-join");
    alertBox(addTop, cssValueNumber, addText);
  });

  $(".btn-box .bet_button").off("click.btn_box");
  $(".btn-box .bet_button").on("click.btn_box", function (e) {
    e.preventDefault();
    let addTop = $(this).attr("data-join");
    let cssValueNumber = $(this).attr("data-css-value");
    let addText = $(this).text();
    alertBox(addTop, cssValueNumber, addText);
  });

  $(".Betting__C-multiple-r").off("click.multiple_r");
  $(".Betting__C-multiple-r").on("click.multiple_r", function (e) {
    e.preventDefault();
    $(".Betting__C-multiple-r").css({
      "background-color": "rgb(240, 240, 240)",
      color: "rgb(0, 0, 0)",
    });

    $(this).css({
      "background-color": "rgb(63 147 104)",
      color: "rgb(255, 255, 255)",
    });
    $(".Betting__C-multiple-r").removeClass("active");
    $(this).addClass("active");
  });

  $(".randomBtn").off("click.multiple_r");
  $(".randomBtn").on("click.multiple_r", async function (e) {
    e.preventDefault();
    let random = 0;
    for (let i = 0; i < 55; i++) {
      random = Math.floor(Math.random() * 10);
      $(".number-box .bet_button").removeClass("active");
      $(`.number-box .bet_button:eq(${random})`).addClass("active");
      await sleep(50);
    }

    alertBox(random, random, random);
  });

  const alertMessage = (text) => {
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
  };

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
        
        $("#period").text(response.period);

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

        $("#period").text(response.period);

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

    if (msg.data[0].game != GAME_NAME) {
      return;
    }

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
          result: lastGame?.amount,
        });
      } else {
        displayResultHandler({
          status: STATUS_MAP.LOSS,
          amount: lostGamesMoney,
          period: lastGame?.period,
          result: lastGame?.amount,
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

document.addEventListener('DOMContentLoaded', function() {
  // Initialize canvas
  const canvas = document.getElementById('priceChart');
  const ctx = canvas.getContext('2d');
  const coinSelect = document.getElementById('coinSelect');
  
  // UI Elements
  const currentPriceDisplay = document.getElementById('currentPriceDisplay');
  const priceChangeDisplay = document.getElementById('priceChangeDisplay');
  const currentTimeDisplay = document.getElementById('currentTimeDisplay');
  
  // Set proper canvas dimensions
  function resizeCanvas() {
      const container = document.querySelector('.Betting__C-numC');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
  }
  
  // Initial resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Coin configurations
  const coinConfigs = {
      BTC: { basePrice: 60000, color: '#f7931a', name: 'Bitcoin' },
      ETH: { basePrice: 3000, color: '#627eea', name: 'Ethereum' },
      BNB: { basePrice: 500, color: '#f3ba2f', name: 'Binance Coin' },
      ADA: { basePrice: 0.5, color: '#0033ad', name: 'Cardano' }
  };
  
  let currentCoin = coinSelect.value;
  let coinData = {};
  let coinLastPrices = {};
  let coinLastUpdateTime = {};
  let currentPrice = coinConfigs[currentCoin].basePrice;
  let previousPrice = currentPrice;
  
  // Initialize data for all coins
  Object.keys(coinConfigs).forEach(coin => {
      coinData[coin] = loadChartData(coin);
      coinLastPrices[coin] = coinData[coin].length > 0 ? 
          coinData[coin][coinData[coin].length - 1].y : 
          coinConfigs[coin].basePrice;
      coinLastUpdateTime[coin] = coinData[coin].length > 0 ? 
          coinData[coin][coinData[coin].length - 1].x : 
          Date.now();
      
      if (coin === currentCoin) {
          currentPrice = coinLastPrices[coin];
          previousPrice = coinData[coin].length > 1 ? 
              coinData[coin][coinData[coin].length - 2].y : 
              currentPrice;
      }
  });
  
  // Load saved data from localStorage
  function loadChartData(coin) {
      const savedData = localStorage.getItem(`priceChartData_${coin}`);
      if (savedData) {
          const parsedData = JSON.parse(savedData);
          return parsedData.sort((a, b) => a.x - b.x);
      }
      return generateInitialData(coin);
  }
  
  // Generate initial data for a coin
  function generateInitialData(coin) {
      const now = Date.now();
      const data = [];
      const basePrice = coinConfigs[coin].basePrice;
      
      // Generate 60 data points (1 per second for 1 minute)
      for (let i = 0; i < 60; i++) {
          const timestamp = now - (60 - i) * 1000;
          const price = i === 0 ? basePrice : 
              generateNewPrice(data[i-1].y, coin, timestamp);
          data.push({ x: timestamp, y: price });
      }
      
      return data;
  }
  
  // Save data to localStorage
  function saveChartData(coin, data) {
      localStorage.setItem(`priceChartData_${coin}`, JSON.stringify(data));
  }

  let latestEndPoint = null;
socket.on("setEndPoint", (data) => {
  latestEndPoint = data;
  console.log("Received endpoint from server:", latestEndPoint);
});
 let ThreeminEndPoint=null;
 socket.on("set3minEndPoint",(data)=>{
  ThreeminEndPoint=data;
  console.log("Received end point for 3 min Interval.",ThreeminEndPoint)
 })
  
 const fiveminEndPoint=null;
 socket.on("set5minEndPoint",(data)=>{
   FiveminEndPoint=data;
   console.log("Received end point for 5 min",FiveminEndPoint);
 })

 const tenminEndPoint=null;
 socket.on("set10minEndPoint",(data)=>{
  TenminEndPoint=data;
  console.log("Received end point for 10 min",TenminEndPoint);
 })
  // Price generation for line chart
  // function generateNewPrice(lastPrice, coin, timestamp) {
  //     const getTimeMSS = (countDownDate) => {
  //         var now = new Date().getTime();
  //         var distance = countDownDate - now;
  //         var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  //         var minute = Math.ceil(minutes % 60); // Using 60 as default if GAME_TYPE_ID not available
  //         var seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
  //         var seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);
      
  //         return { minute, seconds1, seconds2 };
  //     };
    
  //     var countDownDate = new Date("2030-07-16T23:59:59.9999999+03:00").getTime();
  //     const now = timestamp || Date.now();
  //     const { minute, seconds1, seconds2 } = getTimeMSS(countDownDate);
    
  //     // Check if we should use the endpoint
  //     if (minute === 0 && seconds1 === 0 && seconds2 === 5) {
  //         // if (typeof latestEndPoint !== 'undefined' && latestEndPoint !== null) {
  //         //   console.log(parseFloat(latestEndPoint))
  //         //     return parseFloat(latestEndPoint);
  //         // }
  //          if (latestEndPoint !== null) {
  //       return parseFloat(latestEndPoint);
  //     } else {
  //       console.log("Random change used:", randomChange);
  //       return lastPrice + randomChange;
  //     }
  //   } else {
  //     return lastPrice + randomChange;
  //   }
    
  //     // Normal price movement
  //     const volatility = coinConfigs[coin].basePrice * 0.0005; // 0.05% of base price
  //     let randomChange = (Math.random() * 2 - 1) * volatility;
      
  //     // Add slight momentum based on previous trend
  //     if (coinData[coin] && coinData[coin].length > 1) {
  //         const prevTrend = coinData[coin][coinData[coin].length - 1].y - 
  //                         coinData[coin][coinData[coin].length - 2].y;
  //         randomChange += prevTrend * 0.3; // 30% momentum
  //     }
      
  //     // Ensure price doesn't go negative
  //     const newPrice = Math.max(0.01, lastPrice + randomChange);
      
  //     // Limit price movement to ±2% per step
  //     const maxChange = lastPrice * 0.02;
  //     return Math.max(lastPrice - maxChange, Math.min(lastPrice + maxChange, newPrice));
  // }
  function generateNewPrice(lastPrice, coin, timestamp) {
    const getTimeMSS = (countDownDate) => {
      const now = Date.now();
      const distance = countDownDate - now;
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const minute = Math.ceil(minutes % parseInt(GAME_TYPE_ID));
      const seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
      const seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);
      return { minute, seconds1, seconds2 };
    };
  
    const countDownDate = new Date("2030-07-16T23:59:59.999+03:00").getTime();
    const now = timestamp || Date.now();
  
    if (!coinLastUpdateTime) coinLastUpdateTime = {};
    coinLastUpdateTime[coin] = now;
  
    const { minute, seconds1, seconds2 } = getTimeMSS(countDownDate);
    const game=getGameType();
    // console.log(game);
    // Case 1: Exact trigger time
    if (minute === 0 && seconds1 === 0 && seconds2 === 0) {
      if(game=='1'){
        if (latestEndPoint !== null) {
          return parseFloat(latestEndPoint);
        } else {
          const fallbackChange = (Math.random() * 2) - 1;
          console.log("Fallback random change used:", fallbackChange);
          return lastPrice + fallbackChange;
        }
      }
      else if(game=='3'){
        if(ThreeminEndPoint !== null){
          console.log("3 min EndPoint received from server")
          return parseFloat(ThreeminEndPoint);
        }
        else{
          const fallbackChange = (Math.random() * 2) - 1;
          console.log("Fallback random change used:", fallbackChange);
          return lastPrice + fallbackChange;
        }
      }
      else if(game=='5'){
        if(FiveminEndPoint !== null){
          console.log("5 min endPoint received from server")
          return parseFloat(FiveminEndPoint);
        }
        else{
          const fallbackChange = (Math.random() * 2) - 1;
          console.log("Fallback random change used:", fallbackChange);
          return lastPrice + fallbackChange;
        }
      }
      
      else if(game=='10'){
        if(tenminEndPoint!=null){
          console.log("Ten Min endPoint received from server");
          return parseFloat(tenminEndPoint);
        }
        else{
          const fallbackChange = (Math.random() * 2) - 1;
          console.log("Fallback random change used:", fallbackChange);
          return lastPrice + fallbackChange;
        }
      }

    }
  
    // Case 2: Normal volatility-based price generation
    const volatility = coinConfigs[coin].basePrice * 0.0005; // 0.05%
    let randomChange = (Math.random() * 2 - 1) * volatility;
  
    // Add slight momentum
    if (coinData[coin] && coinData[coin].length > 1) {
      const prevTrend =
        coinData[coin][coinData[coin].length - 1].y -
        coinData[coin][coinData[coin].length - 2].y;
      randomChange += prevTrend * 0.3;
    }
  
    const newPriceRaw = lastPrice + randomChange;
  
    // Prevent price from going below 0.01
    const newPrice = Math.max(0.01, newPriceRaw);
  
    // Limit movement to ±2% of lastPrice
    const maxChange = lastPrice * 0.02;
    return Math.max(lastPrice - maxChange, Math.min(lastPrice + maxChange, newPrice));
  }
  



  // Update price info display
  function updatePriceInfo() {
      const priceChange = ((currentPrice - previousPrice)).toFixed(2);
      currentPriceDisplay.textContent = currentPrice.toFixed(2);
      priceChangeDisplay.textContent = `${priceChange}`;
      console.log(priceChange,currentPrice,previousPrice)
      // Set color based on price change
      if (priceChange > 0) {
          priceChangeDisplay.style.color = '#10b981';
      } else if (priceChange < 0) {
          priceChangeDisplay.style.color = '#ef4444';
      } else {
          priceChangeDisplay.style.color = '#6b7280';
      }
      
      // Update current time
      const now = new Date();
      currentTimeDisplay.textContent = now.toLocaleTimeString();
  }
  
  // Initialize chart with plugins
  Chart.register(ChartZoom);
  // Chart.register(ChartCrosshair);
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: `${coinConfigs[currentCoin].name} Price`,
            data: coinData[currentCoin],
            borderColor: coinConfigs[currentCoin].color,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: coinConfigs[currentCoin].color,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        hover: { animationDuration: 0 },
        responsiveAnimationDuration: 0,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second',
                    displayFormats: { second: 'mm:ss' },
                    tooltipFormat: 'HH:mm:ss'
                },
                min: () => Date.now() - 10 * 1000,
                max: () => Date.now() + 60 * 100,
                ticks: { 
                    source: 'auto', 
                    autoSkip: false, 
                    maxTicksLimit: 10,
                    color: '#6b7280'
                },
                grid: { 
                    display: true, // Changed to true to show x-axis grid
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: true,
                    drawOnChartArea: true,
                    drawTicks: true,
                    tickColor: 'rgba(0, 0, 0, 0.8)',
                    borderColor: 'rgba(0, 0, 0, 0.8)',
                    borderDash: [5, 5], // Dashed grid lines
                    borderDashOffset: 0,
                    lineWidth: 1
                }
            },
            y: {
                beginAtZero: false,
                ticks: { 
                    callback: function(value) { 
                        return value.toFixed(0); 
                    },
                    color: '#6b7280',
                    padding: 5
                },
                grid: { 
                    color: 'rgba(249, 249, 248, 0.2)',
                    drawBorder: true,
                    drawOnChartArea: true,
                    drawTicks: true,
                    tickColor: 'rgba(0, 0, 0, 0.9)',
                    borderColor: 'rgba(0, 0, 0, 0.9)',
                    borderDash: [5, 5], // Dashed grid lines
                    borderDashOffset: 0,
                    lineWidth: 1
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: function(context) {
                        return `${coinConfigs[currentCoin].name}: ${context.parsed.y.toFixed(2)}`;
                    },
                    title: function(context) {
                        return new Date(context[0].parsed.x).toLocaleTimeString();
                    }
                }
            },
            zoom: {
                pan: { 
                    enabled: true, 
                    mode: 'x',
                    modifierKey: 'shift'
                },
                zoom: { 
                    wheel: { 
                        enabled: true,
                        modifierKey: 'ctrl'
                    }, 
                    pinch: { 
                        enabled: true 
                    }, 
                    mode: 'x',
                    onZoomComplete: ({ chart }) => {
                        chart.update('none');
                    }
                },
                limits: {
                    x: { min: 'original', max: 'original' }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        // Additional grid styling for the chart area
        layout: {
            padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            }
        },
        elements: {
            line: {
                borderCapStyle: 'round',
                borderJoinStyle: 'round'
            }
        }
    }
});
  
  // Reset zoom button
  function addResetZoomButton() {
    
      const resetZoomButton = document.createElement('button');
      // resetZoomButton.textContent = 'Reset  Zoom';
      resetZoomButton.innerHTML = '<i class="fas fa-search-minus"></i>';
      resetZoomButton.style.position = 'absolute';
      resetZoomButton.style.bottom = '10px';
      resetZoomButton.style.right = '10px';
      resetZoomButton.style.zIndex = '100';
      resetZoomButton.style.padding = '5px 10px';
      resetZoomButton.style.background = '#000080';
      resetZoomButton.style.color = 'white';
      resetZoomButton.style.border = 'none';
      resetZoomButton.style.borderRadius = '4px';
      resetZoomButton.style.cursor = 'pointer';
      
      resetZoomButton.addEventListener('click', () => {
          if (chart) {
              chart.resetZoom();
          }
      });
      
      document.querySelector('.Betting__C-numC').appendChild(resetZoomButton);
  }
  
  // Update chart with new data for all coins
  function updateChart(timestamp) {
      try {
          const now = timestamp || Date.now();
          
          // Update all coins' data in background
          Object.keys(coinConfigs).forEach(coin => {
              const lastPrice = coinData[coin].length > 0 ? 
                  coinData[coin][coinData[coin].length - 1].y : 
                  coinConfigs[coin].basePrice;
              
              const newPrice = generateNewPrice(lastPrice, coin, now);
              
              // Store previous price for change calculation
              if (coin === currentCoin) {
                  previousPrice = lastPrice;
              }
              
              coinData[coin].push({ x: now, y: newPrice });
              
              // Remove data older than 24 hours
              const oneDayAgo = now - 24 * 60 * 60 * 1000;
              coinData[coin] = coinData[coin].filter(point => point.x >= oneDayAgo);
              
              // Save to localStorage
              saveChartData(coin, coinData[coin]);
              
              if (coin === currentCoin) {
                  currentPrice = newPrice;
                  updatePriceInfo();
              }
          });
          
          // Update chart with current coin's data
          chart.data.datasets[0].data = coinData[currentCoin];
          chart.data.datasets[0].label = `${coinConfigs[currentCoin].name} Price`;
          chart.data.datasets[0].borderColor = coinConfigs[currentCoin].color;
          chart.data.datasets[0].pointHoverBackgroundColor = coinConfigs[currentCoin].color;
          
          // Update x-axis range if not zoomed
          if (!chart.isZoomedOrPanned()) {
              chart.options.scales.x.min = now - 20 * 1000;
              chart.options.scales.x.max = now + 20 * 1000;  //to adjust x-axis range for chart
          }
          
          chart.update('none');
          
      } catch (error) {
          console.error('Error updating chart:', error);
      }
  }
  
  // Start updates every 500ms
  let updateInterval = setInterval(updateChart, 1000);
  
  // Handle coin change
  coinSelect.addEventListener('change', function() {
      currentCoin = this.value;
      // Update chart with new coin's data
      chart.data.datasets[0].data = coinData[currentCoin];
      chart.data.datasets[0].label = `${coinConfigs[currentCoin].name} Price`;
      chart.data.datasets[0].borderColor = coinConfigs[currentCoin].color;
      chart.data.datasets[0].pointHoverBackgroundColor = coinConfigs[currentCoin].color;
      
      currentPrice = coinData[currentCoin].length > 0 ? 
          coinData[currentCoin][coinData[currentCoin].length - 1].y : 
          coinConfigs[currentCoin].basePrice;
      
      previousPrice = coinData[currentCoin].length > 1 ? 
          coinData[currentCoin][coinData[currentCoin].length - 2].y : 
          currentPrice;
      
      updatePriceInfo();
      
      // Reset zoom when changing coins
      chart.resetZoom();
      chart.update();


  });
  
  // Handle visibility change
  document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
          const now = Date.now();
          chart.data.datasets[0].data = coinData[currentCoin];
          chart.data.datasets[0].label = `${coinConfigs[currentCoin].name} Price`;
          
          if (!chart.isZoomedOrPanned()) {
              chart.options.scales.x.min = now - 60 * 1000;
              chart.options.scales.x.max = now;
          }
          
          chart.update();
          updatePriceInfo();
      }

  });
  
  // Add reset zoom button after chart initialization
  setTimeout(addResetZoomButton, 500);
  
  // Cleanup
  window.addEventListener('beforeunload', () => {
      clearInterval(updateInterval);
      Object.keys(coinConfigs).forEach(coin => saveChartData(coin, coinData[coin]));
  });
  window.getCurrentPrice = function() { return currentPrice; };
  // Initial price info update
  updatePriceInfo();
});

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
