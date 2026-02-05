import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  X, Plus, Search, Database, ChevronLeft, Shield, Activity, 
  Music, Play, MoreVertical, ListPlus, Trash2, 
  FastForward, Shuffle, SortAsc, CheckCircle2, AlertOctagon
} from "lucide-react";
import type { Playlist, Track } from "../types";

// --- TYPES & INTERFACES ---

interface SinglePlaylistProps {
  playlist: Playlist;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onSearch: (query: string) => Promise<Track[]>;
  onAddTrack: (playlistId: string, track: Track) => void;
  // Novas Props para funcionalidade completa
  onRemoveTrack: (playlistId: string, trackId: string) => void;
  onQueueTrack: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onShufflePlay: (tracks: Track[]) => void;
}

type SortOption = 'added' | 'title' | 'artist';

// --- VISUAL UTILS ---

const HUDCorner = ({ className }: { className?: string }) => (
    <div className={`absolute w-3 h-3 border-[#00F3FF] opacity-40 pointer-events-none ${className}`}>
       <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00F3FF]" />
       <div className="absolute top-0 left-0 h-full w-[1px] bg-[#00F3FF]" />
    </div>
);

const ScanLine = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
    <div className="w-full h-[1px] bg-[#00F3FF] absolute top-0 animate-scanline shadow-[0_0_15px_#00F3FF]" />
  </div>
);

// --- COMPONENTES AUXILIARES ---

const CyberToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  
  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
      className={`fixed bottom-8 right-8 z-[3000] flex items-center gap-3 px-6 py-4 border-l-4 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
        type === 'success' ? 'bg-[#00F3FF]/10 border-[#00F3FF] text-[#00F3FF]' : 'bg-[#FF003C]/10 border-[#FF003C] text-[#FF003C]'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
      <div>
        <div className="text-[9px] font-black uppercase tracking-widest opacity-70">System_Notification</div>
        <div className="text-xs font-bold uppercase">{message}</div>
      </div>
      <ScanLine />
    </motion.div>
  );
};

const TrackMenu = ({ 
  isOpen, onClose, onAction 
}: { isOpen: boolean, onClose: () => void, onAction: (action: string) => void }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute right-0 top-8 z-[101] w-48 bg-black border border-[#00F3FF]/30 shadow-[0_0_15px_rgba(0,243,255,0.1)] flex flex-col p-1"
      >
        <button onClick={() => onAction('next')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#00F3FF]/20 text-[10px] font-bold uppercase text-white hover:text-[#00F3FF] transition-colors text-left">
          <FastForward size={14} /> Play Next
        </button>
        <button onClick={() => onAction('queue')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#00F3FF]/20 text-[10px] font-bold uppercase text-white hover:text-[#00F3FF] transition-colors text-left">
          <ListPlus size={14} /> Add to Queue
        </button>
        <div className="h-[1px] bg-[#00F3FF]/20 my-1" />
        <button onClick={() => onAction('remove')} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FF003C]/20 text-[10px] font-bold uppercase text-zinc-400 hover:text-[#FF003C] transition-colors text-left">
          <Trash2 size={14} /> Delete Entry
        </button>
      </motion.div>
    </>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function SinglePlaylist({ 
  playlist, onBack, onPlayTrack, onSearch, onAddTrack, 
  onRemoveTrack, onQueueTrack, onPlayNext, onShufflePlay 
}: SinglePlaylistProps) {
  
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('added');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Lógica de Ordenação
  const getSortedTracks = () => {
    const tracks = [...playlist.tracks];
    if (sortBy === 'title') return tracks.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'artist') return tracks.sort((a, b) => a.artist.localeCompare(b.artist));
    return tracks; // Default order (added)
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await onSearch(searchQuery);
      setSearchResults(results || []);
    } catch {
      setToast({ msg: "Neural Link Failed", type: "error" });
    }
    setIsSearching(false);
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  const heroImage = playlist.tracks[0]?.thumbnail || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070";

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative min-h-screen bg-[#020202] text-[#00F3FF] font-mono selection:bg-[#00F3FF] selection:text-black overflow-x-hidden"
    >
      <style>{`
        @keyframes scanline { 0% { top: -10%; } 100% { top: 110%; } }
        .animate-scanline { animation: scanline 4s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00F3FF33; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00F3FF; }
      `}</style>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && <CyberToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00F3FF03_1px,transparent_1px),linear-gradient(to_bottom,#00F3FF03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Scroll Progress Neon */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 w-full h-[2px] bg-[#00F3FF] z-[1001] origin-left shadow-[0_0_15px_#00F3FF]" />

      {/* HEADER HUD */}
      <header className="fixed top-0 left-0 w-full z-[1000] flex justify-between items-center px-4 md:px-12 py-4 md:py-6 bg-black/90 backdrop-blur-xl border-b border-[#00F3FF]/20">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[9px] font-bold tracking-[0.3em] opacity-50">SECTOR_ACCESS</span>
            <div className="flex items-center gap-3">
              <Database size={14} className="text-[#00F3FF] animate-pulse" />
              <h2 className="text-xs md:text-sm font-bold tracking-widest uppercase truncate max-w-[150px] md:max-w-none">{playlist.name}</h2>
            </div>
          </div>
          <div className="hidden md:flex flex-col border-l border-[#00F3FF]/20 pl-6">
            <span className="text-[9px] opacity-40 uppercase tracking-tighter">Status</span>
            <span className="text-[9px] text-green-500 font-bold flex items-center gap-1 uppercase"><Shield size={10} /> Secure</span>
          </div>
        </div>
        
        <button onClick={onBack} className="group flex items-center gap-3 bg-black border border-[#00F3FF]/30 px-4 py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-[#00F3FF] hover:text-black transition-all">
          <ChevronLeft size={14} /> <span className="hidden md:inline">Disconnect</span>
        </button>
      </header>

      <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-12 pt-28 md:pt-32 pb-24 z-10">
        
        {/* HERO SECTION */}
        <section className="relative mb-16 md:mb-20 group">
          <HUDCorner className="-top-2 -left-2" />
          <HUDCorner className="-bottom-2 -right-2 rotate-180" />
          
          <div className="relative aspect-[21/9] w-full border border-[#00F3FF]/20 bg-black overflow-hidden group">
            <ScanLine />
            <img src={heroImage} className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 flex flex-col md:flex-row md:items-end gap-6 w-full pr-12">
              <div className="w-16 h-16 md:w-20 md:h-20 border border-[#00F3FF] flex items-center justify-center bg-[#00F3FF]/5 shadow-[0_0_20px_rgba(0,243,255,0.1)] shrink-0">
                <Music size={32} className="text-[#00F3FF] animate-pulse" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-[9px] md:text-[10px] text-[#00F3FF] font-bold tracking-[0.5em] mb-1 uppercase">Playlist_Manifest</div>
                <h1 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-white truncate">
                  {playlist.name}
                </h1>
                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => {
                        if(playlist.tracks.length) onPlayTrack(playlist.tracks[0]);
                        showToast("Initiating Sequence", "success");
                    }}
                    className="flex items-center gap-2 bg-[#00F3FF] text-black px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all skew-x-[-10deg]"
                  >
                     <div className="skew-x-[10deg] flex items-center gap-2"><Play size={14} fill="currentColor"/> Play_All</div>
                  </button>
                  <button 
                     onClick={() => {
                         onShufflePlay(playlist.tracks);
                         showToast("Randomizing Data Stream", "success");
                     }}
                     className="flex items-center gap-2 border border-[#00F3FF] text-[#00F3FF] px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#00F3FF]/10 transition-all skew-x-[-10deg]"
                  >
                     <div className="skew-x-[10deg] flex items-center gap-2"><Shuffle size={14} /> Shuffle</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT: TELEMETRY */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="border border-[#00F3FF]/20 bg-black/40 p-6 relative backdrop-blur-sm">
              <HUDCorner className="top-0 left-0 w-2 h-2" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-[#00F3FF]">
                <Activity size={14} /> Telemetry_Report
              </h3>
              <div className="space-y-4 font-mono text-[10px]">
                <div className="flex justify-between border-b border-[#00F3FF]/10 pb-2">
                  <span className="opacity-40 uppercase">Total_Nodes</span>
                  <span className="text-white font-bold">{playlist.tracks.length}</span>
                </div>
                <div className="flex justify-between border-b border-[#00F3FF]/10 pb-2">
                  <span className="opacity-40 uppercase">Duration_Est</span>
                  <span className="text-white font-bold">--:--:--</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-40 uppercase">Sector_ID</span>
                  <span className="text-white font-bold">0x{playlist.id.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-l-2 border-[#00F3FF] bg-[#00F3FF]/5 font-mono text-[10px]">
               <p className="text-[#00F3FF] font-bold mb-2 uppercase tracking-widest">{'>'} SYSTEM_READY</p>
               <p className="opacity-50 uppercase tracking-tight leading-relaxed">
                   Neural interface synchronized. All audio buffers loaded. Waiting for user input.
               </p>
            </div>
          </aside>

          {/* RIGHT: TRACK LIST */}
          <main className="lg:col-span-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 border-b border-[#00F3FF]/20 pb-4">
                <div>
                    <span className="text-[10px] font-bold text-[#00F3FF] tracking-widest uppercase">Database_Entries</span>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">TRACK_LIST</h3>
                </div>
                <div className="flex gap-2">
                    {/* Botão de Sort */}
                    <div className="relative group">
                        <button className="h-full px-3 border border-[#00F3FF]/30 text-[#00F3FF] hover:bg-[#00F3FF]/10 flex items-center gap-2 text-[10px] font-bold uppercase">
                            <SortAsc size={14} /> Sort: {sortBy}
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-32 bg-black border border-[#00F3FF]/30 hidden group-hover:flex flex-col z-50">
                            {(['added', 'title', 'artist'] as SortOption[]).map(opt => (
                                <button key={opt} onClick={() => setSortBy(opt)} className="px-3 py-2 text-[9px] text-left uppercase text-zinc-400 hover:text-[#00F3FF] hover:bg-[#00F3FF]/10">
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-[#00F3FF] text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                    >
                        <Plus size={14} /> <span className="hidden sm:inline">Inject_Data</span>
                    </button>
                </div>
            </div>

            <div className="space-y-1">
              {playlist.tracks.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-[#00F3FF]/20 bg-[#00F3FF]/5">
                  <Database size={24} className="mx-auto text-[#00F3FF] opacity-50 mb-4" />
                  <p className="text-xs text-[#00F3FF] opacity-50 uppercase tracking-[0.5em]">Sector_Empty</p>
                </div>
              ) : (
                getSortedTracks().map((track, idx) => (
                  <motion.div 
                    key={track.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.03 }}
                    className="group relative flex items-center gap-4 p-3 border border-transparent hover:border-[#00F3FF]/30 hover:bg-[#00F3FF]/5 transition-all bg-black/40"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#00F3FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <span className="text-[10px] font-bold opacity-30 group-hover:text-[#00F3FF] transition-colors w-6 font-mono">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    
                    <div className="w-10 h-10 shrink-0 border border-white/10 overflow-hidden cursor-pointer" onClick={() => onPlayTrack(track)}>
                      <img src={track.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                    </div>
                    
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlayTrack(track)}>
                      <h4 className="text-xs font-bold uppercase text-white truncate group-hover:text-[#00F3FF] transition-colors">
                        {track.title}
                      </h4>
                      <p className="text-[9px] opacity-40 uppercase truncate tracking-widest">{track.artist}</p>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => onPlayTrack(track)}
                            className="p-2 text-[#00F3FF] hover:bg-[#00F3FF]/20 rounded-full transition-colors"
                        >
                            <Play size={14} fill="currentColor" />
                        </button>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setActiveMenuId(activeMenuId === track.id ? null : track.id)}
                                className="p-2 text-zinc-500 hover:text-white transition-colors"
                            >
                                <MoreVertical size={14} />
                            </button>
                            
                            <TrackMenu 
                                isOpen={activeMenuId === track.id}
                                onClose={() => setActiveMenuId(null)}
                                onAction={(action) => {
                                    if (action === 'next') { onPlayNext(track); showToast("Priority Elevated", "success"); }
                                    if (action === 'queue') { onQueueTrack(track); showToast("Link Established", "success"); }
                                    if (action === 'remove') { onRemoveTrack(playlist.id, track.id); showToast("Data Purged", "error"); }
                                    setActiveMenuId(null);
                                }}
                            />
                        </div>
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[2001] p-4 pointer-events-none"
            >
              <div className="bg-[#020202] border border-[#00F3FF] p-6 md:p-8 relative overflow-hidden pointer-events-auto shadow-[0_0_50px_rgba(0,243,255,0.1)]">
                <ScanLine />
                <HUDCorner className="top-2 left-2" />
                <HUDCorner className="bottom-2 right-2 rotate-180" />

                <div className="flex items-center justify-between mb-8 border-b border-[#00F3FF]/20 pb-4">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-[#00F3FF] animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-[0.3em]">Inject_Track_Data</span>
                  </div>
                  <button onClick={() => setIsAddModalOpen(false)} className="hover:text-white text-[#00F3FF]"><X size={20}/></button>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative mb-8 group">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#00F3FF] font-bold animate-pulse">{'>'}</span>
                  <input 
                    autoFocus type="text" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ENTER_QUERY..."
                    className="w-full bg-transparent border-b border-[#00F3FF]/30 py-3 pl-6 text-sm font-bold uppercase tracking-widest text-[#00F3FF] outline-none focus:border-[#00F3FF] transition-all placeholder:text-zinc-800"
                  />
                  <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-[#00F3FF]/50 hover:text-[#00F3FF] transition-colors">
                     {isSearching ? <Activity size={18} className="animate-spin"/> : <Search size={18} />}
                  </button>
                </form>

                <div className="h-64 md:h-80 overflow-y-auto custom-scrollbar border border-[#00F3FF]/10 bg-black/50 p-2 relative">
                  {isSearching ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <Activity size={32} className="text-[#00F3FF] animate-spin mb-4" />
                       <span className="text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Querying_Mainframe...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((t) => (
                      <div key={t.id} className="flex items-center gap-4 p-3 hover:bg-[#00F3FF]/10 border border-transparent hover:border-[#00F3FF]/20 transition-all group/item">
                          <img src={t.thumbnail} className="w-10 h-10 object-cover border border-white/10" alt="" />
                          <div className="flex-1 min-w-0">
                              <h5 className="text-[10px] font-bold text-white uppercase truncate">{t.title}</h5>
                              <p className="text-[8px] opacity-40 uppercase tracking-tighter truncate">{t.artist}</p>
                          </div>
                          <button 
                            onClick={() => {
                                onAddTrack(playlist.id, t);
                                showToast("Data Injected", "success");
                            }}
                            className="px-3 py-1.5 border border-[#00F3FF]/40 text-[#00F3FF] text-[8px] font-bold uppercase hover:bg-[#00F3FF] hover:text-black transition-all"
                          >
                            Add_Link
                          </button>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#00F3FF]/30 text-[10px] uppercase tracking-widest">
                        Awaiting_Input...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}