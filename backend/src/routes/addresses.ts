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
    console.log('Fetched addresses: '+JSON.stringify(addresses));
    res.json(addresses);
  });

  router.patch('/:id/location', authenticateJWT, async (req: AuthRequest & { params: IDParams }, res) => {
    // admin only for this one
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const actingUserId = req.user?.id; 
    const street = req.body.street;
    const addressId = req.params.id;
    let newLat = 0, newLng = 0;

    console.log('Updating location to: '+street); 

    try {
      const address = await prisma.address.findUnique({ where: { id: addressId } });

      // if coords were not set, then try to re-generate them 
      if(address) {
        if(!address.lat || !address.lng) {
          const geo = await geocodeAddress(street);

          if (!geo || !geo.lat || !geo.lng) {
            return res.status(400).json({ error: "Could not find that location. Please be more specific." });
          }

          newLat = geo.lat;
          newLng = geo.lng;
        }
        else {
          console.log('Coordinates not updated, retaining '+address.lat+', '+address.lng);
          newLat = address.lat;
          newLng = address.lng;
        }

        const updated = await prisma.address.update({
          where: { id: addressId },
          data: { 
            street, lat: newLat, lng: newLng,
            updater: { connect: { id: actingUserId } } 
          },
          include: { updater: { select: { name: true } } }
        });

        io.emit('addressUpdated', updated);
        res.json(updated);
      }
      else {
        res.status(401).json('Address not found');
      }
    } catch (e) { 
      console.log('Update failure: '+e);
      res.status(500).send(e); 
    }
  });

  // Volunteer: Update status/notes
  router.patch('/:id/status', authenticateJWT, async (req: AuthRequest & { params: IDParams }, res) => {
    const { status, notes, reGeocode } = req.body;
    const actingUserId = req.user?.id; 
    console.log('Status ' + status+' -- notes: '+notes+' -- re-geocode: '+reGeocode);

    if (!actingUserId) {
      return res.status(401).json({ error: "User ID missing from token" });
    }

    console.log(actingUserId);

    try {
      const updated = await prisma.address.update({
        where: { id: req.params.id },
        data: { 
          status, notes, 
          ... (reGeocode && { lat: 0, lng: 0 }),
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

  // Delete an address
  router.delete('/:id', authenticateJWT, async (req: AuthRequest & { params: IDParams }, res) => {
    try {
      await prisma.address.delete({ where: { id: req.params.id } });
      res.json({ message: "Address deleted successfully" });
    } catch (e) {
      console.log('Delete failure: '+e);
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
          street: street,
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