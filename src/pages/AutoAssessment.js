import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AutoAssessment = () => {
  const navigate = useNavigate();
  const [domain, setDomain] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState([]);

  const API = 'https://cyber-risk-backend-6e6r.onrender.com';

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    setHistory(saved);
  }, []);

  const runScan = async () => {
    if (!domain.trim()) { alert('Please enter a domain.'); return; }
    setScanning(true);
    setScanResult(null);
    setAiResult(null);

    const msgs = ['Resolving DNS...', 'Checking SSL certificate...', 'Scanning ports...', 'Analyzing HTTP headers...', 'Calculating risk score...'];
    let mi = 0;
    setScanMsg(msgs[0]);
    const ticker = setInterval(() => { mi = (mi + 1) % msgs.length; setScanMsg(msgs[mi]); }, 2000);

    try {
      const res = await fetch(`${API}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      clearInterval(ticker);
      setScanResult(data);

      const newHistory = [{ domain, riskLevel: data.riskLevel, score: data.score, date: new Date().toLocaleString() }, ...history].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('scanHistory', JSON.stringify(newHistory));

      runAIAnalysis(data);
    } catch (e) {
      clearInterval(ticker);
      alert('Scan failed. Please try again.');
    }
    setScanning(false);
  };

  const runAIAnalysis = async (scanData) => {
    setAiLoading(true);
    const prompt = `You are a senior cybersecurity analyst. Analyze these real scan results for ${scanData.domain} and return ONLY valid JSON (no markdown):

Domain: ${scanData.domain}
Risk Score: ${scanData.score}/100
Risk Level: ${scanData.riskLevel}
SSL: ${JSON.stringify(scanData.ssl)}
Open Ports: ${JSON.stringify(scanData.ports?.open)}
Security Headers: ${JSON.stringify(scanData.headers)}
DNS: ${JSON.stringify(scanData.dns)}
Findings: ${JSON.stringify(scanData.findings)}

Return this exact JSON:
{
  "executiveSummary": "3 sentence summary of the security posture",
  "threats": [{"name": "threat", "severity": "Critical|High|Medium|Low", "description": "description"}],
  "recommendations": ["rec1", "rec2", "rec3", "rec4", "rec5"],
  "complianceNotes": "Brief note on compliance implications",
  "overallVerdict": "One sentence verdict"
}`;

    try {
      const res = await fetch(`${API}/api/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      const raw = data.content.map(b => b.text || '').join('');
      const clean = raw.replace(/```json|```/g, '').trim();
      setAiResult(JSON.parse(clean));
    } catch (e) {
      console.error('AI analysis failed', e);
    }
    setAiLoading(false);
  };

  const getRiskColor = (level) => {
    if (level === 'Critical') return '#ef4444';
    if (level === 'High') return '#f97316';
    if (level === 'Medium') return '#f59e0b';
    return '#22c55e';
  };

  const downloadJSON = () => {
    if (!scanResult) return;
    const blob = new Blob([JSON.stringify({ scanResult, aiResult }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scan-${scanResult.domain}.json`;
    a.click();
  };

  const copyReport = () => {
    if (!scanResult || !aiResult) return;
    const text = `SECURITY SCAN REPORT\n${'='.repeat(40)}\nDomain: ${scanResult.domain}\nDate: ${scanResult.scannedAt}\nRisk Score: ${scanResult.score}/100\nRisk Level: ${scanResult.riskLevel}\n\nSUMMARY\n${aiResult.executiveSummary}\n\nRECOMMENDATIONS\n${(aiResult.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
    navigator.clipboard.writeText(text).then(() => alert('Report copied!'));
  };

  const tabs = ['overview', 'ssl', 'ports', 'headers', 'ai-analysis'];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🔍 Automated Security Scanner</h2>
        <p>Enter any public domain to run a real-time security scan</p>
      </div>

      {/* Scan Input */}
      <div className="report-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '6px' }}>Domain to scan</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input className="form-input" type="text" placeholder="e.g. example.com"
            value={domain} onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runScan()}
            style={{ flex: 1 }} />
          <button className="btn-primary" onClick={runScan} disabled={scanning}
            style={{ whiteSpace: 'nowrap', opacity: scanning ? 0.7 : 1 }}>
            {scanning ? '⏳ Scanning...' : '🔍 Scan Now'}
          </button>
        </div>
        {scanning && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#6366f1' }}>
            {scanMsg}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
          ✅ Works on any public website &nbsp;|&nbsp; ✅ Legal security assessment &nbsp;|&nbsp; ✅ No installation needed
        </div>
      </div>

      {/* Results */}
      {scanResult && (
        <>
          {/* Score card */}
          <div className="report-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Security score for {scanResult.domain}</div>
                <div style={{ fontSize: '56px', fontWeight: 600, color: getRiskColor(scanResult.riskLevel), lineHeight: 1 }}>{scanResult.score}</div>
                <div style={{ fontSize: '13px', color: '#888' }}>out of 100</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`risk-tag ${scanResult.riskLevel.toLowerCase()}`} style={{ fontSize: '16px', padding: '6px 16px' }}>{scanResult.riskLevel} Risk</span>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Scanned: {new Date(scanResult.scannedAt).toLocaleString()}</div>
              </div>
            </div>

            {/* Findings summary */}
            {scanResult.findings?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Findings ({scanResult.findings.length})</div>
                {scanResult.findings.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '6px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                    <span className={`risk-tag ${f.severity.toLowerCase()}`} style={{ fontSize: '11px', padding: '2px 8px', flexShrink: 0 }}>{f.severity}</span>
                    <span>{f.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="report-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid', fontWeight: activeTab === t ? 500 : 400,
                    background: activeTab === t ? 'rgba(99,102,241,0.1)' : 'transparent',
                    borderColor: activeTab === t ? '#6366f1' : '#444', color: activeTab === t ? '#6366f1' : '#888' }}>
                  {t === 'ai-analysis' ? '🤖 AI Analysis' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'SSL Certificate', value: scanResult.ssl?.valid ? (scanResult.ssl.expired ? '❌ Expired' : `✅ Valid (${scanResult.ssl.daysLeft}d left)`) : '❌ Invalid', color: scanResult.ssl?.valid && !scanResult.ssl?.expired ? '#22c55e' : '#ef4444' },
                  { label: 'HTTPS Redirect', value: scanResult.headers?.httpsRedirect ? '✅ Enabled' : '❌ Missing', color: scanResult.headers?.httpsRedirect ? '#22c55e' : '#ef4444' },
                  { label: 'Open Ports', value: `${scanResult.ports?.open?.length || 0} open`, color: (scanResult.ports?.open?.length || 0) > 3 ? '#ef4444' : '#f59e0b' },
                  { label: 'DNS Resolved', value: scanResult.dns?.resolved ? `✅ ${scanResult.dns.ips?.[0]}` : '❌ Failed', color: scanResult.dns?.resolved ? '#22c55e' : '#ef4444' },
                  { label: 'SSL Issuer', value: scanResult.ssl?.issuer || 'N/A', color: '#888' },
                  { label: 'HTTP Status', value: scanResult.headers?.statusCode || 'N/A', color: '#888' }
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(99,102,241,0.07)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* SSL tab */}
            {activeTab === 'ssl' && (
              <div>
                {scanResult.ssl?.valid ? (
                  [
                    ['Subject', scanResult.ssl.subject],
                    ['Issuer', scanResult.ssl.issuer],
                    ['Valid Until', scanResult.ssl.validTo],
                    ['Days Remaining', scanResult.ssl.daysLeft],
                    ['Status', scanResult.ssl.expired ? '❌ Expired' : scanResult.ssl.expiringSoon ? '⚠️ Expiring Soon' : '✅ Valid']
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                      <span style={{ color: '#888' }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{v}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '14px' }}>❌ {scanResult.ssl?.error || 'SSL not available'}</div>
                )}
              </div>
            )}

            {/* Ports tab */}
            {activeTab === 'ports' && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Open ports ({scanResult.ports?.open?.length || 0})</div>
                {scanResult.ports?.open?.length === 0
                  ? <div style={{ fontSize: '13px', color: '#22c55e' }}>✅ No dangerous ports detected</div>
                  : scanResult.ports?.open?.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                      <span style={{ fontFamily: 'monospace', background: '#1a1a2e', padding: '2px 8px', borderRadius: '4px' }}>{p.port}</span>
                      <span style={{ flex: 1, margin: '0 12px' }}>{p.name}</span>
                      <span className={`risk-tag ${p.risk.toLowerCase()}`}>{p.risk}</span>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Headers tab */}
            {activeTab === 'headers' && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Security headers</div>
                {Object.entries(scanResult.headers?.headers || {}).map(([key, present]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{key}</span>
                    <span style={{ color: present ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{present ? '✅ Present' : '❌ Missing'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI Analysis tab */}
            {activeTab === 'ai-analysis' && (
              <div>
                {aiLoading && <div style={{ fontSize: '13px', color: '#6366f1', textAlign: 'center', padding: '2rem' }}>🤖 AI is analyzing scan results...</div>}
                {!aiLoading && !aiResult && <div style={{ fontSize: '13px', color: '#888' }}>AI analysis not available. Check your API key.</div>}
                {aiResult && (
                  <>
                    <div style={{ background: 'rgba(99,102,241,0.07)', borderRadius: '8px', padding: '1rem', fontSize: '14px', lineHeight: 1.7, marginBottom: '1rem' }}>
                      {aiResult.executiveSummary}
                    </div>
                    <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '8px' }}>Threats identified</div>
                    {(aiResult.threats || []).map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                        <div><div style={{ fontWeight: 500 }}>{t.name}</div><div style={{ color: '#888', marginTop: '2px' }}>{t.description}</div></div>
                        <span className={`risk-tag ${(t.severity || '').toLowerCase()}`} style={{ flexShrink: 0, marginLeft: '8px' }}>{t.severity}</span>
                      </div>
                    ))}
                    <div style={{ fontWeight: 500, fontSize: '13px', margin: '1rem 0 8px' }}>Recommendations</div>
                    {(aiResult.recommendations || []).map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '6px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                        <span style={{ color: '#6366f1', fontWeight: 500 }}>{i + 1}.</span><span>{r}</span>
                      </div>
                    ))}
                    {aiResult.complianceNotes && (
                      <div style={{ marginTop: '1rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#f59e0b' }}>
                        📋 {aiResult.complianceNotes}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Export */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={copyReport}>📋 Copy Report</button>
              <button className="btn-secondary" onClick={downloadJSON}>⬇ Download JSON</button>
              <button className="btn-secondary" onClick={() => window.print()}>🖨 Print / PDF</button>
            </div>
          </div>
        </>
      )}

      {/* History */}
      <div className="report-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '1rem' }}>Recent scans</h3>
        {history.length === 0
          ? <div style={{ fontSize: '13px', color: '#888' }}>No scans yet.</div>
          : history.map((item, i) => (
            <div key={i} onClick={() => setDomain(item.domain)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #333', cursor: 'pointer', fontSize: '13px' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{item.domain}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{item.date}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.score}/100</span>
                <span className={`risk-tag ${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span>
              </div>
            </div>
          ))
        }
      </div>

      <div className="button-row" style={{ marginTop: '1.5rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    </div>
  );
};

export default AutoAssessment;