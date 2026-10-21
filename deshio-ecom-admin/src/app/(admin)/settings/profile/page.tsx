"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ImageUpload from "@/components/ui/ImageUpload";
import Badge from "@/components/ui/badge/Badge";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { admin, updateAdmin } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(admin?.avatar || "");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as unknown as Resolver<ProfileFormValues>,
    defaultValues: {
      name: admin?.name || "",
      phone: admin?.phone || "",
      address: admin?.address || "",
    },
  });

  // Reset form when admin data loads
  useEffect(() => {
    if (admin) {
      reset({
        name: admin.name,
        phone: admin.phone || "",
        address: admin.address || "",
      });
      setAvatarUrl(admin.avatar || "");
    }
  }, [admin, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setSaving(true);
    try {
      const res = await api.patch("/users/me", data);
      updateAdmin(res.data.data);
      toast.success("Profile updated");
      reset(data);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (url: string) => {
    setAvatarUrl(url);
    try {
      const res = await api.patch("/users/me", { avatar: url });
      updateAdmin(res.data.data);
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to update avatar");
    }
  };

  if (!admin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — Avatar & Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-32">
              <ImageUpload
                value={avatarUrl || undefined}
                onChange={handleAvatarChange}
                folder="deshio-admin/avatars"
                aspectRatio="square"
                label="Profile Picture"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {admin.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {admin.email}
              </p>
              <div className="mt-2">
                <Badge
                  size="sm"
                  color={admin.role === "super-admin" ? "warning" : "info"}
                >
                  {admin.role}
                </Badge>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Member since{" "}
                {new Date(admin.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Right — Edit Form */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-5">
            Personal Information
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input {...register("name")} className="input-field" />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={admin.email}
                disabled
                className="input-field opacity-60 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">
                Email cannot be changed
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="input-field"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
              <textarea
                {...register("address")}
                rows={3}
                placeholder="Your address"
                className="input-field resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
