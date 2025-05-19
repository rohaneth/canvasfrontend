import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './login.css';

const login = async (username, password) => {
  const response = await fetch('https://backendcanvas.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    window.location.href = '/canvas';
  } else {
    const error = new Error(data.error);
    error.info = data.info;
    throw error;
  }
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [usernameError, setUsernameError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUsernameError(null);
    setPasswordError(null);
    try {
      await login(username, password);
    } catch (err) {
      if (err.info) {
        const { username: usernameInfo, password: passwordInfo } = err.info;
        setUsernameError(usernameInfo);
        setPasswordError(passwordInfo);
      } else {
        setError(err);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        {error && (
          <div className="error-message">
            {"Username or password is incorrect"}
          </div>
        )}
        <form onSubmit= {handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {usernameError && (
              <div className="error-message">
                {usernameError}
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {passwordError && (
              <div className="error-message">
                {passwordError}
              </div>
            )}
          </div>
          <button type="submit" className="btn-login">
            Login
          </button>
          

        </form>
        <div className="register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
