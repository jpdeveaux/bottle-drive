import express from 'express';
import { Server } from 'socket.io';
import { prisma } from './db.js';
import { createServer } from 'http';
import cors from 'cors';
import { geocodeAddress } from './geocoder.js';

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PATCH"]
};

const app = express();
app.use(cors(corsOptions));

const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW()`;
    res.json({ status: "ok", dbTime: result[0].now });
  } catch {
    res.status(500).json({ error: "DB connection failed" });
  }
});

app.get('/api/addresses', async (req, res) => {
  console.log('Addresses fetched');
  const addresses = await prisma.address.findMany();
  res.json(addresses);
});

// Controller: update address notes or status
app.patch('/api/addresses/:id', async (req, res) => {
  const { id } = req.params;
  const { notes, status } = req.body; // Accept both

  try {
    const updatedAddress = await prisma.address.update({
      where: { id: id },
      data: { 
        // Only update if the field is provided in the request body
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    });

    io.emit('addressUpdated', updatedAddress);
    res.json(updatedAddress);
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ error: "Failed to update address" });
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

server.listen(3001, '0.0.0.0', () => console.log("Server running on 0.0.0.0:3001"));