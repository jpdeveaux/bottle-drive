import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { RefreshButton } from './RefreshButton';
import type { Address } from '@shared/types';
import { AddressStatus } from '@shared/types';
import { io } from "socket.io-client";
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { authFetch } from '../api';
import { useTitle } from '../hooks/useTitle';

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

// Connect to the backend
const socket = io(import.meta.env.VITE_API_URL, { path: '/socket.io/' });

socket.on('connect', () => {
    console.log('Connected to socket server');
});

function Map() {
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
      const res = await authFetch('/addresses');
      const data = await res.json();
      setAddresses(data);
      console.log("Fetched addresses:"+data);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useTitle(import.meta.env.VITE_TITLE);

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
      await authFetch(`/addresses/${id}/status`, {
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
      await authFetch(`/addresses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes }),
      });
    } catch (err) {
      window.alert()
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
              <div className="min-w-[200px] p-1 font-sans text-gray-800">
                <div className="mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Address</h3>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {addr.street}
                  </p>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Status
                  </label>
                  <select 
                    value={addr.status} 
                    onChange={(e) => handleStatusChange(addr.id, e.target.value)}
                    className="cap w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    {Object.values(AddressStatus).map((status) => (
                      <option value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Volunteer Notes
                  </label>
                  <textarea
                    className="w-full bg-blue-50 border border-blue-100 rounded-md p-2 text-sm text-blue-900 placeholder-blue-300 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none h-20"
                    onBlur={(e) => {
                      if (e.target.value !== (addr.notes || '')) {
                        handleNoteChange(addr.id, e.target.value);
                      }
                    }}
                  >
                    {addr.notes
                  }</textarea>
                </div>
                
                <div className="mt-2 text-[10px] text-gray-400 text-right italic">
                  Saves automatically on blur
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;