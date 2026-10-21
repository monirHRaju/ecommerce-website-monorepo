"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { User, ApiResponse } from "@/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

type RoleFilter = "" | "user" | "admin" | "super-admin";

function roleBadge(role: User["role"]) {
  switch (role) {
    case "super-admin":
      return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 ring-1 ring-purple-200 dark:ring-purple-500/30";
    case "admin":
      return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

function roleLabel(role: User["role"]) {
  if (role === "super-admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "User";
}

// ─── create admin modal ───────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "super-admin"]),
});
type CreateForm = z.infer<typeof createSchema>;

function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema) as unknown as import("react-hook-form").Resolver<CreateForm>,
    defaultValues: { name: "", email: "", password: "", role: "admin" },
  });

  async function onSubmit(values: CreateForm) {
    try {
      await api.post("/users", values);
      toast.success("Admin account created");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to create account";
      toast.error(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create Admin Account</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input {...register("name")} placeholder="John Doe" className="input-field" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input {...register("email")} type="email" placeholder="admin@example.com" className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              Password <span className="text-red-500">*</span>
            </label>
            <input {...register("password")} type="password" placeholder="Min. 6 characters" className="input-field" />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select {...register("role")} className="input-field">
              <option value="admin">Admin</option>
              <option value="super-admin">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  isPending,
}: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">
              Delete &quot;{user.name}&quot;?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              This action cannot be undone. The user&apos;s orders and reviews will remain.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100 dark:bg-gray-800" />
        </td>
      ))}
    </tr>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

const ROLE_TABS: Array<{ label: string; value: RoleFilter }> = [
  { label: "All", value: "" },
  { label: "Users", value: "user" },
  { label: "Admins", value: "admin" },
  { label: "Super Admins", value: "super-admin" },
];

export default function UsersPage() {
  const { admin: currentAdmin } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = currentAdmin?.role === "super-admin";

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [roleChanging, setRoleChanging] = useState<string | null>(null); // userId being changed

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (roleFilter) params.set("role", roleFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await api.get<{ data: User[]; meta: { total: number; totalPages: number } }>(
        `/users?${params}`
      );
      return res.data;
    },
  });

  const users = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: User["role"] }) =>
      api.patch("/users/role", { userId, role }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to update role";
      toast.error(msg);
    },
    onSettled: () => setRoleChanging(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to delete user";
      toast.error(msg);
    },
  });

  function handleRoleChange(user: User, newRole: User["role"]) {
    setRoleChanging(user._id);
    updateRoleMutation.mutate({ userId: user._id, role: newRole });
  }

  function canDelete(user: User) {
    if (user._id === currentAdmin?._id) return false; // can't delete yourself
    if (user.role === "super-admin") return false;
    if (user.role === "admin" && !isSuperAdmin) return false;
    return true;
  }

  function canChangeRole(user: User) {
    if (user._id === currentAdmin?._id) return false;
    if (user.role === "super-admin" && !isSuperAdmin) return false;
    return true;
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Users</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data?.meta?.total ?? 0} user{data?.meta?.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* search */}
          <div className="relative w-64">
            {/* {!search && (
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            )} */}
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`input-field transition-all ${search ? "pl-3" : "pl-10"}`}
            />
          </div>
          {/* add admin — super-admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Admin
            </button>
          )}
        </div>
      </div>

      {/* role tabs */}
      <div className="flex gap-1 flex-wrap">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setRoleFilter(tab.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === tab.value
                ? "bg-brand-500 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* user */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={user.avatar ?? `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user._id}`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user._id}`;
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white/90 truncate max-w-[160px]">
                              {user.name}
                              {user._id === currentAdmin?._id && (
                                <span className="ml-1.5 text-xs text-gray-400">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[160px]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* role */}
                      <td className="px-4 py-3">
                        {canChangeRole(user) ? (
                          <select
                            value={user.role}
                            disabled={roleChanging === user._id}
                            onChange={(e) => handleRoleChange(user, e.target.value as User["role"])}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-brand-500 outline-none ${roleBadge(user.role)} ${
                              roleChanging === user._id ? "opacity-50" : ""
                            }`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            {isSuperAdmin && <option value="super-admin">Super Admin</option>}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                            {roleLabel(user.role)}
                            {user.role === "super-admin" && (
                              <svg className="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 1l2.928 5.938L19 7.91l-4.5 4.385 1.062 6.19L10 15.25l-5.562 3.236 1.062-6.19L1 7.91l6.072-.972L10 1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                        )}
                      </td>

                      {/* verified */}
                      <td className="px-4 py-3 text-center">
                        {user.isVerified ? (
                          <svg className="w-4 h-4 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                        )}
                      </td>

                      {/* joined */}
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* actions */}
                      <td className="px-4 py-3 text-right">
                        {canDelete(user) ? (
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 dark:text-gray-700 select-none">—</span>
                        )}
                      </td>
                    </tr>
                  ))}

              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* modals */}
      {showCreate && <CreateAdminModal onClose={() => setShowCreate(false)} />}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
