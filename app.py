from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import requests
from blockchain import Blockchain
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API configuration
TWELVE_DATA_API_KEY = '9abb61c72cf9458a9f6b8cc9f308b2c1'
TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com'

app = Flask(__name__)
CORS(app)

# Configure Flask app
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key')

# Initialize blockchain
blockchain = Blockchain(difficulty=4)

# In-memory storage (replace with database in production)
users = {}
watchlists = {}
models = {}
market_cache = {'last_update': None, 'data': {}, 'movers': []}

def prepare_stock_data(symbol):
    try:
        # Get historical data
        stock = yf.Ticker(symbol)
        hist = stock.history(period='1y')
        
        if hist.empty:
            raise ValueError(f"No data found for symbol {symbol}")
            
        # Create features
        hist['SMA_5'] = hist['Close'].rolling(window=5).mean()
        hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
        hist['RSI'] = calculate_rsi(hist['Close'])
        hist['MACD'] = calculate_macd(hist['Close'])
        hist['Target'] = hist['Close'].shift(-1)  # Next day's price
        
        # Drop NaN values
        hist = hist.dropna()
        
        return hist
    except Exception as e:
        print(f"Error preparing data for {symbol}: {str(e)}")
        return None

def calculate_rsi(prices, period=14):
    """Calculate RSI technical indicator"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_macd(prices, fast=12, slow=26, signal=9):
    """Calculate MACD technical indicator"""
    exp1 = prices.ewm(span=fast, adjust=False).mean()
    exp2 = prices.ewm(span=slow, adjust=False).mean()
    macd = exp1 - exp2
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    return macd - signal_line

def calculate_sma(prices, window):
    """Calculate Simple Moving Average"""
    return prices.rolling(window=window).mean()

def train_model(symbol):
    try:
        # Prepare data
        hist = prepare_stock_data(symbol)
        if hist is None:
            return None
            
        # Features for prediction
        features = ['Open', 'High', 'Low', 'Close', 'Volume', 'SMA_5', 'SMA_20', 'RSI', 'MACD']
        X = hist[features]
        y = hist['Target']
        
        # Scale the features
        scaler = MinMaxScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        
        # Train model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Store model and scaler
        models[symbol] = {
            'model': model,
            'scaler': scaler,
            'features': features,
            'last_update': datetime.now()
        }
        
        return model
    except Exception as e:
        print(f"Error training model for {symbol}: {str(e)}")
        return None

@app.route('/api/predict/<symbol>')
def predict_stock(symbol):
    try:
        symbol = symbol.upper()
        
        # Check if we need to train/retrain the model
        if symbol not in models or \
           (datetime.now() - models[symbol]['last_update']) > timedelta(days=1):
            model = train_model(symbol)
            if model is None:
                return jsonify({'error': f'Could not train model for {symbol}'}), 400
        
        # Get latest data for prediction
        stock = yf.Ticker(symbol)
        latest = stock.history(period='2d')
        
        if latest.empty:
            return jsonify({'error': f'No data found for {symbol}'}), 404
            
        # Prepare features
        latest['SMA_5'] = latest['Close'].rolling(window=5).mean()
        latest['SMA_20'] = latest['Close'].rolling(window=20).mean()
        latest['RSI'] = calculate_rsi(latest['Close'])
        latest['MACD'] = calculate_macd(latest['Close'])
        
        # Get the most recent complete data point
        current_data = latest.iloc[-1]
        features = models[symbol]['features']
        X = pd.DataFrame([current_data[features]])
        
        # Scale features
        X_scaled = models[symbol]['scaler'].transform(X)
        
        # Make prediction
        prediction = models[symbol]['model'].predict(X_scaled)[0]
        
        # Get historical data
        hist = prepare_stock_data(symbol)
        
        # Calculate technical indicators
        hist['RSI'] = calculate_rsi(hist['Close'])
        hist['MACD'] = calculate_macd(hist['Close'])
        hist['SMA_20'] = calculate_sma(hist['Close'], 20)
        hist['SMA_50'] = calculate_sma(hist['Close'], 50)
        
        # Get latest values for technical indicators
        latest = hist.iloc[-1]
        
        # Get dates for chart
        dates = hist.index[-30:].strftime('%Y-%m-%d').tolist()
        historical_prices = hist['Close'][-30:].tolist()
        predicted_prices = historical_prices[:-1] + [prediction]
        
        return jsonify({
            'symbol': symbol,
            'current_price': float(current_data['Close']),
            'predicted_price': float(prediction),
            'prediction_date': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            
            # Technical indicators
            'rsi': float(latest['RSI']),
            'macd': float(latest['MACD']),
            'sma_20': float(latest['SMA_20']),
            'sma_50': float(latest['SMA_50']),
            
            # Chart data
            'dates': dates,
            'historical_prices': historical_prices,
            'predicted_prices': predicted_prices
        })
        
    except Exception as e:
        print(f"Error making prediction for {symbol}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/<symbol>')
def get_stock_data(symbol):
    """Get stock data from Twelve Data API"""
    try:
        # Get real-time quote
        url = f"{TWELVE_DATA_BASE_URL}/quote?symbol={symbol}&apikey={TWELVE_DATA_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if 'code' in data:
            return jsonify({'error': data.get('message', 'Stock not found')}), 404
            
        # Format response
        stock_data = {
            'symbol': symbol.upper(),
            'shortName': data.get('name', symbol),
            'regularMarketPrice': float(data.get('close', 0)),
            'regularMarketChange': float(data.get('change', 0)),
            'regularMarketChangePercent': float(data.get('percent_change', 0)),
            'regularMarketVolume': int(float(data.get('volume', 0))),
            'regularMarketOpen': float(data.get('open', 0)),
            'regularMarketDayHigh': float(data.get('high', 0)),
            'regularMarketDayLow': float(data.get('low', 0)),
            'currency': data.get('currency', 'USD')
        }
        
        return jsonify(stock_data)
        
    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {str(e)}")
        return jsonify({'error': 'Error finding stock. Please try again.'}), 500

@app.route('/api/quote')
def get_stock_quote():
    """Get real-time stock quote from Twelve Data"""
    try:
        symbol = request.args.get('symbol')
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
            
        url = f"{TWELVE_DATA_BASE_URL}/quote?symbol={symbol}&apikey={TWELVE_DATA_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if 'code' in data:
            return jsonify({'error': data.get('message', 'Stock not found')}), 404
            
        quote_data = {
            'symbol': symbol.upper(),
            'price': float(data.get('close', 0)),
            'change': float(data.get('percent_change', 0)),
            'volume': int(float(data.get('volume', 0)))
        }
        
        return jsonify(quote_data)
        
    except Exception as e:
        print(f"Error fetching quote: {str(e)}")
        return jsonify({'error': 'Error fetching quote'}), 500

@app.route('/api/time_series')
def get_time_series():
    """Get historical time series data from Twelve Data"""
    try:
        symbol = request.args.get('symbol')
        interval = request.args.get('interval', '1day')
        outputsize = request.args.get('outputsize', '30')
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
            
        url = f"{TWELVE_DATA_BASE_URL}/time_series?symbol={symbol}&interval={interval}&outputsize={outputsize}&apikey={TWELVE_DATA_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if 'code' in data:
            return jsonify({'error': data.get('message', 'No data found')}), 404
            
        values = data.get('values', [])
        time_series_data = {
            'dates': [item['datetime'] for item in values],
            'prices': [float(item['close']) for item in values],
            'volumes': [int(float(item['volume'])) for item in values]
        }
        
        return jsonify(time_series_data)
        
    except Exception as e:
        print(f"Error fetching time series: {str(e)}")
        return jsonify({'error': 'Error fetching time series'}), 500

@app.route('/api/user/transactions', methods=['GET'])
def get_user_transactions():
    """Get user transactions"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        transactions = blockchain.get_transactions(user_id)
        return jsonify(transactions)
    except Exception as e:
        print(f"Error getting transactions: {str(e)}")
        return jsonify({'error': 'Failed to get transactions'}), 500

@app.route('/api/user/transactions', methods=['POST'])
def add_user_transaction():
    """Add a new transaction"""
    try:
        data = request.json
        required_fields = ['symbol', 'type', 'quantity', 'price']
        
        # Validate required fields
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Add transaction to blockchain
        transaction = {
            'symbol': data['symbol'].upper(),
            'type': data['type'].lower(),
            'quantity': float(data['quantity']),
            'price': float(data['price']),
            'timestamp': datetime.now().timestamp(),
            'user_id': data.get('user_id', 'anonymous'),
            'status': 'completed'
        }
        
        # Add to blockchain
        result = blockchain.add_transaction(transaction)
        
        return jsonify({
            'message': 'Transaction added successfully',
            'transaction': transaction,
            'block_hash': result
        })
        
    except Exception as e:
        print(f"Error adding transaction: {str(e)}")
        return jsonify({'error': 'Failed to add transaction'}), 500

@app.route('/api/user/transactions/<tx_hash>')
def get_user_transaction(tx_hash):
    """Get transaction details by hash"""
    try:
        transaction = blockchain.get_transaction(tx_hash)
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
            
        return jsonify(transaction)
        
    except Exception as e:
        print(f"Error getting transaction: {str(e)}")
        return jsonify({'error': 'Failed to get transaction'}), 500

# Serve static files
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Blockchain endpoints
@app.route('/api/blockchain/transaction', methods=['POST'])
def add_transaction():
    data = request.get_json()
    required_fields = ["symbol", "type", "quantity", "price", "trader"]
    
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    success = blockchain.add_transaction({
        "symbol": data["symbol"],
        "type": data["type"],
        "quantity": float(data["quantity"]),
        "price": float(data["price"]),
        "trader": data["trader"]
    })

    if success:
        # Mine the block immediately for simplicity
        block = blockchain.mine_pending_transactions(data["trader"])
        return jsonify({
            "message": "Transaction added and block mined",
            "block_hash": block.hash,
            "block_index": block.index
        }), 201
    else:
        return jsonify({"error": "Failed to add transaction"}), 400

@app.route('/api/blockchain/transactions', methods=['GET'])
def get_transactions():
    trader = request.args.get('trader')
    if trader:
        transactions = blockchain.get_trader_transactions(trader)
    else:
        transactions = blockchain.get_all_transactions()
    return jsonify(transactions)

@app.route('/api/blockchain/status', methods=['GET'])
def get_blockchain_status():
    return jsonify({
        "chain_length": len(blockchain.chain),
        "pending_transactions": len(blockchain.pending_transactions),
        "is_valid": blockchain.is_chain_valid(),
        "mining_difficulty": blockchain.difficulty,
        "mining_reward": blockchain.mining_reward
    })

# Authentication routes
@app.route('/api/auth/login', methods=['POST'])
def handle_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    if email not in users:
        return jsonify({'error': 'User not found'}), 404
    
    if users[email]['password'] != password:
        return jsonify({'error': 'Invalid password'}), 401
    
    return jsonify({
        'message': 'Login successful',
        'userId': email
    })

@app.route('/api/auth/signup', methods=['POST'])
def handle_signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    if email in users:
        return jsonify({'error': 'User already exists'}), 409
    
    users[email] = {
        'password': password,
        'created_at': datetime.now()
    }
    
    return jsonify({
        'message': 'Signup successful',
        'userId': email
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
