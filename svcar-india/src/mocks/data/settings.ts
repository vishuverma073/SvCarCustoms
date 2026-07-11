import type { Settings } from "@svcar/contracts";
import type { AdminUser } from "@svcar/contracts";

/** Default store settings. */
export const settings: Settings = {
  storeName: "SV Car Customs",
  supportPhone: "+91 92050 05425",
  supportEmail: "shivam187100@gmail.com",
  storeAddress: { label: "", line1: "Shop no.2, Ground Floor, Plot no. 734-A", line2: "", city: "Delhi", state: "Delhi NCR", pincode: "110061", landmark: "Opposite CISF Camp" },
  gstRate: 28,
  shippingFreeAbove: 5000,
  shippingFlatFee: 200,
  whatsappNumber: "+919205005425",
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
