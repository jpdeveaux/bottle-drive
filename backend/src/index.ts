import express from 'express';
import { Server } from 'socket.io';
import { prisma } from './db.js';
import { createServer } from 'http';
import cors from 'cors';

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

app.post('/api/addresses/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedAddress = await prisma.address.update({
      where: { id: id },
      data: { status: status  },
    });
    
   // THE MVC TRIGGER: Tell all clients the data changed
    io.emit('addressUpdated', updatedAddress);

    res.json(updatedAddress);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

server.listen(3001, '0.0.0.0', () => console.log("Server running on 0.0.0.0:3001"));