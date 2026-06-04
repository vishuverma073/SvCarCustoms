import type { Settings } from "@veronica/contracts";
import type { AdminUser } from "@veronica/contracts";

/** Default store settings. */
export const settings: Settings = {
  storeName: "Veronica India",
  supportPhone: "+91 93505 29717",
  supportEmail: "support@veronicaindia.com",
  storeAddress: { label: "", line1: "New Delhi", line2: "", city: "New Delhi", state: "Delhi", pincode: "110001", landmark: "" },
  gstRate: 18,
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
