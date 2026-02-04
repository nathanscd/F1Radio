import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, Maximize2, Minimize2, 
  Volume2, Cpu, Activity, Terminal, HardDrive, 
  Wifi, Power, ChevronUp, X, Disc, Radio,
  List, Mic2, Zap, Shield, Database, Search as SearchIcon, FileCode, Share2
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

/* --- STYLES & PRESETS --- */
const CLIP_PATHS = {
  DOCK: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)",
  CARD: "polygon(30px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 30px)"
};

/* --- UI COMPONENTS --- */
const ScanLine = () => (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-20">
    <div className="w-full h-[2px] bg-[#00F3FF] absolute top-0 animate-scanline shadow-[0_0_15px_#00F3FF]" />
    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 3px 100%' }} />
  </div>
);

const GlitchText = ({ text, className }: { text: string, className?: string }) => (
  <div className={`relative inline-block ${className}`}>
    <span className="relative z-10">{text}</span>
    <span className="absolute top-0 left-0 -z-10 text-[#FF003C] animate-glitch-1 opacity-70">{text}</span>
    <span className="absolute top-0 left-0 -z-20 text-[#00F3FF] animate-glitch-2 opacity-70">{text}</span>
  </div>
);

export default function CyberPlayer({ 
  currentTrack, isPlaying, onTogglePlay, onNext, onPrev, onSearch,
  playlist, onPlayerReady, onStateChange, onSelectTrack 
}: CyberPlayerProps) {
  const [viewMode, setViewMode] = useState<'dock' | 'card' | 'fullscreen'>('dock');
  const [activeTab, setActiveTab] = useState<'system' | 'queue' | 'terminal'>('system');
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(100);
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [sysStats, setSysStats] = useState({ cpu: 12, ram: 40, net: 0, temp: 45 });
  const [glitchActive, setGlitchActive] = useState(false);
  const [periodicGlitch, setPeriodicGlitch] = useState(false);
  
  const playerRef = useRef<any>(null);

  /* --- YT LOGIC --- */
  const initPlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player) return;
    if (playerRef.current) {
        if (playerRef.current.getVideoData && playerRef.current.getVideoData().video_id === currentTrack.id) return;
        try { playerRef.current.destroy(); } catch (e) {}
    }

    playerRef.current = new window.YT.Player('yt-player-container', {
      height: '0', width: '0', videoId: currentTrack.id,
      playerVars: { autoplay: isPlaying ? 1 : 0, controls: 0, disablekb: 1, modestbranding: 1, origin: window.location.origin },
      events: { 
        onReady: (e: any) => { onPlayerReady(e.target); e.target.setVolume(volume); if (isPlaying) e.target.playVideo(); },
        onStateChange: (e: any) => { onStateChange(e.data); if (e.data === 0) onNext(); }
      }
    });
  }, [currentTrack.id, onNext, onPlayerReady, onStateChange]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else { initPlayer(); }
  }, [initPlayer]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      if (isPlaying) { if (playerRef.current.getPlayerState() !== 1) playerRef.current.playVideo(); }
      else { if (playerRef.current.getPlayerState() === 1) playerRef.current.pauseVideo(); }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  /* --- LYRICS DECRYPTOR LOGIC --- */
  useEffect(() => {
    const fetchLyrics = async () => {
      setLyrics([]);
      try {
        const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(currentTrack.artist)}&track_name=${encodeURIComponent(currentTrack.title)}`);
        const data = await res.json();
        if (data.plainLyrics) {
          setLyrics(data.plainLyrics.split('\n'));
        } else {
          setLyrics(["// ERROR: LYRICS_NOT_FOUND_IN_LRCLIB", "// SIGNAL_CORRUPTED", "// ENCRYPTED_DATA_ONLY"]);
        }
      } catch (e) {
        setLyrics(["// ERROR: CONNECTION_FAILED", "// OFFLINE_MODE_ACTIVE"]);
      }
    };
    if (currentTrack.id) fetchLyrics();
  }, [currentTrack.id, currentTrack.artist, currentTrack.title]);

  /* --- SYSTEMS LOOP --- */
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const cur = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        if (dur > 0) setProgress((cur / dur) * 100);
      }
      if (isPlaying) {
        setSysStats({
            cpu: 30 + Math.floor(Math.random() * 60),
            ram: 45 + Math.floor(Math.random() * 5),
            net: 1200 + Math.floor(Math.random() * 800),
            temp: 60 + Math.floor(Math.random() * 20)
        });
      }
      if (Math.random() > 0.98) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 150);
      }
    }, 800);

    const glitchTimer = setInterval(() => {
      setPeriodicGlitch(true);
      setTimeout(() => setPeriodicGlitch(false), 400);
    }, 5000);

    return () => { clearInterval(interval); clearInterval(glitchTimer); };
  }, [isPlaying]);

  return (
    <div className="font-mono text-zinc-400 selection:bg-[#00F3FF] selection:text-black">
      <div id="yt-player-container" className="hidden" />
      
      <style>{`
        @keyframes scanline { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes glitch-1 { 0% { transform: translate(0); } 20% { transform: translate(-3px, 3px); } 40% { transform: translate(-3px, -3px); } 60% { transform: translate(3px, 3px); } 80% { transform: translate(3px, -3px); } 100% { transform: translate(0); } }
        @keyframes glitch-2 { 0% { transform: translate(0); } 20% { transform: translate(3px, -3px); } 40% { transform: translate(3px, 3px); } 60% { transform: translate(-3px, -3px); } 80% { transform: translate(-3px, 3px); } 100% { transform: translate(0); } }
        .animate-scanline { animation: scanline 6s linear infinite; }
        .animate-glitch-1 { animation: glitch-1 0.2s infinite; }
        .animate-glitch-2 { animation: glitch-2 0.2s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00F3FF; box-shadow: 0 0 10px #00F3FF; }
      `}</style>

      <AnimatePresence mode="wait">
        
        {/* --- DOCK --- */}
        {viewMode === 'dock' && (
          <motion.div
            key="dock" layoutId="cyber-interface" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            onClick={() => setViewMode('card')}
            className={`fixed bottom-8 right-8 z-[100] cursor-pointer group ${periodicGlitch || glitchActive ? 'animate-glitch-1' : ''}`}
          >
            <div className="relative bg-black border border-zinc-800 w-80 h-20 flex items-center overflow-hidden hover:border-[#00F3FF] transition-all duration-500 shadow-[0_0_40px_rgba(0,0,0,0.8)]" style={{ clipPath: CLIP_PATHS.DOCK }}>
              <ScanLine />
              <div className={`w-1.5 h-full transition-all duration-500 ${isPlaying ? 'bg-[#00F3FF] shadow-[0_0_20px_#00F3FF]' : 'bg-zinc-800'}`} />
              <div className="flex-1 flex items-center px-5 gap-4 relative z-20">
                <img src={currentTrack.thumbnail} className={`w-12 h-12 object-cover border border-zinc-800 transition-all duration-700 ${isPlaying ? 'grayscale-0' : 'grayscale'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white uppercase truncate">{periodicGlitch || glitchActive ? <GlitchText text={currentTrack.title} /> : currentTrack.title}</p>
                  <p className="text-[9px] text-zinc-500 uppercase truncate">{currentTrack.artist}</p>
                </div>
                <ChevronUp size={16} className="text-zinc-700" />
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] bg-[#00F3FF]" style={{ width: `${progress}%` }} />
            </div>
          </motion.div>
        )}

        {/* --- CARD --- */}
        {viewMode === 'card' && (
          <motion.div
            key="card" layoutId="cyber-interface" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[110] w-[420px] bg-[#050505] border border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"
            style={{ clipPath: CLIP_PATHS.CARD }}
          >
            <ScanLine />
            <div className="bg-white/5 p-4 border-b border-zinc-800 flex justify-between items-center">
              <Terminal size={14} className="text-[#00F3FF]" />
              <div className="flex gap-2">
                <button onClick={() => setViewMode('fullscreen')} className="p-1 hover:text-[#00F3FF]"><Maximize2 size={14}/></button>
                <button onClick={() => setViewMode('dock')} className="p-1 hover:text-[#FF003C]"><X size={14}/></button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex gap-5 mb-6">
                <img src={currentTrack.thumbnail} className="w-24 h-24 object-cover border border-zinc-800" />
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white uppercase line-clamp-2">{currentTrack.title}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase">{currentTrack.artist}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-6 bg-black p-3 border border-zinc-800">
                <button onClick={onPrev}><SkipBack size={20} /></button>
                <button onClick={onTogglePlay} className="w-12 h-12 rounded-full border border-[#00F3FF] flex items-center justify-center">
                  {isPlaying ? <Pause size={22} className="text-[#00F3FF]" /> : <Play size={22} className="text-[#00F3FF] fill-[#00F3FF]" />}
                </button>
                <button onClick={onNext}><SkipForward size={20} /></button>
                <div className="flex items-center gap-2 w-24 ml-2">
                  <Volume2 size={16} />
                  <div className="flex-1 h-1 bg-zinc-900 relative">
                    <div className="h-full bg-[#00F3FF]" style={{ width: `${volume}%` }} />
                    <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0" />
                  </div>
                </div>
              </div>
              <div className="flex gap-1 text-[9px] font-bold">
                {[
                  { id: 'system', label: 'SYS_MON', icon: Activity },
                  { id: 'queue', label: 'DATA_Q', icon: List },
                  { id: 'terminal', label: 'TERM_L', icon: Terminal }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2 border ${activeTab === tab.id ? 'border-[#00F3FF] text-[#00F3FF]' : 'border-zinc-800'}`}>
                    <tab.icon size={10} className="inline mr-1" /> {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- FULLSCREEN --- */}
        {viewMode === 'fullscreen' && (
          <motion.div
            key="fullscreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#020202] text-[#00F3FF] p-6 flex flex-col overflow-hidden"
          >
            <ScanLine />
            <div className="flex justify-between border-b border-[#00F3FF]/30 pb-4 mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-[#FF003C] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">System_Link_v4.0</span>
              </div>
              <button onClick={() => setViewMode('card')} className="p-3 border border-[#FF003C] text-[#FF003C] hover:bg-[#FF003C] hover:text-black transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden relative z-10">
              
              {/* SEARCH & QUEUE */}
              <div className="col-span-3 flex flex-col gap-4 border-r border-white/5 pr-6">
                <div className="bg-[#001010] border border-[#00F3FF]/30 p-4">
                  <div className="text-[10px] mb-3 flex items-center gap-2"><SearchIcon size={12} /> SEARCH_NETWORK</div>
                  <div className="flex bg-black border border-zinc-800 p-2">
                    <span className="text-[#00F3FF] mr-2">{'>'}</span>
                    <input type="text" placeholder="QUERY..." className="bg-transparent border-none outline-none text-xs w-full uppercase" onKeyDown={(e) => { if(e.key === 'Enter') onSearch((e.target as HTMLInputElement).value); }} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar border border-zinc-900 bg-black/20 p-2">
                  {playlist.map((t, i) => (
                    <button key={t.id} onClick={() => onSelectTrack(t)} className={`w-full flex items-center gap-3 p-2 mb-1 text-left ${currentTrack.id === t.id ? 'bg-[#00F3FF]/10 border-l-2 border-[#00F3FF]' : 'hover:bg-white/5'}`}>
                      <span className="text-[9px] opacity-30">{String(i+1).padStart(2, '0')}</span>
                      <span className={`text-[10px] font-bold truncate ${currentTrack.id === t.id ? 'text-[#00F3FF]' : 'text-zinc-400'}`}>{t.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CORE VISUALS */}
              <div className="col-span-5 flex flex-col items-center justify-center gap-6">
                <div className="relative w-full aspect-square max-w-[450px] group border border-[#00F3FF] shadow-[0_0_50px_rgba(0,243,255,0.1)]">
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onTogglePlay} className="w-20 h-20 bg-black/80 border-2 border-[#00F3FF] flex items-center justify-center text-[#00F3FF] rounded-full shadow-[0_0_30px_#00F3FF]">
                      {isPlaying ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-4xl font-black uppercase text-white leading-tight">{currentTrack.title}</h2>
                  <p className="text-[#FF003C] font-bold tracking-[0.4em] text-xs mt-2">{currentTrack.artist}</p>
                </div>
              </div>

              {/* LYRICS TERMINAL */}
              <div className="col-span-4 border-l border-white/5 pl-6 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 mb-4"><Mic2 size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Lyric_Stream_Decryptor</span></div>
                <div className="flex-1 bg-[#050505] border border-zinc-800 p-6 overflow-y-auto custom-scrollbar">
                  <div className="space-y-6 text-zinc-400">
                    <p className="opacity-40 text-[10px] font-mono italic">// INITIALIZING_LYRIC_DECODER... <br/> // SOURCE: LRCLIB_DATABASE</p>
                    {lyrics.length > 0 ? lyrics.map((line, i) => (
                      <p key={i} className="text-lg leading-relaxed hover:text-[#00F3FF] transition-colors">{line}</p>
                    )) : <p className="animate-pulse">DECODING_DATA_STREAM...</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* TRANSPORT BAR */}
            <div className="mt-8 bg-black/50 border border-zinc-800 p-6 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-8">
                <button onClick={onPrev}><SkipBack size={32} /></button>
                <button onClick={onTogglePlay} className="w-16 h-16 bg-[#00F3FF]/10 border border-[#00F3FF] flex items-center justify-center">
                  {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
                </button>
                <button onClick={onNext}><SkipForward size={32} /></button>
              </div>
              <div className="flex-1 mx-20 flex flex-col gap-2">
                <div className="h-1 bg-zinc-900 w-full relative group">
                  <div className="absolute inset-y-0 left-0 bg-[#00F3FF] shadow-[0_0_15px_#00F3FF]" style={{ width: `${progress}%` }} />
                  <input type="range" value={progress} onChange={(e) => playerRef.current?.seekTo((parseFloat(e.target.value)/100)*playerRef.current.getDuration())} className="absolute inset-0 w-full h-full opacity-0 z-20" />
                </div>
              </div>
              <div className="flex items-center gap-6 w-64">
                <Volume2 size={20} />
                <div className="flex-1 h-1 bg-zinc-900 relative">
                  <div className="h-full bg-white" style={{ width: `${volume}%` }} />
                  <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}