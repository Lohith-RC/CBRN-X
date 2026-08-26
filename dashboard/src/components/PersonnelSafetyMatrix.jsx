import React from 'react';
import { Shield, Clock, Activity, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';

const RESPONDERS = [
  {
    id: 'tr-001',
    name: 'Inspector Lohith R C',
    unit: '10th NDRF Bn (Alpha Team)',
    scbaPsi: 2450,
    maxPsi: 3000,
    ppeStatus: { mask: true, suit: true, gloves: true },
    exposureTime: '28m 15s',
    maxExposure: '45m 00s',
    heartRate: 118,
    status: 'ACTIVE_HOTZONE',
    color: '#10b981',
  },
  {
    id: 'tr-002',
    name: 'Sub-Inspector Rajesh Kumar',
    unit: '10th NDRF Bn (Bravo Team)',
    scbaPsi: 1820,
    maxPsi: 3000,
    ppeStatus: { mask: true, suit: true, gloves: true },
    exposureTime: '34m 10s',
    maxExposure: '45m 00s',
    heartRate: 132,
    status: 'ACTIVE_HOTZONE',
    color: '#8b5cf6',
  },
  {
    id: 'tr-003',
    name: 'Constable Vikram Singh',
    unit: '10th NDRF Bn (Charlie Team)',
    scbaPsi: 850,
    maxPsi: 3000,
    ppeStatus: { mask: true, suit: true, gloves: false },
    exposureTime: '41m 05s',
    maxExposure: '45m 00s',
    heartRate: 145,
    status: 'WARNING_LOW_AIR',
    color: '#ef4444',
  },
];

export default function PersonnelSafetyMatrix() {
  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '22px' }}>
      <div className="section-header-tactical" style={{ marginBottom: '16px' }}>
        <h2 className="section-title-glow">
          <Shield size={20} color="var(--accent-green)" />
          Personnel Safety &amp; SCBA Readiness Matrix
        </h2>
        <span className="badge badge-passed" style={{ fontSize: '0.7rem' }}>
          <span className="pulse-beacon" /> 3 Responders Deployed
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {RESPONDERS.map((r) => {
          const scbaPct = Math.round((r.scbaPsi / r.maxPsi) * 100);
          const isLowAir = scbaPct < 30;

          return (
            <div
              key={r.id}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${isLowAir ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '12px',
                padding: '16px',
                position: 'relative',
                boxShadow: isLowAir ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'none',
              }}
            >
              {/* Header Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>{r.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{r.unit}</div>
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isLowAir ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: isLowAir ? '#fca5a5' : '#6ee7b7',
                    border: `1px solid ${isLowAir ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                  }}
                >
                  {isLowAir ? '⚠️ LOW AIR WARN' : 'LEVEL-A ACTIVE'}
                </span>
              </div>

              {/* SCBA Air Pressure Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={12} color={isLowAir ? '#ef4444' : 'var(--accent-cyan)'} /> SCBA Air Pressure
                  </span>
                  <span style={{ color: isLowAir ? '#ef4444' : '#fff', fontWeight: 800 }}>
                    {r.scbaPsi} PSI ({scbaPct}%)
                  </span>
                </div>
                <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${scbaPct}%`,
                      background: isLowAir
                        ? 'linear-gradient(90deg, #ef4444, #f87171)'
                        : 'linear-gradient(90deg, #10b981, #06b6d4)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>

              {/* Exposure Time & Heart Rate Vitals */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>EXPOSURE TIMER</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
                    {r.exposureTime} / {r.maxExposure}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>HEART RATE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: r.heartRate > 140 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {r.heartRate} BPM
                  </div>
                </div>
              </div>

              {/* PPE Donning Checklist Pills */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PPE:</span>
                {[
                  { label: 'MASK', ok: r.ppeStatus.mask },
                  { label: 'SUIT', ok: r.ppeStatus.suit },
                  { label: 'GLOVES', ok: r.ppeStatus.gloves },
                ].map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: item.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: item.ok ? '#10b981' : '#ef4444',
                      border: `1px solid ${item.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                  >
                    {item.ok ? '✓' : '✗'} {item.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
