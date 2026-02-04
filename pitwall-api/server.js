import express from 'express';
import cors from 'cors';
import { Innertube } from 'youtubei.js';

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

let yt;

async function initYT() {
  yt = await Innertube.create();
}

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query' });

    if (!yt) await initYT();

    const results = await yt.search(q, { type: 'video' });
    
    const tracks = results.videos.map((v) => ({
      id: v.id,
      title: v.title.text,
      artist: v.author.name,
      thumbnail: v.thumbnails[0].url
    }));

    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
});

initYT().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});