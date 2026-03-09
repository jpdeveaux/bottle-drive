import { Router } from 'express';
import { prisma } from '../db.js';
import { verifyGoogleToken, generateLocalToken } from '../middleware/auth.js';

const router = Router();

router.post('/google', async (req, res) => {
  const { idToken } = req.body;

  const payload = await verifyGoogleToken(idToken);
  if (!payload || !payload.email) {
    return res.status(401).json({ error: "Invalid Google Token" });
  }

  try {
    // 1. Find or Create the user
    // Note: If the email matches your .env ADMIN email, 
    // the seed script already created them with the ADMIN role.
    let user = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          googleId: payload.sub, // The unique Google ID
          role: 'volunteer',      // Default role
          isApproved: false
        }
      });
    } else if (!user.googleId) {
      // Update the placeholder from the seed script with their real Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, name: payload.name }
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({ error: "Access pending admin approval." });
    }
    
    // 2. Generate our OWN local JWT for the frontend to use
    const token = generateLocalToken(user);

    res.json({ 
      token, 
      user: { id: user.id, email: user.email, role: user.role, name: user.name } 
    });
  } catch (error) {
    res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;