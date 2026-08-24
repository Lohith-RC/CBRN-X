import React from 'react';
import { 
  Shield, 
  Activity, 
  Monitor, 
  Glasses, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Flame, 
  Zap, 
  Users, 
  Award, 
  ChevronRight,
  Database
} from 'lucide-react';

export default function LandingPage({ onNavigate, stats }) {
  return (
    <div style={{ color: '#f1f5f9', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      
      {/* HERO SECTION */}
      <section style={{
        position: 'relative',
        padding: '48px 0 64px 0',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(11, 15, 25, 0.95) 100%)',
        border: '1px solid rgba(14, 165, 233, 0.2)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        marginBottom: '40px',
        overflow: 'hidden',
        paddingLeft: '32px',
        paddingRight: '32px',
      }}>
        {/* Decorative Grid Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.12) 0%, transparent 70%), linear-gradient(rgba(14, 165, 233, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Top Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '9999px',
            padding: '6px 16px',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#22d3ee',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '24px',
            backdropFilter: 'blur(8px)',
          }}>
            <Shield size={14} style={{ color: '#06b6d4' }} />
            <span>SIH260088 • NDRF Disaster Response Platform</span>
          </div>

          {/* Hero Main Heading */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            fontWeight: '800',
            lineHeight: '1.15',
            letterSpacing: '-0.02em',
            color: '#ffffff',
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
          }}>
            VR-Based <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 50%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>CBRN Disaster Response</span> Training Platform
          </h1>

          {/* Hero Subtitle */}
          <p style={{
            fontSize: '1.15rem',
            color: '#94a3b8',
            maxWidth: '800px',
            margin: '0 auto 36px auto',
            lineHeight: '1.6',
            fontWeight: '400',
          }}>
            Built for <strong style={{ color: '#cbd5e1' }}>NDRF (National Disaster Response Force)</strong> personnel to practice chemical hazard neutralization, level-A suit donning, detector scanning, and decontamination protocols in realistic 3D simulated emergency environments without real-world safety risks.
          </p>

          {/* 3 Glowing Call-to-Action Buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '16px',
          }}>
            {/* CTA 1: Dashboard */}
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(2, 132, 199, 0.45)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 35px rgba(2, 132, 199, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(2, 132, 199, 0.45)';
              }}
            >
              <Monitor size={20} />
              <span>Launch Instructor Dashboard</span>
              <ChevronRight size={16} />
            </button>

            {/* CTA 2: VR Simulator */}
            <button
              onClick={() => onNavigate('vr_view')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                border: '1px solid rgba(45, 212, 191, 0.4)',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(13, 148, 136, 0.45)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 35px rgba(13, 148, 136, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(13, 148, 136, 0.45)';
              }}
            >
              <Glasses size={20} />
              <span>Start 3D Trainee VR View</span>
              <ChevronRight size={16} />
            </button>

            {/* CTA 3: Backend API Status */}
            <button
              onClick={() => onNavigate('simulator')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '14px 24px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
              }}
            >
              <Cpu size={20} />
              <span>Telemetry Event Simulator</span>
            </button>
          </div>

        </div>
      </section>

      {/* THREE MODULAR SUBSYSTEM GLASSMORPHISM CARDS */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>
            Integrated Defense Subsystems
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Seamless tri-layer architecture for real-time telemetry, 3D execution, and command analytics.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {/* Card 1: Instructor Command Center */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            borderRadius: '16px',
            padding: '28px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div>
              <div style={{
                display: 'inline-flex', padding: '10px', borderRadius: '12px',
                background: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(14, 165, 233, 0.3)',
                color: '#38bdf8', marginBottom: '18px',
              }}>
                <Monitor size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '10px' }}>
                Instructor Command Center
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
                Real-time dashboard displaying active trainee telemetry, pass rates, score breakdowns, and automated report card evaluations on Port <code style={{ color: '#38bdf8' }}>:3000</code>.
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '16px' }}>
              <button
                onClick={() => onNavigate('dashboard')}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  border: '1px solid rgba(14, 165, 233, 0.35)',
                  color: '#38bdf8',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Open Command View</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 2: 3D Trainee WebGL Simulator */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(20, 184, 166, 0.25)',
            borderRadius: '16px',
            padding: '28px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
              background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div>
              <div style={{
                display: 'inline-flex', padding: '10px', borderRadius: '12px',
                background: 'rgba(20, 184, 166, 0.12)', border: '1px solid rgba(20, 184, 166, 0.3)',
                color: '#2dd4bf', marginBottom: '18px',
              }}>
                <Glasses size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '10px' }}>
                Trainee 3D WebGL Simulator
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
                First-person 3D WebGL simulator modeling Level-A suit donning, PID photoionization detector scanning, and chlorine leak patching on Port <code style={{ color: '#2dd4bf' }}>:5000</code>.
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '16px' }}>
              <button
                onClick={() => onNavigate('vr_view')}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(20, 184, 166, 0.15)',
                  border: '1px solid rgba(20, 184, 166, 0.35)',
                  color: '#2dd4bf',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Launch 3D WebVR</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 3: Spring Boot Scoring Backend */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '16px',
            padding: '28px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div>
              <div style={{
                display: 'inline-flex', padding: '10px', borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399', marginBottom: '18px',
              }}>
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '10px' }}>
                Spring Boot Backend Engine
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
                High-performance REST API scoring engine running on Port <code style={{ color: '#34d399' }}>:8080</code> calculating mistake penalties, windward approach checks, and persistence.
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '16px' }}>
              <button
                onClick={() => onNavigate('simulator')}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Simulate Telemetry Event</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CORE PLATFORM CAPABILITIES GRID */}
      <section style={{
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: '20px',
        padding: '36px 28px',
        marginBottom: '48px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>
            Tactical CBRN Response Capabilities
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Key defense evaluation protocols embedded into the 3D VR simulation lifecycle.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}>
          {/* Feature 1 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <Flame size={22} style={{ color: '#ef4444', marginBottom: '12px' }} />
            <h4 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>
              Level-A PPE Seal Check
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.4' }}>
              Trainees must verify suit pressure, seal valves, and inspect SCBA gauges before crossing the hot zone boundary.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <Zap size={22} style={{ color: '#06b6d4', marginBottom: '12px' }} />
            <h4 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>
              PID Detector Scanning
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.4' }}>
              Calibrate Photoionization Detectors (PID) at fresh-air baselines and maintain sub-1-meter scanning distance to drum seams.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <Shield size={22} style={{ color: '#10b981', marginBottom: '12px' }} />
            <h4 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>
              Windward Leak Capping
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.4' }}>
              Enforce upwind perimeter approach to leaking chlorine containers and apply emergency A-clamp patch kits.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <Activity size={22} style={{ color: '#38bdf8', marginBottom: '12px' }} />
            <h4 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>
              Automated Score & Penalties
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.4' }}>
              Spring Boot engine analyzes telemetry timestamps to generate instant scorecards, mistake logs, and recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* SYSTEM ARCHITECTURE FLOWCHART */}
      <section style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(14, 165, 233, 0.2)',
        borderRadius: '20px',
        padding: '36px 28px',
        marginBottom: '48px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', marginBottom: '6px' }}>
            System Architecture Flow
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            End-to-end data pipeline from 3D WebGL client to analytical dashboard.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}>
          {/* Step 1 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            textAlign: 'center',
            minWidth: '180px',
          }}>
            <Glasses size={20} style={{ color: '#2dd4bf', marginBottom: '8px' }} />
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#f1f5f9' }}>Unity / WebGL Client</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Live Telemetry Events</div>
          </div>

          <ChevronRight size={20} style={{ color: '#38bdf8', opacity: 0.6 }} />

          {/* Step 2 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            textAlign: 'center',
            minWidth: '180px',
          }}>
            <Cpu size={20} style={{ color: '#38bdf8', marginBottom: '8px' }} />
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#f1f5f9' }}>Spring Boot Engine</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Scoring & Validation</div>
          </div>

          <ChevronRight size={20} style={{ color: '#38bdf8', opacity: 0.6 }} />

          {/* Step 3 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            textAlign: 'center',
            minWidth: '180px',
          }}>
            <Database size={20} style={{ color: '#a855f7', marginBottom: '8px' }} />
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#f1f5f9' }}>Supabase / H2 DB</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Relational Persistence</div>
          </div>

          <ChevronRight size={20} style={{ color: '#38bdf8', opacity: 0.6 }} />

          {/* Step 4 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            textAlign: 'center',
            minWidth: '180px',
          }}>
            <Monitor size={20} style={{ color: '#38bdf8', marginBottom: '8px' }} />
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#f1f5f9' }}>React Dashboard</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Analytics & Reports</div>
          </div>
        </div>
      </section>

      {/* TEAM & SIH CREDITS */}
      <section style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: '20px',
        padding: '32px 28px',
        marginBottom: '40px',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '24px',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: '700', letterSpacing: '0.05em' }}>
              SMART INDIA HACKATHON 2026
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#f8fafc' }}>
              SIH Problem Statement: SIH260088
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Category: Disaster Management | Ministry of Home Affairs (NDRF)
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(30, 41, 59, 0.6)',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.15)',
          }}>
            <Award size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: '600' }}>NDRF Certification Ready</span>
          </div>
        </div>

        {/* Team Members Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          paddingTop: '20px',
        }}>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            <strong style={{ color: '#38bdf8' }}>Lohith R C</strong> — Team Lead & Backend
          </div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            <strong style={{ color: '#38bdf8' }}>Monica K S</strong> — Backend & Scoring
          </div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            <strong style={{ color: '#38bdf8' }}>Chandana M N</strong> — Unity VR Scripting
          </div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            <strong style={{ color: '#38bdf8' }}>Harshini R B</strong> — 3D Environment Design
          </div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            <strong style={{ color: '#38bdf8' }}>Chandana M P</strong> — React Dashboard UI
          </div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            <strong style={{ color: '#38bdf8' }}>Pavitra J H</strong> — UI/UX & Testing
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 0',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        color: '#64748b',
        fontSize: '0.8rem',
      }}>
        <p style={{ marginBottom: '6px' }}>
          © 2026 CBRN-X Platform • Built for NDRF Disaster Response Training
        </p>
        <p style={{ fontSize: '0.75rem', color: '#475569' }}>
          Spring Boot Engine (:8080) | Instructor Dashboard (:3000) | 3D WebVR Simulator (:5000)
        </p>
      </footer>

    </div>
  );
}
