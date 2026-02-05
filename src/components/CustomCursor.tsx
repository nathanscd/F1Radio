import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Target, Zap, Activity, Hash, Maximize2 } from 'lucide-react';

/* --- SUB-COMPONENTE: MENU DE CONTEXTO --- */
const CyberContextMenu = ({ x, y, onClose }: { x: number, y: number, onClose: () => void }) => {
  const actions = [
    { label: 'SYSTEM_RELOAD', action: () => window.location.reload() },
    { label: 'COPY_BUFFER', action: () => navigator.clipboard.writeText(window.location.href) },
    { type: 'separator' },
    { label: 'TERMINAL_CLOSE', action: onClose, color: 'text-[#FF003C]' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-[100000] w-48 bg-black/95 border border-[#00F3FF]/40 backdrop-blur-xl p-1 font-mono shadow-[0_0_30px_rgba(0,243,255,0.2)]"
      style={{ top: y, left: x + 20, clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)" }}
    >
      {actions.map((item, i) => (
        item.type === 'separator' ? <div key={i} className="h-[1px] bg-[#00F3FF]/20 my-1" /> : (
          <button key={i} onClick={item.action} className={`w-full text-left p-2 text-[10px] font-bold hover:bg-[#00F3FF]/10 transition-colors uppercase ${item.color || 'text-[#00F3FF]'}`}>
            {'>'} {item.label}
          </button>
        )
      ))}
    </motion.div>
  );
};

export default function CustomCursor() {
  // Posição Real
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Molas para efeito de rastro e fluidez
  const springFast = { damping: 25, stiffness: 400, mass: 0.5 };
  const springSlow = { damping: 15, stiffness: 150, mass: 1 };

  const xMain = useSpring(mouseX, springFast);
  const yMain = useSpring(mouseY, springFast);
  const xLag = useSpring(mouseX, springSlow);
  const yLag = useSpring(mouseY, springSlow);

  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Detector rigoroso de Mobile/Touch
    const checkMobile = () => {
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      setIsMobile(isTouch);
    };
    checkMobile();

    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);
    const onMouseLeave = () => { setIsVisible(false); setMenuOpen(false); };
    const onMouseEnter = () => setIsVisible(true);

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const hoverable = target.closest('button, a, input, [role="button"], .hover-effect');
      setIsHovering(!!hoverable);
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    };

    if (!isMobile) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mouseover', onMouseOver);
      window.addEventListener('contextmenu', onContextMenu);
      document.addEventListener('mouseleave', onMouseLeave);
      document.addEventListener('mouseenter', onMouseEnter);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [mouseX, mouseY, isVisible, isMobile]);

  if (isMobile) return null;

  return (
    <>
      <style>{`
        * { cursor: none !important; }
        @keyframes spin-cw { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes spin-ccw { from { transform: translate(-50%, -50%) rotate(360deg); } to { transform: translate(-50%, -50%) rotate(0deg); } }
      `}</style>

      <AnimatePresence>
        {menuOpen && <CyberContextMenu x={menuPos.x} y={menuPos.y} onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>

      <motion.div 
        className="fixed inset-0 z-[100000] pointer-events-none"
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* 1. Rastro Fantasma (The Ghost) */}
        <motion.div
          className="absolute border border-[#00F3FF]/20"
          style={{ x: xLag, y: yLag, translateX: '-50%', translateY: '-50%', width: 40, height: 40, rotate: 45 }}
        />

        {/* 2. Anel Rotativo Externo (Data Ring) */}
        <motion.div
          className="absolute border-[1px] border-dashed border-[#00F3FF]/40 rounded-full"
          style={{ 
            x: xMain, y: yMain, translateX: '-50%', translateY: '-50%',
            width: isHovering ? 80 : 50, height: isHovering ? 80 : 50,
            animation: 'spin-cw 10s linear infinite'
          }}
        />

        {/* 3. HUD Principal (Octagon Crosshair) */}
        <motion.div
          className="absolute border border-[#00F3FF] flex items-center justify-center bg-[#00F3FF]/5 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
          style={{ x: xMain, y: yMain, translateX: '-50%', translateY: '-50%' }}
          animate={{
            width: isHovering ? 60 : 30,
            height: isHovering ? 60 : 30,
            rotate: isHovering ? 90 : 0,
            clipPath: isHovering 
              ? "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)"
              : "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            borderColor: isClicking ? '#FF003C' : '#00F3FF'
          }}
        >
          {/* Indicadores de mira interna */}
          <AnimatePresence>
            {isHovering && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex items-center justify-center">
                <Target size={16} className="text-[#00F3FF] animate-pulse" />
                <div className="absolute -top-6 text-[8px] font-black text-[#00F3FF] tracking-tighter">LOCKED</div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Cantoneiras */}
          <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-[#00F3FF]" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-[#00F3FF]" />
        </motion.div>

        {/* 4. Núcleo (The Core) */}
        <motion.div
          className="absolute bg-[#00F3FF] shadow-[0_0_15px_#00F3FF]"
          style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
          animate={{
            width: isClicking ? 12 : 4,
            height: isClicking ? 12 : 4,
            backgroundColor: isClicking ? '#FF003C' : '#00F3FF',
            boxShadow: isClicking ? '0 0 20px #FF003C' : '0 0 15px #00F3FF',
            rotate: isClicking ? 45 : 0
          }}
        />

        {/* 5. Info do Cursor (Coordenadas) */}
        {!isHovering && (
          <motion.div 
            className="absolute text-[7px] font-mono text-[#00F3FF]/40 flex flex-col"
            style={{ x: mouseX, y: mouseY, translateX: 25, translateY: 25 }}
          >
            <span>X:{Math.floor(mouseX.get())}</span>
            <span>Y:{Math.floor(mouseY.get())}</span>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}