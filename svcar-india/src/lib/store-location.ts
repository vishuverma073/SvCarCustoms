/** SV Car Customs store / office — single source for contact, about, footer. */
export const STORE_ADDRESS = {
  line1: "Shop no.2, Ground Floor, Plot no. 734-A",
  landmark: "Opposite CISF Camp",
  city: "Delhi",
  pincode: "110061",
  country: "India",
} as const;

export const STORE_ADDRESS_LINES = [
  STORE_ADDRESS.line1,
  `${STORE_ADDRESS.landmark}, Delhi NCR, ${STORE_ADDRESS.pincode}`,
] as const;

const MAPS_QUERY = encodeURIComponent(
  `${STORE_ADDRESS.line1}, ${STORE_ADDRESS.landmark}, ${STORE_ADDRESS.city}, ${STORE_ADDRESS.pincode}, ${STORE_ADDRESS.country}`,
);

/** Opens the place in the Google Maps app / website (no API key). */
export const GOOGLE_MAPS_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

/**
 * Standard Google Maps embed URL (query + output=embed).
 * Use in an iframe — requires CSP frame-src to allow google.com.
 */
export const GOOGLE_MAPS_EMBED_URL = `https://www.google.com/maps?q=${MAPS_QUERY}&hl=en&z=15&output=embed`;
