import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, ArrowLeft, Copy, Terminal, Eye, 
  ShieldAlert, Fingerprint, X 
} from 'lucide-react';

/* --- SUB-COMPONENTE: MENU DE CONTEXTO --- */
const CyberContextMenu = ({ x, y, onClose }: { x: number, y: number, onClose: () => void }) => {
  const menuWidth = 220;
  const menuHeight = 320; // Ajustado levemente
  const posX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
  const posY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

  const actions = [
    { label: 'SYSTEM_RELOAD', icon: <RotateCcw size={14}/>, action: () => window.location.reload(), color: 'text-[#00F3FF]' },
    { label: 'NAVIGATE_BACK', icon: <ArrowLeft size={14}/>, action: () => window.history.back(), color: 'text-[#00F3FF]' },
    { label: 'COPY_URL_LINK', icon: <Copy size={14}/>, action: () => navigator.clipboard.writeText(window.location.href), color: 'text-[#00F3FF]' },
    { type: 'separator' },
    { label: 'INSPECT_DOM', icon: <Terminal size={14}/>, action: () => console.log('Injecting Neural Probe...'), color: 'text-zinc-400' },
    { label: 'SCAN_ELEMENT', icon: <Fingerprint size={14}/>, action: () => console.log('Scanning target...'), color: 'text-zinc-400' },
    { type: 'separator' },
    { label: 'CLOSE_MENU', icon: <X size={14}/>, action: onClose, color: 'text-[#FF003C]' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
      transition={{ duration: 0.15 }}
      // Z-Index alto, mas menor que o cursor (que será 100001)
      className="fixed z-[100000] w-[220px] bg-[#050505]/95 border border-[#00F3FF]/30 backdrop-blur-md overflow-hidden font-mono"
      style={{ 
        top: posY, 
        left: posX,
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
        boxShadow: "0 0 30px rgba(0, 243, 255, 0.15)",
        cursor: 'none' // Garante que o cursor do sistema não apareça aqui
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px)', backgroundSize: '100% 4px' }} />
      
      <div className="bg-[#00F3FF]/10 p-2 border-b border-[#00F3FF]/20 flex justify-between items-center">
         <span className="text-[9px] font-black text-[#00F3FF] tracking-[0.2em] uppercase">CMD_OVERRIDE</span>
         <div className="flex gap-1">
             <div className="w-1.5 h-1.5 bg-[#FF003C] rounded-full animate-pulse"/>
             <div className="w-1.5 h-1.5 bg-[#00F3FF] rounded-full"/>
         </div>
      </div>

      <div className="p-2 flex flex-col gap-1">
        {actions.map((item, idx) => {
          if (item.type === 'separator') {
             return <div key={idx} className="h-[1px] bg-[#00F3FF]/20 my-1 mx-2" />;
          }
          return (
            <button
              key={idx}
              onClick={(e) => {
                 e.stopPropagation();
                 if (item.action) item.action();
                 onClose();
              }}
              // Cursor none aqui também para garantir
              className={`group flex items-center gap-3 w-full p-2 text-left hover:bg-[#00F3FF]/10 border border-transparent hover:border-[#00F3FF]/30 transition-all ${item.color} cursor-none`}
            >
              <span className="opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all">{item.icon}</span>
              <span className="text-[10px] font-bold tracking-wider uppercase group-hover:translate-x-1 transition-transform">{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="absolute bottom-1 right-2 text-[8px] text-[#00F3FF]/30 select-none">v.2.04</div>
    </motion.div>
  );
};

/* --- COMPONENTE PRINCIPAL DO CURSOR --- */
export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches || 
                      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(isTouch);
    };
    checkMobile();

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Lista expandida de elementos interativos
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.role === 'button' ||
        target.closest('button') || 
        target.closest('a') ||
        target.onclick != null ||
        window.getComputedStyle(target).cursor === 'pointer';

      setIsHovering(!!isInteractive);
    };

    const handleContextMenu = (e: MouseEvent) => {
       e.preventDefault();
       setMenuPos({ x: e.clientX, y: e.clientY });
       setMenuOpen(true);
    };

    const handleClick = () => {
       if (menuOpen) setMenuOpen(false);
    };

    if (!isMobile) {
      window.addEventListener('mousemove', moveCursor);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseover', handleMouseOver);
      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('mouseenter', handleMouseEnter);
      
      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('click', handleClick);
      window.addEventListener('scroll', handleClick);
    }

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleClick);
    };
  }, [cursorX, cursorY, isVisible, isMobile, menuOpen]);

  if (isMobile) return null;

  return (
    <>
      <style>{`
        body, html, * {
          cursor: none !important;
        }
      `}</style>

      {/* Menu de Contexto (Z-Index: 100000) */}
      <AnimatePresence>
         {menuOpen && (
            <CyberContextMenu 
               x={menuPos.x} 
               y={menuPos.y} 
               onClose={() => setMenuOpen(false)} 
            />
         )}
      </AnimatePresence>

      {/* CURSOR (Z-Index: 100001 - Sempre acima do menu) */}
      
      {/* 1. Dot Central */}
      <motion.div
        className="fixed top-0 left-0 z-[100001] rounded-full bg-[#00F3FF] pointer-events-none mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 1 : 0,
        }}
        animate={{
          width: isHovering ? 0 : 4,
          height: isHovering ? 0 : 4,
          // Mantém sombra normal, não esconde mais
          boxShadow: '0 0 10px #00F3FF'
        }}
        transition={{ duration: 0.1 }}
      />

      {/* 2. Outline Interativo */}
      <motion.div
        className="fixed top-0 left-0 z-[100001] border border-[#00F3FF] flex items-center justify-center pointer-events-none"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 1 : 0,
        }}
        animate={{
          // Agora o cursor reage ao Hover mesmo com o menu aberto
          // Removemos a lógica que diminuía o cursor quando menuOpen
          width: isHovering ? 52 : 28,
          height: isHovering ? 52 : 28,
          opacity: 1, // Sempre opaco
          rotate: isHovering ? 45 : 0,
          scale: isClicking ? 0.8 : 1,
          backgroundColor: isHovering ? 'rgba(0, 243, 255, 0.15)' : 'rgba(0, 243, 255, 0)',
          borderColor: isClicking ? '#FF003C' : '#00F3FF',
        }}
        transition={{ type: "spring", damping: 25, stiffness: 250 }}
      >
        <AnimatePresence>
          {isHovering && (
             <motion.div 
               initial={{ opacity: 0, scale: 0 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0 }}
               className="w-1.5 h-1.5 bg-[#00F3FF] absolute"
             />
          )}
        </AnimatePresence>
        
        {/* HUD Decoration (Sempre visível agora) */}
        <>
            <div className="absolute top-0 left-0 w-[3px] h-[3px] bg-[#00F3FF] opacity-80" />
            <div className="absolute bottom-0 right-0 w-[3px] h-[3px] bg-[#00F3FF] opacity-80" />
            <div className="absolute top-0 right-0 w-[1px] h-[1px] bg-white/20" />
            <div className="absolute bottom-0 left-0 w-[1px] h-[1px] bg-white/20" />
        </>
      </motion.div>
    </>
  );
}