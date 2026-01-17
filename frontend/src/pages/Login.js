import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8080/api/users/login', {
                username,
                password
            });

            // Simpan user info ke localStorage
            localStorage.setItem('user', JSON.stringify(response.data));
            onLoginSuccess(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Login gagal. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>IoT Dashboard</h1>
                    <p>Smart Farming Monitoring System</p>
                </div>

                <form onSubmit={handleLogin}>
                    <h2>Masuk</h2>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Masukkan username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Masukkan password"
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>

                <div className="demo-credentials">
                    <p><strong>Demo Credentials:</strong></p>
                    <p>Username: admin | Password: admin123</p>
                    <p>Username: kevin | Password: kevin123</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
