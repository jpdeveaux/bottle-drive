import { Router } from 'express';
import { prisma } from '../db.js';
import { ZONE_NAME_AND_USERS, geocodeAddress, checkForZone } from '../geocoder.js';
import { Server } from 'socket.io';

export default (io: Server) => {
  const router = Router();

  // Public: Submit new address (No Auth Required)
  router.post('/submit', async (req, res) => {
    const { street, notes } = req.body;
    let geo = await geocodeAddress(street);

    if (!geo || !geo.lat || !geo.lng) {
      console.log('Geocoding failed for address: '+street);
      geo = null;
    }

    try {
      const newAddress = await prisma.address.create({
        data: {
          street: street,
          lat: geo?.lat || 0,
          lng: geo?.lng || 0,
          notes: notes || "",
          state: "unvisited",
          zoneId: geo && await checkForZone(geo)
        },
        include: ZONE_NAME_AND_USERS
      });

      io.to('verified').emit('addressUpdated', newAddress);
      console.log('Address added: ', newAddress);

      res.json({ success: true });
    } catch (err) {
      console.log('Error: %s', err);
      res.status(500).json({ error: "Database error" });
    }
  });

  return router;
};