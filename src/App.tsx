import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Playlists from './pages/Playlists';
import SinglePlaylist from './pages/SinglePlaylist';
import F1RadioPlayer from './components/Player';

const API_KEY = 'AIzaSyCJPOUehloQZoKx6a8zaKP0rL5RNw1Sdhc';

export default function App() {
  const [view, setView] = useState<'home' | 'playlists' | 'single-playlist'>('home');
  const [searchTracks, setSearchTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<any>(null);
  const [userPlaylists, setUserPlaylists] = useState<any[]>(() => {
    const saved = localStorage.getItem('pitwall_playlists');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pitwall_playlists', JSON.stringify(userPlaylists));
  }, [userPlaylists]);

  const handleSearch = async (query: string) => {
    if (!query) return;
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${query}&type=video&videoCategoryId=10&key=${API_KEY}`
      );
      const data = await response.json();
      const tracks = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high.url
      }));
      setSearchTracks(tracks);
      setView('home');
    } catch (error) {
      console.error("YouTube API Error", error);
    }
  };

  const createPlaylist = (name: string) => {
    const newPlaylist = { id: Date.now().toString(), name, tracks: [] };
    setUserPlaylists([...userPlaylists, newPlaylist]);
  };

  const addToPlaylist = (playlistId: string, track: any) => {
    setUserPlaylists(prev => prev.map(pl => 
      pl.id === playlistId ? { ...pl, tracks: [...pl.tracks, track] } : pl
    ));
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
              onSelectTrack={(t: any) => { 
                setCurrentTrack(t); 
                setIsPlaying(true); 
              }}
              onSearch={handleSearch}
              userPlaylists={userPlaylists}
              onAddToPlaylist={addToPlaylist}
            />
          )}

          {view === 'playlists' && (
            <Playlists 
              playlists={userPlaylists} 
              onCreate={createPlaylist} 
              onOpen={(pl: any) => { setActivePlaylist(pl); setView('single-playlist'); }} 
            />
          )}

          {view === 'single-playlist' && activePlaylist && (
            <SinglePlaylist 
              playlist={activePlaylist} 
              onBack={() => setView('playlists')}
              onPlayTrack={(t: any) => { setCurrentTrack(t); setIsPlaying(true); }}
            />
          )}
        </div>
      </main>

      <F1RadioPlayer 
        currentTrack={currentTrack || { id: '', title: '', artist: '', thumbnail: '' }}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onNext={() => {}}
        onPrev={() => {}}
        playlist={searchTracks}
        onPlayerReady={() => {}}
        onStateChange={() => {}}
      />
    </div>
  );
}