"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function GenerateDescriptionPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [gender, setGender] = useState("");
  const [material, setMaterial] = useState("");
  const [specs, setSpecs] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim() || !category.trim()) {
      toast.error("Title and category are required");
      return;
    }

    setLoading(true);
    setResult("");
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        category: category.trim(),
      };
      if (brand.trim()) body.brand = brand.trim();
      if (gender) body.gender = gender;
      if (material.trim()) body.material = material.trim();
      if (specs.trim()) {
        body.specs = specs
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const res = await api.post("/ai/generate-description", body);
      setResult(res.data.data.description);
      toast.success("Description generated!");
    } catch {
      toast.error("Failed to generate description");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          AI Fashion Description Generator
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate SEO-friendly, editorial fashion product descriptions using AI
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
              placeholder="e.g. Slim Fit Cotton Oxford Shirt"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Men's Shirts"
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Deshio Heritage"
                className="input-field"
              />
            </div>
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
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fabric / Material
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 100% Egyptian Cotton"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Features / Highlights (one per line)
            </label>
            <textarea
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder={"Breathable natural weave\nButton-down collar\nMother-of-pearl buttons\nMachine wash cold"}
              rows={4}
              className="input-field resize-none"
            />
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
                Crafting Description…
              </span>
            ) : (
              "Generate Fashion Description"
            )}
          </button>
        </div>

        {/* Output */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Generated Description
            </h2>
            {result && (
              <button
                onClick={copyToClipboard}
                className="text-xs font-medium text-brand-500 hover:text-brand-600"
              >
                Copy to Clipboard
              </button>
            )}
          </div>

          {result ? (
            <div className="flex-1 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap dark:bg-gray-800 dark:text-gray-300">
              {result}
            </div>
          ) : (
            <div className="flex-1 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm text-gray-400 p-8 text-center min-h-[250px]">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p>AI is writing an editorial description…</p>
                </div>
              ) : (
                <p>Fill in fashion product details and click generate to view editorial copy here</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
