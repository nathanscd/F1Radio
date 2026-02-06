import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, VolumeX, ChevronDown, Maximize2, Minimize2,
  Terminal, Cpu, Disc, Radio, Search, X, ChevronUp
} from 'lucide-react';

declare global { 
  interface Window { 
    onYouTubeIframeAPIReady: () => void; 
    YT: any; 
  } 
}

interface Track { 
  id: string; 
  title: string; 
  artist: string; 
  thumbnail: string; 
}

interface CyberPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSearch: (query: string) => void;
  playlist: Track[];
  onPlayerReady: (player: any) => void;
  onStateChange: (state: any) => void;
  onSelectTrack: (track: Track) => void;
}

const MOCK_LYRICS = [
  "System initializing...",
  "Loading neural pathways...",
  "Encrypting audio stream...",
  "Target acquired...",
  "Syncing beats per minute...",
  "Buffer overflow protected...",
  "Connection secure."
];

const CLIPS = {
  CHAMFER: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
  CHAMFER_BTN: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)",
};

const GlitchText = ({ text, active }: { text: string, active: boolean }) => (
  <div className="relative inline-block truncate max-w-full">
    <span className="relative z-10 truncate">{text}</span>
    {active && (
      <>
        <span className="absolute top-0 left-0 -z-10 text-[#FF003C] translate-x-[2px] opacity-70 animate-pulse truncate">{text}</span>
        <span className="absolute top-0 left-0 -z-20 text-[#00F3FF] -translate-x-[2px] opacity-70 animate-pulse truncate">{text}</span>
      </>
    )}
  </div>
);

const CyberVolumeBar = ({ volume, isMuted, onChange, onToggleMute }: { volume: number, isMuted: boolean, onChange: (e: any) => void, onToggleMute: () => void }) => {
  const segments = 20;
  return (
    <div className="flex items-center gap-3 w-full group select-none">
      <button 
        onClick={onToggleMute} 
        className={`relative w-8 h-8 flex items-center justify-center border transition-all ${isMuted ? 'border-[#FF003C] text-[#FF003C] bg-[#FF003C]/10' : 'border-[#00F3FF]/30 text-zinc-500 hover:text-[#00F3FF] hover:border-[#00F3FF]'}`}
      >
         {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      <div className="flex-1 h-6 relative flex gap-[2px] items-center cursor-pointer group/bar">
        <input 
          type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={onChange} 
          className="absolute inset-0 z-20 w-full h-full opacity-0 cursor-pointer"
        />
        {Array.from({ length: segments }).map((_, i) => {
          const threshold = (i + 1) * (100 / segments);
          const isActive = !isMuted && volume >= threshold;
          return (
            <div 
              key={i}
              className={`flex-1 transition-all duration-150 ease-out relative ${isActive ? 'bg-[#00F3FF] shadow-[0_0_5px_#00F3FF]' : 'bg-[#111] border border-[#222]'}`}
              style={{ height: isActive ? '80%' : '40%', transform: isActive ? 'skewX(-10deg)' : 'skewX(0deg)' }}
            />
          );
        })}
        <div className="absolute -top-5 right-0 text-[9px] font-mono text-[#00F3FF] opacity-0 group-hover/bar:opacity-100 transition-opacity bg-black px-1 border border-[#00F3FF]">
            GAIN: {isMuted ? 'ERR' : volume}%
        </div>
      </div>
    </div>
  );
};

const QuickSearch = ({ onSearch, onClose }: { onSearch: (q: string) => void, onClose: () => void }) => {
  const [val, setVal] = useState("");
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
      className="absolute top-0 left-0 w-full h-16 bg-[#0a0a0a] border-b border-[#00F3FF] z-50 flex items-center px-4 gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
    >
      <Terminal size={18} className="text-[#00F3FF] animate-pulse" />
      <input 
        autoFocus
        type="text" 
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if(e.key === 'Enter') { onSearch(val); onClose(); } }}
        placeholder="SEARCH_DATABASE..."
        className="flex-1 bg-transparent border-none outline-none text-[#00F3FF] font-mono uppercase text-sm placeholder-[#004444]"
      />
      <button onClick={onClose} className="p-2 text-[#FF003C] hover:bg-[#FF003C]/10"><X size={18}/></button>
    </motion.div>
  );
};

export default function CyberPlayer({ 
  currentTrack, isPlaying, onTogglePlay, onNext, onPrev, 
  playlist, onPlayerReady, onStateChange, onSearch
}: CyberPlayerProps) {
  
  const [viewMode, setViewMode] = useState<'mini' | 'medium' | 'full'>('mini');
  const [showSearch, setShowSearch] = useState(false);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [forcePortrait, setForcePortrait] = useState(false); 
  
  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);
  const watchdogInterval = useRef<any>(null);

  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const onTogglePlayRef = useRef(onTogglePlay);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
    onTogglePlayRef.current = onTogglePlay;
    onStateChangeRef.current = onStateChange;
  }, [onNext, onPrev, onTogglePlay, onStateChange]);

  useEffect(() => {
    const check = () => {
        const mobile = window.innerWidth < 1024;
        const land = window.innerWidth > window.innerHeight && mobile;
        setIsMobile(mobile);
        setIsLandscape(land);
        if (!land) setForcePortrait(false);
        if (mobile && !land) {
            setViewMode(prev => prev === 'medium' ? 'mini' : prev);
        }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setGlitchTrigger(true);
      setTimeout(() => setGlitchTrigger(false), 300);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack.id) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: [{ src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', () => {
         onTogglePlayRef.current();
         if(playerRef.current) playerRef.current.playVideo();
      });
      navigator.mediaSession.setActionHandler('pause', () => onTogglePlayRef.current());
      navigator.mediaSession.setActionHandler('previoustrack', () => onPrevRef.current());
      navigator.mediaSession.setActionHandler('nexttrack', () => onNextRef.current());
    }
  }, [currentTrack]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && playerRef.current) {
         setTimeout(() => {
             playerRef.current.playVideo();
         }, 100);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPlaying]);

  useEffect(() => {
    if (watchdogInterval.current) clearInterval(watchdogInterval.current);
    if (isPlaying) {
      watchdogInterval.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
          const ytState = playerRef.current.getPlayerState();
          if (ytState === 2 || ytState === 5) {
            playerRef.current.playVideo();
          }
        }
      }, 1000);
    }
    return () => clearInterval(watchdogInterval.current);
  }, [isPlaying]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }
  }, []);

  const initializePlayer = () => {
    if (playerRef.current) return;
    playerRef.current = new window.YT.Player('yt-player-phantom', {
      height: '100%', width: '100%',
      videoId: currentTrack.id,
      playerVars: { 
        autoplay: 1, controls: 0, disablekb: 1, 
        playsinline: 1, rel: 0, enablejsapi: 1, 
        origin: window.location.origin
      },
      events: {
        onReady: (e: any) => {
          onPlayerReady(e.target);
          e.target.setVolume(volume);
          if(isPlaying) e.target.playVideo();
        },
        onStateChange: (e: any) => {
          if (onStateChangeRef.current) onStateChangeRef.current(e.data);
          if(e.data === 0 && onNextRef.current) onNextRef.current();
        }
      }
    });
  };

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      const currentId = playerRef.current.getVideoData()?.video_id;
      if (currentId !== currentTrack.id) {
        playerRef.current.loadVideoById({ videoId: currentTrack.id, startSeconds: 0 });
      }
    }
  }, [currentTrack.id]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      const state = playerRef.current.getPlayerState();
      if (isPlaying && state !== 1 && state !== 3) playerRef.current.playVideo();
      else if (!isPlaying && state === 1) playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    progressInterval.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const cur = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        setCurrentTime(cur);
        setDuration(dur);
        if (dur > 0) setProgress((cur / dur) * 100);
      }
    }, 500);
    return () => clearInterval(progressInterval.current);
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    playerRef.current?.seekTo(newTime, true);
    setProgress(parseFloat(e.target.value));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    playerRef.current?.setVolume(vol);
    if(vol > 0 && playerRef.current?.isMuted()) playerRef.current.unMute();
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 50);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const formatTime = (s: number) => {
    if (!s) return "00:00";
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleMiniPlayerClick = () => {
    if (isMobile) {
        if (isLandscape) {
            setForcePortrait(false); 
        } else {
            setViewMode('full');
        }
    } else {
        setViewMode('medium');
    }
  };

  const getMiniPlayerClasses = () => {
    if (isMobile) {
        if (isLandscape && forcePortrait) {
             return "bottom-4 right-4 w-80 border border-[#00F3FF]/40 rounded-sm bg-[#020202]";
        }
        return "bottom-0 left-0 w-full border-t border-[#00F3FF]/40 bg-[#020202]";
    }
    return "bottom-8 right-8 w-80 border border-[#00F3FF]/40 bg-[#020202]";
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none z-[-1] overflow-hidden">
         <div id="yt-player-phantom" />
      </div>
      
      <style>{`
        .clip-chamfer { clip-path: ${CLIPS.CHAMFER}; }
        .clip-chamfer-btn { clip-path: ${CLIPS.CHAMFER_BTN}; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00F3FF; }
        @keyframes noise { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-5%, -5%); } 50% { transform: translate(-10%, 5%); } 100% { transform: translate(0, 0); } }
        .animate-noise { animation: noise 0.2s steps(5) infinite; }
      `}</style>

      {isMobile && isLandscape && !forcePortrait ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] bg-[#020202] flex p-4 gap-6 overflow-hidden border-[4px] border-[#00F3FF]/20"
        >
          <button 
            onClick={() => {
                setForcePortrait(true);
                setViewMode('mini');
            }} 
            className="absolute top-4 right-4 z-50 p-2 border border-[#FF003C] text-[#FF003C] bg-black/80 hover:bg-[#FF003C] hover:text-black transition-all clip-chamfer shadow-[0_0_10px_#FF003C]"
          >
            <Minimize2 size={24} />
          </button>

          <div className="w-1/3 h-full relative border border-[#00F3FF]/40 bg-black/50 overflow-hidden">
             <img src={currentTrack.thumbnail} className="w-full h-full object-cover opacity-60" alt="" />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#00F3FF] flex items-center justify-center animate-pulse">
                   <Disc size={40} className={`text-[#00F3FF] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                </div>
             </div>
             {glitchTrigger && <div className="absolute inset-0 bg-[#00F3FF]/20 animate-noise mix-blend-screen" />}
          </div>

          <div className="flex-1 flex flex-col justify-between py-2">
             <div>
                <div className="flex items-center gap-2 text-[#FF003C] text-[10px] font-black uppercase tracking-widest mb-1">
                   <Radio size={12} /> DECK_MODE_ENGAGED
                </div>
                <h1 className="text-2xl font-black text-white uppercase truncate leading-none">
                   <GlitchText text={currentTrack.title} active={glitchTrigger} />
                </h1>
                <p className="text-lg text-[#00F3FF] font-mono truncate">{currentTrack.artist}</p>
             </div>

             <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-500">
                   <span>{formatTime(currentTime)}</span>
                   <span>{formatTime(duration)}</span>
                </div>
                <div className="h-8 w-full bg-[#111] border border-[#333] relative">
                   <div className="absolute top-0 left-0 h-full bg-[#00F3FF] shadow-[0_0_15px_#00F3FF]" style={{ width: `${progress}%` }} />
                   <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                </div>
             </div>

             <div className="flex items-center justify-between gap-4">
                <button onClick={onPrev} className="flex-1 h-20 bg-[#111] border border-[#333] active:border-[#00F3FF] active:bg-[#00F3FF]/20 flex items-center justify-center transition-all clip-chamfer-btn">
                   <SkipBack size={32} className="text-white" />
                </button>
                <button onClick={onTogglePlay} className="flex-1 h-20 bg-[#00F3FF] text-black border border-[#00F3FF] flex items-center justify-center shadow-[0_0_20px_#00F3FF] active:scale-95 transition-all clip-chamfer-btn">
                   {isPlaying ? <Pause size={40} fill="black" /> : <Play size={40} fill="black" />}
                </button>
                <button onClick={onNext} className="flex-1 h-20 bg-[#111] border border-[#333] active:border-[#00F3FF] active:bg-[#00F3FF]/20 flex items-center justify-center transition-all clip-chamfer-btn">
                   <SkipForward size={32} className="text-white" />
                </button>
             </div>
          </div>
        </motion.div>
      ) : (
      
      <AnimatePresence mode="wait">
        <motion.div
          key="unified-player"
          layoutId="cyber-player-container"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed z-[500] overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.1)] 
            ${viewMode === 'full' ? 'inset-0 bg-[#020202]' : getMiniPlayerClasses()}
            ${viewMode === 'medium' && !isMobile ? 'bottom-8 right-8 w-[400px] h-[500px] border border-[#00F3FF]/40 bg-[#020202]' : ''}
          `}
          style={{ clipPath: viewMode === 'full' ? 'none' : CLIPS.CHAMFER }}
        >
          <AnimatePresence>
            {showSearch && <QuickSearch onSearch={onSearch} onClose={() => setShowSearch(false)} />}
          </AnimatePresence>

          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,transparent_24%,#00F3FF_25%,#00F3FF_26%,transparent_27%,transparent_74%,#00F3FF_75%,#00F3FF_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,#00F3FF_25%,#00F3FF_26%,transparent_27%,transparent_74%,#00F3FF_75%,#00F3FF_76%,transparent_77%,transparent)] bg-[size:50px_50px]" />
             {glitchTrigger && viewMode === 'mini' && <div className="absolute inset-0 bg-[#00F3FF]/20 animate-noise mix-blend-screen" />}
          </div>

          {viewMode === 'mini' && (
            <div className="w-full h-full flex items-center p-4 gap-4 relative" onClick={handleMiniPlayerClick}>
               <div className="h-12 w-12 md:h-16 md:w-16 bg-zinc-900 relative shrink-0">
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover grayscale opacity-80" alt="" />
                  {glitchTrigger && <div className="absolute inset-0 bg-[#FF003C] mix-blend-overlay translate-x-1" />}
               </div>
               <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className={`text-xs font-black uppercase text-white truncate ${glitchTrigger ? 'translate-x-1 text-[#00F3FF]' : ''}`}>
                     {currentTrack.title}
                  </div>
                  <div className="text-[10px] text-[#00F3FF] font-mono truncate opacity-70">
                     {glitchTrigger ? "ERR_CONNECTION" : currentTrack.artist}
                  </div>
                  <div className="w-full h-[2px] bg-zinc-800 mt-2 relative">
                     <div className="absolute top-0 left-0 h-full bg-[#00F3FF]" style={{ width: `${progress}%` }} />
                  </div>
               </div>
               <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                  <button onClick={onTogglePlay} className="w-10 h-10 bg-[#00F3FF]/10 border border-[#00F3FF] flex items-center justify-center text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black transition-colors rounded-full md:rounded-none">
                     {isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}
                  </button>
                  <div className="text-zinc-500 hover:text-[#00F3FF] pointer-events-none">
                      <ChevronUp size={20} />
                  </div>
               </div>
            </div>
          )}

          {viewMode === 'medium' && !isMobile && (
            <div className="w-full h-full flex flex-col relative">
               <div className="h-10 border-b border-[#00F3FF]/20 flex items-center justify-between px-4 bg-[#00F3FF]/5">
                  <span className="text-[10px] font-bold text-[#00F3FF] uppercase tracking-widest animate-pulse">Neural_Link_v4</span>
                  <div className="flex gap-4">
                     <button onClick={() => setShowSearch(!showSearch)} className="text-zinc-500 hover:text-[#00F3FF]"><Search size={14}/></button>
                     <button onClick={() => setViewMode('full')} className="text-zinc-500 hover:text-[#00F3FF]"><Maximize2 size={14}/></button>
                     <button onClick={() => setViewMode('mini')} className="text-zinc-500 hover:text-[#00F3FF]"><ChevronDown size={16}/></button>
                  </div>
               </div>
               <div className="flex-1 relative overflow-hidden group">
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020202] to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                     <h2 className="text-xl font-black text-white uppercase leading-none mb-1 drop-shadow-md">{currentTrack.title}</h2>
                     <p className="text-sm text-[#00F3FF] font-mono uppercase">{currentTrack.artist}</p>
                  </div>
               </div>
               <div className="p-6 bg-[#020202] border-t border-[#00F3FF]/20 space-y-6">
                  <div className="space-y-1">
                     <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                     </div>
                     <div className="h-2 w-full bg-[#001010] border border-[#004444] relative group cursor-pointer">
                        <div className="absolute top-0 left-0 h-full bg-[#00F3FF] shadow-[0_0_10px_#00F3FF]" style={{ width: `${progress}%` }} />
                        <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <button className="text-zinc-600 hover:text-[#00F3FF]"><Radio size={16}/></button>
                     <div className="flex items-center gap-4">
                        <button onClick={onPrev} className="p-2 border border-zinc-800 hover:border-[#00F3FF] text-zinc-500 hover:text-[#00F3FF] transition-all"><SkipBack size={20}/></button>
                        <button onClick={onTogglePlay} className="w-14 h-14 bg-black border-2 border-[#00F3FF] flex items-center justify-center text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black transition-all shadow-[0_0_20px_#00F3FF]">
                           {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1"/>}
                        </button>
                        <button onClick={onNext} className="p-2 border border-zinc-800 hover:border-[#00F3FF] text-zinc-500 hover:text-[#00F3FF] transition-all"><SkipForward size={20}/></button>
                     </div>
                     <button className="text-zinc-600 hover:text-[#00F3FF]"><Disc size={16}/></button>
                  </div>
                  <div className="pt-2">
                     <CyberVolumeBar volume={volume} isMuted={isMuted} onChange={handleVolume} onToggleMute={toggleMute} />
                  </div>
               </div>
            </div>
          )}

          {viewMode === 'full' && (
            <div className="w-full h-full flex flex-col p-4 lg:p-8 relative bg-black">
               <div className="flex justify-between items-center mb-8 border-b border-[#00F3FF]/20 pb-4">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-[#00F3FF] flex items-center justify-center text-black font-black animate-pulse"><Radio size={20} /></div>
                     <div>
                        <div className="text-[10px] text-[#00F3FF] uppercase tracking-[0.3em]">System_Override</div>
                        <div className="text-xl font-black text-white tracking-tighter">CYBER_DECK_PRO</div>
                     </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setShowSearch(!showSearch)} className="p-3 border border-zinc-800 hover:border-[#00F3FF] hover:text-[#00F3FF] text-zinc-500 transition-all"><Search size={24}/></button>
                    <button onClick={() => setViewMode(isMobile ? 'mini' : 'medium')} className="p-3 border border-zinc-800 hover:border-[#FF003C] hover:text-[#FF003C] text-zinc-500 transition-all">
                       {isMobile ? <ChevronDown size={24} /> : <Minimize2 size={24} />}
                    </button>
                  </div>
               </div>
               
               <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto lg:overflow-visible custom-scrollbar pb-10 lg:pb-0">
                  <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
                     <div className="aspect-square relative border border-[#00F3FF]/30 p-2">
                        <img src={currentTrack.thumbnail} className="w-full h-full object-cover grayscale opacity-80" alt="" />
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none" />
                     </div>
                     <div className="flex-1 border border-zinc-800 bg-[#050505] p-4 font-mono text-xs text-zinc-500 space-y-4">
                        <div className="flex items-center gap-2 text-[#FF003C] border-b border-zinc-800 pb-2"><Cpu size={14} /> SYSTEM_DIAGNOSTICS</div>
                        <div className="space-y-4 pt-2">
                           <div className="text-[10px] text-[#00F3FF] mb-1">AUDIO_OUTPUT_GAIN</div>
                           <CyberVolumeBar volume={volume} isMuted={isMuted} onChange={handleVolume} onToggleMute={toggleMute} />
                        </div>
                        <div className="mt-auto pt-4 text-[10px] opacity-50">UPLINK_ID: {currentTrack.id}<br/>STATUS: ENCRYPTED</div>
                     </div>
                  </div>
                  
                  <div className="lg:col-span-6 flex flex-col justify-center items-center relative py-6">
                     <div className="lg:hidden w-64 h-64 mb-8 border border-[#00F3FF]/30 p-1 relative shadow-[0_0_30px_rgba(0,243,255,0.1)]">
                        <img src={currentTrack.thumbnail} className="w-full h-full object-cover" alt="" />
                     </div>
                     <div className="text-center space-y-4 mb-12 w-full">
                        <h1 className="text-2xl md:text-3xl lg:text-6xl font-black text-white uppercase leading-none tracking-tighter break-words px-4">
                           <GlitchText text={currentTrack.title} active={glitchTrigger} />
                        </h1>
                        <div className="inline-block px-4 py-1 border border-[#00F3FF] text-[#00F3FF] font-mono uppercase text-sm lg:text-lg">{currentTrack.artist}</div>
                     </div>
                     <div className="w-full max-w-2xl space-y-2 mb-10 px-4">
                        <div className="flex justify-between text-xs font-mono text-[#00F3FF]/60">
                           <span>{formatTime(currentTime)}</span>
                           <span>{formatTime(duration)}</span>
                        </div>
                        <div className="h-6 w-full bg-[#001010] border border-[#004444] relative group cursor-pointer skew-x-[-10deg]">
                           <div className="absolute top-0 left-0 h-full bg-[#00F3FF] shadow-[0_0_15px_#00F3FF]" style={{ width: `${progress}%` }} />
                           <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                     </div>
                     <div className="flex items-center gap-6 lg:gap-16">
                        <button onClick={onPrev} className="p-4 border border-zinc-800 text-zinc-500 hover:text-[#00F3FF] hover:border-[#00F3FF] transition-all bg-black skew-x-[-10deg]"><SkipBack size={24} className="skew-x-[10deg]"/></button>
                        <button onClick={onTogglePlay} className="w-20 h-20 md:w-24 md:h-24 bg-black border-2 border-[#00F3FF] flex items-center justify-center group hover:bg-[#00F3FF] hover:text-black transition-all shadow-[0_0_40px_rgba(0,243,255,0.3)] skew-x-[-10deg]">
                           {isPlaying ? <Pause size={32} fill="currentColor" className="skew-x-[10deg]"/> : <Play size={32} fill="currentColor" className="ml-1 skew-x-[10deg]"/>}
                        </button>
                        <button onClick={onNext} className="p-4 border border-zinc-800 text-zinc-500 hover:text-[#00F3FF] hover:border-[#00F3FF] transition-all bg-black skew-x-[-10deg]"><SkipForward size={24} className="skew-x-[10deg]"/></button>
                     </div>
                     
                     {isMobile && (
                         <div className="w-full px-8 mt-12">
                             <CyberVolumeBar volume={volume} isMuted={isMuted} onChange={handleVolume} onToggleMute={toggleMute} />
                         </div>
                     )}
                  </div>
                  
                  <div className="lg:col-span-3 border-l border-[#00F3FF]/10 pl-6 flex flex-col h-full min-h-0 hidden lg:flex">
                     <div className="flex items-center gap-2 text-[#00F3FF] mb-4 border-b border-[#00F3FF]/20 pb-2"><Terminal size={16} /> <span className="text-xs font-black uppercase tracking-widest">Lyric_Stream_v1</span></div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs space-y-4 pr-2">
                        {MOCK_LYRICS.map((line, i) => (<div key={i} className={`leading-relaxed transition-all duration-300 ${line.startsWith('[') ? 'text-[#FF003C] font-bold mt-4' : 'text-zinc-500 hover:text-[#00F3FF]'}`}>{line}</div>))}
                        <div className="h-20" />
                     </div>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      )}
    </>
  );
}