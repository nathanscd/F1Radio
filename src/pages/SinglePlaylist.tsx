import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  X, ExternalLink, Cpu, Terminal, Zap, Play, Music, 
  BarChart3, Plus, Search, Radio, Database, Check
} from "lucide-react";
import type { Playlist, Track } from "../types";

// --- INTERFACES ---
interface SinglePlaylistProps {
  playlist: Playlist;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  // Novas props para a funcionalidade de adicionar
  onSearch: (query: string) => Promise<Track[]>;
  onAddTrack: (playlistId: string, track: Track) => void;
}

interface StickyNoteProps {
  text: string;
  color?: string;
  rotate?: string;
  top?: string;
  left?: string;
  right?: string;
  author: string;
}

interface EngineerLogProps {
  name: string;
  role: string;
  text: string;
  time: string;
}

// --- COMPONENTES VISUAIS AUXILIARES ---

const HandDrawnCircle = ({ className, delay = 0 }: { className?: string, delay?: number }) => (
  <svg viewBox="0 0 100 100" className={`absolute pointer-events-none ${className}`}>
    <motion.path 
      d="M50,10 C20,10 10,30 10,50 C10,80 30,90 50,90 C80,90 90,70 90,50 C90,20 70,10 50,10 Z" 
      fill="none" stroke="#FF001D" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4"
      initial={{ pathLength: 0, opacity: 0 }} 
      whileInView={{ pathLength: 1.1, opacity: 0.4 }} 
      transition={{ duration: 2, delay: delay }}
    />
  </svg>
);

const HandDrawnArrow = ({ className, delay = 0 }: { className?: string, delay?: number }) => (
  <svg viewBox="0 0 100 50" className={`absolute pointer-events-none ${className}`} style={{ width: 80, height: 40 }}>
    <motion.path 
      d="M10,40 Q50,10 90,25" 
      fill="none" stroke="#FF001D" strokeWidth="2" 
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.6 }}
      transition={{ duration: 1, delay }}
    />
    <motion.path 
      d="M82,18 L90,25 L80,32" 
      fill="none" stroke="#FF001D" strokeWidth="2"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.6 }}
      transition={{ delay: delay + 0.8 }}
    />
  </svg>
);

const StickyNote = ({ text, color = "bg-[#ffeb3b]", rotate = "rotate-2", top, left, right, author }: StickyNoteProps) => (
  <motion.div 
    drag
    dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    whileInView={{ opacity: 1, scale: 1, y: 0 }}
    whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing' }}
    viewport={{ once: true }}
    className={`absolute ${top} ${left} ${right} ${color} text-black p-4 w-44 shadow-2xl z-30 transform ${rotate} hidden xl:block cursor-grab active:cursor-grabbing`}
  >
    <div className="w-10 h-4 bg-white/40 absolute -top-2 left-1/2 -translate-x-1/2 backdrop-blur-sm pointer-events-none" />
    <p className="font-mono text-[10px] leading-tight mb-3 font-bold uppercase tracking-tighter">"{text}"</p>
    <div className="flex justify-between items-center border-t border-black/10 pt-2">
      <span className="font-mono text-[7px] opacity-50 uppercase">Input_Log</span>
      <span className="font-mono text-[9px] font-black">{author}</span>
    </div>
  </motion.div>
);

const TelemetryGrid = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.15] z-0">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF000008_1px,transparent_1px),linear-gradient(to_bottom,#FF000008_1px,transparent_1px)] bg-[size:200px_200px]" />
  </div>
);

const EngineerLog = ({ name, role, text, time }: EngineerLogProps) => (
  <div className="group relative p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors font-mono text-xs overflow-hidden">
    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF001D]/40 group-hover:bg-[#FF001D] transition-colors" />
    <div className="flex items-center gap-3 mb-2">
      <div className="px-2 py-0.5 bg-[#FF001D]/10 border border-[#FF001D]/20 text-[#FF001D] text-[10px] font-bold">
        {role}
      </div>
      <span className="text-white/40 text-[10px]">{time}</span>
    </div>
    <p className="text-white/70 leading-relaxed uppercase tracking-tight">{text}</p>
    <div className="mt-3 flex items-center gap-2 text-white/20 text-[9px]">
      <Terminal size={10} />
      <span>AUTH_ID: {name}_SECURED</span>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function SinglePlaylist({ playlist, onBack, onPlayTrack, onSearch, onAddTrack }: SinglePlaylistProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Simula delay de rede para efeito "tech"
    setTimeout(async () => {
      const results = await onSearch(searchQuery);
      setSearchResults(results || []);
      setIsSearching(false);
    }, 600);
  };

  const handleAdd = (track: Track) => {
    onAddTrack(playlist.id, track);
  };

  const heroImage = playlist.tracks[0]?.thumbnail || "https://images.unsplash.com/photo-1635326444826-06c8f8e1e6c1?q=80&w=2070";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen bg-[#050505] text-white selection:bg-[#FF001D] selection:text-white overflow-x-hidden font-['Orbitron',sans-serif]"
    >
      <TelemetryGrid />
      
      {/* Scroll Progress */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 w-full h-[2px] bg-[#FF001D] z-[1001] origin-left shadow-[0_0_20px_#FF0000]" />

      {/* Header */}
      <div className="fixed top-0 left-0 w-full z-[1000] flex justify-between items-center px-6 md:px-12 py-6 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-[#FF001D] font-bold tracking-[0.3em] uppercase">Sector_Load_01</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-white text-xs opacity-40">SEQUENCE:</span>
              <span className="font-mono text-white text-xs tracking-widest uppercase"> {playlist.name.slice(0, 15)}_MIX</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          <div className="hidden md:flex flex-col">
            <span className="font-mono text-[10px] text-white/40 uppercase">Audio_Latency</span>
            <span className="font-mono text-[10px] text-green-500 flex items-center gap-1 uppercase font-bold">
              <Zap size={10} /> Sync: Optimal
            </span>
          </div>
        </div>
        
        <button 
          onClick={onBack} 
          className="group relative flex items-center gap-3 bg-white/5 border border-white/10 text-white px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-[#FF001D] hover:border-[#FF001D] transition-all overflow-hidden"
        >
          <span className="relative z-10">Return_To_Hangar</span>
          <X size={14} className="relative z-10" />
          <div className="absolute inset-0 bg-[#FF001D] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>

      <div className="relative w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-32 pb-24">
        
        {/* Post-its */}
        <StickyNote 
          text="BPM synchronization mandatory for this sector. Driver focus is priority." 
          author="RACE_ENG" 
          top="top-40" 
          right="right-10" 
          rotate="rotate-6" 
          color="bg-[#FF001D] text-white"
        />

        {/* HERO SECTION */}
        <div className="relative mb-20">
          <HandDrawnCircle className="w-32 h-32 -top-10 -left-10 opacity-40" delay={0.5} />
          <HandDrawnArrow className="top-1/2 -right-20 rotate-12 opacity-20" delay={1} />
          
          <div className="relative aspect-[21/9] w-full border border-white/10 bg-black overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-80" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0" />
            
            <motion.div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img src={heroImage} className="w-full h-full object-cover opacity-50 blur-sm scale-105" alt="Cover" />
            </motion.div>
            
            <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
              <div className="px-3 py-1 bg-[#FF001D] text-white font-mono text-[10px] font-black uppercase tracking-widest skew-x-[-12deg]">
                Playlist_Core
              </div>
            </div>

            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border border-[#FF001D]/50 flex items-center justify-center bg-black/50 backdrop-blur-md">
                <Music size={24} className="text-[#FF001D] animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-white/40 uppercase">Designation</span>
                <h1 className="text-4xl md:text-6xl font-black uppercase italic text-white leading-none tracking-tighter">
                  {playlist.name}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24 relative">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-[1px] bg-[#FF001D]" />
                <span className="font-mono text-xs text-[#FF001D] uppercase tracking-[0.4em] font-bold">Briefing</span>
              </div>
              <p className="font-mono text-sm text-white/60 leading-relaxed uppercase tracking-tight">
                This audio sequence contains {playlist.tracks.length} high-fidelity tracks selected for optimal racing performance. Ensure volume levels are balanced for clear comms.
              </p>
            </motion.div>

            <div className="bg-white/[0.03] border border-white/10 p-6 relative overflow-hidden">
               <h3 className="font-mono text-xs uppercase text-white mb-6 flex items-center gap-3 font-bold tracking-widest">
                <Cpu size={14} className="text-[#FF001D]" /> Sequence_Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-mono text-[10px] text-white/40 uppercase">Total_Tracks</span>
                    <span className="font-mono text-sm text-white font-bold">{playlist.tracks.length}</span>
                </div>
                 <div className="flex justify-between items-center pb-2">
                    <span className="font-mono text-[10px] text-white/40 uppercase">Format</span>
                    <span className="font-mono text-[10px] text-[#FF001D] bg-[#FF001D]/10 px-2 py-0.5 border border-[#FF001D]/20">FLAC_LOSSLESS</span>
                </div>
              </div>
            </div>

            <EngineerLog 
                name="SYS_ADMIN" 
                role="Net_Sec" 
                time="14:22:00" 
                text="Playlist sync complete. All tracks cached locally for zero-latency playback." 
            />
          </div>

          {/* Right Column: Track List */}
          <div className="lg:col-span-7">
            <div className="relative pt-10">
                <HandDrawnArrow className="absolute top-0 right-10 opacity-30 rotate-180" delay={1.5} />
                
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] text-[#FF001D] uppercase font-bold tracking-widest">Audio_Database</span>
                        <h3 className="font-mono text-xl text-white uppercase font-black">Track_Components</h3>
                    </div>
                    
                    {/* BUTTON TO OPEN MODAL */}
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-[#FF001D] hover:bg-red-700 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,0,29,0.2)]"
                    >
                        <Plus size={12} strokeWidth={3} /> Inject_Data
                    </button>
                </div>

                <div className="border-t border-white/10">
                    <div className="grid grid-cols-[40px_1fr_1fr_60px] gap-4 py-3 px-4 text-[9px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                        <span>#</span>
                        <span>Title_ID</span>
                        <span>Source_Channel</span>
                        <span className="text-right">Action</span>
                    </div>

                    {playlist.tracks.length === 0 ? (
                         <div className="py-20 text-center border-b border-white/10">
                            <p className="font-mono text-xs text-white/30 uppercase tracking-widest">No Data Found In Sector</p>
                        </div>
                    ) : (
                        playlist.tracks.map((track, idx) => (
                            <motion.div 
                                key={track.id}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => onPlayTrack(track)}
                                className="group grid grid-cols-[40px_1fr_1fr_60px] gap-4 py-4 px-4 items-center border-b border-white/5 hover:bg-[#FF001D]/10 cursor-pointer transition-colors"
                            >
                                <span className="font-mono text-xs text-white/40 group-hover:text-[#FF001D]">
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                                
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={track.thumbnail} className="w-8 h-8 object-cover grayscale group-hover:grayscale-0 border border-white/10" alt="" />
                                    <span className="font-bold text-xs uppercase truncate text-white group-hover:text-[#FF001D] transition-colors font-['Orbitron']">
                                        {track.title}
                                    </span>
                                </div>
                                
                                <span className="font-mono text-[10px] text-white/50 uppercase truncate">
                                    {track.artist}
                                </span>
                                
                                <div className="flex justify-end">
                                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF001D] group-hover:bg-[#FF001D] transition-all">
                                        <Play size={12} className="text-white fill-current" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- DATA UPLINK MODAL (ADD TRACK) --- */}
      <AnimatePresence>
        {isAddModalOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsAddModalOpen(false)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] cursor-pointer"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[2001] pointer-events-auto p-4"
                >
                    <div className="bg-[#050505] border-2 border-[#FF001D] shadow-[0_0_50px_rgba(220,38,38,0.2)] rounded-sm overflow-hidden relative">
                        {/* Decorative Scanline */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF001D] shadow-[0_0_20px_#FF001D]" />
                        <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#ff000005_3px)] pointer-events-none" />

                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 bg-[#FF001D]/10 border-b border-[#FF001D]/30">
                            <div className="flex items-center gap-3">
                                <Database size={16} className="text-[#FF001D] animate-pulse" />
                                <span className="font-mono text-xs text-[#FF001D] uppercase font-bold tracking-[0.2em]">System_Uplink // Inject_Data</span>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-[#FF001D] hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            {/* Search Input */}
                            <form onSubmit={handleSearchSubmit} className="relative mb-8 group">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[#FF001D] font-bold text-lg">{'>'}</span>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ENTER_SEARCH_QUERY..."
                                    className="w-full bg-transparent border-b-2 border-white/20 py-3 pl-8 text-white font-mono text-sm uppercase tracking-wider focus:border-[#FF001D] outline-none placeholder:text-white/20"
                                />
                                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-[#FF001D] hover:text-white transition-colors">
                                    <Search size={18} />
                                </button>
                            </form>

                            {/* Results Area */}
                            <div className="min-h-[300px] max-h-[300px] overflow-y-auto custom-scrollbar border border-white/5 bg-white/[0.02] p-2 relative">
                                {isSearching ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#FF001D]">
                                        <Radio size={32} className="animate-ping mb-4" />
                                        <span className="font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Scanning_Network...</span>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-1">
                                        {searchResults.map((track) => (
                                            <div key={track.id} className="flex items-center gap-3 p-2 hover:bg-[#FF001D]/10 border border-transparent hover:border-[#FF001D]/30 transition-all group">
                                                <img src={track.thumbnail} className="w-10 h-10 object-cover border border-white/10 opacity-70 group-hover:opacity-100" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-xs text-white uppercase truncate font-['Orbitron']">{track.title}</p>
                                                    <p className="font-mono text-[9px] text-white/50 uppercase truncate">{track.artist}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleAdd(track)}
                                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-[#FF001D] text-white text-[9px] font-mono uppercase font-bold tracking-wider flex items-center gap-1 transition-colors"
                                                >
                                                    <Plus size={10} /> Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                                        <Terminal size={32} className="mb-2 opacity-50" />
                                        <span className="font-mono text-xs uppercase tracking-widest">Awaiting_Input</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-2 bg-[#050505] border-t border-white/10 flex justify-between items-center">
                             <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => <div key={i} className={`w-1 h-1 rounded-full ${i===0 ? 'bg-[#FF001D] animate-pulse' : 'bg-zinc-800'}`} />)}
                             </div>
                             <span className="font-mono text-[8px] text-zinc-600 uppercase">Secure_Connection_Established</span>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF001D; }
      `}</style>
    </motion.div>
  );
}