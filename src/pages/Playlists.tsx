import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Library, ChevronRight, Trash2, AlertTriangle, X, Radio, Disc, Hash } from 'lucide-react';
import type { Playlist } from '../types'; 

interface PlaylistsProps {
  playlists: Playlist[];
  onCreate: (name: string) => void;
  onOpen: (playlist: Playlist) => void;
  onDelete: (id: string) => void;
}

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
    <div className="p-6 lg:p-12 min-h-screen font-['Orbitron',sans-serif] relative">
      
      {/* --- HEADER --- */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#FF001D] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase">Storage Unit</span>
          </div>
          <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white">
            Hangar <span className="text-zinc-700">Bay</span>
          </h2>
        </div>
        
        {/* Botão de Abrir Modal */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#FF001D] hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black text-xs flex items-center gap-3 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,0,29,0.3)] group"
        >
          <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          NEW SECTOR
        </button>
      </header>

      {/* --- EMPTY STATE --- */}
      {playlists.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-64 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-600 gap-4 bg-zinc-900/20"
        >
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} className="opacity-50" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-black uppercase tracking-widest">No Sectors Found</h3>
            <p className="text-[10px] font-mono mt-1 uppercase">Initialize a new playlist to store track data</p>
          </div>
        </motion.div>
      ) : (
        /* --- GRID DE PLAYLISTS --- */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {playlists.map((pl, i) => (
              <motion.div 
                key={pl.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpen(pl)}
                className="group relative bg-[#0a0a0a] border border-zinc-800 hover:border-red-600/50 p-8 rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,1)] hover:bg-zinc-900/40"
              >
                {/* Background Icon Decoration */}
                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <Library size={140} />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[9px] font-mono text-zinc-500 uppercase tracking-widest group-hover:text-[#FF001D] group-hover:border-[#FF001D]/30 transition-colors">
                      <Hash size={10} />
                      {pl.id.slice(-4)}
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pl.id);
                      }}
                      className="text-zinc-600 hover:text-[#FF001D] hover:bg-[#FF001D]/10 p-2 rounded-lg transition-all z-20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-2xl font-black uppercase italic text-white mb-2 truncate group-hover:text-[#FF001D] transition-colors">
                    {pl.name}
                  </h3>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <Disc size={12} className={pl.tracks.length > 0 ? "text-green-500" : "text-zinc-600"} />
                    <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                      {pl.tracks.length} Data Units Stored
                    </p>
                  </div>

                  <div className="w-full h-[1px] bg-zinc-800 group-hover:bg-zinc-700 transition-colors mb-4" />

                  <div className="flex items-center justify-between text-zinc-500 group-hover:text-white transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Open Channel</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-[#FF001D]" />
                  </div>
                </div>
                
                {/* Hover Line Animation */}
                <div className="absolute left-0 bottom-0 h-1 w-0 bg-[#FF001D] group-hover:w-full transition-all duration-500 ease-out" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* --- F1 STYLED MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            
            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-1 z-50 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              <div className="bg-[#050505] rounded-[22px] border border-zinc-900 p-8 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF001D]/5 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute top-4 right-4 flex gap-1">
                   {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 bg-zinc-700 rounded-full" />)}
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Radio size={16} className="text-[#FF001D] animate-pulse" />
                        <span className="text-[9px] font-mono text-[#FF001D] uppercase tracking-[0.2em] font-bold">New Strategy</span>
                    </div>
                    <h3 className="text-3xl font-black italic uppercase text-white leading-none">
                        Initialize <br/><span className="text-zinc-700">Sector</span>
                    </h3>
                </div>

                {/* Input Area */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Sector Designation</label>
                        <input 
                            autoFocus
                            type="text" 
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="NAME YOUR PLAYLIST..."
                            className="w-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 focus:border-[#FF001D] text-white p-4 rounded-xl text-sm font-bold tracking-wider outline-none transition-all uppercase placeholder:text-zinc-700"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-transparent hover:border-zinc-700"
                        >
                            Abort
                        </button>
                        <button 
                            onClick={handleCreate}
                            disabled={!newPlaylistName.trim()}
                            className="flex-1 bg-[#FF001D] hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-[#FF001D] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                        >
                            Confirm
                        </button>
                    </div>
                </div>

                {/* Bottom Tech Detail */}
                <div className="mt-6 flex justify-between items-center opacity-30">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Sys_ID: {Date.now().toString().slice(-6)}</span>
                    <div className="h-[2px] w-12 bg-zinc-800" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}