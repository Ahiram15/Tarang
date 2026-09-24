import React, { useEffect, useState } from 'react';
import { ArrowRight, Activity, Database, Satellite, ShieldCheck, Clock, Compass, Layers, X } from 'lucide-react';
import heroVideo from '../assets/ocean.mp4';

interface CinematicLandingProps {
  onEnterMissionControl: () => void;
  onNavigateToGlobe?: () => void;
  onNavigateToLab?: () => void;
}

export const CinematicLanding: React.FC<CinematicLandingProps> = ({
  onEnterMissionControl,
  onNavigateToGlobe,
  onNavigateToLab,
}) => {
  const [utcTime, setUtcTime] = useState<string>('00:00:00 UTC');
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);
  const [showStacModal, setShowStacModal] = useState<boolean>(false);

  // Live real-time UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      height: '100vh',
      background: '#050d1a',
      color: '#d9e2fb',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* Enhanced HD Fullscreen Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          opacity: 0.88,
          filter: 'contrast(1.06) brightness(0.82) saturate(1.08)',
          transform: 'translateZ(0)',
          willChange: 'transform, filter',
          zIndex: 0,
        }}
        src={heroVideo}
      />

      {/* Cinematic Deep Space Vignette & Contrast Control */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 75% at 50% 48%, rgba(2, 6, 18, 0.15) 20%, rgba(2, 6, 18, 0.5) 65%, rgba(2, 6, 18, 0.92) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Subtle Reticle Grid SVG Pattern Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.08,
        zIndex: 2,
      }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hud-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#00f2fe" strokeDasharray="2 6" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="1.5" fill="#38bdf8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hud-grid)" />
        </svg>
      </div>

      {/* Corner Technical Markings */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        letterSpacing: '0.12em',
        color: '#64748b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#00f2fe', fontWeight: 700 }}>GEODETIC REF</span>
          <span>WGS-84 // EPSG:4326</span>
        </div>
        <div style={{ width: '80px', height: '2px', background: 'rgba(0, 242, 254, 0.3)' }} />
      </div>

      <div style={{
        position: 'absolute',
        top: '16px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px',
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        letterSpacing: '0.12em',
        color: '#64748b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>CDSE STAC DAEMON</span>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }} />
        </div>
        <div style={{ width: '80px', height: '2px', background: 'rgba(16, 185, 129, 0.3)' }} />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TOP SECTION: Tactical Header, Badges & Title
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: '28px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}>
        {/* Eyebrow Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(5, 14, 31, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          boxShadow: '0 0 20px rgba(0, 242, 254, 0.15)',
          marginBottom: '16px',
        }}>
          <span style={{
            position: 'relative',
            display: 'flex',
            width: '8px',
            height: '8px',
          }}>
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#00f2fe',
              opacity: 0.75,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }} />
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00f2fe',
            }} />
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#e0fdff',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            AUTONOMOUS SATELLITE ENGINE
          </span>
        </div>

        {/* Main Typography Hierarchy */}
        <h1 style={{
          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
          fontSize: 'clamp(54px, 8vw, 104px)',
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          textTransform: 'uppercase',
          background: 'linear-gradient(180deg, #ffffff 15%, #00f2fe 65%, #64748b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 12px 28px rgba(0, 0, 0, 0.85))',
          margin: 0,
        }}>
          TARANG
        </h1>

        <p style={{
          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
          fontSize: 'clamp(12px, 1.8vw, 15px)',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#38bdf8',
          maxWidth: '650px',
          marginTop: '8px',
          marginBottom: '0px',
        }}>
          AUTONOMOUS OCEAN SPILL INTELLIGENCE
        </p>

        {/* Action Cluster */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '20px',
        }}>
          {/* Primary CTA */}
          <button
            onClick={onEnterMissionControl}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px 28px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #00f2fe 0%, #38bdf8 50%, #00dce6 100%)',
              color: '#030712',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 24px rgba(0, 242, 254, 0.45)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 36px rgba(0, 242, 254, 0.8)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 242, 254, 0.45)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>ENTER ACTIVE MISSION CONTROL</span>
            <ArrowRight size={17} strokeWidth={2.5} />
          </button>

          {/* Secondary Button */}
          <button
            onClick={() => setShowMethodologyModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 18px',
              borderRadius: '6px',
              background: 'rgba(33, 42, 60, 0.65)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 242, 254, 0.15)',
              color: '#e0f2fe',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(43, 53, 71, 0.85)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(33, 42, 60, 0.65)')}
          >
            <Activity size={15} color="#00dce6" />
            <span>Methodology</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MIDDLE SECTION: Live High-Tech Stats Strip (3 Cards)
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        maxWidth: '1100px',
        width: '100%',
        margin: '20px auto',
        padding: '0 16px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
        }}>
          {/* Metric Card 1 */}
          <div style={{
            position: 'relative',
            padding: '14px 18px',
            borderRadius: '6px',
            background: 'rgba(18, 28, 45, 0.82)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(0, 242, 254, 0.16)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                PRIMARY CONSTELLATION SYNC
              </span>
              <span style={{
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#2b3547',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#4edea3',
                fontWeight: 700,
              }}>
                4 SYNCED
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '20px',
                fontWeight: 700,
                color: '#e0fdff',
                letterSpacing: '-0.02em',
              }}>
                SAR + OPTICAL [4x]
              </div>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#94a3b8',
                margin: 0,
              }}>
                Sentinel-1A/B (C-SAR), Sentinel-2A/B (MSI), Landsat-8/9, Oceansat-3
              </p>
            </div>

            <div style={{
              width: '100%',
              height: '4px',
              background: '#2b3547',
              borderRadius: '9999px',
              marginTop: '12px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '94%',
                height: '100%',
                background: '#00f2fe',
                boxShadow: '0 0 10px #00f2fe',
              }} />
            </div>
          </div>

          {/* Metric Card 2 */}
          <div style={{
            position: 'relative',
            padding: '14px 18px',
            borderRadius: '6px',
            background: 'rgba(18, 28, 45, 0.82)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(78, 222, 163, 0.18)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                AUTONOMOUS PIPELINE CADENCE
              </span>
              <span style={{
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#2b3547',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#00f2fe',
                fontWeight: 700,
              }}>
                30-MIN LOOP
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '20px',
                fontWeight: 700,
                color: '#4edea3',
                letterSpacing: '-0.02em',
              }}>
                TIER-1 &amp; TIER-2
              </div>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#94a3b8',
                margin: 0,
              }}>
                2.1MB Quicklook screening &rarr; 4.8MB Targeted SAR Patch (99.3% Bandwidth Saved)
              </p>
            </div>

            <div style={{
              width: '100%',
              height: '4px',
              background: '#2b3547',
              borderRadius: '9999px',
              marginTop: '12px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: '#4edea3',
                boxShadow: '0 0 10px #4edea3',
              }} />
            </div>
          </div>

          {/* Metric Card 3 */}
          <div style={{
            position: 'relative',
            padding: '14px 18px',
            borderRadius: '6px',
            background: 'rgba(18, 28, 45, 0.82)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(245, 158, 11, 0.18)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                MONITORED SEA CORRIDORS
              </span>
              <span style={{
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#2b3547',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#fbbf24',
                fontWeight: 700,
              }}>
                HIGH-RISK LANES
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '20px',
                fontWeight: 700,
                color: '#fbbf24',
                letterSpacing: '-0.02em',
              }}>
                14 HIGHWAY LANES
              </div>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#94a3b8',
                margin: 0,
              }}>
                Strait of Hormuz, Malacca Strait, Bab-el-Mandeb, Levantine Basin, Persian Gulf
              </p>
            </div>

            <div style={{
              width: '100%',
              height: '4px',
              background: '#2b3547',
              borderRadius: '9999px',
              marginTop: '12px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: '#fbbf24',
                boxShadow: '0 0 10px #fbbf24',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM SECTION: Monospace Ticker & Live Status Strip
         ───────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto 16px auto',
        padding: '0 16px',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(5, 14, 31, 0.88)',
          borderRadius: '6px',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.16)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#00f2fe', fontWeight: 600 }}>ACTIVE SENSOR:</span>
              <span style={{ color: '#d9e2fb' }}>C-BAND SAR 5.405 GHz (VV+VH)</span>
            </div>
            <span style={{ color: '#334155' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#00f2fe', fontWeight: 600 }}>BENCHMARK SECTOR:</span>
              <span style={{ color: '#d9e2fb' }}>20.44°S, 57.74°E (Mauritius Lagoon)</span>
            </div>
            <span style={{ color: '#334155' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#00f2fe', fontWeight: 600 }}>SYS CLOCK:</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{utcTime}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#4edea3',
              boxShadow: '0 0 8px #4edea3',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ color: '#4edea3', fontWeight: 700, textTransform: 'uppercase' }}>
              STATUS: DAEMON ACTIVE • INGESTION ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          INSPECT METHODOLOGY MODAL
         ───────────────────────────────────────────────────────────── */}
      {showMethodologyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5000,
          padding: '16px',
        }}>
          <div style={{
            maxWidth: '680px',
            width: '100%',
            background: 'rgba(9, 19, 36, 0.95)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '10px',
            padding: '24px',
            boxShadow: '0 0 50px rgba(0, 242, 254, 0.25)',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowMethodologyModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Activity size={20} color="#00f2fe" />
              <h3 style={{ margin: 0, color: '#00f2fe', fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px' }}>
                TARANG AUTONOMOUS DETECTION &amp; FORENSIC ARCHITECTURE
              </h3>
            </div>

            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#d9e2fb', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong style={{ color: '#38bdf8' }}>1. Tier-1 Adaptive CFAR Fast Screening (~2.1 MB Quicklooks):</strong>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  A two-parameter Constant False Alarm Rate (CFAR) clutter filter screens low-resolution Copernicus STAC quicklooks across 14 monitored sea corridors every 30 minutes, saving 99.3% network bandwidth.
                </p>
              </div>

              <div>
                <strong style={{ color: '#38bdf8' }}>2. Tier-2 Deep Neural Segmentation (~4.8 MB Sub-Scene):</strong>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  Extracts full 10m GSD dual-pol (VV+VH) SAR backscatter. Applies 7x7 Gamma-MAP despeckling, GSHHG high-resolution coastline masking, and inference via our dual-polarization U-Net (<code>unet_oilspill.h5</code>) with XGBoost biogenic false-positive rejection.
                </p>
              </div>

              <div>
                <strong style={{ color: '#38bdf8' }}>3. Tier-3 Lagrangian Drift &amp; AIS Dark-Vessel Correlation:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  Integrates ISRO Oceansat-3 scatterometer wind vectors (3–30 m/s) and HYCOM surface currents into a backward Lagrangian advection model, pinpointing the probable origin centroid and ranking AIS-blackout suspect vessels for maritime prosecution.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowMethodologyModal(false);
                  onEnterMissionControl();
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#00f2fe',
                  color: '#030712',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                LAUNCH SIMULATION →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAC ENDPOINTS MODAL
         ───────────────────────────────────────────────────────────── */}
      {showStacModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5000,
          padding: '16px',
        }}>
          <div style={{
            maxWidth: '680px',
            width: '100%',
            background: 'rgba(9, 19, 36, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '10px',
            padding: '24px',
            boxShadow: '0 0 50px rgba(16, 185, 129, 0.25)',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowStacModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Database size={20} color="#10b981" />
              <h3 style={{ margin: 0, color: '#10b981', fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px' }}>
                COPERNICUS DATA SPACE (CDSE) ENDPOINTS
              </h3>
            </div>

            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#d9e2fb', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#050e1f', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#00f2fe' }}>STAC CATALOG:</span>
                <div style={{ color: '#94a3b8', marginTop: '2px', wordBreak: 'break-all' }}>
                  https://catalogue.dataspace.copernicus.eu/stac
                </div>
              </div>

              <div style={{ background: '#050e1f', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#10b981' }}>ODATA API:</span>
                <div style={{ color: '#94a3b8', marginTop: '2px', wordBreak: 'break-all' }}>
                  https://catalogue.dataspace.copernicus.eu/odata/v1/Products
                </div>
              </div>

              <div style={{ background: '#050e1f', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#fbbf24' }}>POLLING CADENCE:</span>
                <div style={{ color: '#94a3b8', marginTop: '2px' }}>
                  30 Minutes cron / Automated ingestion daemon via CDSE OAuth token
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowStacModal(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#f1f5f9',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
