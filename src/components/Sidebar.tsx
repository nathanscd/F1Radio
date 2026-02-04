import React from 'react';
import { LayoutGrid, Search, Library, Radio, Signal } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-72 bg-black border-r border-white/5 p-8 flex flex-col gap-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FF001D] flex items-center justify-center rounded-sm">
          <Radio size={20} className="animate-pulse text-white" />
        </div>
        <div>
          <h1 className="font-black text-xl tracking-tighter italic leading-none text-white">F1 SOUNDBOX</h1>
          <span className="text-[8px] text-zinc-500 tracking-[0.4em] uppercase">Paddock Edition</span>
        </div>
      </div>

      <nav className="flex flex-col gap-6">
        <div className="text-[10px] text-zinc-600 font-bold tracking-[0.2em] uppercase">Menu</div>
        
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex items-center gap-4 font-black text-xs tracking-widest uppercase transition-colors ${activeTab === 'home' ? 'text-[#FF001D]' : 'text-zinc-400 hover:text-white'}`}
        >
          <LayoutGrid size={18} /> Dashboard
        </button>

        <button 
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-4 font-black text-xs tracking-widest uppercase transition-colors ${activeTab === 'search' ? 'text-[#FF001D]' : 'text-zinc-400 hover:text-white'}`}
        >
          <Search size={18} /> Telemetry
        </button>

        <button className="flex items-center gap-4 text-zinc-400 hover:text-white transition-colors font-black text-xs tracking-widest uppercase">
          <Library size={18} /> Race History
        </button>
      </nav>

      <div className="mt-auto p-4 bg-zinc-900/50 border border-white/5 rounded-sm">
        <div className="flex items-center gap-2 mb-2">
          <Signal size={12} className="text-green-500" />
          <span className="text-[8px] font-mono text-zinc-400 uppercase">System Status: Optimal</span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="w-full h-full bg-green-500/20" />
        </div>
      </div>
    </aside>
  );
}