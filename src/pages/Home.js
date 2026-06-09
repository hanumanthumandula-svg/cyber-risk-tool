import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="hero">
        <h1>Cybersecurity Risk Assessment Tool</h1>
        <p>Instantly assess cybersecurity risks for any asset using AI. Get threat analysis, compliance mapping, and actionable recommendations in seconds.</p>
        <button className="btn-primary" onClick={() => navigate('/auto-assessment')}>
          ⚡ Start AI Assessment →
        </button>
      </div>
      <div className="features">
        <div className="feature-card">
          <span>🤖</span>
          <h3>AI-Powered Analysis</h3>
          <p>Claude AI analyzes your asset and generates instant risk insights</p>
        </div>
        <div className="feature-card">
          <span>📊</span>
          <h3>Risk Scoring</h3>
          <p>Inherent and residual risk scores with 5×5 heat map</p>
        </div>
        <div className="feature-card">
          <span>🗺️</span>
          <h3>Compliance Mapping</h3>
          <p>Mapped to ISO 27001, NIST CSF, IRDAI, PCI DSS and more</p>
        </div>
        <div className="feature-card">
          <span>📋</span>
          <h3>Treatment Plan</h3>
          <p>Avoid, Mitigate, Transfer or Accept — full 4-option plan</p>
        </div>
        <div className="feature-card">
          <span>⚠️</span>
          <h3>Threat Identification</h3>
          <p>5 key threats identified with severity ratings</p>
        </div>
        <div className="feature-card">
          <span>⬇️</span>
          <h3>Export Reports</h3>
          <p>Download JSON, copy to clipboard or print as PDF</p>
        </div>
      </div>
    </div>
  );
}

export default Home;