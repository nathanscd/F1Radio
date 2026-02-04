import React, { useState } from 'react';
import { Plus, Library, ChevronRight } from 'lucide-react';
import type { Playlist } from '../types'; 

interface PlaylistsProps {
  playlists: Playlist[];
  onCreate: (name: string) => void;
  onOpen: (playlist: Playlist) => void;
}

export default function Playlists({ playlists, onCreate, onOpen }: PlaylistsProps) {
  const [name, setName] = useState('');

  return (
    <div className="p-10">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter">Hangar</h2>
        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="NEW PLAYLIST NAME..."
            className="flex-1 md:w-64 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded text-[10px] focus:border-[#FF001D] outline-none"
          />
          <button 
            onClick={() => { if(name) onCreate(name); setName(''); }}
            className="bg-[#FF001D] px-6 py-2 rounded font-bold text-[10px] flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <Plus size={14} /> INITIALIZE
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((pl) => (
          <div 
            key={pl.id} 
            onClick={() => onOpen(pl)}
            className="bg-[#0a0a0a] border border-zinc-800 p-8 rounded-2xl group cursor-pointer hover:border-[#FF001D] transition-all relative overflow-hidden"
          >
            <Library size={120} className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity" />
            <h3 className="text-2xl font-black uppercase italic mb-1">{pl.name}</h3>
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em]">{pl.tracks.length} DATA_UNITS</p>
            <div className="mt-6 flex items-center text-[#FF001D] text-[10px] font-bold opacity-0 group-hover:opacity-100 uppercase tracking-widest transition-opacity">
              Access Sector <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}