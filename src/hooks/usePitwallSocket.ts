// src/hooks/usePitwallSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = "https://sua-url-do-render.onrender.com";

export const usePitwallSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log("🟢 Conectado ao servidor Pitwall");
      newSocket.emit('join_road', { name: 'Player 1' }); // Dados iniciais
    });

    newSocket.on('all_drivers', (allDrivers) => {
      setDrivers(allDrivers);
    });

    newSocket.on('driver_moved', (updatedDriver) => {
      setDrivers(prev => {
        const index = prev.findIndex(d => d.id === updatedDriver.id);
        if (index > -1) {
          const newDrivers = [...prev];
          newDrivers[index] = updatedDriver;
          return newDrivers;
        }
        return [...prev, updatedDriver];
      });
    });

    newSocket.on('driver_left', (id) => {
      setDrivers(prev => prev.filter(d => d.id !== id));
    });

    return () => { newSocket.close(); };
  }, []);

  const updateMyPosition = (lat: number, lon: number, speed: number) => {
    if (socket) socket.emit('update_position', { lat, lon, speed });
  };

  return { socket, drivers, updateMyPosition };
};