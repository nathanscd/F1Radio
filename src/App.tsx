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

import 'leaflet/dist/leaflet.css';

// Tente usar sua chave, mas o código agora tem um fallback robusto e resiliente
const API_KEY = 'AIzaSyDhdqoUm-it5aPj6okMruFQ6xRIpqHp1VY';

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
  
  const playerRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('pitwall_playlists', JSON.stringify(userPlaylists));
  }, [userPlaylists]);

  useEffect(() => {
    if (window.updateNeuralTitle) {
      if (currentTrack && isPlaying) window.updateNeuralTitle(currentTrack.title, currentTrack.artist);
      else window.updateNeuralTitle('SYSTEM_IDLE', '');
    }
  }, [currentTrack, isPlaying]);

  // --- SERVIÇO DE BUSCA ROBUSTO (COM MÚLTIPLOS FALLBACKS) ---
  const fetchYouTubeData = async (query: string): Promise<Track[]> => {
    if (!query || query.trim().length < 2) return [];
    
    // 1. TENTATIVA COM API KEY OFICIAL
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          return data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url
          }));
        }
      }
    } catch (e) {
      console.warn("OFFICIAL_API_FAILED, TRYING_FALLBACKS...");
    }

    // 2. FALLBACK: Múltiplas instâncias do Piped (Mais resiliente a CORS)
    const pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.victr.me',
      'https://piped-api.garudalinux.org',
      'https://pipedapi.moomoo.me'
    ];

    for (const instance of pipedInstances) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const fallbackRes = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=videos`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData && fallbackData.items) {
            return fallbackData.items.map((item: any) => ({
              id: item.url.split('v=')[1] || item.videoId,
              title: item.title,
              artist: item.uploaderName,
              thumbnail: item.thumbnail
            }));
          }
        }
      } catch (e) {
        console.warn(`FALLBACK_FAILED_ON_INSTANCE: ${instance}`);
      }
    }

    return [];
  };

  const handleGlobalSearch = async (query: string) => {
    if (!query) return;
    setIsSearching(true);
    try {
      const tracks = await fetchYouTubeData(query);
      setSearchTracks(tracks);
      if (!isCarMode) setView('home');
    } finally {
      setIsSearching(false);
    }
  };

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

  const activePlaylist = userPlaylists.find(pl => pl.id === activePlaylistId);

  return (
    <div className="flex h-screen bg-[#020202] text-white overflow-hidden font-['Space_Mono',monospace]">
      <CustomCursor />

      <AnimatePresence>
        {showCarPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
            <div className="border border-[#00F3FF] p-8 bg-[#020202] relative max-w-sm w-full">
              <div className="text-[#00F3FF] text-[10px] font-bold mb-2 uppercase tracking-[0.3em] animate-pulse">Auto_Detect: Landscape</div>
              <h2 className="text-xl font-black mb-8 uppercase italic leading-tight">Initialize <span className="text-[#00F3FF]">Cyber_HUD</span>?</h2>
              <div className="flex gap-4">
                <button onClick={() => { setIsCarMode(true); setShowCarPrompt(false); }} className="flex-1 bg-[#00F3FF] text-black py-4 font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-colors">Confirm</button>
                <button onClick={() => setShowCarPrompt(false)} className="flex-1 border border-zinc-800 text-zinc-500 py-4 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors">Ignore</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          isSearching={isSearching}
        />
      ) : (
        <>
          <Sidebar activeTab={view} setActiveTab={(v: any) => setView(v)} isCarMode={isCarMode} onToggleCarMode={(val: boolean) => setIsCarMode(val)} />
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
              {view === 'single-playlist' && activePlaylist && (
                <SinglePlaylist 
                  playlist={activePlaylist} 
                  onBack={() => setView('playlists')}
                  onPlayTrack={(t: Track) => playTrack(t, activePlaylist.tracks)}
                  onSearch={fetchYouTubeData}
                  onAddTrack={(plId: string, t: Track) => {
                    setUserPlaylists(prev => prev.map(pl => pl.id === plId ? { ...pl, tracks: [...pl.tracks, t] } : pl));
                  }}
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
