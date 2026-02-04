import React from 'react';
import { Play, Activity } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface HomeProps {
  playlist: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
}

export default function Home({ playlist, currentTrack, isPlaying, onSelectTrack }: HomeProps) {
  return (
    <div className="p-10 relative">
      <header className="mb-12">
        <h2 className="text-7xl font-black italic uppercase tracking-tighter mb-2">Pit Wall</h2>
        <div className="flex items-center gap-4">
          <span className="h-[2px] w-20 bg-[#FF001D]" />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-[0.5em]">Live Race Feed</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {playlist.map((track) => (
          <div 
            key={track.id} 
            onClick={() => onSelectTrack(track)}
            className={`group relative p-4 transition-all duration-300 cursor-pointer border ${currentTrack.id === track.id ? 'bg-zinc-800/50 border-[#FF001D]/50 shadow-[0_0_20px_rgba(255,0,29,0.1)]' : 'bg-zinc-900/30 border-white/5 hover:border-white/20'}`}
          >
            <div className="relative aspect-square mb-4 overflow-hidden shadow-2xl">
              <img src={track.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
              <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${currentTrack.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <Play fill="#FF001D" color="#FF001D" size={40} className={isPlaying && currentTrack.id === track.id ? 'hidden' : ''} />
                {isPlaying && currentTrack.id === track.id && <Activity size={40} className="text-[#FF001D]" />}
              </div>
            </div>
            <h3 className="font-black text-[10px] uppercase tracking-widest truncate">{track.title}</h3>
            <p className="text-zinc-500 text-[9px] font-mono uppercase mt-1">{track.artist}</p>
          </div>
        ))}
      </div>
    </div>
  );
}