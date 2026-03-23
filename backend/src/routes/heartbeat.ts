import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateJWT, authApproved, AuthRequest } from '@auth';

const router = Router();

router.post('/', authenticateJWT, authApproved, async (req: AuthRequest, res) => {
  const { lat, lng } = req.body;
  const userId = req.user?.id; // From your auth middleware

  try {
    console.log(`Received heartbeat from user ${userId} at location (${lat}, ${lng})`);
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastSeen: new Date(), // Updates the "Freshness" timestamp
      },
    });
    
    res.sendStatus(200);
  } catch (error) {
    console.error("Heartbeat failed:", error);
    res.status(500).json({ error: "Could not update location" });
  }
});

export default router;