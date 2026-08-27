import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, Volume2, VolumeX, AlertTriangle, ShieldAlert, RadioTower, MessageSquare, Zap, Play } from 'lucide-react';

const CHANNELS = [
  { id: 'alpha', label: 'Alpha (Hot-Zone Recon)', freq: '462.550 MHz', activeResponders: 2, color: '#10b981' },
  { id: 'bravo', label: 'Bravo (Decon Unit)', freq: '462.575 MHz', activeResponders: 1, color: '#06b6d4' },
  { id: 'command', label: 'Command Broadcast', freq: '462.600 MHz', activeResponders: 4, color: '#8b5cf6' },
];

const INITIAL_TRANSCRIPTS = [
  { id: 1, sender: 'Inspector Lohith R C', channel: 'Alpha', text: 'Command, Alpha lead entering Sector Delta. Level-A suits pressure verified.', timestamp: '12:04:15', isDistress: false },
  { id: 2, sender: 'Sub-Inspector Rajesh', channel: 'Bravo', text: 'Decon shower archway zeroed at 0.00 ppm ambient background.', timestamp: '12:04:32', isDistress: false },
  { id: 3, sender: 'Constable Vikram Singh', channel: 'Alpha', text: 'SCBA pressure reading 850 PSI. Proceeding to container seal.', timestamp: '12:04:50', isDistress: false },
];

const DISTRESS_KEYWORDS = ['MAYDAY', 'SCBA LOW', 'OXYGEN LOW', 'WALL COLLAPSE', 'PANIC', 'LEAK BREACH'];

export default function VoiceIntercomManager() {
  const [selectedChannel, setSelectedChannel] = useState('alpha');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [transcripts, setTranscripts] = useState(INITIAL_TRANSCRIPTS);
  const [distressAlert, setDistressAlert] = useState(null);
  const [vuLevel, setVuLevel] = useState(15); // %
  const transcriptEndRef = useRef(null);

  // VU Meter animation when Mic is active
  useEffect(() => {
    if (!isMicOn) {
      setVuLevel(8);
      return;
    }

    const interval = setInterval(() => {
      setVuLevel(Math.floor(40 + Math.random() * 55));
    }, 150);

    return () => clearInterval(interval);
  }, [isMicOn]);

  // Auto-scroll to bottom of transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  const simulateTraiineRadio = (customText = null, forceDistress = false) => {
    const textPool = [
      'Alpha Lead to Command: Chlorine leak at Drum #3 neutralized. Aerosol seal applied.',
      'Bravo 1: Civilian extraction pathway clear. Transporting casualty to decon archway.',
      'MAYDAY! MAYDAY! High chlorine plume spike detected! Oxygen low near Sector B-4!',
      'Command, PID reading 0.05 ppm. Proceeding to secondary containment boundary.',
    ];

    const messageText = customText || (forceDistress ? 'MAYDAY! MAYDAY! Wall collapse near Sector B-4! Responder pinned!' : textPool[Math.floor(Math.random() * textPool.length)]);
    const isDistressMessage = forceDistress || DISTRESS_KEYWORDS.some((kw) => messageText.toUpperCase().includes(kw));

    const newMsg = {
      id: Date.now(),
      sender: isDistressMessage ? 'Constable Vikram Singh' : 'Inspector Lohith R C',
      channel: selectedChannel.toUpperCase(),
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isDistress: isDistressMessage,
    };

    setTranscripts((prev) => [...prev, newMsg]);

    if (isDistressMessage) {
      setDistressAlert({
        sender: newMsg.sender,
        text: messageText,
        timestamp: newMsg.timestamp,
      });
    }
  };

  return (
    <div
      className="glass-card-deep animate-fade-in"
      style={{
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        border: distressAlert ? '2px solid #ef4444' : '1px solid rgba(139, 92, 246, 0.3)',
        background: 'linear-gradient(145deg, rgba(8, 14, 26, 0.95) 0%, rgba(13, 22, 38, 0.98) 100%)',
        boxShadow: distressAlert ? '0 0 30px rgba(239, 68, 68, 0.3)' : 'none',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
            }}
          >
            <RadioTower size={22} className={isMicOn ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', letterSpacing: '0.02em' }}>
              WEBRTC VOICE INTERCOM &amp; AI DISTRESS DETECTOR
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Real-time voice radio channel with automated AI emergency spoken keyword detection
            </p>
          </div>
        </div>

        {/* Channel Selection Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              style={{
                padding: '6px 12px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedChannel === ch.id ? ch.color : 'rgba(255, 255, 255, 0.1)',
                background: selectedChannel === ch.id ? `${ch.color}25` : 'transparent',
                color: selectedChannel === ch.id ? ch.color : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Radio size={12} /> {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Emergency Spoken Distress Alert Banner */}
      {distressAlert && (
        <div
          className="animate-pulse-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.35))',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={26} color="#ef4444" className="animate-bounce" />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#fca5a5', letterSpacing: '1px', textTransform: 'uppercase' }}>
                🚨 🔴 AI DISTRESS KEYWORD DETECTED: [{distressAlert.sender.toUpperCase()}]
              </div>
              <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '700', marginTop: '2px' }}>
                "{distressAlert.text}"
              </div>
            </div>
          </div>

          <button
            onClick={() => setDistressAlert(null)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            DISMISS ALERT
          </button>
        </div>
      )}

      {/* Intercom Controls & Audio VU Level Visualizer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Audio Mic Controls Card */}
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 700 }}>
            COMMAND INTERCOM TRANSMITTER
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <button
              onClick={toggleMic}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: isMicOn ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${isMicOn ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                color: isMicOn ? '#fff' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isMicOn ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
              }}
            >
              {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
              {isMicOn ? 'MIC LIVE (TRANSMITTING)' : 'MIC MUTED'}
            </button>

            <button
              onClick={() => setIsSpeakerOn((prev) => !prev)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: isSpeakerOn ? '#38bdf8' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>

          {/* Visual VU Audio Level Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>AUDIO INPUT LEVEL (VU METER)</span>
              <span style={{ color: isMicOn ? '#10b981' : 'var(--text-muted)', fontWeight: 800 }}>{vuLevel}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${vuLevel}%`,
                  background: vuLevel > 85 ? 'linear-gradient(90deg, #10b981, #ef4444)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                  transition: 'width 0.1s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Simulation Trigger Buttons */}
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 700 }}>
            RADIO CHATTER &amp; DISTRESS TEST TRIGGERS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => simulateTraiineRadio(null, false)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#38bdf8',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Play size={14} /> Simulate Normal Trainee Radio Chatter
            </button>

            <button
              onClick={() => simulateTraiineRadio(null, true)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.2)',
              }}
            >
              <Zap size={14} /> Trigger Spoken "MAYDAY" AI Distress Alert
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Speech-to-Text Transcript Feed */}
      <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} color="#06b6d4" />
            REAL-TIME VOICE TRANSCRIPT FEED (SPEECH-TO-TEXT)
          </div>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            AI SCANNER ACTIVE
          </span>
        </div>

        <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '6px' }}>
          {transcripts.map((t) => (
            <div
              key={t.id}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: t.isDistress ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${t.isDistress ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ fontWeight: '800', color: t.isDistress ? '#ef4444' : '#38bdf8' }}>
                  {t.sender} [{t.channel}]
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t.timestamp}</span>
              </div>
              <div style={{ color: t.isDistress ? '#fff' : '#cbd5e1', fontWeight: t.isDistress ? '800' : '400' }}>
                {t.text}
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
}
