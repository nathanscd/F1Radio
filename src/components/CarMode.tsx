import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Play, Pause, SkipForward, SkipBack, X, Navigation, 
  Search, MapPin, Zap, Music, ChevronRight, 
  Battery, Signal, LocateFixed, Target, Activity, 
  ArrowDownUp, ShieldCheck, Wifi, Clock, TrendingUp,
  Cpu, AlertTriangle, Radio
} from 'lucide-react';

// Custom Markers with enhanced Cyberpunk look
const carIcon = L.divIcon({
  className: 'cyber-car',
  html: `
    <div class="relative">
      <div class="absolute inset-0 bg-[#00F3FF] blur-md opacity-50 animate-pulse"></div>
      <div class="car-marker relative z-10">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2Z" fill="#00F3FF" stroke="#000" stroke-width="1"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const destIcon = L.divIcon({
  className: 'cyber-dest',
  html: `
    <div class="relative">
      <div class="absolute inset-0 bg-[#FF003C] blur-md opacity-50 animate-pulse"></div>
      <div class="dest-marker relative z-10">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#FF003C" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="#FF003C" class="animate-ping"/>
          <path d="M12 8V16M8 12H16" stroke="#FF003C" stroke-width="2"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface Location {
  name: string;
  coords: [number, number] | null;
}

interface RouteInfo {
  distance: number;
  duration: number;
}

export default function CyberCarMode({ 
  currentTrack, 
  isPlaying, 
  onTogglePlay, 
  onNext, 
  onPrev, 
  onExit, 
  onSearch, 
  playlist, 
  onSelectTrack 
}: any) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [origin, setOrigin] = useState<Location>({ name: 'SCANNING_POSITION...', coords: null });
  const [destination, setDestination] = useState<Location>({ name: 'TARGET_UNSET', coords: null });
  const [isMenu, setIsMenu] = useState<'origin' | 'dest' | 'music' | null>(null);
  
  const [routePolyline, setRoutePolyline] = useState<L.Polyline | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [speed, setSpeed] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [systemStatus, setSystemStatus] = useState('SYSTEM_OK');

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-3.7319, -38.5267],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true
    });

    // Dark Mode Tiles with more contrast
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Rastreamento GPS
  useEffect(() => {
    let watchId: number;

    const successCallback = (position: GeolocationPosition) => {
      const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
      setLocationError(false);
      
      if (origin.name === 'SCANNING_POSITION...') {
        reverseGeocode(coords).then(name => {
          setOrigin({ name, coords });
        });
      }
      
      if (position.coords.speed !== null && position.coords.speed > 0) {
        setSpeed(Math.max(0, Math.round(position.coords.speed * 3.6)));
      } else {
        // Simulated drift speed for cyberpunk feel when static
        setSpeed(0);
      }
      
      if (mapRef.current) {
        if (carMarkerRef.current) {
          carMarkerRef.current.setLatLng(coords);
        } else {
          carMarkerRef.current = L.marker(coords, { icon: carIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
          mapRef.current.setView(coords, 16);
        }
        
        if (!destination.coords) {
          mapRef.current.panTo(coords, { animate: true, duration: 1 });
        }
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error('GPS Error:', error);
      setLocationError(true);
      setSystemStatus('GPS_FAILURE');
      setOrigin({ name: 'POSITION_LOST', coords: null });
      
      if (mapRef.current && !destination.coords) {
        mapRef.current.setView([-3.7319, -38.5267], 13);
      }
    };

    watchId = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [origin.name, destination.coords]);

  const reverseGeocode = async (coords: [number, number]): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=18`
      );
      const data = await res.json();
      return data.display_name.split(',')[0] || 'NEURAL_NODE_01';
    } catch {
      return 'UNKNOWN_SECTOR';
    }
  };

  const handleGeoSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8`;
        const res = await fetch(url);
        const data = await res.json();
        setSearchResults(data);
        setIsSearching(false);
      } catch (e) {
        setSystemStatus('SEARCH_ERROR');
        setIsSearching(false);
      }
    }, 500);
  }, []);

  const drawRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    if (!mapRef.current) return;

    try {
      setSystemStatus('CALCULATING_ROUTE...');
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      
      if (!data.routes || data.routes.length === 0) {
        setSystemStatus('ROUTE_NOT_FOUND');
        return;
      }

      if (routePolyline) mapRef.current.removeLayer(routePolyline);

      const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
      
      // Shadow polyline for glow effect
      const polyGlow = L.polyline(coords, {
        color: '#00F3FF',
        weight: 12,
        opacity: 0.3,
        smoothFactor: 1
      }).addTo(mapRef.current);

      const poly = L.polyline(coords, {
        color: '#00F3FF',
        weight: 6,
        opacity: 1,
        className: 'cyber-route-line',
        smoothFactor: 1
      }).addTo(mapRef.current);

      // Group them to remove easily
      const routeGroup = L.layerGroup([polyGlow, poly]).addTo(mapRef.current);
      setRoutePolyline(routeGroup as any);

      if (destMarkerRef.current) mapRef.current.removeLayer(destMarkerRef.current);
      destMarkerRef.current = L.marker(end, { icon: destIcon }).addTo(mapRef.current);

      mapRef.current.fitBounds(poly.getBounds(), { 
        padding: [80, 80],
        animate: true,
        duration: 1.5
      });

      setRouteInfo({
        distance: data.routes[0].distance / 1000,
        duration: data.routes[0].duration / 60
      });
      setSystemStatus('NAVIGATION_ACTIVE');

    } catch (e) {
      setSystemStatus('ROUTE_ERROR');
    }
  }, [routePolyline]);

  useEffect(() => {
    if (origin.coords && destination.coords) {
      drawRoute(origin.coords, destination.coords);
    }
  }, [origin.coords, destination.coords]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020202] text-[#00F3FF] font-mono overflow-hidden flex flex-col selection:bg-[#00F3FF] selection:text-black">
      {/* Cyberpunk Overlay Effects */}
      <div className="absolute inset-0 pointer-events-none z-[9999] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="absolute inset-0 pointer-events-none z-[9999] scanlines"></div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        :root {
          --neon-blue: #00F3FF;
          --neon-pink: #FF003C;
          --dark-bg: #020202;
        }

        .font-cyber { font-family: 'Orbitron', sans-serif; }

        .scanlines {
          background: linear-gradient(
            to bottom,
            rgba(18, 16, 16, 0) 50%,
            rgba(0, 0, 0, 0.25) 50%
          );
          background-size: 100% 4px;
        }

        .cyber-map-layer { 
          filter: brightness(0.8) contrast(1.2) saturate(0.5) hue-rotate(10deg); 
        }

        .cyber-route-line {
          filter: drop-shadow(0 0 8px var(--neon-blue));
          stroke-dasharray: 15, 10;
          animation: dash 20s linear infinite;
        }

        @keyframes dash {
          to { stroke-dashoffset: -1000; }
        }

        .cyber-panel {
          background: rgba(2, 2, 2, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 243, 255, 0.2);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }

        .cyber-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid var(--neon-blue);
          clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
        }

        .cyber-button:hover {
          background: var(--neon-blue);
          color: black;
          box-shadow: 0 0 15px var(--neon-blue);
        }

        .glitch-text {
          animation: glitch 3s infinite;
        }

        @keyframes glitch {
          0% { text-shadow: 2px 0 var(--neon-pink), -2px 0 var(--neon-blue); }
          2% { text-shadow: -2px 0 var(--neon-pink), 2px 0 var(--neon-blue); }
          4% { text-shadow: 2px 0 var(--neon-pink), -2px 0 var(--neon-blue); }
          100% { text-shadow: 2px 0 var(--neon-pink), -2px 0 var(--neon-blue); }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--neon-blue); }
      `}</style>

      {/* HEADER */}
      <header className="p-4 flex justify-between items-center cyber-panel z-[100] border-b-2">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative px-4 py-1 bg-black border border-cyan-500/50 text-cyan-400 font-cyber font-black text-[10px] tracking-[0.3em] skew-x-[-15deg]">
              NEURAL_INTERFACE_v9.2
            </div>
          </div>
          <div className="hidden md:flex gap-6 items-center text-[9px] font-cyber tracking-widest text-cyan-500/70">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${locationError ? 'bg-red-500 animate-pulse' : 'bg-cyan-500 shadow-[0_0_5px_cyan]'}`} />
              {systemStatus}
            </div>
            <div className="flex items-center gap-2">
              <Cpu size={12} /> CPU_LOAD: 24%
            </div>
          </div>
        </div>
        <button 
          onClick={onExit} 
          className="group relative p-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
        >
          <X size={20} />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* MAPA SECTION */}
        <section className="flex-1 relative bg-[#010101] p-2 lg:p-4">
          <div className="relative w-full h-full border border-cyan-500/20 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)_inset]">
            <div ref={mapContainerRef} className="absolute inset-0 cyber-map-layer" />
            
            {/* Map Overlay Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_50%,rgba(2,2,2,0.8)_100%)]" />
            
            {/* UI ELEMENTS ON MAP */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-3 max-w-md">
              <div className="cyber-panel p-2 space-y-1 border-l-4 border-l-cyan-500">
                <button 
                  onClick={() => setIsMenu('origin')}
                  className="w-full flex items-center gap-4 p-3 hover:bg-cyan-500/10 transition-colors group"
                >
                  <div className="p-2 bg-cyan-500/20 rounded-sm group-hover:bg-cyan-500 group-hover:text-black transition-all">
                    <LocateFixed size={16} />
                  </div>
                  <div className="text-left overflow-hidden flex-1">
                    <span className="text-[8px] text-cyan-500/50 uppercase block font-black font-cyber tracking-tighter">Current_Node</span>
                    <span className="text-xs font-bold truncate block uppercase text-white">{origin.name}</span>
                  </div>
                </button>
                
                <div className="flex justify-center -my-3 relative z-10">
                  <div className="bg-black border border-cyan-500/50 p-1 rotate-45">
                    <ArrowDownUp size={10} className="text-cyan-500 -rotate-45" />
                  </div>
                </div>

                <button 
                  onClick={() => setIsMenu('dest')}
                  className="w-full flex items-center gap-4 p-3 hover:bg-pink-500/10 transition-colors group border-l-4 border-l-pink-500"
                >
                  <div className="p-2 bg-pink-500/20 rounded-sm group-hover:bg-pink-500 group-hover:text-black transition-all">
                    <Target size={16} className="text-pink-500 group-hover:text-black" />
                  </div>
                  <div className="text-left overflow-hidden flex-1">
                    <span className="text-[8px] text-pink-500/50 uppercase block font-black font-cyber tracking-tighter">Target_Node</span>
                    <span className="text-xs font-bold truncate block uppercase text-white">
                      {destination.name === 'TARGET_UNSET' ? 'ESTABLISH_TARGET...' : destination.name}
                    </span>
                  </div>
                </button>
              </div>

              {routeInfo && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="cyber-panel p-4 flex justify-between items-center border-t-2 border-t-cyan-500/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-full">
                      <Navigation size={14} className="text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[8px] text-cyan-500/50 uppercase block font-black font-cyber">Distance</span>
                      <span className="text-sm font-black text-white">{routeInfo.distance.toFixed(2)} <span className="text-[10px] text-cyan-500">KM</span></span>
                    </div>
                  </div>
                  <div className="h-8 w-[1px] bg-cyan-500/20"></div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-[8px] text-cyan-500/50 uppercase block font-black font-cyber">ETA</span>
                      <span className="text-sm font-black text-white">
                        {Math.floor(routeInfo.duration)} <span className="text-[10px] text-cyan-500">MIN</span>
                      </span>
                    </div>
                    <div className="p-2 bg-cyan-500/10 rounded-full">
                      <Clock size={14} className="text-cyan-400" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Compass / Decorative UI */}
            <div className="absolute bottom-6 left-6 z-[1000] hidden lg:block">
              <div className="relative w-24 h-24 border border-cyan-500/20 rounded-full flex items-center justify-center">
                <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-[spin_4s_linear_infinite]"></div>
                <div className="text-[8px] font-cyber text-cyan-500/50">SECTOR_07</div>
              </div>
            </div>
          </div>
        </section>

        {/* HUD SIDEBAR */}
        <aside className="lg:w-[480px] bg-black border-t lg:border-t-0 lg:border-l-2 border-cyan-500/20 flex flex-col p-6 lg:p-10 justify-between z-50 relative">
          {/* Background Decorative Text */}
          <div className="absolute top-20 right-4 text-[60px] font-black text-white/[0.02] pointer-events-none select-none font-cyber rotate-90 origin-right">
            NEURAL_SYNC
          </div>

          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1 h-4 bg-pink-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.4em] font-cyber">
                  Audio_Stream_Active
                </span>
              </div>
              
              <div className="relative">
                <h2 className="text-4xl lg:text-6xl font-black uppercase text-white leading-[0.9] tracking-tighter italic font-cyber glitch-text">
                  {currentTrack?.title || "IDLE_STATE"}
                </h2>
                <div className="mt-4 flex items-center gap-4">
                  <Radio size={18} className="text-cyan-500" />
                  <p className="text-cyan-400 text-lg lg:text-xl font-bold uppercase tracking-widest opacity-80 truncate font-cyber">
                    {currentTrack?.artist || "NO_SOURCE_FOUND"}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <button 
                  onClick={onPrev} 
                  className="h-20 lg:h-24 border border-cyan-500/30 flex items-center justify-center bg-cyan-500/5 hover:bg-cyan-500/20 active:scale-95 transition-all group"
                >
                  <SkipBack size={28} className="group-hover:text-white transition-colors" />
                </button>
                <button 
                  onClick={onTogglePlay} 
                  className="col-span-2 h-20 lg:h-24 bg-cyan-500 text-black flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.4)] hover:bg-white active:scale-95 transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative z-10">
                    {isPlaying ? <Pause size={44} /> : <Play size={44} className="fill-current ml-2" />}
                  </div>
                </button>
                <button 
                  onClick={onNext} 
                  className="h-20 lg:h-24 border border-cyan-500/30 flex items-center justify-center bg-cyan-500/5 hover:bg-cyan-500/20 active:scale-95 transition-all group"
                >
                  <SkipForward size={28} className="group-hover:text-white transition-colors" />
                </button>
              </div>
              
              <button 
                onClick={() => setIsMenu('music')}
                className="cyber-button w-full h-16 bg-white/5 flex items-center justify-center gap-4 uppercase text-[10px] font-black tracking-[0.3em] font-cyber"
              >
                <Search size={18} /> Access_Media_Matrix
              </button>
            </div>
          </div>

          {/* Telemetry */}
          <div className="flex items-end justify-between border-t border-cyan-500/20 pt-10">
            <div className="relative">
              <div className="absolute -top-6 left-0 text-[10px] font-black text-pink-500/50 font-cyber tracking-widest">VELOCITY_LOG</div>
              <div className="flex items-end gap-3">
                <span className="text-7xl lg:text-9xl font-black italic text-white tracking-tighter leading-none font-cyber">
                  {speed.toString().padStart(2, '0')}
                </span>
                <div className="flex flex-col mb-2 lg:mb-4">
                  <span className="text-xl lg:text-2xl font-black text-pink-500 font-cyber">KM/H</span>
                  <div className="w-full h-1 bg-pink-500/30 overflow-hidden">
                    <div className="h-full bg-pink-500 animate-[shimmer_2s_infinite]" style={{ width: `${(speed/200)*100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-6 font-cyber text-[10px]">
              <div className="text-right">
                <div className="text-cyan-500/50 mb-1">ENERGY_CORE</div>
                <div className="flex items-center gap-3 text-white">
                  <Battery size={16} className="text-green-500" /> 
                  <span className="text-lg font-black">88%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-cyan-500/50 mb-1">SIGNAL_LINK</div>
                <div className="flex items-center gap-3 text-white">
                  <Activity size={16} className="text-cyan-500" /> 
                  <span className="text-lg font-black">STABLE</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* SEARCH MODALS */}
      <AnimatePresence>
        {(isMenu === 'origin' || isMenu === 'dest') && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl p-4 lg:p-8 flex flex-col items-center justify-center"
          >
            <div className="w-full max-w-3xl space-y-8 relative">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="flex justify-between items-end border-b-2 border-pink-500 pb-6">
                <div>
                  <div className="text-pink-500 text-[10px] font-black font-cyber tracking-[0.5em] mb-2">INPUT_COORDINATES</div>
                  <h2 className="text-3xl lg:text-5xl font-black uppercase italic text-white font-cyber">
                    {isMenu === 'origin' ? 'SET_ORIGIN' : 'SET_DESTINATION'}
                  </h2>
                </div>
                <button 
                  onClick={() => { setIsMenu(null); setSearchQuery(''); setSearchResults([]); }}
                  className="p-4 border border-white/20 hover:border-white transition-colors"
                >
                  <X size={32} />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-500" size={24} />
                <input 
                  autoFocus 
                  value={searchQuery}
                  className="w-full bg-white/5 border-b-4 border-cyan-500 p-6 pl-16 text-2xl lg:text-4xl font-black uppercase outline-none placeholder:text-cyan-500/20 font-cyber" 
                  placeholder="SEARCH_LOCATION..." 
                  onChange={(e) => handleGeoSearch(e.target.value)} 
                />
              </div>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-4">
                {isSearching && (
                  <div className="flex flex-col items-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-cyan-500 font-cyber text-[10px] tracking-[0.3em] animate-pulse">PROCESSING_QUERY...</div>
                  </div>
                )}
                
                {searchResults.map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      const coords: [number, number] = [parseFloat(item.lat), parseFloat(item.lon)];
                      const name = item.display_name.split(',')[0];
                      if (isMenu === 'origin') setOrigin({ name, coords });
                      else setDestination({ name, coords });
                      setIsMenu(null);
                      setSearchResults([]);
                      setSearchQuery('');
                    }} 
                    className="w-full p-6 border border-white/5 bg-white/5 text-left flex items-center justify-between group hover:border-cyan-500 hover:bg-cyan-500/10 transition-all clip-path-panel"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-lg font-black uppercase truncate text-white group-hover:text-cyan-400">
                        {item.display_name.split(',')[0]}
                      </span>
                      <span className="text-[10px] text-white/40 uppercase truncate font-cyber tracking-widest mt-1">
                        {item.display_name.split(',').slice(1, 4).join(', ')}
                      </span>
                    </div>
                    <ChevronRight size={24} className="text-cyan-500 group-hover:translate-x-2 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {isMenu === 'music' && (
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 1.1, opacity: 0 }} 
            className="fixed inset-0 z-[10000] bg-black/98 backdrop-blur-3xl p-4 lg:p-8 flex flex-col"
          >
            <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
              <div className="flex justify-between items-end mb-12 border-b-2 border-cyan-500 pb-8">
                <div>
                  <div className="text-cyan-500 text-[10px] font-black font-cyber tracking-[0.5em] mb-2">MEDIA_DATABASE</div>
                  <h2 className="text-4xl lg:text-6xl font-black uppercase italic text-white font-cyber">
                    AUDIO_MATRIX
                  </h2>
                </div>
                <button onClick={() => setIsMenu(null)} className="p-4 border border-white/20 hover:border-white transition-colors">
                  <X size={40} />
                </button>
              </div>
              
              <div className="relative mb-12">
                <Music className="absolute left-6 top-1/2 -translate-y-1/2 text-pink-500" size={32} />
                <input 
                  autoFocus 
                  className="w-full bg-white/5 border-b-4 border-pink-500 p-8 pl-20 text-3xl lg:text-5xl font-black uppercase outline-none placeholder:text-pink-500/20 font-cyber text-white" 
                  placeholder="LINK_MÚSICA..." 
                  onChange={(e) => onSearch(e.target.value)} 
                />
              </div>
              
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 custom-scrollbar pr-4">
                {playlist && playlist.length > 0 ? (
                  playlist.map((t: Track) => (
                    <button 
                      key={t.id} 
                      onClick={() => { onSelectTrack(t); setIsMenu(null); }} 
                      className="p-4 border border-white/5 bg-white/5 flex items-center gap-6 hover:border-cyan-500 hover:bg-cyan-500/10 group transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/10 -rotate-45 translate-x-6 -translate-y-6 group-hover:bg-cyan-500/30 transition-colors"></div>
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <img src={t.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={t.title} />
                        <div className="absolute inset-0 border border-white/20 group-hover:border-cyan-500 transition-colors"></div>
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-black text-lg uppercase truncate text-white group-hover:text-cyan-400 transition-colors font-cyber">
                          {t.title}
                        </p>
                        <p className="text-[10px] text-pink-500 uppercase font-black tracking-[0.2em] mt-1 font-cyber">
                          {t.artist}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full py-32 text-center">
                    <div className="text-cyan-500/20 font-cyber text-xl lg:text-3xl font-black uppercase tracking-[0.5em] animate-pulse">
                      WAITING_FOR_UPLINK...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
