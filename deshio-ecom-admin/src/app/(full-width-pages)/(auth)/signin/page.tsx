import AuthRedirect from "@/components/auth/AuthRedirect";
import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Deshio Admin",
  description: "Sign in to the Deshio admin dashboard.",
};

export default function SignIn() {
  return (
    <>
      <AuthRedirect />
      <SignInForm />
    </>
  );
}
