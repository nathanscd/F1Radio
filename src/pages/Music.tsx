import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Shield, Database,
  Mic2, Layers, Filter, User, Music,
  Play, Server, Activity, ChevronRight, Zap
} from 'lucide-react';
import DetailModal from '../components/DetailModal';
import type { Track, Playlist } from '../types';

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

const HackerText = ({ text, className }: { text: string; className?: string }) => {
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

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse">_</span>
    </span>
  );
};

const EntityCard = ({
  title,
  subtitle,
  image,
  type,
  onClick
}: {
  title: string;
  subtitle: string;
  image: string;
  type: 'ALBUM' | 'ARTIST';
  onClick: () => void;
}) => {
  const cardVariants = {
    rest: {
      y: 0,
      boxShadow: '0 0 0 rgba(0, 243, 255, 0.3)'
    },
    hover: {
      y: -8,
      boxShadow: '0 10px 30px -10px rgba(0, 243, 255, 0.3)',
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={cardVariants}
      onClick={onClick}
      className="group relative border border-[#004444] bg-[#050505] cursor-pointer overflow-hidden flex flex-col h-full rounded-sm transition-colors hover:border-[#00F3FF]/50"
    >
      <div className="aspect-square overflow-hidden relative border-b border-[#004444]">
        <img
          src={image}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
            type === 'ARTIST' ? 'grayscale group-hover:grayscale-0' : ''
          }`}
          alt={title}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md border border-[#00F3FF]/50 text-[8px] font-bold text-[#00F3FF]">
          {type}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <motion.div
            className="w-12 h-12 rounded-full bg-[#00F3FF] flex items-center justify-center text-black shadow-[0_0_20px_#00F3FF]"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={20} fill="currentColor" />
          </motion.div>
        </div>
      </div>
      <div className="p-4 bg-[#050505] group-hover:bg-[#00F3FF]/5 transition-colors flex-1 flex flex-col justify-center relative">
        <div className="absolute top-0 left-0 w-0 h-[2px] bg-[#00F3FF] group-hover:w-full transition-all duration-500" />
        <h3 className="font-bold text-white truncate text-sm group-hover:text-[#00F3FF] uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-[10px] text-[#008888] truncate uppercase font-mono mt-1">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
};

const TrackItem = ({
  track,
  isCurrentTrack,
  onSelect,
  onAddToPlaylist,
  userPlaylists
}: {
  track: Track;
  isCurrentTrack: boolean;
  onSelect: (track: Track) => void;
  onAddToPlaylist: (id: string, track: Track) => void;
  userPlaylists: Playlist[];
}) => {
  const trackVariants = {
    rest: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderColor: 'rgba(0, 68, 68, 1)'
    },
    hover: {
      backgroundColor: isCurrentTrack ? 'rgba(0, 243, 255, 0.1)' : 'rgba(0, 68, 68, 0.3)',
      borderColor: 'rgba(0, 243, 255, 0.5)',
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={trackVariants}
      className={`relative flex items-center gap-4 p-3 border transition-all cursor-pointer group ${
        isCurrentTrack ? 'bg-[#00F3FF]/10 border-[#00F3FF]' : 'bg-black border-[#004444]'
      }`}
      onClick={() => onSelect(track)}
    >
      <div className="w-16 h-16 relative overflow-hidden shrink-0 border border-[#004444]">
        <img
          src={track.thumbnail}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          alt={track.title}
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={20} className="text-[#00F3FF]" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-white truncate text-sm group-hover:text-[#00F3FF] uppercase">
          {track.title}
        </h4>
        <p className="text-xs text-[#008888] truncate">{track.artist}</p>
      </div>

      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          if (userPlaylists.length > 0) {
            onAddToPlaylist(userPlaylists[0].id, track);
          }
        }}
        className="p-2 text-[#004444] hover:text-[#00F3FF] transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Server size={16} />
      </motion.button>
    </motion.div>
  );
};

/* --- MAIN COMPONENT --- */

export default function Music({
  playlist,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onSearch,
  userPlaylists,
  onAddToPlaylist
}: HomeProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'TRACKS' | 'ALBUMS' | 'ARTISTS'>('ALL');
  const [selectedItem, setSelectedItem] = useState<{ type: 'album' | 'artist'; data: any } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { albums, artists } = useMemo(() => deriveData(playlist), [playlist]);

  const filteredData = useMemo(() => {
    const q = query.toLowerCase();

    const tracks = playlist.filter(
      t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
    const filAlbums = albums.filter(
      a => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
    );
    const filArtists = artists.filter(a => a.name.toLowerCase().includes(q));

    return { tracks, albums: filAlbums, artists: filArtists };
  }, [query, playlist, albums, artists]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      onSearch(query);
      setIsProcessing(false);
    }, 800);
  }, [query, onSearch]);

  const openModal = useCallback((type: 'album' | 'artist', data: any) => {
    setSelectedItem({ type, data });
  }, []);

  const closeModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-[#00F3FF] font-mono relative overflow-x-hidden selection:bg-[#00F3FF] selection:text-black pb-32">
      <CRTOverlay />

      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00F3FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F3FF05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* HEADER */}
      <header className="p-6 md:p-8 border-b border-[#00F3FF]/20 bg-[#020202]/90 backdrop-blur-md sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 text-xs text-[#008888] mb-2 animate-pulse">
                <Shield size={12} /> SECURE_NETRUNNER_UPLINK_V5.0
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white drop-shadow-[2px_2px_0_#00F3FF]">
                Cyber_Hub
              </h1>
            </motion.div>

            <motion.div
              className="hidden md:flex gap-4 text-[10px] font-mono text-[#005555]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="border border-[#004444] px-3 py-1 bg-black flex gap-2">
                <span>MEM:</span> <span className="text-[#00F3FF]">64TB</span>
              </div>
              <div className="border border-[#004444] px-3 py-1 bg-black flex gap-2">
                <span>NET:</span> <span className="text-[#00F3FF]">5G/s</span>
              </div>
            </motion.div>
          </div>

          {/* SEARCH */}
          <motion.div
            className="w-full bg-[#001010] border border-[#004444] p-4 relative shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
                  <motion.button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 text-xs font-bold uppercase border transition-all flex items-center gap-2 whitespace-nowrap ${
                      filter === f
                        ? 'bg-[#00F3FF] text-black border-[#00F3FF] shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                        : 'bg-black text-[#005555] border-[#004444] hover:border-[#00F3FF] hover:text-[#00F3FF]'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Filter size={10} /> {f}
                  </motion.button>
                ))}
              </div>
            </form>

            {isProcessing && (
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8 }}
                className="absolute bottom-0 left-0 h-[2px] bg-[#00F3FF] shadow-[0_0_10px_#00F3FF]"
              />
            )}
          </motion.div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-[1600px] mx-auto p-6 md:p-8">
        <AnimatePresence>
          {selectedItem && (
            <DetailModal
              item={selectedItem.data}
              type={selectedItem.type}
              allAlbums={albums}
              onClose={closeModal}
              onPlay={(t) => onSelectTrack(t)}
            />
          )}
        </AnimatePresence>

        {isProcessing ? (
          <motion.div
            className="h-64 flex items-center justify-center text-[#00F3FF]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col items-center">
              <Activity size={48} className="animate-bounce mb-4" />
              <HackerText text="ACCESSING_MAINFRAME_DATABASE..." className="text-xl font-bold tracking-widest" />
            </div>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            {/* ARTISTS */}
            {(filter === 'ALL' || filter === 'ARTISTS') && filteredData.artists.length > 0 && (
              <motion.section variants={sectionVariants} className="mb-12">
                <div className="flex items-center justify-between border-b border-[#00F3FF]/30 pb-2 mb-6 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-[#00F3FF]/10 border border-[#00F3FF]">
                      <User size={16} />
                    </div>
                    <h2 className="text-xl font-bold tracking-widest uppercase text-white">
                      Neural_Links [Artists]
                    </h2>
                  </div>
                  <ChevronRight size={20} className="text-[#00F3FF]/50" />
                </div>
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredData.artists.slice(0, 12).map((artist) => (
                    <motion.div key={artist.id} variants={sectionVariants}>
                      <EntityCard
                        title={artist.name}
                        subtitle="ARTIST_PROFILE"
                        image={artist.image}
                        type="ARTIST"
                        onClick={() => openModal('artist', artist)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            )}

            {/* ALBUMS */}
            {(filter === 'ALL' || filter === 'ALBUMS') && filteredData.albums.length > 0 && (
              <motion.section variants={sectionVariants} className="mb-12">
                <div className="flex items-center justify-between border-b border-[#00F3FF]/30 pb-2 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-[#00F3FF]/10 border border-[#00F3FF]">
                      <Layers size={16} />
                    </div>
                    <h2 className="text-xl font-bold tracking-widest uppercase text-white">
                      Data_Archives [Albums]
                    </h2>
                  </div>
                  <ChevronRight size={20} className="text-[#00F3FF]/50" />
                </div>
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredData.albums.slice(0, 10).map((album) => (
                    <motion.div key={album.id} variants={sectionVariants}>
                      <EntityCard
                        title={album.title}
                        subtitle={album.artist}
                        image={album.cover}
                        type="ALBUM"
                        onClick={() => openModal('album', album)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            )}

            {/* TRACKS */}
            {(filter === 'ALL' || filter === 'TRACKS') && filteredData.tracks.length > 0 && (
              <motion.section variants={sectionVariants} className="mb-12">
                <div className="flex items-center justify-between border-b border-[#00F3FF]/30 pb-2 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-[#00F3FF]/10 border border-[#00F3FF]">
                      <Music size={16} />
                    </div>
                    <h2 className="text-xl font-bold tracking-widest uppercase text-white">
                      Audio_Streams [Tracks]
                    </h2>
                  </div>
                  <ChevronRight size={20} className="text-[#00F3FF]/50" />
                </div>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredData.tracks.map((track) => (
                    <motion.div key={track.id} variants={sectionVariants}>
                      <TrackItem
                        track={track}
                        isCurrentTrack={currentTrack.id === track.id}
                        onSelect={onSelectTrack}
                        onAddToPlaylist={onAddToPlaylist}
                        userPlaylists={userPlaylists}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            )}

            {/* EMPTY STATE */}
            {!isProcessing && filteredData.tracks.length === 0 && (
              <motion.div
                className="py-20 text-center border border-dashed border-[#004444] text-[#005555] bg-[#001010]/50 mt-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Shield size={48} className="mx-auto mb-4 opacity-50" />
                <div className="text-lg font-bold">NO_DATA_FOUND_IN_SECTOR</div>
                <div className="text-xs mt-2 uppercase tracking-widest">TRY_ADJUSTING_QUERY_PARAMETERS</div>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #004444;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00F3FF;
        }
      `}</style>
    </div>
  );
}
