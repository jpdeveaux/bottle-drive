import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { RefreshButton } from './components/RefreshButton';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { io } from "socket.io-client";

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Use your shared types here!
import type { Address } from '@shared/types';

// Connect to the backend
const BACKEND = import.meta.env.VITE_API_URL;
const socket = io(BACKEND, { path: '/socket.io/' });

socket.on('connect', () => {
    console.log('Connected to socket server');
});

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
      const res = await fetch(`${BACKEND}/api/addresses`);
      const data = await res.json();
      setAddresses(data);
      console.log("Fetched addresses:"+data);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();

   // Listen for real-time updates from the Controller
    socket.on('addressUpdated', (updatedAddress: Address) => {
      setAddresses((current) => {
          const exists = current.find(a => a.id === updatedAddress.id);
          if (exists) {
            return current.map(addr => addr.id === updatedAddress.id ? updatedAddress : addr);
          }
          // If it's a new submission from the public form, add it to the map!
          return [...current, updatedAddress];
        });
    });
        
    return () => { 
      socket.off('addressUpdated');  console.log('useEffect cleanup: socket listener removed'); };
  }, []);

  const getIcon = (status: string) => {
    return status === 'completed' ? greenIcon : blueIcon;
  };

  // Socket.io handles the UI refresh
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`${BACKEND}/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleNoteChange = async (id: string, newNotes: string) => {
    try {
      await fetch(`${BACKEND}/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes }),
      });
    } catch (err) {
      console.error("Note update failed", err);
    }
  };

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
          <Marker key={addr.id} position={[addr.lat, addr.lng]} icon={getIcon(addr.status)}>
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <strong>Address: {addr.street}</strong>
                <div className="statusBox">
                  <label>Status:</label>
                  <select 
                    value={addr.status} 
                    onChange={(e) => handleStatusChange(addr.id, e.target.value)}
                  >
                    <option value="unvisited">Unvisited</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <label>Notes:</label>
                <div
                  className="editableNotes"
                  contentEditable="plaintext-only"
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleNoteChange(addr.id, e.currentTarget.innerText || "")}
                >
                  {addr.notes}
                </div>                
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;