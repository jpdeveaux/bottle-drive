import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateJWT, authApproved, authAdmin } from '@auth';
import { Server } from 'socket.io';

export default(io: Server) => {
  const router = Router();

  // Middleware to ensure ONLY admins get past this point for ALL routes in this file
  router.use(authenticateJWT, authApproved, authAdmin);

  router.get('/', async (req, res) => { 
      const zones = await prisma.zone.findMany({
          orderBy: { name: 'asc' }
      });
      res.json(zones);
  });    

  router.post('/', async (req, res) => {
    const { name, color, north, south, east, west, addressIds } = req.body;
    console.log('zone post called, IDs: '+addressIds);

    try {
      const newZone = await prisma.zone.create({
          data: {
              name,
              color,
              north,
              south,
              east,
              west,
              addresses: {
                connect: addressIds.map((id: string) => ({ id }))
              }
          }
      });

      const addressesInZone = await prisma.address.findMany({
        where: { zoneId: newZone.id },
        include: { zone: true }
      });

      console.log(' - notifying admin of new zone');
      io.to('admin').emit('zoneCreated', newZone);
      console.log(' --> zoneCreated event sent to admin');
      if(addressesInZone.length > 0) {
        addressesInZone.forEach((address) => { io.to('verified').emit('addressUpdated', address); });
        console.log(' --> address update send to verified for '+addressesInZone.length+' addresses');
      }
      else {
        console.log(' --> no addresses in this zone');
      }

      console.log('zone created.')
      res.sendStatus(201);
    } catch (error) {
      res.status(500).json({ error: "Failed to create zone" });
    }
  });

  // DELETE a zone
  router.delete('/:id', async (req, res) => {
    try {
      await prisma.zone.delete({
        where: { id: req.params.id }
      });

      console.log('deleted zone '+req.params.id);
      io.to('admin').emit('zoneRemoved', req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete zone" });
    }
  });

  return router;
};
