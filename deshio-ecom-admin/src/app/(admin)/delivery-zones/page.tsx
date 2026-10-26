"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { DeliveryZone, ApiResponse } from "@/types";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";

export default function DeliveryZonesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [charge, setCharge] = useState<number | "">(70);
  const [estimatedDays, setEstimatedDays] = useState("1-2 business days");
  const [isActive, setIsActive] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-delivery-zones"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DeliveryZone[]>>("/delivery-zones?all=true");
      return res.data.data ?? [];
    },
  });

  const zones = data ?? [];

  const resetForm = () => {
    setName("");
    setCharge(70);
    setEstimatedDays("1-2 business days");
    setIsActive(true);
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditId(zone._id);
    setName(zone.name);
    setCharge(zone.charge);
    setEstimatedDays(zone.estimatedDays || "1-2 business days");
    setIsActive(zone.isActive);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        charge: Number(charge) || 0,
        estimatedDays: estimatedDays.trim() || "2-3 business days",
        isActive,
      };
      if (editId) {
        return api.patch(`/delivery-zones/${editId}`, body);
      }
      return api.post("/delivery-zones", body);
    },
    onSuccess: () => {
      toast.success(editId ? "Delivery option updated" : "Delivery option created");
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => toast.error("Failed to save delivery option"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/delivery-zones/${id}`),
    onSuccess: () => {
      toast.success("Delivery option deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete delivery option"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/delivery-zones/${id}`, { isActive: active }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Delivery Options</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage delivery options, shipping fees, and estimated timeframes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add Delivery Option
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                {["Option Title", "Delivery Charge", "Estimated Time", "Status", "Actions"].map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap"
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <TableCell key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : zones.length === 0 ? (
                <TableRow>
                  <TableCell className="py-12 px-4 text-center text-sm text-gray-400" colSpan={5}>
                    No delivery options configured yet. Click &ldquo;Add Delivery Option&rdquo; to add one.
                  </TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => (
                  <TableRow key={zone._id}>
                    {/* Name */}
                    <TableCell className="py-3 px-4">
                      <span className="font-semibold text-sm text-gray-800 dark:text-white/90">
                        {zone.name}
                      </span>
                    </TableCell>

                    {/* Charge */}
                    <TableCell className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-sm text-brand-600 dark:text-brand-400">
                        ৳{zone.charge.toFixed(2)}
                      </span>
                    </TableCell>

                    {/* Estimated Days */}
                    <TableCell className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {zone.estimatedDays || "—"}
                    </TableCell>

                    {/* Status Toggle Badge */}
                    <TableCell className="py-3 px-4">
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({ id: zone._id, active: !zone.isActive })
                        }
                        className="cursor-pointer"
                        title="Click to toggle status"
                      >
                        <Badge size="sm" color={zone.isActive ? "success" : "error"}>
                          {zone.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(zone)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(zone._id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal: Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {editId ? "Edit Delivery Option" : "Add Delivery Option"}
            </h3>

            <div className="space-y-4">
              {/* Option Title */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Option Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Inside Dhaka"
                  className="input-field"
                />
              </div>

              {/* Charge */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Delivery Charge (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={charge}
                  onChange={(e) => setCharge(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 70"
                  min={0}
                  className="input-field"
                />
              </div>

              {/* Estimated Days */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estimated Delivery Time
                </label>
                <input
                  type="text"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  placeholder="e.g. 1-2 business days"
                  className="input-field"
                />
              </div>

              {/* Active Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active (visible at customer checkout)
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !name.trim() || charge === ""}
                  className="px-5 py-2.5 text-sm rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60 transition-colors font-medium shadow-sm"
                >
                  {saveMutation.isPending ? "Saving…" : editId ? "Save Changes" : "Create Option"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Delete Delivery Option?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to remove this delivery option? Customers will no longer see it at checkout.
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
