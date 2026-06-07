import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const recommendations = {
  patch: { title: 'Patch Management', tips: ['Enable automatic updates', 'Use a patch management tool like WSUS', 'Set up vulnerability scanning monthly'] },
  mfa: { title: 'MFA / Authentication', tips: ['Enable MFA on all accounts immediately', 'Use Microsoft Authenticator or Google Authenticator', 'Enforce MFA policy via Active Directory'] },
  monitoring: { title: 'Monitoring & Detection', tips: ['Set up free SIEM using Wazuh', 'Enable Windows Event Logging', 'Set up email alerts for suspicious logins'] },
  backup: { title: 'Backup & Recovery', tips: ['Follow 3-2-1 backup rule', 'Test backups monthly', 'Use cloud backup like Backblaze'] },
  access: { title: 'Access Control', tips: ['Implement least privilege principle', 'Review user access quarterly', 'Disable inactive accounts immediately'] },
  training: { title: 'Security Awareness', tips: ['Run free phishing simulation with GoPhish', 'Schedule monthly security newsletters', 'Conduct annual security training'] },
  encryption: { title: 'Encryption', tips: ['Enable BitLocker on all devices', 'Use HTTPS everywhere', 'Encrypt sensitive database fields'] },
  incident: { title: 'Incident Response', tips: ['Create a basic IR plan document', 'Define roles and responsibilities', 'Run a tabletop exercise every 6 months'] },
};

function Report() {
  const [answers, setAnswers] = useState({});
  const [assets, setAssets] = useState([]);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const a = JSON.parse(localStorage.getItem('answers') || '{}');
    const s = JSON.parse(localStorage.getItem('selectedAssets') || '[]');
    setAnswers(a);
    setAssets(s);
  }, []);

  const saveReport = async () => {
    try {
      const overall = Object.values(answers).reduce((sum, v) => sum + v.score, 0) / Object.values(answers).length;
      await axios.post('https://cyber-risk-backend-6e6r.onrender.com/api/assessments', {
        assets,
        answers,
        overallScore: Math.round((overall / 10) * 100),
        riskLevel: overall >= 7.5 ? 'Low' : overall >= 5 ? 'Medium' : overall >= 2.5 ? 'High' : 'Critical',
      });
      setSaved(true);
      alert('Report saved successfully!');
    } catch (error) {
      alert('Error saving report. Make sure backend is running.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Step 4 — Risk Report & Recommendations</h2>
        <p>Detailed remediation plan based on your assessment</p>
      </div>
      <div className="report-section">
        {Object.entries(answers).map(([key, val]) => (
          <div key={key} className={`report-card ${val.score >= 7 ? 'low' : val.score >= 4 ? 'medium' : 'high'}`}>
            <div className="report-card-header">
              <h3>{recommendations[key]?.title}</h3>
              <span className={`risk-tag ${val.score >= 7 ? 'low' : val.score >= 4 ? 'medium' : 'high'}`}>
                {val.score >= 7 ? 'Low Risk' : val.score >= 4 ? 'Medium Risk' : 'High Risk'}
              </span>
            </div>
            <p className="current-answer">Current state: {val.label}</p>
            <div className="tips">
              <strong>Recommended Actions:</strong>
              <ul>
                {recommendations[key]?.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <div className="button-row">
        <button className="btn-secondary" onClick={() => navigate('/riskscore')}>← Back</button>
        <button className="btn-primary" onClick={saveReport} disabled={saved}>
          {saved ? '✓ Report Saved' : 'Save Report to Database'}
        </button>
        <button className="btn-secondary" onClick={() => { localStorage.clear(); navigate('/'); }}>
          Start New Assessment
        </button>
      </div>
    </div>
  );
}

export default Report;