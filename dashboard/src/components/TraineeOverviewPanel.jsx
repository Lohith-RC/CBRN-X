import React, { useState } from 'react';
import { CheckSquare, Square, Clock, MapPin, Radio, AlertTriangle } from 'lucide-react';

export default function TraineeOverviewPanel({ onTriggerEmergency }) {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Secure perimeter, sector B-4', done: true },
    { id: 2, text: 'Scan for debris & obstruction', done: true },
    { id: 3, text: 'Structural instability: shear point', done: false },
    { id: 4, text: 'Shed structural instability', done: false },
  ]);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div
      className="glass-card-deep"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          TRAINEE OVERVIEW
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
          Operator J. Patel
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Next Objective */}
        <div>
          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
            NEXT OBJECTIVE
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-purple)', marginBottom: '8px' }}>
            SECURE PERIMETER: SECTOR B-4
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  color: t.done ? 'var(--text-muted)' : '#fff',
                  textDecoration: t.done ? 'line-through' : 'none',
                }}
              >
                {t.done ? (
                  <CheckSquare size={14} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                ) : (
                  <Square size={14} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
                )}
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Timer & Location Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={10} /> TASK TIMER
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              12:34
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              REMAINING
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={10} /> LOCATION
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              B-4
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SECTOR GRID
            </div>
          </div>
        </div>

        {/* Radiation & Environmental Monitor */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              RADIATION LEVEL
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              SAFE (0.02 mSv)
            </div>
          </div>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)',
              fontSize: '0.75rem',
              fontWeight: '700',
            }}
          >
            ✓
          </div>
        </div>

        {/* Quick Action Links */}
        <div>
          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
            QUICK CONTROLS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center' }}
            >
              <Radio size={12} /> COMMS
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '6px', justifyContent: 'center', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
              onClick={onTriggerEmergency}
            >
              <AlertTriangle size={12} /> DRILL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
