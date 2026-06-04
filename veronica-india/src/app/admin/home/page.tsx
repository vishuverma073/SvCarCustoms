"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { HomeConfig, HomeSectionKey, BannerConfig, Category } from "@veronica/contracts";
import { useHome, useProducts, useCategories } from "@/lib/admin-hooks";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<HomeSectionKey, string> = {
  hero: "Hero banner",
  categories: "Category showcase",
  bestsellers: "Bestsellers (auto)",
  new: "New arrivals (auto)",
  featured: "Featured products",
  promo: "Promo banner",
};

export default function HomeComposerPage() {
  const { data: loaded, isLoading } = useHome();
  const { data: products } = useProducts();
  const { data: categories, mutate: mutateCategories } = useCategories();
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // Staged navbar (showInHeader) changes, id → desired value. Persisted on Save
  // (not instantly), like the rest of the composer.
  const [navbarPending, setNavbarPending] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (loaded && !config) setConfig(loaded);
  }, [loaded, config]);

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  function update(next: HomeConfig) {
    setConfig(next);
    setDirty(true);
  }

  function moveSection(index: number, dir: -1 | 1) {
    const sections = [...config!.sections];
    const j = index + dir;
    if (j < 0 || j >= sections.length) return;
    [sections[index], sections[j]] = [sections[j], sections[index]];
    update({ ...config!, sections });
  }

  function toggleSection(index: number) {
    const sections = config!.sections.map((s, i) =>
      i === index ? { ...s, enabled: !s.enabled } : s,
    );
    update({ ...config!, sections });
  }

  function setBanner(key: "hero" | "promo", patch: Partial<BannerConfig>) {
    update({ ...config!, [key]: { ...config![key], ...patch } });
  }

  function toggleInList(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }
  function toggleFeatured(id: number) {
    update({ ...config!, featured: { productIds: toggleInList(config!.featured.productIds, id) } });
  }
  function toggleCategory(id: number) {
    update({
      ...config!,
      categories: { categoryIds: toggleInList(config!.categories.categoryIds, id) },
    });
  }

  // Stage a navbar (showInHeader) change locally; persisted on Save. Dropping
  // it back to the server's value clears it from the pending set.
  function toggleNavbar(id: number, value: boolean) {
    const serverVal = (categories ?? []).find((c) => c.id === id)?.showInHeader ?? false;
    setNavbarPending((prev) => {
      const next = { ...prev };
      if (value === serverVal) delete next[id];
      else next[id] = value;
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      if (dirty) {
        const saved = await adminApi.putHome(config!);
        setConfig(saved);
        setDirty(false);
      }
      const navEntries = Object.entries(navbarPending);
      if (navEntries.length > 0) {
        await Promise.all(
          navEntries.map(([id, val]) => adminApi.updateCategory(Number(id), { showInHeader: val })),
        );
        setNavbarPending({});
        mutateCategories();
      }
      toast.success("Home page saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  const navbarDirty = Object.keys(navbarPending).length > 0;

  return (
    <div className="max-w-2xl pb-24">
      <h1 className="text-xl font-bold text-text-primary mb-5">Home Composer</h1>

      {/* Section order + toggles */}
      <div className="bg-white rounded-xl border border-border-light shadow-sm p-3 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2 px-1">
          Sections (order &amp; visibility)
        </p>
        <div className="space-y-1.5">
          {config.sections.map((section, i) => (
            <div
              key={section.key}
              className="flex items-center gap-2 px-2 py-2 rounded-lg bg-surface-dim"
            >
              <div className="flex flex-col">
                <button
                  onClick={() => moveSection(i, -1)}
                  disabled={i === 0}
                  className="text-text-muted hover:text-brand-orange disabled:opacity-30"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveSection(i, 1)}
                  disabled={i === config.sections.length - 1}
                  className="text-text-muted hover:text-brand-orange disabled:opacity-30"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <span className="flex-1 text-sm font-medium text-text-primary">
                {SECTION_LABELS[section.key]}
              </span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={() => toggleSection(i)}
                  className="w-4 h-4 accent-brand-orange"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Hero + Promo editors */}
      {(["hero", "promo"] as const).map((key) => (
        <div key={key} className="bg-white rounded-xl border border-border-light shadow-sm p-4 mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3 capitalize">{key} banner</h2>
          <div className="space-y-3">
            <Field label="Title" value={config[key].title} onChange={(v) => setBanner(key, { title: v })} />
            <Field label="Subtitle" value={config[key].subtitle} onChange={(v) => setBanner(key, { subtitle: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="CTA text" value={config[key].ctaText} onChange={(v) => setBanner(key, { ctaText: v })} />
              <Field label="CTA link" value={config[key].ctaLink} onChange={(v) => setBanner(key, { ctaLink: v })} />
            </div>
            <Field label="Image URL" value={config[key].image} onChange={(v) => setBanner(key, { image: v })} />
          </div>
        </div>
      ))}

      {/* Featured products */}
      <PickerCard
        title="Featured products"
        items={(products ?? []).map((p) => ({ id: p.id, label: p.name }))}
        selected={config.featured.productIds}
        onToggle={toggleFeatured}
      />

      {/* Category showcase */}
      <PickerCard
        title="Category showcase"
        items={(categories ?? []).filter((c) => c.parentId === null).map((c) => ({ id: c.id, label: c.name }))}
        selected={config.categories.categoryIds}
        onToggle={toggleCategory}
      />

      {/* Navbar builder — choose which top-level categories appear in the store
          header and which subcategories show in each dropdown. Staged locally and
          persisted together with the rest on Save. */}
      <NavbarManager categories={categories ?? []} pending={navbarPending} onToggle={toggleNavbar} />

      {/* Sticky save */}
      <div
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:bottom-0 inset-x-0 lg:left-60 z-40 bg-white border-t border-border px-4 pt-3 pb-3 lg:pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex items-center justify-between"
      >
        <span className="text-xs text-text-muted">
          {saving ? "Saving…" : dirty || navbarDirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <button
          onClick={save}
          disabled={saving || (!dirty && !navbarDirty)}
          className="btn btn-primary text-sm disabled:opacity-50"
        >
          <Save size={15} /> Save
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </div>
  );
}

function PickerCard({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: number; label: string }[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-border-light shadow-sm p-4 mb-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3">
        {title}{" "}
        <span className="text-text-muted font-normal">({selected.length} selected)</span>
      </h2>
      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onToggle(it.id)}
            className={cn(
              "px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors",
              selected.includes(it.id)
                ? "bg-brand-orange text-white border-brand-orange"
                : "bg-white text-text-secondary border-border hover:border-brand-orange/50",
            )}
          >
            {it.label}
          </button>
        ))}
        {items.length === 0 && <span className="text-xs text-text-muted">Nothing to pick.</span>}
      </div>
    </div>
  );
}

/**
 * Store-navbar builder. Lists each top-level category with a "show in navbar"
 * toggle and, nested beneath, its subcategories with "show in dropdown" toggles.
 * Controlled: toggles are staged in the parent's `pending` map and persisted
 * together with the rest of the composer when the admin clicks Save — so the
 * store header only changes after an explicit save.
 */
function NavbarManager({
  categories,
  pending,
  onToggle,
}: {
  categories: Category[];
  pending: Record<number, boolean>;
  onToggle: (id: number, value: boolean) => void;
}) {
  // Desired value = a staged change if present, else the saved server value.
  const flag = (c: Category) => pending[c.id] ?? !!c.showInHeader;

  const roots = categories
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const childrenOf = (parentId: number) =>
    categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  function Toggle({ cat, sub }: { cat: Category; sub?: boolean }) {
    const checked = flag(cat);
    return (
      <label
        className={cn(
          "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-surface-dim/70",
          sub && "text-sm",
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(cat.id, !checked)}
          className="w-4 h-4 accent-brand-orange"
        />
        <span className={cn("flex-1", sub ? "text-text-secondary" : "font-medium text-text-primary")}>
          {cat.name}
        </span>
      </label>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border-light shadow-sm p-4 mb-4">
      <h2 className="text-sm font-semibold text-text-primary mb-1">Store navbar</h2>
      <p className="text-xs text-text-muted mb-3">
        Tick a category to show it in the header. Tick its subcategories to list them in that
        item&rsquo;s dropdown menu. Click <span className="font-semibold">Save</span> to apply.
      </p>
      {roots.length === 0 ? (
        <span className="text-xs text-text-muted">No categories yet.</span>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {roots.map((root) => {
            const kids = childrenOf(root.id);
            return (
              <div key={root.id} className="rounded-lg bg-surface-dim/40">
                <Toggle cat={root} />
                {flag(root) && kids.length > 0 && (
                  <div className="ml-6 mb-1 border-l border-border/60 pl-2">
                    {kids.map((kid) => (
                      <Toggle key={kid.id} cat={kid} sub />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
