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
  
  // Track last update time and missed updates
  let lastUpdateTime = Date.now();
  let missedUpdates = 0;
  
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

  // price generation for line chart
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
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: true,
                    drawOnChartArea: true,
                    drawTicks: true,
                    tickColor: 'rgba(0, 0, 0, 0.8)',
                    borderColor: 'rgba(0, 0, 0, 0.8)',
                    borderDash: [5, 5],
                    borderDashOffset: 0,
                    lineWidth: 1
                }
            },
            y: {
                beginAtZero: false,
                ticks: { 
                    callback: function(value) { 
                        return value.toFixed(2); 
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
                    borderDash: [5, 5],
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
          
          // Calculate how many updates we missed (if any)
          const timeSinceLastUpdate = now - lastUpdateTime;
          missedUpdates = Math.floor(timeSinceLastUpdate / 1000) - 1;
          missedUpdates = Math.max(0, missedUpdates);
          
          // Update all coins' data in background
          Object.keys(coinConfigs).forEach(coin => {
              let lastPrice = coinData[coin].length > 0 ? 
                  coinData[coin][coinData[coin].length - 1].y : 
                  coinConfigs[coin].basePrice;
              
              // If we missed updates, generate the missing points
              if (missedUpdates > 0) {
                  for (let i = 0; i < missedUpdates; i++) {
                      const newTime = lastUpdateTime + (i + 1) * 1000;
                      lastPrice = generateNewPrice(lastPrice, coin, newTime);
                      coinData[coin].push({ x: newTime, y: lastPrice });
                  }
              }
              
              // Generate the current price
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
          
          // Update last update time
          lastUpdateTime = now;
          
          // Update chart with current coin's data
          chart.data.datasets[0].data = coinData[currentCoin];
          chart.data.datasets[0].label = `${coinConfigs[currentCoin].name} Price`;
          chart.data.datasets[0].borderColor = coinConfigs[currentCoin].color;
          chart.data.datasets[0].pointHoverBackgroundColor = coinConfigs[currentCoin].color;
          
          // Update x-axis range if not zoomed
          if (!chart.isZoomedOrPanned()) {
              chart.options.scales.x.min = now - 20 * 1000;
              chart.options.scales.x.max = now + 20 * 1000;
          }
          
          chart.update('none');
          
      } catch (error) {
          console.error('Error updating chart:', error);
      }
  }
  
  // Start updates every 1000ms (1 second)
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
  
  // Handle visibility change - catch up on missed points when tab becomes visible again
  document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
          // Force an immediate update to catch up on any missed points
          updateChart();
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