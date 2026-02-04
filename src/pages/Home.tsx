import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search as SearchIcon, Plus, X, 
  Disc, Zap, Cpu, Terminal, 
  Share2, Activity, Lock, 
  ChevronRight, Save, Play, Minimize2,
  FileCode, Server, Shield
} from 'lucide-react';
import type { Track, Playlist } from '../types'; 

interface HomeProps {
  playlist: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onSearch: (query: string) => void;
  userPlaylists: Playlist[];
  onAddToPlaylist: (id: string, track: Track) => void;
}

// --- VISUAL ASSETS (CRT & GLITCH) ---

const CRTOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden h-screen w-screen">
    {/* Scanlines */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[size:100%_2px,3px_100%]" />
    {/* Flicker Animation */}
    <div className="absolute inset-0 bg-white opacity-[0.02] animate-flicker pointer-events-none" />
  </div>
);

const HackerText = ({ text, speed = 30 }: { text: string, speed?: number }) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayed}<span className="animate-pulse">_</span></span>;
};

// --- MAIN COMPONENT ---

export default function Home({ 
  playlist, currentTrack, isPlaying, onSelectTrack, 
  onSearch, userPlaylists, onAddToPlaylist 
}: HomeProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [systemLog, setSystemLog] = useState<string[]>(['> SYSTEM_READY', '> AWAITING_INPUT...']);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setSystemLog(prev => [`> ${msg} [${new Date().toLocaleTimeString()}]`, ...prev].slice(0, 5));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsSearching(true);
    addLog(`EXECUTING_SEARCH: "${query}"`);
    
    // Simula tempo de resposta do servidor
    setTimeout(() => {
        onSearch(query);
        setIsSearching(false);
        addLog(`DATA_RECEIVED`);
    }, 800);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    addLog('CLEAR_BUFFER');
  };

  const hasResults = playlist.length > 0;
  const hasTrack = !!currentTrack?.id;

  return (
    <div className="min-h-screen bg-[#020202] text-[#00F3FF] font-mono relative overflow-x-hidden selection:bg-[#00F3FF] selection:text-black">
      <CRTOverlay />
      
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00F3FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F3FF05_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <div className="p-4 lg:p-8 relative z-10 max-w-[1600px] mx-auto">
        
        {/* HEADER: TERMINAL STYLE */}
        <header className="mb-12 border-b-2 border-[#00F3FF] pb-6">
            <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
                <div>
                    <div className="text-xs mb-2 opacity-70 flex items-center gap-2">
                        <Shield size={12} /> SECURE_CONNECTION_ESTABLISHED
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter uppercase glitch-header" data-text="NETRUNNER_V1">
                        NETRUNNER_V1
                    </h1>
                </div>

                {/* SYSTEM LOG (Mini Console) */}
                <div className="hidden lg:block w-96 h-24 bg-[#001010] border border-[#00F3FF]/30 p-2 text-[10px] opacity-80 overflow-hidden font-mono">
                    {systemLog.map((log, i) => (
                        <div key={i} className="truncate text-[#00F3FF]/70">{log}</div>
                    ))}
                </div>
            </div>

            {/* COMMAND LINE SEARCH */}
            <div className="mt-8 w-full max-w-2xl">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-0 bg-[#00F3FF] opacity-0 group-focus-within:opacity-10 blur-md transition-opacity" />
                    <div className="flex items-center bg-black border border-[#00F3FF] h-12 px-4 relative z-10">
                        <span className="mr-3 text-[#00F3FF] font-bold animate-pulse">{'>'}</span>
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-[#00F3FF] placeholder-[#005555] uppercase font-bold text-sm"
                            placeholder="ENTER_QUERY_PARAMETERS..." 
                            autoComplete="off"
                        />
                        {query && (
                             <button type="button" onClick={clearSearch} className="hover:text-white transition-colors">
                                <X size={16} />
                             </button>
                        )}
                        <button type="submit" className="ml-4 px-4 py-1 bg-[#00F3FF]/10 border border-[#00F3FF]/50 text-xs font-bold hover:bg-[#00F3FF] hover:text-black transition-all">
                            EXECUTE
                        </button>
                    </div>
                </form>
            </div>
        </header>

        {/* CONTENT */}
        <AnimatePresence mode="wait">
            
            {/* 1. LOADING STATE */}
            {isSearching && (
                <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="py-20 flex flex-col items-center justify-center"
                >
                    <Terminal size={48} className="mb-4 animate-bounce" />
                    <div className="text-xl font-bold mb-2">ACCESSING_MAINFRAME...</div>
                    <div className="w-64 h-4 border border-[#00F3FF] p-1">
                        <motion.div 
                            className="h-full bg-[#00F3FF]"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.8, ease: "linear" }}
                        />
                    </div>
                </motion.div>
            )}

            {/* 2. SEARCH RESULTS (DATA GRID) */}
            {!isSearching && hasResults && (
                <motion.div 
                    key="results"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                    <div className="flex items-center justify-between mb-6 border-b border-[#00F3FF]/20 pb-2">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileCode size={20} /> QUERY_RESULTS
                        </h2>
                        <span className="bg-[#00F3FF] text-black px-2 py-0.5 text-xs font-bold">
                            {playlist.length} ENTRIES
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {playlist.map((track, i) => {
                            const isExpanded = expandedId === track.id;
                            
                            return (
                                <motion.div 
                                    key={track.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`relative border transition-all duration-300 group ${currentTrack?.id === track.id ? 'border-[#00F3FF] bg-[#00F3FF]/5' : 'border-[#004444] bg-black hover:border-[#00F3FF]/60'}`}
                                >
                                    <div className="flex p-4 gap-4">
                                        {/* Image (Hologram Effect) */}
                                        <div 
                                            onClick={() => onSelectTrack(track)}
                                            className="w-24 h-24 shrink-0 border border-[#00F3FF]/30 relative cursor-pointer overflow-hidden"
                                        >
                                            <img src={track.thumbnail} className="w-full h-full object-cover grayscale opacity-70 group-hover:opacity-100 transition-all group-hover:scale-110" alt="" />
                                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.2)_50%)] bg-[size:100%_4px] pointer-events-none" />
                                            
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                                                <Play className="text-[#00F3FF]" />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold truncate text-white group-hover:text-[#00F3FF] transition-colors">
                                                    {track.title}
                                                </h3>
                                                <p className="text-xs text-[#008888] truncate border-b border-[#004444] pb-1 mb-2">
                                                    {track.artist}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => setExpandedId(isExpanded ? null : track.id)}
                                                    className={`flex-1 py-1 text-[10px] font-bold uppercase border transition-all flex items-center justify-center gap-1 ${isExpanded ? 'bg-[#00F3FF] text-black border-[#00F3FF]' : 'border-[#004444] text-[#008888] hover:text-[#00F3FF] hover:border-[#00F3FF]'}`}
                                                >
                                                    {isExpanded ? <Minimize2 size={10} /> : <Plus size={10} />}
                                                    {isExpanded ? 'ABORT' : 'INJECT'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Playlist Selector */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-[#00F3FF] bg-[#001010] overflow-hidden"
                                            >
                                                <div className="p-3 grid gap-1">
                                                    <div className="text-[9px] text-[#005555] mb-1">SELECT_TARGET_DRIVE:</div>
                                                    {userPlaylists.length > 0 ? userPlaylists.map(pl => (
                                                        <button 
                                                            key={pl.id}
                                                            onClick={() => {
                                                                onAddToPlaylist(pl.id, track);
                                                                setExpandedId(null);
                                                                addLog(`UPLOADED_${track.id}_TO_${pl.name.toUpperCase()}`);
                                                            }}
                                                            className="text-left px-2 py-1.5 text-xs text-[#00AAAA] hover:bg-[#00F3FF] hover:text-black flex justify-between items-center group/btn transition-colors"
                                                        >
                                                            <span>{pl.name}</span>
                                                            <Save size={10} className="opacity-0 group-hover/btn:opacity-100" />
                                                        </button>
                                                    )) : (
                                                        <div className="text-[10px] text-red-500">ERROR: NO_DRIVES_FOUND</div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* 3. DASHBOARD (DEFAULT) */}
            {!isSearching && !hasResults && (
                <motion.div 
                    key="dashboard"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
                        
                        {/* ACTIVE PROCESS (Current Track) */}
                        <div className="xl:col-span-2 border border-[#00F3FF] bg-[#001010] p-6 relative overflow-hidden h-80 flex flex-col justify-between group">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 border-l border-b border-[#00F3FF]/20" />
                            
                            {hasTrack && (
                                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                    <img src={currentTrack.thumbnail} className="w-full h-full object-cover grayscale" alt="" />
                                    <div className="absolute inset-0 bg-black/50" />
                                </div>
                            )}

                            <div className="relative z-10">
                                <div className="inline-block px-2 py-0.5 border border-[#00F3FF] text-xs font-bold mb-4 bg-black">
                                    {/* isPlaying check seguro */}
                                    {hasTrack && isPlaying ? <span className="animate-pulse">● PROCESS_ACTIVE</span> : <span>○ PROCESS_IDLE</span>}
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold uppercase leading-none truncate text-white drop-shadow-[2px_2px_0_#00F3FF]">
                                    {hasTrack ? currentTrack.title : "NO_ACTIVE_PROCESS"}
                                </h2>
                                <div className="text-[#008888] mt-2 border-l-2 border-[#00F3FF] pl-2 text-sm">
                                    {hasTrack ? `PID: ${currentTrack.artist}` : "SYSTEM STANDBY"}
                                </div>
                            </div>

                            <div className="relative z-10 border-t border-[#004444] pt-4 flex justify-between items-end">
                                <div className="font-mono text-xs text-[#005555]">
                                    MEM_USAGE: <span className="text-[#00F3FF]">124MB</span>
                                </div>
                                <Activity size={24} className="text-[#00F3FF]" />
                            </div>
                        </div>

                        {/* NETWORK STATUS */}
                        <div className="border border-[#004444] bg-black p-6 flex flex-col justify-center relative">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,243,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[size:250%_250%] animate-scan" />
                            
                            <Server size={48} className="text-[#00F3FF] mb-4" />
                            <h3 className="text-xl font-bold mb-2">GLOBAL_NETWORK</h3>
                            <p className="text-xs text-[#008888] mb-6 leading-relaxed">
                                <HackerText text="Uplink established. Accessing public audio repositories via secure tunnel. Encryption level: High." speed={20} />
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-center">
                                <div className="border border-[#004444] p-1 text-[#005555]">PING: 14ms</div>
                                <div className="border border-[#004444] p-1 text-[#005555]">PKTS: 0% LOSS</div>
                            </div>
                        </div>
                    </div>

                    {/* PLAYLISTS / DRIVES */}
                    <div className="border-t border-[#004444] pt-6">
                        <div className="flex items-end justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Disc size={20} /> MOUNTED_DRIVES
                            </h3>
                            <span className="text-xs text-[#005555]">{userPlaylists.length} VOLUMES</span>
                        </div>

                        {userPlaylists.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {userPlaylists.map(pl => (
                                    <div key={pl.id} className="border border-[#004444] hover:border-[#00F3FF] hover:bg-[#00F3FF]/5 p-4 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-[10px] text-[#005555] group-hover:text-[#00F3FF]">DIR_{pl.id.slice(-4)}</div>
                                            <Zap size={14} className="text-[#004444] group-hover:text-[#00F3FF]" />
                                        </div>
                                        <div className="font-bold text-lg truncate text-white group-hover:text-[#00F3FF]">{pl.name}</div>
                                        <div className="w-full h-[2px] bg-[#002222] my-2 overflow-hidden">
                                            <div className="h-full bg-[#00F3FF] w-1/3 group-hover:w-full transition-all duration-700" />
                                        </div>
                                        <div className="text-[10px] text-[#005555] text-right">{pl.tracks.length} FILES</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-32 border border-dashed border-[#004444] flex flex-col items-center justify-center text-[#005555]">
                                <div className="text-xs font-bold">[EMPTY_SLOT]</div>
                                <div className="text-[10px]">NO_DRIVES_MOUNTED</div>
                            </div>
                        )}
                    </div>

                </motion.div>
            )}

        </AnimatePresence>

      </div>

      {/* GLOBAL STYLES */}
      <style>{`
        @keyframes flicker {
            0% { opacity: 0.02; }
            5% { opacity: 0.05; }
            10% { opacity: 0.02; }
            100% { opacity: 0.02; }
        }
        .animate-flicker {
            animation: flicker 4s infinite;
        }
        @keyframes scan {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }
        .animate-scan {
            animation: scan 4s linear infinite;
        }
        .glitch-header {
            position: relative;
        }
        .glitch-header::before, .glitch-header::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #020202;
        }
        .glitch-header::before {
            left: 2px;
            text-shadow: -1px 0 #FF003C;
            clip: rect(24px, 550px, 90px, 0);
            animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }
        .glitch-header::after {
            left: -2px;
            text-shadow: -1px 0 #00F3FF;
            clip: rect(85px, 550px, 140px, 0);
            animation: glitch-anim 2.5s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim {
            0% { clip: rect(12px, 9999px, 84px, 0); }
            100% { clip: rect(45px, 9999px, 100px, 0); }
        }
        @keyframes glitch-anim-2 {
            0% { clip: rect(65px, 9999px, 100px, 0); }
            100% { clip: rect(10px, 9999px, 60px, 0); }
        }
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #003333; }
        ::-webkit-scrollbar-thumb:hover { background: #00F3FF; }
      `}</style>
    </div>
  );
}