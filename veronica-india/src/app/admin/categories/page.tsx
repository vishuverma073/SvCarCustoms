"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, FolderTree, X } from "lucide-react";
import type { Category } from "@veronica/contracts";
import { useCategories, useProducts } from "@/lib/admin-hooks";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import { toast } from "sonner";
import { cn, slugify } from "@/lib/utils";
import { useSWRConfig } from "swr";

interface DraftCategory {
  id?: number;
  name: string;
  slug: string;
  parentId: number | null;
  description: string;
  image: string;
  sortOrder: number;
}

function blankDraft(parentId: number | null = null): DraftCategory {
  return { name: "", slug: "", parentId, description: "", image: "", sortOrder: 0 };
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const { data: products } = useProducts();
  const { mutate } = useSWRConfig();
  const [draft, setDraft] = useState<DraftCategory | null>(null);

  const roots = useMemo(
    () => (categories ?? []).filter((c) => c.parentId === null).sort(byOrder),
    [categories],
  );
  const childrenOf = (id: number) =>
    (categories ?? []).filter((c) => c.parentId === id).sort(byOrder);

  const productCount = (id: number) => (products ?? []).filter((p) => p.categoryId === id).length;
  const refresh = () => mutate(["admin/categories"]);

  async function reorder(list: Category[], index: number, dir: -1 | 1) {
    const target = list[index + dir];
    const current = list[index];
    if (!target) return;
    try {
      await Promise.all([
        adminApi.updateCategory(current.id, { sortOrder: target.sortOrder }),
        adminApi.updateCategory(target.id, { sortOrder: current.sortOrder }),
      ]);
      await refresh();
    } catch {
      toast.error("Could not reorder");
    }
  }

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

  function Row({ cat, list, index, depth }: { cat: Category; list: Category[]; index: number; depth: number }) {
    const kids = childrenOf(cat.id);
    return (
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-white border border-border-light rounded-lg"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex flex-col">
          <button
            onClick={() => reorder(list, index, -1)}
            disabled={index === 0}
            className="text-text-muted hover:text-brand-orange disabled:opacity-30"
            aria-label="Move up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => reorder(list, index, 1)}
            disabled={index === list.length - 1}
            className="text-text-muted hover:text-brand-orange disabled:opacity-30"
            aria-label="Move down"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{cat.name}</p>
          <p className="text-[11px] text-text-muted">
            /{cat.slug} · {productCount(cat.id)} products
            {kids.length > 0 && ` · ${kids.length} sub`}
          </p>
        </div>
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
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">Categories</h1>
        <button onClick={() => setDraft(blankDraft())} className="btn btn-primary text-sm">
          <Plus size={16} /> Add
        </button>
      </div>

      {isLoading ? (
        <p className="text-text-muted text-sm py-10 text-center">Loading…</p>
      ) : roots.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
          <FolderTree size={32} />
          <p className="text-sm">No categories yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {roots.map((root, i) => (
            <div key={root.id} className="space-y-2">
              <Row cat={root} list={roots} index={i} depth={0} />
              {childrenOf(root.id).map((child, ci, arr) => (
                <Row key={child.id} cat={child} list={arr} index={ci} depth={1} />
              ))}
            </div>
          ))}
        </div>
      )}

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

function byOrder(a: Category, b: Category) {
  return a.sortOrder - b.sortOrder;
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
