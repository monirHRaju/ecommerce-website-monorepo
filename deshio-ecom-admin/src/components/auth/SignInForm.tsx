"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import BrandLogo from "@/components/common/BrandLogo";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import toast from "react-hot-toast";
import { Resolver } from "react-hook-form";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function SignInForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
  });

  async function onSubmit(data: FormValues) {
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      router.replace("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Login failed. Check your credentials.";
      toast.error(message);
    }
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <BrandLogo imgClassName="h-12 w-auto max-w-[200px] object-contain" textClassName="text-2xl font-bold text-gray-900 dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-1">
            Sign in to your account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your admin credentials to access the dashboard.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label>
              Email <span className="text-error-500">*</span>
            </Label>
            <Input
              {...register("email")}
              type="email"
              placeholder="admin@yourstore.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label>
              Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-error-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            className="w-full justify-center"
            size="md"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Footer note */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            This panel is restricted to administrators only.
          </p>
          {process.env.NEXT_PUBLIC_HOMEPAGE_URL && (
            <a
              href={process.env.NEXT_PUBLIC_HOMEPAGE_URL}
              className="inline-flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Homepage
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
