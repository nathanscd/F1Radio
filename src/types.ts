export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}