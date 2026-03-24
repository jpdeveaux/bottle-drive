import * as L from 'leaflet';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, Tooltip } from 'react-leaflet';
import { User } from '@types';
import { socket, useSocket } from "@hooks/useSocket";
import { authFetch } from '@auth';
import { useAuth } from '@context/UseAuth';
import 'leaflet/dist/leaflet.css';

import { MapZoneHandler } from './MapZoneHandler';
import { AdminToolbar } from './AdminToolbar';
import { CreateZoneModal } from './CreateZoneModal';
import { BlurTextArea } from './Admin/BlurTextArea';

import { useTitle } from '@hooks/useTitle';
import { useAddresses } from '@hooks/useAddresses';
import { useHeartbeat } from '@hooks/useHeartbeat';
import { useZones } from '@hooks/useZones';
import { AddressStateSelect } from './AddressStateSelect';

const ICON_BASE: Partial<L.IconOptions> = {
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
};

const blueIcon = new L.Icon({
  ...ICON_BASE, 
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
});

const greenIcon = new L.Icon({
  ...ICON_BASE,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
});

const userIcon = new L.Icon({
  ...ICON_BASE,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
});

function Map() {
  const [interactionMode, setInteractionMode] = useState('idle'); // 'idle' or 'draw-zone'
  const [users, setUsers] = useState<User[]>([])
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [pendingZone, setPendingZone] = useState<{ ids: string[], bounds: L.LatLngBounds } | null>(null);
  const { authState } = useAuth();
  const { addresses, handleAddressState } = useAddresses();
  const { zones } = useZones();

  // Pulling from .env (with fallbacks if the env vars are missing)
  const centerLat = parseFloat(import.meta.env.VITE_MAP_CENTER_LAT || '44.6488');
  const centerLng = parseFloat(import.meta.env.VITE_MAP_CENTER_LNG || '-63.5752');
  const zoomLevel = parseInt(import.meta.env.VITE_MAP_ZOOM || '13');

  const getIcon = (status: string) => {
    return status === 'completed' ? greenIcon : blueIcon;
  };

  const handleSaveNewZone = async (name: string, color: string, bounds: L.LatLngBounds, ids: string[]) => {
    try {
      console.log("Saving new zone with bounds:", bounds, ", color: ", color, ", and IDs:", ids);
      await authFetch('/zones', {
        method: 'POST',
        body: JSON.stringify({
          name,
          color,
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          addressIds: ids
        })
      });
      
      // Close everything and go back to view mode
      console.log('.. zone saved.');
      setShowZoneModal(false);
      setPendingZone(null);
      setInteractionMode('idle');
    } catch (error) {
      alert("Error saving zone. Check console.");
      console.log("Zone save error:", error);
    }
  };

  useTitle(import.meta.env.VITE_TITLE);
  useSocket();
  useHeartbeat(authState.user);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await authFetch('/users');
        setUsers(await res.json());
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };

    // get user info only if this is admin.
    if (authState?.user?.role === 'admin') {
      fetchUsers();

      // Listen for real-time updates from the Controller
      socket.on('usersUpdated', (updatedUsers: User[]) => {
        setUsers(updatedUsers);
      });
    }

    return () => { 
      if(authState?.user?.role === 'admin') {
        socket.off('usersUpdated'); 
      }
      console.log('useEffect cleanup: socket listener removed'); };
  }, [authState]);

  const isWithinLastTwoMinutes = (lastSeen: Date | null) => {
    if (!lastSeen) return false;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSeen.getTime()) / 1000);
    return diffInSeconds < 120; // 120 seconds = 2 minutes
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="absolute top-5 right-5 z-[1000] flex flex-col gap-2">
        {authState?.user?.role === 'admin' && (
          <AdminToolbar mode={interactionMode} setMode={setInteractionMode} />
        )}
      </div>

      <MapContainer center={[centerLat, centerLng]} zoom={zoomLevel} scrollWheelZoom={true}
        className={`h-full w-full ${interactionMode === 'draw-zone' ? 'cursor-crosshair' : ''}`}>

        <MapZoneHandler
          interactionMode={interactionMode} 
          addresses={addresses}
          zones={zones}
          showZoneModal={showZoneModal}
          onSelectionComplete={(ids: string[], bounds: L.LatLngBounds) => {
            setPendingZone({ids, bounds});
            setShowZoneModal(true);
          }}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* The Modal: Hidden by default, shows up when pendingZone exists */}
        {showZoneModal && pendingZone && (
          <CreateZoneModal 
            selectedCount={pendingZone.ids.length}
            onClose={() => {
              setShowZoneModal(false);
              setPendingZone(null);
            }}
            onSave={(name, color) => {
              handleSaveNewZone(name, color, pendingZone.bounds, pendingZone.ids);
            }}
          />
        )}

        {addresses.map((addr) => (
          <Marker key={addr.id} position={[addr.lat, addr.lng]} icon={getIcon(addr.state)}>
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
                  <AddressStateSelect
                     addr={addr}
                     handler={handleAddressState}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Volunteer Notes
                  </label>
                  {authState?.user?.role === 'admin' 
                    ?
                      <BlurTextArea
                        className="w-full bg-blue-50 border border-blue-100 rounded-md p-2 text-sm text-blue-900 placeholder-blue-300 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-y h-20"
                        value={addr.notes}
                        onCommit={( notes ) => { handleAddressState(addr.id, { notes }); }}
                      />
                    : <div className="w-full">{addr.notes}</div>
                  }
                </div>
                
                <div className="mt-2 text-[10px] text-gray-400 text-right italic">
                  Saves automatically on blur
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {users
          .filter(u => isWithinLastTwoMinutes(new Date(u.lastSeen)))
          .map(u => (
            <Marker 
              key={u.id} 
              position={[u.lastLat, u.lastLng]} 
              icon={userIcon}
            >
              <Tooltip>{u.name}</Tooltip>
            </Marker>
        ))}

        {zones.map((zone) => (
          <Rectangle 
            key={zone.id}
            bounds={[[zone.south, zone.west], [zone.north, zone.east]]}
            pathOptions={{ 
              color: zone.color || '#3b82f6', 
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 10' // Makes it look like a 'territory' border
            }}
          >
            <Tooltip direction="center" opacity={0.7}>
              <span className="font-bold">{zone.name}</span>
            </Tooltip>
          </Rectangle>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;