import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Library, ChevronRight, Trash2, 
  Search, LayoutGrid, List as ListIcon, 
  SortAsc, SortDesc, Edit2, Play, 
  Terminal, Database, Activity, HardDrive
} from 'lucide-react';
import type { Playlist } from '../types'; 

interface PlaylistsProps {
  playlists: Playlist[];
  onCreate: (name: string) => void;
  onOpen: (playlist: Playlist) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newName: string) => void; // Nova prop opcional
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

export default function Playlists({ playlists, onCreate, onOpen, onDelete, onRename }: PlaylistsProps) {
  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [sortBy, setSortBy] = useState<'NAME' | 'COUNT'>('NAME');

  // Lógica de Filtro e Ordenação
  const filteredPlaylists = useMemo(() => {
    let result = playlists.filter(pl => 
      pl.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'NAME') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.tracks.length - a.tracks.length);
    }

    return result;
  }, [playlists, searchQuery, sortBy]);

  // Handlers
  const openCreateModal = () => {
    setModalMode('CREATE');
    setInputValue('');
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, pl: Playlist) => {
    e.stopPropagation();
    setModalMode('EDIT');
    setSelectedId(pl.id);
    setInputValue(pl.name);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    if (modalMode === 'CREATE') {
      onCreate(inputValue);
    } else if (modalMode === 'EDIT' && selectedId && onRename) {
      onRename(selectedId, inputValue);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 lg:p-12 min-h-screen font-['Space_Mono',monospace] relative text-[#00F3FF] selection:bg-[#00F3FF] selection:text-black pb-32">
      
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00F3FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F3FF05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* --- HEADER CONTROL CENTER --- */}
      <header className="mb-12 relative z-10">
        <div className="flex flex-col xl:flex-row justify-between items-end gap-8 mb-8">
            <div className="w-full xl:w-auto">
                <div className="flex items-center gap-2 mb-3">
                    <Database size={12} className="text-[#00F3FF] animate-pulse" />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Memory_Sector_Manager</span>
                </div>
                <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter text-white italic drop-shadow-[2px_2px_0_rgba(0,243,255,0.3)]">
                    DATA_<span className="text-[#00F3FF]">BANKS</span>
                </h2>
            </div>
            
            {/* Create Button */}
            <button 
                onClick={openCreateModal}
                className="w-full xl:w-auto relative group px-8 py-4 bg-[#00F3FF]/10 border border-[#00F3FF] text-[#00F3FF] font-bold text-xs tracking-widest uppercase overflow-hidden transition-all hover:bg-[#00F3FF] hover:text-black shadow-[0_0_20px_rgba(0,243,255,0.1)]"
            >
                <div className="relative z-10 flex items-center justify-center gap-3">
                    <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                    Initialize_Sector
                </div>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
        </div>

        {/* --- TOOLBAR (Search & Filters) --- */}
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-[#001010] border border-[#004444] relative">
            <HUDCorner className="top-0 left-0" />
            <HUDCorner className="bottom-0 right-0 rotate-180" />
            
            {/* Search Input */}
            <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-[#005555] group-focus-within:text-[#00F3FF]" />
                </div>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="SEARCH_SECTOR_ID..." 
                    className="w-full bg-black border border-[#004444] py-2 pl-9 pr-4 text-xs font-bold text-[#00F3FF] placeholder-[#004444] focus:border-[#00F3FF] outline-none uppercase transition-all"
                />
            </div>

            <div className="flex gap-2">
                {/* View Toggles */}
                <div className="flex border border-[#004444] bg-black">
                    <button 
                        onClick={() => setViewMode('GRID')}
                        className={`p-2 hover:text-[#00F3FF] transition-colors ${viewMode === 'GRID' ? 'bg-[#00F3FF]/20 text-[#00F3FF]' : 'text-[#005555]'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <div className="w-[1px] bg-[#004444]" />
                    <button 
                        onClick={() => setViewMode('LIST')}
                        className={`p-2 hover:text-[#00F3FF] transition-colors ${viewMode === 'LIST' ? 'bg-[#00F3FF]/20 text-[#00F3FF]' : 'text-[#005555]'}`}
                        title="List View"
                    >
                        <ListIcon size={16} />
                    </button>
                </div>

                {/* Sort Toggles */}
                <button 
                    onClick={() => setSortBy(prev => prev === 'NAME' ? 'COUNT' : 'NAME')}
                    className="px-4 py-2 border border-[#004444] bg-black text-xs font-bold text-[#008888] hover:text-[#00F3FF] hover:border-[#00F3FF] uppercase flex items-center gap-2 transition-all min-w-[140px] justify-between"
                >
                    <span>Sort: {sortBy}</span>
                    {sortBy === 'NAME' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                </button>
            </div>
        </div>
      </header>

      {/* --- CONTENT --- */}
      {filteredPlaylists.length === 0 ? (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full h-64 border border-dashed border-[#004444] bg-black/40 flex flex-col items-center justify-center gap-4 text-[#005555]"
        >
            <HardDrive size={48} className="opacity-50" />
            <div className="text-center">
                <h3 className="text-sm font-bold uppercase tracking-widest">NO_DATA_MATCH</h3>
                <p className="text-[10px]">Try distinct query parameters</p>
            </div>
        </motion.div>
      ) : (
        <div className={viewMode === 'GRID' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10" 
            : "flex flex-col gap-2 relative z-10"
        }>
            <AnimatePresence mode="popLayout">
            {filteredPlaylists.map((pl, i) => (
                <motion.div 
                    key={pl.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    onClick={() => onOpen(pl)}
                    className={`group relative bg-black border border-[#004444] hover:border-[#00F3FF] cursor-pointer transition-all duration-300 overflow-hidden ${viewMode === 'GRID' ? 'p-6 h-64 flex flex-col justify-between' : 'p-4 flex items-center justify-between hover:bg-[#00F3FF]/5'}`}
                >
                    {/* Common Visuals */}
                    {viewMode === 'GRID' && <ScanLine />}
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
                         {onRename && (
                            <button onClick={(e) => openEditModal(e, pl)} className="p-1.5 bg-black border border-[#00F3FF] text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black transition-colors">
                                <Edit2 size={12} />
                            </button>
                         )}
                         <button onClick={(e) => { e.stopPropagation(); onDelete(pl.id); }} className="p-1.5 bg-black border border-[#FF003C] text-[#FF003C] hover:bg-[#FF003C] hover:text-white transition-colors">
                            <Trash2 size={12} />
                         </button>
                    </div>

                    {/* --- GRID VIEW CONTENT --- */}
                    {viewMode === 'GRID' && (
                        <>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-[9px] font-bold border border-[#00F3FF]/30 px-1.5 py-0.5 text-[#00F3FF]/60 group-hover:text-[#00F3FF] transition-colors">
                                        SEC_0x{pl.id.slice(-3).toUpperCase()}
                                    </div>
                                    <Activity size={16} className="text-[#004444] group-hover:text-[#00F3FF] transition-colors" />
                                </div>
                                
                                <h3 className="text-2xl font-black uppercase text-white mb-2 group-hover:text-[#00F3FF] transition-colors truncate">
                                    {pl.name}
                                </h3>
                                <div className="text-[10px] text-[#008888] font-bold uppercase tracking-widest mb-4">
                                    {pl.tracks.length} Files Stored
                                </div>
                            </div>
                            
                            <div>
                                {/* Mock Progress Bar representing capacity */}
                                <div className="w-full h-1 bg-[#002222] mb-4 overflow-hidden">
                                    <div 
                                        className="h-full bg-[#00F3FF] group-hover:animate-pulse" 
                                        style={{ width: `${Math.min(pl.tracks.length * 5, 100)}%` }} 
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[#005555] group-hover:text-white transition-colors">
                                    <span className="text-[9px] font-bold uppercase flex items-center gap-2">
                                        <Terminal size={10} /> Access_Data
                                    </span>
                                    <Play size={14} className="group-hover:text-[#00F3FF]" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- LIST VIEW CONTENT --- */}
                    {viewMode === 'LIST' && (
                        <>
                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                <div className="w-1 h-8 bg-[#004444] group-hover:bg-[#00F3FF] transition-colors" />
                                <div className="min-w-0">
                                    <h3 className="font-bold text-white uppercase text-sm group-hover:text-[#00F3FF] truncate">{pl.name}</h3>
                                    <div className="text-[10px] text-[#005555] font-mono">ID: {pl.id.slice(0,8)}...</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-8 mr-8">
                                <div className="text-right hidden sm:block">
                                    <div className="text-[10px] text-[#008888]">NODES</div>
                                    <div className="text-xs font-bold text-white">{pl.tracks.length}</div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <div className="text-[10px] text-[#008888]">STATUS</div>
                                    <div className="text-xs font-bold text-[#00F3FF]">MOUNTED</div>
                                </div>
                            </div>

                            <ChevronRight size={16} className="text-[#004444] group-hover:text-[#00F3FF]" />
                        </>
                    )}
                </motion.div>
            ))}
            </AnimatePresence>
        </div>
      )}

      {/* --- UNIVERSAL MODAL (CREATE / EDIT) --- */}
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
                        <span className="text-[10px] font-bold text-[#00F3FF] uppercase tracking-widest">
                            {modalMode === 'CREATE' ? 'Initialize_Protocol' : 'Modify_Protocol'}
                        </span>
                    </div>
                    <h3 className="text-3xl font-black uppercase text-white italic leading-tight">
                        {modalMode === 'CREATE' ? 'NEW_' : 'EDIT_'}<span className="text-[#00F3FF]">SECTOR</span>
                    </h3>
                </div>

                <div className="space-y-6 relative z-20">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[#00F3FF]/50 uppercase tracking-widest ml-1">Sector_Designation</label>
                        <input 
                            autoFocus
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleSubmit(); if(e.key === 'Escape') setIsModalOpen(false); }}
                            placeholder="INPUT_NAME..."
                            className="w-full bg-black border border-[#00F3FF]/30 focus:border-[#00F3FF] text-[#00F3FF] p-4 rounded-none text-sm font-bold tracking-widest outline-none transition-all uppercase placeholder:text-zinc-800 focus:shadow-[0_0_20px_rgba(0,243,255,0.2)]"
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
                            onClick={handleSubmit}
                            disabled={!inputValue.trim()}
                            className="flex-1 bg-[#00F3FF] text-black py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-[#00F3FF]"
                        >
                            {modalMode === 'CREATE' ? 'Initialize' : 'Update'}
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