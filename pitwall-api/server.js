import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { searchVideo } from './src/services/youtube.js';
import { searchLocation } from './src/services/geocoding.js';
import { setupSocket } from './src/sockets/mapSocket.js';

const app = express();
const httpServer = createServer(app); // Socket.io precisa do HTTP nativo
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Permite acesso de qualquer lugar (Vercel, localhost)
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// --- ROTAS HTTP (REST) ---

// Rota de Música
app.get('/api/music/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query vazia' });
    const tracks = await searchVideo(q);
    res.json(tracks);
  } catch (err) {
    res.status(500).json({ error: 'Falha na busca de música' });
  }
});

// Rota de Mapa (Busca de Local)
app.get('/api/map/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query vazia' });
    const places = await searchLocation(q);
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: 'Falha na busca de local' });
  }
});

// --- SETUP WEBSOCKET ---
setupSocket(io);

// Inicialização
const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Pitwall Backend rodando na porta ${PORT}`);
});