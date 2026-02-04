import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Play, Pause, SkipForward, SkipBack, X, Navigation, 
  Search, MapPin, Zap, Music, ChevronRight, 
  Battery, Signal, LocateFixed, Target, Activity, 
  ArrowDownUp, ShieldCheck, Wifi, Clock, Radio, Volume2,
  Loader2, Fingerprint
} from 'lucide-react';

/* --- ICONS --- */
const carIcon = L.divIcon({
  className: 'cyber-car',
  html: `<div class="car-glow"><svg width="44" height="44" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2Z" fill="#00F3FF" stroke="#000" stroke-width="1.5"/></svg></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

const destIcon = L.divIcon({
  className: 'cyber-dest',
  html: `<div class="dest-glow"><svg width="36" height="36" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#FF003C" stroke-width="2" fill="rgba(255,0,60,0.1)"/><circle cx="12" cy="12" r="4" fill="#FF003C"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
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
      L.polyline(coords, { color: '#00F3FF', weight: 12, opacity: 0.15 }).addTo(routeLayerRef.current);
      L.polyline(coords, { color: '#00F3FF', weight: 5, opacity: 0.9, className: 'cyber-route-line' }).addTo(routeLayerRef.current);
      L.marker(end, { icon: destIcon }).addTo(routeLayerRef.current);
      mapRef.current.fitBounds(L.polyline(coords).getBounds(), { padding: [80, 80] });
      setRouteInfo({ distance: data.routes[0].distance / 1000, duration: data.routes[0].duration / 60 });
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (origin.coords && destination.coords) drawRoute(origin.coords, destination.coords);
  }, [origin.coords, destination.coords, drawRoute]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020202] text-[#00F3FF] font-mono overflow-hidden flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap');
        .font-cyber { font-family: 'Orbitron', sans-serif; }
        .cyber-map-layer { filter: invert(90%) hue-rotate(185deg) brightness(1.1) contrast(1.2) saturate(0.7); }
        .cyber-route-line { filter: drop-shadow(0 0 8px #00F3FF); stroke-dasharray: 20, 15; animation: flow 35s linear infinite; }
        @keyframes flow { to { stroke-dashoffset: -1000; } }
        .glass-hud { background: rgba(0, 5, 10, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(0, 243, 255, 0.2); }
        .result-item { border-left: 2px solid transparent; transition: all 0.2s; }
        .result-item:hover { border-left: 2px solid #00F3FF; background: rgba(0, 243, 255, 0.05); }
        .scanning-bar { width: 100%; height: 2px; background: #00F3FF; position: absolute; top: 0; animation: scan 3s infinite linear; opacity: 0.3; }
        @keyframes scan { from { top: 0; } to { top: 100%; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00F3FF; }
      `}</style>

      <header className="p-4 flex justify-between items-center glass-hud z-[100] border-b-2 border-cyan-500/30">
        <div className="flex items-center gap-6">
          <div className="relative px-4 py-1.5 bg-black border border-cyan-500/40 text-cyan-400 font-cyber font-black text-[10px] tracking-[0.4em] skew-x-[-15deg]">NEURAL_OS_v12.4</div>
          <div className="hidden md:flex gap-6 items-center text-[9px] font-cyber tracking-widest text-cyan-500/50">
            <div className="flex items-center gap-2"><Wifi size={12} /> ENCRYPTION: AES-256</div>
            <div className="flex items-center gap-2 text-cyan-400"><Fingerprint size={12} className="animate-pulse" /> BIO_SYNC: ACTIVE</div>
          </div>
        </div>
        <button onClick={onExit} className="p-2 border border-pink-500/50 text-pink-500 hover:bg-pink-500 hover:text-white transition-all"><X size={24} /></button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row relative">
        <section className="flex-1 relative bg-black p-2">
          <div className="relative w-full h-full border border-cyan-500/20 overflow-hidden">
            <div ref={mapContainerRef} className="absolute inset-0 cyber-map-layer" />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_65%,rgba(0,0,0,0.6)_100%)] z-10" />
            <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col gap-3 max-w-md">
              <div className="glass-hud p-2 flex flex-col gap-1 border-l-4 border-l-cyan-500 shadow-2xl">
                <button onClick={() => setIsMenu('origin')} className="flex items-center gap-4 p-3 hover:bg-white/5 text-left">
                  <LocateFixed size={18} className="text-cyan-400" />
                  <div className="min-w-0 flex-1 leading-tight"><div className="text-[7px] text-cyan-500/60 uppercase font-black">Departure_Point</div><div className="text-[11px] font-bold text-white truncate uppercase">{origin.name}</div></div>
                </button>
                <div className="flex justify-center -my-3 relative z-10"><div className="bg-cyan-500 p-1 rounded-full"><ArrowDownUp size={10} className="text-black" /></div></div>
                <button onClick={() => setIsMenu('dest')} className="flex items-center gap-4 p-3 hover:bg-white/5 text-left border-t border-white/5">
                  <Target size={18} className="text-pink-500" />
                  <div className="min-w-0 flex-1 leading-tight"><div className="text-[7px] text-pink-500/50 uppercase font-black">Arrival_Target</div><div className="text-[11px] font-bold text-white truncate uppercase">{destination.name === 'TARGET_NOT_SET' ? 'SCANNING_DESTINATION...' : destination.name}</div></div>
                </button>
              </div>
              {routeInfo.distance > 0 && (
                <div className="flex gap-2">
                  <div className="flex-1 glass-hud p-3 border-t-2 border-t-cyan-500/50 text-center leading-none"><div className="text-[7px] opacity-40 uppercase font-black">Distance</div><div className="text-sm font-black mt-1">{routeInfo.distance.toFixed(1)}<span className="text-[10px] ml-1 text-cyan-500 font-normal">KM</span></div></div>
                  <div className="flex-1 glass-hud p-3 border-t-2 border-t-pink-500/50 text-center leading-none"><div className="text-[7px] opacity-40 uppercase font-black">Time_ETA</div><div className="text-sm font-black mt-1">{Math.floor(routeInfo.duration)}<span className="text-[10px] ml-1 text-pink-500 font-normal">MIN</span></div></div>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="lg:w-[460px] glass-hud border-t lg:border-t-0 lg:border-l-2 border-cyan-500/10 flex flex-col p-8 justify-between z-50">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2"><div className="flex gap-1">{[1, 2, 3].map(i => <div key={i} className="w-1.5 h-4 bg-pink-500 animate-pulse" />)}</div><span className="text-[9px] font-black text-pink-500 uppercase tracking-[0.4em] font-cyber">Audio_Sync</span></div>
              <div className="p-6 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden">
                <div className="scanning-bar" />
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
      </main>

      <AnimatePresence mode="wait">
        {(isMenu === 'origin' || isMenu === 'dest' || isMenu === 'music') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl p-6 lg:p-12 flex items-center justify-center">
            <div className="w-full max-w-2xl flex flex-col h-full lg:h-auto">
              <div className="flex justify-between items-end border-b-2 border-pink-500/40 pb-6 mb-8">
                <h2 className="text-3xl font-black uppercase italic text-white font-cyber tracking-tighter">{isMenu === 'music' ? 'Audio_Matrix_Search' : (isMenu === 'origin' ? 'Set_Departure' : 'Set_Target')}</h2>
                <button onClick={() => { setIsMenu(null); setSearchQuery(''); }} className="text-white hover:text-pink-500 transition-colors"><X size={32} /></button>
              </div>
              <div className="relative mb-6">
                <input autoFocus value={searchQuery} className="w-full bg-white/5 border-b-2 border-cyan-500 p-5 text-2xl lg:text-3xl font-black uppercase outline-none font-cyber text-white placeholder:opacity-10" placeholder={isMenu === 'music' ? "Scanning_Neural_Library..." : "Searching_Ceara_Grid..."} onChange={(e) => handleInputSearch(e.target.value)} />
                {(isSearching || isGeoLoading) && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-cyan-500" size={24} />}
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {isMenu === 'music' ? (
                  playlist && playlist.length > 0 ? playlist.map((t: any) => (
                    <button key={t.id} onClick={() => { onSelectTrack(t); setIsMenu(null); setSearchQuery(''); }} className="w-full p-4 glass-hud text-left flex items-center gap-4 result-item">
                      {t.thumbnail ? <img src={t.thumbnail} className="w-16 h-16 object-cover grayscale" alt={t.title} /> : <div className="w-16 h-16 bg-white/5 flex items-center justify-center"><Music size={24} className="text-cyan-500/20" /></div>}
                      <div className="min-w-0 flex-1"><div className="text-base font-black uppercase text-white truncate font-cyber tracking-tight">{t.title}</div><div className="text-[9px] text-pink-500 uppercase truncate mt-1">{t.artist}</div></div>
                    </button>
                  )) : <div className="text-center py-10 text-cyan-500/30 font-cyber uppercase text-sm animate-pulse">Waiting_For_Neural_Input...</div>
                ) : (
                  geoResults.map((item, i) => (
                    <button key={i} onClick={() => {
                      const coords: [number, number] = [parseFloat(item.lat), parseFloat(item.lon)];
                      const name = item.display_name.split(',')[0];
                      if (isMenu === 'origin') setOrigin({ name, coords }); else setDestination({ name, coords });
                      setIsMenu(null); setSearchQuery('');
                    }} className="w-full p-4 glass-hud text-left flex items-center justify-between result-item">
                      <div className="min-w-0 flex-1"><div className="text-base font-black uppercase text-white truncate font-cyber tracking-tight">{item.display_name.split(',')[0] || "UNKNOWN_LOC"}</div><div className="text-[9px] text-white/40 uppercase truncate mt-1">{item.display_name.split(',').slice(1, 4).join(', ')}</div></div>
                      <ChevronRight size={20} className="text-cyan-500" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
