// Constants
const API_BASE_URL = 'http://localhost:5000/api';
let priceChart = null;

// Format number as currency
function formatCurrency(number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(number);
}

// Format percentage
function formatPercentage(number) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number / 100);
}

// Update technical indicators
function updateTechnicalIndicators(data) {
    // Update RSI
    const rsiIndicator = document.getElementById('rsiIndicator');
    if (rsiIndicator) {
        const rsiValue = data.rsi;
        let rsiClass = 'text-yellow-500';
        let rsiText = 'Neutral';
        
        if (rsiValue >= 70) {
            rsiClass = 'text-red-500';
            rsiText = 'Overbought';
        } else if (rsiValue <= 30) {
            rsiClass = 'text-green-500';
            rsiText = 'Oversold';
        }
        
        rsiIndicator.innerHTML = `
            <div class="text-2xl font-bold ${rsiClass}">${rsiValue.toFixed(2)}</div>
            <div class="text-sm ${rsiClass}">${rsiText}</div>
            <div class="text-sm text-gray-400">Relative Strength Index</div>
        `;
    }
    
    // Update MACD
    const macdIndicator = document.getElementById('macdIndicator');
    if (macdIndicator) {
        const macdValue = data.macd;
        const macdClass = macdValue >= 0 ? 'text-green-500' : 'text-red-500';
        const macdText = macdValue >= 0 ? 'Bullish' : 'Bearish';
        
        macdIndicator.innerHTML = `
            <div class="text-2xl font-bold ${macdClass}">${macdValue.toFixed(2)}</div>
            <div class="text-sm ${macdClass}">${macdText}</div>
            <div class="text-sm text-gray-400">MACD</div>
        `;
    }
    
    // Update Moving Averages
    const maIndicator = document.getElementById('maIndicator');
    if (maIndicator) {
        const sma20 = data.sma_20;
        const sma50 = data.sma_50;
        const maClass = sma20 > sma50 ? 'text-green-500' : 'text-red-500';
        const maText = sma20 > sma50 ? 'Bullish' : 'Bearish';
        
        maIndicator.innerHTML = `
            <div class="text-2xl font-bold ${maClass}">
                ${formatCurrency(sma20)}
            </div>
            <div class="text-sm ${maClass}">${maText}</div>
            <div class="text-sm text-gray-400">SMA 20 vs SMA 50</div>
        `;
    }
}

// Update price chart
function updatePriceChart(data) {
    const ctx = document.getElementById('priceChart');
    
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (priceChart) {
        priceChart.destroy();
    }
    
    // Create new chart
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: 'Historical Price',
                    data: data.historical_prices,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true
                },
                {
                    label: 'Predicted Price',
                    data: data.predicted_prices,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#9CA3AF'
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(75, 85, 99, 0.2)'
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(75, 85, 99, 0.2)'
                    },
                    ticks: {
                        color: '#9CA3AF',
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
}

// Update prediction display
function updatePredictionDisplay(data) {
    // Update current price
    const currentPrice = document.getElementById('currentPrice');
    if (currentPrice) {
        currentPrice.innerHTML = `
            <div class="text-2xl font-bold">${formatCurrency(data.current_price)}</div>
            <div class="text-sm text-gray-400">Current Price</div>
        `;
    }
    
    // Update predicted price
    const predictedPrice = document.getElementById('predictedPrice');
    if (predictedPrice) {
        const priceChange = data.predicted_price - data.current_price;
        const percentChange = (priceChange / data.current_price) * 100;
        const changeClass = priceChange >= 0 ? 'text-green-500' : 'text-red-500';
        
        predictedPrice.innerHTML = `
            <div class="text-2xl font-bold">${formatCurrency(data.predicted_price)}</div>
            <div class="text-sm ${changeClass}">
                ${priceChange >= 0 ? '▲' : '▼'} ${formatCurrency(Math.abs(priceChange))} (${formatPercentage(percentChange)})
            </div>
            <div class="text-sm text-gray-400">Predicted for ${data.prediction_date}</div>
        `;
    }
    
    // Update technical indicators and chart
    updateTechnicalIndicators(data);
    updatePriceChart(data);
}

// Show error message
function showError(message) {
    ['currentPrice', 'predictedPrice', 'rsiIndicator', 'macdIndicator', 'maIndicator'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = `
                <div class="text-xl text-red-500">Error</div>
                <div class="text-sm text-red-500">${message}</div>
                <div class="text-sm text-gray-400">--</div>
            `;
        }
    });
    
    // Clear chart
    if (priceChart) {
        priceChart.destroy();
        priceChart = null;
    }
}

// Get stock prediction
async function getPrediction(symbol) {
    try {
        const response = await fetch(`${API_BASE_URL}/predict/${symbol}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get prediction');
        }
        
        updatePredictionDisplay(data);
        return data;
    } catch (error) {
        console.error('Prediction error:', error);
        showError(error.message);
        return null;
    }
}

// Initialize prediction page
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const symbolInput = document.getElementById('symbolInput');
    
    if (searchForm && symbolInput) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const symbol = symbolInput.value.trim().toUpperCase();
            if (symbol) {
                // Show loading state
                ['currentPrice', 'predictedPrice', 'rsiIndicator', 'macdIndicator', 'maIndicator'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.innerHTML = `
                            <div class="text-2xl font-bold">Loading...</div>
                            <div class="text-sm text-gray-400">Please wait</div>
                        `;
                    }
                });
                
                await getPrediction(symbol);
            }
        });
    }
});
