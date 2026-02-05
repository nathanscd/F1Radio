import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Disc, Zap, Activity, 
  Play, Pause, Server, Shield, Database, 
  Mic2, Layers, Filter, User, Music, 
  List, Radio, Share2, Heart, MoreHorizontal,
  Calendar, MapPin, BarChart3
} from 'lucide-react';
import type { Track, Playlist } from '../types';

/* --- TIPAGEM --- */
interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  tracks: Track[];
  year: string;
  genre: string;
}

interface Artist {
  id: string;
  name: string;
  image: string;
  topTracks: Track[];
  bio: string;
  listeners: string;
}

interface HomeProps {
  playlist: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onSearch: (query: string) => void;
  userPlaylists: Playlist[];
  onAddToPlaylist: (id: string, track: Track) => void;
}

/* --- MOCK DATA GENERATOR --- */
const GENRES = ["CYBERPUNK_CORE", "SYNTHWAVE", "DARK_TECHNO", "NEURAL_BASS", "INDUSTRIAL"];
const BIOS = [
  "Originating from the neon-lit sectors of Neo-Tokyo, this unit specializes in auditory neural stimulation.",
  "A rogue AI construct that gained sentience through low-frequency bass waves. Wanted in 12 systems.",
  "Legendary sound architect known for hacking corporate frequencies to broadcast underground resistance anthems.",
  "Data stream corrupted... Retreiving backup... Artist profile consists of high-energy kinetic audio files."
];

const deriveData = (tracks: Track[]) => {
  const albumsMap = new Map<string, Album>();
  const artistsMap = new Map<string, Artist>();

  tracks.forEach(t => {
    // 1. Álbuns Virtuais
    const albumKey = `${t.artist}-${t.thumbnail}`; 
    if (!albumsMap.has(albumKey)) {
      albumsMap.set(albumKey, {
        id: `alb-${Math.random().toString(36).substr(2, 9)}`,
        title: t.title.replace(/(\(Official Video\)|\(Audio\)|\(Lyrics\)|\[Official Video\])/gi, '').trim(), 
        artist: t.artist,
        cover: t.thumbnail,
        tracks: [],
        year: (2077 - Math.floor(Math.random() * 50)).toString(),
        genre: GENRES[Math.floor(Math.random() * GENRES.length)]
      });
    }
    albumsMap.get(albumKey)?.tracks.push(t);

    // 2. Artistas Virtuais
    if (!artistsMap.has(t.artist)) {
      artistsMap.set(t.artist, {
        id: `art-${t.artist.replace(/\s/g, '')}`,
        name: t.artist,
        image: t.thumbnail,
        topTracks: [],
        bio: BIOS[Math.floor(Math.random() * BIOS.length)],
        listeners: (Math.floor(Math.random() * 500) + 100).toString() + "M"
      });
    }
    artistsMap.get(t.artist)?.topTracks.push(t);
  });

  return {
    albums: Array.from(albumsMap.values()),
    artists: Array.from(artistsMap.values())
  };
};

/* --- UI COMPONENTS --- */

const CRTOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden h-screen w-screen">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[size:100%_2px,3px_100%]" />
  </div>
);

const HackerText = ({ text, className }: { text: string, className?: string }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [text]);
  return <span className={className}>{displayed}<span className="animate-pulse">_</span></span>;
};

const EntityCard = ({ 
  title, subtitle, image, type, onClick 
}: { title: string, subtitle: string, image: string, type: 'ALBUM' | 'ARTIST', onClick: () => void }) => (
  <motion.div 
    whileHover={{ y: -8, boxShadow: '0 10px 30px -10px rgba(0, 243, 255, 0.3)' }}
    onClick={onClick}
    className="group relative border border-[#004444] bg-[#050505] cursor-pointer overflow-hidden flex flex-col h-full rounded-sm"
  >
    <div className="aspect-square overflow-hidden relative border-b border-[#004444]">
      <img src={image} className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${type === 'ARTIST' ? 'grayscale group-hover:grayscale-0' : ''}`} alt="" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md border border-[#00F3FF]/50 text-[8px] font-bold text-[#00F3FF]">
        {type}
      </div>
      {/* Play Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
        <div className="w-12 h-12 rounded-full bg-[#00F3FF] flex items-center justify-center text-black shadow-[0_0_20px_#00F3FF]">
            <Play size={20} fill="currentColor" />
        </div>
      </div>
    </div>
    <div className="p-4 bg-[#050505] group-hover:bg-[#00F3FF]/5 transition-colors flex-1 flex flex-col justify-center relative">
      <div className="absolute top-0 left-0 w-0 h-[2px] bg-[#00F3FF] group-hover:w-full transition-all duration-500" />
      <h3 className="font-bold text-white truncate text-sm group-hover:text-[#00F3FF] uppercase tracking-wide">{title}</h3>
      <p className="text-[10px] text-[#008888] truncate uppercase font-mono mt-1">{subtitle}</p>
    </div>
  </motion.div>
);

/* --- SUPER DETAIL MODAL --- */
const SuperDetailModal = ({ 
  item, type, allAlbums, onClose, onPlay 
}: { item: any, type: 'album' | 'artist', allAlbums: Album[], onClose: () => void, onPlay: (t: Track) => void }) => {
  
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TRACKS' | 'INFO'>('OVERVIEW');
  
  // Se for artista, filtra os álbuns dele
  const relatedAlbums = type === 'artist' 
    ? allAlbums.filter(a => a.artist === item.name) 
    : [];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg p-0 md:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full h-full max-w-[1400px] bg-[#020202] border border-[#00F3FF]/30 relative overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,243,255,0.1)] rounded-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Background FX */}
        <div className="absolute inset-0 bg-[size:50px_50px] bg-[linear-gradient(to_right,#00F3FF03_1px,transparent_1px),linear-gradient(to_bottom,#00F3FF03_1px,transparent_1px)] pointer-events-none" />
        
        {/* TOP BAR */}
        <div className="h-12 border-b border-[#00F3FF]/20 flex items-center justify-between px-6 bg-[#00F3FF]/5 z-50">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#00F3FF] animate-pulse" />
              <span className="text-xs font-bold text-[#00F3FF] tracking-[0.2em]">NEURAL_DATABASE // {type.toUpperCase()}_ID: {item.id}</span>
           </div>
           <button onClick={onClose} className="hover:text-[#FF003C] text-[#00F3FF] transition-colors"><X size={24} /></button>
        </div>

        {/* HERO SECTION */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden shrink-0">
           <div className="absolute inset-0">
              <img src={type === 'album' ? item.cover : item.image} className="w-full h-full object-cover opacity-40 blur-sm scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/50 to-transparent" />
           </div>
           
           <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex items-end gap-8 z-10">
              {/* Cover Art */}
              <div className="w-32 h-32 md:w-48 md:h-48 shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-[#00F3FF]/50 relative group hidden md:block">
                  <img src={type === 'album' ? item.cover : item.image} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.1)_50%)] bg-[size:100%_3px] pointer-events-none" />
              </div>

              <div className="flex-1 mb-2">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-[#00F3FF] text-black text-[10px] font-bold uppercase">{type}</span>
                    {type === 'album' && <span className="text-[#00F3FF] text-xs font-mono border border-[#00F3FF] px-2 py-0.5">{item.year}</span>}
                 </div>
                 <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    {type === 'album' ? item.title : item.name}
                 </h1>
                 <p className="text-[#00F3FF] text-sm md:text-lg font-mono uppercase tracking-widest flex items-center gap-2">
                    {type === 'album' ? (
                       <>BY <span className="font-bold border-b border-[#00F3FF]">{item.artist}</span></>
                    ) : (
                       <><User size={14}/> {item.listeners} MONTHLY_LISTENERS</>
                    )}
                 </p>
              </div>

              <div className="flex gap-4 mb-2">
                 <button 
                    onClick={() => onPlay(type === 'album' ? item.tracks[0] : item.topTracks[0])}
                    className="h-12 px-8 bg-[#00F3FF] text-black font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.4)]"
                 >
                    <Play size={18} fill="currentColor" /> Play
                 </button>
                 <button className="h-12 w-12 border border-[#004444] text-[#00F3FF] flex items-center justify-center hover:bg-[#00F3FF]/10 transition-colors">
                    <Heart size={20} />
                 </button>
                 <button className="h-12 w-12 border border-[#004444] text-[#00F3FF] flex items-center justify-center hover:bg-[#00F3FF]/10 transition-colors">
                    <MoreHorizontal size={20} />
                 </button>
              </div>
           </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
           
           {/* SIDEBAR (Info) */}
           <div className="w-full md:w-80 border-r border-[#00F3FF]/20 bg-[#000808] p-6 overflow-y-auto hidden md:block">
              <div className="space-y-6">
                 <div>
                    <h3 className="text-xs font-bold text-[#005555] uppercase mb-4 flex items-center gap-2"><Activity size={12}/> Analysis</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                       {type === 'artist' ? item.bio : "Album data recovered from fragmented sectors. High fidelity audio streams detected. Optimal for neural synchronization."}
                    </p>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs border-b border-[#002222] pb-2">
                       <span className="text-[#005555]">ORIGIN</span>
                       <span className="text-zinc-300">NEO_SECTOR_7</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-[#002222] pb-2">
                       <span className="text-[#005555]">FORMAT</span>
                       <span className="text-zinc-300">FLAC_LOSSLESS</span>
                    </div>
                    {type === 'album' && (
                        <div className="flex justify-between text-xs border-b border-[#002222] pb-2">
                            <span className="text-[#005555]">GENRE</span>
                            <span className="text-[#00F3FF]">{item.genre}</span>
                        </div>
                    )}
                 </div>
              </div>
           </div>

           {/* MAIN LIST */}
           <div className="flex-1 bg-[#020202] flex flex-col relative">
              {/* Tabs */}
              <div className="h-12 border-b border-[#00F3FF]/20 flex items-center px-6 gap-6 bg-[#001010]">
                 {['OVERVIEW', 'TRACKS', 'INFO'].map(tab => (
                    <button 
                       key={tab} 
                       onClick={() => setActiveTab(tab as any)}
                       className={`h-full text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'border-[#00F3FF] text-[#00F3FF]' : 'border-transparent text-[#005555] hover:text-white'}`}
                    >
                       {tab}
                    </button>
                 ))}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 
                 {/* TRACKLIST */}
                 {(activeTab === 'OVERVIEW' || activeTab === 'TRACKS') && (
                    <div className="space-y-1">
                       <div className="flex items-center px-4 py-2 text-[10px] text-[#005555] font-bold uppercase mb-2">
                          <span className="w-8">#</span>
                          <span className="flex-1">Title</span>
                          <span className="hidden md:block w-32">Metadata</span>
                          <span className="w-12 text-right">Time</span>
                       </div>
                       
                       {(type === 'album' ? item.tracks : item.topTracks).map((track: Track, i: number) => (
                          <div 
                             key={track.id} 
                             onClick={() => onPlay(track)}
                             className="group flex items-center px-4 py-3 hover:bg-[#00F3FF]/10 border border-transparent hover:border-[#00F3FF]/30 cursor-pointer rounded-sm transition-all"
                          >
                             <span className="w-8 text-xs text-[#00F3FF] font-mono opacity-50 group-hover:opacity-100">{(i + 1).toString().padStart(2, '0')}</span>
                             <div className="flex-1 flex items-center gap-3">
                                <img src={track.thumbnail} className="w-8 h-8 object-cover md:hidden" alt=""/>
                                <div>
                                   <div className="text-sm font-bold text-white group-hover:text-[#00F3FF] transition-colors">{track.title}</div>
                                   <div className="text-[10px] text-[#008888] md:hidden">{track.artist}</div>
                                </div>
                             </div>
                             <div className="hidden md:block w-32 text-[10px] text-[#005555] group-hover:text-zinc-400">
                                44.1kHz / 16bit
                             </div>
                             <div className="w-12 text-right text-xs text-[#008888] group-hover:text-white font-mono">
                                3:45
                             </div>
                          </div>
                       ))}
                    </div>
                 )}

                 {/* DISCOGRAPHY (For Artists) */}
                 {type === 'artist' && activeTab === 'OVERVIEW' && relatedAlbums.length > 0 && (
                    <div className="mt-12">
                       <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                          <Disc size={20} className="text-[#00F3FF]" /> DISCOGRAPHY
                       </h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {relatedAlbums.map(album => (
                             <div key={album.id} className="group cursor-pointer">
                                <div className="aspect-square border border-[#004444] p-1 mb-2 relative overflow-hidden">
                                   <img src={album.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt=""/>
                                </div>
                                <div className="text-sm font-bold text-white truncate group-hover:text-[#00F3FF]">{album.title}</div>
                                <div className="text-xs text-[#005555]">{album.year} • Album</div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>

      </motion.div>
    </motion.div>
  );
};


/* --- MAIN COMPONENT --- */

export default function Home({ 
  playlist, currentTrack, isPlaying, onSelectTrack, 
  onSearch, userPlaylists, onAddToPlaylist 
}: HomeProps) {
  
  // State
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'TRACKS' | 'ALBUMS' | 'ARTISTS'>('ALL');
  const [selectedItem, setSelectedItem] = useState<{ type: 'album' | 'artist', data: any } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Derived Data (Memoized)
  const { albums, artists } = useMemo(() => deriveData(playlist), [playlist]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    const q = query.toLowerCase();
    
    const tracks = playlist.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
    const filAlbums = albums.filter(a => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q));
    const filArtists = artists.filter(a => a.name.toLowerCase().includes(q));

    return { tracks, albums: filAlbums, artists: filArtists };
  }, [query, playlist, albums, artists]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
        onSearch(query);
        setIsProcessing(false);
    }, 800);
  };

  const openModal = (type: 'album' | 'artist', data: any) => setSelectedItem({ type, data });

  return (
    <div className="min-h-screen bg-[#020202] text-[#00F3FF] font-mono relative overflow-x-hidden selection:bg-[#00F3FF] selection:text-black pb-32">
      <CRTOverlay />
      
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00F3FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F3FF05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* HEADER */}
      <header className="p-6 md:p-8 border-b border-[#00F3FF]/20 bg-[#020202]/90 backdrop-blur-md sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
         <div className="max-w-[1600px] mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
                 <div>
                     <div className="flex items-center gap-2 text-xs text-[#008888] mb-2 animate-pulse">
                         <Shield size={12} /> SECURE_NETRUNNER_UPLINK_V4.5
                     </div>
                     <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white drop-shadow-[2px_2px_0_#00F3FF]">
                         Cyber_Hub
                     </h1>
                 </div>
                 
                 <div className="hidden md:flex gap-4 text-[10px] font-mono text-[#005555]">
                     <div className="border border-[#004444] px-3 py-1 bg-black flex gap-2"><span>MEM:</span> <span className="text-[#00F3FF]">64TB</span></div>
                     <div className="border border-[#004444] px-3 py-1 bg-black flex gap-2"><span>NET:</span> <span className="text-[#00F3FF]">5G/s</span></div>
                 </div>
             </div>

             {/* SEARCH */}
             <div className="w-full bg-[#001010] border border-[#004444] p-4 relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                 <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 relative z-10">
                     <div className="flex-1 relative group">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <span className="text-[#00F3FF] font-bold animate-pulse">{'>'}</span>
                         </div>
                         <input 
                             type="text" 
                             value={query}
                             onChange={(e) => setQuery(e.target.value)}
                             placeholder="EXECUTE_SEARCH_QUERY..."
                             className="w-full bg-black border border-[#00F3FF]/30 py-3 pl-8 pr-4 text-sm font-bold text-[#00F3FF] placeholder-[#004444] focus:border-[#00F3FF] focus:shadow-[0_0_20px_rgba(0,243,255,0.2)] outline-none transition-all uppercase"
                         />
                     </div>
                     
                     <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                         {['ALL', 'TRACKS', 'ALBUMS', 'ARTISTS'].map((f) => (
                             <button
                                 key={f}
                                 type="button"
                                 onClick={() => setFilter(f as any)}
                                 className={`px-4 py-2 text-xs font-bold uppercase border transition-all flex items-center gap-2 whitespace-nowrap ${filter === f ? 'bg-[#00F3FF] text-black border-[#00F3FF] shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'bg-black text-[#005555] border-[#004444] hover:border-[#00F3FF] hover:text-[#00F3FF]'}`}
                             >
                                 <Filter size={10} /> {f}
                             </button>
                         ))}
                     </div>
                 </form>
                 
                 {isProcessing && (
                     <motion.div 
                        initial={{ width: "0%" }} animate={{ width: "100%" }}
                        transition={{ duration: 0.8 }}
                        className="absolute bottom-0 left-0 h-[2px] bg-[#00F3FF] shadow-[0_0_10px_#00F3FF]"
                     />
                 )}
             </div>
         </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="max-w-[1600px] mx-auto p-6 md:p-8">
        <AnimatePresence>
            {selectedItem && (
                <SuperDetailModal 
                    item={selectedItem.data} 
                    type={selectedItem.type} 
                    allAlbums={albums}
                    onClose={() => setSelectedItem(null)} 
                    onPlay={(t) => {
                        onSelectTrack(t);
                    }}
                />
            )}
        </AnimatePresence>

        {isProcessing ? (
            <div className="h-64 flex items-center justify-center text-[#00F3FF]">
                <div className="flex flex-col items-center">
                    <Activity size={48} className="animate-bounce mb-4" />
                    <HackerText text="ACCESSING_MAINFRAME_DATABASE..." className="text-xl font-bold tracking-widest" />
                </div>
            </div>
        ) : (
            <>
                {/* 1. ARTISTS */}
                {(filter === 'ALL' || filter === 'ARTISTS') && filteredData.artists.length > 0 && (
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
                        <div className="flex items-center justify-between border-b border-[#00F3FF]/30 pb-2 mb-6 mt-4">
                           <div className="flex items-center gap-3">
                              <div className="p-1 bg-[#00F3FF]/10 border border-[#00F3FF]"><User size={16} /></div>
                              <h2 className="text-xl font-bold tracking-widest uppercase text-white">Neural_Links [Artists]</h2>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {filteredData.artists.slice(0, 12).map((artist, i) => (
                                <EntityCard 
                                    key={artist.id}
                                    title={artist.name} 
                                    subtitle="ARTIST_PROFILE" 
                                    image={artist.image} 
                                    type="ARTIST" 
                                    onClick={() => openModal('artist', artist)} 
                                />
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* 2. ALBUMS */}
                {(filter === 'ALL' || filter === 'ALBUMS') && filteredData.albums.length > 0 && (
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-12">
                        <div className="flex items-center justify-between border-b border-[#00F3FF]/30 pb-2 mb-6">
                           <div className="flex items-center gap-3">
                              <div className="p-1 bg-[#00F3FF]/10 border border-[#00F3FF]"><Layers size={16} /></div>
                              <h2 className="text-xl font-bold tracking-widest uppercase text-white">Data_Archives [Albums]</h2>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {filteredData.albums.slice(0, 10).map((album, i) => (
                                <EntityCard 
                                    key={album.id}
                                    title={album.title} 
                                    subtitle={album.artist} 
                                    image={album.cover} 
                                    type="ALBUM" 
                                    onClick={() => openModal('album', album)} 
                                />
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* 3. TRACKS */}
                {(filter === 'ALL' || filter === 'TRACKS') && filteredData.tracks.length > 0 && (
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12">
                        <div className="flex items-center justify-between border-b border-[#00F3FF]/30 pb-2 mb-6">
                           <div className="flex items-center gap-3">
                              <div className="p-1 bg-[#00F3FF]/10 border border-[#00F3FF]"><Music size={16} /></div>
                              <h2 className="text-xl font-bold tracking-widest uppercase text-white">Audio_Streams [Tracks]</h2>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredData.tracks.map((track, i) => (
                                <motion.div 
                                    key={track.id}
                                    className={`relative flex items-center gap-4 p-3 border transition-all cursor-pointer group ${currentTrack.id === track.id ? 'bg-[#00F3FF]/10 border-[#00F3FF]' : 'bg-black border-[#004444] hover:border-[#00F3FF]/50'}`}
                                    onClick={() => onSelectTrack(track)}
                                >
                                    <div className="w-16 h-16 relative overflow-hidden shrink-0 border border-[#004444]">
                                        <img src={track.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play size={20} className="text-[#00F3FF]" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white truncate text-sm group-hover:text-[#00F3FF] uppercase">{track.title}</h4>
                                        <p className="text-xs text-[#008888] truncate">{track.artist}</p>
                                    </div>

                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (userPlaylists.length > 0) onAddToPlaylist(userPlaylists[0].id, track);
                                        }}
                                        className="p-2 text-[#004444] hover:text-[#00F3FF] transition-colors"
                                    >
                                        <Server size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* EMPTY STATE */}
                {!isProcessing && filteredData.tracks.length === 0 && (
                    <div className="py-20 text-center border border-dashed border-[#004444] text-[#005555] bg-[#001010]/50 mt-12">
                        <Shield size={48} className="mx-auto mb-4 opacity-50" />
                        <div className="text-lg font-bold">NO_DATA_FOUND_IN_SECTOR</div>
                        <div className="text-xs mt-2 uppercase tracking-widest">TRY_ADJUSTING_QUERY_PARAMETERS</div>
                    </div>
                )}
            </>
        )}
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #004444; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00F3FF; }
      `}</style>
    </div>
  );
}