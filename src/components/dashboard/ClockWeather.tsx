import React, { useState, useEffect } from 'react';
import { Sun, Cloud } from 'lucide-react';

export default function ClockWeather() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-0 font-cyber">
      <div className="flex items-center gap-3">
        <h1 className="text-5xl font-black text-white drop-shadow-[0_0_12px_rgba(0,243,255,0.8)] tracking-tighter italic">
          {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </h1>
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-[#00F3FF]/50 to-transparent" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-pink-500 animate-pulse">
            <Sun size={14} fill="currentColor" />
            <span className="text-sm font-black">28°C</span>
          </div>
          <span className="text-[9px] text-[#00F3FF] uppercase font-bold tracking-widest opacity-70">Ceará, BR</span>
        </div>
      </div>
      <div className="text-[10px] text-zinc-500 uppercase font-black mt-1 tracking-[0.2em]">
        {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(time)}
      </div>
    </div>
  );
}