import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://yourbooks-backend.onrender.com/api/auth/login', { username, password });
      
      // Save the VIP Pass to local storage!
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      
      // Send them to the library
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', color: '#fff' }}>
      <div style={{ background: '#1e1e1e', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #2a2a2a', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Welcome Back</h2>
        {error && <p style={{ color: '#ff4d4d', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#121212', color: '#fff', outline: 'none' }}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#121212', color: '#fff', outline: 'none' }}
            required 
          />
          <button type="submit" style={{ padding: '12px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            Login to Library
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          Don't have an account? <Link to="/register" style={{ color: '#4a90e2', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;