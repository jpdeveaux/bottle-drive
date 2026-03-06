import NodeGeocoder from 'node-geocoder';

// IMPORTANT: Nominatim requires a User-Agent to identify your app, but NodeGeocoder's TypeScript types don't include it, 
// so we extend the options type here to include it. 
const options: NodeGeocoder.Options & { userAgent?: string } = {
  provider: 'openstreetmap',
  userAgent: 'MyVolunteerApp/1.0 (admin@1sttimberlea.ca)' 
};

const geocoder = NodeGeocoder(options);

const buildCleanAddress = (g: any) => {
  const parts = [];
  
  // 1. Street
  if (g.streetName) {
    parts.push(g.streetNumber ? `${g.streetNumber} ${g.streetName}` : g.streetName);
  }
  
  // 2. City
  if (g.city) parts.push(g.city);
  
  // 3. Province/State
  if (g.state) parts.push(g.state);

  // If we couldn't build a clean string, fallback to a sensible default
  return parts.length > 0 ? parts.join(', ') : g.formattedAddress;
};

export const geocodeAddress = async (address: string) => {
  try {
    const res = await geocoder.geocode(address);
    if (res.length > 0) {
      const g = res[0];
      return {
        lat: g.latitude,
        lng: g.longitude,
        formattedAddress: buildCleanAddress(g)
      };
    }
    return null;
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
};