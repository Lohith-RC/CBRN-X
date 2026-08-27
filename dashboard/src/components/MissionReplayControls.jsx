import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, FastForward, Rewind, Activity, Clock, ShieldAlert,
  CheckCircle2, Gauge, MapPin, Radio, SkipBack, SkipForward, ChevronLeft,
  ChevronRight, AlertTriangle, Compass, TrendingUp, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  ReferenceLine, CartesianGrid
} from 'recharts';

/**
 * Event Milestone Tagging Dataset
 * Red: Violations
 * Yellow: Gas Spikes
 * Green: Donning Completions
 */
const EVENT_MARKERS = [
  {
    timeSec: 15,
    label: 'PPE DONNING COMPLETE',
    detail: 'Level-A suit donned & SCBA positive-pressure seal verified',
    type: 'DONNING_COMPLETE',
    color: '#10b981', // Green
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeBorder: 'rgba(16, 185, 129, 0.5)',
  },
  {
    timeSec: 42,
    label: 'GAS SPIKE DETECTED',
    detail: 'Chlorine concentration spiked to 4.85 ppm near Sector B-2',
    type: 'GAS_SPIKE',
    color: '#eab308', // Yellow
    badgeBg: 'rgba(234, 179, 8, 0.2)',
    badgeBorder: 'rgba(234, 179, 8, 0.5)',
  },
  {
    timeSec: 75,
    label: 'CONTAINMENT LEAK PINPOINTED',
    detail: 'Secondary hazardous gas plume rupture located at Valve #4',
    type: 'GAS_SPIKE',
    color: '#eab308', // Yellow
    badgeBg: 'rgba(234, 179, 8, 0.2)',
    badgeBorder: 'rgba(234, 179, 8, 0.5)',
  },
  {
    timeSec: 92,
    label: 'SUIT LOCKDOWN VERIFIED',
    detail: 'Secondary seal lock & auxiliary oxygen bypass initialized',
    type: 'DONNING_COMPLETE',
    color: '#10b981', // Green
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeBorder: 'rgba(16, 185, 129, 0.5)',
  },
  {
    timeSec: 112,
    label: 'SAFETY LINE VIOLATION',
    detail: 'Trainee safety tether unclipped in active hot-zone perimeter',
    type: 'VIOLATION',
    color: '#ef4444', // Red
    badgeBg: 'rgba(239, 68, 68, 0.2)',
    badgeBorder: 'rgba(239, 68, 68, 0.5)',
  },
  {
    timeSec: 138,
    label: 'DECON PROCEDURES COMPLETE',
    detail: 'Archway shower decontamination procedure verified & logged',
    type: 'DONNING_COMPLETE',
    color: '#10b981', // Green
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeBorder: 'rgba(16, 185, 129, 0.5)',
  },
];

export default function MissionReplayControls({ durationSeconds = 145, sessionData, onTimeChange }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Notify parent of timestamp changes if callback is provided
  const updateTimeState = (newTime) => {
    const clamped = Math.max(0, Math.min(durationSeconds, newTime));
    setCurrentTime(clamped);
    if (onTimeChange) {
      onTimeChange(clamped);
    }
  };

  // Playback Loop
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
          if (onTimeChange) onTimeChange(durationSeconds);
          return durationSeconds;
        }
        if (onTimeChange) onTimeChange(next);
        return next;
      });

      animationRef.current = requestAnimationFrame(updatePlayhead);
    };

    animationRef.current = requestAnimationFrame(updatePlayhead);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, speedMultiplier, durationSeconds, onTimeChange]);

  const togglePlay = () => setIsPlaying((prev) => !prev);

  const stepTime = (deltaSec) => {
    updateTimeState(currentTime + deltaSec);
  };

  const handleScrub = (e) => {
    updateTimeState(parseFloat(e.target.value));
  };

  const jumpToMarker = (sec) => {
    updateTimeState(sec);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  // Synchronized telemetry curve data (0s to durationSeconds)
  const telemetryTimeline = useMemo(() => {
    const points = [];
    const totalSteps = Math.ceil(durationSeconds);

    for (let t = 0; t <= totalSteps; t += 1) {
      let ppm = 0.02;
      if (t >= 30 && t < 45) {
        ppm = 0.02 + ((t - 30) / 15) * 4.83; // Spike up to 4.85 ppm
      } else if (t >= 45 && t < 75) {
        ppm = 4.85 - Math.sin((t - 45) * 0.1) * 0.8; // Elevated wave
      } else if (t >= 75 && t < 95) {
        ppm = Math.max(0.2, 4.05 - ((t - 75) / 20) * 3.8); // Containment decay
      } else if (t >= 95) {
        ppm = 0.05 + Math.sin(t * 0.05) * 0.02; // Neutralized cold zone
      }

      points.push({
        timeSec: t,
        formattedTime: `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`,
        ppm: parseFloat(ppm.toFixed(2)),
        threshold: 2.0, // Safety threshold limit
      });
    }

    return points;
  }, [durationSeconds]);

  // Synchronized telemetry snapshot for current timestamp
  const progressRatio = currentTime / durationSeconds;

  // Synced spatial trajectory coordinates
  const currentPos = useMemo(() => {
    // Spatial path interpolation: Cold zone -> Warm Zone -> Epicenter -> Decon Arch
    const x = (-8.0 + progressRatio * 16.5 + Math.sin(progressRatio * Math.PI * 3) * 2.4).toFixed(2);
    const z = (-10.0 + Math.cos(progressRatio * Math.PI * 2) * 8.2 + progressRatio * 18.0).toFixed(2);
    return { x: parseFloat(x), z: parseFloat(z) };
  }, [progressRatio]);

  // Synced SCBA Air Tank & Heart Rate
  const scbaPressure = Math.max(350, Math.round(2450 - progressRatio * 1650));
  const heartRate = Math.round(72 + Math.sin(progressRatio * Math.PI * 4) * 28 + (progressRatio > 0.2 && progressRatio < 0.6 ? 25 : 0));

  // Current interpolated PPM gas reading
  const currentPpm = useMemo(() => {
    if (currentTime < 30) return (0.02 + (currentTime / 30) * 0.08).toFixed(2);
    if (currentTime < 45) return (0.10 + ((currentTime - 30) / 15) * 4.75).toFixed(2);
    if (currentTime < 75) return (4.85 - Math.sin((currentTime - 45) * 0.1) * 0.8).toFixed(2);
    if (currentTime < 95) return Math.max(0.1, 4.05 - ((currentTime - 75) / 20) * 3.95).toFixed(2);
    return (0.05 + Math.sin(currentTime) * 0.02).toFixed(2);
  }, [currentTime]);

  // Radar mapped coordinates (Scale spatial X, Z to 500x260 SVG radar box)
  // X range [-12, 12] -> [20, 480], Z range [-12, 12] -> [240, 20]
  const radarX = 250 + currentPos.x * 18;
  const radarY = 140 - currentPos.z * 10;

  // Active milestone event banner
  const activeEvent = EVENT_MARKERS.slice().reverse().find((m) => currentTime >= m.timeSec);

  return (
    <div
      className="glass-card-deep animate-fade-in"
      style={{
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        background: 'linear-gradient(145deg, rgba(6, 11, 22, 0.96) 0%, rgba(11, 19, 36, 0.98) 100%)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.15)',
      }}
    >
      {/* Replay Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)',
              border: `1px solid ${isPlaying ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isPlaying ? '#ef4444' : '#06b6d4',
            }}
          >
            <Radio size={22} className={isPlaying ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', letterSpacing: '0.02em', margin: 0 }}>
              ADVANCED MISSION REPLAY SCRUBBER
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Synchronized After-Action Review (AAR) • Event Tagging &amp; High-Precision Telemetry
            </p>
          </div>
        </div>

        {/* Playback Speed Controls (0.5x, 1x, 2x, 4x) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 0, 0, 0.4)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
            PLAYBACK SPEED:
          </span>
          {[0.5, 1, 2, 4].map((mult) => (
            <button
              key={mult}
              type="button"
              onClick={() => setSpeedMultiplier(mult)}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: speedMultiplier === mult ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)',
                background: speedMultiplier === mult ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                color: speedMultiplier === mult ? '#06b6d4' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: speedMultiplier === mult ? '0 0 10px rgba(6, 182, 212, 0.3)' : 'none',
              }}
            >
              {mult}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline Slider with Color-Coded Milestone Markers */}
      <div style={{ marginBottom: '24px', background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={16} color="#06b6d4" />
            <span style={{ fontSize: '1.25rem', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#06b6d4', letterSpacing: '0.04em' }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              / {formatTime(durationSeconds)}
            </span>
          </div>

          {/* Active Milestone Event Banner */}
          {activeEvent && (
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                padding: '4px 12px',
                borderRadius: '20px',
                background: activeEvent.badgeBg,
                color: activeEvent.color,
                border: `1px solid ${activeEvent.badgeBorder}`,
                boxShadow: `0 0 12px ${activeEvent.color}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={12} color={activeEvent.color} />
              <span>{activeEvent.label}:</span>
              <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{activeEvent.detail}</span>
            </div>
          )}
        </div>

        {/* Range Slider Track with Embedded Color-Coded Milestone Pins */}
        <div style={{ position: 'relative', margin: '18px 0 14px 0' }}>
          {/* Custom Track Background */}
          <input
            type="range"
            min="0"
            max={durationSeconds}
            step="0.05"
            value={currentTime}
            onChange={handleScrub}
            aria-label="Mission replay timeline scrubber"
            style={{
              width: '100%',
              height: '10px',
              borderRadius: '5px',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #06b6d4 ${progressRatio * 100}%, rgba(255, 255, 255, 0.12) ${progressRatio * 100}%)`,
              cursor: 'pointer',
              zIndex: 2,
              position: 'relative',
            }}
          />

          {/* Milestone Pins Overlaid directly on Scrubber Track */}
          {EVENT_MARKERS.map((marker, i) => {
            const leftPct = (marker.timeSec / durationSeconds) * 100;
            const isActive = Math.abs(currentTime - marker.timeSec) < 1.5;

            return (
              <button
                key={i}
                type="button"
                onClick={() => jumpToMarker(marker.timeSec)}
                title={`${formatTime(marker.timeSec)} - [${marker.type}] ${marker.label}: ${marker.detail}`}
                aria-label={`Jump to event ${marker.label}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${leftPct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isActive ? '18px' : '14px',
                  height: isActive ? '18px' : '14px',
                  borderRadius: '50%',
                  background: marker.color,
                  border: `2px solid ${isActive ? '#ffffff' : '#000000'}`,
                  boxShadow: isActive ? `0 0 16px ${marker.color}` : `0 0 8px ${marker.color}aa`,
                  cursor: 'pointer',
                  zIndex: 4,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            );
          })}
        </div>

        {/* Milestone Event Tag Legend Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto', paddingTop: '4px' }}>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: '800' }}>
            MILESTONES:
          </span>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {EVENT_MARKERS.map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => jumpToMarker(m.timeSec)}
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${m.color}60`,
                  color: m.color,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.color }} />
                {m.label} ({m.timeSec}s)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Frame-by-Frame Navigation & Playback Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '24px',
          padding: '14px',
          background: 'rgba(0, 0, 0, 0.45)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
        }}
      >
        {/* Reset to Start */}
        <button
          type="button"
          onClick={() => updateTimeState(0)}
          title="Reset to 00:00"
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>

        {/* Rewind -5s */}
        <button
          type="button"
          onClick={() => stepTime(-5)}
          title="Rewind 5 seconds"
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Rewind size={14} /> -5s
        </button>

        {/* Frame Step Backward (-0.1s) */}
        <button
          type="button"
          onClick={() => stepTime(-0.1)}
          title="Step backward 1 frame (-0.1s)"
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#06b6d4',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)',
          }}
        >
          <ChevronLeft size={16} /> Step -1 Frame
        </button>

        {/* Main Play / Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          style={{
            padding: '10px 28px',
            borderRadius: '10px',
            background: isPlaying ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #06b6d4, #0284c7)',
            border: 'none',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: '900',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: isPlaying ? '0 0 24px rgba(239, 68, 68, 0.5)' : '0 0 24px rgba(6, 182, 212, 0.5)',
            transition: 'all 0.2s ease',
          }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'PAUSE REPLAY' : 'START REPLAY'}
        </button>

        {/* Frame Step Forward (+0.1s) */}
        <button
          type="button"
          onClick={() => stepTime(0.1)}
          title="Step forward 1 frame (+0.1s)"
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#06b6d4',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)',
          }}
        >
          Step +1 Frame <ChevronRight size={16} />
        </button>

        {/* Fast Forward +5s */}
        <button
          type="button"
          onClick={() => stepTime(5)}
          title="Fast forward 5 seconds"
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          +5s <FastForward size={14} />
        </button>
      </div>

      {/* STATE SYNCHRONIZATION VIEWPORTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        
        {/* Synchronized Component 1: Live Gas Concentration Graph */}
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#eab308', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
              <Activity size={16} /> SYNCHRONIZED GAS TOXICITY (PID)
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '900', color: parseFloat(currentPpm) > 2.0 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
              {currentPpm} ppm
            </div>
          </div>

          <div style={{ width: '100%', height: '170px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryTimeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="formattedTime" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[0, 6]} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                <Area type="monotone" dataKey="ppm" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#gasGradient)" />
                <ReferenceLine y={2.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'THRES 2.0 ppm', fill: '#ef4444', fontSize: 9 }} />
                <ReferenceLine x={`${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`} stroke="#06b6d4" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            Real-time PID curve synced to scrubber playhead ({formatTime(currentTime)})
          </div>
        </div>

        {/* Synchronized Component 2: Trainee Position Radar Component */}
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
              <Compass size={16} /> TRAINEE POSITION RADAR
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              X: {currentPos.x}m | Z: {currentPos.z}m
            </div>
          </div>

          {/* SVG Radar Map Viewport */}
          <div style={{ position: 'relative', width: '100%', height: '170px', background: '#070c16', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 260">
              <defs>
                <pattern id="radarGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#radarGrid)" />

              {/* Zone Perimeters */}
              <circle cx="250" cy="130" r="100" fill="rgba(16, 185, 129, 0.04)" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5" />
              <circle cx="250" cy="130" r="65" fill="rgba(234, 179, 8, 0.06)" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="1.5" />
              <circle cx="250" cy="130" r="30" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1.5" />
              <circle cx="250" cy="130" r="5" fill="#ef4444" />
              <text x="255" y="134" fill="#ef4444" fontSize="8" fontWeight="800">EPICENTER</text>

              {/* Trainee Spatial Blip Pin */}
              <circle cx={radarX} cy={radarY} r="10" fill="rgba(6, 182, 212, 0.25)" stroke="#06b6d4" strokeWidth="2">
                <animate attributeName="r" values="8;14;8" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={radarX} cy={radarY} r="4" fill="#06b6d4" />
              <text x={radarX + 10} y={radarY - 6} fill="#38bdf8" fontSize="9" fontWeight="800">TRAINEE #1</text>
            </svg>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            Spatial coordinates updating live at {formatTime(currentTime)}
          </div>
        </div>

      </div>

      {/* Telemetry Snapshot Stats Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '16px' }}>
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} color="#06b6d4" /> SPATIAL POSITION
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '2px' }}>
            X: {currentPos.x} | Z: {currentPos.z}
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Gauge size={12} color={scbaPressure < 800 ? '#ef4444' : '#10b981'} /> SCBA AIR TANK
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: scbaPressure < 800 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
            {scbaPressure} PSI
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} color="#f59e0b" /> GAS TOXICITY (PID)
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: parseFloat(currentPpm) > 2.0 ? '#ef4444' : '#f59e0b', marginTop: '2px' }}>
            {currentPpm} ppm
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HeartIcon size={12} color="#ec4899" /> HEART RATE
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ec4899', marginTop: '2px' }}>
            {heartRate} BPM
          </div>
        </div>
      </div>
    </div>
  );
}

function HeartIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
