import { Application } from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { prisma } from './db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me';

export const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

export function create(app: Application): { server: ReturnType<typeof createServer>, io: Server } {
  const server = createServer(app);

  const io = new Server(server, {
    cors: corsOptions
  });

  // connect this user to their own "room".
  io.on('connection', (socket) => {
    console.log('==> Incoming connection');
    const userId = socket.handshake.query.userId;
    const token = socket.handshake.auth.token;

    if (userId) {
      console.log(' - setting up room');
      const roomName = `user_${userId}`;
      socket.join(roomName);
      console.log(` - user ${userId} joined room: ${roomName}`);

      // // time out room after 10 minutes of inactivity
      let t = setTimeout(() => {
        console.log('   *** approval window expired for user ' + userId);
        io.to(roomName).emit("approval_timeout");
      }, 10 * 60000);

      socket.on('disconnect', () => {
        if (t) clearTimeout(t);
        console.log(' ==> "room" user disconnected');
      });
    }
    else {
      // validate token.
      console.log('validating token ' + token);
      jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
        if (err) {
          console.log('disconnecting - invalid token');
          socket.disconnect();
        }
        else {
          console.log('token verified -- ' + JSON.stringify(decoded));
          socket.join('verified');
          console.log(' -> joined "verified" room');

          if (decoded.role === 'admin') {
            socket.join('admin');
            console.log(' -> admin user, joined "admin" room');
          }

          // update the user's "last seen" state
          const updatedUser = await prisma.user.update({
            where: { id: decoded.id },
            data: {
              lastSeen: new Date()
            },
            select: {
              id: true,
              name: true,
              lastLat: true,
              lastLng: true,
              lastSeen: true
            }
          });

          console.log('sending updated user location to admin - ' + JSON.stringify(updatedUser));
          io.to('admin').emit('userUpdated', updatedUser);

          socket.on('disconnect', () => {
            console.log(' ==> standard socket disconnect.');
          });
        }
      });
    }
  });

  return { server, io }
};