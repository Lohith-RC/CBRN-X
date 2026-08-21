import React from 'react';
import { X, CheckCircle2, AlertTriangle, Lightbulb, Shield, ShieldAlert, Award } from 'lucide-react';

export default function SessionDetailModal({ session, onClose }) {
  if (!session) return null;

  const breakdown = session.breakdown || {};
  const mistakes = session.mistakes || [];
  const recommendations = session.recommendations || [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        position: 'relative',
        background: '#121a29',
        border: '1px solid rgba(245, 130, 32, 0.4)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Modal Header */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '18px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>
              NDRF Mission Evaluation Report
            </h2>
            <span className={`badge badge-${(session.passStatus || 'pending').toLowerCase()}`}>
              {session.passStatus === 'PASSED' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {session.passStatus}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Responder: <strong>{session.traineeName}</strong> ({session.batchUnit}) • Scenario: {session.scenarioTitle}
          </p>
        </div>

        {/* Score Header Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)', paddingRight: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FINAL SCORE</div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              color: session.finalScore >= 70 ? 'var(--accent-green)' : 'var(--accent-red)',
              margin: '4px 0'
            }}>
              {session.finalScore}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pass Mark: 70 / 100</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px' }}>PROTOCOL STAGE SCORES</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
              <div>🛡️ PPE Donning: <strong>{breakdown.ppeScore || 0} / 10</strong></div>
              <div>🔍 Detection: <strong>{breakdown.detectionScore || 0} / 10</strong></div>
              <div>🏃 Evacuation: <strong>{breakdown.evacuationScore || 0} / 15</strong></div>
              <div>🛠️ Containment: <strong>{breakdown.containmentScore || 0} / 15</strong></div>
              <div>🚿 Decontamination: <strong>{breakdown.decontaminationScore || 0} / 10</strong></div>
              <div>⚡ Time Bonus: <strong>{breakdown.timeBonusScore || 0} / 20</strong></div>
            </div>
          </div>
        </div>

        {/* Mistakes Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="var(--accent-red)" />
            Protocol Compliance Mistakes & Deductions ({mistakes.length})
          </h3>
          {mistakes.length === 0 ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: '8px', color: 'var(--accent-green)', fontSize: '0.85rem' }}>
              ✅ Perfect protocol adherence! Zero protocol errors committed during this mission.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mistakes.map((m, idx) => (
                <div key={idx} style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-red)', textTransform: 'uppercase' }}>
                      [{m.severity}] STAGE: {m.stage}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '2px' }}>
                      {m.description}
                    </div>
                  </div>
                  <span style={{ fontWeight: '700', color: 'var(--accent-red)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    -{m.deductionPoints} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={18} color="var(--accent-ndrf-orange)" />
            NDRF Trainer Tactical Recommendations
          </h3>
          <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recommendations.map((rec, idx) => (
              <li key={idx} style={{ color: '#fff' }}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
