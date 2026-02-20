import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://yourbooks-backend.onrender.com/api/auth/signup', { username, password });
      // Once registered, send them to login
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', color: '#fff' }}>
      <div style={{ background: '#1e1e1e', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #2a2a2a', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Create Account</h2>
        {error && <p style={{ color: '#ff4d4d', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Choose a Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#121212', color: '#fff', outline: 'none' }}
            required 
          />
          <input 
            type="password" 
            placeholder="Create a Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#121212', color: '#fff', outline: 'none' }}
            required 
          />
          <button type="submit" style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            Register
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          Already have an account? <Link to="/login" style={{ color: '#4a90e2', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;