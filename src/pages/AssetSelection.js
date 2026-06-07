import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const assets = [
  { id: 'webapp', label: 'Web Applications', icon: '🌐' },
  { id: 'database', label: 'Databases', icon: '🗄️' },
  { id: 'cloud', label: 'Cloud Infrastructure', icon: '☁️' },
  { id: 'endpoints', label: 'Endpoints / Laptops', icon: '💻' },
  { id: 'iam', label: 'Identity & Access Management', icon: '🔑' },
  { id: 'network', label: 'Network Devices', icon: '🌐' },
  { id: 'cicd', label: 'CI/CD Pipelines', icon: '⚙️' },
  { id: 'iot', label: 'IoT Devices', icon: '📡' },
  { id: 'email', label: 'Email Systems', icon: '📧' },
  { id: 'backup', label: 'Backup Systems', icon: '💾' },
];

function AssetSelection() {
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  const toggleAsset = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selected.length === 0) {
      alert('Please select at least one asset');
      return;
    }
    localStorage.setItem('selectedAssets', JSON.stringify(selected));
    navigate('/questionnaire');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Step 1 — Asset Identification</h2>
        <p>Select all IT assets that are in scope for this assessment</p>
      </div>
      <div className="assets-grid">
        {assets.map(asset => (
          <div
            key={asset.id}
            className={`asset-card ${selected.includes(asset.id) ? 'selected' : ''}`}
            onClick={() => toggleAsset(asset.id)}
          >
            <span className="asset-icon">{asset.icon}</span>
            <span className="asset-label">{asset.label}</span>
            {selected.includes(asset.id) && <span className="check">✓</span>}
          </div>
        ))}
      </div>
      <div className="button-row">
        <span>{selected.length} assets selected</span>
        <button className="btn-primary" onClick={handleNext}>
          Next: Questionnaire →
        </button>
      </div>
    </div>
  );
}

export default AssetSelection;