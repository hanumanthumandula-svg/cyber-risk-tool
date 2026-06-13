import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AutoAssessment = () => {
  const navigate = useNavigate();
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [history, setHistory] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [blockedUrls, setBlockedUrls] = useState([]);

  const API = "https://cyber-risk-backend-6e6r.onrender.com";

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("scanHistory") || "[]");
    setHistory(saved);
    fetchTrendData();
    fetchBlockedUrls();
  }, []);

  const fetchTrendData = async () => {
    try {
      const res = await fetch(`${API}/api/scan-history`);
      const data = await res.json();
      const formatted = data.slice(0, 20).reverse().map(item => ({
        name: item.domain.length > 12 ? item.domain.substring(0, 12) + "..." : item.domain,
        score: item.score,
        date: new Date(item.scannedAt).toLocaleDateString()
      }));
      setTrendData(formatted);
    } catch (e) { console.error("Trend fetch failed", e); }
  };

  const fetchBlockedUrls = async () => {
    try {
      const res = await fetch(`${API}/api/blocked-urls`);
      const data = await res.json();
      setBlockedUrls(data);
    } catch (e) { console.error("Blocked fetch failed", e); }
  };

  const validateInput = (input) => {
    const trimmed = input.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (ipv4Regex.test(trimmed)) {
      const parts = trimmed.split(".").map(Number);
      if (parts.some(n => n > 255)) return { valid: false, message: "Invalid IP address" };
      const isPrivate = parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) || (parts[0] === 169 && parts[1] === 254);
      if (isPrivate) return { valid: false, message: "Private/internal IP addresses cannot be scanned" };
      return { valid: true, type: "ip" };
    }
    if (domainRegex.test(trimmed)) return { valid: true, type: "domain" };
    return { valid: false, message: "Please enter a valid domain (e.g. example.com) or IP (e.g. 8.8.8.8)" };
  };

  const showRiskAlert = (data) => {
    const key = `alert_${data.domain}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "true");
    setTimeout(() => {
      if (data.riskLevel === "Critical" || data.riskLevel === "High") {
        alert(`?? ${data.riskLevel} Risk Detected!\n\nDomain: ${data.domain}\nScore: ${data.score}/100\n\nThis domain is DANGEROUS and has been automatically blocked!\n${email ? "An alert email has been sent to " + email : "Enter your email to receive alerts."}`);
      } else if (data.riskLevel === "Medium") {
        alert(`?? Medium Risk Detected!\n\nDomain: ${data.domain}\nScore: ${data.score}/100\n\nThis domain has security issues that need your attention.`);
      }
    }, 600);
  };

  const runScan = async () => {
    if (!domain.trim()) { alert("Please enter a domain or IP address."); return; }
    const validation = validateInput(domain);
    if (!validation.valid) { alert(validation.message); return; }
    setScanning(true);
    setScanResult(null);
    setAiResult(null);
    setEmailStatus("");
    const msgs = [
      "?? Waking up scanner...",
      validation.type === "ip" ? "?? Resolving IP address..." : "?? Resolving DNS records...",
      "?? Checking SSL certificate...",
      "?? Scanning open ports...",
      "??? Analyzing HTTP security headers...",
      "?? Calculating risk score..."
    ];
    let mi = 0;
    setScanMsg(msgs[0]);
    const ticker = setInterval(() => { mi = (mi + 1) % msgs.length; setScanMsg(msgs[mi]); }, 2000);
    try {
      const res = await fetch(`${API}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      clearInterval(ticker);
      if (!res.ok) { alert(data.error || "Scan failed."); setScanning(false); return; }
      setScanResult(data);
      const newHistory = [{ domain, riskLevel: data.riskLevel, score: data.score, date: new Date().toLocaleString(), targetType: data.targetType }, ...history].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem("scanHistory", JSON.stringify(newHistory));
      showRiskAlert(data);
      if ((data.riskLevel === "Critical" || data.riskLevel === "High") && email) {
        sendHighRiskAlert(data);
      }
      if (data.riskLevel === "Critical" || data.riskLevel === "High") {
        showBrowserNotification(data.domain, data.score, data.riskLevel);
      }
      fetchTrendData();
      fetchBlockedUrls();
    } catch (e) {
      clearInterval(ticker);
      alert("Scan failed. Please try again.");
    }
    setScanning(false);
  };

  const showBrowserNotification = (domain, score, riskLevel) => {
    if (!("Notification" in window)) return;
    const show = () => new Notification(`?? ${riskLevel} Risk Detected`, { body: `${domain} scored ${score}/100. This URL has been blocked.`, icon: "/favicon.ico" });
    if (Notification.permission === "granted") show();
    else if (Notification.permission !== "denied") Notification.requestPermission().then(p => { if (p === "granted") show(); });
  };

  const sendHighRiskAlert = async (data) => {
    try {
      const res = await fetch(`${API}/api/send-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, domain: data.domain, score: data.score, riskLevel: data.riskLevel, findings: data.findings, ssl: data.ssl, ports: data.ports })
      });
      const result = await res.json();
      if (result.success) setEmailStatus("?? High Risk Alert sent to " + email);
    } catch (e) { console.error("Alert send failed", e); }
  };

  const sendEmailReport = async () => {
    if (!email) { alert("Please enter your email address first."); return; }
    if (!scanResult) return;
    setEmailSending(true);
    setEmailStatus("");
    try {
      const res = await fetch(`${API}/api/send-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, domain: scanResult.domain, score: scanResult.score, riskLevel: scanResult.riskLevel, findings: scanResult.findings, ssl: scanResult.ssl, ports: scanResult.ports })
      });
      const data = await res.json();
      setEmailStatus(data.success ? "? Report sent successfully!" : `? ${data.error}`);
    } catch (e) { setEmailStatus("? Failed to send email."); }
    setEmailSending(false);
  };

  const runAIAnalysis = async (scanData) => {
    setAiLoading(true);
    const targetLabel = scanData.targetType === "ip" ? `IP Address: ${scanData.domain}` : `Domain: ${scanData.domain}`;
    const prompt = `You are a senior cybersecurity analyst. Analyze these scan results for ${targetLabel} and return ONLY valid JSON (no markdown, no backticks):
${targetLabel}
Risk Score: ${scanData.score}/100
Risk Level: ${scanData.riskLevel}
SSL: ${JSON.stringify(scanData.ssl)}
Open Ports: ${JSON.stringify(scanData.ports?.open)}
Security Headers: ${JSON.stringify(scanData.headers)}
DNS: ${JSON.stringify(scanData.dns)}
Findings: ${JSON.stringify(scanData.findings)}
Return this exact JSON:
{"executiveSummary":"3 sentence summary","threats":[{"name":"threat","severity":"Critical|High|Medium|Low","description":"desc"}],"recommendations":["rec1","rec2","rec3","rec4","rec5"],"complianceNotes":"brief compliance note","overallVerdict":"one sentence verdict"}`;
    try {
      const res = await fetch(`${API}/api/ai-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      const raw = data.content.map(b => b.text || "").join("");
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      setAiResult(JSON.parse(jsonMatch[0].trim()));
    } catch (e) {
      console.error("AI analysis failed:", e);
      setAiResult({ executiveSummary: "AI analysis could not be completed. Please review findings manually.", threats: [], recommendations: ["Review scan findings above manually."], complianceNotes: "", overallVerdict: "Manual review recommended." });
    }
    setAiLoading(false);
  };

  const getRiskColor = (level) => {
    if (level === "Critical") return "#ef4444";
    if (level === "High") return "#f97316";
    if (level === "Medium") return "#f59e0b";
    return "#22c55e";
  };

  const getHeatMatrix = () => {
    if (!scanResult) return [];
    return [
      { area: "SSL", status: scanResult.ssl?.valid && !scanResult.ssl?.expired ? "safe" : "danger", label: scanResult.ssl?.valid ? (scanResult.ssl.expired ? "Expired" : "Valid") : "Invalid" },
      { area: "HTTPS", status: scanResult.headers?.httpsRedirect ? "safe" : "warning", label: scanResult.headers?.httpsRedirect ? "Enabled" : "Missing" },
      { area: "Headers", status: Object.values(scanResult.headers?.headers || {}).every(v => v) ? "safe" : Object.values(scanResult.headers?.headers || {}).some(v => v) ? "warning" : "danger", label: `${Object.values(scanResult.headers?.headers || {}).filter(v => v).length}/7 present` },
      { area: "Ports", status: scanResult.ports?.open?.some(p => p.risk === "Critical") ? "danger" : scanResult.ports?.open?.some(p => p.risk === "High") ? "warning" : "safe", label: `${scanResult.ports?.open?.length || 0} open` },
      { area: "DNS", status: scanResult.dns?.resolved ? "safe" : "danger", label: scanResult.dns?.resolved ? "Resolved" : "Failed" },
      { area: "Overall", status: scanResult.riskLevel === "Low" ? "safe" : scanResult.riskLevel === "Medium" ? "warning" : "danger", label: `${scanResult.score}/100` }
    ];
  };

  const heatColor = { safe: "#22c55e", warning: "#f59e0b", danger: "#ef4444" };
  const heatBg = { safe: "rgba(34,197,94,0.15)", warning: "rgba(245,158,11,0.15)", danger: "rgba(239,68,68,0.15)" };

  const downloadJSON = () => {
    if (!scanResult) return;
    const blob = new Blob([JSON.stringify({ scanResult, aiResult }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `scan-${scanResult.domain}.json`;
    a.click();
  };

  const copyReport = () => {
    if (!scanResult || !aiResult) return;
    const text = `SECURITY SCAN REPORT\n${"=".repeat(40)}\nTarget: ${scanResult.domain}\nDate: ${scanResult.scannedAt}\nRisk Score: ${scanResult.score}/100\nRisk Level: ${scanResult.riskLevel}\n\nSUMMARY\n${aiResult.executiveSummary}\n\nRECOMMENDATIONS\n${(aiResult.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
    navigator.clipboard.writeText(text).then(() => alert("Report copied!"));
  };

  const tabs = ["overview", "heatmap", "trends", "ssl", "ports", "headers", "ai-analysis", "blocked"];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>?? Automated Security Scanner</h2>
        <p>Enter any public domain or IP address to run a real-time security scan</p>
      </div>

      <div className="report-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <label style={{ fontSize: "13px", color: "#888", display: "block", marginBottom: "6px" }}>Domain or IP to scan</label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input className="form-input" type="text" placeholder="e.g. example.com or 8.8.8.8"
            value={domain} onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runScan()} style={{ flex: 1 }} />
          <button className="btn-primary" onClick={runScan} disabled={scanning} style={{ whiteSpace: "nowrap", opacity: scanning ? 0.7 : 1 }}>
            {scanning ? "? Scanning..." : "?? Scan Now"}
          </button>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input className="form-input" type="email" placeholder="Your email for reports and alerts (optional)"
            value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, fontSize: "13px" }} />
          {scanResult && (
            <button className="btn-secondary" onClick={sendEmailReport} disabled={emailSending} style={{ whiteSpace: "nowrap", fontSize: "13px" }}>
              {emailSending ? "? Sending..." : "?? Email Report"}
            </button>
          )}
        </div>
        {emailStatus && (
          <div style={{ marginTop: "8px", fontSize: "13px", color: emailStatus.startsWith("?") || emailStatus.startsWith("??") ? "#22c55e" : "#ef4444" }}>
            {emailStatus}
          </div>
        )}
        {scanning && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "13px", color: "#6366f1", marginBottom: "6px" }}>{scanMsg}</div>
            <div style={{ background: "#1e293b", borderRadius: "99px", height: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "100%", background: "linear-gradient(90deg, #6366f1, #4f46e5)", borderRadius: "99px", animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
              First scan may take 30-60 seconds if server is waking up. Subsequent scans are faster.
            </div>
          </div>
        )}
        <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
          ? Domains and IPs supported | ? Auto-alerts for High/Critical risk | ? Email reports available
        </div>
      </div>

      {scanResult && scanResult.riskLevel === "Medium" && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b", borderRadius: "8px", padding: "12px 16px", marginBottom: "1.5rem", fontSize: "13px", color: "#f59e0b", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>??</span>
          <div><strong>Medium Risk Detected</strong> — {scanResult.domain} has security issues that need attention. Review the findings below.</div>
        </div>
      )}

      {scanResult && (scanResult.riskLevel === "Critical" || scanResult.riskLevel === "High") && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "8px", padding: "14px 18px", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>??</span>
          <div>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{scanResult.riskLevel} Risk Detected — {scanResult.domain}</div>
            <div style={{ color: "#f87171", fontSize: "13px" }}>Score: {scanResult.score}/100 — This domain has been automatically blocked. {email ? "An alert email has been sent to " + email + "." : "Enter your email above to receive alerts."}</div>
          </div>
        </div>
      )}

      {scanResult && (
        <>
          <div className="report-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>
                  Security score for {scanResult.domain}
                  {scanResult.targetType === "ip" && <span style={{ marginLeft: "8px", background: "rgba(99,102,241,0.15)", color: "#6366f1", fontSize: "11px", padding: "2px 8px", borderRadius: "4px" }}>IP</span>}
                </div>
                <div style={{ fontSize: "56px", fontWeight: 600, color: getRiskColor(scanResult.riskLevel), lineHeight: 1 }}>{scanResult.score}</div>
                <div style={{ fontSize: "13px", color: "#888" }}>out of 100</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={`risk-tag ${scanResult.riskLevel.toLowerCase()}`} style={{ fontSize: "16px", padding: "6px 16px" }}>{scanResult.riskLevel} Risk</span>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>Scanned: {new Date(scanResult.scannedAt).toLocaleString()}</div>
              </div>
            </div>
            {scanResult.findings?.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Findings ({scanResult.findings.length})</div>
                {scanResult.findings.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", padding: "6px 0", borderBottom: "0.5px solid #333", fontSize: "13px" }}>
                    <span className={`risk-tag ${f.severity.toLowerCase()}`} style={{ fontSize: "11px", padding: "2px 8px", flexShrink: 0 }}>{f.severity}</span>
                    <span>{f.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="report-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", flexWrap: "wrap" }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: "0.5px solid", fontWeight: activeTab === t ? 500 : 400, background: activeTab === t ? "rgba(99,102,241,0.1)" : "transparent", borderColor: activeTab === t ? "#6366f1" : "#444", color: activeTab === t ? "#6366f1" : "#888" }}>
                  {t === "ai-analysis" ? "?? AI Analysis" : t === "heatmap" ? "?? Heat Matrix" : t === "trends" ? "?? Trends" : t === "blocked" ? "?? Blocked" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "SSL Certificate", value: scanResult.ssl?.valid ? (scanResult.ssl.expired ? "? Expired" : `? Valid (${scanResult.ssl.daysLeft}d)`) : "? Invalid", color: scanResult.ssl?.valid && !scanResult.ssl?.expired ? "#22c55e" : "#ef4444" },
                  { label: "HTTPS Redirect", value: scanResult.headers?.httpsRedirect ? "? Enabled" : "? Missing", color: scanResult.headers?.httpsRedirect ? "#22c55e" : "#ef4444" },
                  { label: "Open Ports", value: `${scanResult.ports?.open?.length || 0} open`, color: (scanResult.ports?.open?.length || 0) > 3 ? "#ef4444" : "#f59e0b" },
                  { label: scanResult.targetType === "ip" ? "IP Info" : "DNS Resolved", value: scanResult.dns?.resolved ? `? ${scanResult.dns.ips?.[0]}` : "? Failed", color: scanResult.dns?.resolved ? "#22c55e" : "#ef4444" },
                  { label: "SSL Issuer", value: scanResult.ssl?.issuer || "N/A", color: "#888" },
                  { label: "HTTP Status", value: scanResult.headers?.statusCode || "N/A", color: "#888" }
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(99,102,241,0.07)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "heatmap" && (
              <div>
                <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>Visual overview of security areas. Red = danger, Yellow = warning, Green = safe.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {getHeatMatrix().map((item, i) => (
                    <div key={i} style={{ background: heatBg[item.status], border: `1px solid ${heatColor[item.status]}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>{item.area}</div>
                      <div style={{ fontSize: "20px", fontWeight: 600, color: heatColor[item.status] }}>{item.label}</div>
                      <div style={{ width: "100%", height: "4px", background: "#333", borderRadius: "2px", marginTop: "8px" }}>
                        <div style={{ width: item.status === "safe" ? "100%" : item.status === "warning" ? "50%" : "20%", height: "100%", background: heatColor[item.status], borderRadius: "2px", transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "trends" && (
              <div>
                <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>Risk score history across all scans (from database)</div>
                {trendData.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "#888" }}>No trend data yet. Run more scans to see trends.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#888", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #444", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [`${value}/100`, "Score"]} labelFormatter={(label) => `Target: ${label}`} />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {activeTab === "ssl" && (
              <div>
                {scanResult.ssl?.valid ? (
                  [["Subject", scanResult.ssl.subject], ["Issuer", scanResult.ssl.issuer], ["Valid Until", scanResult.ssl.validTo], ["Days Remaining", scanResult.ssl.daysLeft], ["Status", scanResult.ssl.expired ? "? Expired" : scanResult.ssl.expiringSoon ? "?? Expiring Soon" : "? Valid"]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid #333", fontSize: "13px" }}>
                      <span style={{ color: "#888" }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#ef4444", fontSize: "14px" }}>? {scanResult.ssl?.error || "SSL not available"}</div>
                )}
              </div>
            )}

            {activeTab === "ports" && (
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Open ports ({scanResult.ports?.open?.length || 0})</div>
                {scanResult.ports?.open?.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "#22c55e" }}>? No dangerous ports detected</div>
                ) : scanResult.ports?.open?.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #333", fontSize: "13px" }}>
                    <span style={{ fontFamily: "monospace", background: "#1a1a2e", padding: "2px 8px", borderRadius: "4px" }}>{p.port}</span>
                    <span style={{ flex: 1, margin: "0 12px" }}>{p.name}</span>
                    <span className={`risk-tag ${p.risk.toLowerCase()}`}>{p.risk}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "headers" && (
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>Security headers</div>
                {Object.entries(scanResult.headers?.headers || {}).map(([key, present]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #333", fontSize: "13px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "12px" }}>{key}</span>
                    <span style={{ color: present ? "#22c55e" : "#ef4444", fontWeight: 500 }}>{present ? "? Present" : "? Missing"}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "ai-analysis" && (
              <div>
                {!aiResult && !aiLoading && (
                  <button className="btn-primary" onClick={() => runAIAnalysis(scanResult)} style={{ marginBottom: "1rem", width: "100%" }}>
                    ?? Run AI Analysis
                  </button>
                )}
                {aiLoading && <div style={{ fontSize: "13px", color: "#6366f1", textAlign: "center", padding: "2rem" }}>?? AI is analyzing scan results...</div>}
                {aiResult && (
                  <>
                    <div style={{ background: "rgba(99,102,241,0.07)", borderRadius: "8px", padding: "1rem", fontSize: "14px", lineHeight: 1.7, marginBottom: "1rem" }}>{aiResult.executiveSummary}</div>
                    <div style={{ fontWeight: 500, fontSize: "13px", marginBottom: "8px" }}>Threats identified</div>
                    {(aiResult.threats || []).map((t, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "0.5px solid #333", fontSize: "13px" }}>
                        <div><div style={{ fontWeight: 500 }}>{t.name}</div><div style={{ color: "#888", marginTop: "2px" }}>{t.description}</div></div>
                        <span className={`risk-tag ${(t.severity || "").toLowerCase()}`} style={{ flexShrink: 0, marginLeft: "8px" }}>{t.severity}</span>
                      </div>
                    ))}
                    <div style={{ fontWeight: 500, fontSize: "13px", margin: "1rem 0 8px" }}>Recommendations</div>
                    {(aiResult.recommendations || []).map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: "10px", padding: "6px 0", borderBottom: "0.5px solid #333", fontSize: "13px" }}>
                        <span style={{ color: "#6366f1", fontWeight: 500 }}>{i + 1}.</span><span>{r}</span>
                      </div>
                    ))}
                    {aiResult.complianceNotes && (
                      <div style={{ marginTop: "1rem", background: "rgba(245,158,11,0.1)", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#f59e0b" }}>
                        ?? {aiResult.complianceNotes}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "blocked" && (
              <div>
                <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>Domains and IPs automatically blocked due to High or Critical risk scores.</div>
                {blockedUrls.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "#22c55e" }}>? No blocked URLs yet.</div>
                ) : blockedUrls.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid #333", fontSize: "13px" }}>
                    <div>
                      <div style={{ fontWeight: 500, color: "#ef4444" }}>?? {item.domain}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>{new Date(item.blockedAt).toLocaleString()}</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "13px" }}>{item.score}/100</span>
                      <span className={`risk-tag ${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "1rem", flexWrap: "wrap" }}>
              <button className="btn-secondary" onClick={copyReport}>?? Copy Report</button>
              <button className="btn-secondary" onClick={downloadJSON}>? Download JSON</button>
              <button className="btn-secondary" onClick={() => window.print()}>?? Print / PDF</button>
              {email && scanResult && (
                <button className="btn-secondary" onClick={sendEmailReport} disabled={emailSending}>
                  {emailSending ? "? Sending..." : "?? Email Report"}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <div className="report-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "1rem" }}>Recent scans</h3>
        {history.length === 0 ? <div style={{ fontSize: "13px", color: "#888" }}>No scans yet.</div>
          : history.map((item, i) => (
            <div key={i} onClick={() => setDomain(item.domain)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid #333", cursor: "pointer", fontSize: "13px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontWeight: 500 }}>{item.domain}</span>
                  {item.targetType === "ip" && <span style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1", fontSize: "10px", padding: "1px 6px", borderRadius: "3px" }}>IP</span>}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>{item.date}</div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>{item.score}/100</span>
                <span className={`risk-tag ${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span>
              </div>
            </div>
          ))}
      </div>

      <div className="button-row" style={{ marginTop: "1.5rem" }}>
        <button className="btn-secondary" onClick={() => navigate("/")}>? Back to Home</button>
      </div>
    </div>
  );
};

export default AutoAssessment;
