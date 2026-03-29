import { useEffect } from 'react';
import { Address, MapBounds } from '@types';

interface MapControllerProps {
  addresses: Address[];
  addressesInitialized: boolean;
  setMapBounds: (bounds: MapBounds) => void;  
}

// Pulling from .env (with fallbacks if the env vars are missing)
const center: L.LatLngTuple = [parseFloat(import.meta.env.VITE_MAP_CENTER_LAT || '44.6488'), parseFloat(import.meta.env.VITE_MAP_CENTER_LNG || '-63.5752')];
const zoom = parseInt(import.meta.env.VITE_MAP_ZOOM || '13');

export const MapInit = ({ addresses, addressesInitialized, setMapBounds }: MapControllerProps) => {
  useEffect(() => {
    if(addressesInitialized) {
      if(addresses.length > 0) {
        const bounds: L.LatLngTuple[] = addresses.map(a => [a.lat, a.lng]);
        setMapBounds({ bounds });
      } else {
        setMapBounds({ center, zoom });
      }
    }
  }, [addresses, addressesInitialized, setMapBounds]);

  return null;
};