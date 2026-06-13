import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-container">
      <div className="hero">
        <h1>Cybersecurity Risk Assessment Tool</h1>
        <p>Enter any domain or IP address — instantly get a complete real-time security scan with SSL, port analysis, threat detection, and AI-powered recommendations.</p>
        <button className="btn-primary" onClick={() => navigate('/auto-assessment')}>
          🔍 Start Security Scan →
        </button>
      </div>

      <div className="features">
        <div className="feature-card" onClick={() => navigate('/auto-assessment')} style={{ cursor: 'pointer' }}>
          <span>🔍</span>
          <h3>Domain & IP Scanner</h3>
          <p>Scan any public domain or IP for real-time security vulnerabilities</p>
        </div>
        <div className="feature-card" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>
          <span>📈</span>
          <h3>Risk Score History</h3>
          <p>View trends and history of all past scans with charts</p>
        </div>
        <div className="feature-card">
          <span>🤖</span>
          <h3>AI Powered Analysis</h3>
          <p>Groq AI reads scan results and generates threat report instantly</p>
        </div>
        <div className="feature-card">
          <span>📊</span>
          <h3>Risk Scoring</h3>
          <p>Automated score out of 100 with detailed breakdown</p>
        </div>
        <div className="feature-card">
          <span>⚠️</span>
          <h3>Threat Analysis</h3>
          <p>SSL, open ports, missing headers, DNS issues detected</p>
        </div>
        <div className="feature-card">
          <span>📧</span>
          <h3>Email Reports</h3>
          <p>Get full scan reports delivered to your email instantly</p>
        </div>
        <div className="feature-card">
          <span>🔥</span>
          <h3>Risk Heat Matrix</h3>
          <p>Visual color-coded matrix showing your security posture</p>
        </div>
        <div className="feature-card">
          <span>🚫</span>
          <h3>Auto URL Blocking</h3>
          <p>High and Critical risk URLs are automatically blocked</p>
        </div>
      </div>
    </div>
  );
}

export default Home;