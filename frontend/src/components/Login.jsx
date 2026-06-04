import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Globe from 'globe.gl';
import { Activity, Mail, Lock, User, Shield } from 'lucide-react';

const featureHotspots = [
  {
    title: 'Scope of this Website',
    lat: 48,
    lng: -2, // Moved closer to center (Left Hemisphere)
    color: '#ef4444', // Red
    description: `
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 15px; line-height: 1.45;">
        <div>This website is made so people who visits the website or see the disease heatmap in the hospital screens would be able to know how severe the disease is and where it is so that they will be cautious.</div>
        <div>• <strong>Hospitals</strong>: they can enter the patient details and their disease either by texting or through voice-to-text entry and they can enter the lat long so that the patients location area is reflected in the map.</div>
        <div>• <strong>Users</strong>: they can see the details of the diseases and their sevierity in the map or through the dashboard.</div>
        <div>• <strong>In times of pandemic</strong>: Every user will be able to Enter the disase and problem from home by themselves.</div>
      </div>
    `,
    angle: -150, // Points Up-Left
    offsetX: -491, // Accommodates 450px card width (-41 - 450)
    offsetY: -35
  },
  {
    title: 'All Features of the Website',
    lat: 48,
    lng: 32, // Moved closer to center (Right Hemisphere)
    color: '#10b981', // Green
    description: `
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 15px; line-height: 1.45;">
        <div>• <strong>Interactive Outbreak Heatmap</strong>: Seamless toggling between a WebGL 3D Globe and Leaflet 2D Dark tile layers.</div>
        <div>• <strong>Smart Outbreak Filters</strong>: Collapsible left control HUD to isolate and zoom focus on vector categories (Dengue, Malaria, Typhoid).</div>
        <div>• <strong>Analytics Telemetry HUD</strong>: Dynamic charts, transmission growth R-values, and diagnostic severity indicators.</div>
        <div>• <strong>Secure Patient Directory</strong>: Isolated medical registries supporting instant search indices.</div>
        <div>• <strong>Diagnostic Case Registry</strong>: Form capturing voice inputs, coordinates, and diagnostic severity.</div>
        <div>• <strong>Multi-Role Credentials HUD</strong>: Secure registry for staff rosters, administrator promotions, and access policies.</div>
        <div>• <strong>Pandemic Self-Reporting</strong>: Direct remote reporting system for citizens to report symptoms from home.</div>
      </div>
    `,
    angle: -30, // Points Up-Right
    offsetX: 41,
    offsetY: -35
  }
];

const Login = ({ setToken }) => {
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [telemetry, setTelemetry] = useState({ lat: null, lng: null });

  const containerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const isLoggingInRef = useRef(false);

  const startLoginSequence = (targetToken, targetRole) => {
    setIsLoggingIn(true);
    isLoggingInRef.current = true;
    setLoading(true);
    
    // Stop auto-rotation to lock coordinates
    if (globeInstanceRef.current) {
      globeInstanceRef.current.controls().autoRotate = false;
    }

    const triggerZoomAndFinalize = (lat, lng) => {
      setTelemetry({ lat, lng });
      const globe = globeInstanceRef.current;
      if (globe) {
        // Plot user locator marker dynamically
        const userMarker = {
          title: 'Secure Terminal Mapped',
          lat: lat,
          lng: lng,
          color: '#06b6d4', // Cyan
          isUser: true,
          description: `
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #a5f3fc; line-height: 1.4;">
              <div>Hospital security handshake established.</div>
              <div>• Lat: <strong>${lat}</strong></div>
              <div>• Lng: <strong>${lng}</strong></div>
            </div>
          `,
          angle: 45,
          offsetX: 41,
          offsetY: -35
        };
        globe.htmlElementsData([...featureHotspots, userMarker]);
        
        // Dynamic cinematic camera zoom into coordinates
        globe.pointOfView({ lat, lng, altitude: 0.18 }, 3200);
      }

      // Step-by-step progress logging tick
      let currentStep = 1;
      const interval = setInterval(() => {
        setLoadingStep(currentStep);
        currentStep++;
        if (currentStep > 4) {
          clearInterval(interval);
          setTimeout(() => {
            localStorage.setItem('userRole', targetRole);
            setToken(targetToken);
          }, 600);
        }
      }, 800);
    };

    // Geolocation retrieval
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(4));
          const lng = parseFloat(position.coords.longitude.toFixed(4));
          triggerZoomAndFinalize(lat, lng);
        },
        (err) => {
          // Default coordinate if geolocation blocked or denied (e.g. New Delhi)
          triggerZoomAndFinalize(28.6139, 77.2090);
        },
        { enableHighAccuracy: true, timeout: 4000 }
      );
    } else {
      triggerZoomAndFinalize(28.6139, 77.2090);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      startLoginSequence(data.token, data.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      setLoading(false);
    }
  };

  const handleUserLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { email: 'user@hdims.com', password: 'password123' });
      startLoginSequence(data.token, data.role);
    } catch (err) {
      setError('Staff login initialization failed.');
      setLoading(false);
    }
  };

  // Initialize and Configure the 3D Globe
  useEffect(() => {
    if (!containerRef.current) return;

    // Force clear DOM container and explicitly remove all old WebGL canvases to prevent HMR duplicate overlays
    const oldCanvases = containerRef.current.querySelectorAll('canvas');
    oldCanvases.forEach(canvas => canvas.remove());
    containerRef.current.innerHTML = '';

    // Create the ambient globe
    const globe = new Globe(containerRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight)
      .showAtmosphere(true)
      .atmosphereColor('#22c55e') // Emerald green atmosphere to match theme
      .atmosphereAltitude(0.18)
      .backgroundColor('#070b13');

    // Soft auto-rotation (rotate a little slower)
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.04; 

    // Zoomed in camera focused heavily on the top-to-middle region (Northern Hemisphere)
    globe.pointOfView({ lat: 46, lng: 15, altitude: 0.55 }, 1000);

    // Setup Custom HTML markers mapping the feature hotspots
    globe.htmlElementsData(featureHotspots)
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlElement(d => {
        const el = document.createElement('div');
        const color = d.color;

        el.className = 'marker-container';
        el.style.color = color;
        
        if (d.isUser) {
          el.innerHTML = `
            <div class="user-radar-ring" style="border-color: ${color};"></div>
            <div class="user-compass-ring" style="border-color: ${color};"></div>
            <div class="center-dot" style="background-color: ${color}; border-color: #ffffff; box-shadow: 0 0 10px ${color};"></div>
            
            <div class="marker-label">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span class="user-glowing-indicator" style="background-color: ${color}; box-shadow: 0 0 8px ${color};"></span>
                <span class="label-feature-title" style="color: ${color};">${d.title}</span>
              </div>
              <div class="label-expanded-details" style="max-height: 250px;">
                <div>${d.description}</div>
                <span style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; font-size: 8px; opacity: 0.75; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
                  <span>Terminal GPS Lock</span>
                  <span style="color: ${color}; font-weight: 700;">SECURED</span>
                </span>
              </div>
            </div>
          `;
        } else {
          el.innerHTML = `
            <div class="pulsing-ring" style="background-color: ${color}; box-shadow: 0 0 12px ${color}; animate-duration: 2.5s;"></div>
            <div class="center-dot" style="background-color: ${color};"></div>
            
            <!-- Thin elegant pointer line connecting coordinate dot to the textbox layout -->
            <div class="pointer-line" style="background-color: ${color}; transform: rotate(${d.angle}deg);"></div>
            
            <div class="marker-label">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: ${color}; box-shadow: 0 0 6px ${color};"></span>
                <span class="label-feature-title">${d.title}</span>
              </div>
              <div class="label-expanded-details">
                <div>${d.description}</div>
                <span style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; font-size: 8px; opacity: 0.75; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
                  <span>System Component</span>
                  <span style="color: ${color}; font-weight: 700;">ACTIVE</span>
                </span>
              </div>
            </div>
          `;
        }

        // Apply dynamically configured coordinate offsets in JS to position labels precisely
        const labelEl = el.querySelector('.marker-label');
        if (labelEl) {
          labelEl.style.left = `${d.offsetX}px`;
          labelEl.style.top = `${d.offsetY}px`;
        }

        // Interactive hover functions
        el.onmouseenter = () => {
          const ring = el.querySelector('.pulsing-ring');
          if (ring) ring.style.transform = 'scale(1.4)';
          globe.controls().autoRotate = false; // pause ambient spin to read
        };

        el.onmouseleave = () => {
          const ring = el.querySelector('.pulsing-ring');
          if (ring) ring.style.transform = 'scale(1)';
          if (globeInstanceRef.current && !isLoggingInRef.current) {
            globeInstanceRef.current.controls().autoRotate = true; // resume ambient spin
          }
        };

        // Zooming click selection
        el.onclick = (e) => {
          e.stopPropagation();

          // Reset other highlights
          if (containerRef.current) {
            containerRef.current.querySelectorAll('.marker-label').forEach(lbl => {
              lbl.classList.remove('active-selected');
            });
          }
          el.querySelector('.marker-label').classList.add('active-selected');

          globe.controls().autoRotate = false;
          globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 0.45 }, 800);
        };

        return el;
      });

    globeInstanceRef.current = globe;

    const handleResize = () => {
      if (globeInstanceRef.current && containerRef.current) {
        globeInstanceRef.current.width(containerRef.current.clientWidth);
        globeInstanceRef.current.height(containerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    const activeContainer = containerRef.current;

    return () => {
      window.removeEventListener('resize', handleResize);
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor && globeInstanceRef.current._destructor();
      }
      if (activeContainer) {
        activeContainer.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans flex items-end justify-center pb-8 overflow-hidden relative">
      
      {/* Dynamic styles injected for custom interactive HTML markers, pointer lines, and color shifts */}
      <style dangerouslySetInnerHTML={{ __html: `
        .globe-container canvas {
          /* Apply precise Red and Green color translation matrix on the dark earth map */
          filter: hue-rotate(105deg) saturate(2.4) contrast(1.1) brightness(0.75);
        }
        .marker-container {
          display: flex;
          align-items: center;
          position: relative;
          pointer-events: auto;
          cursor: pointer;
        }
        .pulsing-ring {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          position: absolute;
          left: -9px;
          top: -9px;
          animation: markerPulse 2.2s infinite ease-in-out;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .user-radar-ring {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1.5px dashed currentColor;
          position: absolute;
          left: -18px;
          top: -18px;
          animation: userRadarRotate 6s linear infinite;
          box-shadow: 0 0 8px currentColor;
        }
        .user-compass-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 1px solid currentColor;
          position: absolute;
          left: -28px;
          top: -28px;
          opacity: 0.35;
          animation: userRadarPulse 2.2s infinite ease-in-out;
        }
        .user-glowing-indicator {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          animation: markerPulse 1.2s infinite ease-in-out;
        }
        @keyframes userRadarRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes userRadarPulse {
          0% { transform: scale(0.85); opacity: 0.15; }
          50% { transform: scale(1.15); opacity: 0.6; }
          100% { transform: scale(0.85); opacity: 0.15; }
        }
        .center-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: absolute;
          left: -4px;
          top: -4px;
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.7);
        }
        
        /* Glowing diagonal line extending from coordinate to label (matching Location HUD mockup) */
        .pointer-line {
          position: absolute;
          width: 42px;
          height: 1.5px;
          left: 4px;
          top: 0;
          transform-origin: left center;
          opacity: 0.65;
          box-shadow: 0 0 6px currentColor;
        }
        
        .marker-label {
          position: absolute;
          width: 450px; /* Increased size to make the popups even bigger and extremely easy to read */
          font-family: inherit;
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          background: rgba(10, 15, 30, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 16px 20px;
          border-radius: 16px;
          border: 1.5px solid rgba(255, 255, 255, 0.35);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.75);
          white-space: normal;
          display: flex;
          flex-direction: column;
          opacity: 0.98;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .label-feature-title {
          color: #ffffff;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.02em;
        }
        
        .label-expanded-details {
          max-height: 580px; /* Expanded vertical limits to fit full text spacious and nicely with larger font */
          opacity: 1;
          overflow: hidden;
          margin-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.25);
          padding-top: 12px;
          font-size: 15px;
          color: #e2e8f0;
          font-weight: 400;
          width: 410px; /* Adjusted width to match the new parent width (450 - padding) */
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 9px;
          line-height: 1.45;
        }
        
        .marker-container:hover .marker-label,
        .marker-label.active-selected {
          transform: scale(1.03);
          border-color: rgba(255, 255, 255, 0.45);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.7);
          background: rgba(10, 15, 30, 0.98);
          z-index: 50;
          opacity: 1;
        }
        @keyframes markerPulse {
          0% {
            transform: scale(0.7);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.65);
            opacity: 0.2;
          }
          100% {
            transform: scale(0.7);
            opacity: 0.85;
          }
        }
      `}} />

      {/* Background Globe Wrapper Layer (covers 100% of viewport) */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto globe-container">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Big Green HUD Title in between the popups - hidden during cinematic zoom loading */}
      {!isLoggingIn && (
        <div className="absolute top-8 md:top-12 left-1/2 -translate-x-1/2 z-10 text-center select-none pointer-events-none">
          <h1 className="text-6xl md:text-8xl font-black tracking-[0.28em] text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.72)] uppercase font-sans pl-[0.28em]">
            HDIMS
          </h1>
          <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto mt-2.5 shadow-[0_0_9px_#10b981]" />
        </div>
      )}

      {/* Centered Horizontal (Wide Layout) Glassmorphic Login Option Card - placed at the bottom, hidden during login sequence */}
      {!isLoggingIn && (
        <div className="w-full max-w-[340px] md:max-w-[650px] bg-slate-950/75 backdrop-blur-2xl border border-slate-800/80 rounded-2xl shadow-2xl relative z-10 mx-4 overflow-y-auto max-h-[85vh] p-4 md:p-5">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            
            {/* Left Column: Brand Column (Spans 4 columns) */}
            <div className="md:col-span-4 flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-slate-800/80 pb-3 md:pb-0 md:pr-5">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-red-500/20 text-emerald-400 mb-2.5 ring-1 ring-white/10 shadow-inner">
                <Activity size={24} className="drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">HDIMS Portal</h2>
              <p className="text-slate-400 text-[10px] leading-snug">Health Data Information & Management</p>
              
              {/* Desktop only system tag info */}
              <div className="hidden md:block text-[9px] text-slate-600 mt-5 pt-3 border-t border-slate-900 w-full">
                <span>HDIMS Portal • v2.4.0</span>
                <div className="text-emerald-500/60 font-semibold mt-0.5">Red-Green HUD Core</div>
              </div>
            </div>

            {/* Right Column: Interaction Column (Spans 8 columns) */}
            <div className="md:col-span-8 flex flex-col justify-center pl-0 md:pl-2">
              
              {error && (
                <div className="mb-3.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-in fade-in duration-300">
                  {error}
                </div>
              )}

              <div className="flex p-1 bg-slate-900/60 rounded-xl mb-3.5 border border-slate-800/80">
                <button
                  type="button"
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all ${
                    loginType === 'user' 
                      ? 'bg-slate-800 text-white shadow-md border border-slate-700/50' 
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/40'
                  }`}
                  onClick={() => setLoginType('user')}
                >
                  <User size={14} />
                  Staff / User
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all ${
                    loginType === 'admin' 
                      ? 'bg-slate-800 text-white shadow-md border border-slate-700/50' 
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/40'
                  }`}
                  onClick={() => setLoginType('admin')}
                >
                  <Shield size={14} />
                  Administrator
                </button>
              </div>

              {loginType === 'user' ? (
                <div className="space-y-3.5 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-center backdrop-blur-md">
                    <p className="text-slate-400 text-xs leading-relaxed mb-0">
                      Proceed as a staff member to view patient data, live outbreak coordinates, heatmaps, and spatial metrics. No password required.
                    </p>
                  </div>
                  <button 
                    onClick={handleUserLogin}
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold py-2 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-xs"
                  >
                    {loading ? 'Entering...' : 'Continue as User'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5 animate-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Horizontal form inputs mapping side-by-side on desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-300 ml-1">Admin Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input 
                          type="email" 
                          required
                          className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium text-xs"
                          placeholder="admin@hdims.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-300 ml-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input 
                          type="password" 
                          required
                          className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium text-xs"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] flex justify-center mt-3 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    {loading ? 'Authenticating...' : 'Secure Admin Login'}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Mobile copyright tag */}
          <div className="block md:hidden text-center text-[9px] text-slate-600 border-t border-slate-900 pt-2.5 mt-3">
            <span>HDIMS Portal • v2.4.0 • Red-Green HUD Core</span>
          </div>

        </div>
      )}

      {/* Floating guidance HUD overlay - hidden during transition */}
      {!isLoggingIn && (
        <div className="hidden md:flex absolute bottom-6 right-6 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800/80 items-center gap-2 text-xs text-slate-400 select-none pointer-events-none z-10 shadow-lg animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          <span>Interactive HUD: Drag to rotate globe</span>
        </div>
      )}

      {/* Immersive Loading Screen Overlay */}
      {isLoggingIn && (
        <div className="absolute inset-0 bg-slate-950/15 flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
          
          {/* Scientific Scan Line HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.5))] z-0" />
          
          <div className="w-[90%] max-w-[500px] bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative z-10 text-center flex flex-col items-center">
            
            {/* Pulsing Radar Core icon */}
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping animate-duration-1000" />
              <div className="absolute inset-2 rounded-full border-2 border-emerald-400/40 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400">
                <Activity size={24} className="animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold tracking-widest text-emerald-400 mb-1 uppercase font-sans">
              System Initialization
            </h2>
            <div className="text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-[0.2em] mb-6">
              HDIMS Secure Gateway • Protocol Alpha
            </div>
            
            {/* Custom Telemetry Logs / Step Status Info */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left font-mono text-xs text-slate-400 space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-600">&gt; Auth Status:</span>
                <span className="text-emerald-400 font-bold">VERIFIED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">&gt; Geolocation Sync:</span>
                <span className={loadingStep >= 1 ? "text-emerald-400" : "text-amber-400 animate-pulse"}>
                  {loadingStep >= 1 ? "ESTABLISHED" : "FETCHING CONTEXT..."}
                </span>
              </div>
              {telemetry.lat && (
                <div className="flex justify-between border-t border-slate-900 pt-1 text-[10px] text-slate-500">
                  <span>&gt; Lat: <strong className="text-emerald-500/80">{telemetry.lat}</strong></span>
                  <span>&gt; Lng: <strong className="text-emerald-500/80">{telemetry.lng}</strong></span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">&gt; WebGL Spread Telemetry:</span>
                <span className={loadingStep >= 2 ? "text-emerald-400" : loadingStep >= 1 ? "text-amber-400 animate-pulse" : "text-slate-700"}>
                  {loadingStep >= 2 ? "SYNCHRONIZED" : loadingStep >= 1 ? "ACQUIRING..." : "PENDING"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">&gt; Outbreak Server Core:</span>
                <span className={loadingStep >= 3 ? "text-emerald-400" : loadingStep >= 2 ? "text-amber-400 animate-pulse" : "text-slate-700"}>
                  {loadingStep >= 3 ? "CONNECTED" : loadingStep >= 2 ? "INITIALIZING..." : "PENDING"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">&gt; Diagnostics Interface:</span>
                <span className={loadingStep >= 4 ? "text-emerald-400" : loadingStep >= 3 ? "text-amber-400 animate-pulse" : "text-slate-700"}>
                  {loadingStep >= 4 ? "MOUNTED" : loadingStep >= 3 ? "LOADING..." : "PENDING"}
                </span>
              </div>
            </div>
            
            {/* Glowing progress bar */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3.5 p-[2px] overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-emerald-600 to-cyan-500 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                style={{ width: `${Math.min((loadingStep / 4) * 100, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">
              {Math.min(Math.round((loadingStep / 4) * 100), 100)}% COMPLETE
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
