import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, VolumeX, ChevronDown, Maximize2, 
  Terminal, Cpu, Activity, Disc, Zap, 
  Repeat, Repeat1, Shuffle, Radio
} from 'lucide-react';

/* --- TYPES --- */
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

/* --- MOCK LYRICS (Simulação) --- */
const MOCK_LYRICS = [
  "System initializing...",
  "Loading neural pathways...",
  "Encrypting audio stream...",
  "[VERSE 1]",
  "Neon lights reflecting on the rain",
  "Chrome circuits feeling phantom pain",
  "Data flowing through my veins",
  "Nothing here remains the same",
  "",
  "[CHORUS]",
  "We are the ghost in the machine",
  "Living inside a lucid dream",
  "Digital souls, silent scream",
  "Nothing is ever what it seems",
  "",
  "[VERSE 2]",
  "Binary codes in the sky",
  "Watching the satellites go by",
  "Uplink connected, don't ask why",
  "Cybernetic lullaby..."
];

/* --- STYLES & CLIPS --- */
const CLIPS = {
  CHAMFER: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
  NOTCH_TOP: "polygon(0 0, 20px 0, 40px 10px, calc(100% - 40px) 10px, calc(100% - 20px) 0, 100% 0, 100% 100%, 0 100%)",
  NOTCH_CORNER: "polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
  DIAGONAL_SPLIT: "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)"
};

const GlitchText = ({ text, active }: { text: string, active: boolean }) => (
  <div className="relative inline-block">
    <span className="relative z-10">{text}</span>
    {active && (
      <>
        <span className="absolute top-0 left-0 -z-10 text-[#FF003C] translate-x-[2px] opacity-70 animate-pulse">{text}</span>
        <span className="absolute top-0 left-0 -z-20 text-[#00F3FF] -translate-x-[2px] opacity-70 animate-pulse">{text}</span>
      </>
    )}
  </div>
);

/* --- MAIN COMPONENT --- */
export default function CyberPlayer({ 
  currentTrack, isPlaying, onTogglePlay, onNext, onPrev, 
  playlist, onPlayerReady, onStateChange
}: CyberPlayerProps) {
  
  // States
  const [viewMode, setViewMode] = useState<'mini' | 'medium' | 'full'>('mini');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);

  // Responsive Check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Glitch Timer (Every 5s)
  useEffect(() => {
    const timer = setInterval(() => {
      setGlitchTrigger(true);
      setTimeout(() => setGlitchTrigger(false), 300); // Glitch dura 300ms
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  /* --- YOUTUBE LOGIC (MANTIDA IGUAL PARA BACKGROUND PLAY) --- */
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
      height: '0', width: '0', videoId: currentTrack.id,
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
      events: {
        onReady: (e: any) => {
          onPlayerReady(e.target);
          e.target.setVolume(volume);
          if(isPlaying) e.target.playVideo();
        },
        onStateChange: (e: any) => {
          onStateChange(e.data);
          if(e.data === 0) onNext();
        }
      }
    });
  };

  useEffect(() => {
    if (playerRef.current?.loadVideoById) {
      const currentId = playerRef.current.getVideoData()?.video_id;
      if (currentId !== currentTrack.id) playerRef.current.loadVideoById(currentTrack.id);
    }
  }, [currentTrack.id]);

  useEffect(() => {
    if (playerRef.current?.playVideo) isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
  }, [isPlaying]);

  useEffect(() => {
    progressInterval.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const cur = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        setCurrentTime(cur);
        setDuration(dur);
        if (dur > 0) setProgress((cur / dur) * 100);
      }
    }, 500);
    return () => clearInterval(progressInterval.current);
  }, []);

  /* --- HANDLERS --- */
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

  const formatTime = (s: number) => {
    if (!s) return "00:00";
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  /* --- RENDER --- */
  return (
    <>
      <div id="yt-player-phantom" className="hidden" />
      
      <style>{`
        .custom-range::-webkit-slider-thumb { -webkit-appearance: none; width: 0; height: 0; }
        .clip-chamfer { clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
        .clip-corner { clip-path: polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px)); }
        
        @keyframes noise { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-5%, -5%); } 20% { transform: translate(-10%, 5%); } 30% { transform: translate(5%, -10%); } 40% { transform: translate(-5%, 15%); } 50% { transform: translate(-10%, 5%); } 60% { transform: translate(15%, 0); } 70% { transform: translate(0, 10%); } 80% { transform: translate(-15%, 0); } 90% { transform: translate(10%, 5%); } }
        .animate-noise { animation: noise 0.2s steps(5) infinite; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00F3FF; }
      `}</style>

      <AnimatePresence mode="wait">
        <motion.div
          key="unified-player"
          layoutId="cyber-player-container"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed z-[500] bg-[#020202] border border-[#00F3FF]/40 overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.1)] 
            ${viewMode === 'mini' ? (isMobile ? 'bottom-0 left-0 w-full h-20 border-t' : 'bottom-8 right-8 w-80 h-24') : ''}
            ${viewMode === 'medium' ? (isMobile ? 'inset-x-2 bottom-2 h-[500px]' : 'bottom-8 right-8 w-[400px] h-[500px]') : ''}
            ${viewMode === 'full' ? 'inset-0' : ''}
          `}
          style={{ 
            clipPath: viewMode === 'full' ? 'none' : CLIPS.CHAMFER 
          }}
        >
          {/* --- BACKGROUND FX --- */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,transparent_24%,#00F3FF_25%,#00F3FF_26%,transparent_27%,transparent_74%,#00F3FF_75%,#00F3FF_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,#00F3FF_25%,#00F3FF_26%,transparent_27%,transparent_74%,#00F3FF_75%,#00F3FF_76%,transparent_77%,transparent)] bg-[size:50px_50px]" />
             {glitchTrigger && viewMode === 'mini' && <div className="absolute inset-0 bg-[#00F3FF]/20 animate-noise mix-blend-screen" />}
          </div>

          {/* =========================================================================
                                      MINI PLAYER
             ========================================================================= */}
          {viewMode === 'mini' && (
            <div className="w-full h-full flex items-center p-4 gap-4 relative" onClick={() => setViewMode('medium')}>
               {/* Art */}
               <div className="h-16 w-16 bg-zinc-900 relative shrink-0">
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover grayscale opacity-80" alt="" />
                  {/* Glitch Overlay */}
                  {glitchTrigger && <div className="absolute inset-0 bg-[#FF003C] mix-blend-overlay translate-x-1" />}
               </div>

               {/* Info */}
               <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className={`text-xs font-black uppercase text-white truncate ${glitchTrigger ? 'translate-x-1 text-[#00F3FF]' : ''}`}>
                     {currentTrack.title}
                  </div>
                  <div className="text-[10px] text-[#00F3FF] font-mono truncate opacity-70">
                     {glitchTrigger ? "ERR_CONNECTION" : currentTrack.artist}
                  </div>
                  {/* Mini Progress */}
                  <div className="w-full h-[2px] bg-zinc-800 mt-2 relative">
                     <div className="absolute top-0 left-0 h-full bg-[#00F3FF]" style={{ width: `${progress}%` }} />
                  </div>
               </div>

               {/* Controls */}
               <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={onTogglePlay} className="w-10 h-10 bg-[#00F3FF]/10 border border-[#00F3FF] flex items-center justify-center text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black transition-colors">
                     {isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}
                  </button>
               </div>
            </div>
          )}

          {/* =========================================================================
                                     MEDIUM PLAYER
             ========================================================================= */}
          {viewMode === 'medium' && (
            <div className="w-full h-full flex flex-col relative">
               {/* Header */}
               <div className="h-10 border-b border-[#00F3FF]/20 flex items-center justify-between px-4 bg-[#00F3FF]/5">
                  <span className="text-[10px] font-bold text-[#00F3FF] uppercase tracking-widest animate-pulse">Neural_Link_v4</span>
                  <div className="flex gap-4">
                     <button onClick={() => setViewMode('full')} className="text-zinc-500 hover:text-[#00F3FF]"><Maximize2 size={14}/></button>
                     <button onClick={() => setViewMode('mini')} className="text-zinc-500 hover:text-[#00F3FF]"><ChevronDown size={16}/></button>
                  </div>
               </div>

               {/* Cover Art Area */}
               <div className="flex-1 relative group overflow-hidden">
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020202] to-transparent" />
                  
                  {/* Floating Info */}
                  <div className="absolute bottom-6 left-6 right-6">
                     <h2 className="text-xl font-black text-white uppercase leading-none mb-1 drop-shadow-md">{currentTrack.title}</h2>
                     <p className="text-sm text-[#00F3FF] font-mono uppercase">{currentTrack.artist}</p>
                  </div>
               </div>

               {/* Controls Area */}
               <div className="p-6 bg-[#020202] border-t border-[#00F3FF]/20 space-y-6">
                  {/* Progress Bar (Segmented) */}
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

                  {/* Buttons */}
                  <div className="flex items-center justify-between">
                     <button className="text-zinc-600 hover:text-[#00F3FF]"><Shuffle size={16}/></button>
                     <div className="flex items-center gap-4">
                        <button onClick={onPrev} className="p-2 border border-zinc-800 hover:border-[#00F3FF] text-zinc-500 hover:text-[#00F3FF] transition-all"><SkipBack size={20}/></button>
                        <button onClick={onTogglePlay} className="w-14 h-14 bg-black border-2 border-[#00F3FF] flex items-center justify-center text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black transition-all shadow-[0_0_20px_#00F3FF]">
                           {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1"/>}
                        </button>
                        <button onClick={onNext} className="p-2 border border-zinc-800 hover:border-[#00F3FF] text-zinc-500 hover:text-[#00F3FF] transition-all"><SkipForward size={20}/></button>
                     </div>
                     <button className="text-zinc-600 hover:text-[#00F3FF]"><Repeat size={16}/></button>
                  </div>
               </div>
            </div>
          )}

          {/* =========================================================================
                                     FULLSCREEN PLAYER
             ========================================================================= */}
          {viewMode === 'full' && (
            <div className="w-full h-full flex flex-col p-4 lg:p-8 relative bg-black">
               {/* Top Bar */}
               <div className="flex justify-between items-center mb-8 border-b border-[#00F3FF]/20 pb-4">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-[#00F3FF] flex items-center justify-center text-black font-black animate-pulse">
                        <Radio size={20} />
                     </div>
                     <div>
                        <div className="text-[10px] text-[#00F3FF] uppercase tracking-[0.3em]">System_Override</div>
                        <div className="text-xl font-black text-white tracking-tighter">CYBER_DECK_PRO</div>
                     </div>
                  </div>
                  <button onClick={() => setViewMode('medium')} className="p-3 border border-zinc-800 hover:border-[#FF003C] hover:text-[#FF003C] text-zinc-500 transition-all">
                     <ChevronDown size={24} />
                  </button>
               </div>

               {/* 3-COLUMN GRID (Desktop) / FLEX (Mobile) */}
               <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                  
                  {/* COL 1: SYSTEM STATS & ART (Left) - span 3 */}
                  <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
                     {/* Album Art Box */}
                     <div className="aspect-square relative border border-[#00F3FF]/30 p-2">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00F3FF]" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00F3FF]" />
                        <img src={currentTrack.thumbnail} className="w-full h-full object-cover grayscale opacity-80" alt="" />
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none" />
                     </div>

                     {/* Stats Module */}
                     <div className="flex-1 border border-zinc-800 bg-[#050505] p-4 font-mono text-xs text-zinc-500 space-y-4">
                        <div className="flex items-center gap-2 text-[#FF003C] border-b border-zinc-800 pb-2">
                           <Cpu size={14} /> SYSTEM_DIAGNOSTICS
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between"><span>CPU_CORE_01</span><span className="text-[#00F3FF]">{Math.floor(Math.random() * 90)}%</span></div>
                           <div className="h-1 bg-zinc-900"><div className="h-full bg-[#00F3FF] w-2/3" /></div>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between"><span>MEMORY_DUMP</span><span className="text-[#FF003C]">128MB</span></div>
                           <div className="h-1 bg-zinc-900"><div className="h-full bg-[#FF003C] w-1/3" /></div>
                        </div>
                        <div className="mt-auto pt-4 text-[10px] opacity-50">
                           UPLINK_ID: {currentTrack.id}<br/>
                           STATUS: ENCRYPTED
                        </div>
                     </div>
                  </div>

                  {/* COL 2: MAIN CONTROLS (Center) - span 6 */}
                  <div className="lg:col-span-6 flex flex-col justify-center items-center relative">
                     {/* Mobile Art */}
                     <div className="lg:hidden w-64 h-64 mb-8 border border-[#00F3FF]/30 p-1 relative">
                        <img src={currentTrack.thumbnail} className="w-full h-full object-cover" alt="" />
                     </div>

                     {/* Title Section */}
                     <div className="text-center space-y-4 mb-12 w-full">
                        <h1 className="text-3xl lg:text-6xl font-black text-white uppercase leading-none tracking-tighter break-words">
                           <GlitchText text={currentTrack.title} active={glitchTrigger} />
                        </h1>
                        <div className="inline-block px-4 py-1 border border-[#00F3FF] text-[#00F3FF] font-mono uppercase text-sm lg:text-lg">
                           {currentTrack.artist}
                        </div>
                     </div>

                     {/* Progress */}
                     <div className="w-full max-w-2xl space-y-2 mb-10">
                        <div className="flex justify-between text-xs font-mono text-[#00F3FF]/60">
                           <span>{formatTime(currentTime)}</span>
                           <span>{formatTime(duration)}</span>
                        </div>
                        <div className="h-4 w-full bg-[#001010] border border-[#004444] relative group cursor-pointer skew-x-[-10deg]">
                           <div className="absolute top-0 left-0 h-full bg-[#00F3FF] shadow-[0_0_15px_#00F3FF]" style={{ width: `${progress}%` }} />
                           {/* Stripes on progress */}
                           <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,#000_50%)] bg-[size:4px_100%] opacity-20" />
                           <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                     </div>

                     {/* Main Buttons */}
                     <div className="flex items-center gap-8 lg:gap-16">
                        <button onClick={onPrev} className="p-4 border border-zinc-800 text-zinc-500 hover:text-[#00F3FF] hover:border-[#00F3FF] transition-all bg-black skew-x-[-10deg]">
                           <SkipBack size={24} className="skew-x-[10deg]"/>
                        </button>
                        
                        <button onClick={onTogglePlay} className="w-24 h-24 bg-black border-2 border-[#00F3FF] flex items-center justify-center group hover:bg-[#00F3FF] hover:text-black transition-all shadow-[0_0_40px_rgba(0,243,255,0.3)] skew-x-[-10deg]">
                           {isPlaying ? <Pause size={32} fill="currentColor" className="skew-x-[10deg]"/> : <Play size={32} fill="currentColor" className="ml-1 skew-x-[10deg]"/>}
                        </button>

                        <button onClick={onNext} className="p-4 border border-zinc-800 text-zinc-500 hover:text-[#00F3FF] hover:border-[#00F3FF] transition-all bg-black skew-x-[-10deg]">
                           <SkipForward size={24} className="skew-x-[10deg]"/>
                        </button>
                     </div>
                  </div>

                  {/* COL 3: LYRICS / TERMINAL (Right) - span 3 */}
                  <div className="lg:col-span-3 border-l border-[#00F3FF]/10 pl-6 flex flex-col h-full min-h-0">
                     <div className="flex items-center gap-2 text-[#00F3FF] mb-4 border-b border-[#00F3FF]/20 pb-2">
                        <Terminal size={16} /> <span className="text-xs font-black uppercase tracking-widest">Lyric_Stream_v1</span>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs space-y-4 pr-2">
                        {MOCK_LYRICS.map((line, i) => (
                           <div key={i} className={`leading-relaxed transition-all duration-300 ${line.startsWith('[') ? 'text-[#FF003C] font-bold mt-4' : 'text-zinc-500 hover:text-[#00F3FF]'}`}>
                              {line}
                           </div>
                        ))}
                        <div className="h-20" /> {/* Spacer */}
                     </div>
                  </div>

               </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </>
  );
}