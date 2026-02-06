import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, X, Navigation, 
  Search, MapPin, Zap, Music, ChevronRight, 
  Battery, LocateFixed, Target, Activity, 
  List, Radio, Volume2, 
  Loader2, Compass, Crosshair, Map as MapIcon, ArrowRight, Eye,
  ArrowUp, ArrowLeft, CornerUpLeft, CornerUpRight, Move, Disc
} from 'lucide-react';
import type { Playlist, Track } from '../types';
import CyberMap from './CyberMap';

interface CyberCarProps {
  currentTrack: any;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onSearch: (q: string) => void;
  playlist: Track[];
  userPlaylists: Playlist[];
  onSelectTrack: (t: Track) => void;
  onPlayPlaylist: (tracks: Track[]) => void;
  isSearching: boolean;
}

const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const R = 6371e3;
  const φ1 = coord1[0] * Math.PI/180;
  const φ2 = coord2[0] * Math.PI/180;
  const Δφ = (coord2[0]-coord1[0]) * Math.PI/180;
  const Δλ = (coord2[1]-coord1[1]) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getNavIcon = (modifier: string | undefined, type: string | undefined) => {
    if (!modifier) return <ArrowUp size={48} className="text-[#00F3FF]" />;
    if (modifier.includes('left')) return <CornerUpLeft size={48} className="text-[#00F3FF]" />;
    if (modifier.includes('right')) return <CornerUpRight size={48} className="text-[#00F3FF]" />;
    if (modifier.includes('uturn')) return <Move size={48} className="text-[#00F3FF]" />;
    return <ArrowUp size={48} className="text-[#00F3FF]" />;
};

export default function CyberCarMode({
  currentTrack, isPlaying, onTogglePlay, onNext, onPrev, onExit,
  onSearch, playlist, userPlaylists, onSelectTrack, onPlayPlaylist, isSearching
}: CyberCarProps) {
  
  const wakeLockRef = useRef<any>(null);
  const searchTimeoutRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(0);
  const [isFollowing, setIsFollowing] = useState(true);
  
  const [origin, setOrigin] = useState<{name: string, coords: [number, number]} | null>(null);
  const [destination, setDestination] = useState<{name: string, coords: [number, number]} | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });
  const [nextStep, setNextStep] = useState<{ instruction: string, distance: number, modifier?: string, type?: string } | null>(null);
  
  const [menuMode, setMenuMode] = useState<'MUSIC' | 'MAP' | null>(null);
  const [activeMusicTab, setActiveMusicTab] = useState<'SEARCH' | 'PLAYLISTS'>('SEARCH');
  const [focusMode, setFocusMode] = useState(false);
  
  const [musicQuery, setMusicQuery] = useState('');
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [activeInput, setActiveInput] = useState<'ORIGIN' | 'DEST' | null>('DEST');
  
  const [mapResults, setMapResults] = useState<any[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);

  useEffect(() => {
    const lock = async () => { try { if ('wakeLock' in navigator) wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (e) {} };
    lock();
    return () => wakeLockRef.current?.release();
  }, []);

  useEffect(() => {
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((b: any) => {
        setBatteryLevel(Math.round(b.level * 100));
        b.addEventListener('levelchange', () => setBatteryLevel(Math.round(b.level * 100)));
      });
    }
  }, []);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (speed < 5 && e.alpha !== null) {
        const bearing = 360 - e.alpha;
        setHeading(bearing);
        setCompassHeading(bearing);
      }
    };

    const handleGPS = (pos: GeolocationPosition) => {
      const { latitude, longitude, speed: gpsSpeed, heading: gpsHeading, accuracy } = pos.coords;
      const latLng: [number, number] = [latitude, longitude];
      const kph = gpsSpeed ? Math.round(gpsSpeed * 3.6) : 0;
      
      setUserPos(latLng);
      setSpeed(kph);
      setGpsAccuracy(accuracy);

      if (kph >= 5 && gpsHeading !== null && !isNaN(gpsHeading)) {
        setHeading(gpsHeading);
        setCompassHeading(gpsHeading);
      }

      if (destination && calculateDistance(latLng, destination.coords) < 50) {
        if (!origin) {
            setDestination(null);
            setRouteCoords([]);
            setRouteInfo({ distance: 0, duration: 0 });
            setNextStep(null);
            alert("DESTINO ALCANÇADO");
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    const watchId = navigator.geolocation.watchPosition(handleGPS, console.error, {
      enableHighAccuracy: true, maximumAge: 0, timeout: 2000
    });

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [destination, speed, origin]);

  const calculateRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`);
      const data = await res.json();
      if (data.routes?.[0]) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
        
        setRouteCoords(coords);
        setRouteInfo({ distance: route.distance / 1000, duration: route.duration / 60 });
        setIsFollowing(true);
        if (focusMode) setFocusMode(true); 

        if (route.legs[0].steps.length > 0) {
            const firstStep = route.legs[0].steps[0];
            const next = route.legs[0].steps[1] || firstStep;
            setNextStep({
                instruction: next.name || "Siga em frente",
                distance: next.distance,
                modifier: next.maneuver.modifier,
                type: next.maneuver.type
            });
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const startPoint = origin?.coords || userPos;
    if (startPoint && destination) {
       calculateRoute(startPoint, destination.coords);
    } else if (!destination) {
       setRouteCoords([]);
       setRouteInfo({ distance: 0, duration: 0 });
       setNextStep(null);
    }
  }, [origin, destination, userPos]);

  const handleMapSearchInput = (q: string, type: 'ORIGIN' | 'DEST') => {
    if (type === 'ORIGIN') setOriginQuery(q); else setDestQuery(q);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (q.length < 3) { setMapResults([]); return; }

    setIsMapLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=br&limit=5`, { signal: abortControllerRef.current.signal });
        const data = await res.json();
        setMapResults(data);
      } catch (e: any) { if (e.name !== 'AbortError') console.error(e); } 
      finally { setIsMapLoading(false); }
    }, 600);
  };

  const handleSelectPlace = (place: any) => {
    const coords: [number, number] = [parseFloat(place.lat), parseFloat(place.lon)];
    const name = place.display_name.split(',')[0];

    if (activeInput === 'ORIGIN') {
        setOrigin({ name, coords });
        setOriginQuery(name);
        setActiveInput('DEST');
    } else {
        setDestination({ name, coords });
        setDestQuery(name);
        setMenuMode(null);
        setFocusMode(true); // Entra em foco ao definir destino
    }
    setMapResults([]);
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-[#050b14] text-[#00F3FF] font-mono overflow-hidden flex flex-col select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        .font-cyber { font-family: 'Orbitron', sans-serif; }
        .glass-panel { background: rgba(0, 5, 16, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(0, 243, 255, 0.2); box-shadow: 0 0 40px rgba(0, 0, 0, 0.9); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00F3FF; }
      `}</style>

      {/* --- MAP COMPONENT --- */}
      <CyberMap 
        userPos={userPos}
        heading={heading}
        origin={origin}
        destination={destination}
        routeCoords={routeCoords}
        isFollowing={isFollowing}
        // Alteração Principal: Simplesmente define isFollowing como false, sem condições
        onDragStart={() => setIsFollowing(false)}
        is3D={focusMode}
      />

      {/* --- VIGNETTE --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-10" />

      {/* --- TOP HUD (TURN BY TURN) --- */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-center">
        {nextStep && destination ? (
            <motion.div 
                initial={{ y: -100 }} animate={{ y: 0 }}
                className="glass-panel px-6 py-4 flex items-center gap-6 rounded-b-2xl border-t-0 bg-black/90 pointer-events-auto border-b-2 border-b-[#00F3FF] shadow-[0_0_50px_rgba(0,243,255,0.2)]"
            >
                <div className="p-2 bg-[#00F3FF]/10 rounded-lg border border-[#00F3FF]/30 animate-pulse">
                    {getNavIcon(nextStep.modifier, nextStep.type)}
                </div>
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                         <span className="text-4xl font-black font-cyber text-white uppercase">{Math.round(nextStep.distance)}</span>
                         <span className="text-sm font-bold text-[#00F3FF]">METROS</span>
                    </div>
                    <span className="text-sm font-bold text-zinc-300 uppercase tracking-widest max-w-[250px] truncate">{nextStep.instruction}</span>
                </div>
            </motion.div>
        ) : (
            !focusMode && (
                <div className="flex justify-between w-full">
                    <div className="glass-panel px-4 py-2 flex items-center gap-3 rounded-bl-xl border-t-0 border-l-0 border-r-0 border-b border-[#00F3FF]/50 pointer-events-auto">
                        <Compass size={24} className="text-[#00F3FF] opacity-50" />
                        <span className="text-xl font-black font-cyber text-white">{Math.round(compassHeading)}°</span>
                    </div>

                    <div className="glass-panel px-4 py-2 flex items-center gap-4 rounded-br-xl pointer-events-auto">
                        <div className="flex items-center gap-2">
                            <Activity size={14} className={gpsAccuracy < 20 ? "text-green-500" : "text-yellow-500"} />
                            <span className="text-[9px] font-bold text-white">GPS {gpsAccuracy < 20 ? 'LOCKED' : 'SEARCH'}</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Battery size={14} className={batteryLevel > 20 ? "text-[#00F3FF]" : "text-red-500"} />
                            <span className="text-sm font-black text-white">{batteryLevel}%</span>
                        </div>
                        <button onClick={onExit} className="ml-2 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )
        )}
      </div>

      {/* --- SIDE CONTROLS --- */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4">
         {!focusMode && (
             <>
                <button onClick={() => { setIsFollowing(true); const target = userPos || origin?.coords; if(target) setIsFollowing(true); }} className={`glass-panel w-12 h-12 flex items-center justify-center rounded-full transition-all ${isFollowing ? 'text-[#00F3FF] border-[#00F3FF]' : 'text-zinc-500'}`}>
                    <Crosshair size={24} className={isFollowing ? 'animate-spin-slow' : ''} />
                </button>
                <button onClick={() => { setMenuMode('MAP'); setActiveInput('DEST'); }} className="glass-panel w-12 h-12 flex items-center justify-center rounded-full text-pink-500 hover:bg-pink-500 hover:text-white transition-colors">
                    <Navigation size={24} />
                </button>
             </>
         )}
         
         {/* BOTÃO PARA SAIR DO MODO FOCO (visível no HUD principal ou lateral) */}
         <button onClick={() => setFocusMode(!focusMode)} className={`glass-panel w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${focusMode ? 'bg-[#00F3FF] text-black scale-110 shadow-[0_0_20px_#00F3FF]' : 'text-[#00F3FF]'}`}>
            <Eye size={24} />
         </button>
         
         {/* SEGUIR/RECENTRALIZAR EM MODO FOCO (Novo Botão) */}
         {focusMode && !isFollowing && (
             <button onClick={() => setIsFollowing(true)} className="glass-panel w-12 h-12 flex items-center justify-center rounded-full text-yellow-500 animate-pulse border-yellow-500">
                <Crosshair size={24} />
             </button>
         )}
      </div>

      {/* --- EXIT FOCUS --- */}
      {focusMode && (
         <button onClick={() => setFocusMode(false)} className="absolute top-4 right-4 z-50 glass-panel w-12 h-12 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-red-500/20 hover:border-red-500 transition-colors">
            <X size={24} />
         </button>
      )}

      {/* --- BOTTOM DASHBOARD --- */}
      <div className="absolute bottom-6 left-6 right-6 z-50 flex items-end justify-between pointer-events-none">
          {/* SPEEDOMETER */}
          <div className="pointer-events-auto">
              <div className="flex items-baseline gap-1">
                 <span className="text-8xl font-black font-cyber text-white italic drop-shadow-[0_0_15px_#00F3FF]">
                    {speed}
                 </span>
                 <span className="text-xl font-bold text-pink-500 font-cyber mb-4">KM/H</span>
              </div>
              <div className="w-64 h-2 bg-zinc-900 skew-x-[-20deg] overflow-hidden border border-zinc-700">
                 <div className="h-full bg-gradient-to-r from-[#00F3FF] to-pink-500 transition-all duration-200" style={{ width: `${Math.min(speed, 200) / 2}%` }} />
              </div>
          </div>

          {/* COMPACT PLAYER */}
          <div className={`glass-panel p-3 flex flex-col gap-3 pointer-events-auto w-full border-l-4 border-l-[#00F3FF] transition-all duration-500 ${focusMode ? 'max-w-[220px] bg-black/80' : 'max-w-sm'}`}>
              <div className="flex items-center gap-3">
                 {!focusMode && (
                     <div className="w-12 h-12 bg-black border border-white/20 relative shrink-0">
                        {currentTrack?.thumbnail ? <img src={currentTrack.thumbnail} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center"><Activity className="text-[#00F3FF] animate-pulse"/></div>}
                     </div>
                 )}
                 <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{focusMode ? 'AUDIO LINK' : 'Tocando Agora'}</div>
                    <div className="text-sm font-black text-white uppercase truncate">{currentTrack?.title || "SISTEMA OCIOSO"}</div>
                    {!focusMode && <div className="text-xs font-bold text-[#00F3FF] truncate">{currentTrack?.artist || "..."}</div>}
                 </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                 {!focusMode && (
                     <button onClick={() => { setMenuMode('MUSIC'); setActiveMusicTab('SEARCH'); }} className="p-2 hover:bg-[#00F3FF] hover:text-black text-[#00F3FF] transition-colors rounded">
                        <Search size={18} />
                     </button>
                 )}
                 <div className={`flex items-center gap-4 ${focusMode ? 'w-full justify-between' : ''}`}>
                    <button onClick={onPrev}><SkipBack size={20} className="hover:text-white transition-colors" /></button>
                    <button onClick={onTogglePlay} className={`flex items-center justify-center bg-[#00F3FF] text-black rounded-sm hover:bg-white transition-colors ${focusMode ? 'w-8 h-8' : 'w-10 h-10'}`}>
                       {isPlaying ? <Pause size={focusMode ? 16 : 20} fill="black"/> : <Play size={focusMode ? 16 : 20} fill="black"/>}
                    </button>
                    <button onClick={onNext}><SkipForward size={20} className="hover:text-white transition-colors" /></button>
                 </div>
              </div>
          </div>
      </div>

      {/* --- MENUS --- */}
      <AnimatePresence>
        {menuMode && !focusMode && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[6000] bg-black/95 backdrop-blur-xl flex flex-col font-cyber"
          >
             <div className="p-4 border-b border-[#00F3FF]/30 flex justify-between items-center bg-[#050505]">
                <div className="flex items-center gap-3">
                   {menuMode === 'MAP' ? <Navigation size={24} className="text-pink-500"/> : <Music size={24} className="text-[#00F3FF]"/>}
                   <h2 className="text-xl font-black uppercase tracking-widest text-white">
                       {menuMode === 'MAP' ? "NAVEGAÇÃO" : "BANCO DE DADOS"}
                   </h2>
                </div>
                <button onClick={() => setMenuMode(null)} className="p-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                   <X size={24} />
                </button>
             </div>

             {menuMode === 'MAP' ? (
                 <div className="flex flex-col h-full">
                     <div className="p-6 space-y-4 bg-black/50">
                        {/* Origem */}
                        <div className={`flex items-center gap-3 p-2 border-b-2 transition-colors ${activeInput === 'ORIGIN' ? 'border-[#00F3FF]' : 'border-white/10'}`}>
                           <div className="p-2 bg-[#00F3FF]/20 rounded-full text-[#00F3FF]"><LocateFixed size={18}/></div>
                           <div className="flex-1">
                               <label className="text-[10px] text-zinc-500 font-bold">PONTO DE PARTIDA</label>
                               <div className="flex items-center">
                                   <input 
                                     type="text" 
                                     value={origin ? origin.name : originQuery} 
                                     onChange={(e) => { setOrigin(null); handleMapSearchInput(e.target.value, 'ORIGIN'); }}
                                     onFocus={() => { setActiveInput('ORIGIN'); if(!origin) setOriginQuery(''); }}
                                     placeholder={origin ? origin.name : "SUA LOCALIZAÇÃO (GPS)"}
                                     className={`w-full bg-transparent text-lg uppercase outline-none font-bold ${origin ? 'text-white' : 'text-[#00F3FF]'}`}
                                   />
                                   {origin && <button onClick={() => { setOrigin(null); setOriginQuery(''); setActiveInput('DEST'); }} className="text-[10px] bg-[#00F3FF]/10 text-[#00F3FF] px-2 py-1 rounded border border-[#00F3FF]/30">USAR GPS</button>}
                               </div>
                           </div>
                        </div>

                        {/* Destino */}
                        <div className={`flex items-center gap-3 p-2 border-b-2 transition-colors ${activeInput === 'DEST' ? 'border-pink-500' : 'border-white/10'}`}>
                           <div className="p-2 bg-pink-500/20 rounded-full text-pink-500"><Target size={18}/></div>
                           <div className="flex-1">
                               <label className="text-[10px] text-zinc-500 font-bold">DESTINO FINAL</label>
                               <input 
                                 autoFocus
                                 type="text" 
                                 value={destQuery} 
                                 onChange={(e) => handleMapSearchInput(e.target.value, 'DEST')}
                                 onFocus={() => setActiveInput('DEST')}
                                 placeholder="Pesquisar endereço..."
                                 className="w-full bg-transparent text-lg text-white uppercase outline-none font-bold"
                               />
                           </div>
                           {isMapLoading && <Loader2 className="animate-spin text-pink-500"/>}
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
                        {mapResults.map((place, i) => (
                           <button key={i} onClick={() => handleSelectPlace(place)} className="w-full p-4 border border-white/10 hover:border-[#00F3FF] hover:bg-[#00F3FF]/10 flex items-center gap-4 text-left transition-all group">
                              <MapPin size={20} className={`group-hover:text-[#00F3FF] ${activeInput === 'ORIGIN' ? 'text-[#00F3FF]' : 'text-pink-500'}`} />
                              <div>
                                 <div className="font-bold text-white uppercase">{place.display_name.split(',')[0]}</div>
                                 <div className="text-xs text-zinc-500 truncate max-w-lg">{place.display_name}</div>
                              </div>
                              <ArrowRight size={16} className="ml-auto text-zinc-600 group-hover:text-white"/>
                           </button>
                        ))}
                     </div>
                 </div>
             ) : (
                 <div className="flex flex-col h-full">
                     <div className="flex border-b border-white/10">
                        <button onClick={() => setActiveMusicTab('SEARCH')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-widest ${activeMusicTab === 'SEARCH' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border-b-2 border-[#00F3FF]' : 'text-zinc-500'}`}>Buscar</button>
                        <button onClick={() => setActiveMusicTab('PLAYLISTS')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-widest ${activeMusicTab === 'PLAYLISTS' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border-b-2 border-[#00F3FF]' : 'text-zinc-500'}`}>Playlists</button>
                     </div>

                     {activeMusicTab === 'SEARCH' ? (
                        <>
                           <div className="p-6 relative bg-black/50">
                              <input 
                                autoFocus
                                type="text" 
                                value={musicQuery}
                                onChange={(e) => { setMusicQuery(e.target.value); if(searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = setTimeout(() => { if(e.target.value.length >=2) onSearch(e.target.value); }, 800); }}
                                placeholder="Nome da música ou artista..."
                                className="w-full bg-white/5 border-2 border-transparent focus:border-[#00F3FF] p-4 text-xl text-white uppercase outline-none transition-all placeholder:text-zinc-600"
                              />
                              {isSearching && <Loader2 className="absolute right-8 top-8 animate-spin text-[#00F3FF]" />}
                           </div>
                           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
                              {playlist.map((track) => (
                                 <button key={track.id} onClick={() => { onSelectTrack(track); setMenuMode(null); }} 
                                         className={`w-full p-3 border hover:border-[#00F3FF] hover:bg-[#00F3FF]/10 flex items-center gap-4 text-left transition-all ${currentTrack?.id === track.id ? 'border-[#00F3FF] bg-[#00F3FF]/10' : 'border-white/5'}`}>
                                    <img src={track.thumbnail} className="w-12 h-12 object-cover border border-white/20" alt=""/>
                                    <div className="flex-1 min-w-0">
                                       <div className="font-bold text-white uppercase truncate">{track.title}</div>
                                       <div className="text-xs text-[#00F3FF] uppercase truncate">{track.artist}</div>
                                    </div>
                                    {currentTrack?.id === track.id && <Activity size={16} className="text-[#00F3FF] animate-pulse"/>}
                                 </button>
                              ))}
                           </div>
                        </>
                     ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-2 gap-4 content-start">
                           {userPlaylists.map((pl) => (
                              <button key={pl.id} onClick={() => { if(pl.tracks.length > 0) { onPlayPlaylist(pl.tracks); setMenuMode(null); } }} 
                                      className="p-4 bg-white/5 border border-white/10 hover:border-[#00F3FF] hover:bg-[#00F3FF]/10 flex flex-col items-center justify-center gap-3 transition-all aspect-square group">
                                 <List size={32} className="text-zinc-500 group-hover:text-[#00F3FF]" />
                                 <div className="text-center">
                                    <div className="font-bold text-white uppercase truncate max-w-full group-hover:text-[#00F3FF]">{pl.name}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase">{pl.tracks.length} Tracks</div>
                                 </div>
                              </button>
                           ))}
                           {userPlaylists.length === 0 && (
                              <div className="col-span-2 text-center text-zinc-500 py-10 uppercase text-xs">Nenhuma playlist criada</div>
                           )}
                        </div>
                     )}
                 </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}