import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Play, Heart, MoreHorizontal, Activity, 
  User, Disc, Server, Calendar, Globe, Database, AlertTriangle
} from 'lucide-react';
import type { Track } from '../types';

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

interface DetailModalProps {
  item: any; 
  type: 'album' | 'artist';
  allAlbums: Album[];
  onClose: () => void;
  onPlay: (t: Track) => void;
  onAddToPlaylist?: (t: Track) => void;
}

/* --- COMPONENTE DE INFO COM WIKIPEDIA --- */
const InfoContent = ({ item, type }: { item: any, type: string }) => {
  const [wikiBio, setWikiBio] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWiki = async () => {
      setLoading(true);
      setError(false);
      
      // Constrói a query. Se for álbum, tenta adicionar contexto para evitar ambiguidade
      const queryName = type === 'album' 
        ? `${item.title} (album)` 
        : item.name;

      try {
        const url = `https://pt.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&origin=*&titles=${encodeURIComponent(queryName)}`;
        const res = await fetch(url);
        const data = await res.json();
        const pages = data.query?.pages;
        
        if (pages) {
          const pageId = Object.keys(pages)[0];
          const extract = pages[pageId]?.extract;

          // Verifica se retornou algo válido e não é "missing"
          if (pageId !== "-1" && extract) {
            setWikiBio(extract);
          } else {
            // Tenta fallback sem o sufixo (album) se falhou
            if (type === 'album') {
                 const url2 = `https://pt.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&origin=*&titles=${encodeURIComponent(item.title)}`;
                 const res2 = await fetch(url2);
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
        } else {
          setError(true);
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
    <div className="space-y-6 font-mono text-sm">
      <div className="bg-[#111] border border-[#333] p-4 rounded-sm relative overflow-hidden group">
        {/* Efeito Scanline Decorativo */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.02)_50%)] bg-[size:100%_4px] pointer-events-none" />
        
        <h3 className="text-[#00F3FF] font-bold uppercase mb-3 flex items-center gap-2">
          <Database size={16}/> {type === 'artist' ? 'Neural Bio' : 'Album Context'}
        </h3>
        
        <div className="text-zinc-300 leading-relaxed text-xs md:text-sm break-words">
          {loading ? (
            <div className="flex flex-col gap-2 animate-pulse">
                <div className="h-2 bg-[#222] rounded w-full"></div>
                <div className="h-2 bg-[#222] rounded w-5/6"></div>
                <div className="h-2 bg-[#222] rounded w-4/6"></div>
                <span className="text-[#00F3FF] text-[10px] mt-2">DECODING_DATA_STREAM...</span>
            </div>
          ) : error || !wikiBio ? (
            <div className="flex items-center gap-2 text-zinc-500 italic">
                <AlertTriangle size={14} />
                <span>Dados não disponíveis no servidor central.</span>
            </div>
          ) : (
            <p className="line-clamp-[10]">{wikiBio}</p>
          )}
        </div>
      </div>
      
      <div className="bg-[#111] border border-[#333] p-4 rounded-sm space-y-3">
        <div className="flex justify-between border-b border-[#222] pb-2">
          <span className="text-zinc-500 font-bold flex items-center gap-2 text-xs"><Globe size={14}/> ORIGEM</span>
          <span className="text-white text-xs">WIKIPEDIA_API_V2</span>
        </div>
        <div className="flex justify-between border-b border-[#222] pb-2">
          <span className="text-zinc-500 font-bold flex items-center gap-2 text-xs"><Server size={14}/> FORMATO</span>
          <span className="text-[#00F3FF] text-xs">LOSSLESS_FLAC</span>
        </div>
        {type === 'album' && (
          <>
            <div className="flex justify-between border-b border-[#222] pb-2">
               <span className="text-zinc-500 font-bold flex items-center gap-2 text-xs"><Disc size={14}/> GÊNERO</span>
               <span className="text-white uppercase text-xs">{item.genre}</span>
            </div>
            <div className="flex justify-between pb-1">
               <span className="text-zinc-500 font-bold flex items-center gap-2 text-xs"><Calendar size={14}/> LANÇAMENTO</span>
               <span className="text-white text-xs">{item.year}</span>
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
    return () => window.removeEventListener('resize', check);
  }, []);

  const relatedAlbums = type === 'artist' 
    ? allAlbums.filter(a => a.artist === item.name) 
    : [];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      // Adicionado overflow-hidden e w-full aqui para prevenir scroll no container pai
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md md:p-8 overflow-hidden w-full h-full"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        // max-w-full e w-full garantem que não exceda a largura
        className="w-full h-[95dvh] md:h-full md:max-h-[800px] md:max-w-[1200px] bg-[#000000] border-t-2 md:border-2 border-[#00F3FF] flex flex-col shadow-[0_0_50px_rgba(0,243,255,0.1)] relative max-w-full"
        onClick={e => e.stopPropagation()}
      >
        
        {/* --- HEADER FIXO --- */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#222] bg-[#050505] shrink-0 w-full">
            <div className="flex items-center gap-3 overflow-hidden">
                <span className="bg-[#00F3FF] text-black px-2 py-1 text-[10px] font-black uppercase rounded-sm shrink-0">
                    {type}
                </span>
                <span className="text-[#00F3FF] font-mono text-xs uppercase tracking-widest truncate">
                    ID: {item.id ? item.id.substring(0,8) : 'UNK'}
                </span>
            </div>
            <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-[#111] text-white border border-[#333] active:bg-[#00F3FF] active:text-black rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* --- CORPO COM SCROLL --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#000000] w-full overflow-x-hidden">
            
            {/* HERO / CAPA */}
            <div className="p-4 md:p-8 flex flex-col md:flex-row gap-6 md:items-end border-b border-[#222] bg-[#050505] w-full">
                <div className="w-40 h-40 md:w-64 md:h-64 shrink-0 mx-auto md:mx-0 shadow-[0_0_30px_rgba(0,243,255,0.15)] border border-[#333] relative">
                    <img src={type === 'album' ? item.cover : item.image} className="w-full h-full object-cover" alt="" />
                    {/* Overlay de brilho */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-4 min-w-0">
                    <h1 className="text-2xl md:text-5xl lg:text-6xl font-black text-white uppercase leading-none tracking-tight break-words">
                        {type === 'album' ? item.title : item.name}
                    </h1>
                    
                    <p className="text-zinc-400 font-mono text-xs md:text-sm uppercase flex items-center justify-center md:justify-start gap-2 flex-wrap">
                        {type === 'album' ? (
                            <>Artist: <span className="text-[#00F3FF] font-bold border-b border-[#00F3FF] truncate">{item.artist}</span></>
                        ) : (
                            <><User size={14}/> {item.listeners || '0'} Ouvintes</>
                        )}
                    </p>

                    <div className="flex gap-3 justify-center md:justify-start pt-2">
                        <button 
                            onClick={() => onPlay(type === 'album' ? item.tracks[0] : item.topTracks[0])}
                            className="h-12 px-6 md:px-8 bg-[#00F3FF] text-black font-bold uppercase tracking-widest hover:bg-white flex items-center gap-2 rounded-sm shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all active:scale-95"
                        >
                            <Play size={20} fill="black" /> Tocar
                        </button>
                        <button className="h-12 w-12 border border-[#333] text-zinc-400 flex items-center justify-center hover:text-[#00F3FF] hover:border-[#00F3FF] rounded-sm bg-[#111] transition-colors">
                            <Heart size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ABAS (MOBILE) & LAYOUT (DESKTOP) */}
            <div className="flex flex-col md:flex-row min-h-0 w-full">
                
                {/* INFO SIDEBAR (Desktop) - Largura fixa, escondida no mobile */}
                <div className="hidden md:block w-80 p-6 border-r border-[#222] bg-[#080808] shrink-0">
                    <InfoContent item={item} type={type} />
                </div>

                {/* CONTEÚDO PRINCIPAL */}
                <div className="flex-1 bg-black min-w-0">
                    {/* Abas Mobile Sticky */}
                    <div className="md:hidden flex border-b border-[#222] bg-[#050505] sticky top-0 z-10 w-full">
                        <button 
                            onClick={() => setActiveTab('LISTA')}
                            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'LISTA' ? 'text-[#00F3FF] border-b-2 border-[#00F3FF] bg-[#00F3FF]/5' : 'text-zinc-500'}`}
                        >
                            Músicas
                        </button>
                        <button 
                            onClick={() => setActiveTab('INFO')}
                            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'INFO' ? 'text-[#00F3FF] border-b-2 border-[#00F3FF] bg-[#00F3FF]/5' : 'text-zinc-500'}`}
                        >
                            Dados
                        </button>
                    </div>

                    <div className="p-4 md:p-6 pb-24 w-full">
                        
                        {/* CONTEÚDO DA ABA INFO (MOBILE) */}
                        {isMobile && activeTab === 'INFO' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <InfoContent item={item} type={type} />
                            </motion.div>
                        )}

                        {/* LISTA DE MÚSICAS */}
                        {(activeTab === 'LISTA' || !isMobile) && (
                            <div className="space-y-1 w-full">
                                {(type === 'album' ? item.tracks : item.topTracks).map((track: Track, i: number) => (
                                    <div 
                                        key={track.id} 
                                        onClick={() => onPlay(track)}
                                        className="group flex items-center gap-3 md:gap-4 p-3 hover:bg-[#111] border border-transparent hover:border-[#333] rounded-sm cursor-pointer transition-colors w-full"
                                    >
                                        <span className="w-6 text-center text-[#00F3FF] font-mono font-bold text-xs md:text-sm shrink-0">{i + 1}</span>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-bold text-xs md:text-sm truncate group-hover:text-[#00F3FF] transition-colors">{track.title}</h4>
                                            <p className="text-zinc-500 text-[10px] md:text-xs truncate">{track.artist}</p>
                                        </div>

                                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                                            <span className="text-zinc-600 text-[10px] md:text-xs font-mono">3:45</span>
                                            {onAddToPlaylist && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onAddToPlaylist(track); }}
                                                    className="p-2 text-zinc-500 hover:text-[#00F3FF] bg-[#050505] border border-[#222] rounded-sm active:bg-[#00F3FF] active:text-black transition-colors"
                                                >
                                                    <Server size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* DISCOGRAFIA (ARTISTA) */}
                        {type === 'artist' && activeTab === 'LISTA' && relatedAlbums.length > 0 && (
                            <div className="mt-8 border-t border-[#222] pt-8 w-full">
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
                                    <Disc size={16} className="text-[#00F3FF]" /> DISCOGRAFIA
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
                                    {relatedAlbums.map(album => (
                                        <div key={album.id} className="bg-[#111] p-2 rounded-sm border border-[#222] hover:border-[#00F3FF] transition-colors cursor-pointer group">
                                            <div className="aspect-square mb-2 bg-black overflow-hidden relative">
                                                <img src={album.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                            </div>
                                            <div className="text-white font-bold text-xs truncate group-hover:text-[#00F3FF]">{album.title}</div>
                                            <div className="text-zinc-500 text-[10px]">{album.year}</div>
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