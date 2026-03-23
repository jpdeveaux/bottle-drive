import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateJWT, authApproved, authAdmin, AuthRequest } from '@auth';
import { geocodeAddress, checkForZone, ZONE_NAME_AND_USERS } from '../geocoder.js';
import type { IDParams } from '@auth';
import { Server } from 'socket.io';

export default (io: Server) => {
  const router = Router();

  // all calls here use authenticateJWT and authApproved.  if we get through it, we're OK.
  router.use(authenticateJWT, authApproved);

  // return all addresses
  router.get('/', async (req: AuthRequest, res) => {
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

    console.log('Fetched '+(addresses?.length || '0')+' addresses');
    res.json(addresses);
  });

  router.patch('/:id/location', authAdmin, async (req: AuthRequest & { params: IDParams }, res) => {
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
  router.patch('/:id/status', async (req: AuthRequest & { params: IDParams }, res) => {
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
  router.delete('/:id', authAdmin, async (req: AuthRequest & { params: IDParams }, res) => {
    try {
      await prisma.address.delete({ where: { id: req.params.id } });
      io.to('verified').emit('addressDeleted', req.params.id);
      res.json({ message: "Address deleted successfully" });
    } catch (e) {
      console.log('Delete failure: '+e);
      res.status(500).send(e);
    }
  });

  return router;
};