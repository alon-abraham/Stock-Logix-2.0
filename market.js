// Constants
const API_BASE_URL = 'http://localhost:5000/api';
const TWELVE_DATA_API_KEY = '9abb61c72cf9458a9f6b8cc9f308b2c1';
const REFRESH_INTERVAL = 10000; // Refresh every 10 seconds

// Format numbers
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
}

// Format currency
function formatCurrency(number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(number);
}

// Get stock data
async function getStockData(symbol) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/stock/${symbol}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch stock data');
        }
        
        hideLoading();
        return data;
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        throw error;
    }
}

// Update stock card
function updateStockCard(card, stock) {
    const isPositive = stock.regularMarketChangePercent >= 0;
    
    // Update price and change indicators
    card.querySelector('.price').textContent = formatCurrency(stock.regularMarketPrice);
    const changeElement = card.querySelector('.change');
    changeElement.textContent = formatCurrency(stock.regularMarketChange);
    changeElement.className = `change ${isPositive ? 'text-green-500' : 'text-red-500'}`;
    
    // Update percentage
    const percentElement = card.querySelector('.percent');
    percentElement.textContent = `${isPositive ? '▲' : '▼'} ${Math.abs(stock.regularMarketChangePercent).toFixed(2)}%`;
    percentElement.className = `percent px-2 py-1 rounded text-sm ${isPositive ? 'bg-green-500 bg-opacity-20 text-green-500' : 'bg-red-500 bg-opacity-20 text-red-500'}`;
    
    // Update volume
    card.querySelector('.volume').textContent = formatNumber(stock.regularMarketVolume);
}

// Create stock card
function createStockCard(stock) {
    const isPositive = stock.regularMarketChangePercent >= 0;
    const card = document.createElement('div');
    card.className = 'bg-[#1E2026] p-6 rounded-lg shadow-lg';
    card.setAttribute('data-symbol', stock.symbol);
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-xl font-bold">${stock.symbol}</h3>
                <p class="text-gray-400">${stock.shortName}</p>
            </div>
            <span class="percent px-2 py-1 rounded text-sm ${isPositive ? 'bg-green-500 bg-opacity-20 text-green-500' : 'bg-red-500 bg-opacity-20 text-red-500'}">
                ${isPositive ? '▲' : '▼'} ${Math.abs(stock.regularMarketChangePercent).toFixed(2)}%
            </span>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <p class="text-gray-400">Price</p>
                <p class="price text-lg font-semibold">${formatCurrency(stock.regularMarketPrice)}</p>
            </div>
            <div>
                <p class="text-gray-400">Change</p>
                <p class="change text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}">
                    ${formatCurrency(stock.regularMarketChange)}
                </p>
            </div>
            <div>
                <p class="text-gray-400">Volume</p>
                <p class="volume text-lg font-semibold">${formatNumber(stock.regularMarketVolume)}</p>
            </div>
            <div>
                <p class="text-gray-400">Currency</p>
                <p class="text-lg font-semibold">${stock.currency}</p>
            </div>
        </div>
        <div class="mt-4 flex justify-end space-x-2">
            <button onclick="addToWatchlist('${stock.symbol}')" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                Add to Watchlist
            </button>
            <a href="trading.html?symbol=${stock.symbol}" class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition">
                Trade
            </a>
        </div>
    `;
    
    return card;
}

// Search stocks
async function searchStocks(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('searchResults');
    const symbol = searchInput.value.trim().toUpperCase();
    
    if (!symbol) return;
    
    try {
        const stockData = await getStockData(symbol);
        const card = createStockCard(stockData);
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(card);
        
        // Start live updates
        startLiveUpdates(symbol);
        
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="text-center text-red-500 p-4">
                ${error.message || 'Error finding stock. Please try again.'}
            </div>
        `;
    }
}

// Live updates
function startLiveUpdates(symbol) {
    // Store interval ID with the symbol
    if (window.liveUpdates) {
        if (window.liveUpdates[symbol]) {
            clearInterval(window.liveUpdates[symbol]);
        }
    } else {
        window.liveUpdates = {};
    }
    
    // Update immediately
    updateStockPrice(symbol);
    
    // Set up interval for updates
    window.liveUpdates[symbol] = setInterval(() => updateStockPrice(symbol), REFRESH_INTERVAL);
}

// Update stock price
async function updateStockPrice(symbol) {
    try {
        const stockData = await getStockData(symbol);
        const card = document.querySelector(`[data-symbol="${symbol}"]`);
        if (card) {
            updateStockCard(card, stockData);
        }
    } catch (error) {
        console.error(`Error updating ${symbol}:`, error);
    }
}

// Stop live updates
function stopLiveUpdates(symbol) {
    if (window.liveUpdates && window.liveUpdates[symbol]) {
        clearInterval(window.liveUpdates[symbol]);
        delete window.liveUpdates[symbol];
    }
}

// Loading indicator
function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', searchStocks);
    }
    
    // Clean up intervals when leaving the page
    window.addEventListener('beforeunload', () => {
        if (window.liveUpdates) {
            Object.keys(window.liveUpdates).forEach(symbol => {
                stopLiveUpdates(symbol);
            });
        }
    });
});
