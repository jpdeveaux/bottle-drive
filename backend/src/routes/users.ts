import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateJWT, AuthRequest } from '@auth';
import { Role } from '@shared/types.js';
import { Server } from 'socket.io';

interface UserParams {
  id: string;
  role: Role;
  isApproved: boolean;
}

export default(io: Server) => {
  const router = Router();

  // Middleware to ensure ONLY admins get past this point for ALL routes in this file
  router.use(authenticateJWT, (req: AuthRequest, res, next) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  });

  // GET /api/users
  router.get('/', async (req, res) => {
    const users = await prisma.user.findMany({ 
      include: {
        zones: true
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    });

    console.log(users);  
    res.json(users);
  });

  router.get('/active', async (req, res) => {
    const fiveMinutesAgo = new Date(Date.now() - 300 * 1000);

    const activeVolunteers = await prisma.user.findMany({
      where: {
        role: 'volunteer',
        lastSeen: {
          gte: fiveMinutesAgo
        }
      },
      select: {
        id: true,
        email: true, // or name
        lastLat: true,
        lastLng: true,
        lastSeen: true,
        name: true
      }
    });

    res.json(activeVolunteers);
  });

  // update a user role
  router.patch('/:id', async (req: AuthRequest & { params: UserParams }, res) => {
    const userId = req.params.id;
    const role = req.body.role;

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
        include: { zones: true }
      });

      io.to('admin').emit('userUpdated', updated);
      res.sendStatus(200);
    } 
    catch (e) { 
      console.log('User update failure: '+e);
      res.status(500).send(e); 
    }
  });

  // POST /api/users/bulk-add
  router.post('/bulk-add', async (req, res) => {
    const { emails } = req.body;
    const data = emails.map((email: string) => ({
      email,
      isApproved: true,
      role: 'volunteer'
    }));

    await prisma.user.createMany({ data, skipDuplicates: true });
    res.sendStatus(200);
  });

  // ASSIGN a user to zones (Many-to-Many)
  router.post('/:userId/zones', async (req, res) => {
    const { zoneIds } = req.body; // Expecting an array of IDs
    try {
      const userId = req.params.userId;
      console.log('updating zones for user '+userId);
      console.log(JSON.stringify(zoneIds));

      const update = await prisma.user.update({
        where: { id: userId },
        data: {
          zones: {
            set: zoneIds.map((id: string) => ({ id })) // 'set' replaces old assignments with new ones
          }
        },
        include: { zones: true }
      });

      console.log('updated user looks like this: '+JSON.stringify(update));
      io.to('admin').emit('userUpdated', update);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign zones" });
    }
  });

  router.patch('/:id/approve', async (req, res) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isApproved: true },
        include: { zones: true }
      });

      // Notify the specific user container
      const roomName = `user_${user.id}`;

      console.log(`sending account_approved signal to ${roomName}`);
      io.to(roomName).emit('account_approved', true);
      io.to('admin').emit('userUpdated', user);
      res.sendStatus(200);
    }
    catch(err) {
      console.error('Approve error: '+err);
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const userId = req.params.id;

      console.log('deleting user '+userId);
      await prisma.user.delete({
        where: { id: userId },
      });

      io.to('admin').emit('userDeleted', userId);
      res.sendStatus(200);
    }
    catch(err) {
      console.error('Could not delete user');
    }
  })

  return router;
};
