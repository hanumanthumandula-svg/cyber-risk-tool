import React, { useState } from 'react';
import axios from 'axios';

const API = 'https://cyber-risk-backend-6e6r.onrender.com';

const industries = [
  'Banking & Finance', 'Healthcare', 'Education', 'E-Commerce',
  'Government', 'Manufacturing', 'IT & Software', 'Retail',
  'Telecom', 'Insurance', 'Other'
];

function getRiskColor(level) {
  if (level === 'Low') return '#22c55e';
  if (level === 'Medium') return '#f59e0b';
  if (level === 'High') return '#f97316';
  return '#ef4444';
}

function AutoAssessment() {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const generateReport = async () => {
    if (!companyName || !industry) {
      setError('Please enter company name and select industry');
      return;
    }
    setError('');
    setLoading(true);
    setReport(null);
    setSaved(false);
    setEmailSent(false);
    try {
      const res = await axios.post(`${API}/api/ai-analyze`, { companyName, industry });
      setReport(res.data.report);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
    }
    setLoading(false);
  };

  const saveReport = async () => {
    try {
      await axios.post(`${API}/api/assessment/save`, {
        assets: [industry],
        answers: {},
        overallScore: report.overallRiskScore,
        riskLevel: report.riskLevel,
        companyName: report.companyName,
        fullReport: report,
      });
      setSaved(true);
      alert('Report saved successfully!');
    } catch (err) {
      alert('Error saving report.');
    }
  };

  const sendEmail = async () => {
    if (!email) {
      alert('Please enter your email address first');
      return;
    }
    try {
      await axios.post(`${API}/api/send-report`, { email, report });
      setEmailSent(true);
      alert('Report sent to your email successfully!');
    } catch (err) {
      alert('Failed to send email. Try again.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>⚡ AI Automated Risk Assessment</h2>
        <p>Enter your company details and AI generates a complete cybersecurity risk report instantly</p>
      </div>

      <div className="ai-input-card">
        <div className="ai-input-row">
          <div className="ai-input-group">
            <label>Company Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Corporation"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="ai-input"
            />
          </div>
          <div className="ai-input-group">
            <label>Industry</label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="ai-input"
            >
              <option value="">Select industry...</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        <div className="ai-input-group" style={{ marginTop: '1rem' }}>
          <label>Your Email (to receive report)</label>
          <input
            type="email"
            placeholder="e.g. you@gmail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="ai-input"
          />
        </div>

        {error && <p className="ai-error" style={{ marginTop: '0.75rem' }}>{error}</p>}

        <button
          className="btn-primary ai-generate-btn"
          onClick={generateReport}
          disabled={loading}
          style={{ marginTop: '1rem' }}
        >
          {loading ? '🤖 AI is analyzing...' : '⚡ Generate AI Risk Report'}
        </button>
      </div>

      {loading && (
        <div className="ai-loading">
          <div className="ai-loading-spinner"></div>
          <p>AI is generating your complete cybersecurity risk assessment...</p>
          <p className="ai-loading-sub">Analyzing threats, compliance gaps, and recommendations</p>
        </div>
      )}

      {report && (
        <div className="ai-report">

          <div className="ai-report-header">
            <div>
              <h3>{report.companyName}</h3>
              <p>{report.industry}</p>
            </div>
            <div className="ai-score-box" style={{ borderColor: getRiskColor(report.riskLevel) }}>
              <div className="ai-score-num" style={{ color: getRiskColor(report.riskLevel) }}>
                {report.overallRiskScore}
              </div>
              <div className="ai-score-label">Risk Score</div>
              <div className="ai-risk-badge" style={{ background: getRiskColor(report.riskLevel) }}>
                {report.riskLevel} Risk
              </div>
            </div>
          </div>

          <div className="ai-section">
            <h4>Executive Summary</h4>
            <p>{report.executiveSummary}</p>
          </div>

          <div className="ai-section">
            <h4>Top Threats Identified</h4>
            <div className="ai-threats">
              {report.threats.map((t, i) => (
                <div key={i} className="ai-threat-card">
                  <div className="ai-threat-header">
                    <span className="ai-threat-name">{t.name}</span>
                    <span className="ai-severity-badge" style={{
                      background: getRiskColor(t.severity) + '22',
                      color: getRiskColor(t.severity),
                      border: `1px solid ${getRiskColor(t.severity)}44`
                    }}>{t.severity}</span>
                  </div>
                  <p className="ai-threat-desc">{t.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-section">
            <h4>Security Domain Scores</h4>
            <div className="ai-domains">
              {report.domains.map((d, i) => (
                <div key={i} className="ai-domain-row">
                  <span className="ai-domain-name">{d.name}</span>
                  <div className="ai-domain-bar-wrap">
                    <div className="ai-domain-bar" style={{
                      width: `${d.score * 10}%`,
                      background: d.score >= 7 ? '#22c55e' : d.score >= 4 ? '#f59e0b' : '#ef4444'
                    }}></div>
                  </div>
                  <span className="ai-domain-score">{d.score}/10</span>
                  <span className="ai-domain-rec">{d.recommendation}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-section">
            <h4>Compliance Status</h4>
            <div className="ai-compliance">
              {report.compliance.map((c, i) => (
                <div key={i} className="ai-compliance-card">
                  <div className="ai-compliance-top">
                    <span className="ai-compliance-name">{c.framework}</span>
                    <span className="ai-compliance-status" style={{
                      color: c.status === 'Compliant' ? '#22c55e' : c.status === 'Partial' ? '#f59e0b' : '#ef4444'
                    }}>{c.status}</span>
                  </div>
                  <p className="ai-compliance-gap">{c.gap}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-section">
            <h4>Top Recommendations</h4>
            <ol className="ai-recommendations">
              {report.topRecommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>

          <div className="button-row">
            <button
              className="btn-primary"
              onClick={saveReport}
              disabled={saved}
            >
              {saved ? '✓ Report Saved' : '💾 Save Report to Database'}
            </button>
            <button
              className="btn-secondary"
              onClick={sendEmail}
              disabled={emailSent}
            >
              {emailSent ? '✓ Email Sent' : '📧 Email Report'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setReport(null);
                setCompanyName('');
                setIndustry('');
                setEmail('');
                setSaved(false);
                setEmailSent(false);
              }}
            >
              🔄 New Assessment
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default AutoAssessment;