import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Playlists from './pages/Playlists';
import SinglePlaylist from './pages/SinglePlaylist';
import F1RadioPlayer from './components/Player';
import CarMode from './components/CarMode';
import CustomCursor from './components/CustomCursor';
import type { Playlist, Track } from './types';

// Importar CSS do Leaflet
import 'leaflet/dist/leaflet.css';

const API_KEY = 'AIzaSyCJPOUehloQZoKx6a8zaKP0rL5RNw1Sdhc';

export default function App() {
  // --- NAVIGATION & UI STATE ---
  const [view, setView] = useState<'home' | 'playlists' | 'single-playlist'>('home');
  const [isCarMode, setIsCarMode] = useState(false);
  const [showCarPrompt, setShowCarPrompt] = useState(false);

  // --- DATA STATE ---
  const [searchTracks, setSearchTracks] = useState<Track[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('pitwall_playlists');
    return saved ? JSON.parse(saved) : [];
  });

  // --- PLAYER STATE ---
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [playerQueue, setPlayerQueue] = useState<Track[]>([]);
  
  const playerRef = useRef<any>(null);

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem('pitwall_playlists', JSON.stringify(userPlaylists));
  }, [userPlaylists]);

  // Detectar Orientação Mobile para Modo Carro
  useEffect(() => {
    const handleOrientation = (e: MediaQueryListEvent | MediaQueryList) => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile && e.matches && !isCarMode) {
        setShowCarPrompt(true);
      }
    };

    const mql = window.matchMedia("(orientation: landscape)");
    mql.addEventListener("change", handleOrientation);
    handleOrientation(mql);

    return () => mql.removeEventListener("change", handleOrientation);
  }, [isCarMode]);

  const activePlaylist = userPlaylists.find(pl => pl.id === activePlaylistId);

  // --- YOUTUBE API SERVICE ---
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
      console.error("DATA_LINK_ERROR:", error);
      return [];
    }
  };

  const handleGlobalSearch = async (query: string) => {
    const tracks = await fetchYouTubeData(query);
    setSearchTracks(tracks);
    setView('home');
  };

  // --- PLAYLIST LOGIC ---
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
    <div className="flex h-screen bg-[#020202] text-white overflow-hidden font-['Space_Mono',monospace]">
      <CustomCursor />

      {/* MODAL DE PROMPT: MODO CARRO */}
      <AnimatePresence>
        {showCarPrompt && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="border border-[#00F3FF] p-8 bg-[#020202] relative max-w-sm w-full">
              <div className="text-[#00F3FF] text-[10px] font-bold mb-2 uppercase tracking-[0.3em] animate-pulse">
                Auto_Detect: Landscape
              </div>
              <h2 className="text-xl font-black mb-8 uppercase italic leading-tight">
                Initialize <span className="text-[#00F3FF]">Cyber_HUD</span>?
              </h2>
              <div className="flex gap-4">
                <button 
                  onClick={() => { setIsCarMode(true); setShowCarPrompt(false); }}
                  className="flex-1 bg-[#00F3FF] text-black py-4 font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-colors"
                >
                  Confirm
                </button>
                <button 
                  onClick={() => setShowCarPrompt(false)}
                  className="flex-1 border border-zinc-800 text-zinc-500 py-4 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                >
                  Ignore
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDERIZAÇÃO CONDICIONAL: MODO CARRO VS INTERFACE PADRÃO */}
      {isCarMode ? (
        <CarMode 
          currentTrack={currentTrack} 
          isPlaying={isPlaying} 
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onNext={handleNext}
          onPrev={handlePrev}
          onExit={() => setIsCarMode(false)}
          onSearch={handleGlobalSearch}
          playlist={searchTracks}
          onSelectTrack={(t: Track) => playTrack(t, searchTracks)}
        />
      ) : (
        <>
          <Sidebar 
            activeTab={view} 
            setActiveTab={(v: any) => setView(v)} 
            isCarMode={isCarMode}
            onToggleCarMode={(val) => setIsCarMode(val)}
          />

          <main className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar">
            {/* Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#00F3FF]/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              {view === 'home' && (
                <Home 
                  playlist={searchTracks} 
                  currentTrack={currentTrack || { id: '', title: '', artist: '', thumbnail: '' }} 
                  isPlaying={isPlaying} 
                  onSelectTrack={(t: Track) => playTrack(t, searchTracks)}
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

              {view === 'single-playlist' && activePlaylist && (
                <SinglePlaylist 
                  playlist={activePlaylist} 
                  onBack={() => setView('playlists')}
                  onPlayTrack={(t: Track) => playTrack(t, activePlaylist.tracks)}
                  onSearch={fetchYouTubeData}
                  onAddTrack={addToPlaylist}
                />
              )}
            </div>
          </main>

          <F1RadioPlayer 
            currentTrack={currentTrack || { id: '', title: 'SYSTEM_IDLE', artist: 'NULL', thumbnail: '' }}
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
            onSearch={handleGlobalSearch}
            onSelectTrack={(t: Track) => playTrack(t, searchTracks)}
          />
        </>
      )}
    </div>
  );
}