import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  X, ExternalLink, Cpu, Terminal, Zap, Play, Music, 
  BarChart3, Plus, Search, Radio, Database, Check,
  ChevronLeft, Shield, Share2, Activity, FileCode
} from "lucide-react";
import type { Playlist, Track } from "../types";

interface SinglePlaylistProps {
  playlist: Playlist;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onSearch: (query: string) => Promise<Track[]>;
  onAddTrack: (playlistId: string, track: Track) => void;
}

// --- VISUAL UTILS ---

const HUDCorner = ({ className }: { className?: string }) => (
    <div className={`absolute w-3 h-3 border-[#00F3FF] opacity-40 ${className}`}>
       <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00F3FF]" />
       <div className="absolute top-0 left-0 h-full w-[1px] bg-[#00F3FF]" />
    </div>
);

const ScanLine = () => (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-10">
    <div className="w-full h-[1px] bg-[#00F3FF] absolute top-0 animate-scanline shadow-[0_0_15px_#00F3FF]" />
  </div>
);

const DataLog = ({ text, author, top, left, right }: any) => (
  <motion.div 
    drag
    initial={{ opacity: 0, x: 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    className={`absolute ${top} ${left} ${right} bg-black/80 border border-[#00F3FF]/30 p-4 w-56 backdrop-blur-md z-30 hidden xl:block cursor-grab active:cursor-grabbing shadow-[0_0_20px_rgba(0,243,255,0.1)]`}
  >
    <div className="flex items-center gap-2 mb-2 border-b border-[#00F3FF]/20 pb-1">
        <Activity size={10} className="text-[#00F3FF]" />
        <span className="text-[8px] font-bold text-[#00F3FF] uppercase tracking-widest">{author}_INPUT</span>
    </div>
    <p className="font-mono text-[9px] text-zinc-400 leading-relaxed uppercase">"{text}"</p>
    <HUDCorner className="top-0 left-0" />
    <HUDCorner className="bottom-0 right-0 rotate-180" />
  </motion.div>
);

// --- COMPONENTE PRINCIPAL ---

export default function SinglePlaylist({ playlist, onBack, onPlayTrack, onSearch, onAddTrack }: SinglePlaylistProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await onSearch(searchQuery);
    setSearchResults(results || []);
    setIsSearching(false);
  };

  const heroImage = playlist.tracks[0]?.thumbnail || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070";

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative min-h-screen bg-[#020202] text-[#00F3FF] font-mono selection:bg-[#00F3FF] selection:text-black overflow-x-hidden"
    >
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00F3FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F3FF05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Scroll Progress Neon */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 w-full h-[2px] bg-[#00F3FF] z-[1001] origin-left shadow-[0_0_15px_#00F3FF]" />

      {/* HEADER HUD */}
      <header className="fixed top-0 left-0 w-full z-[1000] flex justify-between items-center px-6 md:px-12 py-6 bg-black/80 backdrop-blur-xl border-b border-[#00F3FF]/20">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold tracking-[0.3em] opacity-50">ACCESSING_SECTOR</span>
            <div className="flex items-center gap-3">
              <Database size={14} className="text-[#00F3FF] animate-pulse" />
              <h2 className="text-sm font-bold tracking-widest uppercase">{playlist.name}</h2>
            </div>
          </div>
          <div className="hidden md:flex flex-col border-l border-[#00F3FF]/20 pl-6">
            <span className="text-[9px] opacity-40 uppercase tracking-tighter">Connection_Status</span>
            <span className="text-[9px] text-green-500 font-bold flex items-center gap-1 uppercase">
              <Shield size={10} /> Encryption_Active
            </span>
          </div>
        </div>
        
        <button 
          onClick={onBack} 
          className="group flex items-center gap-3 bg-black border border-[#00F3FF]/30 px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#00F3FF] hover:text-black transition-all"
        >
          <ChevronLeft size={14} /> Disconnect_Sector
        </button>
      </header>

      <div className="relative w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-32 pb-24 z-10">
        
        {/* DATA OVERLAYS */}
        <DataLog 
          text="Neural pattern synchronization required. Audio stream optimized for 44.1kHz." 
          author="SYS_ARCH" 
          top="top-40" 
          right="right-4" 
        />

        {/* HERO SECTION */}
        <section className="relative mb-20 group">
          <HUDCorner className="-top-4 -left-4" />
          <HUDCorner className="-bottom-4 -right-4 rotate-180" />
          
          <div className="relative aspect-[21/9] w-full border border-[#00F3FF]/20 bg-black overflow-hidden">
            <ScanLine />
            <img src={heroImage} className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
            
            <div className="absolute bottom-8 left-8 flex items-end gap-6">
              <div className="w-20 h-20 border border-[#00F3FF] flex items-center justify-center bg-[#00F3FF]/5 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                <Music size={32} className="text-[#00F3FF] animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="text-[10px] text-[#00F3FF] font-bold tracking-[0.5em] mb-2 uppercase">Protocol_Active</div>
                <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white">
                  {playlist.name}
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: TELEMETRY */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="border border-[#00F3FF]/20 bg-black/40 p-6 relative">
              <HUDCorner className="top-0 left-0 w-2 h-2" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <Cpu size={14} /> Telemetry_Report
              </h3>
              <div className="space-y-4 font-mono text-[10px]">
                <div className="flex justify-between border-b border-[#00F3FF]/10 pb-2">
                  <span className="opacity-40 uppercase">Total_Nodes</span>
                  <span className="text-white">{playlist.tracks.length}</span>
                </div>
                <div className="flex justify-between border-b border-[#00F3FF]/10 pb-2">
                  <span className="opacity-40 uppercase">Bitrate_Limit</span>
                  <span className="text-white">320kbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40 uppercase">Sector_ID</span>
                  <span className="text-white">0x{playlist.id.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-l-2 border-[#00F3FF] bg-[#00F3FF]/5 font-mono text-[10px]">
               <p className="text-[#00F3FF] font-bold mb-2 uppercase tracking-widest">{'>'} ACCESS_LOG</p>
               <p className="opacity-50 uppercase tracking-tight">Audio sequence verified. Cache optimized for local playback. Connection stable.</p>
            </div>
          </aside>

          {/* RIGHT: TRACK DATA GRID */}
          <main className="lg:col-span-8">
            <div className="flex items-end justify-between mb-8 border-b border-[#00F3FF]/20 pb-4">
                <div>
                    <span className="text-[10px] font-bold text-[#00F3FF] tracking-widest uppercase">Database_Entries</span>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">TRACK_MANIFEST</h3>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-[#00F3FF] text-black px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                >
                    <Plus size={14} /> Inject_Data
                </button>
            </div>

            <div className="space-y-1">
              {playlist.tracks.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-[#00F3FF]/20">
                  <p className="text-xs opacity-30 uppercase tracking-[0.5em]">Sector_Empty</p>
                </div>
              ) : (
                playlist.tracks.map((track, idx) => (
                  <motion.div 
                    key={track.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onPlayTrack(track)}
                    className="group flex items-center gap-4 p-4 border border-transparent hover:border-[#00F3FF]/30 hover:bg-[#00F3FF]/5 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold opacity-30 group-hover:text-[#00F3FF] transition-colors w-6">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="w-10 h-10 shrink-0 border border-white/10 overflow-hidden">
                      <img src={track.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold uppercase text-white truncate group-hover:text-[#00F3FF] transition-colors">
                        {track.title}
                      </h4>
                      <p className="text-[9px] opacity-40 uppercase truncate tracking-widest">{track.artist}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={14} className="text-[#00F3FF] fill-current" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* MODAL: DATA INJECTION */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/95 backdrop-blur-md z-[2000] cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[2001] p-4"
            >
              <div className="bg-[#020202] border border-[#00F3FF] p-8 relative overflow-hidden">
                <ScanLine />
                <HUDCorner className="top-2 left-2" />
                <HUDCorner className="bottom-2 right-2 rotate-180" />

                <div className="flex items-center justify-between mb-8 border-b border-[#00F3FF]/20 pb-4">
                  <div className="flex items-center gap-3">
                    <Terminal size={18} className="text-[#00F3FF] animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-[0.3em]">Inject_Track_Data</span>
                  </div>
                  <button onClick={() => setIsAddModalOpen(false)} className="hover:text-white"><X size={20}/></button>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative mb-8">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#00F3FF] font-bold">{'>'}</span>
                  <input 
                    autoFocus type="text" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ENTER_QUERY..."
                    className="w-full bg-transparent border-b border-[#00F3FF]/30 py-3 pl-6 text-sm font-bold uppercase tracking-widest text-[#00F3FF] outline-none focus:border-[#00F3FF] transition-all placeholder:text-zinc-800"
                  />
                  <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-[#00F3FF] hover:text-white"><Search size={18} /></button>
                </form>

                <div className="h-80 overflow-y-auto custom-scrollbar border border-[#00F3FF]/10 bg-black/50 p-2 relative">
                  {isSearching ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <Activity size={32} className="text-[#00F3FF] animate-spin mb-4" />
                       <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Querying_Mainframe...</span>
                    </div>
                  ) : searchResults.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 p-3 hover:bg-[#00F3FF]/10 border border-transparent hover:border-[#00F3FF]/20 transition-all group">
                        <img src={t.thumbnail} className="w-10 h-10 object-cover border border-white/10" alt="" />
                        <div className="flex-1 min-w-0">
                            <h5 className="text-[10px] font-bold text-white uppercase truncate">{t.title}</h5>
                            <p className="text-[8px] opacity-40 uppercase tracking-tighter truncate">{t.artist}</p>
                        </div>
                        <button 
                          onClick={() => onAddTrack(playlist.id, t)}
                          className="px-3 py-1.5 border border-[#00F3FF]/40 text-[#00F3FF] text-[8px] font-bold uppercase hover:bg-[#00F3FF] hover:text-black transition-all"
                        >
                          Add_Link
                        </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scanline { 0% { top: -10%; } 100% { top: 110%; } }
        .animate-scanline { animation: scanline 4s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00F3FF33; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00F3FF; }
      `}</style>
    </motion.div>
  );
}