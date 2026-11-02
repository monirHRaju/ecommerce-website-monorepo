"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  Truck,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { toast } from "@/context/ToastContext";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Enter your mobile number or email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

interface Props {
  brandName: string;
  brandLogo?: string;
  tagline?: string;
}

const PERKS = [
  { icon: Truck, text: "Fast nationwide delivery" },
  { icon: ShieldCheck, text: "Secure checkout, COD available" },
  { icon: RefreshCw, text: "Easy size exchange & returns" },
];

function LoginFormContent({ brandName, brandLogo, tagline }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { data } = await api.post("/auth/login", {
        identifier: values.identifier,
        email: values.identifier,
        password: values.password,
      });
      login(data.data.accessToken, data.data.refreshToken, data.data.user);
      toast.success(`Welcome back, ${data.data.user.name}!`);
      router.push(redirectPath);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    }
  };

  const inputBase =
    "w-full h-12 rounded-xl border bg-stone-50/60 pl-11 pr-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:bg-white focus:ring-4";
  const inputOk =
    "border-stone-200 focus:border-stone-900 focus:ring-stone-900/10";
  const inputErr = "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10";

  return (
    <div className="relative w-full max-w-4xl">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-stone-300/50 blur-3xl" />

      <div className="relative grid overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-2xl shadow-stone-900/10 md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/5" />
          <div className="relative">
            {brandLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={brandLogo}
                alt={brandName}
                className="mb-6 h-12 w-auto max-w-[180px] object-contain brightness-0 invert"
              />
            ) : (
              <p className="mb-6 font-serif text-3xl font-bold tracking-tight">
                {brandName}
              </p>
            )}
            <h2 className="text-2xl font-semibold leading-snug">
              Welcome back to {brandName}
            </h2>
            {tagline && (
              <p className="mt-2 text-sm text-white/70">{tagline}</p>
            )}
          </div>
          <ul className="relative space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="p-7 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Use your mobile number or email to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600"
              >
                Mobile number or email
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="identifier"
                  {...register("identifier")}
                  type="text"
                  placeholder="017XXXXXXXX or you@example.com"
                  autoComplete="username"
                  className={`${inputBase} ${errors.identifier ? inputErr : inputOk}`}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1.5 text-xs text-rose-600">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-stone-600"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-amber-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="password"
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`${inputBase} pr-12 ${errors.password ? inputErr : inputOk}`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-400 transition-colors hover:text-stone-800"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 text-sm font-semibold text-white shadow-lg shadow-stone-900/20 transition-all hover:bg-stone-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-500">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-stone-900 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="h-96 w-full max-w-4xl animate-pulse rounded-3xl bg-stone-100" />
      }
    >
      <LoginFormContent {...props} />
    </Suspense>
  );
}
