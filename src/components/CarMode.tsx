import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Play, Pause, SkipForward, SkipBack, X, Navigation, 
  Search, MapPin, Zap, Music, ChevronRight, 
  Battery, Signal, LocateFixed, Target, Activity, 
  ArrowDownUp, ShieldCheck, Wifi, Clock, Radio, Volume2,
  Loader2, Fingerprint, ChevronUp, ChevronDown, LogOut
} from 'lucide-react';

/* --- ICONS --- */
const carIcon = L.divIcon({
  className: 'cyber-car',
  html: `<div class="car-glow"><svg width="36" height="36" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2Z" fill="#00F3FF" stroke="#000" stroke-width="1.5"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const destIcon = L.divIcon({
  className: 'cyber-dest',
  html: `<div class="dest-glow"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#FF003C" stroke-width="2" fill="rgba(255,0,60,0.1)"/><circle cx="12" cy="12" r="4" fill="#FF003C"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export default function CyberCarMode({ currentTrack, isPlaying, onTogglePlay, onNext, onPrev, onExit, onSearch, playlist, onSelectTrack, isSearching }: any) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [origin, setOrigin] = useState({ name: 'SCANNING_GPS...', coords: null as [number, number] | null });
  const [destination, setDestination] = useState({ name: 'TARGET_NOT_SET', coords: null as [number, number] | null });
  const [isMenu, setIsMenu] = useState<'origin' | 'dest' | 'music' | null>(null);
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });
  const [speed, setSpeed] = useState(0);
  const [geoResults, setGeoResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  /* --- RESPONSIVE & ORIENTATION CHECK --- */
  useEffect(() => {
    const checkOrientation = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsLandscape(window.innerWidth > window.innerHeight && mobile);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  /* --- MAP CORE --- */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [-3.7319, -38.5267], zoom: 15, zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png').addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { if(mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  /* --- GPS TRACKING --- */
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      if (!origin.coords) setOrigin({ name: 'NEURAL_LINK_LOC', coords });
      if (pos.coords.speed) setSpeed(Math.round(pos.coords.speed * 3.6));
      if (mapRef.current) {
        mapRef.current.eachLayer(l => { if ((l as any).options?.id === 'car') mapRef.current?.removeLayer(l); });
        L.marker(coords, { icon: carIcon, id: 'car' } as any).addTo(mapRef.current);
        if (!destination.coords) mapRef.current.panTo(coords);
      }
    }, null, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [destination.coords, origin.coords]);

  /* --- SEARCH LOGIC --- */
  const handleInputSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (isMenu === 'music') {
      searchTimeoutRef.current = setTimeout(() => {
        if (q.trim().length >= 2) onSearch(q);
      }, 800);
    } else {
      if (q.length < 3) { setGeoResults([]); return; }
      searchTimeoutRef.current = setTimeout(async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        setIsGeoLoading(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=10&countrycodes=br`, { 
            signal: abortControllerRef.current.signal,
            headers: { 'Accept-Language': 'pt-BR' }
          });
          const data = await res.json();
          setGeoResults(data);
        } catch (e) {} finally { setIsGeoLoading(false); }
      }, 600);
    }
  };

  /* --- ROUTING ENGINE --- */
  const drawRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    if (!mapRef.current || !routeLayerRef.current) return;
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (!data.routes.length) return;
      routeLayerRef.current.clearLayers();
      const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
      L.polyline(coords, { color: '#00F3FF', weight: 10, opacity: 0.15 }).addTo(routeLayerRef.current);
      L.polyline(coords, { color: '#00F3FF', weight: 5, opacity: 0.9, className: 'cyber-route-line' }).addTo(routeLayerRef.current);
      L.marker(end, { icon: destIcon }).addTo(routeLayerRef.current);
      mapRef.current.fitBounds(L.polyline(coords).getBounds(), { padding: isMobile ? [40, 40] : [80, 80] });
      setRouteInfo({ distance: data.routes[0].distance / 1000, duration: data.routes[0].duration / 60 });
    } catch (e) {}
  }, [isMobile]);

  useEffect(() => {
    if (origin.coords && destination.coords) drawRoute(origin.coords, destination.coords);
  }, [origin.coords, destination.coords, drawRoute]);

  const handleStartFocus = () => {
    if (isLandscape) setIsFocusMode(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020202] text-[#00F3FF] font-mono overflow-hidden flex flex-col select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap');
        .font-cyber { font-family: 'Orbitron', sans-serif; }
        .cyber-map-layer { filter: invert(90%) hue-rotate(185deg) brightness(1.1) contrast(1.2) saturate(0.7); }
        .cyber-route-line { filter: drop-shadow(0 0 8px #00F3FF); stroke-dasharray: 20, 15; animation: flow 35s linear infinite; }
        @keyframes flow { to { stroke-dashoffset: -1000; } }
        .glass-hud { background: rgba(0, 5, 10, 0.9); backdrop-filter: blur(15px); border: 1px solid rgba(0, 243, 255, 0.2); }
        .result-item { border-left: 2px solid transparent; transition: all 0.2s; }
        .result-item:active { border-left: 2px solid #00F3FF; background: rgba(0, 243, 255, 0.1); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00F3FF; }
      `}</style>

      {/* --- SHARED HEADER --- */}
      {!isFocusMode && (
        <header className="p-3 lg:p-4 flex justify-between items-center glass-hud z-[100] border-b border-cyan-500/30">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="px-3 py-1 bg-black border border-cyan-500/40 text-cyan-400 font-cyber font-black text-[9px] lg:text-[10px] tracking-widest skew-x-[-15deg]">NEURAL_OS_v12.4</div>
            <div className="flex gap-4 lg:gap-6 items-center text-[8px] lg:text-[9px] font-cyber tracking-widest text-cyan-500/50">
              <div className="flex items-center gap-2"><Wifi size={12} /><span className="hidden sm:inline">AES-256</span></div>
              <div className="flex items-center gap-2 text-cyan-400"><Fingerprint size={12} className="animate-pulse" /><span className="hidden sm:inline">BIO_SYNC</span></div>
            </div>
          </div>
          <button onClick={onExit} className="p-1.5 lg:p-2 border border-pink-500/50 text-pink-500 rounded-sm active:bg-pink-500/20"><X size={20} lg:size={24} /></button>
        </header>
      )}

      <main className="flex-1 relative flex flex-col lg:flex-row">
        {/* --- MAP SECTION --- */}
        <section className="flex-1 relative bg-black">
          <div ref={mapContainerRef} className="absolute inset-0 cyber-map-layer" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_70%,rgba(0,0,0,0.4)_100%)] z-10" />
          
          {/* --- FOCUS MODE HUD (LANDSCAPE ONLY) --- */}
          {isFocusMode && isLandscape && (
            <div className="absolute inset-0 z-[1000] pointer-events-none p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-4 pointer-events-auto">
                  <div className="glass-hud p-4 flex items-center gap-3 border-l-4 border-l-cyan-500">
                    <div className="text-4xl font-black font-cyber text-white">{speed}</div>
                    <div className="text-[10px] font-black text-cyan-500 flex flex-col leading-none">
                      <span>KM/H</span>
                      <div className="w-10 h-1 bg-cyan-500/20 mt-1"><div className="h-full bg-cyan-500" style={{ width: `${Math.min((speed/120)*100, 100)}%` }} /></div>
                    </div>
                  </div>
                  <button onClick={() => setIsFocusMode(false)} className="glass-hud p-4 text-pink-500 border border-pink-500/30 flex items-center gap-2 active:bg-pink-500/20 shadow-xl">
                    <LogOut size={20} /><span className="text-xs font-black font-cyber">SAIR</span>
                  </button>
                </div>

                <div className="glass-hud p-3 w-64 flex items-center gap-3 pointer-events-auto border-r-4 border-r-cyan-500 shadow-xl">
                  <img src={currentTrack?.thumbnail} className="w-10 h-10 object-cover border border-cyan-500/30" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black text-white truncate font-cyber uppercase tracking-tight">{currentTrack?.title || "SYSTEM_IDLE"}</div>
                    <div className="flex items-center justify-between mt-1 px-1">
                      <button onClick={onPrev} className="text-cyan-500/60 active:text-cyan-400"><SkipBack size={14} /></button>
                      <button onClick={onTogglePlay} className="text-cyan-500 active:scale-90 transition-transform">{isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-cyan-500" />}</button>
                      <button onClick={onNext} className="text-cyan-500/60 active:text-cyan-400"><SkipForward size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {routeInfo.distance > 0 && (
                <div className="flex justify-center w-full">
                  <div className="glass-hud px-8 py-2 flex gap-10 border-b-2 border-cyan-500/50 shadow-2xl">
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-[8px] text-cyan-500/50 font-black tracking-[0.2em] mb-1">DISTANCE</span>
                      <span className="text-sm font-black text-white">{routeInfo.distance.toFixed(1)} KM</span>
                    </div>
                    <div className="w-px bg-cyan-500/20" />
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-[8px] text-pink-500/50 font-black tracking-[0.2em] mb-1">ARRIVAL</span>
                      <span className="text-sm font-black text-white">{Math.floor(routeInfo.duration)} MIN</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TOP HUD (NORMAL MODE) --- */}
          {!isFocusMode && (
            <div className={`absolute z-[1000] flex flex-col gap-3 ${isMobile ? 'top-4 left-4 right-4' : 'top-6 left-6 max-w-md'} pointer-events-none`}>
              <div className="glass-hud p-2 flex flex-col gap-1 border-l-4 border-l-cyan-500 shadow-xl pointer-events-auto">
                <button onClick={() => setIsMenu('origin')} className="flex items-center gap-3 lg:gap-4 p-2 lg:p-3 active:bg-white/5 text-left">
                  <LocateFixed size={18} className="text-cyan-400" />
                  <div className="min-w-0 flex-1 leading-tight"><div className="text-[6px] lg:text-[7px] text-cyan-500/60 uppercase font-black">Departure</div><div className="text-[10px] lg:text-[11px] font-bold text-white truncate uppercase">{origin.name}</div></div>
                </button>
                <div className="flex justify-center -my-3 relative z-10"><div className="bg-cyan-500 p-1 rounded-full"><ArrowDownUp size={10} className="text-black" /></div></div>
                <button onClick={() => setIsMenu('dest')} className="flex items-center gap-3 lg:gap-4 p-2 lg:p-3 active:bg-white/5 text-left border-t border-white/5">
                  <Target size={18} className="text-pink-500" />
                  <div className="min-w-0 flex-1 leading-tight"><div className="text-[6px] lg:text-[7px] text-pink-500/50 uppercase font-black">Target</div><div className="text-[10px] lg:text-[11px] font-bold text-white truncate uppercase">{destination.name === 'TARGET_NOT_SET' ? 'SCANNING...' : destination.name}</div></div>
                </button>
              </div>
              
              <div className="flex gap-2 pointer-events-auto">
                {routeInfo.distance > 0 && (
                  <>
                    <div className="flex-1 glass-hud p-2 lg:p-3 border-t border-t-cyan-500/50 text-center leading-none"><div className="text-[6px] lg:text-[7px] opacity-40 uppercase font-black">Dist</div><div className="text-xs lg:text-sm font-black mt-1">{routeInfo.distance.toFixed(1)}<span className="text-[8px] lg:text-[10px] ml-1 text-cyan-500">KM</span></div></div>
                    <div className="flex-1 glass-hud p-2 lg:p-3 border-t border-t-pink-500/50 text-center leading-none"><div className="text-[6px] lg:text-[7px] opacity-40 uppercase font-black">ETA</div><div className="text-xs lg:text-sm font-black mt-1">{Math.floor(routeInfo.duration)}<span className="text-[8px] lg:text-[10px] ml-1 text-pink-500">MIN</span></div></div>
                  </>
                )}
                {isLandscape && (
                  <button onClick={handleStartFocus} className="px-6 glass-hud bg-cyan-500/10 border-cyan-500 text-cyan-400 font-black text-[10px] font-cyber flex items-center gap-2 active:bg-cyan-500/30 shadow-xl">
                    <Zap size={12} className="animate-pulse" />INICIAR
                  </button>
                )}
              </div>
            </div>
          )}

          {/* --- SPEED HUD (NORMAL MODE) --- */}
          {!isFocusMode && isMobile && (
            <div className="absolute bottom-24 left-4 z-[1000] flex items-end gap-2 pointer-events-none">
              <div className="text-6xl font-black italic text-white font-cyber tracking-tighter drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">{speed}</div>
              <div className="mb-2 flex flex-col text-pink-500 font-cyber font-black leading-none">
                <span className="text-[10px]">KM/H</span>
                <div className="h-1 w-12 bg-white/10 mt-1 overflow-hidden"><div className="h-full bg-pink-500 transition-all duration-300" style={{ width: `${Math.min((speed/120)*100, 100)}%` }} /></div>
              </div>
            </div>
          )}
        </section>

        {/* --- DESKTOP HUD SIDEBAR --- */}
        {!isMobile && (
          <aside className="lg:w-[460px] glass-hud border-l-2 border-cyan-500/10 flex flex-col p-8 justify-between z-50">
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2"><div className="flex gap-1">{[1, 2, 3].map(i => <div key={i} className="w-1.5 h-4 bg-pink-500 animate-pulse" />)}</div><span className="text-[9px] font-black text-pink-500 uppercase tracking-[0.4em] font-cyber">Audio_Sync</span></div>
                <div className="p-6 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden">
                  <h2 className="text-3xl lg:text-4xl font-black uppercase text-white font-cyber truncate">{currentTrack?.title || "SYSTEM_IDLE"}</h2>
                  <div className="mt-4 flex items-center gap-3 text-cyan-400/80 uppercase font-bold text-xs tracking-widest"><Radio size={16} />{currentTrack?.artist || "NO_DATA"}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <button onClick={onPrev} className="h-16 border border-cyan-500/20 hover:bg-cyan-500/10 flex items-center justify-center transition-all"><SkipBack size={24} /></button>
                <button onClick={onTogglePlay} className="col-span-2 h-16 bg-cyan-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-95 transition-all">{isPlaying ? <Pause size={32} /> : <Play size={32} className="fill-current ml-1" />}</button>
                <button onClick={onNext} className="h-16 border border-cyan-500/20 hover:bg-cyan-500/10 flex items-center justify-center transition-all"><SkipForward size={24} /></button>
                <button onClick={() => setIsMenu('music')} className="col-span-4 h-12 border border-white/10 flex items-center justify-center gap-3 uppercase text-[9px] font-black tracking-[0.3em] font-cyber hover:bg-white/5">
                  <Search size={14} /> Matrix_Media_Search
                </button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="w-full h-1 bg-white/5 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 transition-all duration-500 shadow-[0_0_10px_#00F3FF]" style={{ width: `${Math.min((speed / 160) * 100, 100)}%` }} /></div>
              <div className="flex items-end justify-between">
                <div className="flex items-end gap-3 leading-none"><span className="text-7xl lg:text-8xl font-black italic text-white font-cyber tracking-tighter">{speed.toString().padStart(2, '0')}</span><div className="flex flex-col mb-2 text-pink-500 font-cyber font-black leading-tight"><span className="text-xl">KM/H</span><div className="text-[7px] opacity-40 uppercase tracking-widest">Velocity</div></div></div>
                <div className="flex flex-col items-end gap-5"><div className="text-right leading-none"><div className="text-[7px] text-cyan-500/50 uppercase font-black block mb-1">Energy_Core</div><div className="flex items-center gap-2 text-white"><Battery size={18} className="text-green-500" /><span className="text-xl font-black font-cyber">88%</span></div></div></div>
              </div>
            </div>
          </aside>
        )}

        {/* --- MOBILE MINI PLAYER (NORMAL MODE) --- */}
        {isMobile && !isFocusMode && (
          <motion.div initial={false} animate={{ height: isPlayerExpanded ? 'auto' : '80px' }} className="glass-hud border-t-2 border-cyan-500/30 z-[2000] overflow-hidden">
            <div className="h-[80px] flex items-center px-4 gap-4">
              <div className="relative w-12 h-12 flex-shrink-0" onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}>
                {currentTrack?.thumbnail ? <img src={currentTrack.thumbnail} className="w-full h-full object-cover border border-white/10" alt="" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center border border-white/10"><Music size={20} className="text-cyan-500/20" /></div>}
                <div className="absolute -top-1 -right-1 bg-cyan-500 p-0.5 rounded-full"><ChevronUp size={10} className={`text-black transition-transform ${isPlayerExpanded ? 'rotate-180' : ''}`} /></div>
              </div>
              <div className="flex-1 min-w-0" onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}>
                <div className="text-[11px] font-black text-white uppercase truncate font-cyber tracking-tight">{currentTrack?.title || "SYSTEM_IDLE"}</div>
                <div className="text-[8px] text-cyan-400/70 uppercase truncate tracking-widest">{currentTrack?.artist || "NO_UPLINK"}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onPrev} className="p-2 active:text-cyan-400"><SkipBack size={20} /></button>
                <button onClick={onTogglePlay} className="w-10 h-10 rounded-full border border-cyan-500 flex items-center justify-center active:bg-cyan-500/20">{isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1 fill-cyan-500" />}</button>
                <button onClick={onNext} className="p-2 active:text-cyan-400"><SkipForward size={20} /></button>
                <button onClick={() => setIsMenu('music')} className="p-2 ml-1 border border-cyan-500/30 rounded active:bg-cyan-500/20"><Search size={18} /></button>
              </div>
            </div>
            <AnimatePresence>
              {isPlayerExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 pb-6 pt-2 space-y-6">
                  <div className="h-px bg-white/10" />
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                    {playlist.map((track: any) => (
                      <button key={track.id} onClick={() => onSelectTrack(track)} className={`w-full flex items-center gap-4 p-2 border ${currentTrack?.id === track.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 bg-white/5'} hover:border-cyan-500/50 transition-all`}>
                        <img src={track.thumbnail} className="w-10 h-10 object-cover" alt="" />
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-[10px] font-black text-white uppercase truncate">{track.title}</div>
                          <div className="text-[8px] text-cyan-500/50 truncate uppercase">{track.artist}</div>
                        </div>
                        {currentTrack?.id === track.id && <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* --- MENUS --- */}
      <AnimatePresence>
        {isMenu && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-[5000] bg-[#020202] flex flex-col">
            <header className="p-6 border-b border-cyan-500/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-full"><Search size={20} className="text-cyan-400" /></div>
                <div><h2 className="text-xs font-black font-cyber tracking-widest uppercase">{isMenu === 'origin' ? 'SET_ORIGIN' : isMenu === 'dest' ? 'SET_DESTINATION' : 'AUDIO_MATRIX_SEARCH'}</h2><p className="text-[8px] text-cyan-500/40 uppercase">Awaiting_Neural_Input...</p></div>
              </div>
              <button onClick={() => { setIsMenu(null); setGeoResults([]); setSearchQuery(''); }} className="p-2 border border-pink-500/30 text-pink-500 active:bg-pink-500/20"><X size={24} /></button>
            </header>
            <div className="p-6 space-y-4">
              <div className="relative">
                <input autoFocus type="text" value={searchQuery} onChange={(e) => handleInputSearch(e.target.value)} placeholder={isMenu === 'music' ? "SEARCH_TRACKS..." : "ENTER_LOCATION..."} className="w-full bg-white/5 border-b-2 border-cyan-500/30 p-4 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 outline-none transition-all font-cyber uppercase" />
                {(isGeoLoading || isSearching) && <Loader2 className="absolute right-4 top-4 animate-spin text-cyan-500" size={20} />}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[60vh] space-y-2">
                {geoResults.map((r, i) => (
                  <button key={i} onClick={() => {
                    const coords: [number, number] = [parseFloat(r.lat), parseFloat(r.lon)];
                    if (isMenu === 'origin') setOrigin({ name: r.display_name, coords });
                    else setDestination({ name: r.display_name, coords });
                    setIsMenu(null); setGeoResults([]); setSearchQuery('');
                  }} className="w-full p-4 bg-white/5 border border-white/5 text-left flex items-center gap-4 hover:border-cyan-500/50 active:bg-cyan-500/10 transition-all result-item">
                    <MapPin size={18} className="text-cyan-500/40 flex-shrink-0" />
                    <div className="min-w-0 flex-1"><div className="text-[10px] font-bold text-white uppercase truncate">{r.display_name.split(',')[0]}</div><div className="text-[8px] text-zinc-500 uppercase truncate">{r.display_name}</div></div>
                    <ChevronRight size={16} className="text-zinc-800" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
