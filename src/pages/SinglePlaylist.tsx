import React from 'react';
import { Play, ArrowLeft, Clock, Music } from 'lucide-react';

export default function SinglePlaylist({ playlist, onBack, onPlayTrack }: any) {
  return (
    <div className="p-10 min-h-screen">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-10 text-[10px] font-bold uppercase tracking-widest transition-colors">
        <ArrowLeft size={14} /> Return to Hangar
      </button>

      <header className="flex flex-col md:flex-row items-end gap-8 mb-16">
        <div className="w-56 h-56 bg-gradient-to-br from-[#FF001D] to-black flex items-center justify-center rounded-3xl shadow-2xl">
          <Music size={80} color="white" />
        </div>
        <div className="pb-2">
          <span className="text-[#FF001D] text-[10px] font-bold uppercase tracking-[0.4em] mb-2 block">Stored Sequence</span>
          <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white">{playlist.name}</h2>
          <p className="text-zinc-500 font-mono text-[11px] mt-4 uppercase">{playlist.tracks.length} Tracks Synchronized</p>
        </div>
      </header>

      <div className="space-y-1">
        <div className="grid grid-cols-[50px_1fr_1fr_100px] gap-4 px-6 py-3 border-b border-zinc-900 text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em]">
          <span>ID</span>
          <span>Data_Track</span>
          <span>Origin</span>
          <span className="text-right">Action</span>
        </div>

        {playlist.tracks.map((track: any, i: number) => (
          <div 
            key={track.id}
            onClick={() => onPlayTrack(track)}
            className="grid grid-cols-[50px_1fr_1fr_100px] gap-4 px-6 py-4 items-center hover:bg-white/5 rounded-xl cursor-pointer group transition-all"
          >
            <span className="text-zinc-700 font-mono text-xs italic">{i + 1}</span>
            <div className="flex items-center gap-4">
              <img src={track.thumbnail} className="w-12 h-12 rounded-lg object-cover" alt="" />
              <span className="text-white font-bold text-xs uppercase truncate">{track.title}</span>
            </div>
            <span className="text-zinc-500 text-[10px] uppercase font-mono">{track.artist}</span>
            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={14} className="text-[#FF001D]" fill="currentColor" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}