import NodeGeocoder from 'node-geocoder';
import { prisma } from './db.js';

const EMAIL = process.env.INITIAL_ADMIN_EMAIL;

// IMPORTANT: Nominatim requires a User-Agent to identify your app, but NodeGeocoder's TypeScript types don't include it, 
// so we extend the options type here to include it. 
const options: NodeGeocoder.Options & { userAgent?: string } = {
  provider: 'openstreetmap',
  userAgent: `MyVolunteerApp/1.0 (${EMAIL})` 
};

const geocoder = NodeGeocoder(options);

// this adds zone/user info to the address being returned
export const ZONE_NAME_AND_USERS = { 
  zone: { 
    select: { 
      name: true, 
      users: { 
        select: { 
          id: true    // include user IDs linked to this address.
        }
      }
    }
  }
};

interface Coords {
  lat: number;
  lng: number;
};

export const geocodeAddress = async (address: string) : Promise<Coords | null> => {
  try {
    const res = await geocoder.geocode(address);
    if (res.length > 0) {
      const g = res[0];
      return (g.latitude && g.longitude) ? {
        lat: g.latitude,
        lng: g.longitude
      } : null;
    }
    return null;
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
};

export const checkForZone = async (addr: Coords): Promise<string|null> => {
  const zones = await prisma.zone.findMany();
  let assignedZoneId = null;

  for (const zone of zones) {
    if (addr.lat <= (zone.north || 0) && addr.lat >= (zone.south || 0) && addr.lng <= (zone.east || 0) && addr.lng >= (zone.west || 0) ) {
      assignedZoneId = zone.id;
      break;
    }
  } 

  return assignedZoneId;
};