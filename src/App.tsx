import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Home from './pages/Home'; 
import Playlists from './pages/Playlists';
import SinglePlaylist from './pages/SinglePlaylist';
import CyberPlayer from './components/Player';
import CyberCarMode from './components/CarMode';
import CustomCursor from './components/CustomCursor';
import type { Playlist, Track } from './types';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = "https://f1radio.onrender.com"; 
const SILENT_AUDIO = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

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
  const [radioMode, setRadioMode] = useState(false);
  
  const silentAudioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('pitwall_playlists', JSON.stringify(userPlaylists));
  }, [userPlaylists]);

  useEffect(() => {
    if (window.updateNeuralTitle) {
      if (currentTrack && isPlaying) {
        window.updateNeuralTitle(currentTrack.title, currentTrack.artist);
      } else {
        window.updateNeuralTitle('SYSTEM_IDLE', '');
      }
    }
  }, [currentTrack, isPlaying]);

  const enableBackgroundAudio = useCallback(() => {
    if (silentAudioRef.current && silentAudioRef.current.paused) {
      silentAudioRef.current.play().catch(() => {});
    }
  }, []);

  const fetchYouTubeData = useCallback(async (query: string): Promise<Track[]> => {
    if (!query || query.trim().length < 2) return [];
    try {
      const response = await fetch(`${BACKEND_URL}/api/music/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error("SERVER_ERROR");
      }
    } catch (e) {
      console.error(e); 
      return [];
    }
  }, []);

  const handleGlobalSearch = async (query: string) => {
    if (!query) return;
    setIsSearching(true);
    setErrorMessage(null);
    try {
      const tracks = await fetchYouTubeData(query);
      setSearchTracks(tracks);
      
      if (!isCarMode && tracks.length > 0) setView('home');
      
      if (tracks.length === 0) {
          setErrorMessage("NENHUM_RESULTADO_COMPATIVEL: Tente outra frequência.");
          setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (err) {
      setErrorMessage("ERRO_CONEXAO: Falha ao acessar o banco de dados neural.");
    } finally {
      setIsSearching(false);
    }
  };

  const playTrack = useCallback((track: Track, contextList: Track[]) => {
    enableBackgroundAudio();
    setCurrentTrack(track);
    setPlayerQueue([...contextList]);
    setIsPlaying(true);
    setRadioMode(false);
  }, [enableBackgroundAudio]);

  const handleNext = useCallback(async () => {
    if (!currentTrack || playerQueue.length === 0) return;

    const currentIndex = playerQueue.findIndex(t => t.id === currentTrack.id);

    if (currentIndex !== -1 && currentIndex < playerQueue.length - 1) {
      setCurrentTrack(playerQueue[currentIndex + 1]);
    } 
    else {
      setRadioMode(true);
      const seedTrack = currentTrack;
      const variations = [
        `${seedTrack.artist} similar songs`,
        `${seedTrack.artist} mix`,
        `Songs like ${seedTrack.title} ${seedTrack.artist}`
      ];
      const randomQuery = variations[Math.floor(Math.random() * variations.length)];

      try {
        const newRecommendations = await fetchYouTubeData(randomQuery);
        const uniqueTracks = newRecommendations.filter(rec => 
            !playerQueue.some(existing => existing.id === rec.id)
        );

        if (uniqueTracks.length > 0) {
            setPlayerQueue(prev => [...prev, ...uniqueTracks]);
            setCurrentTrack(uniqueTracks[0]);
        } else {
            setCurrentTrack(playerQueue[0]);
        }
      } catch (error) {
        console.error(error);
        setCurrentTrack(playerQueue[0]);
      }
    }
  }, [currentTrack, playerQueue, fetchYouTubeData]);

  const handlePrev = useCallback(() => {
    if (!currentTrack || playerQueue.length === 0) return;
    const currentIndex = playerQueue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) setCurrentTrack(playerQueue[currentIndex - 1]);
  }, [currentTrack, playerQueue]);

  const handleAddToQueue = useCallback((track: Track) => {
    setPlayerQueue(prev => [...prev, track]);
  }, []);

  const handlePlayNext = useCallback((track: Track) => {
    if (!currentTrack) {
        playTrack(track, [track]);
        return;
    }
    const currentIndex = playerQueue.findIndex(t => t.id === currentTrack.id);
    setPlayerQueue(prev => {
        const newQueue = [...prev];
        newQueue.splice(currentIndex + 1, 0, track);
        return newQueue;
    });
  }, [currentTrack, playerQueue, playTrack]);

  const handleShufflePlay = useCallback((tracks: Track[]) => {
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    if (shuffled.length > 0) {
        playTrack(shuffled[0], shuffled);
    }
  }, [playTrack]);

  const activePlaylist = userPlaylists.find(pl => pl.id === activePlaylistId);

  return (
    <div 
      className="flex h-screen bg-[#020202] text-white overflow-hidden font-mono h-[100dvh]"
      onClick={enableBackgroundAudio}
      onTouchStart={enableBackgroundAudio}
    >
      <CustomCursor />
      
      <audio 
        ref={silentAudioRef} 
        src={SILENT_AUDIO} 
        loop 
        playsInline 
        className="hidden" 
      />

      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} 
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-[#0a0000] border border-red-500/50 p-4 shadow-[0_0_20px_rgba(255,0,0,0.2)]"
          >
            <div className="flex items-center gap-3 text-red-500 font-bold uppercase tracking-tighter text-xs">
              <span className="w-2 h-2 bg-red-500 animate-ping rounded-full" /> {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {radioMode && (
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed top-20 right-4 z-[400] pointer-events-none"
             >
                <div className="flex items-center gap-2 px-3 py-1 bg-[#00F3FF]/10 border border-[#00F3FF]/30 rounded-full backdrop-blur-md">
                    <div className="w-1.5 h-1.5 bg-[#00F3FF] animate-pulse rounded-full"/>
                    <span className="text-[9px] text-[#00F3FF] uppercase tracking-widest">Radio_Link_Active</span>
                </div>
             </motion.div>
        )}
      </AnimatePresence>

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
          userPlaylists={userPlaylists}
          onSelectTrack={(t: Track) => playTrack(t, searchTracks)}
          onPlayPlaylist={(tracks: Track[]) => playTrack(tracks[0], tracks)}
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
            <div className="relative z-10 pb-24 md:pb-0"> 
              
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
        <CyberPlayer 
          currentTrack={currentTrack || { id: '', title: 'SYSTEM_IDLE', artist: 'NULL', thumbnail: '' }}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onNext={handleNext} 
          onPrev={handlePrev}
          playlist={playerQueue}
          onPlayerReady={(p: any) => playerRef.current = p}
          onStateChange={(state: number) => {
              if (state === 1) setIsPlaying(true);
              if (state === 2) setIsPlaying(false);
          }}
          onSearch={handleGlobalSearch}
          onSelectTrack={(t: Track) => playTrack(t, [t])}
        />
      </div>
    </div>
  );
}