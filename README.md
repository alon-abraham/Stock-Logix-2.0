# Stock Logix 2.0 🚀

A modern web application for real-time stock market tracking, analysis, and trading simulation.

## Features ✨

- **Real-Time Stock Data**: Live stock prices and market data powered by Twelve Data API
- **Interactive Market Page**: View and search stocks with dynamic price updates
- **Trading Simulation**: Practice trading with virtual money
- **Stock Analysis**: Technical analysis and price predictions
- **Responsive Design**: Modern UI that works on desktop and mobile devices

## Tech Stack 🛠️

- **Frontend**: HTML, JavaScript, Tailwind CSS
- **Backend**: Python, Flask
- **APIs**: Twelve Data API for real-time market data
- **Data Analysis**: Machine Learning models for price predictions

## Getting Started 🚀

### Prerequisites

- Python 3.8 or higher
- Node.js and npm (for development)
- Twelve Data API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stock-logix-2.0.git
cd stock-logix-2.0
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your Twelve Data API key:
- Sign up at [Twelve Data](https://twelvedata.com/)
- Copy your API key
- Replace the API key in `app.py` and `js/market.js`

4. Start the Flask server:
```bash
python app.py
```

5. Open `index.html` in your browser

## Usage 📈

### Market Page
- Search for stocks using their ticker symbols
- View real-time price updates
- Add stocks to your watchlist
- Click "Trade" to simulate buying/selling

### Trading Page
- View your portfolio
- Execute simulated trades
- Track your transaction history
- Monitor your virtual balance

### Analysis Page
- View technical indicators
- Check price predictions
- Analyze historical data

## Project Structure 📁

```
stock-logix-2.0/
├── app.py              # Flask backend
├── requirements.txt    # Python dependencies
├── index.html         # Main entry point
├── js/
│   ├── market.js      # Market page functionality
│   ├── trading.js     # Trading functionality
│   └── prediction.js  # Analysis and predictions
└── static/
    └── css/
        └── styles.css # Custom styles
```

## API Integration 🔌

The application uses the Twelve Data API for real-time market data. Key endpoints:

- `/api/stock/{symbol}`: Get real-time stock data
- `/api/watchlist`: Manage watchlist
- `/api/trade`: Execute trades
- `/api/predict`: Get price predictions

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [Twelve Data](https://twelvedata.com/) for providing market data
- [Tailwind CSS](https://tailwindcss.com/) for the UI framework
- [Flask](https://flask.palletsprojects.com/) for the backend framework

## Support 💬

For support, please open an issue in the repository or contact the maintainers.
