import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-container">
      <div className="hero">
        <h1>Cybersecurity Risk Assessment Tool</h1>
        <p>Enter your company name and industry — AI instantly generates a complete cybersecurity risk report with threats, scores, compliance status and recommendations.</p>
        <button className="btn-primary" onClick={() => navigate('/auto-assessment')}>
          ⚡ Start AI Assessment →
        </button>
      </div>
      <div className="features">
        <div className="feature-card"><span>🤖</span><h3>AI Powered</h3><p>Groq AI analyzes and generates full report instantly</p></div>
        <div className="feature-card"><span>📊</span><h3>Risk Scoring</h3><p>Overall score with 8 domain breakdown</p></div>
        <div className="feature-card"><span>⚠️</span><h3>Threat Analysis</h3><p>Top 5 threats identified for your industry</p></div>
        <div className="feature-card"><span>🗺️</span><h3>Compliance</h3><p>ISO 27001, NIST, PCI DSS, GDPR status</p></div>
        <div className="feature-card"><span>✅</span><h3>Recommendations</h3><p>Top 5 actionable fixes prioritized by risk</p></div>
        <div className="feature-card"><span>💾</span><h3>Save Reports</h3><p>All reports saved to cloud database</p></div>
      </div>
    </div>
  );
}

export default Home;