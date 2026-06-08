"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductEditor from "@/components/admin/ProductEditor";

function NewProduct() {
  // ?category=<id> preselects the category (e.g. when adding from a category page).
  const raw = useSearchParams().get("category");
  const id = raw ? Number(raw) : NaN;
  return <ProductEditor defaultCategoryId={Number.isInteger(id) && id > 0 ? id : undefined} />;
}

export default function NewProductPage() {
  // useSearchParams must be inside a Suspense boundary in the App Router.
  return (
    <Suspense>
      <NewProduct />
    </Suspense>
  );
}
