import React, { useState } from 'react';
import { Play, Activity, Gauge, Search as SearchIcon, Plus, X, Disc, Zap, Radio, Wind, Thermometer } from 'lucide-react';
import type { Track, Playlist } from '../types'; 

interface HomeProps {
  playlist: Track[]; // Resultados da busca
  currentTrack: Track;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onSearch: (query: string) => void;
  userPlaylists: Playlist[];
  onAddToPlaylist: (id: string, track: Track) => void;
}

export default function Home({ 
  playlist, 
  currentTrack, 
  isPlaying, 
  onSelectTrack, 
  onSearch, 
  userPlaylists, 
  onAddToPlaylist 
}: HomeProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch(''); // Isso deve limpar a lista 'playlist' no App.tsx
  };

  const hasResults = playlist.length > 0;

  return (
    <div className="p-6 lg:p-12 relative font-['Orbitron',sans-serif] min-h-screen">
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="mb-12 relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2 opacity-60">
            <Radio size={14} className="text-red-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.3em] text-white uppercase">System Online</span>
          </div>
          <h2 className="text-6xl lg:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]">
            PIT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF001D] to-red-800">WALL</span>
          </h2>
          
          {/* Mock Weather Data */}
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded border border-white/5">
                <Thermometer size={14} className="text-yellow-500" />
                <span className="text-[10px] font-mono text-zinc-400">TRACK: 32°C</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded border border-white/5">
                <Wind size={14} className="text-blue-500" />
                <span className="text-[10px] font-mono text-zinc-400">WIND: 4.2m/s</span>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={handleSubmit} className="relative w-full xl:w-[500px] group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-zinc-800 rounded-xl opacity-30 group-focus-within:opacity-100 transition duration-500 blur"></div>
          <div className="relative flex items-center bg-[#0a0a0a] rounded-xl">
            <SearchIcon className="absolute left-6 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={20} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ENTER TRACK DATA OR URL..."
              className="w-full bg-transparent border border-zinc-800 rounded-xl py-5 px-6 pl-14 text-xs font-bold tracking-widest text-white focus:outline-none placeholder:text-zinc-700 uppercase"
            />
            {query && (
              <button 
                type="button"
                onClick={clearSearch} 
                className="absolute right-20 p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
            <button 
              type="submit" 
              className="absolute right-2 h-[calc(100%-16px)] px-4 bg-red-600/10 hover:bg-red-600 border border-red-600/50 rounded-lg text-[9px] font-black text-red-500 hover:text-white uppercase tracking-wider transition-all"
            >
              Engage
            </button>
          </div>
        </form>
      </header>

      {/* CONTENT SWITCHER */}
      {hasResults ? (
        // === VIEW: SEARCH RESULTS ===
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-[2px] w-12 bg-red-600" />
                <h3 className="text-xl font-black italic uppercase text-white">Search Results</h3>
                <span className="text-zinc-600 text-xs font-mono bg-zinc-900 px-2 py-0.5 rounded">{playlist.length} UNITS FOUND</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {playlist.map((track) => (
                <div 
                    key={track.id} 
                    className={`group relative bg-[#0a0a0a] border ${currentTrack?.id === track.id ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-zinc-800 hover:border-zinc-600'} rounded-xl overflow-hidden transition-all duration-300`}
                >
                    <div onClick={() => onSelectTrack(track)} className="relative aspect-video overflow-hidden cursor-pointer">
                        <img src={track.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                        
                        {/* Play Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm bg-black/30">
                            <div className="w-14 h-14 bg-red-600 flex items-center justify-center rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                                <Play fill="white" className="ml-1" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-black text-xs uppercase text-white leading-tight line-clamp-2 pr-2">{track.title}</h3>
                            {currentTrack?.id === track.id && <Activity size={14} className="text-red-600 animate-pulse shrink-0" />}
                        </div>
                        <p className="text-zinc-500 text-[10px] font-mono uppercase truncate mb-4">{track.artist}</p>
                        
                        {/* Add to Playlist Dropdown */}
                        <div className="relative group/menu">
                            <button className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-400 text-[9px] font-bold py-2 rounded uppercase tracking-wider transition-all">
                                <Plus size={12} /> Save Data
                            </button>
                            
                            {/* Dropdown Menu */}
                            <div className="absolute bottom-full left-0 w-full mb-2 hidden group-hover/menu:block bg-[#0f0f0f] border border-zinc-800 rounded-lg shadow-2xl z-20 overflow-hidden">
                                <div className="px-3 py-2 text-[8px] text-zinc-500 font-mono border-b border-zinc-900 uppercase">Select Sector</div>
                                {userPlaylists.map((pl) => (
                                    <button 
                                        key={pl.id}
                                        onClick={() => onAddToPlaylist(pl.id, track)}
                                        className="w-full text-left px-3 py-2 text-[9px] font-bold text-zinc-300 hover:bg-red-600 hover:text-white uppercase transition-colors flex justify-between"
                                    >
                                        {pl.name}
                                        <Zap size={10} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
      ) : (
        // === VIEW: DEFAULT / MOST LISTENED ===
        <div className="animate-in fade-in zoom-in-95 duration-500">
            {/* Featured Widget (Active Track) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
                <div className="xl:col-span-2 relative bg-zinc-900/40 border border-white/5 rounded-2xl p-8 overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-zinc-400 text-[10px] font-mono tracking-widest uppercase">Current Telemetry</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black uppercase italic text-white leading-tight max-w-2xl mb-2 line-clamp-2">
                                {currentTrack?.title || "Waiting for Input..."}
                            </h1>
                            <p className="text-red-500 font-mono text-xs uppercase tracking-widest">{currentTrack?.artist || "System Idle"}</p>
                        </div>
                        
                        {currentTrack?.id && (
                             <div className="flex gap-8 mt-8 border-t border-white/10 pt-6">
                                <div>
                                    <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Session ID</div>
                                    <div className="font-mono text-white text-xs">#{currentTrack.id.slice(0, 8)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Signal Strength</div>
                                    <div className="font-mono text-green-500 text-xs">100% OPTIMAL</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Access / Stats */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center group hover:border-red-600/50 transition-colors">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Gauge size={32} className="text-white" />
                    </div>
                    <h3 className="text-lg font-black uppercase italic text-white mb-1">Global Database</h3>
                    <p className="text-zinc-500 text-[10px] uppercase font-mono max-w-[200px]">Access to unrestricted youtube audio feed</p>
                </div>
            </div>

            {/* User Playlists (Most Listened Concept) */}
            <div className="mb-6 flex items-end justify-between border-b border-zinc-800 pb-2">
                <h3 className="text-2xl font-black italic uppercase text-white">Frequent Sectors</h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">User Library</span>
            </div>

            {userPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userPlaylists.map((pl) => (
                        <div key={pl.id} className="bg-[#0f0f0f] border border-zinc-800 hover:border-red-600/50 p-6 rounded-xl group cursor-pointer transition-all hover:bg-zinc-900">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 group-hover:border-red-600/30 transition-colors">
                                    <Disc size={24} className="text-zinc-400 group-hover:text-white" />
                                </div>
                                <div className="text-[10px] font-mono text-zinc-600 group-hover:text-red-500 transition-colors">ID: {pl.id.slice(-4)}</div>
                            </div>
                            <h4 className="text-xl font-black uppercase italic text-white mb-1 truncate">{pl.name}</h4>
                            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">{pl.tracks.length} Data Tracks stored</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full py-20 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600">
                    <Disc size={48} className="mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xs">No Data Sectors Found</p>
                    <p className="text-[10px] font-mono mt-2">Create a playlist in the Hangar to start</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}