import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Library, Radio, Activity, Cpu, 
  Shield, ChevronRight, Terminal, Network, 
  Disc, Database, Lock, User, Menu, X, 
  Settings, Cpu as CoreIcon, Zap, Monitor, Car
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'home' | 'playlists' | 'single-playlist';
  setActiveTab: (tab: 'home' | 'playlists') => void;
  isCarMode: boolean;
  onToggleCarMode: (val: boolean) => void;
}

// --- VISUAL UTILS ---

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

// --- MAIN COMPONENT ---

export default function Sidebar({ activeTab, setActiveTab, isCarMode, onToggleCarMode }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'MAINFRAME', icon: LayoutGrid, sub: 'Root_Access' },
    { id: 'playlists', label: 'DATA_BANKS', icon: Library, sub: 'Storage_Units' },
  ];

  const handleTabChange = (id: 'home' | 'playlists') => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-black border border-[#00F3FF]/30 text-[#00F3FF] shadow-[0_0_15px_rgba(0,243,255,0.1)]"
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/90 backdrop-blur-md z-[50]"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-72 bg-[#020202] border-r border-[#00F3FF]/20 flex flex-col transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        font-['Space_Mono',monospace] select-none
      `}>
        <ScanLine />
        
        <div className="p-8 relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#00F3FF]/5 border border-[#00F3FF]/40 flex items-center justify-center relative overflow-hidden group">
                <HUDCorner className="top-0 left-0" />
                <HUDCorner className="top-0 right-0 rotate-90" />
                <HUDCorner className="bottom-0 right-0 rotate-180" />
                <HUDCorner className="bottom-0 left-0 -rotate-90" />
                <CoreIcon size={24} className="text-[#00F3FF] animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tighter text-white uppercase italic">
                  NET<span className="text-[#00F3FF]">RUNNER</span>
                </h1>
                <div className="flex items-center gap-2 mt-1 border-t border-[#00F3FF]/20 pt-1">
                  <span className="w-1 h-1 bg-[#00F3FF] rounded-full animate-ping" />
                  <span className="text-[9px] text-[#00F3FF]/60 tracking-widest uppercase font-bold">Signal_Linked</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-[#00F3FF]/50 hover:text-[#00F3FF]">
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            <div className="text-[9px] text-[#00F3FF] font-bold tracking-widest uppercase mb-4 opacity-40 px-2 flex items-center gap-2">
              <Terminal size={10} /> DIRECTORY_INIT
            </div>
            
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleTabChange(item.id as 'home' | 'playlists')}
                className={`group relative flex items-center gap-4 p-3 border-l-2 transition-all duration-200 ${
                  activeTab === item.id || (activeTab === 'single-playlist' && item.id === 'playlists')
                  ? 'bg-[#00F3FF]/10 border-[#00F3FF] text-white' 
                  : 'border-transparent text-zinc-600 hover:text-[#00F3FF] hover:bg-[#00F3FF]/5'
                }`}
              >
                {(activeTab === item.id || (activeTab === 'single-playlist' && item.id === 'playlists')) && (
                   <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,243,255,0.1),transparent)] animate-pulse pointer-events-none" />
                )}
                
                <item.icon size={18} className={`relative z-10 transition-colors ${activeTab === item.id ? 'text-[#00F3FF]' : 'group-hover:text-[#00F3FF]'}`} />
                
                <div className="flex flex-col items-start relative z-10">
                  <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
                  <span className="text-[7px] text-zinc-600 uppercase group-hover:text-[#00F3FF]/50 transition-colors">{item.sub}</span>
                </div>

                <ChevronRight size={14} className={`ml-auto relative z-10 transition-all ${activeTab === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} />
              </button>
            ))}

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="group relative flex items-center gap-4 p-3 border-l-2 border-transparent text-zinc-600 hover:text-[#00F3FF] hover:bg-[#00F3FF]/5 transition-all mt-4"
            >
              <Settings size={18} className="relative z-10" />
              <div className="flex flex-col items-start relative z-10">
                <span className="text-[11px] font-bold tracking-tight uppercase">Settings</span>
                <span className="text-[7px] text-zinc-600 uppercase">System_Config</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4 relative z-10">
          <div className="p-4 bg-black border border-[#00F3FF]/20 relative overflow-hidden group">
            <ScanLine />
            <HUDCorner className="top-0 left-0 w-1.5 h-1.5" />
            <HUDCorner className="bottom-0 right-0 w-1.5 h-1.5 rotate-180" />
            
            <div className="flex items-center justify-between mb-3 border-b border-[#00F3FF]/10 pb-2">
              <span className="text-[9px] text-[#00F3FF] uppercase tracking-widest font-bold flex items-center gap-1">
                  <Activity size={10} /> UPLINK_STAT
              </span>
              <Shield size={10} className="text-[#00F3FF]" />
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] uppercase">
                  <span className="text-zinc-500">CPU_Core</span>
                  <span className="text-[#00F3FF]">12%</span>
                </div>
                <div className="h-[2px] bg-zinc-900 w-full">
                  <div className="w-[12%] h-full bg-[#00F3FF] shadow-[0_0_5px_#00F3FF]" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] uppercase">
                  <span className="text-zinc-500">Buffer_Use</span>
                  <span className="text-[#00F3FF]">45%</span>
                </div>
                <div className="h-[2px] bg-zinc-900 w-full">
                  <div className="w-[45%] h-full bg-white shadow-[0_0_5px_#fff]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#00F3FF]/5 border border-[#00F3FF]/20 hover:border-[#00F3FF] transition-all cursor-pointer group">
            <div className="w-8 h-8 bg-black border border-zinc-800 flex items-center justify-center text-[#00F3FF] group-hover:border-[#00F3FF]">
              <User size={14} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-white uppercase truncate">ROOT_ADMIN</span>
              <span className="text-[7px] text-[#00F3FF]/50 uppercase flex items-center gap-1 font-bold">
                 <Lock size={6} /> Encrypted_Session
              </span>
            </div>
          </div>
        </div>

        <div className="h-[1px] w-full bg-[#00F3FF] shadow-[0_0_10px_#00F3FF]" />
      </aside>

      {/* --- SETTINGS MODAL --- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[110] p-1 bg-[#00F3FF]/20"
            >
              <div className="bg-[#020202] border border-[#00F3FF] p-6 relative">
                <ScanLine />
                <HUDCorner className="top-2 left-2" />
                <HUDCorner className="bottom-2 right-2 rotate-180" />
                
                <div className="flex items-center justify-between mb-8 border-b border-[#00F3FF]/20 pb-4">
                  <div className="flex items-center gap-3 text-[#00F3FF]">
                    <Settings size={18} className="animate-spin-slow" />
                    <span className="text-xs font-bold uppercase tracking-widest">System_Settings</span>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-3 border border-zinc-800 hover:border-[#00F3FF]/40 transition-all">
                    <div className="flex items-center gap-3">
                      <Car size={16} className={isCarMode ? "text-[#00F3FF]" : "text-zinc-600"} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white uppercase">Cyber_HUD</span>
                        <span className="text-[7px] text-zinc-600 uppercase">Optimize for driving</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onToggleCarMode(!isCarMode)}
                      className={`w-10 h-5 relative flex items-center transition-colors ${isCarMode ? 'bg-[#00F3FF]' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-3 h-3 bg-black mx-1 transition-transform ${isCarMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-zinc-800 opacity-50">
                    <div className="flex items-center gap-3">
                      <Zap size={16} className="text-zinc-600" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white uppercase">Performance</span>
                        <span className="text-[7px] text-zinc-600 uppercase">High frequency sync</span>
                      </div>
                    </div>
                    <div className="w-10 h-5 bg-zinc-900 border border-zinc-800" />
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#00F3FF]/10 text-center">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-[0.2em]">Netrunner_OS // v.4.0.2</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scanline { 0% { top: -10%; } 100% { top: 110%; } }
        .animate-scanline { animation: scanline 4s linear infinite; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}