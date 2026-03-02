import express from 'express';
import cors from 'cors';
import { prisma } from './db.js';

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

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
  const volunteers = await prisma.address.findMany();
  res.json(volunteers);
});

app.post('/api/addresses', async (req, res) => {
  const { zone, street, lat, lng, notes } = req.body;
  const newAddress = await prisma.address.create({ data: { zone, street, lat, lng, notes } });
  res.json(newAddress);
});

app.listen(3001, () => console.log('Backend started on port 3001'));