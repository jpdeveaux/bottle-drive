import { Router } from 'express';
import { prisma } from '../db.js';
import { User } from '@types';
import { authenticateJWT, authValidSession, AuthRequest, verifyGoogleToken, generateLocalToken } from '@auth';

const router = Router();

router.get('/me', authenticateJWT, authValidSession, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { zones: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Generate a new token for this user
    const token = generateLocalToken(user);

    res.json({ 
      token, 
      user: { id: user.id, role: user.role, name: user.name, isApproved: user.isApproved },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post('/google', async (req, res) => {
  const { idToken } = req.body;

  const payload = await verifyGoogleToken(idToken);
  if (!payload || !payload.email) {
    return res.status(401).json({ error: "Invalid Google Token" });
  }

  try {
    // Find or Create the user
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { zones: true }
    }) as User;

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          googleId: payload.sub, // The unique Google ID
          role: 'volunteer',      // Default role
          isApproved: (process.env.AUTO_APPROVE_NEW_USERS === 'true')
        }
      });
    } else if (!user.googleId) {
      // Update the placeholder from the seed script with their real Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, name: payload.name },
        include: { zones: true }
      });
    }
    
    const token = generateLocalToken(user);
    
    res.json({ 
      token, 
      user: { id: user.id, role: user.role, name: user.name, isApproved: user.isApproved } 
    });
  } catch (error) {
    res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;