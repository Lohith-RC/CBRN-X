import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Shield, CheckCircle, Crosshair, Radio, Play, Compass, Flame, Video, Zap, Eye } from 'lucide-react';
import PostProcessing from './PostProcessing';
import Hotspots from './Hotspots';
import { useCursorParallax, CursorParallaxLayer } from './CursorParallax';

// ──────────────────────────────────────────────────────────────────
// GAME STAGE DEFINITIONS — Video assets mapped to interactive states
// Each stage: video src, hotspot set key, HUD objective text
// Videos start PAUSED. They only play on user interaction.
// ──────────────────────────────────────────────────────────────────
const GAME_STAGES = {
  BRIEFING:       { video: '/videos/1.mp4', hotspots: 'BRIEFING',       objective: 'ASSESS THE SITUATION. CLICK ON THE PPE TABLE OR SURVEY THE BAY.' },
  PPE_STATION:    { video: '/videos/2.mp4', hotspots: 'PPE_STATION',    objective: 'CLICK ON EACH PPE ITEM TO EQUIP: MASK → SUIT → GLOVES' },
  DONNING_MASK:   { video: '/videos/5.mp4', hotspots: 'DONNING_MASK',   objective: 'CLICK TO SECURE THE RESPIRATOR VISOR SEAL' },
  DONNING_SUIT:   { video: '/videos/6.mp4', hotspots: 'DONNING_SUIT',   objective: 'CLICK TO ZIP THE HAZMAT SUIT' },
  DONNING_GLOVES: { video: '/videos/7.mp4', hotspots: 'DONNING_GLOVES', objective: 'CLICK TO SNAP THE GLOVE SEALS' },
  PPE_COMPLETE:   { video: '/videos/4.mp4', hotspots: 'PPE_COMPLETE',   objective: 'PPE DONNING COMPLETE. CLICK THE DOOR TO ENTER BAY 03.' },
  BAY_ENTRY:      { video: '/videos/8.mp4', hotspots: 'BAY_ENTRY',      objective: 'INSIDE BAY 03. CLICK DRUMS TO SCAN OR CHECK THE CONSOLE.' },
  DRUM_SCAN:      { video: '/videos/9.mp4', hotspots: 'DRUM_SCAN',      objective: 'LEAK CONFIRMED: DRUM #3 (CHLORINE). CLICK TO SEAL OR EVACUATE.' },
  CONSOLE_CHECK:  { video: '/videos/3.mp4', hotspots: 'CONSOLE_CHECK',  objective: 'CONTROL TERMINAL: GAS CONCENTRATION 412.5 PPM. CLICK TO READ.' },
  CONTAINMENT:    { video: '/videos/8.mp4', hotspots: 'CONTAINMENT',    objective: 'HAZARD SEALED. CLICK CIVILIANS TO EVACUATE OR PROCEED TO DECON.' },
  DECON:          { video: '/videos/4.mp4', hotspots: 'DECON',          objective: 'CLICK TO COMPLETE DECONTAMINATION SHOWER SEQUENCE.' },
  MISSION_END:    { video: '/videos/1.mp4', hotspots: 'BRIEFING',       objective: '✅ MISSION ACCOMPLISHED — ALL PROTOCOLS EXECUTED SUCCESSFULLY.' },
};

export default function App() {
  // ── Core Game State ──
  const [gameStage, setGameStage] = useState(null); // null = pre-game lobby
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  // ── Scoring & Protocol State ──
  const [ppeState, setPpeState] = useState({ mask: false, suit: false, gloves: false });
  const [ppmReading, setPpmReading] = useState(12.4);
  const [leakFound, setLeakFound] = useState(false);
  const [civiliansEvacuated, setCiviliansEvacuated] = useState(0);
  const [contained, setContained] = useState(false);
  const [compassHeading, setCompassHeading] = useState(150);

  // ── Post-Processing State ──
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [screenShake, setScreenShake] = useState(false);

  // ── Video Ref (paused by default, plays on interaction) ──
  const videoRef = useRef(null);
  const stateRef = useRef({ sessionId: null, hasPpe: false });

  // ── Cursor Parallax Engine ──
  const parallax = useCursorParallax(isActive, 12);

  // ── Track cursor position for post-processing ──
  const handleMouseMove = useCallback((e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    // Update compass heading based on horizontal cursor position
    const normalizedX = e.clientX / window.innerWidth;
    setCompassHeading(Math.round(normalizedX * 360));
  }, []);

  // ──────────────────────────────────────────────────────────────
  // VIDEO CONTROL: Play-on-interaction, freeze-on-end
  // ──────────────────────────────────────────────────────────────
  const playVideoForStage = useCallback((stageName) => {
    const stage = GAME_STAGES[stageName];
    if (!stage || !videoRef.current) return;

    const video = videoRef.current;
    video.src = stage.video;
    video.load();

    // Play the video segment, then FREEZE on last frame
    video.oncanplay = () => {
      video.play().catch(() => {});
    };
    video.onended = () => {
      video.pause(); // Freeze on last frame — no loop
    };
  }, []);

  // ──────────────────────────────────────────────────────────────
  // TRANSITION TO A NEW STAGE (video + hotspots + HUD update)
  // ──────────────────────────────────────────────────────────────
  const transitionTo = useCallback((stageName) => {
    setGameStage(stageName);
    playVideoForStage(stageName);

    // Trigger screen shake on explosive/impactful transitions
    if (['BRIEFING', 'BAY_ENTRY', 'DRUM_SCAN'].includes(stageName)) {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 400);
    }
  }, [playVideoForStage]);

  // ──────────────────────────────────────────────────────────────
  // BACKEND TELEMETRY (REST streaming to Port 8080)
  // ──────────────────────────────────────────────────────────────
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
    } catch (_) {}
  }, [sessionId]);

  // ──────────────────────────────────────────────────────────────
  // START SESSION (click INITIATE DEPLOYMENT)
  // ──────────────────────────────────────────────────────────────
  const startSession = async () => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: 'NDRF Inspector Lohith R C',
          batchUnit: '10th NDRF Battalion',
          scenarioCode: 'CBRN-CHEM-01'
        })
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      stateRef.current.sessionId = data.sessionId;
    } catch (_) {
      const demoId = 'sess-game-5000';
      setSessionId(demoId);
      stateRef.current.sessionId = demoId;
    }
    setIsActive(true);
    transitionTo('BRIEFING');
  };

  // ──────────────────────────────────────────────────────────────
  // HOTSPOT ACTION DISPATCHER (all visual progression is click-driven)
  // ──────────────────────────────────────────────────────────────
  const handleHotspotAction = useCallback((action) => {
    switch (action) {
      case 'SURVEY_BAY':
        logEvent('survey_bay_exterior', '{"area":"BAY_03_EXT"}');
        // Re-play briefing video from start
        if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play().catch(() => {}); }
        break;

      case 'GO_PPE_STATION':
        logEvent('approach_ppe_station', '{}');
        transitionTo('PPE_STATION');
        break;

      case 'DON_MASK':
        setPpeState(prev => ({ ...prev, mask: true }));
        logEvent('ppe_item_equipped', '{"item":"mask"}');
        transitionTo('DONNING_MASK');
        break;

      case 'SEAL_MASK':
        logEvent('mask_sealed', '{"status":"sealed"}');
        transitionTo('PPE_STATION');
        break;

      case 'DON_SUIT':
        setPpeState(prev => ({ ...prev, suit: true }));
        logEvent('ppe_item_equipped', '{"item":"suit"}');
        transitionTo('DONNING_SUIT');
        break;

      case 'ZIP_SUIT':
        logEvent('suit_zipped', '{"status":"sealed"}');
        transitionTo('PPE_STATION');
        break;

      case 'DON_GLOVES':
        setPpeState(prev => ({ ...prev, gloves: true }));
        logEvent('ppe_item_equipped', '{"item":"gloves"}');
        stateRef.current.hasPpe = true;
        logEvent('ppe_donning_completed', '{"status":"complete"}');
        transitionTo('DONNING_GLOVES');
        break;

      case 'SNAP_GLOVES':
        transitionTo('PPE_COMPLETE');
        break;

      case 'ENTER_BAY':
        logEvent('entered_bay_03', '{}');
        transitionTo('BAY_ENTRY');
        break;

      case 'SCAN_DRUM_3':
        setLeakFound(true);
        setPpmReading(412.5);
        logEvent('leak_source_identified', '{"correct":true,"drumId":"DRUM-03"}');
        transitionTo('DRUM_SCAN');
        break;

      case 'SCAN_DRUM_1':
        logEvent('leak_source_identified', '{"correct":false,"drumId":"DRUM-01"}');
        // Stay on same stage, just log the penalty
        if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play().catch(() => {}); }
        break;

      case 'CHECK_CONSOLE':
        logEvent('console_checked', '{"ppm":"412.5"}');
        transitionTo('CONSOLE_CHECK');
        break;

      case 'READ_PPM':
        setPpmReading(412.5);
        logEvent('ppm_reading_taken', '{"value":412.5}');
        transitionTo('BAY_ENTRY');
        break;

      case 'APPLY_SEALANT':
        setContained(true);
        logEvent('containment_completed', '{"drumId":"DRUM-03"}');
        transitionTo('CONTAINMENT');
        break;

      case 'EVACUATE_CIV':
        setCiviliansEvacuated(prev => {
          const next = prev + 1;
          logEvent('civilian_evacuated', `{"civilianId":"CIV-0${next}"}`);
          return next;
        });
        // Re-play current stage video to show the evacuation action
        if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play().catch(() => {}); }
        break;

      case 'DECON_SHOWER':
        logEvent('decon_entered', '{}');
        transitionTo('DECON');
        break;

      case 'COMPLETE_DECON':
        logEvent('decontamination_completed', '{"archway":true}');
        transitionTo('MISSION_END');
        break;

      default:
        break;
    }
  }, [logEvent, transitionTo]);

  // ──────────────────────────────────────────────────────────────
  // KEYBOARD SHORTCUTS (E, F, R, Space, WASD) — all trigger
  // the same hotspot actions, not passive video switches
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive || !gameStage) return;
      switch (e.key.toLowerCase()) {
        case 'e':
          // Equip next PPE item or interact with nearest hotspot
          if (!ppeState.mask) handleHotspotAction('DON_MASK');
          else if (!ppeState.suit) handleHotspotAction('DON_SUIT');
          else if (!ppeState.gloves) handleHotspotAction('DON_GLOVES');
          else if (gameStage === 'PPE_COMPLETE') handleHotspotAction('ENTER_BAY');
          break;
        case 'f':
          if (leakFound) handleHotspotAction('APPLY_SEALANT');
          break;
        case 'r':
          handleHotspotAction('EVACUATE_CIV');
          break;
        case ' ':
          e.preventDefault();
          if (gameStage === 'DECON') handleHotspotAction('COMPLETE_DECON');
          else if (contained) handleHotspotAction('DECON_SHOWER');
          break;
        case 'w':
        case 'arrowup':
          if (gameStage === 'BRIEFING') handleHotspotAction('GO_PPE_STATION');
          else if (gameStage === 'PPE_COMPLETE') handleHotspotAction('ENTER_BAY');
          break;
        case 'a':
        case 'arrowleft':
          setCompassHeading(h => (h - 8 + 360) % 360);
          break;
        case 'd':
        case 'arrowright':
          setCompassHeading(h => (h + 8) % 360);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, gameStage, ppeState, leakFound, contained, handleHotspotAction]);

  // ──────────────────────────────────────────────────────────────
  // FINISH MISSION
  // ──────────────────────────────────────────────────────────────
  const finishMission = async () => {
    const sid = stateRef.current.sessionId || sessionId;
    if (sid) {
      try { await fetch(`/api/sessions/${sid}/complete`, { method: 'POST' }); } catch (_) {}
    }
    setIsActive(false);
    setGameStage(null);
  };

  // ──────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ──────────────────────────────────────────────────────────────
  const currentStageDef = gameStage ? GAME_STAGES[gameStage] : null;
  const allPpeDone = ppeState.mask && ppeState.suit && ppeState.gloves;

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#05080c', position: 'relative', cursor: isActive ? 'crosshair' : 'default' }}
      onMouseMove={handleMouseMove}
    >
      {/* ── Post-Processing Canvas Overlay ── */}
      <PostProcessing cursorPos={cursorPos} isActive={isActive} screenShake={screenShake} />

      {/* ── CCTV / Bodycam Header Bar ── */}
      <header style={{
        padding: '10px 24px',
        background: 'rgba(7, 10, 15, 0.95)',
        borderBottom: '1px solid rgba(245, 130, 32, 0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 25
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Shield size={22} color="var(--accent-ndrf-orange)" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff', letterSpacing: '0.5px' }}>
                CAM_BAY03_EXT // 21-AUG-2026 // 10:03:13 UTC
              </span>
              <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Radio size={11} className="warning-led" /> {isActive ? 'REC ●' : 'STANDBY'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              CBRS-X Interactive Simulation Engine // SIH260088 // PORT 5000
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isActive && gameStage && (
            <div style={{
              fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)',
              background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.25)',
              padding: '4px 10px', borderRadius: '4px'
            }}>
              STAGE: {gameStage.replace(/_/g, ' ')}
            </div>
          )}
          {!isActive ? (
            <button className="btn-tactical" onClick={startSession}>
              <Play size={14} /> INITIATE DEPLOYMENT
            </button>
          ) : (
            <button className="btn-tactical" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }} onClick={finishMission}>
              <CheckCircle size={14} /> END MISSION
            </button>
          )}
        </div>
      </header>

      {/* ── Main Interactive Viewport ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!isActive ? (
          /* ── Pre-Game Lobby ── */
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 20, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Flame size={64} color="var(--accent-ndrf-orange)" className="handheld-motion" />
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--accent-red)',
                animation: 'pulseRed 1s infinite'
              }} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '1px' }}>
              CBRN-X INTERACTIVE SIMULATION ENGINE
            </h2>
            <p style={{ maxWidth: '580px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--accent-ndrf-orange)' }}>Game-Like Interactive Environment.</strong> Click on scene objects to progress. Videos play on your actions and freeze on completion. Cursor movement drives parallax depth. All events stream live to Port 8080.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn-tactical" style={{ padding: '14px 32px', fontSize: '0.95rem' }} onClick={startSession}>
                <Zap size={18} /> INITIATE DEPLOYMENT
              </button>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '24px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              <span>🖱️ CLICK to interact</span>
              <span>⌨️ E/F/R/SPACE shortcuts</span>
              <span>🎯 CURSOR drives parallax</span>
            </div>
          </div>
        ) : (
          /* ── Active Game Viewport ── */
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>

            {/* ── Video Layer (PAUSED by default, plays on interaction) ── */}
            <video
              ref={videoRef}
              preload="auto"
              playsInline
              muted
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                position: 'absolute', inset: 0, zIndex: 1,
                filter: `saturate(1.3) contrast(1.1) sepia(0.05)`,
                transition: 'filter 0.3s ease'
              }}
            />

            {/* ── Video Crossfade Overlay (brief white flash on stage transitions) ── */}
            {screenShake && (
              <div className="screen-shake-flash" style={{
                position: 'absolute', inset: 0, zIndex: 2,
                background: 'rgba(245, 130, 32, 0.12)',
                animation: 'fadeOut 0.4s ease forwards'
              }} />
            )}

            {/* ── Gas Mask Visor Frame (when mask equipped) ── */}
            {ppeState.mask && (
              <div className="visor-frame" style={{
                position: 'absolute', inset: 0, zIndex: 14, pointerEvents: 'none',
              }}>
                {/* Visor glass with breathing fog */}
                <div className="visor-glass" />
              </div>
            )}

            {/* ── Interactive Hotspot Layer (clickable scene regions) ── */}
            {currentStageDef && (
              <Hotspots
                stage={currentStageDef.hotspots}
                onAction={handleHotspotAction}
                cursorPos={cursorPos}
              />
            )}

            {/* ── HUD Overlay (parallax-shifted by cursor position) ── */}
            <CursorParallaxLayer subscribe={parallax.subscribe} depth={0.5} style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              padding: '18px', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', zIndex: 20
            }}>
              {/* ── Top HUD Row ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                {/* Objective Banner */}
                <div style={{
                  background: 'rgba(7, 10, 15, 0.92)', border: '1px solid rgba(245, 130, 32, 0.5)',
                  padding: '10px 18px', borderRadius: '8px',
                  color: 'var(--accent-ndrf-orange)', fontWeight: '700', fontSize: '0.82rem',
                  maxWidth: '480px', lineHeight: '1.4'
                }}>
                  🎯 {currentStageDef?.objective}
                </div>

                {/* Right HUD Cluster */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  {/* Compass */}
                  <div style={{
                    background: 'rgba(7, 10, 15, 0.9)', border: '1px solid rgba(0, 242, 254, 0.3)',
                    padding: '5px 14px', borderRadius: '6px',
                    color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.76rem',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <Compass size={14} color="var(--accent-cyan)" /> N {compassHeading}°
                  </div>

                  {/* PID Gas Detector */}
                  <div style={{
                    background: 'rgba(7, 10, 15, 0.9)',
                    border: `1px solid ${ppmReading > 200 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 242, 254, 0.4)'}`,
                    padding: '8px 16px', borderRadius: '6px',
                    color: ppmReading > 200 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.85rem'
                  }}>
                    📟 {ppmReading} PPM {ppmReading > 200 && <span className="warning-led">⚠️ DANGER</span>}
                  </div>

                  {/* PPE Status Badges */}
                  <div style={{
                    background: 'rgba(7, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '6px 12px', borderRadius: '6px',
                    fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#fff',
                    display: 'flex', gap: '8px'
                  }}>
                    <span style={{ color: ppeState.mask ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {ppeState.mask ? '✅' : '⬜'} MASK
                    </span>
                    <span style={{ color: ppeState.suit ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {ppeState.suit ? '✅' : '⬜'} SUIT
                    </span>
                    <span style={{ color: ppeState.gloves ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {ppeState.gloves ? '✅' : '⬜'} GLOVES
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Center Reticle Crosshair ── */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
              }}>
                <Crosshair size={36} color="rgba(0, 242, 254, 0.7)" strokeWidth={1.5} />
                <span style={{
                  fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                  color: 'rgba(0, 242, 254, 0.5)', letterSpacing: '1px'
                }}>
                  CLICK TO INTERACT
                </span>
              </div>

              {/* ── Bottom HUD Row ── */}
              <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
                {/* Left: Current video scene tag */}
                <div className="glass-hud" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Video size={14} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {currentStageDef?.video.replace('/videos/', '').toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    {gameStage === 'MISSION_END' ? '// COMPLETE' : '// PAUSED UNTIL CLICK'}
                  </span>
                </div>

                {/* Center: Keyboard shortcut legend */}
                <div className="glass-hud" style={{ padding: '6px 14px', fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  <strong style={{ color: '#fff' }}>E</strong>=PPE &nbsp;
                  <strong style={{ color: '#fff' }}>F</strong>=Seal &nbsp;
                  <strong style={{ color: '#fff' }}>R</strong>=Evac &nbsp;
                  <strong style={{ color: '#fff' }}>SPACE</strong>=Decon &nbsp;
                  <strong style={{ color: '#fff' }}>W</strong>=Advance
                </div>

                {/* Right: Mission stats */}
                <div className="glass-hud" style={{ padding: '8px 14px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', display: 'flex', gap: '12px' }}>
                  <span style={{ color: leakFound ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    LEAK: {leakFound ? '✅' : '❓'}
                  </span>
                  <span style={{ color: civiliansEvacuated >= 2 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
                    EVAC: {civiliansEvacuated}/2
                  </span>
                  <span style={{ color: contained ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    SEAL: {contained ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            </CursorParallaxLayer>
          </div>
        )}
      </div>

      {/* ── Telemetry Footer ── */}
      <footer style={{
        padding: '7px 24px', background: '#05080c',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 25
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={12} />
          <span>TELEMETRY (5000→8080): {telemetryLogs[0] || 'Awaiting interaction...'}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
          <span>CURSOR: {cursorPos.x},{cursorPos.y}</span>
          <span>ADMIN: PORT 3000</span>
        </div>
      </footer>
    </div>
  );
}
