import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateJWT, AuthRequest } from '@auth';
import { geocodeAddress, Coords } from '../geocoder.js';
import type { IDParams } from '@auth';
import { Server } from 'socket.io';

// this adds zone/user info to the address being returned
const ZONE_NAME_AND_USERS = { 
  zone: { 
    select: { 
      name: true, 
      users: { 
        select: { 
          id: true    // include user IDs linked to this address.
        }
      }
    }
  }
};

export default (io: Server) => {
  const router = Router();

  const checkForZone = async (addr: Coords): Promise<string|null> => {
    const zones = await prisma.zone.findMany();
    let assignedZoneId = null;

    for (const zone of zones) {
      if (addr.lat <= (zone.north || 0) && addr.lat >= (zone.south || 0) && addr.lng <= (zone.east || 0) && addr.lng >= (zone.west || 0) ) {
        assignedZoneId = zone.id;
        break;
      }
    } 

    return assignedZoneId;
  };

  // Volunteer: Get all pins
  router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
    const currentUser = req.user;
    if(!currentUser) return;
    
    // 1. Extract the IDs of the zones assigned to the volunteer (might not be assigned to any zones)
    const assignedZoneIds = currentUser.zones?.map(z => z.id);

    // 2. Build the conditional 'where' clause
    const addresses = await prisma.address.findMany({
      where: {
        ...(currentUser.role === 'admin' 
          ? {} // If admin, no filters applied (returns all)
          : {
              OR: [
                { zoneId: { in: assignedZoneIds } }, // Addresses in their zones
                { zoneId: null }                     // Addresses not yet assigned
              ]
            }
        )
      },
      include: {
        zone: true // Include zone details for the map markers/colors
      },
      orderBy: [{ zone: { name: 'asc' }}, { street: 'asc' }]
    });

    console.log('Fetched addresses');
    res.json(addresses);
  });

  router.patch('/:id/location', authenticateJWT, async (req: AuthRequest & { params: IDParams }, res) => {
    // admin only for this one
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const actingUserId = req.user?.id; 
    const street = req.body.street;
    const addressId = req.params.id;
    let newLat = 0, newLng = 0, zoneId = null;

    console.log('Updating location to: '+street); 

    try {
      const address = await prisma.address.findUnique({ where: { id: addressId } });

      // if coords were not set, then try to re-generate them 
      if(address) {
        const geo = await geocodeAddress(street);

        if (!geo || !geo.lat || !geo.lng) {
          return res.status(400).json({ error: "Could not find that location. Please be more specific." });
        }

        newLat = geo.lat;
        newLng = geo.lng;
        zoneId = await checkForZone(geo);

        // update the address.  Set new coordinates if there were any, and link updater / zone according to the relation.
        const updated = await prisma.address.update({
          where: { id: addressId },
          data: { 
            street, lat: newLat, lng: newLng, 
            updater: { connect: { id: actingUserId } } ,
            zone: zoneId == null ? { disconnect: true } : { connect: { id: zoneId }}
          },
          include: ZONE_NAME_AND_USERS
        });

        io.to('verified').emit('addressUpdated', updated);
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
    const { status, notes } = req.body;
    const actingUserId = req.user?.id; 
    console.log('Status (%s) - notes (%s)', status, notes);

    if (!actingUserId) {
      return res.status(401).json({ error: "User ID missing from token" });
    }

    console.log(actingUserId);

    try {
      const updated = await prisma.address.update({
        where: { id: req.params.id },
        data: { 
          status, notes, 
          updater: { connect: { id: actingUserId } } 
        },
        include: ZONE_NAME_AND_USERS
      });
      
      io.to('verified').emit('addressUpdated', updated);
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
      io.to('verified').emit('addressDeleted', req.params.id);
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
          status: "unvisited",
          zoneId: await checkForZone(geo)
        },
        include: ZONE_NAME_AND_USERS
      });

      io.to('verified').emit('addressUpdated', newAddress);
      console.log('Address added: ', newAddress);

      res.json({ success: true, message: "Pickup requested!" });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  return router;
};