"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Coupon, ApiResponse } from "@/types";
import Badge from "@/components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number>(0);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Coupon[]>>("/coupons");
      return res.data.data ?? [];
    },
  });

  const coupons = data ?? [];

  const resetForm = () => {
    setCode("");
    setDescription("");
    setType("percent");
    setValue(0);
    setMinOrderAmount(0);
    setMaxUses(0);
    setExpiresAt("");
    setIsActive(true);
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditId(c._id);
    setCode(c.code);
    setDescription(c.description || "");
    setType(c.type);
    setValue(c.value);
    setMinOrderAmount(c.minOrderAmount);
    setMaxUses(c.maxUses);
    setExpiresAt(c.expiresAt ? c.expiresAt.slice(0, 10) : "");
    setIsActive(c.isActive);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        description,
        type,
        value,
        minOrderAmount,
        maxUses,
        expiresAt: expiresAt || undefined,
        isActive,
      };
      if (editId) {
        return api.patch(`/coupons/${editId}`, body);
      }
      return api.post("/coupons", { ...body, code: code.toUpperCase().trim() });
    },
    onSuccess: () => {
      toast.success(editId ? "Coupon updated" : "Coupon created");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to save coupon"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      toast.success("Coupon deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const toggleActive = useMutation({
    mutationFn: (c: Coupon) =>
      api.patch(`/coupons/${c._id}`, { isActive: !c.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const formatExpiry = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Coupons
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage discount coupons
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["Code", "Type", "Value", "Min Order", "Usage", "Status", "Expires", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : coupons.map((c) => (
                    <tr key={c._id}>
                      <td className="py-3 px-4">
                        <span className="inline-block rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-sm font-mono font-bold text-gray-800 dark:text-white/90">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {c.type}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {c.type === "percent" ? `${c.value}%` : `Tk. ${c.value}`}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {c.minOrderAmount > 0 ? `Tk. ${c.minOrderAmount}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {c.usedCount}
                        {c.maxUses > 0 ? ` / ${c.maxUses}` : " / ∞"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActive.mutate(c)}
                          className="cursor-pointer"
                        >
                          <Badge
                            size="sm"
                            color={
                              !c.isActive
                                ? "error"
                                : isExpired(c.expiresAt)
                                ? "warning"
                                : "success"
                            }
                          >
                            {!c.isActive
                              ? "Inactive"
                              : isExpired(c.expiresAt)
                              ? "Expired"
                              : "Active"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatExpiry(c.expiresAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(c._id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading && coupons.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">No coupons yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editId ? "Edit Coupon" : "Add Coupon"}
              </h3>

              {/* Code */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE20"
                  className="input-field uppercase"
                  disabled={!!editId}
                  maxLength={20}
                />
                {editId && (
                  <p className="mt-1 text-xs text-gray-400">Code cannot be changed after creation</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. 20% off on all orders above Tk. 500"
                  className="input-field resize-none"
                />
              </div>

              {/* Type + Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "percent" | "fixed")}
                    className="input-field"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Tk.)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    placeholder={type === "percent" ? "e.g. 20" : "e.g. 100"}
                    className="input-field"
                    min={0}
                    max={type === "percent" ? 100 : undefined}
                  />
                </div>
              </div>

              {/* Min Order + Max Uses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Min Order Amount
                  </label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    placeholder="0 = no minimum"
                    className="input-field"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    placeholder="0 = unlimited"
                    className="input-field"
                    min={0}
                  />
                  <p className="mt-1 text-xs text-gray-400">0 = unlimited uses</p>
                </div>
              </div>

              {/* Expires At + Active */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-gray-400">Leave empty for no expiry</p>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || (!editId && !code.trim()) || value <= 0}
                  className="px-4 py-2.5 text-sm rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
                >
                  {saveMutation.isPending ? "Saving…" : editId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Delete Coupon?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This will permanently remove this coupon code.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
