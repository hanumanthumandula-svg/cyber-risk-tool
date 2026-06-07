import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="hero">
        <h1>Cybersecurity Risk Assessment Tool</h1>
        <p>Identify, assess, and manage cybersecurity risks in your organization with our comprehensive risk assessment framework.</p>
        <button className="btn-primary" onClick={() => navigate('/assets')}>
          Start Assessment →
        </button>
      </div>
      <div className="features">
        <div className="feature-card">
          <span>🔍</span>
          <h3>Asset Identification</h3>
          <p>Identify all IT assets in your organization</p>
        </div>
        <div className="feature-card">
          <span>📊</span>
          <h3>Risk Scoring</h3>
          <p>Get detailed risk scores across 8 control domains</p>
        </div>
        <div className="feature-card">
          <span>📋</span>
          <h3>Risk Report</h3>
          <p>Generate comprehensive remediation reports</p>
        </div>
        <div className="feature-card">
          <span>🛡️</span>
          <h3>Recommendations</h3>
          <p>Get actionable security recommendations</p>
        </div>
      </div>
    </div>
  );
}

export default Home;