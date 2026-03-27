import { Router } from 'express';
import { prisma } from '../db.js';
import { Server } from 'socket.io';
import { authenticateJWT, authApproved, AuthRequest } from '@auth';

export default(io: Server) => {
  const router = Router();

  router.post('/', authenticateJWT, authApproved, async (req: AuthRequest, res) => {
    const { lat, lng } = req.body;
    const userId = req.user?.id; // From your auth middleware

    try {
      console.log(`Received heartbeat from user ${userId} at location (${lat}, ${lng})`);
      const curLocation = await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: {lastLat: true, lastLng: true}
      });

      if(curLocation?.lastLat !== lat || curLocation?.lastLng !== lng) {
        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            lastLat: lat,
            lastLng: lng,
            lastSeen: new Date(), // Updates the "Freshness" timestamp
          },
        });

        console.log('sending updated user location to admin - '+JSON.stringify(user));
        io.to('admin').emit('userUpdated', user);
      }
      
      res.sendStatus(200);
    } catch (error) {
      console.error("Heartbeat failed:", error);
      res.status(500).json({ error: "Could not update location" });
    }
  });

  return router;
};
