import React from 'react';
import { ShieldCheck, Radio } from 'lucide-react';

/**
 * Compact static mission strip replacing the full 3D hero scene.
 * Zero GPU/WebGL cost, prints cleanly, respects reduced-motion preferences.
 * Reuses the telemetry state already owned by the app shell.
 */
export default function MissionStrip({ liveConnected = false }) {
  return (
    <section className="mission-strip" aria-label="Platform status">
      <div className="mission-strip-left">
        <span className="mission-strip-shield" aria-hidden="true">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h2 className="mission-strip-title">NDRF CBRN Simulation Command</h2>
          <p className="mission-strip-sub">Virtual reality disaster response training · SIH260088</p>
        </div>
      </div>

      <div className="mission-strip-right">
        <span className={`badge ${liveConnected ? 'badge-passed' : 'badge-failed'}`}>
          <Radio size={12} />
          {liveConnected ? 'TELEMETRY LIVE' : 'TELEMETRY OFFLINE'}
        </span>
        <span className="mission-strip-chip">PASS THRESHOLD 70%</span>
        <span className="mission-strip-chip">SCORING SCALE 0–100</span>
      </div>
    </section>
  );
}
