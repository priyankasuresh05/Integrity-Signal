import { useEffect, useState } from "react";
import { getDashboard } from "../api";

function RiskMeter({ score, category }) {
  const needleClass = category.includes("High") ? "high" : category.includes("Normal") ? "normal" : "";
  return (
    <div className="risk-meter">
      <div className="ticks">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className={`tick ${i % 5 === 0 ? "major" : ""}`} />
        ))}
      </div>
      <div className={`needle ${needleClass}`} style={{ left: `${score}%` }} />
    </div>
  );
}

function badgeClass(category) {
  if (category.includes("High")) return "high";
  if (category.includes("Moderate")) return "moderate";
  return "normal";
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = () => getDashboard().then(setData);
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <p>Loading dashboard...</p>;

  const selectedCandidate = data.candidates.find((c) => c.candidateId === selected);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Integrity signal — examiner view</h1>
          <p style={{ color: "var(--text-dim)", marginTop: 6 }}>
            {data.candidates.length} candidate(s) · auto-refreshing every 5s
          </p>
        </div>
      </div>

      <table className="candidate-table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Risk score</th>
            <th>Reading</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {data.candidates.map((c) => (
            <tr key={c.candidateId} className="candidate-row" onClick={() => setSelected(c.candidateId)}>
              <td>{c.name} <span className="mono" style={{ color: "var(--text-dim)", fontSize: 12 }}>#{c.candidateId}</span></td>
              <td className="mono">{c.avgScore}/100</td>
              <td><RiskMeter score={c.avgScore} category={c.category} /></td>
              <td><span className={`badge ${badgeClass(c.category)}`}>{c.category}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCandidate && (
        <div className="detail-panel">
          <h3>{selectedCandidate.name} — per-question breakdown</h3>
          {selectedCandidate.questionResults.map((r) => (
            <div key={r.questionId} style={{ marginTop: 16 }}>
              <div className="q-meta">
                <span>{r.questionId} · {r.questionType}</span>
                <span className="mono">score {r.score}/100 · {r.confidence}</span>
              </div>
              {r.flags.length === 0 ? (
                <div className="flag-item">No anomalies detected.</div>
              ) : (
                r.flags.map((f, i) => <div key={i} className="flag-item">⚠ {f}</div>)
              )}
            </div>
          ))}
          <div className="disclaimer">
            These scores are advisory behavioral signals derived from timing and typing
            patterns, not proof of misconduct. Camera-based signals cannot be captured here
            by design — always pair a high or moderate reading with human review before
            taking any action against a candidate.
          </div>
        </div>
      )}
    </div>
  );
}
