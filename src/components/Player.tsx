import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, VolumeX, ChevronDown, Maximize2, 
  Terminal, Cpu, Activity, Disc, Zap, 
  Repeat, Repeat1, Shuffle, Radio
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
  "...",
  "",
  "...",
  "",
  "...",
];

const CLIPS = {
  CHAMFER: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
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

export default function CyberPlayer({ 
  currentTrack, isPlaying, onTogglePlay, onNext, onPrev, 
  playlist, onPlayerReady, onStateChange
}: CyberPlayerProps) {
  
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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setGlitchTrigger(true);
      setTimeout(() => setGlitchTrigger(false), 300);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
      height: '0',
      width: '0',
      videoId: currentTrack.id,
      playerVars: { 
        autoplay: 0, 
        controls: 0, 
        disablekb: 1, 
        playsinline: 1,
        rel: 0,
        enablejsapi: 1
      },
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
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      const currentVideoData = playerRef.current.getVideoData();
      const currentId = currentVideoData ? currentVideoData.video_id : null;
      
      if (currentId !== currentTrack.id) {
        playerRef.current.loadVideoById({
          videoId: currentTrack.id,
          startSeconds: 0
        });
        if (!isPlaying) {
            setTimeout(() => playerRef.current.pauseVideo(), 100);
        }
      }
    }
  }, [currentTrack.id]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      if (val > 0) {
          playerRef.current.unMute();
          setIsMuted(false);
      } else {
          setIsMuted(true);
      }
    }
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

  return (
    <>
      <div id="yt-player-phantom" className="hidden" />
      
      <style>{`
        .custom-range::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: #00F3FF; cursor: pointer; border-radius: 0; box-shadow: 0 0 10px #00F3FF; }
        .custom-range { -webkit-appearance: none; background: #111; height: 4px; outline: none; }
        .clip-chamfer { clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
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
          style={{ clipPath: viewMode === 'full' ? 'none' : CLIPS.CHAMFER }}
        >
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,transparent_24%,#00F3FF_25%,#00F3FF_26%,transparent_27%,transparent_74%,#00F3FF_75%,#00F3FF_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,#00F3FF_25%,#00F3FF_26%,transparent_27%,transparent_74%,#00F3FF_75%,#00F3FF_76%,transparent_77%,transparent)] bg-[size:50px_50px]" />
          </div>

          {viewMode === 'mini' && (
            <div className="w-full h-full flex items-center p-4 gap-4 relative" onClick={() => setViewMode('medium')}>
               <div className="h-16 w-16 bg-zinc-900 relative shrink-0">
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover grayscale opacity-80" alt="" />
               </div>
               <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="text-xs font-black uppercase text-white truncate">
                     {currentTrack.title}
                  </div>
                  <div className="text-[10px] text-[#00F3FF] font-mono truncate opacity-70">
                     {currentTrack.artist}
                  </div>
                  <div className="w-full h-[2px] bg-zinc-800 mt-2 relative">
                     <div className="absolute top-0 left-0 h-full bg-[#00F3FF]" style={{ width: `${progress}%` }} />
                  </div>
               </div>
               <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={onTogglePlay} className="w-10 h-10 bg-[#00F3FF]/10 border border-[#00F3FF] flex items-center justify-center text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black transition-colors">
                     {isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}
                  </button>
               </div>
            </div>
          )}

          {viewMode === 'medium' && (
            <div className="w-full h-full flex flex-col relative">
               <div className="h-10 border-b border-[#00F3FF]/20 flex items-center justify-between px-4 bg-[#00F3FF]/5">
                  <span className="text-[10px] font-bold text-[#00F3FF] uppercase tracking-widest animate-pulse">Neural_Link_v4</span>
                  <div className="flex gap-4">
                     <button onClick={() => setViewMode('full')} className="text-zinc-500 hover:text-[#00F3FF]"><Maximize2 size={14}/></button>
                     <button onClick={() => setViewMode('mini')} className="text-zinc-500 hover:text-[#00F3FF]"><ChevronDown size={16}/></button>
                  </div>
               </div>
               <div className="flex-1 relative overflow-hidden">
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover opacity-60 grayscale transition-all duration-700" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020202] to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                     <h2 className="text-xl font-black text-white uppercase leading-none mb-1">{currentTrack.title}</h2>
                     <p className="text-sm text-[#00F3FF] font-mono uppercase">{currentTrack.artist}</p>
                  </div>
               </div>
               <div className="p-6 bg-[#020202] border-t border-[#00F3FF]/20 space-y-4">
                  <div className="space-y-1">
                     <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                     </div>
                     <div className="h-2 w-full bg-[#001010] border border-[#004444] relative group">
                        <div className="absolute top-0 left-0 h-full bg-[#00F3FF] shadow-[0_0_10px_#00F3FF]" style={{ width: `${progress}%` }} />
                        <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>
                  <div className="flex items-center justify-center gap-6">
                     <button onClick={onPrev} className="p-2 border border-zinc-800 hover:border-[#00F3FF] text-zinc-500 hover:text-[#00F3FF] transition-all"><SkipBack size={20}/></button>
                     <button onClick={onTogglePlay} className="w-14 h-14 bg-black border-2 border-[#00F3FF] flex items-center justify-center text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black transition-all shadow-[0_0_20px_#00F3FF]">
                        {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1"/>}
                     </button>
                     <button onClick={onNext} className="p-2 border border-zinc-800 hover:border-[#00F3FF] text-zinc-500 hover:text-[#00F3FF] transition-all"><SkipForward size={20}/></button>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                     <button onClick={toggleMute} className="text-[#00F3FF]">
                        {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
                     </button>
                     <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="flex-1 custom-range" />
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
                  <button onClick={() => setViewMode('medium')} className="p-3 border border-zinc-800 hover:border-[#FF003C] hover:text-[#FF003C] text-zinc-500 transition-all"><ChevronDown size={24} /></button>
               </div>
               <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                  <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
                     <div className="aspect-square relative border border-[#00F3FF]/30 p-2">
                        <img src={currentTrack.thumbnail} className="w-full h-full object-cover grayscale opacity-80" alt="" />
                     </div>
                     <div className="flex-1 border border-zinc-800 bg-[#050505] p-4 font-mono text-xs text-zinc-500 space-y-4">
                        <div className="flex items-center gap-2 text-[#FF003C] border-b border-zinc-800 pb-2"><Cpu size={14} /> SYSTEM_DIAGNOSTICS</div>
                        <div className="flex justify-between"><span>VOLUME_LEVEL</span><span className="text-[#00F3FF]">{volume}%</span></div>
                        <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="w-full custom-range" />
                        <div className="mt-auto pt-4 text-[10px] opacity-50">UPLINK_ID: {currentTrack.id}</div>
                     </div>
                  </div>
                  <div className="lg:col-span-6 flex flex-col justify-center items-center">
                     <div className="text-center space-y-4 mb-12 w-full px-4">
                        <h1 className="text-3xl lg:text-6xl font-black text-white uppercase leading-none tracking-tighter"><GlitchText text={currentTrack.title} active={glitchTrigger} /></h1>
                        <div className="inline-block px-4 py-1 border border-[#00F3FF] text-[#00F3FF] font-mono uppercase">{currentTrack.artist}</div>
                     </div>
                     <div className="w-full max-w-2xl space-y-2 mb-10 px-4">
                        <div className="flex justify-between text-xs font-mono text-[#00F3FF]/60"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
                        <div className="h-4 w-full bg-[#001010] border border-[#004444] relative skew-x-[-10deg]">
                           <div className="absolute top-0 left-0 h-full bg-[#00F3FF] shadow-[0_0_15px_#00F3FF]" style={{ width: `${progress}%` }} />
                           <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                     </div>
                     <div className="flex items-center gap-8 lg:gap-16">
                        <button onClick={onPrev} className="p-4 border border-zinc-800 text-zinc-500 hover:text-[#00F3FF] bg-black skew-x-[-10deg]"><SkipBack size={24} className="skew-x-[10deg]"/></button>
                        <button onClick={onTogglePlay} className="w-24 h-24 bg-black border-2 border-[#00F3FF] flex items-center justify-center text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black shadow-[0_0_40px_rgba(0,243,255,0.3)] skew-x-[-10deg]"><div className="skew-x-[10deg]">{isPlaying ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}</div></button>
                        <button onClick={onNext} className="p-4 border border-zinc-800 text-zinc-500 hover:text-[#00F3FF] bg-black skew-x-[-10deg]"><SkipForward size={24} className="skew-x-[10deg]"/></button>
                     </div>
                  </div>
                  <div className="lg:col-span-3 border-l border-[#00F3FF]/10 pl-6 flex flex-col h-full min-h-0">
                     <div className="flex items-center gap-2 text-[#00F3FF] mb-4 border-b border-[#00F3FF]/20 pb-2"><Terminal size={16} /> <span className="text-xs font-black uppercase tracking-widest">Lyric_Stream_v1</span></div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs space-y-4 pr-2">
                        {MOCK_LYRICS.map((line, i) => (<div key={i} className="text-zinc-500 hover:text-[#00F3FF]">{line}</div>))}
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