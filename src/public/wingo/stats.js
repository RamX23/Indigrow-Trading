document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const periodButtons = document.querySelectorAll('.period-btn');
  const totalBetsEl = document.getElementById('total-bets');
  const betsWonEl = document.getElementById('bets-won');
  const betsLostEl = document.getElementById('bets-lost');
  const amountSpentEl = document.getElementById('amount-spent');
  const winRateEl = document.getElementById('win-rate');
  const statsTable = document.getElementById('stats-table');
  // const totalProfit = document.getElementById('total-profit');
  const overallProfitLossEl = document.getElementById('overallProfitLoss');

  // Chart setup
  const ratioCtx = document.getElementById('ratioChart').getContext('2d');
  const ratioChart = new Chart(ratioCtx, {
    type: 'doughnut',
    data: {
      labels: ['Won', 'Lost'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#10B981', '#EF4444']
      }]
    }
  });

  // Initial data load
  loadGameStats();
  loadPeriodStats('today');
  getOverallProfitAndLoss('today'); // ✅ Call added

  // Button event listeners
  periodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      loadPeriodStats(period);
      getOverallProfitAndLoss(period);
      setActiveButton(btn);
    });
  });

  async function loadGameStats() {
    try {
      const response = await fetch('/api/webapi/stats');
      const { data } = await response.json();
      renderGameStatsTable(data);
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  }

  async function loadPeriodStats(period) {
    try {
      const response = await fetch(`/api/webapi/period-stats/${period}`);
      const { data } = await response.json();
      updateStatsDisplay(data);
      updateCharts(data);
    } catch (error) {
      console.error('Error loading period stats:', error);
    }
  }

  function updateStatsDisplay(data) {
    // totalProfit.textContent = `₹${data.amountWon.toFixed(2)}`;
    totalBetsEl.textContent = data.totalBets;
    betsWonEl.textContent = data.betsWon;
    betsLostEl.textContent = data.betsLost;
    amountSpentEl.textContent = `₹${data.amountSpent.toLocaleString()}`;
    winRateEl.textContent = `${data.winRate.toFixed(1)}%`;
  }

  function renderGameStatsTable(data) {
    let html = '';
  var gameName=null;

    data.forEach(game => {
      if(game.game=='wingo'){
        gameName="1 min"
      }
      else if(game.game=='wingo3'){
        gameName="3 min"
      }
      else if(game.game=='wingo5'){
        gameName="5 min"
      }
      else{
        gameName="10min"
      }
      html += `
        <tr>
          <td>${(gameName)}</td>
          <td>${game.totalBets}</td>
          <td>${game.betsWon}</td>
          <td>${game.betsLost}</td>
          <td>${game.winRate.toFixed(1)}%</td>
          <td>₹${game.amountSpent.toLocaleString()}</td>
        </tr>
      `;
    });
    statsTable.innerHTML = html;
  }

  function getOverallProfitAndLoss(period) {
    fetch(`/api/webapi/overall-profit-loss/${period}`)
      .then(res => res.json())
      .then(data => {
        const profitEl = document.getElementById('overallProfitLoss');
        const { profitOrLoss, status } = data.data;
  
        let color = 'white';
        if (status === 'Profit') color = 'green';
        else if (status === 'Loss') color = 'red';
  
        profitEl.textContent = `₹${Math.abs(profitOrLoss).toLocaleString()}`;
        profitEl.style.color = color;
      })
      .catch(err => console.error("Error fetching profit/loss:", err));
  }
  
  
  function updateCharts(data) {
    ratioChart.data.datasets[0].data = [data.betsWon, data.betsLost];
    ratioChart.update();
  }

  function setActiveButton(activeBtn) {
    periodButtons.forEach(btn => {
      btn.classList.toggle('active', btn === activeBtn);
    });
  }
});
