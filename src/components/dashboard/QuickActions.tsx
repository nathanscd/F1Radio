import React from 'react';
import { Navigation, Zap, Layers, Activity, ChevronRight } from 'lucide-react';

interface ActionProps {
  onNavigate: (page: string) => void;
}

export default function QuickActions({ onNavigate }: ActionProps) {
  const actions = [
    { id: 'MAP', label: 'Navegação', sub: 'GPS Ativo', icon: <Navigation size={22} />, color: '#FF003C', shadow: 'shadow-[0_0_20px_rgba(255,0,60,0.2)]' },
    { id: 'MUSIC', label: 'Multimídia', sub: 'Spotify/YT', icon: <Layers size={22} />, color: '#00F3FF', shadow: 'shadow-[0_0_20px_rgba(0,243,255,0.2)]' },
    { id: 'CAR', label: 'Modo Piloto', sub: 'HUD 3D Focus', icon: <Zap size={22} />, color: '#EAB308', shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]' },
    { id: 'STATUS', label: 'Telemetria', sub: 'Pitwall-API', icon: <Activity size={22} />, color: '#22C55E', shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onNavigate(action.id)}
          className={`glass-panel group relative p-4 flex flex-col items-start gap-3 active:scale-95 transition-all duration-300 border-b-2 border-transparent hover:border-white/20 ${action.shadow}`}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <ChevronRight size={14} className="text-white/30" />
          </div>
          <div style={{ color: action.color }} className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-colors">
            {action.icon}
          </div>
          <div className="text-left">
            <span className="block text-[11px] font-black uppercase text-white tracking-widest group-hover:text-[#00F3FF] transition-colors">
              {action.label}
            </span>
            <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-tighter mt-0.5">
              {action.sub}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}