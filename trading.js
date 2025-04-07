// Constants
const API_BASE_URL = 'http://localhost:5000/api';
const TWELVE_DATA_API_KEY = '9abb61c72cf9458a9f6b8cc9f308b2c1';

// Format currency
function formatCurrency(number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(number);
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleString();
}

// Initialize Web3
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            web3 = new Web3(window.ethereum);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            updateWalletStatus(true);
            loadTransactionHistory();
        } catch (error) {
            console.error('Error initializing Web3:', error);
            updateWalletStatus(false);
        }
    } else {
        console.log('Please install MetaMask!');
        updateWalletStatus(false);
    }
}

// Update wallet connection status
function updateWalletStatus(connected) {
    const walletStatus = document.getElementById('walletStatus');
    if (connected) {
        walletStatus.className = 'px-4 py-2 rounded-md bg-green-500 bg-opacity-20 text-green-500';
        walletStatus.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span class="text-sm">Wallet connected</span>
            </div>
        `;
    } else {
        walletStatus.className = 'px-4 py-2 rounded-md bg-red-500 bg-opacity-20 text-red-500';
        walletStatus.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                <span class="text-sm">Wallet not connected</span>
            </div>
        `;
    }
}

// Get stock data
async function getStockData(symbol) {
    try {
        const response = await fetch(`${API_BASE_URL}/stock/${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch stock data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return null;
    }
}

// Update stock info
function updateStockInfo(data) {
    const stockInfo = document.getElementById('stockInfo');
    if (!stockInfo) return;

    stockInfo.innerHTML = `
        <div>
            <p class="text-gray-400 text-sm">Current Price</p>
            <p class="text-2xl font-bold">${formatCurrency(data.regularMarketPrice)}</p>
        </div>
        <div>
            <p class="text-gray-400 text-sm">Change</p>
            <p class="text-lg ${data.regularMarketChange >= 0 ? 'text-green-500' : 'text-red-500'}">
                ${data.regularMarketChange >= 0 ? '▲' : '▼'} ${formatCurrency(Math.abs(data.regularMarketChange))}
                (${(data.regularMarketChangePercent).toFixed(2)}%)
            </p>
        </div>
        <div>
            <p class="text-gray-400 text-sm">Volume</p>
            <p class="font-medium">${data.regularMarketVolume.toLocaleString()}</p>
        </div>
        <div>
            <p class="text-gray-400 text-sm">Market Cap</p>
            <p class="font-medium">${formatCurrency(data.marketCap)}</p>
        </div>
    `;
}

// Initialize price chart
let priceChart = null;
function initializePriceChart(dates, prices) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    if (priceChart) {
        priceChart.destroy();
    }

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Stock Price',
                data: prices,
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
}

// Add transaction to blockchain
async function addTransaction(transaction) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transaction)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to add transaction');
        }
        
        return data;
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
}

// Load transaction history
async function loadTransactionHistory() {
    const tbody = document.getElementById('transactionHistory');
    if (!tbody) return;

    try {
        const userId = localStorage.getItem('userId') || 'anonymous';
        const response = await fetch(`${API_BASE_URL}/user/transactions?user_id=${userId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load transactions');
        }
        
        tbody.innerHTML = data.reverse().map(tx => `
            <tr class="hover:bg-[#1E2026]">
                <td class="py-3 px-4">${formatDate(tx.timestamp * 1000)}</td>
                <td class="py-3 px-4">${tx.symbol}</td>
                <td class="py-3 px-4 ${tx.type === 'buy' ? 'text-green-500' : 'text-red-500'}">
                    ${tx.type.toUpperCase()}
                </td>
                <td class="py-3 px-4">${tx.quantity}</td>
                <td class="py-3 px-4">${formatCurrency(tx.price)}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs ${
                        tx.status === 'completed' ? 'bg-green-500 bg-opacity-20 text-green-500' :
                        tx.status === 'pending' ? 'bg-yellow-500 bg-opacity-20 text-yellow-500' :
                        'bg-red-500 bg-opacity-20 text-red-500'
                    }">${tx.status}</span>
                </td>
                <td class="py-3 px-4">
                    <span class="text-blue-500 hover:text-blue-400 cursor-pointer" onclick="viewTransaction('${tx.block_hash}')">
                        ${tx.block_hash.substring(0, 8)}...
                    </span>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-4 text-center text-red-500">
                    Error loading transactions. Please try again.
                </td>
            </tr>
        `;
    }
}

// View transaction details
async function viewTransaction(hash) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/transactions/${hash}`);
        const tx = await response.json();
        
        if (!response.ok) {
            throw new Error(tx.error || 'Failed to load transaction details');
        }
        
        alert(`
Transaction Details:
-------------------
Date: ${formatDate(tx.timestamp * 1000)}
Symbol: ${tx.symbol}
Type: ${tx.type.toUpperCase()}
Quantity: ${tx.quantity}
Price: ${formatCurrency(tx.price)}
Total Value: ${formatCurrency(tx.price * tx.quantity)}
Status: ${tx.status}
Block Hash: ${tx.block_hash}
        `);
        
    } catch (error) {
        console.error('Error viewing transaction:', error);
        alert('Error loading transaction details. Please try again.');
    }
}

// Place trade
async function placeTrade(event) {
    event.preventDefault();

    if (!userAccount) {
        alert('Please connect your wallet first!');
        return;
    }

    const symbol = document.getElementById('symbol').value.toUpperCase();
    const tradeType = document.getElementById('tradeType').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const priceType = document.getElementById('priceType').value;
    const limitPrice = document.getElementById('limitPrice').value;

    try {
        // Get current stock price
        const stockData = await getStockData(symbol);
        if (!stockData) throw new Error('Failed to get stock data');

        const price = priceType === 'market' ? stockData.regularMarketPrice : parseFloat(limitPrice);
        const totalValue = price * quantity;

        // Add transaction
        const transaction = {
            symbol,
            type: tradeType,
            quantity,
            price,
            user_id: localStorage.getItem('userId') || 'anonymous'
        };

        // Add to blockchain
        await addTransaction(transaction);

        // Update UI
        await loadTransactionHistory();
        alert(`${tradeType.toUpperCase()} order placed successfully!`);
        event.target.reset();

    } catch (error) {
        console.error('Error placing trade:', error);
        alert('Error placing trade: ' + error.message);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Web3
    initWeb3();

    // Set up form handlers
    const tradeForm = document.getElementById('tradeForm');
    if (tradeForm) {
        tradeForm.addEventListener('submit', placeTrade);
    }

    const priceType = document.getElementById('priceType');
    const limitPriceContainer = document.getElementById('limitPriceContainer');
    if (priceType && limitPriceContainer) {
        priceType.addEventListener('change', () => {
            limitPriceContainer.style.display = 
                priceType.value === 'limit' ? 'block' : 'none';
        });
    }

    // Load transaction history
    loadTransactionHistory();

    // Set up symbol input handler
    const symbolInput = document.getElementById('symbol');
    if (symbolInput) {
        let timeoutId;
        symbolInput.addEventListener('input', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                const symbol = symbolInput.value.trim().toUpperCase();
                if (symbol) {
                    const data = await getStockData(symbol);
                    if (data) {
                        updateStockInfo(data);
                        // Get historical data for chart
                        const response = await fetch(`${API_BASE_URL}/time_series?symbol=${symbol}`);
                        const timeSeriesData = await response.json();
                        if (timeSeriesData && timeSeriesData.dates) {
                            initializePriceChart(timeSeriesData.dates, timeSeriesData.prices);
                        }
                    }
                }
            }, 500);
        });
    }
});
