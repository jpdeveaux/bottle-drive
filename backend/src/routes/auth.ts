import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateJWT, AuthRequest, verifyGoogleToken, generateLocalToken } from '@auth';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '@types';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me';

export default (io: Server) => {
  const router = Router();
  
  // connect this user to their own "room".
  io.on('connection', (socket) => {
    console.log('new connection');
    const userId = socket.handshake.query.userId;
    const token = socket.handshake.auth.token;
            
    if (userId) {
      console.log(' - setting up room');
      const roomName = `user_${userId}`;
      socket.join(roomName);
      console.log(` - user ${userId} joined room: ${roomName}`);

      // // time out room after 10 minutes of inactivity
      let t = setTimeout(() => {
        console.log('   *** approval window expired for user '+userId);
        io.to(roomName).emit("approval_timeout");
      }, 10*60000);

      socket.on('disconnect', () => {
        if (t) clearTimeout(t);
        console.log(' ==> "room" user disconnected');
      });
    }
    else {
      // validate token.
      console.log('validating token '+token);
      jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
        if (err) {
          console.log('disconnecting - invalid token');
          socket.disconnect();
        }
        else
        {
          console.log('token verified -- '+JSON.stringify(decoded));
          socket.join('verified');
          console.log(' -> joined "verified" room');

          if(decoded.role === 'admin') {
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
            }}
          );

          console.log('sending updated user location to admin - '+JSON.stringify(updatedUser));
          io.to('admin').emit('userUpdated', updatedUser);

          socket.on('disconnect', () => {
            console.log(' ==> standard socket disconnect.');
          });
        }
      });
    }
  });

  router.get('/me', authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.id },
        include: { zones: true }
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      // Generate a new token for this user
      const token = generateLocalToken(user);

      res.json({ 
        token, 
        user: { id: user.id, role: user.role, name: user.name, isApproved: user.isApproved },
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post('/google', async (req, res) => {
    const { idToken } = req.body;

    const payload = await verifyGoogleToken(idToken);
    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Invalid Google Token" });
    }

    try {
      // Find or Create the user
      let user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { zones: true }
      }) as User;

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: payload.email,
            name: payload.name,
            googleId: payload.sub, // The unique Google ID
            role: 'volunteer',      // Default role
            isApproved: (process.env.AUTO_APPROVE_NEW_USERS === 'true')
          }
        });
      } else if (!user.googleId) {
        // Update the placeholder from the seed script with their real Google ID
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub, name: payload.name },
          include: { zones: true }
        });
      }
     
      const token = generateLocalToken(user);
      
      res.json({ 
        token, 
        user: { id: user.id, role: user.role, name: user.name, isApproved: user.isApproved } 
      });
    } catch (error) {
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  return router;
};