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
      const values = Object.values(answers);
      const overall = values.reduce((sum, v) => sum + v.score, 0) / values.length;
      await axios.post('https://cyber-risk-backend-6e6r.onrender.com/api/assessment/save', {
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

  const downloadPDF = () => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const values = Object.values(answers);
      const overall = values.reduce((sum, v) => sum + v.score, 0) / values.length;
      const overallScore = Math.round((overall / 10) * 100);
      const riskLevel = overall >= 7.5 ? 'Low' : overall >= 5 ? 'Medium' : overall >= 2.5 ? 'High' : 'Critical';

      // Header
      doc.setFillColor(30, 30, 60);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('CyberRisk Assessment Report', 15, 18);

      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 18);

      // Overall Score
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text(`Overall Risk Score: ${overallScore}/100`, 15, 45);
      doc.text(`Risk Level: ${riskLevel}`, 15, 55);

      // Assets
      doc.setFontSize(11);
      doc.text(`Assets Assessed: ${assets.join(', ')}`, 15, 65);

      // Divider
      doc.setDrawColor(100, 100, 200);
      doc.line(15, 70, 195, 70);

      let y = 80;

      Object.entries(answers).forEach(([key, val]) => {
        const rec = recommendations[key];
        if (!rec) return;

        // Check if we need a new page
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        // Section title
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 150);
        doc.text(`${rec.title}`, 15, y);

        // Risk tag
        const riskText = val.score >= 7 ? 'Low Risk' : val.score >= 4 ? 'Medium Risk' : 'High Risk';
        doc.setFontSize(10);
        doc.setTextColor(val.score >= 7 ? 34 : val.score >= 4 ? 180 : 200, val.score >= 7 ? 197 : val.score >= 4 ? 120 : 50, val.score >= 7 ? 94 : 50);
        doc.text(riskText, 150, y);

        y += 7;

        // Current state
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(10);
        doc.text(`Current state: ${val.label}`, 15, y);
        y += 7;

        // Tips
        doc.setTextColor(0, 0, 0);
        rec.tips.forEach(tip => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`• ${tip}`, 20, y);
          y += 6;
        });

        y += 5;
        doc.setDrawColor(220, 220, 220);
        doc.line(15, y, 195, y);
        y += 8;
      });

      doc.save('CyberRisk-Assessment-Report.pdf');
    };
    document.head.appendChild(script);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Step 4 - Risk Report & Recommendations</h2>
        <p>Detailed remediation plan based on your assessment</p>
      </div>
      <div className="report-section">
        {Object.entries(answers).map(([key, val]) => (
          <div key={key} className={`report-card ${val.score >= 7 ? 'low' : val.score >= 4 ? 'medium' : 'high'}`}>
            <div className="report-card-header">
              <h3>{recommendations[key] && recommendations[key].title}</h3>
              <span className={`risk-tag ${val.score >= 7 ? 'low' : val.score >= 4 ? 'medium' : 'high'}`}>
                {val.score >= 7 ? 'Low Risk' : val.score >= 4 ? 'Medium Risk' : 'High Risk'}
              </span>
            </div>
            <p className="current-answer">Current state: {val.label}</p>
            <div className="tips">
              <strong>Recommended Actions:</strong>
              <ul>
                {recommendations[key] && recommendations[key].tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <div className="button-row">
        <button className="btn-secondary" onClick={() => navigate('/riskscore')}>Back</button>
        <button className="btn-primary" onClick={saveReport} disabled={saved}>
          {saved ? '✓ Report Saved' : 'Save Report to Database'}
        </button>
        <button className="btn-primary" onClick={downloadPDF}>
          ⬇ Download PDF Report
        </button>
        <button className="btn-secondary" onClick={() => { localStorage.clear(); navigate('/'); }}>
          Start New Assessment
        </button>
      </div>
    </div>
  );
}

export default Report;