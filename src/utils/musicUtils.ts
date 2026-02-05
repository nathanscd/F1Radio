import type { Track } from '../types';

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  tracks: Track[];
  year: string;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  topTracks: Track[];
}

export const deriveData = (tracks: Track[]) => {
  const albumsMap = new Map<string, Album>();
  const artistsMap = new Map<string, Artist>();

  tracks.forEach(t => {
    // Lógica de Álbum: Agrupa por Artista + Imagem
    const albumKey = `${t.artist}-${t.thumbnail}`; 
    if (!albumsMap.has(albumKey)) {
      albumsMap.set(albumKey, {
        id: `alb-${albumKey}`,
        title: t.title.replace(/official video|audio|lyrics/gi, '').trim(), // Limpa o título
        artist: t.artist,
        cover: t.thumbnail,
        tracks: [],
        year: '2077'
      });
    }
    albumsMap.get(albumKey)?.tracks.push(t);

    // Lógica de Artista: Agrupa pelo nome do canal/artista
    if (!artistsMap.has(t.artist)) {
      artistsMap.set(t.artist, {
        id: `art-${t.artist}`,
        name: t.artist,
        image: t.thumbnail,
        topTracks: []
      });
    }
    artistsMap.get(t.artist)?.topTracks.push(t);
  });

  // Filtra apenas álbuns/artistas que têm conteúdo relevante
  return {
    albums: Array.from(albumsMap.values()),
    artists: Array.from(artistsMap.values())
  };
};