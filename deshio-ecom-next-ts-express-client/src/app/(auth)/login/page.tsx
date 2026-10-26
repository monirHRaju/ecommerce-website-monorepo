"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, LogIn, User, ShieldCheck } from "lucide-react";
import { toast } from "@/context/ToastContext";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

const DEMO = [
  { label: "Admin Demo", icon: ShieldCheck, email: "admin@example.com", password: "123456", color: "btn-secondary" },
  { label: "User Demo", icon: User, email: "user@example.com", password: "123456", color: "btn-primary" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    try {
      const { data } = await api.post("/auth/login", values);
      login(data.data.accessToken, data.data.refreshToken, data.data.user);
      toast.success(`Welcome back, ${data.data.user.name}!`);
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
  };

  return (
    <div className="w-full max-w-md">
      <div className="card bg-base-100 shadow-2xl border border-base-200">
        <div className="card-body p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <LogIn className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-base-content">Welcome back</h1>
            <p className="text-sm text-base-content/50 mt-1">Sign in to your account</p>
          </div>

          {/* Demo buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {DEMO.map(({ label, icon: Icon, email, password, color }) => (
              <button key={label} type="button" onClick={() => fillDemo(email, password)}
                className={`btn btn-sm gap-2 ${color}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          <div className="divider text-xs text-base-content/40 my-1">or continue with email</div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Email</span>
              </label>
              <input {...register("email")} type="email" placeholder="you@example.com"
                className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                autoComplete="email" />
              {errors.email && (
                <label className="label py-1">
                  <span className="label-text-alt text-error">{errors.email.message}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Password</span>
                <Link href="/forgot-password" className="label-text-alt text-primary hover:underline">
                  Forgot password?
                </Link>
              </label>
              <div className="relative">
                <input {...register("password")} type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${errors.password ? "input-error" : ""}`}
                  autoComplete="current-password" />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                  onClick={() => setShowPassword((p) => !p)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <label className="label py-1">
                  <span className="label-text-alt text-error">{errors.password.message}</span>
                </label>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full mt-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/50 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
