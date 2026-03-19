import { useState, useEffect } from "react";
import { authFetch } from "@auth";
import { useAuth } from "@context/UseAuth";
import { socket } from "@hooks/useSocket";
import type { Zone } from "@shared/types";

export function useZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const { authState } = useAuth();
 
  useEffect(() => {
    const loadZones = async () => {
      const res = await authFetch('/zones');
      if (res.ok) setZones(await res.json());
    };

    if(authState.user?.role === 'admin')   loadZones();
  }, [authState]);
  
  useEffect(() => {
    const handleNewZone = (zone: Zone) => {
      // if this is an administrator, make sure the rectangle is there.
      setZones(current => [...current, zone]);
    }

    if(authState.user?.role === 'admin') {
      socket.on('zoneCreated', handleNewZone);

      return (() => {
        socket.off('zoneCreated');
        console.log('useEffect cleanup - zoneCreated');
      })
    }
  }, [authState]);

  useEffect(() => {
    // Listen for real-time updates from the Controller.
    if(authState.user?.role === 'admin') {
      socket.on('zoneRemoved', (zoneId: string) => {
        console.log('Removing zone: ', zoneId);
        setZones((currentZones) => {
          return currentZones.filter(z => z.id != zoneId);
        });
      });

      return () => { 
        socket.off('zoneRemoved');
        console.log('useEffect cleanup: zoneRemoved removed'); 
      };
    }
  }, [authState]);

  return { zones };
};