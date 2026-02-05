import { Innertube } from 'youtubei.js';

let yt = null;

export const getYouTubeInstance = async () => {
  if (!yt) {
    console.log('🔧 Inicializando InnerTube...');
    yt = await Innertube.create();
  }
  return yt;
};

export const searchVideo = async (query) => {
  const innerTube = await getYouTubeInstance();
  const results = await innerTube.search(query, { type: 'video' });
  
  return results.videos.map((v) => ({
    id: v.id,
    title: v.title.text,
    artist: v.author.name,
    thumbnail: v.thumbnails[0]?.url || ''
  }));
};