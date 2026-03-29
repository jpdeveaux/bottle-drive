// useHeartbeat.ts
import { useEffect } from 'react';
import { User } from '@types';
import { authFetch } from '@auth';

export const useHeartbeat = (user: User | null, setActiveUsers: React.Dispatch<React.SetStateAction<User[]>>) => {
  useEffect(() => {
    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          const me = await authFetch('/heartbeat', {
            method: 'POST',
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });

          if(user?.role !== 'admin') {
            const u = await me.json();
            setActiveUsers([u]);
          }
        },
        (err) => console.error("Location blocked", err),
        { enableHighAccuracy: true }
      );
    };

    // Initial ping and then every 10 seconds
    sendLocation();
    const interval = setInterval(sendLocation, 10000);

    return () => clearInterval(interval);
  }, [user, setActiveUsers]);
};