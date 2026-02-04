import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Play, Pause, SkipForward, SkipBack, X, Navigation, 
  Search, MapPin, Zap, Music, ChevronRight, 
  Battery, Signal, LocateFixed, Target, Activity, 
  ArrowDownUp, ShieldCheck, Wifi, Clock, Radio, Volume2,
  Loader2, Fingerprint, ChevronUp, ChevronDown
} from 'lucide-react';

/* --- ICONS --- */
const carIcon = L.divIcon({
  className: 'cyber-car',
  html: `<div class="car-glow"><svg width="32" height="32" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2Z" fill="#00F3FF" stroke="#000" stroke-width="1.5"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const destIcon = L.divIcon({
  className: 'cyber-dest',
  html: `<div class="dest-glow"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#FF003C" stroke-width="2" fill="rgba(255,0,60,0.1)"/><circle cx="12" cy="12" r="4" fill="#FF003C"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
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
      L.polyline(coords, { color: '#00F3FF', weight: 8, opacity: 0.2 }).addTo(routeLayerRef.current);
      L.polyline(coords, { color: '#00F3FF', weight: 4, opacity: 0.9, className: 'cyber-route-line' }).addTo(routeLayerRef.current);
      L.marker(end, { icon: destIcon }).addTo(routeLayerRef.current);
      mapRef.current.fitBounds(L.polyline(coords).getBounds(), { padding: [40, 40] });
      setRouteInfo({ distance: data.routes[0].distance / 1000, duration: data.routes[0].duration / 60 });
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (origin.coords && destination.coords) drawRoute(origin.coords, destination.coords);
  }, [origin.coords, destination.coords, drawRoute]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020202] text-[#00F3FF] font-mono overflow-hidden flex flex-col select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap');
        .font-cyber { font-family: 'Orbitron', sans-serif; }
        .cyber-map-layer { filter: invert(90%) hue-rotate(185deg) brightness(1.1) contrast(1.2) saturate(0.7); }
        .cyber-route-line { filter: drop-shadow(0 0 8px #00F3FF); stroke-dasharray: 15, 10; animation: flow 35s linear infinite; }
        @keyframes flow { to { stroke-dashoffset: -1000; } }
        .glass-hud { background: rgba(0, 5, 10, 0.9); backdrop-filter: blur(15px); border: 1px solid rgba(0, 243, 255, 0.2); }
        .result-item { border-left: 2px solid transparent; transition: all 0.2s; }
        .result-item:active { border-left: 2px solid #00F3FF; background: rgba(0, 243, 255, 0.1); }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>

      {/* --- MOBILE HEADER --- */}
      <header className="p-3 flex justify-between items-center glass-hud z-[100] border-b border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-black border border-cyan-500/40 text-cyan-400 font-cyber font-black text-[9px] tracking-widest skew-x-[-10deg]">NEURAL_OS</div>
          <div className="flex items-center gap-2 text-[8px] font-cyber text-cyan-500/60 uppercase tracking-tighter">
            <Wifi size={10} /> <Signal size={10} /> <Battery size={10} className="text-green-500" />
          </div>
        </div>
        <button onClick={onExit} className="p-1.5 border border-pink-500/50 text-pink-500 rounded-sm active:bg-pink-500/20"><X size={20} /></button>
      </header>

      <main className="flex-1 relative flex flex-col">
        {/* --- MAP SECTION --- */}
        <section className="flex-1 relative bg-black">
          <div ref={mapContainerRef} className="absolute inset-0 cyber-map-layer" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_70%,rgba(0,0,0,0.4)_100%)] z-10" />
          
          {/* --- TOP HUD (FLOATING) --- */}
          <div className="absolute top-4 left-4 right-4 z-[1000] space-y-2 pointer-events-none">
            <div className="glass-hud p-2 flex flex-col gap-1 border-l-4 border-l-cyan-500 shadow-xl pointer-events-auto">
              <button onClick={() => setIsMenu('origin')} className="flex items-center gap-3 p-2 active:bg-white/5 text-left">
                <LocateFixed size={16} className="text-cyan-400" />
                <div className="min-w-0 flex-1"><div className="text-[6px] text-cyan-500/60 uppercase font-black">ORIGIN</div><div className="text-[10px] font-bold text-white truncate uppercase">{origin.name}</div></div>
              </button>
              <div className="h-px bg-white/5 mx-2" />
              <button onClick={() => setIsMenu('dest')} className="flex items-center gap-3 p-2 active:bg-white/5 text-left">
                <Target size={16} className="text-pink-500" />
                <div className="min-w-0 flex-1"><div className="text-[6px] text-pink-500/50 uppercase font-black">TARGET</div><div className="text-[10px] font-bold text-white truncate uppercase">{destination.name === 'TARGET_NOT_SET' ? 'SET_DESTINATION...' : destination.name}</div></div>
              </button>
            </div>
            
            {routeInfo.distance > 0 && (
              <div className="flex gap-2 pointer-events-auto">
                <div className="flex-1 glass-hud p-2 border-t border-t-cyan-500/50 flex justify-between items-center px-4"><span className="text-[7px] opacity-40 font-black">DIST</span><span className="text-xs font-black">{routeInfo.distance.toFixed(1)} KM</span></div>
                <div className="flex-1 glass-hud p-2 border-t border-t-pink-500/50 flex justify-between items-center px-4"><span className="text-[7px] opacity-40 font-black">ETA</span><span className="text-xs font-black">{Math.floor(routeInfo.duration)} MIN</span></div>
              </div>
            )}
          </div>

          {/* --- SPEED HUD (BOTTOM LEFT) --- */}
          <div className="absolute bottom-24 left-4 z-[1000] flex items-end gap-2 pointer-events-none">
            <div className="text-6xl font-black italic text-white font-cyber tracking-tighter drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">{speed}</div>
            <div className="mb-2 flex flex-col text-pink-500 font-cyber font-black leading-none">
              <span className="text-xs">KM/H</span>
              <div className="h-1 w-12 bg-white/10 mt-1 overflow-hidden"><div className="h-full bg-pink-500 transition-all duration-300" style={{ width: `${Math.min((speed/120)*100, 100)}%` }} /></div>
            </div>
          </div>
        </section>

        {/* --- MINI PLAYER (FIXED BOTTOM) --- */}
        <motion.div 
          initial={false}
          animate={{ height: isPlayerExpanded ? 'auto' : '80px' }}
          className="glass-hud border-t-2 border-cyan-500/30 z-[2000] overflow-hidden"
        >
          {/* Mini View */}
          <div className="h-[80px] flex items-center px-4 gap-4">
            <div className="relative w-12 h-12 flex-shrink-0" onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}>
              {currentTrack?.thumbnail ? (
                <img src={currentTrack.thumbnail} className="w-full h-full object-cover border border-white/10" alt="" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center border border-white/10"><Music size={20} className="text-cyan-500/20" /></div>
              )}
              <div className="absolute -top-1 -right-1 bg-cyan-500 p-0.5 rounded-full"><ChevronUp size={10} className={`text-black transition-transform ${isPlayerExpanded ? 'rotate-180' : ''}`} /></div>
            </div>
            
            <div className="flex-1 min-w-0" onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}>
              <div className="text-[11px] font-black text-white uppercase truncate font-cyber tracking-tight">{currentTrack?.title || "SYSTEM_IDLE"}</div>
              <div className="text-[8px] text-cyan-400/70 uppercase truncate tracking-widest">{currentTrack?.artist || "NO_UPLINK"}</div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={onPrev} className="p-2 active:text-cyan-400"><SkipBack size={20} /></button>
              <button onClick={onTogglePlay} className="w-10 h-10 bg-cyan-500 text-black flex items-center justify-center rounded-sm active:scale-90 transition-transform">
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <button onClick={onNext} className="p-2 active:text-cyan-400"><SkipForward size={20} /></button>
            </div>
          </div>

          {/* Expanded Controls */}
          <AnimatePresence>
            {isPlayerExpanded && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-6 pb-6 pt-2 space-y-6"
              >
                <div className="flex gap-2">
                  <button onClick={() => setIsMenu('music')} className="flex-1 h-10 border border-white/10 flex items-center justify-center gap-2 text-[9px] font-black tracking-widest uppercase active:bg-white/5">
                    <Search size={14} /> Search_Media
                  </button>
                  <button onClick={() => setIsPlayerExpanded(false)} className="w-10 h-10 border border-white/10 flex items-center justify-center active:bg-white/5">
                    <ChevronDown size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[8px] font-black uppercase tracking-widest opacity-40">
                  <div className="flex items-center gap-2"><Activity size={12} /> BITRATE: 1411kbps</div>
                  <div className="flex items-center gap-2"><Radio size={12} /> SIGNAL: STABLE</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* --- MODAL MENUS (FULLSCREEN ON MOBILE) --- */}
      <AnimatePresence>
        {(isMenu === 'origin' || isMenu === 'dest' || isMenu === 'music') && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-[10000] bg-black p-4 flex flex-col">
            <div className="flex justify-between items-center border-b border-pink-500/40 pb-4 mb-4">
              <h2 className="text-lg font-black uppercase italic text-white font-cyber">{isMenu === 'music' ? 'MEDIA_MATRIX' : (isMenu === 'origin' ? 'DEPARTURE' : 'TARGET')}</h2>
              <button onClick={() => { setIsMenu(null); setSearchQuery(''); }} className="p-2 text-pink-500"><X size={24} /></button>
            </div>
            
            <div className="relative mb-4">
              <input autoFocus value={searchQuery} className="w-full bg-white/5 border-b border-cyan-500 p-4 text-lg font-black uppercase outline-none font-cyber text-white placeholder:opacity-20" placeholder="SCANNING_QUERY..." onChange={(e) => handleInputSearch(e.target.value)} />
              {(isSearching || isGeoLoading) && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-cyan-500" size={20} />}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {isMenu === 'music' ? (
                playlist && playlist.length > 0 ? playlist.map((t: any) => (
                  <button key={t.id} onClick={() => { onSelectTrack(t); setIsMenu(null); setSearchQuery(''); setIsPlayerExpanded(false); }} className="w-full p-3 glass-hud text-left flex items-center gap-3 result-item">
                    {t.thumbnail ? <img src={t.thumbnail} className="w-12 h-12 object-cover grayscale" alt="" /> : <div className="w-12 h-12 bg-white/5 flex items-center justify-center"><Music size={16} className="text-cyan-500/20" /></div>}
                    <div className="min-w-0 flex-1"><div className="text-[10px] font-black uppercase text-white truncate font-cyber tracking-tight">{t.title}</div><div className="text-[8px] text-pink-500 uppercase truncate mt-0.5">{t.artist}</div></div>
                  </button>
                )) : <div className="text-center py-10 text-cyan-500/20 font-cyber uppercase text-[10px] animate-pulse">WAITING_FOR_INPUT...</div>
              ) : (
                geoResults.map((item, i) => (
                  <button key={i} onClick={() => {
                    const coords: [number, number] = [parseFloat(item.lat), parseFloat(item.lon)];
                    const name = item.display_name.split(',')[0];
                    if (isMenu === 'origin') setOrigin({ name, coords }); else setDestination({ name, coords });
                    setIsMenu(null); setSearchQuery('');
                  }} className="w-full p-3 glass-hud text-left flex items-center justify-between result-item">
                    <div className="min-w-0 flex-1"><div className="text-[10px] font-black uppercase text-white truncate font-cyber tracking-tight">{item.display_name.split(',')[0]}</div><div className="text-[8px] text-white/40 uppercase truncate mt-0.5">{item.display_name.split(',').slice(1, 3).join(', ')}</div></div>
                    <ChevronRight size={16} className="text-cyan-500" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
