"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { ChevronDown, Trash2, Plus, X, Loader2 } from "lucide-react";
import {
  AdminProductCreateSchema,
  type AdminProductCreate,
  type Product,
} from "@veronica/contracts";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import { useCategories } from "@/lib/admin-hooks";
import { tempId } from "@/lib/sku-matrix";
import { cn } from "@/lib/utils";
import ImageUploader from "./ImageUploader";
import VariantsEditor from "./VariantsEditor";

function emptyProduct(): AdminProductCreate {
  return {
    name: "",
    slug: "",
    description: "",
    categoryId: 0,
    isBestseller: false,
    isNew: false,
    isFeatured: false,
    status: "draft",
    tags: [],
    images: [],
    dimensions: [],
    skus: [{ id: tempId(), skuCode: "SKU", price: 0, salePrice: null, dimensionValues: {} }],
    specifications: [],
    includedAccessories: [],
  };
}

function toFormValues(p: Product): AdminProductCreate {
  // Product → create payload (drop the server id; keep everything else).
  const { id: _id, ...rest } = p;
  void _id;
  return { ...rest, slug: p.slug };
}

/** Collapsible accordion section. */
function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text-primary"
      >
        {title}
        <ChevronDown size={18} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-border-light">{children}</div>}
    </div>
  );
}

/** Simple add/remove chip list used for tags + accessories. */
function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 bg-surface-dim text-text-secondary text-xs font-medium px-2 py-1 rounded-full"
          >
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))}>
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="input py-1.5 text-sm flex-1"
        />
        <button type="button" onClick={add} className="btn btn-secondary text-xs px-3">
          Add
        </button>
      </div>
    </div>
  );
}

export default function ProductEditor({
  productId,
  defaultCategoryId,
}: {
  productId?: number;
  defaultCategoryId?: number;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: categories } = useCategories();
  const isEdit = productId != null;
  const [loading, setLoading] = useState(isEdit);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminProductCreate>({
    // Schema defaults make zod's input type diverge from the output type; the
    // form operates on the resolved (output) shape, so cast the resolver.
    resolver: zodResolver(AdminProductCreateSchema) as unknown as Resolver<AdminProductCreate>,
    // Preselect the category when adding from a category page (so it isn't 0,
    // which fails validation as "invalid request").
    defaultValues: defaultCategoryId
      ? { ...emptyProduct(), categoryId: defaultCategoryId }
      : emptyProduct(),
  });

  // Load the product when editing.
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    adminApi
      .getProduct(productId)
      .then((p) => {
        if (!cancelled) reset(toFormValues(p));
      })
      .catch(() => toast.error("Could not load product"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isEdit, productId, reset]);

  const dimensions = watch("dimensions");
  const skus = watch("skus");
  const specifications = watch("specifications") ?? [];
  const name = watch("name");

  async function onSubmit(data: AdminProductCreate) {
    try {
      if (isEdit) {
        await adminApi.updateProduct(productId, data);
        await mutate(["admin/products", productId]);
        toast.success("Product saved");
      } else {
        const created = await adminApi.createProduct(data);
        toast.success("Product created");
        router.push(`/admin/products/${created.id}/edit`);
      }
      await mutate(
        (key) => Array.isArray(key) && key[0] === "admin/products",
        undefined,
        { revalidate: true },
      );
      reset(data); // clears dirty state
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : "Save failed";
      toast.error(msg);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(productId);
      await mutate(
        (key) => Array.isArray(key) && key[0] === "admin/products",
        undefined,
        { revalidate: true },
      );
      toast.success("Product deleted");
      router.push("/admin/products");
    } catch {
      toast.error("Delete failed");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const codePrefix = (name || "SKU")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 4)
    .toUpperCase();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl pb-36 lg:pb-24 space-y-3">
      <h1 className="text-xl font-bold text-text-primary mb-1">
        {isEdit ? "Edit Product" : "Add New Product"}
      </h1>

      {/* Basics */}
      <Section title="Basics" defaultOpen>
        <div className="space-y-3">
          <div>
            <label className="input-label">Name</label>
            <input {...register("name")} className="input" placeholder="Product name" />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="input-label">Slug (optional)</label>
            <input {...register("slug")} className="input" placeholder="auto-generated from name" />
          </div>
          <div>
            <label className="input-label">Category</label>
            <select
              {...register("categoryId", { valueAsNumber: true })}
              className="input"
              defaultValue={0}
            >
              <option value={0} disabled>
                Select a category…
              </option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? "— " : ""}
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs text-danger mt-1">Please select a category.</p>
            )}
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea
              {...register("description")}
              className="input min-h-24 resize-y"
              placeholder="Short product description"
            />
          </div>
        </div>
      </Section>

      {/* Images */}
      <Section title="Images" defaultOpen>
        <Controller
          control={control}
          name="images"
          render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} />}
        />
      </Section>

      {/* Variants & Pricing */}
      <Section title="Variants & Pricing" defaultOpen>
        <VariantsEditor
          dimensions={dimensions}
          skus={skus}
          codePrefix={codePrefix}
          onChange={(d, s) => {
            setValue("dimensions", d, { shouldDirty: true });
            setValue("skus", s, { shouldDirty: true });
          }}
        />
      </Section>

      {/* Visibility */}
      <Section title="Visibility & Flags">
        <div className="space-y-3">
          <div>
            <label className="input-label">Status</label>
            <select {...register("status")} className="input">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            {(["isBestseller", "isNew", "isFeatured"] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2 text-sm text-text-primary">
                <input type="checkbox" {...register(flag)} className="w-4 h-4 accent-brand-orange" />
                {flag === "isBestseller" ? "Bestseller" : flag === "isNew" ? "New arrival" : "Featured"}
              </label>
            ))}
          </div>
          <div>
            <label className="input-label">Tags</label>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <ChipInput value={field.value} onChange={field.onChange} placeholder="Add a tag" />
              )}
            />
          </div>
        </div>
      </Section>

      {/* Specifications */}
      <Section title="Specifications">
        <div className="space-y-2">
          {specifications.map((spec, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={spec.name}
                onChange={(e) => {
                  const next = [...specifications];
                  next[i] = { ...next[i], name: e.target.value };
                  setValue("specifications", next, { shouldDirty: true });
                }}
                placeholder="Name"
                className="input py-1.5 text-sm flex-1"
              />
              <input
                value={spec.value}
                onChange={(e) => {
                  const next = [...specifications];
                  next[i] = { ...next[i], value: e.target.value };
                  setValue("specifications", next, { shouldDirty: true });
                }}
                placeholder="Value"
                className="input py-1.5 text-sm flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  setValue(
                    "specifications",
                    specifications.filter((_, idx) => idx !== i),
                    { shouldDirty: true },
                  )
                }
                className="p-2 text-text-muted hover:text-danger"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setValue("specifications", [...specifications, { name: "", value: "" }], {
                shouldDirty: true,
              })
            }
            className="btn btn-ghost text-sm border border-dashed border-border w-full"
          >
            <Plus size={15} /> Add specification
          </button>
        </div>
      </Section>

      {/* Accessories */}
      <Section title="Included Accessories">
        <Controller
          control={control}
          name="includedAccessories"
          render={({ field }) => (
            <ChipInput
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder="Add an accessory"
            />
          )}
        />
      </Section>

      {/* Danger zone (edit only) */}
      {isEdit && (
        <Section title="Danger Zone">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn text-sm bg-red-50 text-danger hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={15} /> {deleting ? "Deleting…" : "Delete product"}
          </button>
        </Section>
      )}

      {/* Sticky save bar — sits above the mobile bottom nav (~56px + safe-area),
          flush to the bottom on desktop where the nav is hidden. */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:bottom-0 inset-x-0 lg:left-60 z-40 bg-white border-t border-border px-4 pt-3 pb-3 lg:pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {isSubmitting ? "Saving…" : isDirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="btn btn-ghost text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (isEdit && !isDirty)}
            className="btn btn-primary text-sm disabled:opacity-50"
          >
            {isEdit ? "Save" : "Create Product"}
          </button>
        </div>
      </div>
    </form>
  );
}
