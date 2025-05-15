let chart;
  let timer;
  let dataInterval;
  let currentBet = null;
  let startPrice = 45;
  let dataPoints = [{ x: new Date().getTime(), y: 45 }];
  let sessionActive = false;
  let buttonsActive = true;
  let timeLeft = 30;
  
  // DOM elements
  const priceChart = document.getElementById('priceChart');
  const sessionTimer = document.getElementById('timerText');
  const currentTimeDisplay = document.getElementById('timeText');
  const resultPopup = document.getElementById('resultPopup');
  const resultTitle = document.getElementById('resultTitle');
  const resultIcon = document.getElementById('resultIcon');
  const resultDetails = document.getElementById('resultDetails');
  const startPriceDisplay = document.getElementById('startPrice');
  const endPriceDisplay = document.getElementById('endPrice');
  const betTypeDisplay = document.getElementById('betType');
  const bigBtn = document.getElementById('bigBtn');
  const smallBtn = document.getElementById('smallBtn');
  const placeBetPrompt = document.getElementById('placeBetPrompt');
  const currentBetDisplay = document.getElementById('currentBetDisplay');
  const betChoice = document.getElementById('betChoice');
  const currentPriceDisplay = document.getElementById('currentPrice');
  
  // Generate random price point
  function generateDataPoint(lastPoint) {
    const newX = new Date().getTime();
    const volatility = 1;
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const newY = lastPoint ? Math.max(1, lastPoint.y * (1 + randomChange / 100)) : 45;
    return { x: newX, y: newY };
  }
  
  // Initialize chart with navy blue theme
  function initChart() {
    if (chart) chart.destroy();
  
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
  
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
  
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
  
    chart = new Chart(priceChart, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Live Price',
            data: dataPoints,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: '#38bdf8',
            pointHoverBackgroundColor: '#0ea5e9',
          },
          {
            label: 'Session Start',
            data: [],
            borderColor: '#f43f5e',
            borderDash: [5, 5],
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
          }
        ]
      },
      options: {
        animation: {
          duration: 200,
          easing: 'easeOutQuart'
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#e2e8f0',
              font: {
                family: 'Inter',
                size: 12
              },
              padding: 20,
              boxWidth: 12,
              usePointStyle: true
            }
          },
          tooltip: {
            enabled: true,
            mode: 'nearest',
            intersect: false,
            backgroundColor: '#1e293b',
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function (context) {
                const time = moment(context.parsed.x).format('HH:mm:ss');
                const value = context.parsed.y.toFixed(2);
                return `Time: ${time}   Price: ${value}`;
              },
              title: () => null
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
              modifierKey: 'ctrl'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              pinch: {
                enabled: true
              },
              mode: 'x'
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'second',
              displayFormats: {
                second: 'mm:ss'
              },
            },
            grid: {
              display: true,
              color: 'rgba(148, 163, 184, 0.1)',
              drawTicks: false
            },
            ticks: {
              color: '#64748b',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10,
              font: {
                family: 'Inter',
                size: 11
              }
            },
            min: startOfDay,
            max: endOfDay,
          },
          y: {
            beginAtZero: false,
            grid: {
              display: true,
              color: 'rgba(148, 163, 184, 0.1)',
              drawTicks: false
            },
            ticks: {
              color: '#64748b',
              font: {
                family: 'Inter',
                size: 11
              },
              padding: 8
            },
            border: {
              display: false
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }
  
  // Update session start line
  function updateSessionLine(startTime, price) {
    if (!chart) return;
    
    const sessionLine = [
      { x: startTime, y: price },
      { x: moment(startTime).add(30, 'seconds').valueOf(), y: price }
    ];
    
    chart.data.datasets[1].data = sessionLine;
    chart.update();
  }
  
  // Update chart with new data point
  function updateChart() {
    const lastPoint = dataPoints[dataPoints.length - 1];
    const newPoint = generateDataPoint(lastPoint);
    
    dataPoints.push(newPoint);
    
    currentPriceDisplay.textContent = newPoint.y.toFixed(2);
  
    if (chart) {
      chart.data.datasets[0].data = dataPoints;
      chart.options.scales.x.min = moment().subtract(30, 'seconds').valueOf();
      chart.options.scales.x.max = moment().add(5, 'seconds').valueOf();
      chart.update();
    }
  }
  
  // Start new session
  function startNewSession() {
    const currentTime = new Date().getTime();
    const lastPoint = dataPoints[dataPoints.length - 1];
    const newStartPrice = lastPoint.y;
    
    const newPoint = { x: currentTime, y: newStartPrice };
    dataPoints.push(newPoint);
  
    startPrice = newStartPrice;
    currentBet = null;
    
    sessionActive = true;
    timeLeft = 30;
    buttonsActive = true;
    
    sessionTimer.textContent = `${timeLeft}s`;
    sessionTimer.parentElement.style.color = '#38bdf8';
    sessionTimer.parentElement.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
    
    placeBetPrompt.style.display = 'block';
    currentBetDisplay.style.display = 'none';
    
    bigBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    smallBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    
    updateSessionLine(currentTime, newStartPrice);
  
    clearInterval(timer);
    
    timer = setInterval(() => {
      timeLeft--;
      sessionTimer.textContent = `${timeLeft}s`;
      
      if (timeLeft <= 0) {
        endSession();
      } else if (timeLeft <= 5) {
        sessionTimer.parentElement.style.color = '#f43f5e';
        sessionTimer.parentElement.style.backgroundColor = 'rgba(244, 63, 94, 0.1)';
        buttonsActive = false;
      }
    }, 1000);
  }
  
  // End current session
  function endSession() {
    clearInterval(timer);
    
    const endPrice = dataPoints[dataPoints.length - 1].y;
    
    let outcome = 'no bet';
    if (currentBet === 'big') {
      outcome = endPrice >= startPrice ? 'win' : 'lose';
    } else if (currentBet === 'small') {
      outcome = endPrice < startPrice ? 'win' : 'lose';
    }
    
    // Show result
    startPriceDisplay.textContent = startPrice.toFixed(2);
    endPriceDisplay.textContent = endPrice.toFixed(2);
    betTypeDisplay.textContent = currentBet ? 
      (currentBet === 'big' ? 'Buy' : 'Sell') : 'None';
    
    if (outcome === 'win') {
      resultTitle.textContent = 'You Won!';
      resultIcon.textContent = '🎉';
      resultDetails.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
    } else if (outcome === 'lose') {
      resultTitle.textContent = 'You Lost!';
      resultIcon.textContent = '😢';
      resultDetails.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    } else {
      resultTitle.textContent = 'No Bet Placed!';
      resultIcon.textContent = 'ℹ️';
      resultDetails.style.backgroundColor = '#1e293b';
    }
    
    resultPopup.style.display = 'block';
    sessionActive = false;
    sessionTimer.textContent = 'Processing...';
    sessionTimer.parentElement.style.color = '#94a3b8';
    sessionTimer.parentElement.style.backgroundColor = '#1e293b';
  
    // Start new session after delay
    setTimeout(() => {
      resultPopup.style.display = 'none';
      startNewSession();
    }, 5000);
  }
