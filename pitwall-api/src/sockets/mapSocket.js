// Armazenamento em memória volátil (reinicia se o servidor reiniciar)
// Para produção pesada, usaríamos Redis.
const activeDrivers = new Map(); 

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🏎️ Piloto conectado: ${socket.id}`);

    // Piloto entra no modo carro
    socket.on('join_road', (userData) => {
      activeDrivers.set(socket.id, { 
        id: socket.id, 
        lat: 0, 
        lon: 0, 
        ...userData 
      });
      // Envia lista de todos os pilotos para quem acabou de entrar
      socket.emit('all_drivers', Array.from(activeDrivers.values()));
    });

    // Piloto atualiza sua posição (GPS)
    socket.on('update_position', (coords) => {
      const driver = activeDrivers.get(socket.id);
      if (driver) {
        driver.lat = coords.lat;
        driver.lon = coords.lon;
        driver.speed = coords.speed;
        
        // Espalha a nova posição para TODOS os outros clientes
        socket.broadcast.emit('driver_moved', driver);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Piloto desconectado: ${socket.id}`);
      activeDrivers.delete(socket.id);
      io.emit('driver_left', socket.id);
    });
  });
};