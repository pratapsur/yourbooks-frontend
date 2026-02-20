import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReadingPage from './pages/ReadingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css'; // We'll keep the base styles

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* App Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/read" element={<ReadingPage />} />
      </Routes>
    </Router>
  );
}

export default App;