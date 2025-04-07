// Constants
const API_BASE_URL = 'http://localhost:5000/api';

// Login function
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store user info in localStorage
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('isLoggedIn', 'true');

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Signup function
async function signup(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        // Store user info in localStorage
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('isLoggedIn', 'true');

        return data;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login.html';
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Get current user
function getCurrentUser() {
    return localStorage.getItem('userId');
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await login(email, password);
                window.location.href = '/index.html';
            } catch (error) {
                alert(error.message);
            }
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await signup(email, password);
                window.location.href = '/index.html';
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Check if user is logged in on protected pages
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('signup.html')) {
        if (!isLoggedIn()) {
            window.location.href = '/login.html';
        }
    }
});
