import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in (from localStorage)
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (err) {
                console.error('Error parsing saved user:', err);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="app">
            {user ? (
                <Dashboard user={user} onLogout={handleLogout} />
            ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

export default App;
