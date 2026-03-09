import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { Role } from '../../../shared/types.js';

interface UserParams {
  id: string;
  role: Role;
  isApproved: boolean;
}

const router = Router();

// Middleware to ensure ONLY admins get past this point for ALL routes in this file
router.use(authenticateJWT, (req: AuthRequest, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users);
});

// GET /api/admin/users
router.patch('/users/:id', async (req: AuthRequest & { params: UserParams }, res) => {
  const userId = req.params.id;
  const role = req.body.role;
  const isApproved = req.body.isApproved;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { 
        role, isApproved
      }
    });
    res.json(updated);
  } catch (e) { 
    console.log('User update failure: '+e);
    res.status(500).send(e); 
  }
});

// POST /api/admin/users/bulk-add
router.post('/users/bulk-add', async (req, res) => {
  const { emails } = req.body;
  const data = emails.map((email: string) => ({
    email,
    isApproved: true,
    role: 'volunteer'
  }));

  await prisma.user.createMany({ data, skipDuplicates: true });
  res.status(200).send();
});

export default router;