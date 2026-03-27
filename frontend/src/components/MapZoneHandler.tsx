import { useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { useState } from 'react';
import { Zone } from "@types";

interface MapZoneHandlerProps {
  interactionMode: string;
  onSelectionComplete: (ids: string[], bounds: L.LatLngBounds) => void;
  addresses: { id: string; lat: number; lng: number }[];
  showZoneModal: boolean;
  zones: Zone[];
}

// 1. This component "lives" inside the MapContainer to access Leaflet events
export const MapZoneHandler = ({ interactionMode, onSelectionComplete, addresses, zones, showZoneModal } : MapZoneHandlerProps) => {
  const [startPos, setStartPos] = useState<L.LatLng | null>(null);
  const [tempRect, setTempRect] = useState<L.Rectangle | null>(null);

  useMapEvents({
    mousedown(e) {
      if (interactionMode !== 'draw-zone' || showZoneModal) return;
      e.target.dragging.disable();
      setStartPos(e.latlng);
    },

    mousemove(e) {
      if (!startPos || interactionMode !== 'draw-zone' || showZoneModal) return;
      
      const bounds = L.latLngBounds(startPos, e.latlng);
      
      // Real-time Collision Check
      const isColliding = zones.some(z => {
        const existingBounds = L.latLngBounds([z.south, z.west], [z.north, z.east]);
        return bounds.intersects(existingBounds);
      });

      const color = isColliding ? "#ef4444" : "#3b82f6"; // Red if colliding, Blue otherwise
      
      if (tempRect) {
        tempRect.setBounds(bounds).setStyle({ color: color });
      } else {
        const newRect = L.rectangle(bounds, { color: color, weight: 1, fillOpacity: 0.2 }).addTo(e.target);
        setTempRect(newRect);
      }
    },

    mouseup(e) {
      if (!startPos || !tempRect) return;

      try {
        const finalBounds = tempRect.getBounds();

        const isOverlapping = zones.some(existingZone => {
          const existingBounds = L.latLngBounds(
            [existingZone.south, existingZone.west], 
            [existingZone.north, existingZone.east]
          );
          // Leaflet's built-in intersection check
          return finalBounds.intersects(existingBounds);
        });
    
        if (isOverlapping) {
          alert("Cannot create overlapping zones!");
          return;
        }

        const foundIds = addresses
          .filter(a => a.lat && a.lng && finalBounds.contains([a.lat, a.lng]))
          .map(a => a.id);

        // Pass the data back up to the main component
        onSelectionComplete(foundIds, finalBounds);
      }
      finally {
        // Cleanup
        tempRect.remove();
        setTempRect(null);
        setStartPos(null);
        e.target.dragging.enable();
      }
    }
  });

  return null; // This component doesn't render HTML, it just handles logic
};