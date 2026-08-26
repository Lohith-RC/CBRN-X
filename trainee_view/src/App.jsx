import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Shield, CheckCircle, Crosshair, Radio, Play, Compass, Flame, Video, Zap, Eye, Clock, Target } from 'lucide-react';
import PostProcessing from './PostProcessing';
import Hotspots from './Hotspots';
import { useCursorParallax, CursorParallaxLayer } from './CursorParallax';

// ══════════════════════════════════════════════════════════════════
// PHASE 1 — 9-BEAT GAME STAGE DEFINITIONS
// Precisely mapped from the Phase 1 Script (0:00 — 1:03, 63 seconds)
// Each beat: video, hotspot set, objective, color grade, camera motion
// Videos start PAUSED — play only on click/keyboard interaction
// ══════════════════════════════════════════════════════════════════
const BEATS = [
  {
    id: 'BEAT_1', video: '/videos/1.mp4',
    hotspots: 'BEAT_1_BRIEFING',
    objective: 'ALERT: Gas leak reported at Storage Bay 3. Click BEGIN SCENARIO to authorize entry.',
    colorGrade: 'grade-cctv', cameraMotion: 'camera-cctv',
    visorActive: false, beatLabel: 'Beat 1: CCTV Surveillance & Catastrophic Breach (0:00–0:07)',
    timer: '00:00', hudBoot: false,
  },
  {
    id: 'BEAT_2', video: '/videos/2.mp4',
    hotspots: 'BEAT_2_FPS_INIT',
    objective: 'Assess the situation before proceeding. Do not enter the hazard zone without PPE.',
    colorGrade: 'grade-fps-init', cameraMotion: 'camera-idle',
    visorActive: false, beatLabel: 'Beat 2: First-Person Init & Safety Orientation (0:07–0:14)',
    timer: '00:07', hudBoot: true,
  },
  {
    id: 'BEAT_3', video: '/videos/3.mp4',
    hotspots: 'BEAT_3_CONSOLE',
    objective: 'Environmental telemetry shows TOXIC CONCENTRATION EXCEEDS IDLH THRESHOLD.',
    colorGrade: 'grade-console', cameraMotion: 'camera-walk',
    visorActive: false, beatLabel: 'Beat 3: Environmental Hazard Scan & Terminal Blowout (0:14–0:21)',
    timer: '00:14', hudBoot: false,
  },
  {
    id: 'BEAT_4', video: '/videos/2.mp4',
    hotspots: 'BEAT_4_APPROACH',
    objective: 'Equip your PPE: Hazmat Suit, Gas Mask, and Gloves. Click each item on the table.',
    colorGrade: 'grade-ppe', cameraMotion: 'camera-idle',
    visorActive: false, beatLabel: 'Beat 4: Protocol Navigation & Interaction Lock-On (0:21–0:28)',
    timer: '00:21', hudBoot: false,
  },
  {
    id: 'BEAT_5', video: '/videos/6.mp4',
    hotspots: 'BEAT_5_SUIT',
    objective: 'Click to zip the central torso seal of the Level B Hazmat Suit.',
    colorGrade: 'grade-ppe', cameraMotion: 'camera-idle',
    visorActive: false, beatLabel: 'Beat 5: PPE Donning — Chemical Hazmat Suit (0:28–0:35)',
    timer: '00:28', hudBoot: false,
  },
  {
    id: 'BEAT_6', video: '/videos/5.mp4',
    hotspots: 'BEAT_6_MASK',
    objective: 'Click to seal the CBRN Full-Face Respirator visor.',
    colorGrade: 'grade-ppe-visor', cameraMotion: 'camera-idle',
    visorActive: true, beatLabel: 'Beat 6: PPE Donning — CBRN Gas Mask (0:35–0:42)',
    timer: '00:35', hudBoot: false,
  },
  {
    id: 'BEAT_7', video: '/videos/7.mp4',
    hotspots: 'BEAT_7_GLOVES',
    objective: 'Click to snap the chemical-resistant glove seals. PPE DONNING COMPLETE.',
    colorGrade: 'grade-ppe-visor', cameraMotion: 'camera-idle',
    visorActive: true, beatLabel: 'Beat 7: PPE Donning — Protective Gloves & Full Clearance (0:42–0:49)',
    timer: '00:42', hudBoot: false,
  },
  {
    id: 'BEAT_8', video: '/videos/8.mp4',
    hotspots: 'BEAT_8_SPRINT',
    objective: 'PPE equipped. Sprint through the gate and enter Storage Bay 03.',
    colorGrade: 'grade-sprint', cameraMotion: 'camera-sprint',
    visorActive: true, beatLabel: 'Beat 8: Advance to Hazard Zone Perimeter (0:49–0:56)',
    timer: '00:49', hudBoot: false,
  },
  {
    id: 'BEAT_9', video: '/videos/9.mp4',
    hotspots: 'BEAT_9_DETECTOR',
    objective: 'Equip the handheld multi-gas detector. Use it to scan the drum cluster and locate the leak.',
    colorGrade: 'grade-detector', cameraMotion: 'camera-walk',
    visorActive: true, beatLabel: 'Beat 9: Entry & Handheld Gas Detector Acquisition (0:56–1:03)',
    timer: '00:55', hudBoot: false,
  },
];

const SCENARIO_OPTIONS = [
  { code: 'CBRN-CHEM-01', title: 'Chemical Spill Emergency (Bay 03)', sensor: 'PID Photoionization', unit: 'PPM', icon: '☣️' },
  { code: 'CBRN-RAD-02', title: 'Radiological Dirty Bomb & Isotope Vault', sensor: 'Geiger Radiation Dosimeter', unit: 'μSv/h', icon: '☢️' },
  { code: 'CBRN-BIO-03', title: 'Biological Pathogen Laboratory Breach', sensor: 'Bio-Aerosol Sampler', unit: 'Index', icon: '🧬' },
];

export default function App() {
  // ── Core Game State ──
  const [selectedScenario, setSelectedScenario] = useState('CBRN-CHEM-01');
  const [beatIndex, setBeatIndex] = useState(-1); // -1 = pre-game lobby
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  // ── Scoring & Protocol State ──
  const [ppeState, setPpeState] = useState({ suit: false, mask: false, gloves: false });
  const [ppmReading, setPpmReading] = useState(12.4);
  const [detectorEquipped, setDetectorEquipped] = useState(false);
  const [compassHeading, setCompassHeading] = useState(150);

  // ── Post-Processing State ──
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [screenShake, setScreenShake] = useState(false);
  const [showHudBoot, setShowHudBoot] = useState(false);
  const [showAchievement, setShowAchievement] = useState(null);

  // ── Dual-Video Crossfade Refs ──
  const videoARef = useRef(null);
  const videoBRef = useRef(null);
  const activeVideoRef = useRef('A'); // Which video element is currently visible

  const stateRef = useRef({ sessionId: null });
  const parallax = useCursorParallax(isActive, 12);

  const handleMouseMove = useCallback((e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    const normalizedX = e.clientX / window.innerWidth;
    setCompassHeading(Math.round(normalizedX * 360));
  }, []);

  // ══════════════════════════════════════════════════════════════
  // DUAL-VIDEO CROSSFADE ENGINE
  // Load next video into the hidden element, then swap opacity
  // ══════════════════════════════════════════════════════════════
  const crossfadeTo = useCallback((videoSrc) => {
    const currentActive = activeVideoRef.current;
    const incomingRef = currentActive === 'A' ? videoBRef : videoARef;
    const outgoingRef = currentActive === 'A' ? videoARef : videoBRef;

    if (!incomingRef.current || !outgoingRef.current) return;

    // Load new video into the hidden (standby) element
    incomingRef.current.src = videoSrc;
    incomingRef.current.load();

    incomingRef.current.oncanplay = () => {
      if (!incomingRef.current || !outgoingRef.current) return;

      // Play the incoming video
      incomingRef.current.play().catch(() => {});

      // Swap CSS classes (opacity transition handled by CSS)
      incomingRef.current.className = 'video-layer video-active';
      outgoingRef.current.className = 'video-layer video-standby';

      // Freeze incoming on last frame (no loop)
      incomingRef.current.onended = () => {
        if (incomingRef.current) incomingRef.current.pause();
      };

      // Pause the outgoing video after crossfade completes
      setTimeout(() => {
        if (outgoingRef.current) outgoingRef.current.pause();
      }, 700);

      activeVideoRef.current = currentActive === 'A' ? 'B' : 'A';
    };
  }, []);

  // ══════════════════════════════════════════════════════════════
  // TRANSITION TO A NEW BEAT
  // ══════════════════════════════════════════════════════════════
  const transitionToBeat = useCallback((idx) => {
    if (idx < 0 || idx >= BEATS.length) return;
    const beat = BEATS[idx];

    setBeatIndex(idx);
    crossfadeTo(beat.video);

    // Screen shake on explosive beats
    if ([0, 2, 7].includes(idx)) {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
    }

    // HUD boot sweep on Beat 2
    if (beat.hudBoot) {
      setShowHudBoot(true);
      setTimeout(() => setShowHudBoot(false), 1300);
    }
  }, [crossfadeTo]);

  // ══════════════════════════════════════════════════════════════
  // BACKEND TELEMETRY
  // ══════════════════════════════════════════════════════════════
  const logEvent = useCallback(async (eventType, eventData = '{}') => {
    const sid = stateRef.current.sessionId || sessionId;
    setTelemetryLogs(prev => [`[${new Date().toLocaleTimeString()}] ${eventType}`, ...prev.slice(0, 4)]);
    if (!sid) return;
    try {
      await fetch('/api/events/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, eventType, eventData })
      });
    } catch (err) {
      console.warn('[CBRS-X] Event log failed:', err?.message || err);
    }
  }, [sessionId]);

  // ══════════════════════════════════════════════════════════════
  // START SESSION
  // ══════════════════════════════════════════════════════════════
  const startSession = async () => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: 'NDRF Inspector',
          batchUnit: 'NDRF Battalion',
          scenarioCode: selectedScenario,
        })
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setSessionId(data.sessionId);
      stateRef.current.sessionId = data.sessionId;
    } catch (err) {
      console.error('[CBRS-X] Session start failed:', err?.message || err);
      setSessionId(null);
      stateRef.current.sessionId = null;
    }
    setIsActive(true);
    transitionToBeat(0);
        logEvent('scenario_started', JSON.stringify({ trainee_id: 'TRN-0001', scenario_id: selectedScenario }));
  };

  // ══════════════════════════════════════════════════════════════
  // HOTSPOT ACTION DISPATCHER (click-driven progression)
  // ══════════════════════════════════════════════════════════════
  const handleAction = useCallback((action) => {
    switch (action) {
      // ── Beat 1 ──
      case 'VALIDATE_ID':
        logEvent('trainee_validated', '{"trainee_id":"TRN-0001"}');
        break;
      case 'BEGIN_SCENARIO':
        logEvent('scenario_started', '{}');
        transitionToBeat(1); // → Beat 2
        break;

      // ── Beat 2 ──
      case 'READ_SIGN':
        logEvent('warning_sign_read', '{}');
        break;
      case 'APPROACH_PPE':
        transitionToBeat(3); // → Beat 4 (PPE approach)
        logEvent('approach_ppe_station', '{}');
        break;

      // ── Beat 3 ──
      case 'INSPECT_CONSOLE':
        logEvent('console_inspected', '{}');
        break;
      case 'READ_PPM':
        setPpmReading(412.5);
        logEvent('ppm_reading_taken', '{"value":412.5}');
        transitionToBeat(3); // → Beat 4 (PPE approach after console)
        break;

      // ── Beat 4: PPE Approach ──
      case 'EQUIP_SUIT':
        setPpeState(prev => ({ ...prev, suit: true }));
        logEvent('ppe_item_equipped', '{"item":"suit","order_index":1}');
        transitionToBeat(4); // → Beat 5 (suit donning)
        break;
      case 'EQUIP_MASK':
        if (!ppeState.suit) {
          logEvent('ppe_wrong_order', '{"attempted":"mask","needed":"suit"}');
          return;
        }
        setPpeState(prev => ({ ...prev, mask: true }));
        logEvent('ppe_item_equipped', '{"item":"mask","order_index":2}');
        transitionToBeat(5); // → Beat 6 (mask donning)
        break;
      case 'EQUIP_GLOVES':
        if (!ppeState.suit || !ppeState.mask) {
          logEvent('ppe_wrong_order', '{"attempted":"gloves"}');
          return;
        }
        setPpeState(prev => ({ ...prev, gloves: true }));
        logEvent('ppe_item_equipped', '{"item":"gloves","order_index":3}');
        logEvent('ppe_donning_completed', '{"total_time_seconds":21.4}');
        transitionToBeat(6); // → Beat 7 (gloves + clearance)
        setShowAchievement('PPE DONNING COMPLETE // PROTOCOL LEVEL 2 AUTHORIZED');
        setTimeout(() => setShowAchievement(null), 4000);
        break;

      // ── Beat 5: Suit ──
      case 'ZIP_SUIT':
        logEvent('suit_zipped', '{}');
        transitionToBeat(3); // → Back to Beat 4 (equip next)
        break;

      // ── Beat 6: Mask ──
      case 'SEAL_VISOR':
        logEvent('mask_sealed', '{}');
        transitionToBeat(3); // → Back to Beat 4 (equip next)
        break;

      // ── Beat 7: Gloves ──
      case 'SNAP_GLOVES':
        logEvent('gloves_snapped', '{}');
        transitionToBeat(7); // → Beat 8 (sprint to bay)
        break;

      // ── Beat 8: Sprint ──
      case 'ENTER_BAY':
        logEvent('entered_bay_03', '{}');
        transitionToBeat(8); // → Beat 9 (detector)
        break;
      case 'CROSS_BOUNDARY':
        logEvent('hazard_boundary_crossed', '{"ppe_active":true}');
        break;

      // ── Beat 9: Detector ──
      case 'EQUIP_DETECTOR':
        setDetectorEquipped(true);
        logEvent('detector_equipped', '{}');
        setShowAchievement('MULTI-GAS DETECTOR ACQUIRED // PHASE 1 COMPLETE');
        setTimeout(() => setShowAchievement(null), 4000);
        break;
      case 'APPROACH_DRUMS':
        logEvent('approaching_drums', '{}');
        break;

      default: break;
    }
  }, [logEvent, transitionToBeat, ppeState]);

  // ══════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive || beatIndex < 0) return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
      }
      switch (key) {
        case 'e':
          if (beatIndex === 3) {
            if (!ppeState.suit) handleAction('EQUIP_SUIT');
            else if (!ppeState.mask) handleAction('EQUIP_MASK');
            else if (!ppeState.gloves) handleAction('EQUIP_GLOVES');
          } else if (beatIndex === 4) handleAction('ZIP_SUIT');
          else if (beatIndex === 5) handleAction('SEAL_VISOR');
          else if (beatIndex === 6) handleAction('SNAP_GLOVES');
          else if (beatIndex === 8) handleAction('EQUIP_DETECTOR');
          break;
        case 'w': case 'arrowup':
          if (beatIndex === 0) handleAction('BEGIN_SCENARIO');
          else if (beatIndex === 1) handleAction('APPROACH_PPE');
          else if (beatIndex === 7) handleAction('ENTER_BAY');
          break;
        case ' ':
          e.preventDefault();
          if (beatIndex === 0) handleAction('BEGIN_SCENARIO');
          break;
        case 'a': case 'arrowleft':
          setCompassHeading(h => (h - 8 + 360) % 360);
          break;
        case 'd': case 'arrowright':
          setCompassHeading(h => (h + 8) % 360);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, beatIndex, ppeState, handleAction]);

  // ══════════════════════════════════════════════════════════════
  // FINISH MISSION
  // ══════════════════════════════════════════════════════════════
  const finishMission = async () => {
    const sid = stateRef.current.sessionId || sessionId;
    if (sid) {
      try {
        await fetch(`/api/sessions/${sid}/complete`, { method: 'POST' });
      } catch (err) {
        console.warn('[CBRS-X] Session complete failed:', err?.message || err);
      }
    }
    setIsActive(false);
    setBeatIndex(-1);
  };

  // ══════════════════════════════════════════════════════════════
  // DERIVED STATE
  // ══════════════════════════════════════════════════════════════
  const currentBeat = beatIndex >= 0 ? BEATS[beatIndex] : null;
  const allPpeDone = ppeState.suit && ppeState.mask && ppeState.gloves;
  const currentScenario = SCENARIO_OPTIONS.find((s) => s.code === selectedScenario) || SCENARIO_OPTIONS[0];

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#05080c', position: 'relative', cursor: isActive ? 'crosshair' : 'default' }}
      onMouseMove={handleMouseMove}
    >
      {/* Post-Processing Canvas */}
      <PostProcessing cursorPos={cursorPos} isActive={isActive} screenShake={screenShake} visorActive={currentBeat?.visorActive} beatIndex={beatIndex} />

      {/* HUD Boot Sweep Line (Beat 2) */}
      {showHudBoot && <div className="hud-boot-sweep" />}

      {/* ═══ HEADER BAR ═══ */}
      <header style={{
        padding: '8px 24px', background: 'rgba(7, 10, 15, 0.96)',
        borderBottom: '1px solid rgba(245, 130, 32, 0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 25
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={20} color="var(--accent-ndrf-orange)" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                CAM_BAY03_EXT // 21-AUG-2026 // 10:03:13 UTC
              </span>
              <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Radio size={10} className="warning-led" /> {isActive ? 'REC ●' : 'STANDBY'}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              {currentScenario.icon} {currentScenario.title} // SIH260088 // PORT 5000
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentBeat && (
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.2)', padding: '3px 10px', borderRadius: '4px' }}>
              {currentBeat.timer}
            </div>
          )}
          {!isActive ? (
            <button className="btn-tactical" onClick={startSession}><Play size={13} /> INITIATE DEPLOYMENT</button>
          ) : (
            <button className="btn-tactical" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }} onClick={finishMission}><CheckCircle size={13} /> END MISSION</button>
          )}
        </div>
      </header>

      {/* ═══ MAIN VIEWPORT ═══ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!isActive ? (
          /* ═══ PRE-GAME LOBBY ═══ */
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 20, position: 'relative', padding: '20px' }}>
            <Flame size={48} color="var(--accent-ndrf-orange)" className="handheld-motion" />
            <h2 style={{ color: '#fff', fontSize: '1.35rem', fontWeight: '800', letterSpacing: '0.5px', margin: 0 }}>
              CBRN TACTICAL SIMULATION STATION
            </h2>
            <p style={{ maxWidth: '600px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Select your disaster incident scenario. Real-time telemetry, procedural safety checks, and detection sensor raycasting are synchronized with the Spring Boot telemetry server.
            </p>

            {/* Scenario Selection Cards */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '720px' }}>
              {SCENARIO_OPTIONS.map((scen) => (
                <div
                  key={scen.code}
                  onClick={() => setSelectedScenario(scen.code)}
                  style={{
                    background: selectedScenario === scen.code ? 'rgba(245, 130, 32, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedScenario === scen.code ? 'var(--accent-ndrf-orange)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '10px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    width: '210px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.1rem' }}>{scen.icon}</span>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: selectedScenario === scen.code ? 'var(--accent-ndrf-orange)' : 'var(--text-secondary)' }}>
                      {scen.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fff' }}>
                    {scen.title}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    Sensor: {scen.sensor}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-tactical" style={{ padding: '12px 28px', fontSize: '0.88rem', marginTop: '6px' }} onClick={startSession}>
              <Zap size={15} /> INITIATE DEPLOYMENT ({selectedScenario})
            </button>
            <div style={{ marginTop: '6px', display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <span>🖱️ CLICK hotspots</span>
              <span>⌨️ E = equip</span>
              <span>W = advance</span>
              <span>🎯 Cursor = parallax</span>
            </div>
          </div>
        ) : (
          /* ═══ ACTIVE GAME VIEWPORT ═══ */
          <div style={{ width: '100%', height: '100%', position: 'relative' }}
               className={currentBeat?.cameraMotion || ''}>

            {/* Dual-Video Crossfade Layers */}
            <video ref={videoARef} preload="auto" playsInline muted
              className={`video-layer video-active ${currentBeat?.colorGrade || ''}`} />
            <video ref={videoBRef} preload="auto" playsInline muted
              className={`video-layer video-standby ${currentBeat?.colorGrade || ''}`} />

            {/* Screen Shake Flash */}
            {screenShake && <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'rgba(245, 130, 32, 0.1)', animation: 'fadeOut 0.5s ease forwards' }} />}

            {/* Gas Mask Visor Frame (post-mask equip) */}
            {currentBeat?.visorActive && (
              <div className="visor-frame" style={{ position: 'absolute', inset: 0, zIndex: 14, pointerEvents: 'none' }}>
                <div className="visor-glass" />
              </div>
            )}

            {/* Interactive Hotspot Layer */}
            {currentBeat && <Hotspots stage={currentBeat.hotspots} onAction={handleAction} />}

            {/* Achievement Banner */}
            {showAchievement && (
              <div className="achievement-banner" style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 22, pointerEvents: 'none',
                background: 'rgba(16, 185, 129, 0.15)', border: '2px solid rgba(16, 185, 129, 0.6)',
                borderRadius: '10px', padding: '16px 32px',
                color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontWeight: '800',
                fontSize: '1rem', letterSpacing: '1px', textAlign: 'center',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)',
              }}>
                ✅ {showAchievement}
              </div>
            )}

            {/* HUD Overlay (parallax-shifted) */}
            <CursorParallaxLayer subscribe={parallax.subscribe} depth={0.4} style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              padding: '16px', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', zIndex: 20
            }}>
              {/* ── Top HUD Row ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                {/* Objective */}
                <div className="stage-prompt-animate" key={beatIndex} style={{
                  background: 'rgba(7, 10, 15, 0.92)', border: '1px solid rgba(245, 130, 32, 0.45)',
                  padding: '9px 16px', borderRadius: '7px',
                  color: 'var(--accent-ndrf-orange)', fontWeight: '700', fontSize: '0.8rem',
                  maxWidth: '440px', lineHeight: '1.35'
                }}>
                  🎯 {currentBeat?.objective}
                </div>

                {/* Right cluster */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                  {/* Beat label */}
                  <div style={{
                    background: 'rgba(7, 10, 15, 0.9)', border: '1px solid rgba(0, 242, 254, 0.25)',
                    padding: '4px 12px', borderRadius: '5px',
                    color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <Video size={12} /> {currentBeat?.beatLabel}
                  </div>

                  {/* Compass */}
                  <div style={{
                    background: 'rgba(7, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.08)',
                    padding: '3px 10px', borderRadius: '5px',
                    color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}>
                    <Compass size={12} color="var(--accent-cyan)" /> N {compassHeading}°
                  </div>

                  {/* Dynamic Hazard Sensor Readout (visible from Beat 3+) */}
                  {beatIndex >= 2 && (
                    <div style={{
                      background: 'rgba(7, 10, 15, 0.9)',
                      border: `1px solid ${ppmReading > 200 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 242, 254, 0.35)'}`,
                      padding: '5px 12px', borderRadius: '5px',
                      color: ppmReading > 200 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                      fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.8rem'
                    }}>
                      {currentScenario.icon} {
                        selectedScenario === 'CBRN-RAD-02'
                          ? `${(ppmReading * 1.8).toFixed(1)} μSv/h`
                          : selectedScenario === 'CBRN-BIO-03'
                          ? `${(ppmReading * 0.25).toFixed(1)} Index`
                          : `${ppmReading} PPM`
                      } {ppmReading > 200 && <span className="warning-led">⚠️</span>}
                    </div>
                  )}

                  {/* PPE Checklist */}
                  <div style={{
                    background: 'rgba(7, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.08)',
                    padding: '4px 10px', borderRadius: '5px',
                    fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#fff', display: 'flex', gap: '8px'
                  }}>
                    <span style={{ color: ppeState.suit ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {ppeState.suit ? '✅' : '⬜'} Suit
                    </span>
                    <span style={{ color: ppeState.mask ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {ppeState.mask ? '✅' : '⬜'} Mask
                    </span>
                    <span style={{ color: ppeState.gloves ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {ppeState.gloves ? '✅' : '⬜'} Gloves
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Center Reticle ── */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <Crosshair size={34} color="rgba(0, 242, 254, 0.65)" strokeWidth={1.5} />
                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'rgba(0, 242, 254, 0.4)', letterSpacing: '1px' }}>
                  CLICK TO INTERACT
                </span>
              </div>

              {/* ── Bottom HUD Row ── */}
              <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px' }}>
                <div className="glass-hud" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {currentBeat?.timer}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    BEAT {beatIndex + 1}/9
                  </span>
                </div>

                <div className="glass-hud" style={{ padding: '5px 12px', fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  <strong style={{ color: '#fff' }}>E</strong>=Equip &nbsp;
                  <strong style={{ color: '#fff' }}>W</strong>=Advance &nbsp;
                  <strong style={{ color: '#fff' }}>🖱️</strong>=Click Hotspots
                </div>

                <div className="glass-hud" style={{ padding: '6px 12px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', display: 'flex', gap: '10px' }}>
                  <span style={{ color: allPpeDone ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    PPE: {allPpeDone ? '✅ COMPLETE' : `${[ppeState.suit, ppeState.mask, ppeState.gloves].filter(Boolean).length}/3`}
                  </span>
                  <span style={{ color: detectorEquipped ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    DET: {detectorEquipped ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            </CursorParallaxLayer>
          </div>
        )}
      </div>

      {/* ═══ TELEMETRY FOOTER ═══ */}
      <footer style={{
        padding: '6px 24px', background: '#05080c',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: '0.68rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 25
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={11} />
          <span>TELEMETRY (5000→8080): {telemetryLogs[0] || 'Awaiting interaction...'}</span>
        </div>
        <div style={{ display: 'flex', gap: '14px', color: 'var(--text-secondary)' }}>
          <span>SIH260088 TASK FORCE</span>
          <span>CURSOR: {cursorPos.x},{cursorPos.y}</span>
          <span>ADMIN: PORT 3000</span>
        </div>
      </footer>
    </div>
  );
}
