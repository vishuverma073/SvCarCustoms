import type { PincodeLookup } from "@veronica/contracts";

/**
 * A small mock pincode → city/state table for the address-form autofill. The
 * real backend will back this with a full PIN dataset; here we cover a handful
 * of metros so the UX is demonstrable.
 */
export const PINCODES: Record<string, Omit<PincodeLookup, "pincode">> = {
  "110001": { city: "New Delhi", state: "Delhi" },
  "110061": { city: "New Delhi", state: "Delhi" },
  "400001": { city: "Mumbai", state: "Maharashtra" },
  "560001": { city: "Bengaluru", state: "Karnataka" },
  "560100": { city: "Bengaluru", state: "Karnataka" },
  "600001": { city: "Chennai", state: "Tamil Nadu" },
  "700001": { city: "Kolkata", state: "West Bengal" },
  "500001": { city: "Hyderabad", state: "Telangana" },
  "380001": { city: "Ahmedabad", state: "Gujarat" },
  "302001": { city: "Jaipur", state: "Rajasthan" },
  "226001": { city: "Lucknow", state: "Uttar Pradesh" },
  "411001": { city: "Pune", state: "Maharashtra" },
};
