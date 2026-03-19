import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '@shared/types.js';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me';

export interface IDParams {
  id: string;
}

export const verifyGoogleToken = async (idToken: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.VITE_GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload(); // Contains email, name, sub (Google ID)
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

export const generateLocalToken = (user: User) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, isApproved: user.isApproved },
    JWT_SECRET,
    { expiresIn: '1d' } // Volunteers don't want to log in every hour
  );
};

// Extend the Express Request type to include our user payload
export interface AuthRequest extends Request {
  user?: User
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: "Session expired or invalid" });
      }
      req.user = decoded;

      // make sure user is approved.
      if(!req.user?.isApproved) {
        return res.status(401).json({ error: 'User not authorized'});
      }

      next();
    });
  } else {
    res.status(401).json({ error: "Authorization header missing" });
  }
};

export const authenticateJWT_newUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: "Session expired or invalid" });
      }
      req.user = decoded;

      next();
    });
  } else {
    res.status(401).json({ error: "Authorization header missing" });
  }
};