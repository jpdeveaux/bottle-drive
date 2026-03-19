import NodeGeocoder from 'node-geocoder';

const EMAIL = process.env.INITIAL_ADMIN_EMAIL;

// IMPORTANT: Nominatim requires a User-Agent to identify your app, but NodeGeocoder's TypeScript types don't include it, 
// so we extend the options type here to include it. 
const options: NodeGeocoder.Options & { userAgent?: string } = {
  provider: 'openstreetmap',
  userAgent: `MyVolunteerApp/1.0 (${EMAIL})` 
};

const geocoder = NodeGeocoder(options);

export interface Coords {
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