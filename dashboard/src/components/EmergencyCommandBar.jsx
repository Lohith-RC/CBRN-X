import React, { useState } from 'react';
import { AlertOctagon, Flame, Power, ShieldAlert, X } from 'lucide-react';

export default function EmergencyCommandBar({ onTriggerEmergency }) {
  const [activeModal, setActiveModal] = useState(null); // 'evac' | 'abort' | 'kill'
  const [confirmCount, setConfirmCount] = useState(2);

  const handleActionClick = (actionType) => {
    setActiveModal(actionType);
    setConfirmCount(2);
  };

  const handleConfirm = () => {
    if (confirmCount > 1) {
      setConfirmCount((prev) => prev - 1);
    } else {
      if (activeModal === 'evac') {
        alert('🚨 MASS EVACUATION SIGNAL BROADCASTED TO ALL ACTIVE VR HEADSETS & HOT-ZONE UNITS!');
      } else if (activeModal === 'abort') {
        alert('⚠️ SIMULATION DRILL ABORTED. Incident logs persisted.');
      } else if (activeModal === 'kill') {
        alert('⚡ SYSTEM EMERGENCY KILL-SWITCH ENGAGED. Hardware power cut signal dispatched.');
      }
      setActiveModal(null);
    }
  };

  return (
    <>
      {/* Fixed Emergency Action Bar Stripe */}
      <div
        className="glass-card-deep"
        style={{
          padding: '14px 20px',
          marginBottom: '28px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          background: 'linear-gradient(135deg, rgba(24, 10, 15, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
              EMERGENCY COMMAND OVERRIDE INTERFACE
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Battalion Commander High-Priority Instant Controls • Zero-Delay Override
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Mass Evac Signal Button */}
          <button
            onClick={() => handleActionClick('evac')}
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: '#fff',
              border: '1px solid rgba(239, 68, 68, 0.6)',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <Flame size={15} /> MASS EVACUATION
          </button>

          {/* Drill Abort Button */}
          <button
            onClick={() => handleActionClick('abort')}
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.4) 100%)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.6)',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <AlertOctagon size={15} /> ABORT DRILL
          </button>

          {/* System Kill Switch Button */}
          <button
            onClick={() => handleActionClick('kill')}
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Power size={15} /> KILL-SWITCH
          </button>
        </div>
      </div>

      {/* Fail-Safe Action Modal Guard */}
      {activeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(5, 8, 14, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            className="glass-card-deep"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '28px',
              border: '1px solid rgba(239, 68, 68, 0.6)',
              borderRadius: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                marginBottom: '16px',
              }}
            >
              <ShieldAlert size={28} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              CONFIRM {activeModal.toUpperCase()} OVERRIDE
            </h3>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>
              This high-priority command will override all active field operations. Click confirm{' '}
              <strong style={{ color: '#ef4444' }}>{confirmCount} more time(s)</strong> to execute.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => setActiveModal(null)}
                style={{ padding: '10px 18px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                }}
              >
                CONFIRM EXECUTION ({confirmCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
