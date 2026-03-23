import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

import addressRoutes from '@routes/addresses.js';
import publicRoutes from '@routes/public.js';
import userRoutes from '@routes/users.js';
import authRoutes from '@routes/auth.js';
import zoneRoutes from '@routes/zones.js';
import heartbeatRoutes from '@routes/heartbeat.js';

console.log('origin: '+process.env.FRONTEND_URL);
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

const app = express();
app.use(cors(corsOptions));

const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

app.use(express.json());

app.use('/api/public', publicRoutes(io));
app.use('/api/auth', authRoutes(io));
app.use('/api/users', userRoutes(io));
app.use('/api/zones', zoneRoutes(io));
app.use('/api/heartbeat', heartbeatRoutes);
app.use('/api/addresses', addressRoutes(io));

server.listen(3001, '0.0.0.0', () => console.log("Server running on port 3001"));