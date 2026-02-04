import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, Maximize2, Minimize2, 
  Volume2, Cpu, Activity, Terminal, HardDrive, 
  Wifi, Power, ChevronUp, X, Disc, Radio,
  List, Mic2, Zap, Shield, Database, Search as SearchIcon, FileCode, Share2,
  ChevronDown
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
  const [isMobile, setIsMobile] = useState(false);
  
  const playerRef = useRef<any>(null);

  /* --- RESPONSIVE CHECK --- */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
            className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-8 right-8'} z-[100] cursor-pointer group ${periodicGlitch || glitchActive ? 'animate-glitch-1' : ''}`}
          >
            <div className={`relative bg-black border border-zinc-800 ${isMobile ? 'w-72 h-16' : 'w-80 h-20'} flex items-center overflow-hidden hover:border-[#00F3FF] transition-all duration-500 shadow-[0_0_40px_rgba(0,0,0,0.8)]`} style={{ clipPath: CLIP_PATHS.DOCK }}>
              <ScanLine />
              <div className={`w-1.5 h-full transition-all duration-500 ${isPlaying ? 'bg-[#00F3FF] shadow-[0_0_20px_#00F3FF]' : 'bg-zinc-800'}`} />
              <div className="flex-1 flex items-center px-4 lg:px-5 gap-3 lg:gap-4 relative z-20">
                <img src={currentTrack.thumbnail} className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} object-cover border border-zinc-800 transition-all duration-700 ${isPlaying ? 'grayscale-0' : 'grayscale'}`} alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] lg:text-xs font-black text-white uppercase truncate">{periodicGlitch || glitchActive ? <GlitchText text={currentTrack.title} /> : currentTrack.title}</p>
                  <p className="text-[8px] lg:text-[9px] text-zinc-500 uppercase truncate">{currentTrack.artist}</p>
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
            className={`fixed ${isMobile ? 'bottom-4 right-4 w-[calc(100vw-32px)]' : 'bottom-8 right-8 w-[420px]'} z-[110] bg-[#050505] border border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden`}
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
                <img src={currentTrack.thumbnail} className="w-24 h-24 object-cover border border-zinc-800" alt="" />
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
                    <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>
              <div className="flex border-t border-zinc-800">
                {['system', 'queue', 'terminal'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-[9px] uppercase font-black tracking-widest transition-all ${activeTab === tab ? 'text-[#00F3FF] bg-[#00F3FF]/5 border-b-2 border-[#00F3FF]' : 'text-zinc-600 hover:text-zinc-400'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="h-48 overflow-y-auto p-4 bg-black/40 custom-scrollbar text-[10px]">
                {activeTab === 'system' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border border-zinc-800 bg-zinc-900/30">
                        <div className="flex justify-between mb-2"><Cpu size={12}/><span className="text-[#00F3FF]">{sysStats.cpu}%</span></div>
                        <div className="h-1 bg-zinc-800"><div className="h-full bg-[#00F3FF]" style={{ width: `${sysStats.cpu}%` }} /></div>
                      </div>
                      <div className="p-3 border border-zinc-800 bg-zinc-900/30">
                        <div className="flex justify-between mb-2"><Activity size={12}/><span className="text-[#FF003C]">{sysStats.temp}°C</span></div>
                        <div className="h-1 bg-zinc-800"><div className="h-full bg-[#FF003C]" style={{ width: `${(sysStats.temp/100)*100}%` }} /></div>
                      </div>
                    </div>
                    <div className="space-y-1 text-zinc-500 leading-relaxed uppercase">
                      <div className="flex justify-between"><span>Neural_Uplink:</span><span className="text-white">Active</span></div>
                      <div className="flex justify-between"><span>Encryption:</span><span className="text-white">AES-256</span></div>
                      <div className="flex justify-between"><span>Bitrate:</span><span className="text-white">1411kbps</span></div>
                    </div>
                  </div>
                )}
                {activeTab === 'queue' && (
                  <div className="space-y-2">
                    {playlist.map((track, i) => (
                      <div key={track.id} onClick={() => onSelectTrack(track)} className={`flex items-center gap-3 p-2 border border-zinc-900 hover:border-[#00F3FF]/30 cursor-pointer transition-all ${currentTrack.id === track.id ? 'bg-[#00F3FF]/5 border-[#00F3FF]/50' : ''}`}>
                        <span className="text-[8px] text-zinc-700">0{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-white uppercase truncate">{track.title}</div>
                          <div className="text-[8px] text-zinc-600 uppercase">{track.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'terminal' && (
                  <div className="space-y-1 text-[#00F3FF]/60 font-mono leading-tight uppercase">
                    {lyrics.map((line, i) => (
                      <div key={i} className="hover:text-[#00F3FF] transition-colors">{line}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- FULLSCREEN (3-COLUMN ORIGINAL) --- */}
        {viewMode === 'fullscreen' && (
          <motion.div
            key="fullscreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#020202] flex flex-col p-4 lg:p-12 overflow-hidden"
          >
            <ScanLine />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 lg:mb-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 border-2 border-[#00F3FF] flex items-center justify-center animate-pulse"><Disc className="text-[#00F3FF]" /></div>
                <div className="hidden sm:block">
                  <h1 className="text-lg lg:text-2xl font-black text-white uppercase tracking-tighter">Cyber_Radio_Terminal_v4.0</h1>
                  <div className="text-[8px] lg:text-[10px] text-[#00F3FF] uppercase tracking-[0.4em] font-black">Secure_Audio_Uplink_Active</div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setViewMode('card')} className="p-2 lg:p-4 border border-zinc-800 hover:border-[#00F3FF] transition-all"><Minimize2 size={24} lg:size={32}/></button>
                <button onClick={() => setViewMode('dock')} className="p-2 lg:p-4 border border-zinc-800 hover:border-[#FF003C] hover:text-[#FF003C] transition-all"><X size={24} lg:size={32}/></button>
              </div>
            </div>

            {/* Main Content (Responsive 3-Column) */}
            <div className={`flex-1 flex ${isMobile ? 'flex-col overflow-y-auto custom-scrollbar' : 'flex-row'} gap-6 lg:gap-12 min-h-0`}>
              
              {/* Column 1: Systems (Mobile: First) */}
              <div className={`${isMobile ? 'w-full order-2' : 'w-1/4'} flex flex-col gap-6`}>
                <div className="p-6 border border-zinc-800 bg-zinc-900/20 space-y-8">
                  <div className="flex items-center gap-3 text-[#00F3FF]"><Cpu size={20} /><span className="text-xs font-black uppercase tracking-widest">Processor_Load</span></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase"><span>Core_Activity</span><span>{sysStats.cpu}%</span></div>
                    <div className="h-1 bg-zinc-800"><div className="h-full bg-[#00F3FF] shadow-[0_0_10px_#00F3FF]" style={{ width: `${sysStats.cpu}%` }} /></div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <div className="flex justify-between text-[10px] font-black uppercase"><span>Neural_Temp</span><span className="text-[#FF003C]">{sysStats.temp}°C</span></div>
                    <div className="h-1 bg-zinc-800"><div className="h-full bg-[#FF003C] shadow-[0_0_10px_#FF003C]" style={{ width: `${(sysStats.temp/100)*100}%` }} /></div>
                  </div>
                </div>
                <div className="p-6 border border-zinc-800 bg-zinc-900/20 flex-1">
                  <div className="flex items-center gap-3 text-pink-500 mb-6"><Activity size={20} /><span className="text-xs font-black uppercase tracking-widest">Network_Uplink</span></div>
                  <div className="space-y-3 text-[9px] text-zinc-500 uppercase leading-relaxed">
                    <div className="flex justify-between"><span>Status:</span><span className="text-white">Connected</span></div>
                    <div className="flex justify-between"><span>Protocol:</span><span className="text-white">TCP/IP_V6</span></div>
                    <div className="flex justify-between"><span>Packets:</span><span className="text-white">{sysStats.net} KB/S</span></div>
                    <div className="flex justify-between"><span>Latency:</span><span className="text-white">12MS</span></div>
                    <div className="flex justify-between"><span>Encryption:</span><span className="text-white">RSA_4096</span></div>
                  </div>
                </div>
              </div>

              {/* Column 2: Player (Mobile: Second) */}
              <div className={`${isMobile ? 'w-full order-1' : 'flex-1'} flex flex-col justify-between py-6 lg:py-0`}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative group mb-8 lg:mb-12">
                    <div className="absolute -inset-10 bg-[#00F3FF]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                    <img src={currentTrack.thumbnail} className={`${isMobile ? 'w-48 h-48' : 'w-80 h-80'} object-cover border-4 border-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.5)]`} alt="" />
                  </div>
                  <div className="text-[#FF003C] text-[10px] lg:text-xs font-black uppercase tracking-[0.5em] mb-4">Now_Playing_Stream</div>
                  <h2 className={`${isMobile ? 'text-2xl' : 'text-5xl lg:text-6xl'} font-black text-white uppercase tracking-tighter leading-tight mb-4`}>
                    {periodicGlitch ? <GlitchText text={currentTrack.title} /> : currentTrack.title}
                  </h2>
                  <div className={`${isMobile ? 'text-base' : 'text-2xl'} font-black text-[#00F3FF] uppercase tracking-widest flex items-center gap-4`}><Mic2 size={isMobile ? 20 : 24} /> {currentTrack.artist}</div>
                </div>

                <div className="space-y-8 lg:space-y-12 mt-8">
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <span>Neural_Sync_Progress</span>
                      <span className="text-[#00F3FF]">{Math.floor(progress)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-900 relative">
                      <div className="h-full bg-[#00F3FF] shadow-[0_0_20px_#00F3FF]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 lg:gap-12">
                    <button onClick={onPrev} className="p-4 lg:p-6 border border-zinc-800 hover:border-[#00F3FF] transition-all"><SkipBack size={isMobile ? 24 : 40} /></button>
                    <button onClick={onTogglePlay} className={`${isMobile ? 'w-20 h-20' : 'w-28 h-28'} rounded-full border-4 border-[#00F3FF] flex items-center justify-center hover:bg-[#00F3FF]/5 transition-all`}>
                      {isPlaying ? <Pause size={isMobile ? 32 : 50} className="text-[#00F3FF]" /> : <Play size={isMobile ? 32 : 50} className={`text-[#00F3FF] fill-[#00F3FF] ${isMobile ? 'ml-2' : 'ml-4'}`} />}
                    </button>
                    <button onClick={onNext} className="p-4 lg:p-6 border border-zinc-800 hover:border-[#00F3FF] transition-all"><SkipForward size={isMobile ? 24 : 40} /></button>
                  </div>
                </div>
              </div>

              {/* Column 3: Terminal (Mobile: Last) */}
              <div className={`${isMobile ? 'w-full order-3' : 'w-1/4'} flex flex-col border border-zinc-800 bg-black/40`}>
                <div className="p-4 border-b border-zinc-800 flex items-center gap-3 text-cyan-500">
                  <Terminal size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Neural_Lyrics_Terminal</span>
                </div>
                <div className={`flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar ${isMobile ? 'h-64' : ''}`}>
                  {lyrics.map((line, i) => (
                    <div key={i} className="text-[10px] text-zinc-500 hover:text-[#00F3FF] transition-colors leading-relaxed uppercase">
                      <span className="text-[#00F3FF]/30 mr-3">[{i.toString().padStart(2, '0')}]</span>
                      {line}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 text-[8px] text-zinc-600 flex justify-between uppercase">
                  <span>Encoding: UTF-8</span>
                  <span className="animate-pulse">Status: Syncing...</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
