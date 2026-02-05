import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import axios from 'axios';
import dotenv from 'dotenv';

// Importações dos seus serviços locais (mantenha os arquivos nessas pastas)
import { searchLocation } from './src/services/geocoding.js';
import { setupSocket } from './src/sockets/mapSocket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuração do Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Permite conexões de qualquer front-end
    methods: ["GET", "POST"]
  }
});

// --- MIDDLEWARES ---
app.use(cors());
app.use(helmet());
app.use(morgan('dev')); // Logs de requisições no terminal
app.use(express.json());

// --- FUNÇÕES AUXILIARES ---

// Converte string de duração ISO 8601 do YouTube (ex: PT1H2M10S) para segundos
const parseDuration = (duration) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = (parseInt(match[1] || '0')) * 3600;
  const minutes = (parseInt(match[2] || '0')) * 60;
  const seconds = parseInt(match[3] || '0');
  
  return hours + minutes + seconds;
};

// --- ROTAS HTTP (REST) ---

/**
 * ROTA DE MÚSICA (YOUTUBE)
 * Filtros: Remove Shorts (< 60s) mas busca em todas as categorias.
 */
app.get('/api/music/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    // Validação básica
    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Query vazia' });
    }

    const API_KEY = process.env.YOUTUBE_API_KEY;
    
    if (!API_KEY) {
        console.error("ERRO: API Key do YouTube não configurada no .env");
        return res.status(500).json({ error: 'Configuração de servidor inválida' });
    }

    // PASSO 1: Busca Inicial (Search Endpoint)
    // Adicionamos "-shorts" para desencorajar o algoritmo a enviar vídeos curtos
    const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
            part: 'snippet',
            maxResults: 25,
            q: `${q} -shorts`, 
            type: 'video',
            // videoCategoryId: '10', // REMOVIDO: Para encontrar mais resultados
            key: API_KEY
        }
    });

    if (!searchRes.data.items || searchRes.data.items.length === 0) {
        return res.json([]); // Retorna array vazio se nada for encontrado
    }

    // Extrai os IDs dos vídeos encontrados
    const videoIds = searchRes.data.items.map(item => item.id.videoId).join(',');

    // PASSO 2: Busca de Detalhes (Videos Endpoint)
    // Necessário para obter a 'duration' real do vídeo
    const detailsRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
            part: 'contentDetails,snippet',
            id: videoIds,
            key: API_KEY
        }
    });

    // PASSO 3: Filtragem e Formatação
    const validTracks = detailsRes.data.items
        .filter(video => {
            const durationSec = parseDuration(video.contentDetails.duration);
            
            // Regra Anti-Shorts:
            // Remove vídeos com menos de 60 segundos.
            // Isso elimina a maioria dos TikToks/Reels repostados.
            const isTooShort = durationSec < 60; 
            
            return !isTooShort;
        })
        .map(video => ({
            id: video.id,
            title: video.snippet.title,
            artist: video.snippet.channelTitle, // Usamos o nome do canal como artista
            thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url
        }));

    res.json(validTracks);

  } catch (err) {
    // Log detalhado do erro no servidor
    console.error("Erro na busca do YouTube:", err.response?.data?.error?.message || err.message);
    
    // Retorna array vazio para o front não quebrar
    res.json([]); 
  }
});

/**
 * ROTA DE MAPA (GEOCODING)
 * Busca locais para o GPS do carro
 */
app.get('/api/map/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query vazia' });
    
    const places = await searchLocation(q);
    res.json(places);
  } catch (err) {
    console.error("Erro no mapa:", err.message);
    res.status(500).json({ error: 'Falha na busca de local' });
  }
});

// --- INICIALIZAÇÃO DO SOCKET.IO ---
// (Certifique-se que o arquivo src/sockets/mapSocket.js existe e exporta a função)
setupSocket(io);

// --- START SERVER ---
const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Pitwall Backend rodando na porta ${PORT}`);
  console.log(`📡 Modo: ${process.env.NODE_ENV || 'development'}`);
});