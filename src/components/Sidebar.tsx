import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Library, Activity, 
  Shield, ChevronRight, Terminal, 
  Disc, Lock, User, Menu, X, 
  Settings, Cpu as CoreIcon, Zap, Car
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'home' | 'playlists' | 'single-playlist' | 'music';
  setActiveTab: (tab: 'home' | 'playlists' | 'music') => void;
  isCarMode: boolean;
  onToggleCarMode: (val: boolean) => void;
}

const ScanLine = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
    <div className="w-full h-[1px] bg-[#00F3FF] absolute top-0 animate-scanline shadow-[0_0_10px_#00F3FF]" />
  </div>
);

const HUDCorner = ({ className }: { className?: string }) => (
    <div className={`absolute w-2 h-2 border-[#00F3FF] opacity-40 ${className}`}>
       <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00F3FF]" />
       <div className="absolute top-0 left-0 h-full w-[1px] bg-[#00F3FF]" />
    </div>
);

export default function Sidebar({ activeTab, setActiveTab, isCarMode, onToggleCarMode }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'DASHBOARD', icon: LayoutGrid, sub: 'Main_System' },
    { id: 'music', label: 'TERMINAL', icon: Disc, sub: 'Neural_Audio' },
    { id: 'playlists', label: 'DATA_BANKS', icon: Library, sub: 'User_Vault' },
  ];

  const handleTabChange = (id: any) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-black border border-[#00F3FF]/30 text-[#00F3FF] shadow-[0_0_15px_rgba(0,243,255,0.2)] active:scale-90 transition-all"
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/95 backdrop-blur-md z-[100]"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 z-[110] w-72 bg-[#020202] border-r border-[#00F3FF]/10 flex flex-col transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        font-mono select-none
      `}>
        <ScanLine />
        
        <div className="p-8 relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black border border-[#00F3FF]/30 flex items-center justify-center relative group">
                <HUDCorner className="top-0 left-0" />
                <HUDCorner className="bottom-0 right-0 rotate-180" />
                <CoreIcon size={22} className="text-[#00F3FF] animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-sm tracking-tighter italic">NET<span className="text-[#00F3FF]">RUNNER</span></span>
                <span className="text-[8px] text-[#00F3FF] font-bold uppercase tracking-[0.2em] opacity-50">Uplink_v4.5</span>
              </div>
            </div>
            {isOpen && (
              <button onClick={() => setIsOpen(false)} className="text-[#00F3FF] p-2 bg-white/5 border border-white/5 lg:hidden">
                <X size={18} />
              </button>
            )}
          </div>

          <nav className="flex flex-col gap-2">
            <div className="text-[9px] text-zinc-600 font-bold tracking-[0.3em] uppercase mb-4 px-2 flex items-center gap-2">
              <Terminal size={10} /> ACCESS_HIERARCHY
            </div>
            
            {menuItems.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'playlists' && activeTab === 'single-playlist');
              return (
                <button 
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`group relative flex items-center gap-4 p-4 border-l-2 transition-all duration-300 ${
                    isActive
                    ? 'bg-[#00F3FF]/5 border-[#00F3FF] text-white' 
                    : 'border-transparent text-zinc-500 hover:text-[#00F3FF] hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} className={`${isActive ? 'text-[#00F3FF]' : 'group-hover:text-[#00F3FF]'}`} />
                  <div className="flex flex-col items-start">
                    <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                    <span className="text-[7px] text-zinc-600 uppercase font-bold group-hover:text-zinc-400">{item.sub}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="ml-auto text-[#00F3FF]" />}
                </button>
              );
            })}

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="group relative flex items-center gap-4 p-4 border-l-2 border-transparent text-zinc-500 hover:text-[#00F3FF] hover:bg-white/5 transition-all mt-6"
            >
              <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black uppercase tracking-widest">CONFIG</span>
                <span className="text-[7px] text-zinc-600 uppercase font-bold">Parameters</span>
              </div>
            </button>
          </nav>

          <div className="mt-auto pt-6 space-y-4">
            <div className="p-4 bg-white/5 border border-white/5 rounded-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <span className="text-[8px] text-[#00F3FF] uppercase font-black tracking-widest flex items-center gap-1">
                    <Activity size={10} /> SYSTEM_STATUS
                </span>
                <Shield size={10} className="text-zinc-600" />
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[7px] uppercase font-bold">
                    <span className="text-zinc-500">Neural_Load</span>
                    <span className="text-[#00F3FF]">12%</span>
                  </div>
                  <div className="h-[2px] bg-zinc-900 w-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "12%" }} className="h-full bg-[#00F3FF] shadow-[0_0_8px_#00F3FF]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[7px] uppercase font-bold">
                    <span className="text-zinc-500">Sync_Buffer</span>
                    <span className="text-pink-500">45%</span>
                  </div>
                  <div className="h-[2px] bg-zinc-900 w-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "45%" }} className="h-full bg-pink-500 shadow-[0_0_8px_#f472b6]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 hover:border-[#00F3FF]/40 transition-all cursor-pointer group">
              <div className="w-10 h-10 bg-black border border-white/10 flex items-center justify-center text-[#00F3FF] group-hover:border-[#00F3FF] transition-all">
                <User size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-white uppercase truncate tracking-tighter">NATHAN_ROOT</span>
                <span className="text-[7px] text-zinc-600 uppercase font-black flex items-center gap-1">
                   <Lock size={8} /> Session_Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[210] p-[1px] bg-gradient-to-br from-[#00F3FF] to-pink-500"
            >
              <div className="bg-[#020202] p-6 relative">
                <HUDCorner className="top-2 left-2" />
                <HUDCorner className="bottom-2 right-2 rotate-180" />
                
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3 text-[#00F3FF]">
                    <Settings size={18} className="animate-spin-slow" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Global_Config</span>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => { onToggleCarMode(!isCarMode); setIsSettingsOpen(false); }}
                    className={`w-full p-4 border flex items-center justify-between transition-all ${isCarMode ? 'border-[#00F3FF] bg-[#00F3FF]/10' : 'border-white/10 bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Car size={18} className={isCarMode ? 'text-[#00F3FF]' : 'text-zinc-500'} />
                      <div className="text-left">
                        <div className="text-[10px] font-black uppercase text-white">Modo Piloto</div>
                        <div className="text-[7px] text-zinc-500 uppercase">HUD Optimizado</div>
                      </div>
                    </div>
                    <Zap size={14} className={isCarMode ? 'text-[#00F3FF] animate-pulse' : 'text-zinc-800'} />
                  </button>
                </div>

                <div className="mt-8 text-center">
                  <span className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.5em]">Netrunner // Systems_Active</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scanline { 0% { top: -10%; } 100% { top: 110%; } }
        .animate-scanline { animation: scanline 6s linear infinite; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}