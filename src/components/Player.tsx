import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, Radio, Minimize2, 
  Signal, Activity, Gauge, Zap, Cpu, Wind, Shield, 
  AlertTriangle, Settings, List, Volume2
} from 'lucide-react';

declare global { interface Window { onYouTubeIframeAPIReady: () => void; YT: any; } }

interface Track { id: string; title: string; artist: string; thumbnail: string; }

interface F1RadioPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  playlist: Track[];
  onPlayerReady: (player: any) => void;
  onStateChange: (state: any) => void;
}

export default function F1RadioPlayer({ 
  currentTrack, isPlaying, onTogglePlay, onNext, onPrev, 
  playlist, onPlayerReady, onStateChange 
}: F1RadioPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isStatic, setIsStatic] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [drsActive, setDrsActive] = useState(false);
  
  // Telemetry state
  const [telemetry, setTelemetry] = useState({
    speed: 0,
    rpm: 0,
    temp: 85,
    ers: 100,
    fuel: 45.2,
    gForce: 0
  });

  const playerRef = useRef<any>(null);
  const staticRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Static Effect
  useEffect(() => {
    staticRef.current = new Audio('https://www.soundjay.com/communication/radio-static-05.mp3');
    staticRef.current.volume = 0.1;
  }, []);

  // YouTube API Logic
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else { initPlayer(); }
  }, [currentTrack.id]);

  const initPlayer = () => {
    if (playerRef.current) try { playerRef.current.destroy(); } catch (e) {}
    playerRef.current = new window.YT.Player('yt-player', {
      height: '0', width: '0', videoId: currentTrack.id,
      playerVars: { autoplay: isPlaying ? 1 : 0, controls: 0, disablekb: 1, modestbranding: 1 },
      events: { 
        onReady: (e: any) => {
          onPlayerReady(e.target);
          e.target.setVolume(volume);
          if (isPlaying) e.target.playVideo();
        },
        onStateChange: (e: any) => onStateChange(e.data)
      }
    });
  };

  // Dynamic Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const cur = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        if (dur > 0) setProgress((cur / dur) * 100);
      }

      if (isPlaying && !isStatic) {
        setTelemetry(prev => ({
          speed: 280 + Math.floor(Math.random() * 45),
          rpm: 10500 + Math.floor(Math.random() * 2000),
          temp: 90 + Math.floor(Math.random() * 10),
          ers: Math.max(0, 100 - (progress * 0.8)),
          fuel: Math.max(0, 45.2 - (progress * 0.05)),
          gForce: (Math.random() * 4.5).toFixed(1) as any
        }));
        setDrsActive(Math.random() > 0.7);
      } else {
        setTelemetry(prev => ({ ...prev, speed: 0, rpm: 0, gForce: 0 }));
        setDrsActive(false);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, isStatic, progress]);

  const handleAction = (fn: () => void) => {
    setIsStatic(true);
    staticRef.current?.play().catch(() => {});
    setTimeout(() => { setIsStatic(false); fn(); }, 500);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    playerRef.current?.setVolume(newVol);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-['Orbitron',sans-serif]">
      <div id="yt-player" className="hidden" />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="w-[380px] bg-[#050505] border-[3px] border-[#1a1a1a] rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden relative"
          >
            {/* F1 LED Bar */}
            <div className="h-2 w-full flex gap-1 px-4 pt-2">
              {[...Array(15)].map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                  !isPlaying ? 'bg-zinc-800' : 
                  i < 5 ? 'bg-green-500' : 
                  i < 10 ? 'bg-red-500' : 'bg-blue-500'
                }`} />
              ))}
            </div>

            <div className="p-6">
              {/* Header Info */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-600 animate-ping' : 'bg-zinc-700'}`} />
                  <span className="text-[10px] font-bold text-zinc-400 tracking-[0.2em]">COMMS: {isStatic ? 'INTERFERENCE' : 'STABLE'}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowPlaylist(!showPlaylist)} className={`text-zinc-500 hover:text-white transition-colors ${showPlaylist ? 'text-red-500' : ''}`}><List size={16} /></button>
                  <button className="text-zinc-500 hover:text-white transition-colors"><Settings size={16} /></button>
                </div>
              </div>

              {/* Main Display Area */}
              <div className="relative h-48 mb-6">
                <AnimatePresence mode="wait">
                  {showPlaylist ? (
                    <motion.div key="playlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0a0a] rounded-2xl border border-zinc-800 p-3 overflow-y-auto custom-scrollbar">
                      {playlist.map((t, i) => (
                        <div key={t.id} onClick={() => handleAction(() => onNext())} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer mb-1 transition-colors ${currentTrack.id === t.id ? 'bg-red-600/20 border border-red-600/30' : 'hover:bg-white/5'}`}>
                          <span className="text-[10px] font-mono text-zinc-600">{i+1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white font-bold truncate uppercase">{t.title}</p>
                            <p className="text-[8px] text-zinc-500 truncate uppercase">{t.artist}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0a0a] rounded-2xl border border-zinc-800 p-4 overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
                      
                      {/* Track Info */}
                      <div className="flex gap-4 items-center mb-4 relative z-10">
                        <div className="relative">
                          <img src={currentTrack.thumbnail} className={`w-16 h-16 rounded-xl object-cover border border-zinc-800 transition-all ${isPlaying && !isStatic ? 'brightness-110' : 'grayscale'}`} alt="" />
                          {drsActive && <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded italic shadow-lg">DRS</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-white text-sm font-black uppercase truncate mb-1 ${isStatic ? 'blur-[3px]' : ''}`}>{currentTrack.title}</h3>
                          <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-tighter">{currentTrack.artist}</p>
                        </div>
                      </div>

                      {/* Speed & RPM Telemetry */}
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-black/40 p-2 rounded-lg border border-zinc-800/50">
                          <span className="text-[8px] text-zinc-600 block mb-1 uppercase">Velocity</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white italic">{telemetry.speed}</span>
                            <span className="text-[8px] text-zinc-500">KM/H</span>
                          </div>
                        </div>
                        <div className="bg-black/40 p-2 rounded-lg border border-zinc-800/50">
                          <span className="text-[8px] text-zinc-600 block mb-1 uppercase">G-Force</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-red-500 italic">{telemetry.gForce}</span>
                            <span className="text-[8px] text-zinc-500">G</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Advanced Telemetry Bar */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase"><span>ERS</span><span>{Math.floor(telemetry.ers)}%</span></div>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${telemetry.ers}%` }} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase"><span>FUEL</span><span>{telemetry.fuel.toFixed(1)}L</span></div>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(telemetry.fuel/45.2)*100}%` }} /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase"><span>TEMP</span><span>{telemetry.temp}°C</span></div>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${telemetry.temp > 95 ? 'bg-red-600' : 'bg-blue-400'}`} style={{ width: `${(telemetry.temp/110)*100}%` }} /></div>
                </div>
              </div>

              {/* Progress & Volume Controls */}
              <div className="space-y-4 mb-8">
                <div className="relative group">
                  <input type="range" value={progress} onChange={(e) => playerRef.current?.seekTo((parseFloat(e.target.value)/100)*playerRef.current.getDuration())} className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-red-600 rounded-full" />
                  <div className="flex justify-between mt-2 text-[8px] font-mono text-zinc-600 uppercase tracking-widest"><span>Lap Progress</span><span>{Math.floor(progress)}%</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <Volume2 size={14} className="text-zinc-500" />
                  <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="flex-1 h-1 bg-zinc-800 appearance-none cursor-pointer accent-white rounded-full" />
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex justify-between items-center px-2">
                <button onClick={() => handleAction(onPrev)} className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-90"><SkipBack size={24} /></button>
                <button onClick={onTogglePlay} className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 transition-all border-b-4 border-red-800">
                  {isPlaying ? <Pause size={32} className="text-white" fill="currentColor" /> : <Play size={32} className="text-white ml-1" fill="currentColor" />}
                </button>
                <button onClick={() => handleAction(onNext)} className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-90"><SkipForward size={24} /></button>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="bg-[#0a0a0a] p-3 border-t border-zinc-900 flex justify-between items-center px-6">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: `${i*0.3}s` }} />)}
              </div>
              <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Sector 3: Purple</span>
              <Activity size={12} className="text-red-600" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`mt-4 w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 group shadow-2xl ${isOpen ? 'bg-white border-white text-black rotate-90' : 'bg-[#050505] border-zinc-800 text-white hover:border-red-600'}`}
      >
        {isOpen ? <Minimize2 size={28} /> : (
          <div className="relative">
            <Radio size={28} className="group-hover:text-red-600 transition-colors" />
            {isPlaying && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />}
          </div>
        )}
      </button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF0000; }
      `}</style>
    </div>
  );
}
