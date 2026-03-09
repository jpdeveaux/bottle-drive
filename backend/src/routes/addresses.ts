import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { geocodeAddress } from '../geocoder.js';
import type { IDParams } from '../middleware/auth.js';
import { Server } from 'socket.io';

export default (io: Server) => {
  const router = Router();

  // Volunteer: Get all pins
  router.get('/', authenticateJWT, async (req, res) => {
    const addresses = await prisma.address.findMany();
    res.json(addresses);
  });

  // Volunteer: Update status/notes
  router.patch('/:id', authenticateJWT, async (req: AuthRequest & { params: IDParams }, res) => {
    const { status, notes } = req.body;
    const actingUserId = req.user?.id; 
    console.log('Status ' + status+' -- notes: '+notes);

    if (!actingUserId) {
      return res.status(401).json({ error: "User ID missing from token" });
    }

    try {
      const updated = await prisma.address.update({
        where: { id: req.params.id },
        data: { 
          status, notes, 
          updater: { connect: { id: actingUserId } } 
        },
        include: { updater: { select: { name: true } } }
      });
      
      io.emit('addressUpdated', updated);
      res.json(updated);
    } catch (e) { 
      console.log('Update failure: '+e);
      res.status(500).send(e); 
    }
  });

  // Public: Submit new address (No Auth Required)
  router.post('/submit', async (req, res) => {
    const { street, notes } = req.body;
    const geo = await geocodeAddress(street);

    if (!geo || !geo.lat || !geo.lng) {
      return res.status(400).json({ error: "Could not find that location. Please be more specific." });
    }

    try {
      const newAddress = await prisma.address.create({
        data: {
          street: geo.formattedAddress || street,
          lat: geo.lat,
          lng: geo.lng,
          notes: notes || "",
          status: "unvisited"
        }
      });

      io.emit('addressUpdated', newAddress);

      res.json({ success: true, message: "Pickup requested!" });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  return router;
};