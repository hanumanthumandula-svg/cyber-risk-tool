import './styles/App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import AssetSelection from './pages/AssetSelection';
import Questionnaire from './pages/Questionnaire';
import RiskScore from './pages/RiskScore';
import Report from './pages/Report';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/assets" element={<AssetSelection />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/riskscore" element={<RiskScore />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
