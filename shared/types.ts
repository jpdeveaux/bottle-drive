// shared/types.ts

// We use "import type" to ensure these are stripped out 
// and don't cause circular dependency issues in Docker.
import type { Zone as PrismaZone, Address as PrismaAddress, User as PrismaUser, Role as PrismaRole } from '../backend/src/prisma/generated/client.js';

export type Zone = PrismaZone;
export type Address = PrismaAddress;
export type Role = PrismaRole;
export type User = PrismaUser;

// this has to match AddressStatus in schema.prisma
export const AddressStatus = {
  unvisited: 'unvisited',
  completed: 'completed',
} as const;

// You can also define custom API response shapes here
export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: string;
}