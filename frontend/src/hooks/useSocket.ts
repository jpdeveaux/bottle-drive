// socket.ts
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from '@context/UseAuth';

export const socket: Socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false
});

export const useSocket = (() => {
  const { authState } = useAuth();

  useEffect(() => {
    if(authState.token) {
      console.log('** session socket setup');
      socket.auth = { token: authState.token, user: authState.user };
      socket.connect();

      return(() => {
        console.log('** session socket teardown');
        socket.disconnect();
      });
    }
    else {
      console.log('socket not built at this time');
    }
  }, [authState]);
});