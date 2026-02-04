import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Radio, Minimize2, Signal, Activity, Gauge, Zap, Cpu } from 'lucide-react';

declare global { interface Window { onYouTubeIframeAPIReady: () => void; YT: any; } }

const PLAYLIST = [
  { id: "8AYy-BcjRXg", title: "F1 Official Theme", artist: "Brian Tyler" },
  { id: "WWEs82u37Mw", title: "Lose My Mind", artist: "Don Toliver" },
  { id: "4TYv2PhG89A", title: "Smooth Operator", artist: "Sade" },
  { id: "ChxX3tR4mD0", title: "The Chain", artist: "Fleetwood Mac" },
  { id: "h8P-d0RV2Mk", title: "One Kiss (Monaco Mix)", artist: "Dua Lipa" },
  { id: "DeumyOzKqgI", title: "Skyfall", artist: "Adele" }
];

export default function F1RadioPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [telemetry, setTelemetry] = useState({ temp: 85, ers: 100, fuel: 45.2 });
  const [isStatic, setIsStatic] = useState(false);
  
  const playerRef = useRef<any>(null);
  const staticRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    staticRef.current = new Audio('https://www.soundjay.com/communication/radio-static-05.mp3');
    staticRef.current.volume = 0.15;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else { initPlayer(); }

    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const cur = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        if (dur > 0) setProgress((cur / dur) * 100);
      }
      if (isPlaying) {
        setTelemetry({
          temp: 80 + Math.floor(Math.random() * 15),
          ers: Math.max(0, 100 - (progress * 0.8)),
          fuel: Math.max(0, 45.2 - (progress * 0.1))
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [trackIndex, isPlaying, progress]);

  const initPlayer = () => {
    if (playerRef.current) try { playerRef.current.destroy(); } catch (e) {}
    playerRef.current = new window.YT.Player('yt-player', {
      height: '0', width: '0', videoId: PLAYLIST[trackIndex].id,
      playerVars: { autoplay: isPlaying ? 1 : 0, controls: 0 },
      events: { 
        onReady: (e: any) => isPlaying && e.target.playVideo(),
        onStateChange: (e: any) => e.data === 0 && handleNext()
      }
    });
  };

  const handleAction = (fn: () => void) => {
    setIsStatic(true);
    staticRef.current?.play().catch(() => {});
    setTimeout(() => { setIsStatic(false); fn(); }, 600);
  };

  const togglePlay = () => {
    if (isPlaying) playerRef.current?.pauseVideo();
    else playerRef.current?.playVideo();
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => handleAction(() => setTrackIndex((p) => (p + 1) % PLAYLIST.length));
  const handlePrev = () => handleAction(() => setTrackIndex((p) => (p - 1 + PLAYLIST.length) % PLAYLIST.length));

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-['Orbitron',sans-serif]">
      <div id="yt-player" className="hidden" />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[340px] bg-[#050505] border-[3px] border-[#1a1a1a] rounded-t-3xl rounded-b-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative"
          >
            {/* F1 Header Strip */}
            <div className="h-1.5 w-full flex">
              <div className="w-1/3 bg-[#FF0000]" /><div className="w-1/3 bg-white" /><div className="w-1/3 bg-[#FF0000]" />
            </div>

            <div className="p-5">
              {/* Top Bar */}
              <div className="flex justify-between items-center mb-6 text-[10px] font-bold tracking-[0.2em] text-zinc-500">
                <div className="flex items-center gap-2 text-[#FF0000]">
                  <Radio size={14} className="animate-pulse" /> <span>TEAM RADIO</span>
                </div>
                <div className="flex items-center gap-2">
                  <Signal size={12} className={isStatic ? "text-yellow-500" : "text-green-500"} />
                  <span>{isStatic ? "ENCRYPTING..." : "LIVE FEED"}</span>
                </div>
              </div>

              {/* Main Display (Cockpit Style) */}
              <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 mb-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                
                <div className="flex gap-4 items-center relative z-10">
                  <div className="relative">
                    <img src={`https://i.ytimg.com/vi/${PLAYLIST[trackIndex].id}/mqdefault.jpg`} className={`w-16 h-16 rounded-lg object-cover border border-zinc-700 transition-all ${isPlaying && !isStatic ? 'brightness-110' : 'grayscale'}`} alt="Track" />
                    {isPlaying && !isStatic && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FF0000] rounded-full flex items-center justify-center animate-bounce"><Activity size={10} className="text-white" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-white text-xs font-black uppercase truncate mb-1 ${isStatic ? 'blur-[2px]' : ''}`}>{PLAYLIST[trackIndex].title}</h3>
                    <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-tighter truncate">{PLAYLIST[trackIndex].artist}</p>
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800/50 text-[8px] font-mono">
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-600 flex items-center gap-1"><Gauge size={8} /> TYRE TEMP</span>
                    <span className={telemetry.temp > 95 ? "text-red-500" : "text-green-400"}>{telemetry.temp}°C</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-600 flex items-center gap-1"><Zap size={8} /> ERS</span>
                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${telemetry.ers}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-600 flex items-center gap-1"><Cpu size={8} /> FUEL</span>
                    <span className="text-white">{telemetry.fuel.toFixed(1)}L</span>
                  </div>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="relative mb-8 group">
                <input type="range" value={progress} onChange={(e) => playerRef.current?.seekTo((parseFloat(e.target.value)/100)*playerRef.current.getDuration())} className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-[#FF0000] rounded-full" />
                <div className="flex justify-between mt-2 text-[8px] font-mono text-zinc-600">
                  <span>LAP PROGRESS</span>
                  <span>{Math.floor(progress)}%</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-between items-center px-4">
                <button onClick={handlePrev} className="p-2 text-zinc-400 hover:text-white transition-colors"><SkipBack size={24} /></button>
                <button onClick={togglePlay} className="w-16 h-16 bg-[#FF0000] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.3)] hover:scale-105 active:scale-95 transition-all">
                  {isPlaying ? <Pause size={32} className="text-white" fill="currentColor" /> : <Play size={32} className="text-white ml-1" fill="currentColor" />}
                </button>
                <button onClick={handleNext} className="p-2 text-zinc-400 hover:text-white transition-colors"><SkipForward size={24} /></button>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="bg-[#0a0a0a] p-3 flex justify-center border-t border-zinc-900">
              <div className="flex gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#FF0000] animate-pulse' : 'bg-zinc-800'}`} style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`mt-4 w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 group shadow-2xl ${isOpen ? 'bg-white border-white text-black rotate-90' : 'bg-[#050505] border-zinc-800 text-white hover:border-[#FF0000]'}`}
      >
        {isOpen ? <Minimize2 size={28} /> : <div className="relative"><Radio size={28} className="group-hover:text-[#FF0000] transition-colors" />{isPlaying && <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF0000] rounded-full animate-ping" />}</div>}
      </button>
    </div>
  );
}
