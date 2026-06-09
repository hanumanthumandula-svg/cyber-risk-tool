import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">🛡️</span>
          <span className="logo-text">CyberRisk Assessor</span>
        </div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/assets">New Assessment</Link>
          <Link to="/auto-assessment">AI Assessment</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;