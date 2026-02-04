import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Playlists from './pages/Playlists';
import SinglePlaylist from './pages/SinglePlaylist';
import F1RadioPlayer from './components/Player';
import type { Playlist, Track } from './types'; 

const API_KEY = 'SUA_CHAVE_AQUI'; 

export default function App() {
  const [view, setView] = useState<'home' | 'playlists' | 'single-playlist'>('home');
  
  // Dados
  const [searchTracks, setSearchTracks] = useState<Track[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('pitwall_playlists');
    return saved ? JSON.parse(saved) : [];
  });

  // Player State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [playerQueue, setPlayerQueue] = useState<Track[]>([]);
  
  const playerRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('pitwall_playlists', JSON.stringify(userPlaylists));
  }, [userPlaylists]);

  const activePlaylist = userPlaylists.find(pl => pl.id === activePlaylistId);

  // --- LÓGICA DE API REUTILIZÁVEL ---
  
  // 1. Função Pura de Busca (Retorna os dados, não muda estado visual)
  const fetchYouTubeData = async (query: string): Promise<Track[]> => {
    if (!query) return [];
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${query}&type=video&videoCategoryId=10&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.items) {
        return data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high.url
        }));
      }
      return [];
    } catch (error) {
      console.error("YouTube API Error", error);
      return [];
    }
  };

  // 2. Busca da Home (Atualiza a tela principal)
  const handleGlobalSearch = async (query: string) => {
    const tracks = await fetchYouTubeData(query);
    setSearchTracks(tracks);
    setView('home');
  };

  // --- GERENCIAMENTO DE PLAYLISTS ---

  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = { id: Date.now().toString(), name, tracks: [] };
    setUserPlaylists(prev => [...prev, newPlaylist]);
  };

  const deletePlaylist = (id: string) => {
    setUserPlaylists(prev => prev.filter(pl => pl.id !== id));
    if (activePlaylistId === id) {
      setView('playlists');
      setActivePlaylistId(null);
    }
  };

  const addToPlaylist = (playlistId: string, track: Track) => {
    setUserPlaylists(prev => prev.map(pl => 
      pl.id === playlistId 
        ? { ...pl, tracks: [...pl.tracks, track] } 
        : pl
    ));
  };

  // --- PLAYER CONTROLS ---

  const playTrack = (track: Track, contextList: Track[]) => {
    setCurrentTrack(track);
    setPlayerQueue(contextList);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (!currentTrack || playerQueue.length === 0) return;
    const currentIndex = playerQueue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < playerQueue.length - 1) {
      setCurrentTrack(playerQueue[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (!currentTrack || playerQueue.length === 0) return;
    const currentIndex = playerQueue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(playerQueue[currentIndex - 1]);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-['Orbitron']">
      <Sidebar activeTab={view} setActiveTab={(v: any) => setView(v)} />

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0a0a0a] to-black relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-red-900/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          {view === 'home' && (
            <Home 
              playlist={searchTracks} 
              currentTrack={currentTrack || { id: '', title: '', artist: '', thumbnail: '' }} 
              isPlaying={isPlaying} 
              onSelectTrack={(t: Track) => playTrack(t, searchTracks.length > 0 ? searchTracks : [t])}
              onSearch={handleGlobalSearch}
              userPlaylists={userPlaylists}
              onAddToPlaylist={addToPlaylist}
            />
          )}

          {view === 'playlists' && (
            <Playlists 
              playlists={userPlaylists} 
              onCreate={createPlaylist} 
              onOpen={(pl: Playlist) => { setActivePlaylistId(pl.id); setView('single-playlist'); }} 
              onDelete={deletePlaylist} 
            />
          )}

          {/* AQUI ESTÁ A MUDANÇA CRÍTICA */}
          {view === 'single-playlist' && activePlaylist && (
            <SinglePlaylist 
              playlist={activePlaylist} 
              onBack={() => setView('playlists')}
              onPlayTrack={(t: Track) => playTrack(t, activePlaylist.tracks)}
              onSearch={fetchYouTubeData} // Passamos a função pura
              onAddTrack={addToPlaylist}  // Passamos a função de adicionar
            />
          )}
        </div>
      </main>

      <F1RadioPlayer 
        currentTrack={currentTrack || { id: '', title: 'Select Track', artist: 'System Idle', thumbnail: '' }}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onNext={handleNext}
        onPrev={handlePrev}
        playlist={playerQueue}
        onPlayerReady={(p) => playerRef.current = p}
        onStateChange={(state) => {
            if (state === 0) handleNext();
            if (state === 1) setIsPlaying(true);
            if (state === 2) setIsPlaying(false);
        }}
      />
    </div>
  );
}