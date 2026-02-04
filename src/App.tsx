import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import F1RadioPlayer from './components/Player';

const PLAYLIST = [
  { id: "8AYy-BcjRXg", title: "F1 Official Theme", artist: "Brian Tyler", thumbnail: "https://i.ytimg.com/vi/8AYy-BcjRXg/mqdefault.jpg" },
  { id: "ChxX3tR4mD0", title: "The Chain", artist: "Fleetwood Mac", thumbnail: "https://i.ytimg.com/vi/ChxX3tR4mD0/mqdefault.jpg" },
  { id: "h8P-d0RV2Mk", title: "One Kiss (Monaco Mix)", artist: "Dua Lipa", thumbnail: "https://i.ytimg.com/vi/h8P-d0RV2Mk/mqdefault.jpg" },
  { id: "WWEs82u37Mw", title: "Lose My Mind", artist: "Don Toliver", thumbnail: "https://i.ytimg.com/vi/WWEs82u37Mw/mqdefault.jpg" },
  { id: "4TYv2PhG89A", title: "Smooth Operator", artist: "Sade", thumbnail: "https://i.ytimg.com/vi/4TYv2PhG89A/mqdefault.jpg" }
];

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(PLAYLIST[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const playerRef = useRef<any>(null);

  // Sincroniza o estado global com o player do YouTube
  const handlePlayerStateChange = (state: any) => {
    if (state === (window as any).YT.PlayerState.PLAYING) setIsPlaying(true);
    if (state === (window as any).YT.PlayerState.PAUSED) setIsPlaying(false);
    if (state === (window as any).YT.PlayerState.ENDED) handleNext();
  };

  const handleNext = () => {
    const idx = PLAYLIST.findIndex(t => t.id === currentTrack.id);
    setCurrentTrack(PLAYLIST[(idx + 1) % PLAYLIST.length]);
  };

  const handlePrev = () => {
    const idx = PLAYLIST.findIndex(t => t.id === currentTrack.id);
    setCurrentTrack(PLAYLIST[(idx - 1 + PLAYLIST.length) % PLAYLIST.length]);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-['Orbitron',sans-serif]">
      {/* Sidebar Dinâmica */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0a0a0a] to-black relative">
        {/* Overlay de Ambientação F1 */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-red-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-8">
          {activeTab === 'home' && (
            <Home 
              playlist={PLAYLIST} 
              currentTrack={currentTrack} 
              isPlaying={isPlaying} 
              onSelectTrack={(track) => {
                setCurrentTrack(track);
                setIsPlaying(true);
              }} 
            />
          )}
        </div>
      </main>

      {/* Player F1 Integrado e Dinâmico */}
      <F1RadioPlayer 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        playlist={PLAYLIST}
        onPlayerReady={(player) => { playerRef.current = player; }}
        onStateChange={handlePlayerStateChange}
      />

      {/* Estilos Globais para Scrollbar e Fontes */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #FF0000; }
        
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}
