import type { Zone as PrismaZone, User as PrismaUser, Role as PrismaRole } from './prisma/generated/client.js';

export type Role = PrismaRole;
export type User = PrismaUser & { zones?: PrismaZone[] };