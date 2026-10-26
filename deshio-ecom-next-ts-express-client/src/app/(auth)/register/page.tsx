"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

import { toast } from "@/context/ToastContext";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterForm) => {
    try {
      const { data } = await api.post("/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });
      login(data.data.accessToken, data.data.refreshToken, data.data.user);
      toast.success("Account created successfully! Welcome 🎉");
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="card bg-base-100 shadow-2xl border border-base-200">
        <div className="card-body p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-base-content">
              Create account
            </h1>
            <p className="text-sm text-base-content/50 mt-1">
              Create your account and start shopping
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {/* Name */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="John Doe"
                className={`input input-bordered w-full ${
                  errors.name ? "input-error" : "focus:input-primary"
                }`}
                autoComplete="name"
              />
              {errors.name && (
                <label className="label py-1">
                  <span className="label-text-alt text-error">
                    {errors.name.message}
                  </span>
                </label>
              )}
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className={`input input-bordered w-full ${
                  errors.email ? "input-error" : "focus:input-primary"
                }`}
                autoComplete="email"
              />
              {errors.email && (
                <label className="label py-1">
                  <span className="label-text-alt text-error">
                    {errors.email.message}
                  </span>
                </label>
              )}
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${
                    errors.password ? "input-error" : "focus:input-primary"
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <label className="label py-1">
                  <span className="label-text-alt text-error">
                    {errors.password.message}
                  </span>
                </label>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${
                    errors.confirmPassword ? "input-error" : "focus:input-primary"
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                  onClick={() => setShowConfirm((p) => !p)}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <label className="label py-1">
                  <span className="label-text-alt text-error">
                    {errors.confirmPassword.message}
                  </span>
                </label>
              )}
            </div>

            {/* Terms note */}
            <p className="text-xs text-base-content/40 leading-relaxed">
              By creating an account you agree to our{" "}
              <Link href="#" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-base-content/50 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
