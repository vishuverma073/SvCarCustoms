import useSWR from "swr";
import { backend, type StoreSettings } from "@/lib/backend";

/**
 * Live store settings (pricing knobs + contact info) for the storefront. Falls
 * back to the hardcoded defaults in lib/checkout.ts while loading / on error.
 */
export function useStoreSettings() {
  return useSWR<StoreSettings>("store-settings", () => backend.getStoreSettings(), {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
}
