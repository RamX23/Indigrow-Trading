$(window).on("load", function () {
  setTimeout(() => {
    $("#preloader").fadeOut(0);
  }, 100);
});
$(document).ready(function () {
  $(`a[href="${window.location.pathname}"]`).addClass("active");
  $(`a[href="${window.location.pathname}"]`).css("pointerEvents", "none");
});

$(".back-to-tops").click(function () {
  $("html, body").animate(
    {
      scrollTop: 0,
    },
    800,
  );
  return false;
});


const getGameType = () => {
  const urlParams = new URLSearchParams(window.location.search);

  $("#game_type_status").text(`${urlParams.get("game_type") || 1} MIN`);

  return urlParams.get("game_type") || "1";
};

var socket=io();


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
      this.currentGameType = `${type}min`;
  },
  
  getCurrentGameTimer: function() {
      // Returns current timer data for active game type
      return this.gameTimers[this.currentGameType] || {
          minute1: 0, // Tens place of minutes (unused in your case)
          minute2: 0, // Single digit minutes
          second1: 0, // Tens place of seconds
          second2: 0, // Ones place of seconds
          active: true
      };
  }
};


let countdownStarted = false;


socket.on('timeUpdate', (data) => {
  // Update TimeManager
  TimeManager.currentTime = {
    minute1: data.minute1,
    minute2: data.minute2,
    second1: data.second1,
    second2: data.second2,
    raw: new Date(data.timestamp)
  };
  
  TimeManager.gameTimers = data.sessions;
  
  if (!countdownStarted) {
    countdownStarted = true;
    cownDownTimer();
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

function formatMoney(money) {
  return String(money).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
}

let checkID = $("html").attr("data-change");
let i = 0;
if (checkID == 1) i = 1;
if (checkID == 2) i = 3;
if (checkID == 3) i = 5;
if (checkID == 4) i = 10;


function cownDownTimer() {
  var countDownDate = new Date("2030-07-16T23:59:59.9999999+01:00").getTime();
  setInterval(function () {
    TimeManager.currentTime.raw.getTime();
    var now = TimeManager.currentTime.raw.getTime();
    // console.log(TimeManager.currentTime);
    var distance = countDownDate - now;
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var minute = Math.ceil(minutes % i);
    var seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
    var seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);
    if (checkID != 1) {
      $(".time .time-sub:eq(1)").text(minute);
    }

    $(".time .time-sub:eq(2)").text(seconds1);
    $(".time .time-sub:eq(3)").text(seconds2);
  }, 0);
}

cownDownTimer();
