"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import ImageUpload from "@/components/ui/ImageUpload";
import type { Category, ApiResponse } from "@/types";

type SectionType =
  | "new_arrival"
  | "best_selling"
  | "top_categories"
  | "featured"
  | "gender"
  | "category";

interface HomeSection {
  key: string;
  type: SectionType;
  title: string;
  enabled: boolean;
  order: number;
  limit: number;
  value?: string;
}

interface HomepageSettings {
  banner: {
    enabled: boolean;
    image: string;
    mobileImage?: string;
    link?: string;
    alt?: string;
  };
  sections: HomeSection[];
}

const TYPE_LABEL: Record<SectionType, string> = {
  new_arrival: "New Arrival (latest products)",
  best_selling: "Best Selling (most sold)",
  top_categories: "Top Categories (category tiles)",
  featured: "Featured products",
  gender: "Gender collection (Men / Women / Kids)",
  category: "Single category",
};

export default function HomepageSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<HomepageSettings>({
    queryKey: ["homepage-settings"],
    queryFn: async () => (await api.get("/settings/homepage")).data.data,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories-list"],
    queryFn: async () => (await api.get<ApiResponse<Category[]>>("/categories")).data.data,
  });

  const [banner, setBanner] = useState<HomepageSettings["banner"]>({
    enabled: true,
    image: "",
    mobileImage: "",
    link: "/products",
    alt: "",
  });
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [newType, setNewType] = useState<SectionType>("category");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    if (!data) return;
    setBanner({
      enabled: data.banner?.enabled ?? true,
      image: data.banner?.image ?? "",
      mobileImage: data.banner?.mobileImage ?? "",
      link: data.banner?.link ?? "",
      alt: data.banner?.alt ?? "",
    });
    setSections([...(data.sections ?? [])].sort((a, b) => a.order - b.order));
  }, [data]);

  const save = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.patch("/settings/homepage", payload)).data.data,
    onSuccess: () => {
      toast.success("Homepage saved");
      qc.invalidateQueries({ queryKey: ["homepage-settings"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save"),
  });

  const update = (i: number, patch: Partial<HomeSection>) =>
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const move = (i: number, dir: -1 | 1) =>
    setSections((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (i: number) => setSections((prev) => prev.filter((_, idx) => idx !== i));

  function addSection() {
    const needsValue = newType === "gender" || newType === "category";
    if (needsValue && !newValue) {
      toast.error(newType === "gender" ? "Choose a gender" : "Choose a category");
      return;
    }
    let title = "New Section";
    if (newType === "gender") title = `${newValue.charAt(0).toUpperCase()}${newValue.slice(1)}'s Fashion`;
    if (newType === "category") title = categories.find((c) => c.slug === newValue)?.name ?? "Category";
    if (newType === "featured") title = "Featured";
    if (newType === "new_arrival") title = "New Arrival";
    if (newType === "best_selling") title = "Best Selling";
    if (newType === "top_categories") title = "Top Categories";

    setSections((prev) => [
      ...prev,
      {
        key: `${newType}-${Date.now()}`,
        type: newType,
        title,
        enabled: true,
        order: prev.length + 1,
        limit: 8,
        value: needsValue ? newValue : "",
      },
    ]);
    setNewValue("");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Homepage Sections</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Control the homepage banner and product sections. Turn sections on/off, rename and reorder them.
          </p>
        </div>
        <button
          onClick={() => save.mutate({ banner, sections })}
          disabled={save.isPending}
          className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold disabled:opacity-50 self-start sm:self-auto"
        >
          {save.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Banner */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white">Top Banner</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={banner.enabled}
              onChange={(e) => setBanner({ ...banner, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-500"
            />
            Show banner
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Desktop banner <span className="text-xs text-gray-400">(e.g. 1600×500)</span>
            </p>
            <ImageUpload
              value={banner.image}
              onChange={(url) => setBanner({ ...banner, image: url })}
              folder="fashion-admin/banners"
              aspectRatio="wide"
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Mobile banner <span className="text-xs text-gray-400">(optional, e.g. 800×500)</span>
            </p>
            <ImageUpload
              value={banner.mobileImage}
              onChange={(url) => setBanner({ ...banner, mobileImage: url })}
              folder="fashion-admin/banners"
              aspectRatio="wide"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Click link
            </label>
            <input
              value={banner.link ?? ""}
              onChange={(e) => setBanner({ ...banner, link: e.target.value })}
              placeholder="/products"
              className="input-field"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Alt text
            </label>
            <input
              value={banner.alt ?? ""}
              onChange={(e) => setBanner({ ...banner, alt: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white">Product Sections</h2>
          <button
            onClick={() => {
              if (confirm("Reset sections to the default list?")) save.mutate({ reset: true });
            }}
            className="text-xs text-gray-500 hover:text-red-500 underline"
          >
            Reset to defaults
          </button>
        </div>

        <div className="space-y-2">
          {sections.map((s, i) => (
            <div
              key={s.key}
              className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
                s.enabled
                  ? "border-gray-200 dark:border-gray-800"
                  : "border-gray-100 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-800/20 opacity-70"
              }`}
            >
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => update(i, { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
              </label>

              <div className="flex-1 min-w-[160px]">
                <input
                  value={s.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  className="input-field py-1.5 text-sm font-medium"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  {TYPE_LABEL[s.type]}
                  {s.value ? ` · ${s.value}` : ""}
                </p>
              </div>

              {s.type !== "top_categories" ? (
                <div className="w-20">
                  <label className="text-[10px] text-gray-400 block">Products</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={s.limit}
                    onChange={(e) => update(i, { limit: Number(e.target.value) || 8 })}
                    className="input-field py-1.5 text-sm"
                  />
                </div>
              ) : (
                <div className="w-20">
                  <label className="text-[10px] text-gray-400 block">Categories</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={s.limit}
                    onChange={(e) => update(i, { limit: Number(e.target.value) || 8 })}
                    className="input-field py-1.5 text-sm"
                  />
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => remove(i)}
                  className="w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/30"
                  aria-label="Delete section"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No sections. The homepage will only show the banner.</p>
          )}
        </div>

        {/* Add section */}
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] text-gray-500 block mb-1">Add section</label>
            <select
              value={newType}
              onChange={(e) => {
                setNewType(e.target.value as SectionType);
                setNewValue("");
              }}
              className="input-field py-1.5 text-sm"
            >
              {(Object.keys(TYPE_LABEL) as SectionType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          {newType === "gender" && (
            <div className="w-32">
              <label className="text-[11px] text-gray-500 block mb-1">Gender</label>
              <select value={newValue} onChange={(e) => setNewValue(e.target.value)} className="input-field py-1.5 text-sm">
                <option value="">Select…</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
          )}
          {newType === "category" && (
            <div className="w-48">
              <label className="text-[11px] text-gray-500 block mb-1">Category</label>
              <select value={newValue} onChange={(e) => setNewValue(e.target.value)} className="input-field py-1.5 text-sm">
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={addSection}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-brand-500 text-white text-sm font-medium"
          >
            + Add
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Section titles on the homepage are clickable and open the full product list for that section.
        </p>
      </div>
    </div>
  );
}
