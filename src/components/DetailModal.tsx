import React from 'react';
import { motion } from 'framer-motion';
import { X, Database, List, Play } from 'lucide-react';
import type { Track } from '../types';

interface DetailModalProps {
  item: any;
  type: 'album' | 'artist';
  onClose: () => void;
  onPlay: (t: Track) => void;
}

export default function DetailModal({ item, type, onClose, onPlay }: DetailModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-[#020202] border border-[#00F3FF] relative overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,243,255,0.2)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,#00F3FF05_1px,transparent_1px),linear-gradient(to_bottom,#00F3FF05_1px,transparent_1px)] pointer-events-none" />
        
        <div className="absolute top-0 left-0 w-full h-8 border-b border-[#00F3FF]/30 bg-[#00F3FF]/5 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#00F3FF]">
            <Database size={12} /> SYSTEM_VIEWER // {type.toUpperCase()}_DATA
          </div>
          <button onClick={onClose} className="hover:text-white text-[#00F3FF]"><X size={16} /></button>
        </div>

        <div className="mt-8 flex flex-col md:flex-row w-full h-[600px]">
          {/* Esquerda: Capa */}
          <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-[#00F3FF]/30 flex flex-col relative">
             <div className="aspect-square w-full border border-[#004444] p-1 mb-6 relative group">
                <img src={type === 'album' ? item.cover : item.image} className="w-full h-full object-cover" alt="" />
             </div>
             <h2 className="text-2xl font-black text-white uppercase leading-none mb-2 line-clamp-3">{type === 'album' ? item.title : item.name}</h2>
             <p className="text-sm text-[#00F3FF] font-mono mb-6">{type === 'album' ? item.artist : 'Neural Artist Profile'}</p>
          </div>

          {/* Direita: Lista */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
             <div className="space-y-1">
               {(type === 'album' ? item.tracks : item.topTracks).map((track: Track, i: number) => (
                  <div 
                    key={track.id} 
                    onClick={() => onPlay(track)}
                    className="group flex items-center justify-between p-3 border border-transparent hover:border-[#00F3FF]/50 hover:bg-[#00F3FF]/10 cursor-pointer transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <span className="text-[10px] text-[#005555] font-mono w-6">{(i + 1).toString().padStart(2, '0')}</span>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-[#00F3FF] uppercase line-clamp-1">{track.title}</div>
                        </div>
                     </div>
                     <Play size={14} className="opacity-0 group-hover:opacity-100 text-[#00F3FF]" />
                  </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}