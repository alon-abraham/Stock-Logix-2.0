// Finnhub API configuration
const FINNHUB_API_KEY = 'cvojalpr01qihjtp2lo0cvojalpr01qihjtp2log';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Get stock symbol from URL
const urlParams = new URLSearchParams(window.location.search);
const symbol = urlParams.get('symbol');

if (!symbol) {
    window.location.href = 'market.html';
}

// Format numbers
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Initialize stock chart
function initializeChart(data = []) {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return null;

    // Generate mock data if no data provided
    const chartData = data.length > 0 ? data : Array.from({ length: 20 }, (_, i) => ({
        time: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
        value: Math.random() * 10 + 170
    }));

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.time.toLocaleDateString()),
            datasets: [{
                label: symbol,
                data: chartData.map(d => d.value),
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

// Fetch stock quote
async function fetchStockQuote() {
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
            c: 175.34,
            d: 4.38,
            dp: 2.5,
            h: 177.12,
            l: 173.45,
            o: 174.23,
            pc: 170.96,
            v: 85000000
        };
    }
}

// Fetch company profile
async function fetchCompanyProfile() {
    try {
        const response = await fetch(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn(`Using mock data for ${symbol} profile due to API error:`, error);
        return {
            name: symbol,
            logo: 'assets/stock-placeholder.png',
            finnhubIndustry: 'Technology',
            marketCapitalization: 2800000000000,
            peRatio: 28.5,
            weburl: '#'
        };
    }
}

// Fetch company news
async function fetchCompanyNews() {
    try {
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const response = await fetch(
            `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}` +
            `&from=${lastWeek.toISOString().split('T')[0]}` +
            `&to=${today.toISOString().split('T')[0]}` +
            `&token=${FINNHUB_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn(`Using mock news for ${symbol} due to API error:`, error);
        return [
            {
                headline: `${symbol} Reports Strong Quarterly Results`,
                summary: 'Company exceeds market expectations with robust growth in revenue and user base.',
                url: '#',
                image: 'assets/news-placeholder.jpg',
                datetime: Date.now()
            },
            {
                headline: `Analysts Remain Bullish on ${symbol}`,
                summary: 'Major investment firms maintain positive outlook citing strong market position.',
                url: '#',
                image: 'assets/news-placeholder.jpg',
                datetime: Date.now() - 24 * 60 * 60 * 1000
            }
        ];
    }
}

// Update stock info
async function updateStockInfo() {
    try {
        const [quote, profile] = await Promise.all([
            fetchStockQuote(),
            fetchCompanyProfile()
        ]);

        // Update header
        document.getElementById('companyName').textContent = profile.name;
        document.getElementById('companySymbol').textContent = symbol;
        document.getElementById('companyLogo').src = profile.logo;
        document.getElementById('companyLogo').onerror = function() {
            this.src = 'assets/stock-placeholder.png';
        };

        // Update price overview
        document.getElementById('currentPrice').textContent = formatCurrency(quote.c);
        document.getElementById('openPrice').textContent = formatCurrency(quote.o);
        document.getElementById('highPrice').textContent = formatCurrency(quote.h);
        document.getElementById('lowPrice').textContent = `Low: ${formatCurrency(quote.l)}`;
        document.getElementById('volume').textContent = formatNumber(quote.v);

        // Update price change
        const priceChange = document.getElementById('priceChange');
        priceChange.textContent = `${quote.dp >= 0 ? '+' : ''}${quote.dp.toFixed(2)}%`;
        priceChange.className = quote.dp >= 0 ? 'price-up' : 'price-down';

        // Update company info
        document.getElementById('industry').textContent = profile.finnhubIndustry;
        document.getElementById('marketCap').textContent = formatCurrency(profile.marketCapitalization * 1000000);
        document.getElementById('peRatio').textContent = profile.peRatio?.toFixed(2) || 'N/A';
        document.getElementById('yearHigh').textContent = formatCurrency(quote.h);
        document.getElementById('yearLow').textContent = formatCurrency(quote.l);

    } catch (error) {
        console.error('Error updating stock info:', error);
    }
}

// Update company news
async function updateCompanyNews() {
    try {
        const news = await fetchCompanyNews();
        const container = document.getElementById('companyNews');
        
        container.innerHTML = news.slice(0, 3).map(article => `
            <a href="${article.url}" target="_blank" class="block">
                <div class="news-card">
                    <img src="${article.image}" alt="${article.headline}" 
                         class="w-full h-48 object-cover rounded-t-lg"
                         onerror="this.src='assets/news-placeholder.jpg'">
                    <div class="p-4">
                        <h3 class="font-semibold mb-2">${article.headline}</h3>
                        <p class="text-gray-400 text-sm">${article.summary}</p>
                        <p class="text-blue-500 text-sm mt-2">Read More →</p>
                    </div>
                </div>
            </a>
        `).join('');
    } catch (error) {
        console.error('Error updating company news:', error);
    }
}

// Add to watchlist
function addToWatchlist() {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    if (!watchlist.some(item => item.symbol === symbol)) {
        watchlist.push({ symbol });
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        alert('Added to watchlist');
    } else {
        alert('Already in watchlist');
    }
}

// Show trade modal
function showTradeModal() {
    // Redirect to portfolio page with symbol parameter
    window.location.href = `portfolio.html?trade=${symbol}`;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    const chart = initializeChart();
    
    // Initial load
    await Promise.all([
        updateStockInfo(),
        updateCompanyNews()
    ]);

    // Set up button handlers
    document.getElementById('addToWatchlist').addEventListener('click', addToWatchlist);
    document.getElementById('trade').addEventListener('click', showTradeModal);

    // Set up chart filter handlers
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
        await updateStockInfo();
    }, 30000); // Update every 30 seconds
});
