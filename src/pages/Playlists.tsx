import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Library, ChevronRight, Trash2, 
  AlertTriangle, X, Radio, Disc, Hash, 
  Terminal, Database, Save, Activity 
} from 'lucide-react';
import type { Playlist } from '../types'; 

interface PlaylistsProps {
  playlists: Playlist[];
  onCreate: (name: string) => void;
  onOpen: (playlist: Playlist) => void;
  onDelete: (id: string) => void;
}

// --- VISUAL UTILS ---
const ScanLine = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
    <div className="w-full h-[1px] bg-[#00F3FF] absolute top-0 animate-scanline shadow-[0_0:10px_#00F3FF]" />
  </div>
);

const HUDCorner = ({ className }: { className?: string }) => (
    <div className={`absolute w-2 h-2 border-[#00F3FF] opacity-40 ${className}`}>
       <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00F3FF]" />
       <div className="absolute top-0 left-0 h-full w-[1px] bg-[#00F3FF]" />
    </div>
);

export default function Playlists({ playlists, onCreate, onOpen, onDelete }: PlaylistsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      onCreate(newPlaylistName);
      setNewPlaylistName('');
      setIsModalOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') setIsModalOpen(false);
  };

  return (
    <div className="p-6 lg:p-12 min-h-screen font-['Space_Mono',monospace] relative text-[#00F3FF] selection:bg-[#00F3FF] selection:text-black">
      
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00F3FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F3FF05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* --- HEADER --- */}
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-[#00F3FF] animate-ping" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Memory_Management_Unit</span>
          </div>
          <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter text-white italic">
            DATA_<span className="text-[#00F3FF]">BANKS</span>
          </h2>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative group px-8 py-4 bg-[#00F3FF]/10 border border-[#00F3FF] text-[#00F3FF] font-bold text-xs tracking-widest uppercase overflow-hidden transition-all hover:bg-[#00F3FF] hover:text-black shadow-[0_0_20px_rgba(0,243,255,0.1)]"
        >
          <div className="relative z-10 flex items-center gap-3">
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            Initialize_Sector
          </div>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </header>

      {/* --- EMPTY STATE --- */}
      {playlists.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="w-full h-80 border border-[#00F3FF]/20 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-6 relative"
        >
          <HUDCorner className="top-4 left-4" />
          <HUDCorner className="bottom-4 right-4 rotate-180" />
          <Database size={48} className="opacity-20 animate-pulse" />
          <div className="text-center">
            <h3 className="text-lg font-bold uppercase tracking-widest text-white">No_Sectors_Found</h3>
            <p className="text-[10px] mt-2 opacity-50 font-bold uppercase">System awaiting new data block initialization</p>
          </div>
        </motion.div>
      ) : (
        /* --- PLAYLISTS GRID --- */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
          <AnimatePresence>
            {playlists.map((pl, i) => (
              <motion.div 
                key={pl.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpen(pl)}
                className="group relative bg-black border border-[#00F3FF]/20 hover:border-[#00F3FF] p-8 cursor-pointer transition-all duration-300 overflow-hidden"
              >
                <ScanLine />
                <HUDCorner className="top-0 left-0 opacity-20 group-hover:opacity-100" />
                <HUDCorner className="bottom-0 right-0 rotate-180 opacity-20 group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-[9px] font-bold border border-[#00F3FF]/30 px-2 py-1 bg-black text-[#00F3FF]/60 group-hover:text-[#00F3FF] transition-colors">
                      SEC_0x{pl.id.slice(-4).toUpperCase()}
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pl.id);
                      }}
                      className="text-zinc-700 hover:text-[#FF003C] transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-2xl font-bold uppercase text-white mb-4 group-hover:text-[#00F3FF] transition-colors">
                    {pl.name}
                  </h3>
                  
                  <div className="flex items-center gap-3 mb-8">
                    <div className={`w-1.5 h-1.5 rounded-full ${pl.tracks.length > 0 ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-zinc-800'}`} />
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                      {pl.tracks.length} Data_Blocks_Linked
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[#00F3FF]/40 group-hover:text-white transition-colors pt-4 border-t border-[#00F3FF]/10">
                    <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={10} /> Access_Sector
                    </span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Animated Background Indicator */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#00F3FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* --- MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[110] p-1 bg-[#00F3FF]/20"
            >
              <div className="bg-[#020202] border border-[#00F3FF] p-8 relative overflow-hidden">
                <ScanLine />
                <HUDCorner className="top-2 left-2" />
                <HUDCorner className="bottom-2 right-2 rotate-180" />

                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity size={16} className="text-[#00F3FF] animate-pulse" />
                        <span className="text-[10px] font-bold text-[#00F3FF] uppercase tracking-widest">Initialize_Protocol</span>
                    </div>
                    <h3 className="text-3xl font-black uppercase text-white italic leading-tight">
                        NEW_<span className="text-[#00F3FF]">SECTOR</span>
                    </h3>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[#00F3FF]/50 uppercase tracking-widest ml-1">Sector_Designation</label>
                        <input 
                            autoFocus
                            type="text" 
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="INPUT_NAME..."
                            className="w-full bg-black border border-[#00F3FF]/30 focus:border-[#00F3FF] text-[#00F3FF] p-4 rounded-none text-sm font-bold tracking-widest outline-none transition-all uppercase placeholder:text-zinc-800"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 bg-transparent border border-zinc-800 text-zinc-500 py-3 text-[10px] font-bold uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-all"
                        >
                            Abort
                        </button>
                        <button 
                            onClick={handleCreate}
                            disabled={!newPlaylistName.trim()}
                            className="flex-1 bg-[#00F3FF] text-black py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-[#00F3FF]"
                        >
                            Initialize
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center opacity-20">
                    <span className="text-[8px] font-bold uppercase tracking-widest">Enc_Key: 0x{Date.now().toString().slice(-6)}</span>
                    <div className="h-[1px] w-20 bg-[#00F3FF]" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scanline { 0% { top: -10%; } 100% { top: 110%; } }
        .animate-scanline { animation: scanline 4s linear infinite; }
      `}</style>
    </div>
  );
}