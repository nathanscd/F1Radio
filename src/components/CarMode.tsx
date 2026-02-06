import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, X, Navigation, 
  Search, MapPin, Activity, List, 
  Loader2, Compass, Crosshair, Eye,
  ArrowUp, CornerUpLeft, CornerUpRight, Move, PlayCircle, ChevronLeft, Layers, Battery
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

const getNavIcon = (modifier: string | undefined) => {
    if (!modifier) return <ArrowUp className="w-8 h-8 md:w-12 md:h-12 text-[#00F3FF]" />;
    if (modifier.includes('left')) return <CornerUpLeft className="w-8 h-8 md:w-12 md:h-12 text-[#00F3FF]" />;
    if (modifier.includes('right')) return <CornerUpRight className="w-8 h-8 md:w-12 md:h-12 text-[#00F3FF]" />;
    if (modifier.includes('uturn')) return <Move className="w-8 h-8 md:w-12 md:h-12 text-[#00F3FF]" />;
    return <ArrowUp className="w-8 h-8 md:w-12 md:h-12 text-[#00F3FF]" />;
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
  const [nextStep, setNextStep] = useState<{ instruction: string, distance: number, modifier?: string } | null>(null);
  
  const [menuMode, setMenuMode] = useState<'MUSIC' | 'MAP' | null>(null);
  const [activeMusicTab, setActiveMusicTab] = useState<'SEARCH' | 'PLAYLISTS'>('SEARCH');
  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null);
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
            setNextStep(null);
            setFocusMode(false);
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
        setIsFollowing(true);

        if (route.legs[0].steps.length > 0) {
            const next = route.legs[0].steps[1] || route.legs[0].steps[0];
            setNextStep({
                instruction: next.name || "Siga em frente",
                distance: next.distance,
                modifier: next.maneuver.modifier
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
    }
    setMapResults([]);
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-[#050b14] text-[#00F3FF] font-mono overflow-hidden flex flex-col select-none">
      <CyberMap 
        userPos={userPos} heading={heading} origin={origin} destination={destination} 
        routeCoords={routeCoords} isFollowing={isFollowing} 
        onDragStart={() => setIsFollowing(false)} is3D={focusMode} 
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-10" />

      <div className="absolute top-0 left-0 right-0 z-50 p-2 md:p-4 pointer-events-none flex justify-center">
        {nextStep && destination ? (
            <motion.div initial={{ y: -100 }} animate={{ y: 0 }} className="glass-panel px-4 py-2 md:px-6 md:py-4 flex items-center gap-4 md:gap-6 rounded-b-2xl border-t-0 bg-black/90 pointer-events-auto border-b-2 border-b-[#00F3FF]">
                <div className="p-2 bg-[#00F3FF]/10 rounded-lg animate-pulse">
                    {getNavIcon(nextStep.modifier)}
                </div>
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                         <span className="text-2xl md:text-4xl font-black font-cyber text-white">{Math.round(nextStep.distance)}</span>
                         <span className="text-xs font-bold text-[#00F3FF]">M</span>
                    </div>
                    <span className="text-xs md:text-sm font-bold text-zinc-300 uppercase truncate max-w-[120px] md:max-w-[250px]">{nextStep.instruction}</span>
                </div>
            </motion.div>
        ) : (
            !focusMode && (
                <div className="flex justify-between w-full">
                    <div className="glass-panel px-3 py-1 flex items-center gap-2 rounded-bl-xl border-t-0 border-b border-[#00F3FF]/50 pointer-events-auto">
                        <Compass className="w-4 h-4 md:w-6 md:h-6 text-[#00F3FF] opacity-50" />
                        <span className="text-sm md:text-xl font-black font-cyber text-white">{Math.round(compassHeading)}°</span>
                    </div>
                    <div className="glass-panel px-3 py-1 flex items-center gap-3 rounded-br-xl pointer-events-auto">
                        <Activity className={`w-3 h-3 md:w-4 md:h-4 ${gpsAccuracy < 20 ? "text-green-500" : "text-yellow-500"}`} />
                        <Battery className={`w-3 h-3 md:w-4 md:h-4 ${batteryLevel > 20 ? "text-[#00F3FF]" : "text-red-500"}`} />
                        <button onClick={onExit} className="p-1 bg-red-500/10 text-red-500 rounded"><X size={14} /></button>
                    </div>
                </div>
            )
        )}
      </div>

      <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
         {!focusMode && (
             <>
                <button onClick={() => setIsFollowing(true)} className={`glass-panel w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full ${isFollowing ? 'text-[#00F3FF] border-[#00F3FF]' : 'text-zinc-500'}`}>
                    <Crosshair className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button onClick={() => { setMenuMode('MAP'); setActiveInput('DEST'); }} className="glass-panel w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-pink-500">
                    <Navigation className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button onClick={() => { setMenuMode('MUSIC'); setActiveMusicTab('SEARCH'); }} className="glass-panel w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-white">
                    <Layers className="w-5 h-5 md:w-6 md:h-6" />
                </button>
             </>
         )}
         {!!(origin || userPos) && !!destination && !focusMode && (
             <button onClick={() => { setFocusMode(true); setIsFollowing(true); }} className="glass-panel w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-[#00F3FF] text-black shadow-[0_0_20px_#00F3FF]">
                <PlayCircle className="w-6 h-6 md:w-8 md:h-8" />
             </button>
         )}
      </div>

      {focusMode && (
         <button onClick={() => setFocusMode(false)} className="absolute top-4 right-4 z-50 glass-panel px-3 py-1 flex items-center gap-2 rounded-full text-zinc-500">
            <span className="text-[10px] font-bold">PARAR</span>
            <X size={14} />
         </button>
      )}

      <div className="absolute bottom-2 left-2 right-2 md:bottom-6 md:left-6 md:right-6 z-50 flex items-end justify-between pointer-events-none gap-2">
          <div className="pointer-events-auto">
              <div className="flex items-baseline gap-1">
                 <span className="text-5xl md:text-8xl font-black font-cyber text-white italic drop-shadow-[0_0_15px_#00F3FF]">{speed}</span>
                 <span className="text-sm md:text-xl font-bold text-pink-500 font-cyber">KM/H</span>
              </div>
              <div className="w-32 md:w-64 h-1.5 bg-zinc-900 border border-zinc-700 rounded-full overflow-hidden">
                 <div className="h-full bg-[#00F3FF]" style={{ width: `${Math.min(speed, 180) / 1.8}%` }} />
              </div>
          </div>

          <div className={`glass-panel p-2 md:p-3 flex flex-col gap-2 pointer-events-auto w-full border-l-2 border-l-[#00F3FF] transition-all ${focusMode ? 'max-w-[140px] md:max-w-[220px]' : 'max-w-[180px] md:max-w-sm'}`}>
              <div className="flex items-center gap-2">
                 <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase truncate">{currentTrack?.title || "SISTEMA OCIOSO"}</div>
                    {!focusMode && <div className="text-[8px] text-[#00F3FF] truncate">{currentTrack?.artist || "STANDBY"}</div>}
                 </div>
              </div>
              <div className="flex items-center justify-between gap-1 border-t border-white/10 pt-1">
                 {!focusMode && <button onClick={() => { setMenuMode('MUSIC'); setActiveMusicTab('SEARCH'); }} className="text-[#00F3FF]"><Search size={14}/></button>}
                 <div className="flex items-center gap-3">
                    <button onClick={onPrev}><SkipBack size={16}/></button>
                    <button onClick={onTogglePlay} className="w-8 h-8 flex items-center justify-center bg-[#00F3FF] text-black rounded-full">
                       {isPlaying ? <Pause size={14} fill="black"/> : <Play size={14} fill="black"/>}
                    </button>
                    <button onClick={onNext}><SkipForward size={16}/></button>
                 </div>
              </div>
          </div>
      </div>

      <AnimatePresence>
        {menuMode && !focusMode && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 z-[6000] bg-black/95 backdrop-blur-xl flex flex-col font-cyber">
             <div className="p-4 border-b border-[#00F3FF]/30 flex justify-between items-center bg-[#050505]">
                <h2 className="text-lg md:text-xl font-black text-white uppercase">{menuMode === 'MAP' ? "NAVEGAÇÃO" : "DADOS"}</h2>
                <button onClick={() => { setMenuMode(null); setViewingPlaylist(null); }} className="text-red-500"><X size={24}/></button>
             </div>
             {menuMode === 'MAP' ? (
                 <div className="flex flex-col h-full overflow-hidden">
                     <div className="p-4 space-y-3">
                        <input value={origin ? origin.name : originQuery} onChange={(e) => { setOrigin(null); handleMapSearchInput(e.target.value, 'ORIGIN'); }} onFocus={() => setActiveInput('ORIGIN')} placeholder="Partida: GPS" className="w-full bg-white/5 p-3 text-sm text-[#00F3FF] outline-none border-b border-white/10"/>
                        <input value={destQuery} onChange={(e) => handleMapSearchInput(e.target.value, 'DEST')} onFocus={() => setActiveInput('DEST')} placeholder="Destino..." className="w-full bg-white/5 p-3 text-sm text-white outline-none border-b border-white/10"/>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {mapResults.map((place, i) => (
                           <button key={i} onClick={() => handleSelectPlace(place)} className="w-full p-3 border border-white/5 text-left text-xs uppercase text-zinc-400">{place.display_name.split(',')[0]}</button>
                        ))}
                     </div>
                 </div>
             ) : (
                 <div className="flex flex-col h-full overflow-hidden">
                     {!viewingPlaylist ? (
                         <>
                             <div className="flex border-b border-white/10 text-[10px] font-bold">
                                <button onClick={() => setActiveMusicTab('SEARCH')} className={`flex-1 p-3 ${activeMusicTab === 'SEARCH' ? 'text-[#00F3FF] border-b-2 border-[#00F3FF]' : 'text-zinc-500'}`}>FILA / BUSCA</button>
                                <button onClick={() => setActiveMusicTab('PLAYLISTS')} className={`flex-1 p-3 ${activeMusicTab === 'PLAYLISTS' ? 'text-[#00F3FF] border-b-2 border-[#00F3FF]' : 'text-zinc-500'}`}>PLAYLISTS</button>
                             </div>
                             {activeMusicTab === 'SEARCH' ? (
                                <>
                                   <div className="p-4"><input value={musicQuery} onChange={(e) => { setMusicQuery(e.target.value); if(searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = setTimeout(() => onSearch(e.target.value), 800); }} placeholder="Pesquisar..." className="w-full bg-white/5 p-3 text-sm text-white outline-none"/></div>
                                   <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                      {playlist.map((track) => (
                                         <button key={track.id} onClick={() => { onSelectTrack(track); setMenuMode(null); }} className="w-full p-2 border border-white/5 flex items-center gap-3 text-left">
                                            <img src={track.thumbnail} className="w-10 h-10 object-cover" alt=""/>
                                            <div className="flex-1 truncate text-[10px] text-white font-bold uppercase">{track.title}</div>
                                         </button>
                                      ))}
                                   </div>
                                </>
                             ) : (
                                <div className="p-4 grid grid-cols-2 gap-3">
                                   {userPlaylists.map((pl) => (
                                      <button key={pl.id} onClick={() => setViewingPlaylist(pl)} className="p-4 bg-white/5 border border-white/10 text-center uppercase text-[10px] font-bold text-white">{pl.name}</button>
                                   ))}
                                </div>
                             )}
                         </>
                     ) : (
                         <div className="flex flex-col h-full bg-black/50">
                             <button onClick={() => setViewingPlaylist(null)} className="p-4 flex items-center gap-2 text-[#00F3FF] text-xs font-bold"><ChevronLeft size={16}/> VOLTAR</button>
                             <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {viewingPlaylist.tracks.map((track) => (
                                    <button key={track.id} onClick={() => { onSelectTrack(track); setMenuMode(null); }} className="w-full p-2 border border-white/5 flex items-center gap-3 text-left">
                                       <img src={track.thumbnail} className="w-8 h-8 object-cover" alt=""/>
                                       <div className="flex-1 text-[10px] text-white uppercase truncate">{track.title}</div>
                                    </button>
                                ))}
                             </div>
                             <div className="p-4"><button onClick={() => { onPlayPlaylist(viewingPlaylist.tracks); setMenuMode(null); }} className="w-full bg-[#00F3FF] text-black font-black p-3 text-xs uppercase">Tocar Tudo</button></div>
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