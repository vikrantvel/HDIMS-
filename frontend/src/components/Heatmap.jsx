import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Globe from 'globe.gl';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Heatmap = ({ token }) => {
  const containerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const [heatData, setHeatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isRotating, setIsRotating] = useState(true);
  const [selectedDisease, setSelectedDisease] = useState('All');
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'
  const [themeMode, setThemeMode] = useState('Dark'); // 'Dark' or 'Light'
  const [isHudOpen, setIsHudOpen] = useState(true);

  // Fetch Patient Location Data
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await axios.get('/api/patients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const validData = data.filter(p => p.location && p.location.coordinates);
        setHeatData(validData);
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [token]);

  const getColorBySeverity = (severity) => {
    switch(severity) {
      case 'Critical': return '#ef4444'; // Red
      case 'Severe': return '#f97316';   // Orange
      case 'Moderate': return '#f59e0b'; // Amber
      case 'Mild': return '#eab308';     // Yellow
      default: return '#3b82f6';         // Blue
    }
  };

  // Derive unique diseases and their case counts
  const diseaseStats = {};
  heatData.forEach(p => {
    if (p.disease) {
      diseaseStats[p.disease] = (diseaseStats[p.disease] || 0) + 1;
    }
  });
  const uniqueDiseases = Object.keys(diseaseStats).sort();

  // Derive filtered active vectors
  const filteredData = selectedDisease === 'All'
    ? heatData
    : heatData.filter(d => d.disease === selectedDisease);

  // Initialize and Update Globe (Only triggers in 3D Mode)
  useEffect(() => {
    if (!containerRef.current || loading || viewMode !== '3D') return;

    // Clear previous elements inside the container
    containerRef.current.innerHTML = '';

    const isDark = themeMode === 'Dark';

    // Choose textures and background based on theme mode
    const globeTexture = isDark
      ? '//unpkg.com/three-globe/example/img/earth-night.jpg'
      : '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

    // Initialize the Globe
    const globe = new Globe(containerRef.current)
      .globeImageUrl(globeTexture)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight)
      .showAtmosphere(true)
      .atmosphereColor(isDark ? '#3b82f6' : '#93c5fd')
      .atmosphereAltitude(0.18)
      .backgroundColor(isDark ? '#090f1d' : '#f8fafc');

    if (isDark) {
      globe.backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png');
    } else {
      globe.backgroundImageUrl(null);
    }

    // Configure Auto-rotation
    globe.controls().autoRotate = isRotating;
    globe.controls().autoRotateSpeed = 0.15;

    // Center on India / South Asia initially where coordinates are seeded
    globe.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 2.1 }, 1000);

    // Setup Custom HTML markers (pulsing 3D disease hotspots) using filteredData
    globe.htmlElementsData(filteredData)
      .htmlLat(d => d.location.coordinates[1])
      .htmlLng(d => d.location.coordinates[0])
      .htmlElement(d => {
        const el = document.createElement('div');
        const color = getColorBySeverity(d.severity);
        
        el.className = 'marker-container';
        el.innerHTML = `
          <div class="pulsing-ring" style="background-color: ${color}; box-shadow: 0 0 12px ${color};"></div>
          <div class="center-dot" style="background-color: ${color};"></div>
          <div class="marker-label">
            <span class="label-disease">${d.disease}</span>
            <span class="label-loc-compact">${d.locationName}</span>
            <span class="label-expanded-details">
              <span>Severity: <strong style="color: ${color}">${d.severity}</strong></span>
            </span>
          </div>
        `;

        // Tooltip hover interactions
        el.onmouseenter = () => {
          el.querySelector('.marker-label').classList.add('active');
          el.querySelector('.pulsing-ring').style.transform = 'scale(1.5)';
        };

        el.onmouseleave = () => {
          el.querySelector('.marker-label').classList.remove('active');
          el.querySelector('.pulsing-ring').style.transform = 'scale(1)';
        };

        // Selection interaction
        el.onclick = (e) => {
          e.stopPropagation();
          setSelectedPatient(d);
          setIsHudOpen(true); // Automatically expand left HUD to display detailed telemetry
          
          // Clear active-selected from all other labels
          if (containerRef.current) {
            containerRef.current.querySelectorAll('.marker-label').forEach(lbl => {
              lbl.classList.remove('active-selected');
            });
          }
          // Persist-highlight this specific label
          el.querySelector('.marker-label').classList.add('active-selected');

          // Stop auto-rotation to let user inspect
          setIsRotating(false);
          globe.controls().autoRotate = false;

          // Smoothly pan & zoom to the coordinates
          globe.pointOfView({ lat: d.location.coordinates[1], lng: d.location.coordinates[0], altitude: 1.15 }, 800);
        };

        return el;
      });

    globeInstanceRef.current = globe;

    // Handle container resizing
    const handleResize = () => {
      if (globeInstanceRef.current && containerRef.current) {
        globeInstanceRef.current.width(containerRef.current.clientWidth);
        globeInstanceRef.current.height(containerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (globeInstanceRef.current) {
        // Remove three.js hooks if destructor is present
        globeInstanceRef.current._destructor && globeInstanceRef.current._destructor();
      }
    };
  }, [filteredData, loading, themeMode, viewMode]);

  // Handle manual auto-rotate toggling
  const handleToggleRotation = () => {
    const nextRotation = !isRotating;
    setIsRotating(nextRotation);
    if (globeInstanceRef.current) {
      globeInstanceRef.current.controls().autoRotate = nextRotation;
    }
  };

  // Reset view to overview and clear persistent tooltip markers
  const handleResetView = () => {
    setSelectedPatient(null);
    setSelectedDisease('All');
    if (containerRef.current) {
      containerRef.current.querySelectorAll('.marker-label').forEach(lbl => {
        lbl.classList.remove('active-selected');
      });
    }
    if (viewMode === '3D' && globeInstanceRef.current) {
      globeInstanceRef.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 2.1 }, 1000);
    }
  };

  // Clear selected patient state and dismiss persistent on-globe tooltips
  const handleClearSelectedPatient = () => {
    setSelectedPatient(null);
    if (containerRef.current) {
      containerRef.current.querySelectorAll('.marker-label').forEach(lbl => {
        lbl.classList.remove('active-selected');
      });
    }
  };

  // Handle filtering updates with interactive globe panning
  const handleDiseaseSelect = (disease) => {
    setSelectedDisease(disease);
    setSelectedPatient(null); // Clear selected individual
    
    // Clear persistent label highlights
    if (containerRef.current) {
      containerRef.current.querySelectorAll('.marker-label').forEach(lbl => {
        lbl.classList.remove('active-selected');
      });
    }

    const matches = disease === 'All' 
      ? heatData 
      : heatData.filter(d => d.disease === disease);

    if (viewMode === '3D' && matches.length > 0 && globeInstanceRef.current) {
      const firstMatch = matches[0];
      // Stop rotation & lock onto the target coordinates
      setIsRotating(false);
      globeInstanceRef.current.controls().autoRotate = false;
      globeInstanceRef.current.pointOfView({ 
        lat: firstMatch.location.coordinates[1], 
        lng: firstMatch.location.coordinates[0], 
        altitude: 1.25 
      }, 1000);
    } else if (viewMode === '3D' && disease === 'All' && globeInstanceRef.current) {
      // Return to global home view
      globeInstanceRef.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 2.1 }, 1000);
    }
  };

  return (
    <div className="h-full space-y-6 animate-in fade-in duration-500 font-sans">
      {/* CSS injection for self-contained rich styling */}
      <style dangerouslySetInnerHTML={{ __html: `
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
        .marker-label {
          margin-left: 14px;
          font-family: inherit;
          font-size: 10px;
          font-weight: 700;
          color: #ffffff;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 3px 6px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          position: absolute;
          
          /* Visible but very compact by default to avoid overlap clutter */
          opacity: 0.82;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .label-disease {
          color: #ffffff;
          font-weight: 700;
          font-size: 10.5px;
        }
        .label-loc-compact {
          color: #94a3b8;
          font-size: 8.5px;
          font-weight: 500;
        }
        
        /* Sub-details are fully collapsed by default */
        .label-expanded-details {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          margin-top: 0;
          border-top: 1px solid rgba(255, 255, 255, 0);
          padding-top: 0;
          font-size: 9px;
          color: #cbd5e1;
          font-weight: 500;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0.5px;
          transition: max-height 0.25s ease, opacity 0.25s ease, margin-top 0.25s, border-top 0.25s, padding-top 0.25s;
        }
        
        /* Smoothly expand and reveal detailed drawer on hover OR persistent selection click */
        .marker-container:hover .marker-label,
        .marker-label.active,
        .marker-label.active-selected {
          opacity: 1;
          padding: 6px 10px;
          border-radius: 8px;
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          z-index: 50;
        }
        
        .marker-container:hover .label-expanded-details,
        .marker-label.active .label-expanded-details,
        .marker-label.active-selected .label-expanded-details {
          max-height: 50px;
          opacity: 1;
          margin-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 4px;
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
        
        /* Unified Left Panel Custom Scrollbar */
        .disease-scroll-container::-webkit-scrollbar {
          width: 4px;
        }
        .disease-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .disease-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .disease-scroll-container.light-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
        }
        .disease-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.35);
        }
        .disease-scroll-container.light-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        /* Leaflet custom overrides */
        .leaflet-container {
          font-family: inherit;
        }
        
        /* Leaflet Popup Premium Theme Overrides */
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: ${themeMode === 'Dark' ? 'rgba(15, 23, 42, 0.95) !important' : 'rgba(255, 255, 255, 0.95) !important'};
          color: ${themeMode === 'Dark' ? '#ffffff !important' : '#0f172a !important'};
          border: 1px solid ${themeMode === 'Dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
          border-radius: 14px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: ${themeMode === 'Dark' ? 'rgba(15, 23, 42, 0.95) !important' : 'rgba(255, 255, 255, 0.95) !important'};
          border: 1px solid ${themeMode === 'Dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
        }
        .custom-leaflet-popup .leaflet-popup-close-button {
          color: ${themeMode === 'Dark' ? '#94a3b8 !important' : '#475569 !important'};
          padding: 8px 10px 0 0 !important;
        }
        .custom-leaflet-popup .leaflet-popup-close-button:hover {
          color: ${themeMode === 'Dark' ? '#ffffff !important' : '#000000 !important'};
          background: transparent !important;
        }
      `}} />

      {/* Dynamic Glassmorphic Header Panel with staggered entrance slide */}
      <div className={`flex justify-between items-start p-6 rounded-2xl shadow-lg border transition-all duration-300 animate-in slide-in-from-top-4 duration-500 ${
        themeMode === 'Dark'
          ? 'bg-slate-950/70 border-slate-800/80 text-white backdrop-blur-xl shadow-slate-950/40'
          : 'bg-white/80 border-slate-200/80 text-slate-800 backdrop-blur-xl shadow-slate-200/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl transition-colors duration-300 ${
            themeMode === 'Dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}>
            <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5A2.5 2.5 0 0019 9.5V8a2 2 0 00-2-2h-1a2 2 0 01-2-2v-.935M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-2xl font-black uppercase tracking-wider ${
              themeMode === 'Dark' ? 'text-white' : 'text-slate-800'
            }`}>3D Global Spread Globe</h2>
            <p className={`text-sm mt-0.5 font-semibold ${
              themeMode === 'Dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>Tactical real-time global monitoring of disease hotspots</p>
          </div>
        </div>
        <div className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-2 border px-4 py-2 rounded-full transition-all duration-300 ${
          themeMode === 'Dark' 
            ? 'bg-slate-900/60 border-slate-800 text-slate-400' 
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          <span>SYSTEM ONLINE • WebGL 3D Active</span>
        </div>
      </div>

      {/* Main Globe Display Container with glowing premium border and shadow reveals */}
      <div className={`w-full h-[650px] rounded-3xl overflow-hidden shadow-2xl relative border transition-all duration-500 ${
        themeMode === 'Dark' 
          ? 'border-slate-800/80 shadow-slate-950/80 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]' 
          : 'border-slate-200/80 shadow-slate-300/40 hover:shadow-[0_0_40px_rgba(59,130,246,0.06)]'
      }`}>
        {loading ? (
          <div className="flex items-center justify-center h-full bg-slate-900">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm font-semibold tracking-wide">Synthesizing 3D Tactical Model...</p>
            </div>
          </div>
        ) : (
          <>
            {/* The Globe Canvas Mount Point (Only renders in 3D Mode) */}
            {viewMode === '3D' && (
              <div ref={containerRef} className={`w-full h-full transition-all ${
                themeMode === 'Dark' ? 'bg-slate-950' : 'bg-slate-50'
              }`} />
            )}

            {/* The flat tactical Leaflet map projection (Only renders in 2D Mode) */}
            {viewMode === '2D' && (
              <div className="w-full h-full relative z-0">
                <MapContainer 
                  center={[22.5937, 78.9629]}
                  zoom={4} 
                  className="w-full h-full"
                  style={{ background: themeMode === 'Dark' ? '#0a0f1d' : '#e6edf4' }}
                  zoomControl={false} // Disable standard controls to keep HUD premium
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url={
                      themeMode === 'Dark'
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }
                  />
                  {filteredData.map((patient) => {
                    const color = getColorBySeverity(patient.severity);
                    const isSelected = selectedPatient && selectedPatient._id === patient._id;
                    
                    return (
                      <Circle 
                        key={patient._id}
                        center={[patient.location.coordinates[1], patient.location.coordinates[0]]}
                        pathOptions={{
                          color: isSelected ? (themeMode === 'Dark' ? '#ffffff' : '#0f172a') : color,
                          weight: isSelected ? 3.5 : 1.8,
                          fillColor: color,
                          fillOpacity: patient.status === 'Active' ? 0.75 : 0.22
                        }}
                        radius={
                          patient.severity === 'Critical' ? 320000 : 
                          patient.severity === 'Severe' ? 240000 : 
                          patient.severity === 'Moderate' ? 160000 : 90000
                        }
                        eventHandlers={{
                          click: () => {
                            setSelectedPatient(patient);
                            setIsHudOpen(true); // Automatically expand HUD on click
                          }
                        }}
                      >
                        <Popup className="custom-leaflet-popup">
                          <div className={`p-1.5 min-w-[190px] font-sans ${themeMode === 'Dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                            <h3 className="font-extrabold text-sm border-b pb-1 mb-1.5 flex justify-between items-center leading-none">
                              <span>{patient.disease}</span>
                              <span 
                                style={{ color }} 
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                  themeMode === 'Dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                                }`}
                              >
                                {patient.severity}
                              </span>
                            </h3>
                            <div className="space-y-1 text-[11px]">
                              <p><strong>Vector State:</strong> <span className={`font-bold ${patient.status === 'Active' ? 'text-rose-500' : 'text-emerald-500'}`}>{patient.status}</span></p>
                              <p><strong>Transmission Zone:</strong> {patient.locationName}</p>
                            </div>
                          </div>
                        </Popup>
                      </Circle>
                    );
                  })}
                </MapContainer>
              </div>
            )}

            {/* Collapsed HUD Trigger (Floats in top-left when closed) */}
            {!isHudOpen && (
              <button 
                onClick={() => setIsHudOpen(true)}
                className={`absolute top-6 left-6 z-10 p-3 rounded-2xl border font-bold text-xs flex items-center justify-center transition-all shadow-xl backdrop-blur-md animate-in fade-in zoom-in duration-300 ${
                  themeMode === 'Dark'
                    ? 'bg-slate-950/95 border-slate-800 text-blue-400 hover:text-blue-300 hover:bg-slate-900 shadow-slate-950/80'
                    : 'bg-white/95 border-slate-200 text-blue-600 hover:text-blue-500 hover:bg-slate-50 shadow-slate-300/60'
                }`}
                title="Expand Filtering Panel"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Premium Control Overlay (Top-Right) */}
            <div className="absolute top-6 right-6 z-10 flex gap-2">
              {viewMode === '3D' && (
                <>
                  {/* Rotation toggle */}
                  <button 
                    onClick={handleToggleRotation}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md ${
                      themeMode === 'Dark'
                        ? isRotating 
                          ? 'bg-blue-500/20 text-blue-300 border-blue-400/40 hover:bg-blue-500/30' 
                          : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                        : isRotating
                          ? 'bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    title={isRotating ? "Pause Rotation" : "Auto Rotate"}
                  >
                    {isRotating ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Auto Rotate
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Rotated Paused
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Theme Toggle Button */}
              <button 
                onClick={() => setThemeMode(prev => prev === 'Dark' ? 'Light' : 'Dark')}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md ${
                  themeMode === 'Dark' 
                    ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800' 
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
                title="Toggle Theme"
              >
                {themeMode === 'Dark' ? (
                  <>
                    <svg className="w-4.5 h-4.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    Dark Theme
                  </>
                ) : (
                  <>
                    <svg className="w-4.5 h-4.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0A9 9 0 115.636 5.636L12 12z" /></svg>
                    Light Theme
                  </>
                )}
              </button>

              {/* View Projection Toggle */}
              <button 
                onClick={() => setViewMode(prev => prev === '3D' ? '2D' : '3D')}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-500/20`}
                title="Toggle Projection Mode"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Projection: {viewMode}
              </button>

              <button 
                onClick={handleResetView}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md ${
                  themeMode === 'Dark'
                    ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
                title="Reset Camera View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.75" /></svg>
                Reset View
              </button>
            </div>

            {/* Unified Glassmorphic HUD Panel (Left Side - Rendered conditionally with slide animation) */}
            {isHudOpen && (
              <div className={`absolute top-6 left-6 bottom-6 z-10 border shadow-2xl rounded-3xl p-5 w-80 font-sans animate-in slide-in-from-left duration-300 flex flex-col gap-4 overflow-hidden h-[602px] transition-all backdrop-blur-xl ${
                themeMode === 'Dark'
                  ? 'bg-slate-950/80 border-slate-800/80 text-white shadow-slate-950/70'
                  : 'bg-white/80 border-slate-200/80 text-slate-800 shadow-slate-200/80'
              }`}>
                
                {/* Top Section: Title & Collapse Button */}
                <div className="flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2 text-blue-500 font-semibold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="text-xs uppercase tracking-wider font-extrabold">Disease Filter Panel</span>
                  </div>
                  <button 
                    onClick={() => setIsHudOpen(false)}
                    className={`p-1.5 rounded-lg transition-colors border ${
                      themeMode === 'Dark'
                        ? 'text-slate-400 hover:text-white hover:bg-slate-900 border-slate-800/60'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                    }`}
                    title="Collapse Panel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                {/* Middle Section: Scrollable List of Diseases */}
                <div className={`flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 disease-scroll-container ${
                  themeMode === 'Light' ? 'light-scroll' : ''
                }`}>
                  {/* 'All Diseases' Filter Chip */}
                  <button
                    onClick={() => handleDiseaseSelect('All')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-between items-center border ${
                      selectedDisease === 'All'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/35'
                        : themeMode === 'Dark'
                          ? 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/60 text-slate-300'
                          : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/80 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedDisease === 'All' ? 'bg-white' : 'bg-blue-400'}`}></span>
                      Show All Outbreaks
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                      selectedDisease === 'All'
                        ? 'bg-white text-blue-600 border-white'
                        : themeMode === 'Dark'
                          ? 'bg-slate-900/80 border-slate-800 text-slate-400'
                          : 'bg-white border-slate-200 text-slate-500'
                    }`}>
                      {heatData.length}
                    </span>
                  </button>

                  {/* Specific Disease Chips */}
                  {uniqueDiseases.map(dis => (
                    <button
                      key={dis}
                      onClick={() => handleDiseaseSelect(dis)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-between items-center border ${
                        selectedDisease === dis
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/35'
                          : themeMode === 'Dark'
                            ? 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/60 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/80 text-slate-600'
                      }`}
                    >
                      <span className="truncate flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selectedDisease === dis ? 'bg-white' : 'bg-rose-500'
                        }`}></span>
                        {dis}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        selectedDisease === dis
                          ? 'bg-white text-blue-600 border-white'
                          : themeMode === 'Dark'
                            ? 'bg-slate-900/80 border-slate-800 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-500'
                      }`}>
                        {diseaseStats[dis]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Bottom Section: Active Telemetry Info Card */}
                <div className={`mt-auto border-t pt-4 flex flex-col gap-3 shrink-0 ${
                  themeMode === 'Dark' ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  {!selectedPatient ? (
                    <div className="py-1">
                      <div className="flex items-center gap-2 font-semibold mb-1">
                        <svg className="w-4.5 h-4.5 animate-pulse text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                        <span className={`text-[10px] uppercase tracking-wider font-extrabold ${
                          themeMode === 'Dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>HUD Telemetry</span>
                      </div>
                      <p className={`text-[10.5px] leading-relaxed ${
                        themeMode === 'Dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Select a disease vector on the map to query full geocoordinates, severity parameters, and classification data.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-wider">Vector Focus Lock</span>
                          <h3 className={`text-base font-extrabold tracking-tight leading-tight ${
                            themeMode === 'Dark' ? 'text-slate-100' : 'text-slate-800'
                          }`}>{selectedPatient.disease}</h3>
                        </div>
                        <button 
                          onClick={handleClearSelectedPatient}
                          className={`p-0.5 rounded-lg transition-colors border ${
                            themeMode === 'Dark' 
                              ? 'text-slate-400 hover:text-white hover:bg-slate-900 border-slate-800/60' 
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                          }`}
                          title="Clear Focus"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div className={`p-2 rounded-xl border ${
                          themeMode === 'Dark' ? 'bg-slate-900/40 border-slate-800/40' : 'bg-slate-50 border-slate-200/60'
                        }`}>
                          <span className="text-slate-500 font-bold block mb-0.5 text-[8.5px] uppercase tracking-wider">ID</span>
                          <span className={`font-mono font-semibold ${themeMode === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedPatient.patientId}</span>
                        </div>

                        <div className={`p-2 rounded-xl border ${
                          themeMode === 'Dark' ? 'bg-slate-900/40 border-slate-800/40' : 'bg-slate-50 border-slate-200/60'
                        }`}>
                          <span className="text-slate-500 font-bold block mb-0.5 text-[8.5px] uppercase tracking-wider">Severity</span>
                          <span 
                            style={{ color: getColorBySeverity(selectedPatient.severity) }} 
                            className="font-extrabold uppercase text-[10px]"
                          >
                            {selectedPatient.severity}
                          </span>
                        </div>

                        <div className={`p-2 rounded-xl border ${
                          themeMode === 'Dark' ? 'bg-slate-900/40 border-slate-800/40' : 'bg-slate-50 border-slate-200/60'
                        }`}>
                          <span className="text-slate-500 font-bold block mb-0.5 text-[8.5px] uppercase tracking-wider">Zone</span>
                          <span className={`font-semibold truncate block ${themeMode === 'Dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedPatient.locationName}</span>
                        </div>

                        <div className={`p-2 rounded-xl border ${
                          themeMode === 'Dark' ? 'bg-slate-900/40 border-slate-800/40' : 'bg-slate-50 border-slate-200/60'
                        }`}>
                          <span className="text-slate-500 font-bold block mb-0.5 text-[8.5px] uppercase tracking-wider">State</span>
                          <span className={`font-extrabold ${
                            selectedPatient.status === 'Active' ? 'text-rose-400' : 'text-emerald-500'
                          }`}>
                            {selectedPatient.status}
                          </span>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl border text-[10px] space-y-1 ${
                        themeMode === 'Dark' ? 'bg-slate-900/40 border-slate-800/40' : 'bg-slate-50 border-slate-200/60'
                      }`}>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Coords:</span>
                          <span className={`font-mono text-[9px] ${themeMode === 'Dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                            {selectedPatient.location.coordinates[1].toFixed(3)}°N, {selectedPatient.location.coordinates[0].toFixed(3)}°E
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Heatmap;
