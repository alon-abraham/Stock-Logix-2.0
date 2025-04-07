// Finnhub API configuration
const FINNHUB_API_KEY = 'cvojalpr01qihjtp2lo0cvojalpr01qihjtp2log';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Mock data for fallback
const mockStockData = {
    AAPL: { c: 175.34, dp: 2.5, v: 85000000 },
    MSFT: { c: 380.45, dp: 2.1, v: 45000000 },
    GOOGL: { c: 142.56, dp: 1.8, v: 32000000 }
};

// Mock news data for fallback
const mockNews = [
    {
        headline: 'Markets Continue to Show Strength',
        summary: 'Major indices show positive momentum as tech stocks lead the rally.',
        image: 'assets/news-placeholder.jpg',
        url: '#'
    },
    {
        headline: 'Federal Reserve Maintains Current Policy',
        summary: 'Central bank keeps interest rates steady as economy shows signs of stability.',
        image: 'assets/news-placeholder.jpg',
        url: '#'
    }
];

// Format large numbers
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

// Initialize the stock chart
function initializeChart() {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return null;

    // Set chart dimensions
    ctx.style.height = '300px'; // Reduced height
    ctx.style.width = '100%';

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 20 }, (_, i) => i + 1),
            datasets: [{
                label: 'AAPL Stock Price',
                data: Array.from({ length: 20 }, () => Math.random() * 10 + 170),
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
                    },
                    ticks: {
                        maxTicksLimit: 10 // Limit the number of x-axis labels
                    }
                },
                y: {
                    grid: {
                        color: '#2A2D35'
                    },
                    ticks: {
                        maxTicksLimit: 6 // Limit the number of y-axis labels
                    }
                }
            }
        }
    });

    return chart;
}

// Fetch stock data with error handling
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
        return mockStockData[symbol] || { c: 0, dp: 0, v: 0 };
    }
}

// Fetch company profile with error handling
async function fetchCompanyProfile(symbol) {
    try {
        const response = await fetch(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn(`Error fetching profile for ${symbol}:`, error);
        return { name: symbol, logo: 'assets/stock-placeholder.png' };
    }
}

// Update market overview
async function updateMarketOverview() {
    const container = document.getElementById('marketOverview');
    if (!container) {
        console.warn('Market overview container not found');
        return;
    }

    const symbols = ['AAPL', 'MSFT', 'GOOGL'];
    container.innerHTML = '';

    try {
        for (const symbol of symbols) {
            const stockData = await fetchStockData(symbol); // Use fetchStockData instead of mock data
            const profile = await fetchCompanyProfile(symbol); // Use fetchCompanyProfile instead of mock profile
            
            const card = document.createElement('div');
            card.className = 'stock-card';
            
            card.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-semibold">${profile.name}</h3>
                        <span class="text-sm text-gray-400">${symbol}</span>
                    </div>
                    <img src="${profile.logo}" alt="${profile.name}" class="h-8 w-8" onerror="this.src='assets/stock-placeholder.png'">
                </div>
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-2xl font-bold">$${stockData.c.toFixed(2)}</p>
                        <p class="${stockData.dp >= 0 ? 'price-up' : 'price-down'}">
                            ${stockData.dp >= 0 ? '+' : ''}${stockData.dp.toFixed(2)}%
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-400">Volume</p>
                        <p class="text-sm">${formatNumber(stockData.v)}</p>
                    </div>
                </div>
            `;

            container.appendChild(card);
        }
    } catch (error) {
        console.error('Error updating market overview:', error);
        // Display mock data as fallback
        container.innerHTML = Object.entries(mockStockData).map(([symbol, data]) => `
            <div class="stock-card">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-semibold">${symbol}</h3>
                        <span class="text-sm text-gray-400">${symbol}</span>
                    </div>
                    <img src="assets/stock-placeholder.png" alt="${symbol}" class="h-8 w-8">
                </div>
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-2xl font-bold">$${data.c.toFixed(2)}</p>
                        <p class="${data.dp >= 0 ? 'price-up' : 'price-down'}">
                            ${data.dp >= 0 ? '+' : ''}${data.dp.toFixed(2)}%
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-400">Volume</p>
                        <p class="text-sm">${formatNumber(data.v)}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Update market news
async function updateMarketNews() {
    const container = document.getElementById('marketNews');
    if (!container) {
        console.warn('Market news container not found');
        return;
    }

    try {
        // Use mock news data directly
        container.innerHTML = mockNews.map(article => `
            <div class="news-card">
                <img src="${article.image}" alt="${article.headline}" onerror="this.src='assets/news-placeholder.jpg'">
                <div class="p-4">
                    <h3 class="font-semibold mb-2">${article.headline}</h3>
                    <p class="text-gray-400 text-sm mb-4">${article.summary}</p>
                    <a href="${article.url}" target="_blank" class="text-blue-500 hover:text-blue-400 text-sm">Read More →</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating market news:', error);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    const chart = initializeChart();
    
    // Initial load
    await Promise.all([
        updateMarketOverview(),
        updateMarketNews()
    ]);

    // Update data periodically
    setInterval(async () => {
        await Promise.all([
            updateMarketOverview(),
            updateMarketNews()
        ]);
    }, 30000); // Update every 30 seconds
});
