import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

function RiskScore() {
  const [scores, setScores] = useState([]);
  const [overall, setOverall] = useState(0);
  const [riskLevel, setRiskLevel] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const answers = JSON.parse(localStorage.getItem('answers') || '{}');
    const scoreData = Object.entries(answers).map(([key, val]) => ({
      domain: key.charAt(0).toUpperCase() + key.slice(1),
      score: val.score,
      fullMark: 10
    }));
    setScores(scoreData);
    const avg = scoreData.reduce((sum, s) => sum + s.score, 0) / scoreData.length;
    const normalized = Math.round((avg / 10) * 100);
    setOverall(normalized);
    if (normalized >= 75) setRiskLevel('Low');
    else if (normalized >= 50) setRiskLevel('Medium');
    else if (normalized >= 25) setRiskLevel('High');
    else setRiskLevel('Critical');
  }, []);

  const getRiskColor = () => {
    if (riskLevel === 'Low') return '#22c55e';
    if (riskLevel === 'Medium') return '#f59e0b';
    if (riskLevel === 'High') return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Step 3 — Risk Score</h2>
        <p>Your organization's cybersecurity risk assessment results</p>
      </div>
      <div className="score-section">
        <div className="overall-score" style={{ borderColor: getRiskColor() }}>
          <div className="score-number" style={{ color: getRiskColor() }}>{overall}</div>
          <div className="score-label">Overall Score</div>
          <div className="risk-badge" style={{ background: getRiskColor() }}>{riskLevel} Risk</div>
        </div>
        <div className="radar-chart">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={scores}>
              <PolarGrid />
              <PolarAngleAxis dataKey="domain" />
              <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="scores-table">
        {scores.map(s => (
          <div key={s.domain} className="score-row">
            <span className="score-domain">{s.domain}</span>
            <div className="score-bar-container">
              <div className="score-bar" style={{ width: `${s.score * 10}%`, background: s.score >= 7 ? '#22c55e' : s.score >= 4 ? '#f59e0b' : '#ef4444' }}></div>
            </div>
            <span className="score-value">{s.score}/10</span>
          </div>
        ))}
      </div>
      <div className="button-row">
        <button className="btn-secondary" onClick={() => navigate('/questionnaire')}>← Back</button>
        <button className="btn-primary" onClick={() => navigate('/report')}>Next: View Report →</button>
      </div>
    </div>
  );
}

export default RiskScore;