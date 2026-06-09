import './styles/App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import AutoAssessment from './pages/AutoAssessment';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auto-assessment" element={<AutoAssessment />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;