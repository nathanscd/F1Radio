import React from 'react';
import { motion } from 'framer-motion';
import { useDateTime } from '../../hooks/useDateTime';

interface Props { name: string }

export default function SmartGreeting({ name }: Props) {
  const { greeting } = useDateTime();

  return (
    <div className="space-y-1">
      <motion.h2 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="text-2xl md:text-3xl font-black text-white uppercase italic"
      >
        {greeting}, <span className="text-[#00F3FF]">{name}</span>.
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.3 }}
        className="text-xs text-zinc-400 font-bold uppercase tracking-tighter"
      >
        Sistemas normalizados. O que vamos pilotar agora?
      </motion.p>
    </div>
  );
}