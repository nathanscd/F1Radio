import React, { useState } from 'react';
import { Play, Activity, Gauge, Zap, Timer, ChevronRight, Search as SearchIcon } from 'lucide-react';

interface Track { id: string; title: string; artist: string; thumbnail: string; }
interface HomeProps { 
  playlist: Track[]; 
  currentTrack: Track; 
  isPlaying: boolean; 
  onSelectTrack: (track: Track) => void;
  onSearch: (query: string) => void;
}

export default function Home({ playlist, currentTrack, isPlaying, onSelectTrack, onSearch }: HomeProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="p-6 lg:p-12 relative font-['Orbitron',sans-serif] min-h-screen">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
      
      <header className="mb-12 relative flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-baseline gap-4 mb-2">
            <h2 className="text-6xl lg:text-8xl font-black italic uppercase tracking-tighter text-white">
              PIT <span className="text-[#FF001D]">WALL</span>
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => <div key={i} className="w-8 h-1 bg-[#FF001D]" />)}
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em]">Global Search Active</span>
          </div>
        </div>

        {/* Search Bar - The "Engine" for unlimited music */}
        <form onSubmit={handleSubmit} className="relative w-full md:w-96 group">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH TRACK OR PASTE YT LINK..."
            className="w-full bg-[#0a0a0a] border-2 border-zinc-800 rounded-xl py-4 px-6 pl-12 text-[10px] font-bold tracking-widest text-white focus:outline-none focus:border-[#FF001D] transition-all placeholder:text-zinc-700"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#FF001D] transition-colors" size={18} />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-[#FF001D] hover:scale-110 transition-transform">ENGAGE</button>
        </form>
      </header>

      {/* Featured Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
        <div className="xl:col-span-2 bg-[#0a0a0a] border border-zinc-800 rounded-xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Gauge size={120} className="text-white" />
          </div>
          <div className="relative z-10">
            <span className="text-[#FF001D] text-[10px] font-bold tracking-widest uppercase mb-4 block">Current Session</span>
            <h1 className="text-4xl font-black uppercase italic mb-6 truncate max-w-full">{currentTrack.title}</h1>
            <div className="flex flex-wrap gap-8">
              <div className="flex flex-col">
                <span className="text-zinc-600 text-[9px] uppercase mb-1">Source</span>
                <span className="text-white font-mono text-sm uppercase">YouTube_Feed</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-600 text-[9px] uppercase mb-1">Status</span>
                <span className="text-green-500 font-mono text-sm flex items-center gap-2">
                  {isPlaying ? <><Activity size={14} /> ON TRACK</> : 'IN GARAGE'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#FF001D] rounded-xl p-8 flex flex-col justify-between text-white group cursor-pointer overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform">
            <Timer size={160} />
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase leading-tight">Global<br/>Access</h3>
            <p className="text-[10px] font-medium mt-2 opacity-80 uppercase tracking-widest">Paste any YouTube URL to play</p>
          </div>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="mb-8 flex items-center justify-between border-b border-zinc-800 pb-4">
        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">Recent Laps</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {playlist.map((track) => (
          <div 
            key={track.id} 
            onClick={() => onSelectTrack(track)}
            className={`group relative p-0 rounded-lg transition-all duration-500 cursor-pointer overflow-hidden border-2 ${currentTrack.id === track.id ? 'border-[#FF001D] bg-zinc-900' : 'border-transparent bg-[#0a0a0a] hover:border-zinc-700'}`}
          >
            <div className="relative aspect-video overflow-hidden">
              <img src={track.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              <div className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-300 ${currentTrack.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                  {isPlaying && currentTrack.id === track.id ? <Activity className="text-[#FF001D]" /> : <Play fill="white" className="text-white ml-1" />}
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-black text-[11px] uppercase tracking-tight truncate mb-1">{track.title}</h3>
              <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-tighter">{track.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
