"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FolderTree, X, CornerDownRight, Package, SquarePen } from "lucide-react";
import type { Category } from "@veronica/contracts";
import { useCategories, useProducts } from "@/lib/admin-hooks";
import { adminApi, AdminApiError, type AdminListProduct } from "@/lib/admin-api";
import { toast } from "sonner";
import { cn, slugify, formatPrice } from "@/lib/utils";
import { useSWRConfig } from "swr";

interface DraftCategory {
  id?: number;
  name: string;
  slug: string;
  parentId: number | null;
  description: string;
  image: string;
  sortOrder: number;
  showInHeader: boolean;
}

function blankDraft(parentId: number | null = null): DraftCategory {
  return { name: "", slug: "", parentId, description: "", image: "", sortOrder: 0, showInHeader: false };
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const { data: products } = useProducts();
  const { mutate } = useSWRConfig();
  const [draft, setDraft] = useState<DraftCategory | null>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  // Category selected to inspect its products in the right-hand panel.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(
    () => (categories ?? []).find((c) => c.id === selectedId) ?? null,
    [categories, selectedId],
  );

  // Alphabetical, top-level first; children sorted A→Z under their parent.
  const roots = useMemo(
    () => (categories ?? []).filter((c) => c.parentId === null).sort(byName),
    [categories],
  );
  const childrenOf = (id: number) =>
    (categories ?? []).filter((c) => c.parentId === id).sort(byName);

  // Subtree helpers (a category + all its descendants). Used so a parent shows
  // the TOTAL product count across its subcategories, and selecting it lists
  // every product in the subtree.
  const subtreeIds = (id: number): number[] => {
    const ids = [id];
    for (const child of childrenOf(id)) ids.push(...subtreeIds(child.id));
    return ids;
  };
  const subtreeCount = (id: number): number =>
    subtreeIds(id).reduce(
      (sum, cid) => sum + ((categories ?? []).find((c) => c.id === cid)?.productCount ?? 0),
      0,
    );
  const subtreeNames = (id: number): string[] =>
    subtreeIds(id)
      .map((cid) => (categories ?? []).find((c) => c.id === cid)?.name)
      .filter((n): n is string => Boolean(n));

  const refresh = () => mutate(["admin/categories"]);

  const toggleCollapse = (id: number) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    try {
      await adminApi.deleteCategory(cat.id);
      toast.success("Category deleted");
      await refresh();
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 409) {
        toast.error("Can’t delete — it still has sub-categories or products.");
      } else {
        toast.error("Delete failed");
      }
    }
  }

  function Row({
    cat,
    isChild,
    expanded,
    onToggle,
    isSelected,
    onSelect,
  }: {
    cat: Category;
    isChild: boolean;
    expanded?: boolean;
    onToggle?: () => void;
    isSelected?: boolean;
    onSelect?: () => void;
  }) {
    const kids = childrenOf(cat.id);
    const hasKids = !isChild && kids.length > 0;
    const count = subtreeCount(cat.id); // includes subcategory products
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2.5", isSelected && "bg-brand-orange/10")}>
        {isChild ? (
          <CornerDownRight size={15} className="text-text-muted/50 shrink-0" />
        ) : hasKids ? (
          <button
            onClick={onToggle}
            className="text-text-muted hover:text-brand-orange shrink-0"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}
        <button onClick={onSelect} className="flex-1 min-w-0 text-left" title="View products">
          <p className={cn("font-medium truncate", isChild ? "text-[13px]" : "text-sm", isSelected ? "text-brand-orange" : "text-text-primary")}>
            {cat.name}
          </p>
          <p className="text-[11px] text-text-muted">
            /{cat.slug} · {count} product{count === 1 ? "" : "s"}
            {!isChild && kids.length > 0 && ` · ${kids.length} sub`}
          </p>
        </button>
        {!isChild && (
          <button
            onClick={() => setDraft(blankDraft(cat.id))}
            className="p-1.5 rounded-lg text-text-muted hover:text-brand-orange hover:bg-surface-dim"
            aria-label="Add sub-category"
            title="Add sub-category"
          >
            <Plus size={15} />
          </button>
        )}
        <button
          onClick={() =>
            setDraft({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              parentId: cat.parentId,
              description: cat.description,
              image: cat.image ?? "",
              sortOrder: cat.sortOrder,
              showInHeader: cat.showInHeader,
            })
          }
          className="p-1.5 rounded-lg text-text-muted hover:text-brand-orange hover:bg-surface-dim"
          aria-label="Edit"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => handleDelete(cat)}
          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50"
          aria-label="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">Categories</h1>
        <button onClick={() => setDraft(blankDraft())} className="btn btn-primary text-sm">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        {/* Left: category tree (click a category to inspect its products → right) */}
        <div>
          {isLoading ? (
            <p className="text-text-muted text-sm py-10 text-center">Loading…</p>
          ) : roots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
              <FolderTree size={32} />
              <p className="text-sm">No categories yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {roots.map((root) => {
                const kids = childrenOf(root.id);
                const expanded = !collapsed.has(root.id);
                return (
                  <div key={root.id} className="bg-white border border-border-light rounded-xl shadow-sm overflow-hidden">
                    <Row
                      cat={root}
                      isChild={false}
                      expanded={expanded}
                      onToggle={() => toggleCollapse(root.id)}
                      isSelected={selectedId === root.id}
                      onSelect={() => setSelectedId(root.id)}
                    />
                    {kids.length > 0 && expanded && (
                      <div className="border-t border-border-light bg-surface-dim/40 pl-4">
                        <div className="border-l-2 border-border divide-y divide-border-light/70">
                          {kids.map((child) => (
                            <Row
                              key={child.id}
                              cat={child}
                              isChild
                              isSelected={selectedId === child.id}
                              onSelect={() => setSelectedId(child.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: products in the selected category (and its subcategories), each editable */}
        <div className="mt-5 lg:mt-0 lg:sticky lg:top-20">
          <CategoryProductsPanel
            selected={selected}
            categoryNames={selected ? subtreeNames(selected.id) : []}
            products={products ?? []}
          />
        </div>
      </div>

      {draft && (
        <CategoryDrawer
          draft={draft}
          roots={roots}
          onClose={() => setDraft(null)}
          onSaved={async () => {
            setDraft(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function byName(a: Category, b: Category) {
  return a.name.localeCompare(b.name);
}

/**
 * Right-hand panel: the products in the selected category, each linking to its
 * edit page. Products carry their category NAME on the admin list, so we match
 * by name (a category's own direct products).
 */
function CategoryProductsPanel({
  selected,
  categoryNames,
  products,
}: {
  selected: Category | null;
  categoryNames: string[]; // the selected category + its subcategories
  products: AdminListProduct[];
}) {
  if (!selected) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-light bg-surface-dim/30 py-20 text-text-muted">
        <Package size={28} />
        <p className="text-sm">Select a category to see its products.</p>
      </div>
    );
  }

  // All products across the selected category's subtree (it + its subcategories).
  const nameSet = new Set(categoryNames);
  const items = products
    .filter((p) => nameSet.has(p.categoryName))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.name.localeCompare(b.name));
  const hasSubs = categoryNames.length > 1;

  return (
    <div className="rounded-xl border border-border-light bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-light">
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">{selected.name}</p>
          <p className="text-[11px] text-text-muted">
            {items.length} product{items.length === 1 ? "" : "s"}
            {hasSubs && " · incl. subcategories"}
          </p>
        </div>
        <Link
          href={`/admin/products/new?category=${selected.id}`}
          className="btn btn-secondary text-xs px-2.5 py-1.5 shrink-0"
        >
          <Plus size={13} /> Add
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-text-muted">
          <Package size={26} />
          <p className="text-sm">No products in this category.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border-light max-h-[72vh] overflow-y-auto">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="flex items-center gap-4 p-3.5 hover:bg-surface-dim/60 group"
              >
                <div className="w-20 h-20 rounded-xl bg-[#f4f4f5] border border-border-light overflow-hidden shrink-0 flex items-center justify-center">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <Package size={22} className="text-text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-text-primary line-clamp-2">{p.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatPrice(p.minPrice)} · {p.status}
                  </p>
                  {hasSubs && p.categoryName !== selected.name && (
                    <p className="text-[11px] text-text-muted/80 mt-0.5">in {p.categoryName}</p>
                  )}
                </div>
                <SquarePen
                  size={18}
                  className="text-text-muted group-hover:text-brand-orange shrink-0"
                  aria-label="Edit product"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryDrawer({
  draft,
  roots,
  onClose,
  onSaved,
}: {
  draft: DraftCategory;
  roots: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(draft);
  const [saving, setSaving] = useState(false);
  const isEdit = draft.id != null;

  function set<K extends keyof DraftCategory>(key: K, val: DraftCategory[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const name = form.name.trim();
      const payload = {
        name,
        slug: form.slug.trim() || slugify(name),
        parentId: form.parentId,
        description: form.description,
        image: form.image || undefined,
        sortOrder: form.sortOrder,
        showInHeader: form.showInHeader,
      };
      if (isEdit) {
        await adminApi.updateCategory(draft.id!, payload);
        toast.success("Category updated");
      } else {
        await adminApi.createCategory(payload);
        toast.success("Category created");
      }
      onSaved();
    } catch {
      toast.error("Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">
            {isEdit ? "Edit Category" : "New Category"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-dim">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="input-label">Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">Slug (optional)</label>
            <input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              className="input"
              placeholder="auto-generated from name"
            />
          </div>
          <div>
            <label className="input-label">Parent</label>
            <select
              value={form.parentId ?? ""}
              onChange={(e) => set("parentId", e.target.value ? Number(e.target.value) : null)}
              className="input"
            >
              <option value="">— None (root) —</option>
              {roots
                .filter((r) => r.id !== draft.id)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="input min-h-20 resize-y"
            />
          </div>
          <div>
            <label className="input-label">Image URL (optional)</label>
            <input value={form.image} onChange={(e) => set("image", e.target.value)} className="input" />
          </div>
          <label className="flex items-start gap-2.5 rounded-lg border border-border-light p-3 cursor-pointer hover:bg-surface-dim">
            <input
              type="checkbox"
              checked={form.showInHeader}
              onChange={(e) => set("showInHeader", e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-orange"
            />
            <span>
              <span className="block text-sm font-medium text-text-primary">Show in header</span>
              <span className="block text-xs text-text-muted">
                Display this category in the customer top navigation. Every category always
                appears in the footer.
              </span>
            </span>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn btn-ghost text-sm flex-1">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className={cn("btn btn-primary text-sm flex-1", saving && "opacity-50")}
          >
            {saving ? "Saving…" : isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
