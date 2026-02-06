import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createCarIcon = () => L.divIcon({
  className: 'cyber-car-marker',
  html: `
    <div id="car-arrow" style="transition: transform 0.1s linear; will-change: transform; filter: drop-shadow(0 0 10px #00F3FF);">
      <svg width="48" height="48" viewBox="0 0 24 24">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2Z" fill="#00F3FF" stroke="#000" stroke-width="2"/>
        <path d="M12 6L12 14" stroke="#fff" stroke-width="2" />
        <circle cx="12" cy="12" r="1.5" fill="#fff" class="animate-pulse"/>
      </svg>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24]
});

const destIcon = L.divIcon({
  className: 'cyber-dest',
  html: `<div class="relative flex items-center justify-center w-8 h-8">
    <div class="absolute inset-0 bg-pink-500/60 rounded-full animate-ping"></div>
    <div class="relative z-10 w-4 h-4 bg-pink-500 border-2 border-white rounded-full shadow-[0_0_25px_#FF003C]"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const originIcon = L.divIcon({
  className: 'cyber-origin',
  html: `<div class="relative flex items-center justify-center w-8 h-8">
    <div class="relative z-10 w-4 h-4 bg-white border-2 border-zinc-500 rounded-full shadow-[0_0_15px_#fff]"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

interface CyberMapProps {
  userPos: [number, number] | null;
  heading: number;
  origin: { coords: [number, number] } | null;
  destination: { coords: [number, number] } | null;
  routeCoords: [number, number][];
  isFollowing: boolean;
  onDragStart: () => void;
  is3D: boolean;
}

export default function CyberMap({ 
  userPos, heading, origin, destination, 
  routeCoords, isFollowing, onDragStart, is3D
}: CyberMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: userPos || [-23.5505, -46.6333],
      zoom: 18,
      zoomControl: false,
      attributionControl: false,
      rotate: true,
      touchZoom: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      preferCanvas: true 
    } as any);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 21,
      subdomains: 'abcd',
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('dragstart', () => {
      onDragStart();
    });

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (is3D) {
        mapRef.current.dragging.disable();
        mapRef.current.touchZoom.disable();
        mapRef.current.doubleClickZoom.disable();
        mapRef.current.scrollWheelZoom.enable(); 
    } else {
        mapRef.current.dragging.enable();
        mapRef.current.touchZoom.enable();
        mapRef.current.doubleClickZoom.enable();
        mapRef.current.scrollWheelZoom.enable();
    }
    mapRef.current.invalidateSize();
  }, [is3D]);

  useEffect(() => {
    if (!mapRef.current || !userPos) return;

    if (!carMarkerRef.current) {
      carMarkerRef.current = L.marker(userPos, { 
        icon: createCarIcon(), 
        zIndexOffset: 2000 
      }).addTo(mapRef.current);
    } else {
      carMarkerRef.current.setLatLng(userPos);
    }

    const el = document.getElementById('car-arrow');
    if (el) el.style.transform = `rotate(${heading}deg)`;

    if (isFollowing || is3D) {
      mapRef.current.setView(userPos, is3D ? 18 : 17, { 
        animate: true, 
        duration: is3D ? 0.3 : 0.8,
        easeLinearity: 0.2
      });
    }
  }, [userPos, heading, isFollowing, is3D]);

  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current) return;

    routeLayerRef.current.clearLayers();

    if (routeCoords.length > 0) {
      L.polyline(routeCoords, { 
        color: '#00F3FF', 
        weight: is3D ? 16 : 12, 
        opacity: 0.3, 
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeLayerRef.current);
      
      L.polyline(routeCoords, { 
        color: '#00F3FF', 
        weight: is3D ? 8 : 6, 
        opacity: 1,
        lineJoin: 'round' 
      }).addTo(routeLayerRef.current);
      
      L.polyline(routeCoords, { 
        color: '#FFFFFF', 
        weight: 3, 
        dashArray: '15, 30', 
        opacity: 0.9 
      }).addTo(routeLayerRef.current);

      if (!isFollowing && !is3D) {
         const bounds = L.latLngBounds(routeCoords);
         mapRef.current.fitBounds(bounds, { padding: [80, 80] });
      }
    }

    if (origin) L.marker(origin.coords, { icon: originIcon }).addTo(routeLayerRef.current);
    if (destination) L.marker(destination.coords, { icon: destIcon }).addTo(routeLayerRef.current);

  }, [routeCoords, origin, destination, is3D]);

  return (
    <div className={`absolute inset-0 bg-[#050b14] overflow-hidden transition-all duration-700 ${is3D ? 'perspective-[1000px]' : ''}`}>
      <style>{`
        .leaflet-tile-pane {
           filter: invert(100%) hue-rotate(180deg) brightness(3.5) contrast(1.2) saturate(1.5);
           transition: filter 0.5s;
           will-change: filter;
        }
        .leaflet-container {
           background: #050b14 !important;
        }
        .leaflet-marker-icon {
           transition: all 0.1s;
           will-change: transform;
        }
      `}</style>
      
      <div 
        className="w-full h-full absolute inset-0 transition-transform duration-500 ease-out will-change-transform"
        style={{
            transform: is3D 
                ? `rotateX(55deg) rotateZ(-${heading}deg) scale(1.5)` 
                : 'rotateX(0deg) rotateZ(0deg) scale(1)',
            transformOrigin: 'center 70%'
        }}
      >
          <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {is3D && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#050b14] via-transparent to-transparent pointer-events-none z-10 h-1/3 bottom-0 top-auto" />
      )}
    </div>
  );
}