import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Heart, Server, Activity, 
  User, Disc, Calendar, Globe, Database, AlertTriangle
} from 'lucide-react';
import type { Track } from '../types';

interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  tracks: Track[];
  year: string;
  genre: string;
}

interface DetailModalProps {
  item: any; 
  type: 'album' | 'artist';
  allAlbums: Album[];
  onClose: () => void;
  onPlay: (t: Track) => void;
  onAddToPlaylist?: (t: Track) => void;
}

const InfoContent = ({ item, type }: { item: any, type: string }) => {
  const [wikiBio, setWikiBio] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWiki = async () => {
      setLoading(true);
      setError(false);
      const queryName = type === 'album' ? `${item.title} (album)` : item.name;
      try {
        const url = `https://pt.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&origin=*&titles=${encodeURIComponent(queryName)}`;
        const res = await fetch(url);
        const data = await res.json();
        const pages = data.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          const extract = pages[pageId]?.extract;
          if (pageId !== "-1" && extract) {
            setWikiBio(extract);
          } else {
            if (type === 'album') {
                 const res2 = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&origin=*&titles=${encodeURIComponent(item.title)}`);
                 const data2 = await res2.json();
                 const pages2 = data2.query?.pages;
                 const pageId2 = Object.keys(pages2)[0];
                 if (pageId2 !== "-1" && pages2[pageId2]?.extract) {
                    setWikiBio(pages2[pageId2].extract);
                    setLoading(false);
                    return;
                 }
            }
            setError(true);
          }
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWiki();
  }, [item, type]);

  return (
    <div className="space-y-4 font-mono">
      <div className="bg-[#050505] border border-[#00F3FF]/20 p-4 rounded-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.01)_50%)] bg-[size:100%_4px] pointer-events-none" />
        <h3 className="text-[#00F3FF] text-[10px] font-black uppercase mb-3 flex items-center gap-2 tracking-[0.2em]">
          <Database size={12}/> {type === 'artist' ? 'Neural_Bio' : 'Album_Data'}
        </h3>
        <div className="text-zinc-400 leading-relaxed text-[11px] md:text-xs">
          {loading ? (
            <div className="space-y-2 animate-pulse">
                <div className="h-2 bg-white/5 w-full"></div>
                <div className="h-2 bg-white/5 w-5/6"></div>
                <div className="h-2 bg-white/5 w-4/6"></div>
            </div>
          ) : error || !wikiBio ? (
            <div className="flex items-center gap-2 text-zinc-600 italic">
                <AlertTriangle size={12} />
                <span>DATA_NOT_FOUND_IN_CENTRAL_CORE</span>
            </div>
          ) : (
            <p className="line-clamp-[12] md:line-clamp-none">{wikiBio}</p>
          )}
        </div>
      </div>
      
      <div className="bg-[#050505] border border-white/5 p-4 space-y-2 text-[10px]">
        <div className="flex justify-between border-b border-white/5 pb-2">
          <span className="text-zinc-500 font-bold flex items-center gap-2 uppercase"><Globe size={12}/> Uplink</span>
          <span className="text-white">WIKIPEDIA_NET</span>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-2">
          <span className="text-zinc-500 font-bold flex items-center gap-2 uppercase"><Server size={12}/> Bitrate</span>
          <span className="text-[#00F3FF]">LOSSLESS</span>
        </div>
        {type === 'album' && (
          <>
            <div className="flex justify-between border-b border-white/5 pb-2 uppercase text-zinc-500">
               <span className="flex items-center gap-2 font-bold"><Disc size={12}/> Genre</span>
               <span className="text-white">{item.genre}</span>
            </div>
            <div className="flex justify-between text-zinc-500 uppercase">
               <span className="flex items-center gap-2 font-bold"><Calendar size={12}/> Launch</span>
               <span className="text-white">{item.year}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function DetailModal({ 
  item, type, allAlbums, onClose, onPlay, onAddToPlaylist 
}: DetailModalProps) {
  const [activeTab, setActiveTab] = useState<'LISTA' | 'INFO'>('LISTA');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    document.body.style.overflow = 'hidden';
    return () => {
        window.removeEventListener('resize', check);
        document.body.style.overflow = 'unset';
    };
  }, []);

  const relatedAlbums = type === 'artist' ? allAlbums.filter(a => a.artist === item.name) : [];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/95 backdrop-blur-xl md:p-8"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full h-[92dvh] md:h-full md:max-h-[850px] md:max-w-[1100px] bg-[#020202] border-t border-[#00F3FF]/40 md:border md:border-[#00F3FF]/20 flex flex-col shadow-[0_0_80px_rgba(0,0,0,1)] relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent z-50"></div>

        <div className="h-14 flex items-center justify-between px-4 bg-black border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
                <span className="bg-[#00F3FF] text-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter">
                    {type}
                </span>
                <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.3em] hidden md:inline">
                    SYS_LINK: {item.id ? item.id.substring(0,12) : '0x00'}
                </span>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
            <div className="relative p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-end bg-gradient-to-b from-zinc-900/20 to-transparent">
                <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 shadow-2xl border border-white/10 relative group">
                    <img src={type === 'album' ? item.cover : item.image} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 border-[4px] border-[#00F3FF]/0 group-hover:border-[#00F3FF]/10 transition-all"></div>
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-4">
                    <h1 className="text-3xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none break-words">
                        {type === 'album' ? item.title : item.name}
                    </h1>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[10px] font-black uppercase tracking-widest text-[#00F3FF]">
                        {type === 'album' ? (
                            <span className="text-white">BY_ <span className="underline decoration-[#00F3FF] decoration-2">{item.artist}</span></span>
                        ) : (
                            <span className="flex items-center justify-center md:justify-start gap-2"><Activity size={12}/> {item.listeners || '0'} NEURAL_CONNECTED</span>
                        )}
                        <span className="hidden md:inline text-zinc-800">|</span>
                        <span className="text-zinc-500">{type === 'album' ? item.genre : 'VERIFIED_ARTIST'}</span>
                    </div>

                    <div className="flex gap-3 justify-center md:justify-start pt-4">
                        <button 
                            onClick={() => onPlay(type === 'album' ? item.tracks[0] : item.topTracks[0])}
                            className="h-12 px-10 bg-[#00F3FF] text-black font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white transition-all active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.2)]"
                        >
                            TOCAR
                        </button>
                        <button className="h-12 w-12 border border-white/10 text-white hover:text-[#00F3FF] hover:border-[#00F3FF] bg-white/5 flex items-center justify-center transition-all">
                            <Heart size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row border-t border-white/5">
                <div className="hidden lg:block w-80 p-8 border-r border-white/5 bg-black/20 shrink-0">
                    <InfoContent item={item} type={type} />
                </div>

                <div className="flex-1">
                    <div className="lg:hidden flex border-b border-white/5 sticky top-0 z-20 bg-black/90 backdrop-blur-md">
                        <button 
                            onClick={() => setActiveTab('LISTA')}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] ${activeTab === 'LISTA' ? 'text-[#00F3FF] border-b-2 border-[#00F3FF]' : 'text-zinc-600'}`}
                        >
                            FILES
                        </button>
                        <button 
                            onClick={() => setActiveTab('INFO')}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] ${activeTab === 'INFO' ? 'text-[#00F3FF] border-b-2 border-[#00F3FF]' : 'text-zinc-600'}`}
                        >
                            BIO
                        </button>
                    </div>

                    <div className="p-4 md:p-8">
                        {isMobile && activeTab === 'INFO' ? (
                            <InfoContent item={item} type={type} />
                        ) : (
                            <div className="space-y-1">
                                {(type === 'album' ? item.tracks : item.topTracks).map((track: Track, i: number) => (
                                    <div 
                                        key={track.id} 
                                        onClick={() => onPlay(track)}
                                        className="group flex items-center gap-4 p-3 hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all cursor-pointer"
                                    >
                                        <span className="w-4 text-[10px] font-black text-zinc-600 group-hover:text-[#00F3FF]">{String(i + 1).padStart(2, '0')}</span>
                                        <div className="flex-1 truncate">
                                            <h4 className="text-white font-bold text-xs md:text-sm truncate uppercase group-hover:text-[#00F3FF]">{track.title}</h4>
                                            <p className="text-[10px] text-zinc-600 uppercase font-bold">{track.artist}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {onAddToPlaylist && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onAddToPlaylist(track); }}
                                                    className="p-2 text-zinc-700 hover:text-[#00F3FF] transition-colors"
                                                >
                                                    <Server size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {type === 'artist' && !isMobile && relatedAlbums.length > 0 && (
                            <div className="mt-12">
                                <h3 className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                                    <Disc size={14} className="text-[#00F3FF]" /> Compiled_Discography
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {relatedAlbums.map(album => (
                                        <div key={album.id} className="group cursor-pointer">
                                            <div className="aspect-square mb-2 bg-zinc-900 overflow-hidden border border-white/5 group-hover:border-[#00F3FF]/50 transition-all">
                                                <img src={album.cover} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                                            </div>
                                            <div className="text-white font-bold text-[10px] uppercase truncate group-hover:text-[#00F3FF]">{album.title}</div>
                                            <div className="text-zinc-600 text-[9px] font-bold">{album.year}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}