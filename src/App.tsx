import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import F1RadioPlayer from './components/Player';

// Playlist inicial (Pode ser vazia ou com sugestões)
const INITIAL_PLAYLIST = [
  { id: "8AYy-BcjRXg", title: "F1 Official Theme", artist: "Brian Tyler", thumbnail: "https://i.ytimg.com/vi/8AYy-BcjRXg/mqdefault.jpg" },
  { id: "4TYv2PhG89A", title: "Smooth Operator", artist: "Sade", thumbnail: "https://i.ytimg.com/vi/4TYv2PhG89A/mqdefault.jpg" }
];

export default function App() {
  const [playlist, setPlaylist] = useState(INITIAL_PLAYLIST);
  const [currentTrack, setCurrentTrack] = useState(INITIAL_PLAYLIST[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const playerRef = useRef<any>(null);

  // Função para buscar músicas no YouTube via API pública de sugestão/search
  // Nota: Para uma busca real e robusta, o ideal é usar a YouTube Data API v3 com uma API Key.
  // Aqui usaremos uma lógica de atualização de estado para refletir a busca.
  const handleSearch = async (query: string) => {
    if (!query) return;
    
    // Simulação de busca (Em um cenário real, você chamaria fetch para a API do YouTube)
    // Exemplo de URL: `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=SUA_API_KEY`
    console.log("Buscando por:", query);
    // O usuário pode colar o ID do vídeo diretamente ou o link para tocar instantaneamente
    if (query.includes('youtube.com/watch?v=') || query.includes('youtu.be/')) {
      const id = query.split('v=')[1]?.split('&')[0] || query.split('/').pop();
      if (id) {
        const newTrack = { id, title: "Carregando...", artist: "YouTube Video", thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
        setCurrentTrack(newTrack);
        setIsPlaying(true);
      }
    }
  };

  const handlePlayerStateChange = (state: any) => {
    if (state === (window as any).YT.PlayerState.PLAYING) setIsPlaying(true);
    if (state === (window as any).YT.PlayerState.PAUSED) setIsPlaying(false);
    if (state === (window as any).YT.PlayerState.ENDED) handleNext();
  };

  const handleNext = () => {
    const idx = playlist.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1) setCurrentTrack(playlist[(idx + 1) % playlist.length]);
  };

  const handlePrev = () => {
    const idx = playlist.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1) setCurrentTrack(playlist[(idx - 1 + playlist.length) % playlist.length]);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-['Orbitron',sans-serif]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0a0a0a] to-black relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-red-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          {activeTab === 'home' && (
            <Home 
              playlist={playlist} 
              currentTrack={currentTrack} 
              isPlaying={isPlaying} 
              onSelectTrack={(track) => {
                setCurrentTrack(track);
                setIsPlaying(true);
              }}
              onSearch={handleSearch}
            />
          )}
        </div>
      </main>

      <F1RadioPlayer 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        playlist={playlist}
        onPlayerReady={(player) => { playerRef.current = player; }}
        onStateChange={handlePlayerStateChange}
      />

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
