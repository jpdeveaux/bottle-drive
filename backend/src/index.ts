import express from 'express';
import { Server } from 'socket.io';
import { prisma } from './db.js';
import { createServer } from 'http';
import cors from 'cors';
import { geocodeAddress } from './geocoder.js';
import { verifyGoogleToken, generateLocalToken, authenticateJWT, AuthRequest } from './auth.js';

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

const app = express();
app.use(cors(corsOptions));

const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

app.use(express.json());

interface AddressParams {
  id: string;
}

app.get("/api/health", async (_req, res) => {
  try {
    const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW()`;
    res.json({ status: "ok", dbTime: result[0].now });
  } catch {
    res.status(500).json({ error: "DB connection failed" });
  }
});

app.get('/api/addresses', authenticateJWT, async (req: AuthRequest, res) => {
  const addresses = await prisma.address.findMany();
  res.json(addresses);
});

// The :id in the URL is the Address ID (string)
app.patch('/api/addresses/:id', authenticateJWT, async (req: AuthRequest & { params: AddressParams }, res) => {
  const addressId = req.params.id; // This is the address being changed
  const { status, notes } = req.body;
  
  // This comes from the TOKEN, not the payload!
  const actingUserId = req.user?.id; 

  if (!actingUserId) {
    return res.status(401).json({ error: "User ID missing from token" });
  }

  try {
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        status,
        notes,
        // Link this update to the user who performed it
        updater: {
          connect: { id: actingUserId }
        }
      },
      // Include the user info in the response so the map knows who did it
      include: {
        updater: {
          select: { name: true, email: true }
        }
      }
    });

    // Broadcast the update via Socket.io as usual
    io.emit('addressUpdated', updatedAddress);

    res.json(updatedAddress);
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ error: "Could not update address" });
  }
});

// This is the endpoint for your "Public Form"
app.post('/api/public/submit', async (req, res) => {
  const { street, notes } = req.body;

  // 1. Convert text address to Lat/Lng
  const geo = await geocodeAddress(street);

  if (!geo || !geo.lat || !geo.lng) {
    return res.status(400).json({ error: "Could not find that location. Please be more specific." });
  }

  try {
    // 2. Save to database
    const newAddress = await prisma.address.create({
      data: {
        street: geo.formattedAddress || street,
        lat: geo.lat,
        lng: geo.lng,
        notes: notes || "",
        status: "unvisited"
      }
    });

    // 3. THE MVC MAGIC: Tell all volunteers a new pin just appeared!
    io.emit('addressUpdated', newAddress);

    res.json({ success: true, message: "Pickup requested!" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post('/api/auth/google', async (req, res) => {
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
          role: 'volunteer'      // Default role
        }
      });
    } else if (user.googleId === 'initial-provision') {
      // Update the placeholder from the seed script with their real Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, name: payload.name }
      });
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

server.listen(3001, '0.0.0.0', () => console.log("Server running on 0.0.0.0:3001"));