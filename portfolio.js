// Finnhub API configuration
const FINNHUB_API_KEY = 'cvojalpr01qihjtp2lo0cvojalpr01qihjtp2log';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Mock portfolio data
const mockPortfolio = {
    cash: 10000,
    holdings: [
        { symbol: 'AAPL', shares: 10, avgPrice: 170.50 },
        { symbol: 'MSFT', shares: 5, avgPrice: 375.25 },
        { symbol: 'GOOGL', shares: 8, avgPrice: 140.75 }
    ],
    trades: [
        { date: '2025-04-05', type: 'buy', symbol: 'AAPL', shares: 10, price: 170.50 },
        { date: '2025-04-05', type: 'buy', symbol: 'MSFT', shares: 5, price: 375.25 },
        { date: '2025-04-05', type: 'buy', symbol: 'GOOGL', shares: 8, price: 140.75 }
    ]
};

// Load portfolio from localStorage or use mock data
let portfolio = JSON.parse(localStorage.getItem('portfolio')) || mockPortfolio;

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format percentage
function formatPercentage(value) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Fetch stock data
async function fetchStockData(symbol) {
    try {
        const response = await fetch(`${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn(`Using mock data for ${symbol} due to API error:`, error);
        return {
            c: mockPortfolio.holdings.find(h => h.symbol === symbol)?.avgPrice || 0,
            dp: 0
        };
    }
}

// Update portfolio summary
async function updatePortfolioSummary() {
    let totalValue = portfolio.cash;
    let todayReturn = 0;

    // Calculate total value and today's return
    for (const holding of portfolio.holdings) {
        const quote = await fetchStockData(holding.symbol);
        const marketValue = quote.c * holding.shares;
        const todayChange = (quote.c - (quote.c / (1 + quote.dp / 100))) * holding.shares;
        
        totalValue += marketValue;
        todayReturn += todayChange;
    }

    // Calculate total return
    const totalReturn = ((totalValue - 10000) / 10000) * 100;

    // Update DOM
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    document.getElementById('totalReturn').textContent = formatPercentage(totalReturn);
    document.getElementById('todayReturn').textContent = formatCurrency(todayReturn);
    document.getElementById('todayReturnPercent').textContent = formatPercentage((todayReturn / totalValue) * 100);
    document.getElementById('cashBalance').textContent = formatCurrency(portfolio.cash);

    // Update classes for return values
    document.getElementById('totalReturn').className = totalReturn >= 0 ? 'price-up' : 'price-down';
    document.getElementById('todayReturnPercent').className = todayReturn >= 0 ? 'price-up' : 'price-down';
}

// Update holdings table
async function updateHoldings() {
    const tableBody = document.getElementById('holdingsTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    for (const holding of portfolio.holdings) {
        const quote = await fetchStockData(holding.symbol);
        const marketValue = quote.c * holding.shares;
        const return_ = ((quote.c - holding.avgPrice) / holding.avgPrice) * 100;

        const row = document.createElement('tr');
        row.className = 'border-t border-gray-800';
        
        row.innerHTML = `
            <td class="px-6 py-4 font-semibold">${holding.symbol}</td>
            <td class="px-6 py-4">${holding.shares}</td>
            <td class="px-6 py-4">${formatCurrency(holding.avgPrice)}</td>
            <td class="px-6 py-4">${formatCurrency(quote.c)}</td>
            <td class="px-6 py-4">${formatCurrency(marketValue)}</td>
            <td class="px-6 py-4">
                <span class="${return_ >= 0 ? 'price-up' : 'price-down'}">
                    ${formatPercentage(return_)}
                </span>
            </td>
            <td class="px-6 py-4">
                <button class="text-blue-500 hover:text-blue-400" onclick="showTradeModal('${holding.symbol}')">
                    Trade
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    }
}

// Update trades table
function updateTrades() {
    const tableBody = document.getElementById('tradesTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    portfolio.trades.slice().reverse().forEach(trade => {
        const row = document.createElement('tr');
        row.className = 'border-t border-gray-800';
        
        row.innerHTML = `
            <td class="px-6 py-4">${trade.date}</td>
            <td class="px-6 py-4 ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}">
                ${trade.type.toUpperCase()}
            </td>
            <td class="px-6 py-4">${trade.symbol}</td>
            <td class="px-6 py-4">${trade.shares}</td>
            <td class="px-6 py-4">${formatCurrency(trade.price)}</td>
            <td class="px-6 py-4">${formatCurrency(trade.shares * trade.price)}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Initialize portfolio chart
function initializeChart() {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) return null;

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 20 }, (_, i) => i + 1),
            datasets: [{
                label: 'Portfolio Value',
                data: Array.from({ length: 20 }, () => Math.random() * 1000 + 10000),
                borderColor: '#2196F3',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: '#2A2D35'
                    }
                }
            }
        }
    });

    return chart;
}

// Show trade modal
function showTradeModal(symbol = '') {
    const modal = document.getElementById('tradeModal');
    const symbolInput = document.getElementById('tradeSymbol');
    
    modal.classList.remove('hidden');
    if (symbol) {
        symbolInput.value = symbol;
    }
}

// Hide trade modal
function hideTradeModal() {
    const modal = document.getElementById('tradeModal');
    modal.classList.add('hidden');
}

// Execute trade
async function executeTrade() {
    const symbol = document.getElementById('tradeSymbol').value.toUpperCase();
    const type = document.getElementById('tradeType').value;
    const shares = parseFloat(document.getElementById('tradeShares').value);

    if (!symbol || !shares || shares <= 0) {
        alert('Please enter valid trade details');
        return;
    }

    try {
        const quote = await fetchStockData(symbol);
        const total = quote.c * shares;

        if (type === 'buy') {
            if (total > portfolio.cash) {
                alert('Insufficient funds');
                return;
            }

            portfolio.cash -= total;
            const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);
            
            if (existingHolding) {
                const newShares = existingHolding.shares + shares;
                existingHolding.avgPrice = ((existingHolding.avgPrice * existingHolding.shares) + (quote.c * shares)) / newShares;
                existingHolding.shares = newShares;
            } else {
                portfolio.holdings.push({
                    symbol,
                    shares,
                    avgPrice: quote.c
                });
            }
        } else {
            const holding = portfolio.holdings.find(h => h.symbol === symbol);
            if (!holding || holding.shares < shares) {
                alert('Insufficient shares');
                return;
            }

            portfolio.cash += total;
            holding.shares -= shares;
            
            if (holding.shares === 0) {
                portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
            }
        }

        // Add trade to history
        portfolio.trades.push({
            date: new Date().toISOString().split('T')[0],
            type,
            symbol,
            shares,
            price: quote.c
        });

        // Save to localStorage
        localStorage.setItem('portfolio', JSON.stringify(portfolio));

        // Update UI
        hideTradeModal();
        await updatePortfolioSummary();
        await updateHoldings();
        updateTrades();
    } catch (error) {
        console.error('Error executing trade:', error);
        alert('Error executing trade. Please try again.');
    }
}

// Add funds
function addFunds() {
    const amount = parseFloat(prompt('Enter amount to add:'));
    if (amount && amount > 0) {
        portfolio.cash += amount;
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        updatePortfolioSummary();
    }
}

// Initialize the portfolio page
document.addEventListener('DOMContentLoaded', async () => {
    const chart = initializeChart();
    
    // Initial load
    await Promise.all([
        updatePortfolioSummary(),
        updateHoldings()
    ]);
    updateTrades();

    // Chart filter handlers
    document.querySelectorAll('.chart-filter').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-filter').forEach(btn => 
                btn.classList.remove('active')
            );
            e.target.classList.add('active');
            // Update chart data based on selected range
            // This would typically fetch historical data from the API
        });
    });

    // Update data periodically
    setInterval(async () => {
        await Promise.all([
            updatePortfolioSummary(),
            updateHoldings()
        ]);
    }, 30000); // Update every 30 seconds
});
