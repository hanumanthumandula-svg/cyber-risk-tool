import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const questions = [
  { id: 'patch', domain: 'Patch Management', question: 'How regularly are systems patched and updated?', options: [ { label: 'Within 24 hours of release', score: 10 }, { label: 'Within 1 week', score: 7 }, { label: 'Within 1 month', score: 4 }, { label: 'Rarely or never', score: 0 } ] },
  { id: 'mfa', domain: 'MFA / Authentication', question: 'Is Multi-Factor Authentication (MFA) enforced?', options: [ { label: 'Enforced for all users', score: 10 }, { label: 'Enforced for admins only', score: 6 }, { label: 'Optional for users', score: 3 }, { label: 'Not implemented', score: 0 } ] },
  { id: 'monitoring', domain: 'Monitoring & Detection', question: 'Do you have security monitoring and alerting in place?', options: [ { label: '24/7 automated monitoring', score: 10 }, { label: 'Business hours monitoring', score: 6 }, { label: 'Manual checks occasionally', score: 3 }, { label: 'No monitoring', score: 0 } ] },
  { id: 'backup', domain: 'Backup & Recovery', question: 'How often are backups performed and tested?', options: [ { label: 'Daily backups with monthly testing', score: 10 }, { label: 'Weekly backups', score: 7 }, { label: 'Monthly backups', score: 4 }, { label: 'No regular backups', score: 0 } ] },
  { id: 'access', domain: 'Access Control', question: 'How is user access managed in your organization?', options: [ { label: 'Role-based with regular reviews', score: 10 }, { label: 'Role-based without reviews', score: 6 }, { label: 'Basic user accounts', score: 3 }, { label: 'No formal access control', score: 0 } ] },
  { id: 'training', domain: 'Security Awareness', question: 'Do employees receive security awareness training?', options: [ { label: 'Regular training and phishing tests', score: 10 }, { label: 'Annual training', score: 6 }, { label: 'Occasional informal training', score: 3 }, { label: 'No training', score: 0 } ] },
  { id: 'encryption', domain: 'Encryption', question: 'Is sensitive data encrypted at rest and in transit?', options: [ { label: 'Fully encrypted everywhere', score: 10 }, { label: 'Encrypted in transit only', score: 6 }, { label: 'Partial encryption', score: 3 }, { label: 'No encryption', score: 0 } ] },
  { id: 'incident', domain: 'Incident Response', question: 'Do you have an incident response plan?', options: [ { label: 'Documented and tested plan', score: 10 }, { label: 'Documented but not tested', score: 6 }, { label: 'Informal process', score: 3 }, { label: 'No plan', score: 0 } ] },
];

function Questionnaire() {
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  const handleAnswer = (questionId, score, label) => {
    setAnswers(prev => ({ ...prev, [questionId]: { score, label } }));
  };

  const handleNext = () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions');
      return;
    }
    localStorage.setItem('answers', JSON.stringify(answers));
    navigate('/riskscore');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Step 2 — Security Questionnaire</h2>
        <p>Answer all 8 questions honestly for an accurate assessment</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}></div>
        </div>
        <span>{Object.keys(answers).length} of {questions.length} answered</span>
      </div>
      <div className="questions-list">
        {questions.map((q, index) => (
          <div key={q.id} className="question-card">
            <div className="question-header">
              <span className="domain-badge">{q.domain}</span>
              <span className="question-num">Q{index + 1}</span>
            </div>
            <p className="question-text">{q.question}</p>
            <div className="options-list">
              {q.options.map((opt) => (
                <div
                  key={opt.label}
                  className={`option ${answers[q.id]?.label === opt.label ? 'selected' : ''}`}
                  onClick={() => handleAnswer(q.id, opt.score, opt.label)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="button-row">
        <button className="btn-secondary" onClick={() => navigate('/assets')}>← Back</button>
        <button className="btn-primary" onClick={handleNext}>Next: View Risk Score →</button>
      </div>
    </div>
  );
}

export default Questionnaire;