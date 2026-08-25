import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind, Activity, Clock, ShieldAlert, CheckCircle2, Gauge, MapPin, Sliders, Radio } from 'lucide-react';

const EVENT_MARKERS = [
  { timeSec: 15, label: 'PPE DONNED', detail: 'Trainee equipped Level-A suit & SCBA respirator', type: 'SUCCESS' },
  { timeSec: 45, label: 'PID CALIBRATED', detail: 'Photoionization Detector zeroed at 0.02 ppm', type: 'INFO' },
  { timeSec: 70, label: 'LEAK LOCATED', detail: 'Primary chlorine rupture identified at Drum #3', type: 'WARNING' },
  { timeSec: 90, label: 'SEALANT APPLIED', detail: 'Neutralizer aerosol spray applied to container', type: 'SUCCESS' },
  { timeSec: 110, label: 'SAFETY VIOLATION', detail: 'Safety line disconnected near Sector B-4', type: 'VIOLATION' },
  { timeSec: 135, label: 'DECON COMPLETE', detail: 'Archway shower decontamination procedure verified', type: 'SUCCESS' },
];

export default function MissionReplayControls({ durationSeconds = 145, sessionData }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const updatePlayhead = (now) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + deltaSec * speedMultiplier;
        if (next >= durationSeconds) {
          setIsPlaying(false);
          return durationSeconds;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(updatePlayhead);
    };

    animationRef.current = requestAnimationFrame(updatePlayhead);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, speedMultiplier, durationSeconds]);

  const togglePlay = () => setIsPlaying((prev) => !prev);

  const stepTime = (delta) => {
    setCurrentTime((prev) => Math.max(0, Math.min(durationSeconds, prev + delta)));
  };

  const handleScrub = (e) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  const jumpToMarker = (sec) => {
    setCurrentTime(sec);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Interpolated telemetry snapshots
  const progressRatio = currentTime / durationSeconds;
  const currentPos = {
    x: (1.5 + Math.sin(progressRatio * Math.PI * 2) * 3.2).toFixed(2),
    z: (7.4 - progressRatio * 4.5).toFixed(2),
  };
  const scbaPressure = Math.max(400, Math.round(2450 - progressRatio * 1600));
  const ppmReading = (progressRatio < 0.3 ? 0.02 : progressRatio < 0.7 ? (4.2 + Math.sin(progressRatio * 10) * 1.5).toFixed(2) : 0.05);

  const activeEvent = EVENT_MARKERS.slice().reverse().find((m) => currentTime >= m.timeSec);

  return (
    <div
      className="glass-card-deep animate-fade-in"
      style={{
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        background: 'linear-gradient(145deg, rgba(8, 14, 26, 0.95) 0%, rgba(13, 22, 38, 0.98) 100%)',
      }}
    >
      {/* DVR Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
            }}
          >
            <Radio size={20} className={isPlaying ? 'animate-spin' : ''} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', letterSpacing: '0.02em' }}>
              MISSION DVR REPLAY &amp; TIMELINE SCRUBBER
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Second-by-second tactical telemetry playback for session debriefing
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            PLAYBACK SPEED:
          </span>
          {[0.5, 1, 2, 4].map((mult) => (
            <button
              key={mult}
              onClick={() => setSpeedMultiplier(mult)}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: speedMultiplier === mult ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)',
                background: speedMultiplier === mult ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                color: speedMultiplier === mult ? '#06b6d4' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {mult}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline Slider with Event Markers */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#06b6d4' }}>
            {formatTime(currentTime)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {formatTime(durationSeconds)}</span>
          </span>

          {activeEvent && (
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '12px',
                background: activeEvent.type === 'VIOLATION' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: activeEvent.type === 'VIOLATION' ? '#ef4444' : '#10b981',
                border: `1px solid ${activeEvent.type === 'VIOLATION' ? '#ef4444' : '#10b981'}`,
              }}
            >
              ▶ {activeEvent.label}: {activeEvent.detail}
            </span>
          )}
        </div>

        {/* Range Slider Track */}
        <div style={{ position: 'relative', margin: '12px 0' }}>
          <input
            type="range"
            min="0"
            max={durationSeconds}
            step="0.1"
            value={currentTime}
            onChange={handleScrub}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              outline: 'none',
              background: `linear-gradient(to right, #06b6d4 ${progressRatio * 100}%, rgba(255, 255, 255, 0.1) ${progressRatio * 100}%)`,
              cursor: 'pointer',
            }}
          />

          {/* Event Marker Pins */}
          {EVENT_MARKERS.map((marker, i) => {
            const leftPct = (marker.timeSec / durationSeconds) * 100;
            const isPassed = currentTime >= marker.timeSec;
            const isViolation = marker.type === 'VIOLATION';

            return (
              <div
                key={i}
                onClick={() => jumpToMarker(marker.timeSec)}
                title={`${formatTime(marker.timeSec)} - ${marker.label}: ${marker.detail}`}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: `${leftPct}%`,
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: isViolation ? '#ef4444' : isPassed ? '#10b981' : '#3b82f6',
                  border: '2px solid #000',
                  boxShadow: `0 0 10px ${isViolation ? '#ef4444' : '#10b981'}`,
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Control Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <button
          onClick={() => stepTime(-5)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Rewind size={14} /> -5s
        </button>

        <button
          onClick={togglePlay}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            background: isPlaying ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #06b6d4, #0284c7)',
            border: 'none',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: '800',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: isPlaying ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(6, 182, 212, 0.4)',
          }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'PAUSE REPLAY' : 'START REPLAY'}
        </button>

        <button
          onClick={() => stepTime(5)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          +5s <FastForward size={14} />
        </button>

        <button
          onClick={() => setCurrentTime(0)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Synced Telemetry Snapshot Display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} color="#06b6d4" /> SPATIAL POSITION
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '4px' }}>
            X: {currentPos.x} | Z: {currentPos.z}
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Gauge size={12} color={scbaPressure < 800 ? '#ef4444' : '#10b981'} /> SCBA AIR TANK
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: scbaPressure < 800 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
            {scbaPressure} PSI
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} color="#f59e0b" /> GAS TOXICITY (PID)
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#f59e0b', marginTop: '4px' }}>
            {ppmReading} ppm
          </div>
        </div>
      </div>
    </div>
  );
}
