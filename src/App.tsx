import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Playlists from './pages/Playlists';
import SinglePlaylist from './pages/SinglePlaylist';
import F1RadioPlayer from './components/Player';
import CyberCarMode from './components/CarMode';
import CustomCursor from './components/CustomCursor';
import type { Playlist, Track } from './types';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = "https://f1radio.onrender.com";

declare global {
  interface Window {
    updateNeuralTitle: (title: string, artist: string) => void;
  }
}

export default function App() {
  const [view, setView] = useState<'home' | 'playlists' | 'single-playlist'>('home');
  const [isCarMode, setIsCarMode] = useState(false);
  const [showCarPrompt, setShowCarPrompt] = useState(false);
  const [searchTracks, setSearchTracks] = useState<Track[]>([]);
  
  // Persistência de Playlist
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('pitwall_playlists');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [playerQueue, setPlayerQueue] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const playerRef = useRef<any>(null);

  // Efeito para salvar playlists
  useEffect(() => {
    localStorage.setItem('pitwall_playlists', JSON.stringify(userPlaylists));
  }, [userPlaylists]);

  // Efeito para atualizar título da janela (Estética)
  useEffect(() => {
    if (window.updateNeuralTitle) {
      if (currentTrack && isPlaying) {
        window.updateNeuralTitle(currentTrack.title, currentTrack.artist);
      } else {
        window.updateNeuralTitle('SYSTEM_IDLE', '');
      }
    }
  }, [currentTrack, isPlaying]);

  // Busca na API
  const fetchYouTubeData = async (query: string): Promise<Track[]> => {
    if (!query || query.trim().length < 2) return [];
    setErrorMessage(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/music/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error("SERVER_ERROR");
      }
    } catch (e) {
      console.error(e); 
      setErrorMessage("PROTOCOLO_DE_BUSCA_OFFLINE: O back-end não respondeu na rota correta.");
      return [];
    }
  };

  const handleGlobalSearch = async (query: string) => {
    if (!query) return;
    setIsSearching(true);
    try {
      const tracks = await fetchYouTubeData(query);
      setSearchTracks(tracks);
      if (!isCarMode && tracks.length > 0) setView('home');
    } finally {
      setIsSearching(false);
    }
  };

  // --- CONTROLES DE PLAYER ---

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
    if (currentIndex > 0) setCurrentTrack(playerQueue[currentIndex - 1]);
  };

  // Funções Auxiliares para SinglePlaylist
  const handleAddToQueue = (track: Track) => {
    setPlayerQueue(prev => [...prev, track]);
  };

  const handlePlayNext = (track: Track) => {
    if (!currentTrack) {
        playTrack(track, [track]);
        return;
    }
    const currentIndex = playerQueue.findIndex(t => t.id === currentTrack.id);
    const newQueue = [...playerQueue];
    // Insere logo após a música atual
    newQueue.splice(currentIndex + 1, 0, track);
    setPlayerQueue(newQueue);
  };

  const handleShufflePlay = (tracks: Track[]) => {
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    if (shuffled.length > 0) {
        playTrack(shuffled[0], shuffled);
    }
  };

  const activePlaylist = userPlaylists.find(pl => pl.id === activePlaylistId);

  return (
    <div className="flex h-screen bg-[#020202] text-white overflow-hidden font-mono h-[100dvh]">
      <CustomCursor />

      {/* ERROR MODAL */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="border-2 border-red-500/50 bg-[#0a0000] p-6 max-w-md w-full relative">
              <div className="flex items-center gap-3 text-red-500 mb-4 font-bold uppercase tracking-tighter">
                <span className="w-2 h-2 bg-red-500 animate-ping" /> Erro_Critico_de_Dados
              </div>
              <div className="text-zinc-400 text-[10px] mb-6 leading-relaxed uppercase">{errorMessage}</div>
              <button onClick={() => setErrorMessage(null)} className="w-full border border-red-500/30 py-3 text-[10px] font-black uppercase hover:bg-red-500 transition-all">Ignorar_Alerta</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CAR MODE PROMPT */}
      <AnimatePresence>
        {showCarPrompt && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="border border-[#00F3FF] p-8 bg-[#020202] relative max-w-sm w-full">
              <div className="text-[#00F3FF] text-[10px] font-bold mb-2 uppercase tracking-[0.3em] animate-pulse">Auto_Detect: Landscape</div>
              <h2 className="text-xl font-black mb-8 uppercase italic leading-tight">Inicializar <span className="text-[#00F3FF]">Cyber_HUD</span>?</h2>
              <div className="flex gap-4">
                <button onClick={() => { setIsCarMode(true); setShowCarPrompt(false); }} className="flex-1 bg-[#00F3FF] text-black py-4 font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-colors">Confirmar</button>
                <button onClick={() => setShowCarPrompt(false)} className="flex-1 border border-zinc-800 text-zinc-500 py-4 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors">Ignorar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isCarMode ? (
        <CyberCarMode 
          currentTrack={currentTrack} 
          isPlaying={isPlaying} 
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onNext={handleNext}
          onPrev={handlePrev}
          onExit={() => setIsCarMode(false)}
          onSearch={handleGlobalSearch}
          playlist={searchTracks}
          onSelectTrack={(t: Track) => playTrack(t, searchTracks)}
          isSearching={isSearching}
        />
      ) : (
        <>
          <Sidebar 
            activeTab={view} 
            setActiveTab={(v: any) => setView(v)} 
            isCarMode={isCarMode} 
            onToggleCarMode={(val: boolean) => setIsCarMode(val)} 
          />
          <main className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar">
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
                  onAddToPlaylist={(plId: string, t: Track) => {
                    setUserPlaylists(prev => prev.map(pl => pl.id === plId ? { ...pl, tracks: [...pl.tracks, t] } : pl));
                  }}
                />
              )}
              {view === 'playlists' && (
                <Playlists 
                  playlists={userPlaylists} 
                  onCreate={(name: string) => setUserPlaylists(prev => [...prev, { id: Date.now().toString(), name, tracks: [] }])} 
                  onOpen={(pl: Playlist) => { setActivePlaylistId(pl.id); setView('single-playlist'); }} 
                  onDelete={(id: string) => {
                    setUserPlaylists(prev => prev.filter(pl => pl.id !== id));
                    if (activePlaylistId === id) { setView('playlists'); setActivePlaylistId(null); }
                  }} 
                />
              )}
              
              {/* CORREÇÃO APLICADA AQUI: Adicionadas as props obrigatórias */}
              {view === 'single-playlist' && activePlaylist && (
                <SinglePlaylist 
                  playlist={activePlaylist} 
                  onBack={() => setView('playlists')}
                  onPlayTrack={(t: Track) => playTrack(t, activePlaylist.tracks)}
                  onSearch={fetchYouTubeData}
                  onAddTrack={(plId: string, t: Track) => {
                    setUserPlaylists(prev => prev.map(pl => pl.id === plId ? { ...pl, tracks: [...pl.tracks, t] } : pl));
                  }}
                  onRemoveTrack={(plId: string, trackId: string) => {
                    setUserPlaylists(prev => prev.map(pl => 
                       pl.id === plId ? { ...pl, tracks: pl.tracks.filter(t => t.id !== trackId) } : pl
                    ));
                  }}
                  onQueueTrack={handleAddToQueue}
                  onPlayNext={handlePlayNext}
                  onShufflePlay={handleShufflePlay}
                />
              )}
            </div>
          </main>
        </>
      )}

      <div className={isCarMode ? "hidden pointer-events-none" : ""}>
        <F1RadioPlayer 
          currentTrack={currentTrack || { id: '', title: 'SYSTEM_IDLE', artist: 'NULL', thumbnail: '' }}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onNext={handleNext}
          onPrev={handlePrev}
          playlist={playerQueue}
          onPlayerReady={(p: any) => playerRef.current = p}
          onStateChange={(state: number) => {
              if (state === 0) handleNext();
              if (state === 1) setIsPlaying(true);
              if (state === 2) setIsPlaying(false);
          }}
          onSearch={handleGlobalSearch}
          onSelectTrack={(t: Track) => playTrack(t, searchTracks)}
        />
      </div>
    </div>
  );
}