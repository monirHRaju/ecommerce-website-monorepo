"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function GenerateTagsPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [material, setMaterial] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim() || !category.trim()) {
      toast.error("Title and category are required");
      return;
    }

    setLoading(true);
    setTags([]);
    try {
      const res = await api.post("/ai/generate-tags", {
        title: title.trim(),
        category: category.trim(),
        gender: gender || undefined,
        material: material.trim() || undefined,
      });
      setTags(res.data.data.tags);
      toast.success("Fashion tags generated!");
    } catch {
      toast.error("Failed to generate tags");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(tags.join(", "));
    toast.success("Copied to clipboard");
  };

  const copySingle = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success(`Copied "${tag}"`);
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          AI Fashion Tag Generator
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate high-intent SEO keywords, style tags, and trend descriptors
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Product Details
          </h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Handloom Silk Jamdani Saree"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Traditional & Ethnic Wear"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input-field"
              >
                <option value="">Select Gender</option>
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Material / Fabric
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Mulberry Silk"
                className="input-field"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Extracting Fashion Tags…
              </span>
            ) : (
              "Generate Tags"
            )}
          </button>
        </div>

        {/* Output */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Suggested Tags {tags.length > 0 && `(${tags.length})`}
            </h2>
            {tags.length > 0 && (
              <button
                onClick={copyAll}
                className="text-xs font-medium text-brand-500 hover:text-brand-600"
              >
                Copy All (CSV)
              </button>
            )}
          </div>

          {tags.length > 0 ? (
            <div className="flex-1 flex flex-wrap gap-2 content-start">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                >
                  <span
                    onClick={() => copySingle(tag)}
                    className="cursor-pointer hover:underline"
                    title="Click to copy"
                  >
                    #{tag}
                  </span>
                  <button
                    onClick={() => removeTag(i)}
                    className="text-brand-400 hover:text-brand-600 dark:hover:text-brand-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="flex-1 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm text-gray-400 p-8 text-center min-h-[250px]">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p>AI is generating fashion search keywords…</p>
                </div>
              ) : (
                <p>Fill in product details and click generate to view fashion tags here</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
