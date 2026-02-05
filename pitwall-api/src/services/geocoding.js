import axios from 'axios';

export const searchLocation = async (query) => {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`;
    
    const response = await axios.get(url);
    
    return response.data.features.map(f => ({
      name: f.properties.name,
      details: [f.properties.city, f.properties.country].filter(Boolean).join(', '),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0]
    }));
  } catch (error) {
    console.error("Erro no Geocoding:", error.message);
    return [];
  }
};