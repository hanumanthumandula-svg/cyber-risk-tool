import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

const API = 'https://cyber-risk-backend-6e6r.onrender.com';

function getRiskColor(level) {
  if (level === 'Low') return '#22c55e';
  if (level === 'Medium') return '#f59e0b';
  if (level === 'High') return '#f97316';
  return '#ef4444';
}

function RiskHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('line');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/scan-history`);
      const data = await res.json();
      setHistory(data);
      calculateStats(data);
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
    setLoading(false);
  };

  const calculateStats = (data) => {
    if (!data.length) return;
    const scores = data.map(d => d.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const critical = data.filter(d => d.riskLevel === 'Critical').length;
    const high = data.filter(d => d.riskLevel === 'High').length;
    const medium = data.filter(d => d.riskLevel === 'Medium').length;
    const low = data.filter(d => d.riskLevel === 'Low').length;
    setStats({ avg, highest, lowest, critical, high, medium, low, total: data.length });
  };

  const chartData = history.slice(0, 20).reverse().map((item, i) => ({
    name: item.domain.length > 10 ? item.domain.substring(0, 10) + '..' : item.domain,
    score: item.score,
    date: new Date(item.scannedAt).toLocaleDateString(),
    risk: item.riskLevel
  }));

  const riskDistribution = [
    { name: 'Critical', count: stats?.critical || 0, fill: '#ef4444' },
    { name: 'High', count: stats?.high || 0, fill: '#f97316' },
    { name: 'Medium', count: stats?.medium || 0, fill: '#f59e0b' },
    { name: 'Low', count: stats?.low || 0, fill: '#22c55e' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1a1a2e', border: '1px solid #444', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
          <div style={{ color: '#888', marginBottom: '4px' }}>{label}</div>
          <div style={{ color: '#6366f1', fontWeight: 600 }}>Score: {payload[0].value}/100</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📈 Risk Score History & Trends</h2>
        <p>Track security scores over time across all scanned domains and IPs</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Scans', value: stats.total, color: '#6366f1' },
            { label: 'Average Score', value: `${stats.avg}/100`, color: '#6366f1' },
            { label: 'Highest Score', value: `${stats.highest}/100`, color: '#22c55e' },
            { label: 'Lowest Score', value: `${stats.lowest}/100`, color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} className="report-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Risk Distribution Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          {[
            { label: 'Critical', value: stats.critical, color: '#ef4444' },
            { label: 'High', value: stats.high, color: '#f97316' },
            { label: 'Medium', value: stats.medium, color: '#f59e0b' },
            { label: 'Low', value: stats.low, color: '#22c55e' },
          ].map((s, i) => (
            <div key={i} className="report-card" style={{ padding: '16px', textAlign: 'center', borderLeft: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{s.label} Risk</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>scans</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="report-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '15px', margin: 0 }}>Score Trend</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['line', 'bar'].map(type => (
              <button key={type} onClick={() => setActiveChart(type)}
                style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: '0.5px solid',
                  background: activeChart === type ? 'rgba(99,102,241,0.1)' : 'transparent',
                  borderColor: activeChart === type ? '#6366f1' : '#444',
                  color: activeChart === type ? '#6366f1' : '#888' }}>
                {type === 'line' ? '📈 Line' : '📊 Bar'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888', fontSize: '13px' }}>Loading history...</div>
        ) : chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888', fontSize: '13px' }}>No scan history yet. Run some scans first.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            {activeChart === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Risk Distribution Bar Chart */}
      <div className="report-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '15px', margin: '0 0 1rem' }}>Risk Level Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={riskDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} />
            <YAxis tick={{ fill: '#888', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #444', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {riskDistribution.map((entry, index) => (
                <rect key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* History Table */}
      <div className="report-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '15px', margin: 0 }}>All Scan Records</h3>
          <button onClick={fetchHistory} className="btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }}>
            🔄 Refresh
          </button>
        </div>
        {loading ? (
          <div style={{ fontSize: '13px', color: '#888' }}>Loading...</div>
        ) : history.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#888' }}>No records found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Target', 'Type', 'Score', 'Risk Level', 'Scanned At'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #333', color: '#888', fontWeight: 500, fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid #2a2a3e' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{item.domain}</td>
                    <td style={{ padding: '10px 12px', color: '#888' }}>{item.targetType || 'domain'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: getRiskColor(item.riskLevel) }}>{item.score}/100</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: getRiskColor(item.riskLevel) + '22', color: getRiskColor(item.riskLevel), padding: '2px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#888', fontSize: '12px' }}>{new Date(item.scannedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="button-row" style={{ marginTop: '1.5rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    </div>
  );
}

export default RiskHistory;