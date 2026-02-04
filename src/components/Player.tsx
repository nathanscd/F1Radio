import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, Radio, Minimize2, 
  List, Volume2, Settings, Zap
} from 'lucide-react';

declare global { interface Window { onYouTubeIframeAPIReady: () => void; YT: any; } }

interface Track { id: string; title: string; artist: string; thumbnail: string; }

interface F1RadioPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  playlist: Track[];
  onPlayerReady: (player: any) => void;
  onStateChange: (state: any) => void;
}

export default function F1RadioPlayer({ 
  currentTrack, isPlaying, onTogglePlay, onNext, onPrev, 
  playlist, onPlayerReady, onStateChange 
}: F1RadioPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isStatic, setIsStatic] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [drsActive, setDrsActive] = useState(false);
  
  // Telemetria Simulada
  const [telemetry, setTelemetry] = useState({
    speed: 0,
    rpm: 0,
    temp: 85,
    ers: 100,
    fuel: 45.2,
    gForce: 0
  });

  const playerRef = useRef<any>(null);
  const staticRef = useRef<HTMLAudioElement | null>(null);

  // Efeito de Estática de Rádio
  useEffect(() => {
    staticRef.current = new Audio('https://www.soundjay.com/communication/radio-static-05.mp3');
    staticRef.current.volume = 0.1;
  }, []);

  // Inicialização do YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else { initPlayer(); }
  }, [currentTrack.id]);

  // Sincronização: Se isPlaying mudar no App.tsx, atualiza o vídeo aqui
  useEffect(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  // Sincronização: Se volume mudar
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  const initPlayer = () => {
    // Destroi player anterior se existir para evitar duplicação
    if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) { console.warn(e); }
    }

    const onReadyCallback = (event: any) => {
        onPlayerReady(event.target);
        event.target.setVolume(volume);
        if (isPlaying) event.target.playVideo();
    };

    const onStateChangeCallback = (event: any) => {
        onStateChange(event.data);
        // Se o vídeo acabar (State 0), vai para o próximo
        if (event.data === 0) onNext();
    };

    playerRef.current = new window.YT.Player('yt-player', {
      height: '0', width: '0', videoId: currentTrack.id,
      playerVars: { 
        autoplay: isPlaying ? 1 : 0, 
        controls: 0, 
        disablekb: 1, 
        modestbranding: 1,
        origin: window.location.origin 
      },
      events: { 
        onReady: onReadyCallback,
        onStateChange: onStateChangeCallback
      }
    });
  };

  // Loop de Telemetria e Progresso
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const cur = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        if (dur > 0) setProgress((cur / dur) * 100);
      }

      if (isPlaying && !isStatic) {
        setTelemetry(prev => ({
          speed: 280 + Math.floor(Math.random() * 45),
          rpm: 10500 + Math.floor(Math.random() * 2000),
          temp: 90 + Math.floor(Math.random() * 10),
          ers: Math.max(0, 100 - (progress * 0.8)),
          fuel: Math.max(0, 45.2 - (progress * 0.05)),
          gForce: (Math.random() * 4.5).toFixed(1) as any
        }));
        setDrsActive(Math.random() > 0.7);
      } else {
        setTelemetry(prev => ({ ...prev, speed: 0, rpm: 0, gForce: 0 }));
        setDrsActive(false);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, isStatic, progress]);

  const handleAction = (fn: () => void) => {
    setIsStatic(true);
    staticRef.current?.play().catch(() => {});
    setTimeout(() => { setIsStatic(false); fn(); }, 300); // Reduzi o delay para 300ms para ficar mais ágil
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-['Orbitron',sans-serif] flex flex-col items-end">
      {/* Div oculta para a API do YouTube injetar o iframe */}
      <div id="yt-player" className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none" />
      
      <div className="relative flex flex-col items-end w-full">
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              // AUMENTEI A LARGURA PARA 450px
              className="absolute bottom-full mb-6 w-[340px] md:w-[450px] bg-[#050505] border-[3px] border-[#1a1a1a] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden"
            >
              {/* LED RPM Bar */}
              <div className="h-3 w-full flex gap-1 px-4 pt-3 bg-black">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-sm skew-x-[-20deg] transition-colors duration-100 ${
                    !isPlaying ? 'bg-zinc-900' : 
                    i < 7 ? 'bg-green-600 shadow-[0_0_5px_#16a34a]' : 
                    i < 14 ? 'bg-red-600 shadow-[0_0_5px_#dc2626]' : 'bg-purple-600 shadow-[0_0_5px_#9333ea]'
                  }`} style={{ opacity: isPlaying ? 1 : 0.2 }} />
                ))}
              </div>

              <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-600 animate-ping' : 'bg-zinc-700'}`} />
                    <span className="text-[10px] font-bold text-zinc-400 tracking-[0.2em]">RACE CONTROL</span>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setShowPlaylist(!showPlaylist)} className={`text-zinc-500 hover:text-white transition-colors ${showPlaylist ? 'text-red-500' : ''}`}><List size={20} /></button>
                    <button className="text-zinc-500 hover:text-white transition-colors"><Settings size={20} /></button>
                  </div>
                </div>

                {/* Display Principal */}
                <div className="relative h-56 mb-8">
                  <AnimatePresence mode="wait">
                    {showPlaylist ? (
                      <motion.div key="playlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0a0a] rounded-2xl border border-zinc-800 p-4 overflow-y-auto custom-scrollbar">
                        {playlist.map((t, i) => (
                          <div key={t.id} onClick={() => handleAction(() => { 
                              // Lógica para tocar a música específica da playlist
                              // Como o App.tsx controla, vamos chamar onNext até chegar nela ou idealmente passar uma função onSelect
                              // Por enquanto, vou simular o onNext
                              onNext(); 
                          })} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer mb-2 transition-all ${currentTrack.id === t.id ? 'bg-red-600 text-white border-l-4 border-white' : 'bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400'}`}>
                            <span className="text-xs font-mono opacity-50">0{i+1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black truncate uppercase tracking-wider">{t.title}</p>
                              <p className="text-[9px] opacity-70 truncate uppercase">{t.artist}</p>
                            </div>
                            {currentTrack.id === t.id && <Zap size={14} fill="white" />}
                          </div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0a0a] rounded-2xl border border-zinc-800 p-6 overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none" />
                        
                        <div className="flex gap-6 items-center mb-6 relative z-10 h-full">
                          <div className="relative shrink-0">
                            <img src={currentTrack.thumbnail} className={`w-24 h-24 rounded-2xl object-cover border-2 border-zinc-800 shadow-2xl transition-all ${isPlaying && !isStatic ? 'scale-105 border-red-600' : 'grayscale'}`} alt="" />
                            {drsActive && <div className="absolute -top-3 -right-3 bg-green-500 text-black text-[10px] font-black px-2 py-0.5 skew-x-[-10deg] shadow-lg shadow-green-500/50">DRS OPEN</div>}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                                <span className="text-[9px] text-red-600 font-bold tracking-widest uppercase">Live Feed</span>
                             </div>
                            <h3 className={`text-white text-xl font-black uppercase leading-tight mb-2 line-clamp-2 ${isStatic ? 'blur-[2px]' : ''}`}>{currentTrack.title}</h3>
                            <p className="text-zinc-500 text-xs font-mono uppercase tracking-[0.1em]">{currentTrack.artist}</p>
                          </div>
                        </div>

                        {/* Speedometer Overlay */}
                        <div className="absolute bottom-4 right-4 text-right z-20">
                           <span className="text-[9px] text-zinc-600 uppercase font-bold block mb-[-4px]">Speed Trap</span>
                           <span className="text-3xl font-black text-white italic tracking-tighter">{telemetry.speed}</span>
                           <span className="text-[9px] text-red-600 font-bold ml-1">KPH</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50 flex flex-col items-center">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">ERS Charge</span>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-1"><div className="h-full bg-yellow-400" style={{ width: `${telemetry.ers}%` }} /></div>
                    <span className="text-[10px] font-mono text-yellow-400">{Math.floor(telemetry.ers)}%</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50 flex flex-col items-center">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Fuel Load</span>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-1"><div className="h-full bg-green-500" style={{ width: `${(telemetry.fuel/45.2)*100}%` }} /></div>
                    <span className="text-[10px] font-mono text-green-500">{telemetry.fuel.toFixed(1)}kg</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50 flex flex-col items-center">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Tyre Temp</span>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-1"><div className={`h-full ${telemetry.temp > 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(telemetry.temp/110)*100}%` }} /></div>
                    <span className="text-[10px] font-mono text-white">{telemetry.temp}°C</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="relative group w-full cursor-pointer">
                    <input type="range" value={progress} onChange={(e) => playerRef.current?.seekTo((parseFloat(e.target.value)/100)*playerRef.current.getDuration())} className="absolute inset-0 w-full h-4 opacity-0 z-20 cursor-pointer" />
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 relative" style={{ width: `${progress}%` }}>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
                        </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-4">
                     {/* Volume */}
                    <div className="flex items-center gap-3 w-24 group">
                        <Volume2 size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                        <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-white group-hover:bg-red-600 transition-colors" style={{ width: `${volume}%` }} />
                        </div>
                        <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="absolute w-24 h-6 opacity-0 cursor-pointer" />
                    </div>

                    {/* Main Buttons */}
                    <div className="flex items-center gap-6">
                        <button onClick={() => handleAction(onPrev)} className="text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-90"><SkipBack size={32} /></button>
                        
                        <button onClick={onTogglePlay} className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center shadow-[0_10px_30px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 transition-all border-b-4 border-red-800 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                            {isPlaying ? <Pause size={36} className="text-white relative z-10" fill="currentColor" /> : <Play size={36} className="text-white ml-1 relative z-10" fill="currentColor" />}
                        </button>
                        
                        <button onClick={() => handleAction(onNext)} className="text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-90"><SkipForward size={32} /></button>
                    </div>

                    <div className="w-24 text-right">
                        <span className="text-[9px] text-zinc-600 font-mono tracking-widest">LAP 1/54</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Status */}
              <div className="bg-[#0f0f0f] p-3 border-t border-zinc-900 flex justify-between items-center px-8">
                <div className="flex gap-1.5">
                  {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 bg-purple-600 rounded-sm animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.4em]">Sector 3: Optimal</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 group shadow-2xl relative z-50 ${isOpen ? 'bg-white border-white text-black rotate-90 shadow-[0_0_50px_rgba(255,255,255,0.3)]' : 'bg-[#050505] border-zinc-800 text-white hover:border-red-600'}`}
        >
          {isOpen ? <Minimize2 size={32} /> : (
            <div className="relative">
              <Radio size={32} className="group-hover:text-red-600 transition-colors" />
              {isPlaying && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />}
            </div>
          )}
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF0000; }
      `}</style>
    </div>
  );
}