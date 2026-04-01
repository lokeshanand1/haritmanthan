import { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import './ContractorDashboard.css';

function hoursBetween(a, b) {
  if (!a || !b) return null;
  return Math.max(0, (b - a) / 3600000);
}

export default function ContractorDashboard() {
  const { contractors, reports, pointsEvents } = useGame();
  const [selectedId, setSelectedId] = useState(contractors?.[0]?.contractorId || null);
  const [costPerHour, setCostPerHour] = useState(500);

  const last30Cutoff = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);

  const pointsAwardedViaBounties = useMemo(() => {
    return (pointsEvents || [])
      .filter(e => e.reason === 'verification_bounty')
      .reduce((sum, e) => sum + (e.delta || 0), 0);
  }, [pointsEvents]);

  const contractorMetrics = useMemo(() => {
    const byContractor = new Map();
    (contractors || []).forEach(c => {
      byContractor.set(c.contractorId, {
        contractor: c,
        totalAssigned: 0,
        onTimeResolved: 0,
        resolvedCount: 0,
        avgResolutionHours: null,
        penaltyScore: 0,
        wastedFundsEstimate: 0,
        reports: [],
      });
    });

    (reports || []).forEach(r => {
      if (!r.assignedTo) return;
      if ((r.reportedAt || r.timestamp || 0) < last30Cutoff) return;
      const bucket = byContractor.get(r.assignedTo);
      if (!bucket) return;
      bucket.totalAssigned += 1;
      bucket.penaltyScore += (r.penaltyScore || 0);
      bucket.reports.push(r);

      if (r.resolvedAt) {
        bucket.resolvedCount += 1;
        const onTime = r.resolutionDeadline ? (r.resolvedAt <= r.resolutionDeadline) : true;
        if (onTime) bucket.onTimeResolved += 1;
      }

      if (r.resolutionDeadline && r.resolvedAt && r.resolvedAt > r.resolutionDeadline) {
        const hoursLate = hoursBetween(r.resolutionDeadline, r.resolvedAt) || 0;
        bucket.wastedFundsEstimate += hoursLate * costPerHour * Math.max(1, (r.penaltyScore || 10) / 10);
      }
    });

    // avg resolution
    for (const b of byContractor.values()) {
      const resTimes = b.reports
        .map(r => hoursBetween(r.reportedAt || r.timestamp, r.resolvedAt))
        .filter(v => typeof v === 'number');
      b.avgResolutionHours = resTimes.length ? (resTimes.reduce((s, v) => s + v, 0) / resTimes.length) : null;
    }

    return Array.from(byContractor.values());
  }, [contractors, costPerHour, last30Cutoff, reports]);

  const selected = useMemo(() => contractorMetrics.find(m => m.contractor.contractorId === selectedId) || null, [contractorMetrics, selectedId]);

  return (
    <div className="contractor-page">
      <div className="contractor-top">
        <div>
          <h2>Contractor Oversight</h2>
          <div className="cd-sub">Last 30 days • Bounty points awarded: <strong>{pointsAwardedViaBounties}</strong></div>
        </div>
        <div className="cd-controls">
          <label className="cd-label">
            Cost/hour (₹)
            <input className="input cd-input" type="number" value={costPerHour} onChange={(e) => setCostPerHour(Number(e.target.value || 0))} />
          </label>
          <button className="btn btn-secondary" onClick={() => window.print()}>Generate Penalty Report (mock)</button>
        </div>
      </div>

      <div className="cd-grid">
        <div className="cd-card glass">
          <h3>Contractors</h3>
          <div className="cd-table">
            <div className="cd-tr cd-th">
              <div>Name</div>
              <div>Assigned</div>
              <div>On-time</div>
              <div>Avg hrs</div>
              <div>Penalty</div>
              <div>Wasted ₹</div>
            </div>
            {contractorMetrics.map(m => {
              const rate = m.resolvedCount ? Math.round((m.onTimeResolved / m.resolvedCount) * 100) : 0;
              return (
                <button
                  key={m.contractor.contractorId}
                  className={`cd-tr cd-row ${selectedId === m.contractor.contractorId ? 'active' : ''}`}
                  onClick={() => setSelectedId(m.contractor.contractorId)}
                >
                  <div className="cd-name">{m.contractor.name}</div>
                  <div>{m.totalAssigned}</div>
                  <div>{rate}%</div>
                  <div>{m.avgResolutionHours === null ? '—' : m.avgResolutionHours.toFixed(1)}</div>
                  <div>{m.penaltyScore}</div>
                  <div>{Math.round(m.wastedFundsEstimate).toLocaleString()}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="cd-card glass">
          <h3>Detailed View</h3>
          {!selected && <div className="cd-empty">Select a contractor to view details.</div>}
          {selected && (
            <>
              <div className="cd-detail-head">
                <div className="cd-detail-name">{selected.contractor.name}</div>
                <div className="cd-detail-meta">
                  Contact: {selected.contractor.contactEmail} • Penalty: <strong>{selected.penaltyScore}</strong>
                </div>
              </div>

              <div className="cd-mini-graph">
                {(selected.reports || []).slice(0, 12).map(r => {
                  const lateH = r.resolutionDeadline && r.resolvedAt ? hoursBetween(r.resolutionDeadline, r.resolvedAt) : 0;
                  const h = Math.min(100, Math.round((lateH || 0) * 6));
                  return (
                    <div key={r.reportId || r.id} className="cd-bar-wrap" title={`Late hours: ${lateH?.toFixed?.(1) || 0}`}>
                      <div className="cd-bar" style={{ height: `${Math.max(8, h)}%` }} />
                    </div>
                  );
                })}
              </div>

              <div className="cd-report-list">
                {(selected.reports || []).slice(0, 20).map(r => {
                  const rid = r.reportId || r.id;
                  const resHrs = r.resolvedAt ? hoursBetween(r.reportedAt || r.timestamp, r.resolvedAt) : null;
                  const late = r.resolutionDeadline && r.resolvedAt ? (r.resolvedAt > r.resolutionDeadline) : false;
                  return (
                    <div key={rid} className="cd-report-row">
                      <div className="cd-report-main">
                        <div className="cd-report-title">
                          <strong>{r.type}</strong> • {r.category || '—'} • <span className={`cd-pill ${r.status}`}>{r.status}</span>
                        </div>
                        <div className="cd-report-sub">
                          Deadline: {r.resolutionDeadline ? new Date(r.resolutionDeadline).toLocaleString() : '—'}
                          {' '}• Res time: {resHrs === null ? '—' : `${resHrs.toFixed(1)}h`}
                          {' '}• {late ? '⛔ missed SLA' : '✅ on time'}
                          {' '}• Penalty: {r.penaltyScore || 0}
                        </div>
                      </div>
                      {r.verificationPhotoUrl && (
                        <img className="cd-thumb" src={r.verificationPhotoUrl} alt="Verification" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

