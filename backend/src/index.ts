import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

import addressRoutes from '@routes/addresses.js';
import userRoutes from '@routes/users.js';
import authRoutes from '@routes/auth.js';
import zoneRoutes from '@routes/zones.js';
import heartbeatRoutes from '@routes/heartbeat.js';

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

const app = express();
app.set('trust proxy', 1);
app.use(cors(corsOptions));

const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

app.use(express.json());

app.use('/api/auth', authRoutes(io));
app.use('/api/users', userRoutes(io));
app.use('/api/zones', zoneRoutes(io));
app.use('/api/heartbeat', heartbeatRoutes(io));
app.use('/api/addresses', addressRoutes(io));

const BACKEND_PORT: number = parseInt(process.env.BACKEND_PORT || "3001");
server.listen(BACKEND_PORT, '0.0.0.0', () => console.log(`Server running on port ${BACKEND_PORT}`));