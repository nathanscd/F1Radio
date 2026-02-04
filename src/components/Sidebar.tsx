import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, Library, Radio, Signal, 
  Cpu, Zap, ShieldCheck, ChevronRight, Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'home' | 'playlists' | 'single-playlist';
  setActiveTab: (tab: 'home' | 'playlists') => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutGrid, sub: 'Race Control' },
    { id: 'playlists', label: 'Hangar', icon: Library, sub: 'Library' },
  ];

  return (
    <aside className="w-72 bg-[#050505] border-r border-zinc-800/50 flex flex-col relative overflow-hidden font-['Orbitron',sans-serif]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      
      <div className="p-8 relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            <div className="w-12 h-12 bg-[#FF001D] flex items-center justify-center rounded-lg rotate-3 group-hover:rotate-0 transition-transform duration-300 shadow-[0_0_20px_rgba(255,0,29,0.3)]">
              <Radio size={24} className="text-white animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <Activity size={10} className="text-black" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter italic leading-none text-white">
              F1 <span className="text-[#FF001D]">SOUND</span>
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[8px] text-zinc-500 tracking-[0.3em] uppercase font-bold">Paddock Edition</span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <div className="text-[9px] text-zinc-600 font-black tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
            <div className="w-4 h-[1px] bg-zinc-800" /> Main Systems
          </div>
          
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as 'home' | 'playlists')}
              className={`group relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 overflow-hidden ${
                activeTab === item.id || (activeTab === 'single-playlist' && item.id === 'playlists')
                ? 'bg-zinc-900/80 text-white border border-zinc-800 shadow-xl' 
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {(activeTab === item.id || (activeTab === 'single-playlist' && item.id === 'playlists')) && (
                <motion.div 
                  layoutId="activeGlow"
                  className="absolute left-0 w-1 h-6 bg-[#FF001D] rounded-r-full shadow-[0_0_10px_#FF001D]"
                />
              )}
              
              <item.icon size={20} className={activeTab === item.id ? 'text-[#FF001D]' : 'group-hover:scale-110 transition-transform'} />
              
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-tighter">{item.sub}</span>
              </div>

              <ChevronRight size={14} className={`ml-auto transition-transform ${activeTab === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-6">
        <div className="p-4 bg-[#0a0a0a] border border-zinc-800/50 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Diagnostics</span>
            <ShieldCheck size={12} className="text-green-500" />
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase">
                <span className="flex items-center gap-1"><Cpu size={8} /> CPU Load</span>
                <span>12%</span>
              </div>
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="w-[12%] h-full bg-green-500/50" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase">
                <span className="flex items-center gap-1"><Zap size={8} /> Signal</span>
                <span>Optimal</span>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i < 4 ? 'bg-[#FF001D]' : 'bg-zinc-800'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 bg-zinc-900/30 rounded-full border border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-black border border-zinc-800 flex items-center justify-center text-[10px] font-black italic">
            DR
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white uppercase tracking-tighter">Driver_01</span>
            <span className="text-[7px] font-mono text-green-500 uppercase">Connected</span>
          </div>
          <div className="ml-auto pr-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="h-1 w-full flex">
        <div className="w-1/2 bg-[#FF001D]" />
        <div className="w-1/2 bg-white" />
      </div>
    </aside>
  );
}