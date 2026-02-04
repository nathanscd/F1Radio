import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Configuração da mola (Física do Cyberdeck)
  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 1. Detectar Mobile (Dispositivos Touch)
    const checkMobile = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches || 
                      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(isTouch);
    };
    checkMobile();

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true); // Garante visibilidade ao mover
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    // 2. Fadeout ao sair/entrar na tela
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') || 
        target.closest('a') ||
        target.style.cursor === 'pointer';

      setIsHovering(!!isInteractive);
    };

    if (!isMobile) {
      window.addEventListener('mousemove', moveCursor);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseover', handleMouseOver);
      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('mouseenter', handleMouseEnter);
    }

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible, isMobile]);

  // Se for mobile, não renderiza nada e mantém o cursor padrão do sistema
  if (isMobile) return null;

  return (
    <>
      <style>{`
        body, html, * {
          cursor: none !important;
        }
        .custom-cursor {
          pointer-events: none;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 99999;
          opacity: 0;
        }
      `}</style>

      {/* 1. Ponto Central (Dot) */}
      <motion.div
        className="custom-cursor rounded-full bg-[#00F3FF] shadow-[0_0_10px_#00F3FF]"
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
        }}
        transition={{ duration: 0.2 }}
      />

      {/* 2. Quadrado Externo (Outline) - Aumentado */}
      <motion.div
        className="custom-cursor border border-[#00F3FF] flex items-center justify-center"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 1 : 0,
          boxShadow: isClicking 
            ? '0 0 20px rgba(255, 0, 60, 0.8)' 
            : '0 0 15px rgba(0, 243, 255, 0.4)'
        }}
        animate={{
          width: isHovering ? 52 : 28, // Quadrado aumentado
          height: isHovering ? 52 : 28, // Quadrado aumentado
          rotate: isHovering ? 45 : 0,
          scale: isClicking ? 0.8 : 1,
          backgroundColor: isHovering ? 'rgba(0, 243, 255, 0.15)' : 'rgba(0, 243, 255, 0)',
          borderColor: isClicking ? '#FF003C' : '#00F3FF',
        }}
        transition={{ type: "spring", damping: 25, stiffness: 250 }}
      >
        {/* Cruz de mira interna */}
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
        
        {/* Cantos HUD */}
        <div className="absolute top-0 left-0 w-[3px] h-[3px] bg-[#00F3FF] opacity-80" />
        <div className="absolute bottom-0 right-0 w-[3px] h-[3px] bg-[#00F3FF] opacity-80" />
        <div className="absolute top-0 right-0 w-[1px] h-[1px] bg-white/20" />
        <div className="absolute bottom-0 left-0 w-[1px] h-[1px] bg-white/20" />
      </motion.div>
    </>
  );
}