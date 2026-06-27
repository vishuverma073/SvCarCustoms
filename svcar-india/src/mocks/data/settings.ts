import type { Settings } from "@svcar/contracts";
import type { AdminUser } from "@svcar/contracts";

/** Default store settings. */
export const settings: Settings = {
  storeName: "SV Car Customs",
  supportPhone: "+91 93505 29717",
  supportEmail: "support@svcarcustoms.com",
  storeAddress: { label: "", line1: "Plot 734, Bijwasan - Palam Vihar Rd", line2: "", city: "New Delhi", state: "Delhi", pincode: "110061", landmark: "" },
  gstRate: 28,
  shippingFreeAbove: 5000,
  shippingFlatFee: 200,
  whatsappNumber: "+919350529717",
};

/** The single mock admin returned on successful login. */
export const adminUser: AdminUser = {
  id: "admin-1",
  email: "admin@test.local",
  name: "Ketan (Admin)",
};

export const MOCK_TOKEN = "mock-token";
export const MOCK_EMAIL = "admin@test.local";
export const MOCK_PASSWORD = "admin123";
