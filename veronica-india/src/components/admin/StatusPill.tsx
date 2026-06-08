import { cn } from "@/lib/utils";
import type { ProductStatus } from "@veronica/contracts";

const STYLES: Record<ProductStatus, string> = {
  active: "bg-green-50 text-green-700",
  draft: "bg-amber-50 text-amber-700",
  archived: "bg-gray-100 text-gray-500",
};

/** Small lifecycle-status pill shared by the products list, editor and dashboard. */
export default function StatusPill({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
        STYLES[status],
      )}
    >
      {status}
    </span>
  );
}
