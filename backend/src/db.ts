import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './prisma/generated/client.js';

// 1. Setup the Connection Pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Initialize the Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the Adapter to Prisma Client
export const prisma = new PrismaClient({ adapter });