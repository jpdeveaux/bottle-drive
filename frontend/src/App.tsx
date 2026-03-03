import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { RefreshButton } from './components/RefreshButton';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon not showing up in React builds
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Use your shared types here!
// @ts-expect-error - This is a known issue with Vite and TypeScript path aliases
import type { Address } from '@shared/types';

function App() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false); // New state to show busy status

  // Pulling from .env (with fallbacks if the env vars are missing)
  const centerLat = parseFloat(import.meta.env.VITE_MAP_CENTER_LAT || '44.6488');
  const centerLng = parseFloat(import.meta.env.VITE_MAP_CENTER_LNG || '-63.5752');
  const zoomLevel = parseInt(import.meta.env.VITE_MAP_ZOOM || '13');

// 1. Move the logic into a reusable function
  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/addresses');
      const data = await res.json();
      setAddresses(data);
      console.log("Fetched addresses:"+data);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Use the function on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <RefreshButton 
          onRefresh={fetchAddresses} 
          isLoading={loading} 
        />
      <MapContainer center={[centerLat, centerLng]} zoom={zoomLevel} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {addresses.map((addr) => (
          <Marker key={addr.id} position={[addr.lat, addr.lng]}>
            <Popup>
              Status: {addr.status} <br />
              ID: {addr.id}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;