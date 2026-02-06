import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, User, Zap, Radio, Navigation, Gauge, Wifi, Signal, Battery, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ClockWeather from '../components/dashboard/ClockWeather';
import QuickActions from '../components/dashboard/QuickActions';

interface HomeProps {
  onNavigate: (page: string) => void;
  userName?: string;
}

export default function Home({ onNavigate, userName = "..." }: HomeProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(95);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((batt: any) => {
        setBatteryLevel(Math.round(batt.level * 100));
        batt.addEventListener('levelchange', () => setBatteryLevel(Math.round(batt.level * 100)));
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const glitchVariants = {
    animate: {
      textShadow: [
        "0 0 10px #00F3FF, 0 0 20px #00F3FF",
        "0 0 20px #FF003C, 0 0 40px #FF003C",
        "0 0 10px #00F3FF, 0 0 20px #00F3FF",
      ],
      transition: { duration: 3, repeat: Infinity },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#050b14] to-[#0a0f1a] p-6 flex flex-col justify-between overflow-hidden relative font-mono">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        .font-cyber { font-family: 'Orbitron', monospace; }
        
        .glass-panel {
          background: rgba(0, 5, 10, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 243, 255, 0.15);
        }
        
        .glass-panel-dark {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(0, 243, 255, 0.1);
        }
        
        .neon-border {
          border: 1px solid rgba(0, 243, 255, 0.3);
          box-shadow: 0 0 20px rgba(0, 243, 255, 0.2), inset 0 0 20px rgba(0, 243, 255, 0.05);
        }
        
        .neon-border-pink {
          border: 1px solid rgba(255, 0, 60, 0.3);
          box-shadow: 0 0 20px rgba(255, 0, 60, 0.2), inset 0 0 20px rgba(255, 0, 60, 0.05);
        }
        
        .glow-cyan {
          filter: drop-shadow(0 0 8px #00F3FF) drop-shadow(0 0 4px #00F3FF);
        }
        
        .glow-pink {
          filter: drop-shadow(0 0 8px #FF003C) drop-shadow(0 0 4px #FF003C);
        }
        
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100vh); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 243, 255, 0.3), inset 0 0 20px rgba(0, 243, 255, 0.05); }
          50% { box-shadow: 0 0 40px rgba(0, 243, 255, 0.6), inset 0 0 30px rgba(0, 243, 255, 0.1); }
        }
        
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .grid-bg {
          background-image: 
            linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: grid-move 20s linear infinite;
        }
        
        .cyber-text {
          background: linear-gradient(135deg, #00F3FF, #FF003C, #00F3FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .button-hover {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .button-hover::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 243, 255, 0.3), transparent);
          transition: left 0.5s;
        }
        
        .button-hover:hover::before {
          left: 100%;
        }
        
        .button-hover:hover {
          box-shadow: 0 0 20px rgba(0, 243, 255, 0.5), inset 0 0 20px rgba(0, 243, 255, 0.1);
          border-color: rgba(0, 243, 255, 0.6);
        }
      `}</style>

      {/* Background FX - Enhanced */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#00F3FF]/8 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-500/8 blur-[130px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00F3FF]/3 blur-[200px] rounded-full pointer-events-none opacity-20" />
      
      {/* Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Animated Border Top */}
      <motion.div
        className="fixed inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent z-0"
        animate={{
          boxShadow: [
            "0 0 20px rgba(0, 243, 255, 0.5)",
            "0 0 40px rgba(0, 243, 255, 0.8)",
            "0 0 20px rgba(0, 243, 255, 0.5)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Decorative Corner Borders - Enhanced */}
      <motion.div
        className="fixed top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-[#00F3FF]/40 rounded-tl-xl pointer-events-none"
        animate={{
          boxShadow: [
            "0 0 10px rgba(0, 243, 255, 0.3)",
            "0 0 20px rgba(0, 243, 255, 0.6)",
            "0 0 10px rgba(0, 243, 255, 0.3)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="fixed bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-[#00F3FF]/40 rounded-br-xl pointer-events-none"
        animate={{
          boxShadow: [
            "0 0 10px rgba(0, 243, 255, 0.3)",
            "0 0 20px rgba(0, 243, 255, 0.6)",
            "0 0 10px rgba(0, 243, 255, 0.3)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />

      {/* Header Section - Enhanced */}
      <motion.header
        className="z-10 flex justify-between items-start"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex-1">
          <ClockWeather />
        </div>
        <div className="flex gap-3">
          {/* Status Indicators */}
          <motion.div
            className="glass-panel px-4 py-2.5 rounded-xl flex items-center gap-3 neon-border"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-2">
              <Signal size={14} className={`${isOnline ? 'text-green-400' : 'text-red-400'} animate-pulse`} />
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Battery size={14} className={`${batteryLevel > 50 ? 'text-green-400' : batteryLevel > 20 ? 'text-yellow-400' : 'text-red-400'}`} />
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{batteryLevel}%</span>
            </div>
          </motion.div>

          <motion.button
            className="glass-panel p-2.5 rounded-xl border-white/5 button-hover neon-border"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('settings')}
          >
            <Settings size={20} className="text-[#00F3FF]" />
          </motion.button>
        </div>
      </motion.header>

      {/* Main Greeting / Profile Section - Enhanced */}
      <motion.main
        className="z-10 flex flex-col gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Card */}
        <motion.div
          className="flex items-center gap-6"
          variants={itemVariants}
        >
          <motion.div
            className="w-20 h-20 rounded-2xl neon-border flex items-center justify-center bg-gradient-to-br from-[#00F3FF]/20 to-black relative flex-shrink-0 animate-pulse-glow"
            whileHover={{ scale: 1.05 }}
          >
            <User size={40} className="text-[#00F3FF] glow-cyan" />
            <motion.div
              className="absolute -bottom-2 -right-2 p-1.5 bg-green-500 rounded-full border-2 border-[#050b14] shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ShieldCheck size={12} className="text-black" />
            </motion.div>
          </motion.div>

          <div className="flex-1">
            <motion.h2
              className="text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter font-cyber leading-none mb-2"
              variants={glitchVariants}
              animate="animate"
            >
              {greeting}, <span className="cyber-text">{userName}</span>
            </motion.h2>
            <motion.div
              className="flex items-center gap-3 mt-3"
              variants={itemVariants}
            >
              <motion.div
                className="h-2 w-2 rounded-full bg-green-400 shadow-lg"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em]">SISTEMAS ONLINE</span>
              <div className="h-px w-8 bg-gradient-to-r from-green-400 to-transparent" />
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">STATUS: OPERACIONAL</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Info Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {/* Traffic Status */}
          <motion.div
            className="glass-panel p-4 rounded-xl neon-border overflow-hidden relative group"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00F3FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Navigation size={14} className="text-[#00F3FF]" />
                <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">TRÁFEGO</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-bold leading-relaxed">
                Rota para <span className="text-[#00F3FF] font-black">Eletra Energy</span> fluindo normalmente
              </p>
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            className="glass-panel p-4 rounded-xl neon-border overflow-hidden relative group"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00F3FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">ENERGIA</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-bold">
                Consumo em <span className="text-yellow-400 font-black">NORMAL</span>
              </p>
              <div className="w-full h-1.5 bg-white/5 rounded mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-[#00F3FF]"
                  animate={{ width: ['0%', '75%', '75%'] }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Signal Strength */}
          <motion.div
            className="glass-panel p-4 rounded-xl neon-border overflow-hidden relative group"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00F3FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Radio size={14} className="text-pink-400" />
                <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">SINAL</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-bold">
                Força: <span className="text-pink-400 font-black">{signalStrength}%</span>
              </p>
              <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-1 flex-1 rounded ${i < Math.ceil((signalStrength / 100) * 5) ? 'bg-pink-400' : 'bg-white/10'}`}
                    animate={i < Math.ceil((signalStrength / 100) * 5) ? { opacity: [0.5, 1, 0.5] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Alert Box - Enhanced */}
        <motion.div
          className="glass-panel p-6 rounded-xl bg-gradient-to-r from-black/60 via-[#00F3FF]/5 to-transparent neon-border overflow-hidden relative group"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#00F3FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <motion.div
            className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00F3FF] to-transparent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative z-10">
            <div className="flex items-start gap-3 mb-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-[#00F3FF] mt-1 flex-shrink-0"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[9px] text-[#00F3FF] font-black uppercase tracking-[0.2em]">SISTEMA NEURAL</span>
            </div>
            <p className="text-[12px] text-zinc-300 font-bold leading-relaxed tracking-wide">
              Sugestão: O trânsito para <span className="text-white font-black">Eletra Energy</span> está fluindo normalmente. Tempo estimado: <span className="text-[#00F3FF]">18 minutos</span>. Modo foco recomendado.
            </p>
          </div>
        </motion.div>
      </motion.main>

      {/* Footer / Quick Access - Enhanced */}
      <motion.footer
        className="z-10 pb-4"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.span
            className="text-[8px] font-black text-[#00F3FF] uppercase tracking-[0.4em] whitespace-nowrap font-cyber"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ▸ LAUNCHER CENTRAL
          </motion.span>
          <motion.div
            className="h-[1px] w-full bg-gradient-to-r from-[#00F3FF]/40 via-[#00F3FF]/10 to-transparent"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
        <QuickActions onNavigate={onNavigate} />
      </motion.footer>
    </div>
  );
}
