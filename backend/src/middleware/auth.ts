import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '@types';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me';

export interface IDParams {
  id: string;
}

export const verifyGoogleToken = async (idToken: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload(); // Contains email, name, sub (Google ID)
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

export const generateLocalToken = (user: User) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, isApproved: user.isApproved, zones: user.zones },
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
      if (!err) {
        req.user = decoded;
      } 
    });
  }

  next();
};

export const verifyCaptcha = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // if there is no secret key set, or the user is already approved, skip captcha verification
  const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
  if (!SECRET_KEY || req.user?.isApproved) {
    next();
  }
  else {
    const { recaptchaToken } = req.body;
    if (!recaptchaToken) {      
      return res.status(400).json({ error: "reCAPTCHA token is required" });
    }

    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${recaptchaToken}`;

    try {
      const response = await fetch(verificationUrl, {
        method: 'POST'
      });

      const result = await response.json();
      const { success, score } = result;
      const isHuman = success && score >= 0.5;

      if (!isHuman) {
        return res.status(403).json({ error: "Bot detection triggered." });
      }

      next();
    } catch (error) {
      console.error("Captcha verification failed:", error);
      return res.status(500).json({ error: "Captcha verification failed" });
    }
  }
};

export const authValidSession = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  next();
};

export const authApproved = (req: AuthRequest, res: Response, next: NextFunction) => {
  if(!req.user?.isApproved) {
    return res.status(401).json({ error: 'User not authorized'});
  }
  next();
};

export const authAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};