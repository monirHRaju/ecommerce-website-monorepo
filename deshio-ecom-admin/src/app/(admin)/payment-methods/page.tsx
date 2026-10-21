"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { PaymentMethod, ApiResponse } from "@/types";
import ImageUpload from "@/components/ui/ImageUpload";
import Badge from "@/components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";

const METHOD_TYPES = [
  { value: "bkash_send", label: "bKash (Send Money)" },
  { value: "bkash_merchant", label: "bKash (Merchant Payment)" },
  { value: "rocket_send", label: "Rocket (Send Money)" },
  { value: "nagad_send", label: "Nagad (Send Money)" },
];

function typeLabel(type: string) {
  return METHOD_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("bkash_send");
  const [instructions, setInstructions] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaymentMethod[]>>("/payment-methods/all");
      return res.data.data ?? [];
    },
  });

  const methods = data ?? [];

  const resetForm = () => {
    setName("");
    setType("bkash_send");
    setInstructions("");
    setPhoneNumber("");
    setQrImage("");
    setIsActive(true);
    setSortOrder(0);
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setEditId(m._id);
    setName(m.name);
    setType(m.type);
    setInstructions(m.instructions);
    setPhoneNumber(m.phoneNumber || "");
    setQrImage(m.qrImage || "");
    setIsActive(m.isActive);
    setSortOrder(m.sortOrder);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { name, type, instructions, phoneNumber, qrImage, isActive, sortOrder };
      if (editId) {
        return api.patch(`/payment-methods/${editId}`, body);
      }
      return api.post("/payment-methods", body);
    },
    onSuccess: () => {
      toast.success(editId ? "Payment method updated" : "Payment method created");
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => toast.error("Failed to save payment method"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/payment-methods/${id}`),
    onSuccess: () => {
      toast.success("Payment method deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const toggleActive = useMutation({
    mutationFn: (m: PaymentMethod) =>
      api.patch(`/payment-methods/${m._id}`, { isActive: !m.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Payment Methods
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage mobile banking payment options
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Method
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["Name", "Type", "Phone", "QR", "Active", "Order", "Actions"].map((h) => (
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
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : methods.map((m) => (
                    <tr key={m._id}>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {m.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {typeLabel(m.type)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {m.phoneNumber || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {m.qrImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.qrImage}
                            alt="QR"
                            className="w-10 h-10 rounded object-contain border border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActive.mutate(m)}
                          className="cursor-pointer"
                        >
                          <Badge size="sm" color={m.isActive ? "success" : "error"}>
                            {m.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {m.sortOrder}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(m)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(m._id)}
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

          {!isLoading && methods.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">No payment methods yet.</p>
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
                {editId ? "Edit Payment Method" : "Add Payment Method"}
              </h3>

              {/* Name */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. bKash (Send Money)"
                  className="input-field"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input-field"
                >
                  {METHOD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 01917383378"
                  className="input-field"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Instructions <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={5}
                  placeholder={"1. Open bKash App\n2. Send Money to the number above\n3. Enter the exact amount\n4. Copy the TrxID from confirmation message"}
                  className="input-field resize-none"
                />
              </div>

              {/* QR Image */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  QR Code Image
                </label>
                <ImageUpload
                  value={qrImage || undefined}
                  onChange={(url) => setQrImage(url)}
                  folder="deshio-admin/payment-qr"
                  aspectRatio="square"
                  label="QR Code"
                />
              </div>

              {/* Active + Sort */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="input-field"
                    min={0}
                  />
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
                  disabled={saveMutation.isPending || !name.trim() || !instructions.trim()}
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
              Delete Payment Method?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This will permanently remove this payment method.
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
