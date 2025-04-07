// API configuration
const TWELVE_DATA_API_KEY = 'd9c5b739f99f41b5865d50188a09d268';
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

// Format numbers
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

// Load watchlist
async function loadWatchlist() {
    if (!localStorage.getItem('user')) {
        document.getElementById('watchlistTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    Please <a href="login.html" class="text-blue-500 hover:text-blue-400">log in</a> 
                    to view your watchlist
                </td>
            </tr>
        `;
        return;
    }

    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (watchlist.length === 0) {
        document.getElementById('watchlistTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    Your watchlist is empty. Add stocks from the 
                    <a href="market.html" class="text-blue-500 hover:text-blue-400">market page</a>
                </td>
            </tr>
        `;
        return;
    }

    try {
        const promises = watchlist.map(symbol => 
            fetch(`${TWELVE_DATA_BASE_URL}/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`)
                .then(res => res.json())
        );

        const results = await Promise.all(promises);
        const tableBody = document.getElementById('watchlistTable');
        tableBody.innerHTML = '';

        results.forEach(data => {
            if (data.status === 'error') return;

            const row = document.createElement('tr');
            const change = parseFloat(data.percent_change);
            const price = parseFloat(data.close);

            row.innerHTML = `
                <td class="py-4">
                    <div class="font-semibold">${data.symbol}</div>
                    <div class="text-sm text-gray-400">${data.name || data.symbol}</div>
                </td>
                <td class="py-4">$${price.toFixed(2)}</td>
                <td class="py-4">
                    <span class="${change >= 0 ? 'text-green-500' : 'text-red-500'}">
                        ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                    </span>
                </td>
                <td class="py-4">${formatNumber(data.volume)}</td>
                <td class="py-4">
                    <button onclick="removeFromWatchlist('${data.symbol}')"
                        class="text-red-500 hover:text-red-400">
                        Remove
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading watchlist:', error);
        document.getElementById('watchlistTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-red-500">
                    Error loading watchlist. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Add stock to watchlist
async function addStock() {
    const input = document.getElementById('stockInput');
    const symbol = input.value.trim().toUpperCase();

    if (!symbol) {
        alert('Please enter a stock symbol');
        return;
    }

    if (!localStorage.getItem('user')) {
        alert('Please log in to add stocks to your watchlist');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Verify stock exists
        const response = await fetch(`${TWELVE_DATA_BASE_URL}/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`);
        const data = await response.json();

        if (data.status === 'error') {
            alert('Invalid stock symbol. Please try again.');
            return;
        }

        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        if (watchlist.includes(symbol)) {
            alert('Stock is already in your watchlist');
            return;
        }

        watchlist.push(symbol);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        input.value = '';
        
        loadWatchlist();
    } catch (error) {
        console.error('Error adding stock:', error);
        alert('Error adding stock. Please try again.');
    }
}

// Remove stock from watchlist
function removeFromWatchlist(symbol) {
    try {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        const index = watchlist.indexOf(symbol);
        if (index > -1) {
            watchlist.splice(index, 1);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            loadWatchlist();
        }
    } catch (error) {
        console.error('Error removing stock:', error);
        alert('Error removing stock. Please try again.');
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load initial watchlist
    loadWatchlist();

    // Set up add stock functionality
    const stockInput = document.getElementById('stockInput');
    const addButton = document.getElementById('addStock');

    if (stockInput && addButton) {
        stockInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addStock();
            }
        });

        addButton.addEventListener('click', addStock);
    }

    // Update watchlist data periodically
    setInterval(loadWatchlist, 60000); // Every minute
});
