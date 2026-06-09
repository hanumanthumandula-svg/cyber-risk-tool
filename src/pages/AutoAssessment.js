import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AutoAssessment = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    assetName: '', assetType: '', industry: '', framework: '',
    dataSensitivity: '', bizContext: '', likelihood: 3, impact: 3, controls: 50
  });
  const [scores, setScores] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('assessmentHistory') || '[]');
    setHistory(saved);
  }, []);

  const heatColor = (l, i) => {
    const s = l * i;
    if (s >= 17) return { bg: '#FCEBEB', border: '#F7C1C1', label: 'Critical' };
    if (s >= 10) return { bg: '#FAECE7', border: '#F5C4B3', label: 'High' };
    if (s >= 5)  return { bg: '#FAEEDA', border: '#FAC775', label: 'Medium' };
    return { bg: '#EAF3DE', border: '#C0DD97', label: 'Low' };
  };

  const getRiskLabel = (inherent) => {
    if (inherent >= 17) return 'Critical';
    if (inherent >= 10) return 'High';
    if (inherent >= 5)  return 'Medium';
    return 'Low';
  };

  const getRiskColor = (label) => {
    if (label === 'Critical') return '#ef4444';
    if (label === 'High') return '#f97316';
    if (label === 'Medium') return '#f59e0b';
    return '#22c55e';
  };

  const runAssessment = async () => {
    const { assetName, assetType, industry, framework, dataSensitivity, bizContext, likelihood, impact, controls } = form;
    if (!assetName || !assetType || !industry || !framework || !dataSensitivity) {
      alert('Please fill in all required fields.');
      return;
    }

    const L = parseInt(likelihood);
    const I = parseInt(impact);
    const C = parseInt(controls);
    const inherent = L * I;
    const residual = Math.round(inherent * (1 - C / 100) * 10) / 10;
    const riskLabel = getRiskLabel(inherent);

    setScores({ inherent, residual, riskLabel });
    setLoading(true);
    setAiResult(null);

    const msgs = ['Analyzing asset risk...', 'Identifying threats...', 'Mapping controls...', 'Generating recommendations...', 'Checking compliance gaps...'];
    let mi = 0;
    setLoadingMsg(msgs[0]);
    const ticker = setInterval(() => { mi = (mi + 1) % msgs.length; setLoadingMsg(msgs[mi]); }, 1800);

    const prompt = `You are a senior cybersecurity risk analyst. Perform a detailed risk assessment and return ONLY valid JSON (no markdown, no backticks):

Asset: ${assetName}
Type: ${assetType}
Industry: ${industry}
Business context: ${bizContext || 'Not specified'}
Data sensitivity: ${dataSensitivity}
Likelihood: ${L}/5, Impact: ${I}/5
Inherent risk: ${inherent}/25, Controls: ${C}%, Residual: ${residual}/25
Risk level: ${riskLabel}
Compliance framework: ${framework}

Return this exact JSON:
{
  "executiveSummary": "2-3 sentence executive summary",
  "threats": [{"name": "threat name", "severity": "Critical|High|Medium|Low", "description": "brief description"}],
  "vulnerabilities": ["vuln1", "vuln2", "vuln3", "vuln4"],
  "controls": [{"id": "control id e.g. ISO A.8.1", "name": "control name", "status": "Implemented|Partial|Missing"}],
  "treatment": {
    "avoid": "How to avoid this risk",
    "mitigate": "How to mitigate this risk",
    "transfer": "How to transfer this risk",
    "accept": "Conditions under which to accept this risk"
  },
  "recommendations": ["rec1", "rec2", "rec3", "rec4"],
  "complianceGaps": ["gap1", "gap2", "gap3"]
}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      clearInterval(ticker);
      const raw = data.content.map(b => b.text || '').join('');
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setAiResult(parsed);

      const entry = {
        name: assetName, type: assetType, industry, framework,
        dataSensitivity, L, I, C, inherent, residual, riskLabel,
        parsed, date: new Date().toLocaleString()
      };
      const newHistory = [entry, ...history].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('assessmentHistory', JSON.stringify(newHistory));

    } catch (e) {
      clearInterval(ticker);
      alert('AI analysis failed. Please try again.');
    }
    setLoading(false);
  };

  const copyReport = () => {
    if (!aiResult || !scores) return;
    const text = `CYBER RISK ASSESSMENT REPORT\n${'='.repeat(40)}\nAsset: ${form.assetName} (${form.assetType})\nDate: ${new Date().toLocaleString()}\nInherent Risk: ${scores.inherent}/25 | Residual: ${scores.residual}/25 | Level: ${scores.riskLabel}\n\nEXECUTIVE SUMMARY\n${aiResult.executiveSummary}\n\nRECOMMENDATIONS\n${(aiResult.recommendations || []).map((x, i) => `${i + 1}. ${x}`).join('\n')}`;
    navigator.clipboard.writeText(text).then(() => alert('Report copied!'));
  };

  const downloadJSON = () => {
    if (!aiResult || !scores) return;
    const blob = new Blob([JSON.stringify({ form, scores, aiResult }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `risk-assessment-${form.assetName.replace(/\s+/g, '-')}.json`;
    a.click();
  };

  const reloadHistory = (item) => {
    setForm({
      assetName: item.name, assetType: item.type, industry: item.industry,
      framework: item.framework, dataSensitivity: item.dataSensitivity,
      bizContext: '', likelihood: item.L, impact: item.I, controls: item.C
    });
    setScores({ inherent: item.inherent, residual: item.residual, riskLabel: item.riskLabel });
    setAiResult(item.parsed);
  };

  const tabs = ['summary', 'threats', 'controls', 'treatment', 'compliance'];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>AI-Powered Automated Risk Assessment</h2>
        <p>Enter your asset details and get instant AI-generated risk analysis</p>
      </div>

      {/* Input Form */}
      <div className="report-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '16px' }}>Asset Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '4px' }}>Asset name *</label>
            <input className="form-input" type="text" placeholder="e.g. Customer Database"
              value={form.assetName} onChange={e => setForm({ ...form, assetName: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '4px' }}>Asset type *</label>
            <select className="form-input" value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value })}>
              <option value="">Select type</option>
              {['Database','Web Application','Cloud Infrastructure','Network Device','Endpoint / Workstation','API / Integration','Identity & Access System','Storage / Backup'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '4px' }}>Industry *</label>
            <select className="form-input" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
              <option value="">Select industry</option>
              {['Banking & Finance','Healthcare','Insurance (IRDAI)','E-Commerce','Government','Manufacturing','Technology / SaaS','Education'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '4px' }}>Compliance framework *</label>
            <select className="form-input" value={form.framework} onChange={e => setForm({ ...form, framework: e.target.value })}>
              <option value="">Select framework</option>
              {['ISO 27001:2022','NIST CSF 2.0','IRDAI Cybersecurity','PCI DSS v4.0','HIPAA','SOC 2 Type II','RBI IT Framework','DPDP Act 2023'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '4px' }}>Data sensitivity *</label>
            <select className="form-input" value={form.dataSensitivity} onChange={e => setForm({ ...form, dataSensitivity: e.target.value })}>
              <option value="">Select level</option>
              {['Public','Internal','Confidential','Restricted / PII','Top Secret / PHI'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '4px' }}>Business context</label>
            <input className="form-input" type="text" placeholder="e.g. Stores customer PII for 10k users"
              value={form.bizContext} onChange={e => setForm({ ...form, bizContext: e.target.value })} />
          </div>
        </div>

        {/* Sliders */}
        {[
          { label: 'Likelihood (1–5)', key: 'likelihood', min: 1, max: 5, step: 1, marks: ['Rare','Unlikely','Possible','Likely','Almost certain'] },
          { label: 'Impact (1–5)', key: 'impact', min: 1, max: 5, step: 1, marks: ['Negligible','Minor','Moderate','Major','Catastrophic'] },
          { label: `Controls effectiveness (${form.controls}%)`, key: 'controls', min: 0, max: 100, step: 5, marks: ['None','Weak','Moderate','Strong','Excellent'] }
        ].map(s => (
          <div key={s.key} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: '#888' }}>{s.label}</span>
              <span style={{ fontWeight: 500 }}>{form[s.key]}{s.key === 'controls' ? '%' : ''}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={form[s.key]}
              onChange={e => setForm({ ...form, [s.key]: e.target.value })}
              style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
              {s.marks.map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
        ))}

        <button className="btn-primary" onClick={runAssessment} disabled={loading}
          style={{ width: '100%', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
          {loading ? loadingMsg : '⚡ Run AI Assessment'}
        </button>
      </div>

      {/* Heat Map */}
      <div className="report-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '16px' }}>Risk heat map</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '3px' }}>
          {[5,4,3,2,1].map(l => [1,2,3,4,5].map(i => {
            const c = heatColor(l, i);
            const active = l === parseInt(form.likelihood) && i === parseInt(form.impact);
            return (
              <div key={`${l}-${i}`} style={{
                height: '36px', background: c.bg, border: active ? '2px solid #6366f1' : `0.5px solid ${c.border}`,
                borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: active ? 700 : 400, color: '#666'
              }}>{l * i}</div>
            );
          }))}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
          {[['#EAF3DE','#C0DD97','Low'],['#FAEEDA','#FAC775','Medium'],['#FAECE7','#F5C4B3','High'],['#FCEBEB','#F7C1C1','Critical']].map(([bg,br,label]) => (
            <span key={label} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: bg, border: `0.5px solid ${br}`, display: 'inline-block' }}></span>{label}
            </span>
          ))}
        </div>
      </div>

      {/* Scores */}
      {scores && (
        <div className="report-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '16px' }}>Risk scores</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(99,102,241,0.07)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Inherent risk (L×I)</div>
              <div style={{ fontSize: '48px', fontWeight: 500, color: getRiskColor(scores.riskLabel) }}>{scores.inherent}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>out of 25</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(99,102,241,0.07)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Residual risk</div>
              <div style={{ fontSize: '48px', fontWeight: 500, color: getRiskColor(scores.riskLabel) }}>{scores.residual}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>after controls</div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>Risk level:</span>
            <span className={`risk-tag ${scores.riskLabel.toLowerCase()}`}>{scores.riskLabel} Risk</span>
          </div>
        </div>
      )}

      {/* AI Results */}
      {loading && (
        <div className="report-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#888' }}>{loadingMsg}</div>
        </div>
      )}

      {aiResult && !loading && (
        <div className="report-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '16px' }}>AI Analysis</h3>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid', fontWeight: activeTab === t ? 500 : 400,
                  background: activeTab === t ? 'rgba(99,102,241,0.1)' : 'transparent',
                  borderColor: activeTab === t ? '#6366f1' : '#444', color: activeTab === t ? '#6366f1' : '#888' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab: Summary */}
          {activeTab === 'summary' && (
            <div>
              <div style={{ background: 'rgba(99,102,241,0.07)', borderRadius: '8px', padding: '1rem', fontSize: '14px', lineHeight: 1.7, marginBottom: '1rem' }}>
                {aiResult.executiveSummary}
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Key vulnerabilities</h4>
              {(aiResult.vulnerabilities || []).map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                  <span style={{ color: '#f59e0b' }}>⚠</span><span>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Threats */}
          {activeTab === 'threats' && (
            <div>
              {(aiResult.threats || []).map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                  <div><div style={{ fontWeight: 500 }}>{t.name}</div><div style={{ color: '#888', marginTop: '2px' }}>{t.description}</div></div>
                  <span className={`risk-tag ${(t.severity || '').toLowerCase()}`}>{t.severity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Controls */}
          {activeTab === 'controls' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Mapped controls — {form.framework}</div>
              {(aiResult.controls || []).map((c, i) => {
                const color = c.status === 'Implemented' ? '#22c55e' : c.status === 'Partial' ? '#f59e0b' : '#ef4444';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                    <span style={{ fontFamily: 'monospace', background: '#1a1a2e', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{c.id}</span>
                    <span style={{ flex: 1, margin: '0 12px' }}>{c.name}</span>
                    <span style={{ color, fontSize: '12px', fontWeight: 500 }}>{c.status}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Treatment */}
          {activeTab === 'treatment' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Avoid', color: '#ef4444', key: 'avoid' },
                { label: 'Mitigate', color: '#f59e0b', key: 'mitigate' },
                { label: 'Transfer', color: '#6366f1', key: 'transfer' },
                { label: 'Accept', color: '#22c55e', key: 'accept' }
              ].map(opt => (
                <div key={opt.key} style={{ border: '0.5px solid #333', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 500, color: opt.color, fontSize: '13px', marginBottom: '6px' }}>{opt.label}</div>
                  <div style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.6 }}>{aiResult.treatment?.[opt.key]}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Compliance */}
          {activeTab === 'compliance' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Compliance gaps — {form.framework}</div>
              {(aiResult.complianceGaps || []).map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 500 }}>{i + 1}.</span><span>{g}</span>
                </div>
              ))}
              <div style={{ fontSize: '13px', fontWeight: 500, margin: '12px 0 8px' }}>Prioritized recommendations</div>
              {(aiResult.recommendations || []).map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid #333', fontSize: '13px' }}>
                  <span style={{ color: '#6366f1', fontWeight: 500 }}>{i + 1}.</span><span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Export */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={copyReport}>📋 Copy Report</button>
            <button className="btn-secondary" onClick={downloadJSON}>⬇ Download JSON</button>
            <button className="btn-secondary" onClick={() => window.print()}>🖨 Print / PDF</button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="report-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '16px' }}>Recent assessments</h3>
        {history.length === 0
          ? <div style={{ fontSize: '13px', color: '#888' }}>No assessments yet.</div>
          : history.map((item, i) => (
            <div key={i} onClick={() => reloadHistory(item)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #333', cursor: 'pointer', fontSize: '13px' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{item.name} <span style={{ fontWeight: 400, color: '#888' }}>({item.type})</span></div>
                <div style={{ fontSize: '12px', color: '#888' }}>{item.date}</div>
              </div>
              <span className={`risk-tag ${item.riskLabel.toLowerCase()}`}>{item.riskLabel} Risk</span>
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